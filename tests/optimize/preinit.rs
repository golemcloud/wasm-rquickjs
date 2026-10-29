use super::*;

#[tokio::test]
async fn optimizer_denies_external_io_for_all_initializers() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let output = temp.path().join("output.wasm");
    // Exercise real resource ownership/aliasing as well as trap functions. These
    // intentionally small component interfaces use the imported signatures;
    // denial must not depend on a particular generated guest or marker.
    for (imports, lowering, call, expected) in [
        (
            r#"(import "wasi:sockets/tcp@0.2.0" (instance $types (export "tcp-socket" (type (sub resource)))))
                (alias export $types "tcp-socket" (type $socket))
                (import "wasi:sockets/tcp-create-socket@0.2.0" (instance $io
                    (alias outer 1 $socket (type $socket))
                    (export "tcp-socket" (type (eq $socket)))
                    (export "create-tcp-socket" (func (param "family" u32) (result (result (own $socket) (error u32)))))))"#,
            r#"(alias export $io "create-tcp-socket" (func $io)) (core func $io (canon lower (func $io) (memory $memory)))"#,
            "i32.const 0 i32.const 0 call $io",
            "wasi:sockets/tcp-create-socket@0.2.0#create-tcp-socket",
        ),
        (
            r#"(import "wasi:sockets/udp@0.2.0" (instance $types (export "udp-socket" (type (sub resource)))))
                (alias export $types "udp-socket" (type $socket))
                (import "wasi:sockets/udp-create-socket@0.2.0" (instance $io
                    (alias outer 1 $socket (type $socket))
                    (export "udp-socket" (type (eq $socket)))
                    (export "create-udp-socket" (func (param "family" u32) (result (result (own $socket) (error u32)))))))"#,
            r#"(alias export $io "create-udp-socket" (func $io)) (core func $io (canon lower (func $io) (memory $memory)))"#,
            "i32.const 0 i32.const 0 call $io",
            "wasi:sockets/udp-create-socket@0.2.0#create-udp-socket",
        ),
        (
            r#"(import "wasi:http/outgoing-handler@0.2.0" (instance $io (export "handle" (func))))"#,
            r#"(alias export $io "handle" (func $io)) (core func $io (canon lower (func $io)))"#,
            "call $io",
            "wasi:http/outgoing-handler@0.2.0#handle",
        ),
        (
            r#"(import "wasi:http/client@0.3.0" (instance $io (export "send" (func async))))"#,
            r#"(alias export $io "send" (func $io)) (core func $io (canon lower (func $io)))"#,
            "call $io",
            "wasi:http/client@0.3.0#send",
        ),
        (
            r#"(import "wasi:sockets/ip-name-lookup@0.3.0" (instance $io (export "resolve-addresses" (func async))))"#,
            r#"(alias export $io "resolve-addresses" (func $io)) (core func $io (canon lower (func $io)))"#,
            "call $io",
            "wasi:sockets/ip-name-lookup@0.3.0#resolve-addresses",
        ),
        (
            r#"(import "wasi:filesystem/types@0.3.0" (instance $types
                    (export "descriptor" (type (sub resource)))))
                (alias export $types "descriptor" (type $descriptor))
                (import "wasi:filesystem/preopens@0.3.0" (instance $io
                    (alias outer 1 $descriptor (type $descriptor))
                    (export "descriptor" (type (eq $descriptor)))
                    (export "get-directories" (func (result (list (tuple (own $descriptor) string)))))))"#,
            r#"(alias export $io "get-directories" (func $io))
                (core func $io (canon lower (func $io) (memory $memory) (realloc (func $realloc))))"#,
            "i32.const 0 call $io",
            "wasi:filesystem/preopens@0.3.0#get-directories",
        ),
        (
            r#"(import "wasi:filesystem/types@0.2.0" (instance $types
                    (export "descriptor" (type (sub resource)))))
                (alias export $types "descriptor" (type $descriptor))
                (import "wasi:filesystem/preopens@0.2.0" (instance $io
                    (alias outer 1 $descriptor (type $descriptor))
                    (export "descriptor" (type (eq $descriptor)))
                    (export "get-directories" (func (result (list (tuple (own $descriptor) string)))))))"#,
            r#"(alias export $io "get-directories" (func $io))
                (core func $io (canon lower (func $io) (memory $memory) (realloc (func $realloc))))"#,
            "i32.const 0 call $io",
            "wasi:filesystem/preopens@0.2.0#get-directories",
        ),
        (
            r#"(import "wasi:sockets/network@0.2.0" (instance $types
                    (export "network" (type (sub resource)))))
                (alias export $types "network" (type $network))
                (import "wasi:sockets/instance-network@0.2.0" (instance $io
                    (alias outer 1 $network (type $network))
                    (export "network" (type (eq $network)))
                    (export "instance-network" (func (result (own $network))))))"#,
            r#"(alias export $io "instance-network" (func $io))
                (core func $io (canon lower (func $io)))"#,
            "call $io drop",
            "wasi:sockets/instance-network@0.2.0#instance-network",
        ),
        (
            r#"(import "wasi:sockets/types@0.3.0" (instance $io
                    (export "tcp-socket" (type $tcp (sub resource)))
                    (export "udp-socket" (type $udp (sub resource)))
                    (export "[static]tcp-socket.create" (func (param "family" u32) (result (result (own $tcp) (error u32)))))
                    (export "[static]udp-socket.create" (func (param "family" u32) (result (result (own $udp) (error u32)))))))"#,
            r#"(alias export $io "[static]tcp-socket.create" (func $io))
                (core func $io (canon lower (func $io) (memory $memory)))"#,
            "i32.const 0 i32.const 0 call $io",
            "wasi:sockets/types@0.3.0#[static]tcp-socket.create",
        ),
        (
            r#"(import "wasi:sockets/types@0.3.0" (instance $io
                    (export "tcp-socket" (type $tcp (sub resource)))
                    (export "udp-socket" (type $udp (sub resource)))
                    (export "[static]udp-socket.create" (func (param "family" u32) (result (result (own $udp) (error u32)))))))"#,
            r#"(alias export $io "[static]udp-socket.create" (func $io))
                (core func $io (canon lower (func $io) (memory $memory)))"#,
            "i32.const 0 i32.const 0 call $io",
            "wasi:sockets/types@0.3.0#[static]udp-socket.create",
        ),
    ] {
        let core_signature = if call == "call $io" {
            ""
        } else if call == "call $io drop" {
            "(result i32)"
        } else if call.starts_with("i32.const 0 i32.const 0") {
            "(param i32 i32)"
        } else {
            "(param i32)"
        };
        for (marker, initializer) in [
            (false, "wizer-initialize"),
            (true, "wizer-initialize"),
            (true, "custom-init"),
        ] {
            let marker = if marker {
                r#"(func (export "wasm-rquickjs-wizer-restore-v1") (canon lift (core func $i "marker")))"#
            } else {
                ""
            };
            let async_export = if call == "call $io" { "async" } else { "" };
            std::fs::write(
                &input,
                wat::parse_str(format!(
                    r#"(component
                {imports}
                (core module $mem (memory (export "memory") 1)
                    (func (export "realloc") (param i32 i32 i32 i32) (result i32) unreachable))
                (core instance $mem (instantiate $mem))
                (alias core export $mem "memory" (core memory $memory))
                (alias core export $mem "realloc" (core func $realloc))
                {lowering}
                (core instance $host (export "io" (func $io)))
                (core module $m
                    (import "host" "io" (func $io {core_signature}))
                    (func (export "init") {call})
                    (func (export "marker")))
                (core instance $i (instantiate $m (with "host" (instance $host))))
                (func (export "wizer-initialize") {async_export} (canon lift (core func $i "init")))
                (func (export "custom-init") {async_export} (canon lift (core func $i "init")))
                {marker})"#
                ))?,
            )?;
            let failure = optimize_component(&input, &output, initializer)
                .await
                .unwrap_err();
            let failure = format!("{failure:#}");
            assert!(
                failure.contains("WRQJS_PREINITIALIZATION_IO"),
                "{expected}: {failure}"
            );
            assert!(failure.contains(expected), "{expected}: {failure}");
            assert!(!output.exists());
        }
    }
    Ok(())
}

fn optimize_guest_failure(input: &Utf8Path, output: &Utf8Path) -> anyhow::Result<String> {
    use std::process::{Command, Stdio};
    let stderr_path = input.with_extension("stderr");
    let mut child = Command::new(env!("CARGO_BIN_EXE_wasm-rquickjs"))
        .args(["optimize", "--input"])
        .arg(input)
        .arg("--output")
        .arg(output)
        .stdout(Stdio::null())
        .stderr(std::fs::File::create(&stderr_path)?)
        .spawn()?;
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(60);
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break status;
        }
        if std::time::Instant::now() >= deadline {
            child.kill()?;
            child.wait()?;
            anyhow::bail!(
                "optimizer did not reject pre-initialization I/O within 60 seconds: {}",
                std::fs::read_to_string(&stderr_path)?
            );
        }
        std::thread::sleep(std::time::Duration::from_millis(20));
    };
    let stderr = std::fs::read_to_string(&stderr_path)?;
    assert!(!status.success(), "unsafe guest was snapshotted: {stderr}");
    Ok(stderr)
}

#[test]
fn optimizer_rejects_guest_io() -> anyhow::Result<()> {
    check_guest_denials(&[
        ("import fs from 'node:fs'; fs.existsSync('/');", "fs.exists"),
        (
            "import fs from 'node:fs'; try { fs.statSync('/'); } catch {} await new Promise(() => {});",
            "fs.stat",
        ),
        (
            "import fs from 'node:fs/promises'; await fs.readFile('/x').catch(() => {});",
            "fs.open",
        ),
        (
            "import fs from 'node:fs'; fs.writeFileSync('/x', 'x');",
            "fs.open",
        ),
        (
            "import fs from 'node:fs'; fs.openSync('/x', 'r');",
            "fs.open",
        ),
        (
            "import {runInNewContext} from 'node:vm'; import fs from 'node:fs'; runInNewContext('fs.existsSync(\"/\")', {fs});",
            "fs.exists",
        ),
        (
            "import fs from 'node:fs'; fs.statSync('/missing', {throwIfNoEntry:false});",
            "fs.stat",
        ),
        (
            "import fs from 'node:fs'; fs.exists('/', () => {});",
            "fs.exists",
        ),
        (
            "import fs from 'node:fs'; fs.mkdirSync('/new-dir');",
            "fs.mkdir",
        ),
        (
            "import fs from 'node:fs'; fs.appendFileSync('/new-file', 'x');",
            "fs.open",
        ),
        (
            "import fs from 'node:fs'; fs.unlinkSync('/old-file');",
            "fs.unlink",
        ),
        (
            "import fs from 'node:fs'; setImmediate(() => fs.existsSync('/'));",
            "fs.exists",
        ),
        (
            "new WebSocket('ws://example.invalid/');",
            "WebSocket connection",
        ),
        ("process.chdir('/');", "process.chdir"),
        ("await import('/runtime-only.mjs');", "module path probe"),
        (
            "import {DatabaseSync} from 'node:sqlite'; new DatabaseSync(':memory:');",
            "SQLite database open",
        ),
        (
            "import dns from 'node:dns/promises'; dns.lookup('example.invalid').catch(() => {});",
            "DNS resolution",
        ),
        (
            "import net from 'node:net'; net.connect(80, '127.0.0.1');",
            "TCP socket creation",
        ),
        (
            "import dgram from 'node:dgram'; dgram.createSocket('udp4');",
            "UDP socket creation",
        ),
        (
            "fetch('http://example.invalid/').catch(() => {});",
            "HTTP request",
        ),
        (
            "import http from 'node:http'; http.get('http://example.invalid/');",
            "HTTP request",
        ),
    ])
}

#[test]
fn optimizer_rejects_execution_jobs_during_preinit() -> anyhow::Result<()> {
    check_guest_denials(&[
        (
            "import {runJavaScript} from 'wasm-rquickjs:execution'; try { runJavaScript({source:'return 1 + 1;'}); } catch {} await new Promise(() => {});",
            "execution job creation",
        ),
        (
            "import {startJavaScript} from 'wasm-rquickjs:execution'; try { startJavaScript({cwd:'/', source:'return 1;'}); } catch {} await new Promise(() => {});",
            "execution job creation",
        ),
    ])
}

#[test]
fn optimizer_retains_stderr_tail_after_overflow() -> anyhow::Result<()> {
    check_guest_denials(&[(
        "import fs from 'node:fs'; process.stderr.write('x'.repeat(70 * 1024)); fs.existsSync('/overflow-tail');",
        "fs.exists",
    )])
}

#[test]
fn optimizer_rejects_additional_guest_io() -> anyhow::Result<()> {
    check_guest_denials(&[
        (
            "import fs from 'node:fs'; fs.readdirSync('/');",
            "fs.readdir",
        ),
        ("import fs from 'node:fs'; fs.accessSync('/');", "fs.access"),
        (
            "import fs from 'node:fs'; fs.realpathSync('/');",
            "fs.lstat",
        ),
        (
            "import fs from 'node:fs'; fs.realpathSync.native('/');",
            "fs.realpath",
        ),
        (
            "import {createRequire} from 'node:module'; createRequire('/app/main.cjs')('./optional.cjs');",
            "module path probe",
        ),
        (
            "import {findPackageJSON} from 'node:module'; findPackageJSON('./package.json', 'file:///app/main.mjs');",
            "package.json",
        ),
        (
            "import net from 'node:net'; net.createServer().listen(0);",
            "TCP listener creation",
        ),
        (
            "import http from 'node:http'; http.createServer().listen(0);",
            "TCP listener creation",
        ),
        (
            r#"import {register} from 'node:module';
                register('data:text/javascript,' + encodeURIComponent(`
                    export function resolve(s,c,n) {
                        if (s === 'chain:root') return {shortCircuit:true,url:'file:///chain/root.cjs',format:'commonjs'};
                        if (s === './child.cjs') return {shortCircuit:true,url:'file:///chain/child.cjs',format:'commonjs'};
                        return n(s,c);
                    }
                    export function load(u,c,n) {
                        if (u === 'file:///chain/root.cjs') return {shortCircuit:true,format:'commonjs',source:'module.exports = require("./child.cjs");'};
                        if (u === 'file:///chain/child.cjs') return {shortCircuit:true,format:'commonjs',source:'exports.answer=1;'};
                        return n(u,c);
                    }
                `)); await import('chain:root');"#,
            "module path probe",
        ),
    ])
}

fn check_guest_denials(cases: &[(&str, &str)]) -> anyhow::Result<()> {
    use wasm_rquickjs::GenerationTarget;
    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,full,websocket"),
        (GenerationTarget::WasiP3, "full-p3,websocket"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let input = root.join("input.wasm");
        let output = root.join("optimized.wasm");
        // Every negative is attempted through the public JS API. The first
        // failure must survive catch, promises, VM realms and an unresolved TLA.
        for &(source, expected) in cases {
            eprintln!("preinit denial {tier}: {expected}");
            let source = format!(
                "{source}\nexport function ready() {{ return 'ready'; }} export function run() {{ return 'run'; }}"
            );
            wasm_rquickjs::inject_js_into_component(&template, &input, &[&source])?;
            let failure = optimize_guest_failure(&input, &output)?;
            assert!(
                failure.contains("WRQJS_PREINITIALIZATION_IO"),
                "{tier} {expected}: {failure}"
            );
            assert!(failure.contains(expected), "{tier} {expected}: {failure}");
            assert!(
                failure.contains("Guest stderr (last 65536 bytes)"),
                "{tier} {expected}: diagnostic not retained in returned error: {failure}"
            );
            assert!(failure.contains("lazy initialization"), "{failure}");
            assert!(!output.exists());
        }
        wasm_rquickjs::inject_js_into_component(
            &template,
            &input,
            &[
                "import fs from 'node:fs'; fs.existsSync('/diagnostic-path'); export function run() { return ''; } export function ready() { return ''; }",
            ],
        )?;
        let failure = runtime
            .block_on(optimize_component(&input, &output, "wizer-initialize"))
            .unwrap_err();
        let failure = format!("{failure:#}");
        assert!(failure.contains("WRQJS_PREINITIALIZATION_IO"), "{failure}");
        assert!(failure.contains("fs.exists"), "{failure}");
        assert!(failure.contains("/diagnostic-path"), "{failure}");
    }
    Ok(())
}

#[test]
fn optimizer_preserves_console_stdio_after_preinit() -> anyhow::Result<()> {
    use wasm_rquickjs::GenerationTarget;
    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,full"),
        (GenerationTarget::WasiP3, "full-p3"),
        (GenerationTarget::WasiP2, "p2,full-no-logging"),
        (GenerationTarget::WasiP3, "full-no-logging-p3"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let input = root.join("input.wasm");
        let output = root.join("optimized.wasm");
        let source = r#"
            // Exercise the console fallback with no configured output streams,
            // as well as the usual process streams. Default console streams
            // already delegate to process.stdout/stderr.
            console._stdout = null;
            console._stderr = null;
            const unicode = 'a'.repeat(4095) + '🙂' + 'é'.repeat(1025);
            function write(phase) {
                console.log(phase + '-console-log');
                console.dir(phase + '-console-dir');
                console.warn(phase + '-console-warn');
                console.error(phase + '-console-error');
                // The four-byte character starts at byte 4095, forcing the
                // preinit writer to back off the 4096-byte chunk boundary.
                process.stdout.write(unicode + '\n');
                process.stderr.write(phase + '-stderr\n');
            }
            write('preinit');
            export function ready() { return 'ready'; }
            export function run() { write('runtime'); return 'ok'; }
        "#;
        wasm_rquickjs::inject_js_into_component(&template, &input, &[source])?;
        runtime.block_on(optimize_component(&input, &output, "wizer-initialize"))?;
        for component in [&output, &input] {
            let captured = runtime
                .block_on(run_probe_inner(component, false, None, None))?
                .unwrap();
            assert_eq!(captured.json, "ok");
            assert!(captured.stdout.contains("runtime-console-log"), "{tier}");
            assert!(captured.stdout.contains("runtime-console-dir"), "{tier}");
            assert!(captured.stderr.contains("runtime-stderr"), "{tier}");
            if tier.contains("no-logging") {
                assert!(
                    captured.stdout.contains("WARN: runtime-console-warn"),
                    "{tier}"
                );
                assert!(
                    captured.stdout.contains("ERROR: runtime-console-error"),
                    "{tier}"
                );
            }
            let unicode = format!("{}🙂{}\n", "a".repeat(4095), "é".repeat(1025));
            assert!(
                captured.stdout.contains(&unicode),
                "{tier}: UTF-8 output changed"
            );
        }
    }
    Ok(())
}

#[test]
fn optimizer_preserves_pure_sources_and_runtime_filesystem() -> anyhow::Result<()> {
    use wasm_rquickjs::GenerationTarget;
    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,full,websocket"),
        (GenerationTarget::WasiP3, "full-p3,websocket"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let input = root.join("input.wasm");
        let output = root.join("optimized.wasm");
        // A successful snapshot may import I/O builtins and defer their use.
        // Restore twice with different fresh mounts and cwd; compare unoptimized
        // initialization against the same externally visible contract.
        let source = r#"
            import fs from 'node:fs';
            import {DatabaseSync} from 'node:sqlite';
            import {register} from 'node:module';
            import {runJavaScript} from 'wasm-rquickjs:execution';
            import 'node:net'; import 'node:dns'; import 'node:dgram'; import 'node:http';
            const db = new DatabaseSync(':memory:', {open: false});
            const initialCwd = process.cwd();
            const capturedCwd = process.cwd;
            const refreshCwds = [];
            process.env = new Proxy(process.env, {
                set(target, key, value) {
                    if (key === 'GOL787_RUNTIME') refreshCwds.push(capturedCwd());
                    return Reflect.set(target, key, value);
                },
            });
            fs.fstatSync(0); fs.fstatSync(1); fs.fstatSync(2); fs.statSync('/dev/stdout');
            for (const call of [
                () => fs.fstatSync(99), () => fs.closeSync(99), () => fs.fsyncSync(99),
                () => fs.readSync(99, new Uint8Array(1), 0, 1, null),
                () => fs.writeSync(99, 'x'),
            ]) {
                let code; try { call(); } catch (error) { code = error.code; }
                if (code !== 'EBADF') throw new Error('expected pure EBADF validation, received ' + code);
            }
            const data = await import('data:text/javascript,export default 37');
            let schemeError, syntaxError;
            try { await import('https://example.invalid/module.mjs'); } catch (error) { schemeError = error.code; }
            try { await import('data:text/javascript,export%20const%20%3D'); } catch (error) { syntaxError = error.name; }
            register('data:text/javascript,' + encodeURIComponent(`
                export function resolve(specifier, context, next) {
                    if (specifier === 'provided:cjs') return {shortCircuit:true, url:'file:///provided/source.js', format:'commonjs'};
                    if (specifier === 'provided:esm') return {shortCircuit:true, url:'file:///provided/source.mjs', format:'module'};
                    if (specifier === 'provided:child') return {shortCircuit:true, url:'file:///provided/child.mjs', format:'module'};
                    if (specifier === 'provided:failure') return {shortCircuit:true, url:'file:///provided/failure.mjs', format:'module'};
                    return next(specifier, context);
                }
                export function load(url, context, next) {
                    if (url === 'file:///provided/source.js') return {shortCircuit:true, format:'commonjs', source:'exports.answer = 41;'};
                    if (url === 'file:///provided/source.mjs') return {shortCircuit:true, format:'module', source:'export {default} from \"provided:child\"; import {answer} from \"provided:cjs\"; if (answer !== 41) throw new Error(\"wrong CJS edge\");'};
                    if (url === 'file:///provided/child.mjs') return {shortCircuit:true, format:'module', source:'export default 43;'};
                    if (url === 'file:///provided/failure.mjs') throw new Error('supplied-loader-error');
                    return next(url, context);
                }
            `));
            const cjs = await import('provided:cjs');
            const esm = await import('provided:esm');
            const loaderErrors = [];
            for (let i = 0; i < 2; i++) {
                try { await import('provided:failure'); } catch (error) { loaderErrors.push(error.message); }
            }
            console.error('preinit logging is allowed');
            process.stdout.write('preinit-stdio-out\n');
            process.stderr.write('preinit-stdio-err\n');
            export function ready() { return 'ready'; }
            export async function run() {
                const owned = await runJavaScript({source:'return process.cwd();'});
                process.stdout.write('runtime-stdio-out\n');
                process.stderr.write('runtime-stdio-err\n');
                db.open(); db.exec('CREATE TABLE t (n INTEGER)'); db.close();
                return JSON.stringify({initialCwd, cwd:process.cwd(), capturedCwd:capturedCwd(), data:data.default, cjs:cjs.answer, esm:esm.default,
                    owned, schemeError, syntaxError, loaderErrors, refreshCwds,
                    exists:fs.existsSync('/'), files:fs.readdirSync('/'),
                    value:fs.readFileSync('value.txt','utf8')});
            }
        "#;
        wasm_rquickjs::inject_js_into_component(&template, &input, &[source])?;
        runtime.block_on(optimize_component(&input, &output, "wizer-initialize"))?;
        for (component, value) in [(&output, "first"), (&output, "second"), (&input, "plain")] {
            let filesystem = root.join(value);
            std::fs::create_dir_all(filesystem.join("app"))?;
            std::fs::write(filesystem.join("app/value.txt"), value)?;
            let json = runtime.block_on(run_filesystem_probe(component, &filesystem))?;
            let json: serde_json::Value = serde_json::from_str(&json)?;
            assert_eq!(json["cwd"], "/app");
            assert_eq!(json["capturedCwd"], "/app");
            assert_eq!(
                json["initialCwd"],
                if component == &output { "/" } else { "/app" }
            );
            assert_eq!(json["owned"]["value"], "/app");
            if component == &output {
                assert_eq!(json["refreshCwds"], serde_json::json!(["/app"]));
            }
            assert_eq!(json["data"], 37);
            assert_eq!(json["cjs"], 41);
            assert_eq!(json["esm"], 43);
            assert_eq!(json["schemeError"], "ERR_UNSUPPORTED_ESM_URL_SCHEME");
            assert_eq!(json["syntaxError"], "SyntaxError");
            assert_eq!(
                json["loaderErrors"],
                serde_json::json!(["supplied-loader-error", "supplied-loader-error"])
            );
            assert_eq!(json["exists"], true);
            assert!(
                json["files"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|name| name == "app")
            );
            assert_eq!(json["value"], value);
        }
        let root_mount = root.join("default-cwd");
        std::fs::create_dir(&root_mount)?;
        std::fs::write(root_mount.join("value.txt"), "root-value")?;
        let default_cwd = runtime
            .block_on(run_probe_inner(&output, false, Some(&root_mount), None))?
            .unwrap();
        let default_cwd: serde_json::Value = serde_json::from_str(&default_cwd.json)?;
        assert_eq!(default_cwd["cwd"], "/");
        assert_eq!(default_cwd["capturedCwd"], "/");
        assert_eq!(default_cwd["value"], "root-value");
        assert_eq!(default_cwd["owned"]["value"], "/");
        let invalid = runtime
            .block_on(run_probe_inner(
                &output,
                false,
                Some(&root.join("first")),
                Some("/missing-cwd"),
            ))
            .unwrap_err();
        assert!(
            format!("{invalid:#}").contains("Failed to initialize runtime cwd"),
            "{invalid:#}"
        );
        let invalid_cold = runtime
            .block_on(run_probe_inner(
                &input,
                false,
                Some(&root.join("first")),
                Some("/missing-cwd"),
            ))
            .unwrap_err();
        assert!(
            format!("{invalid_cold:#}").contains("Failed to initialize runtime cwd"),
            "{invalid_cold:#}"
        );
    }
    Ok(())
}

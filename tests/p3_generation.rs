use camino::Utf8Path;
use camino::Utf8PathBuf;
use camino_tempfile::Utf8TempDir;
use indoc::indoc;
use std::process::Command;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};

fn write_fixture(root: &Utf8Path, wit: &str, js: &str) -> anyhow::Result<()> {
    let wit_dir = root.join("wit");
    let src_dir = root.join("src");
    std::fs::create_dir_all(&wit_dir)?;
    std::fs::create_dir_all(&src_dir)?;
    std::fs::write(wit_dir.join("world.wit"), wit)?;
    std::fs::write(src_dir.join("module.js"), js)?;
    Ok(())
}

fn write_wit_dep(root: &Utf8Path, name: &str, wit: &str) -> anyhow::Result<()> {
    let deps_dir = root.join("wit").join("deps");
    std::fs::create_dir_all(&deps_dir)?;
    std::fs::write(deps_dir.join(name), wit)?;
    Ok(())
}

fn generate_p3(root: &Utf8Path) -> anyhow::Result<()> {
    generate_wrapper_crate_with_target(
        &root.join("wit"),
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(root.join("src").join("module.js")),
        }],
        &root.join("out"),
        None,
        GenerationTarget::WasiP3,
    )
}

fn build_p3(root: &Utf8Path, wasm_name: &str) -> anyhow::Result<Utf8PathBuf> {
    build_p3_with_features(root, wasm_name, None)
}

/// Builds a generated P3 crate, optionally overriding its default feature set. Passing
/// `features = Some("full-p3")` compiles the heavier capability tier (sqlite, brotli,
/// crypto-full, timezone) that is intentionally left out of the default `normal-p3` tier.
fn build_p3_with_features(
    root: &Utf8Path,
    wasm_name: &str,
    features: Option<&str>,
) -> anyhow::Result<Utf8PathBuf> {
    let mut build_cmd = Command::new("cargo");
    build_cmd
        .arg("build")
        .arg("--manifest-path")
        .arg(root.join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2");
    if let Some(features) = features {
        build_cmd
            .arg("--no-default-features")
            .arg("--features")
            .arg(features);
    }
    let build = build_cmd.output()?;

    assert!(
        build.status.success(),
        "P3 generated crate should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );

    let metadata = Command::new("cargo")
        .arg("metadata")
        .arg("--no-deps")
        .arg("--format-version")
        .arg("1")
        .arg("--manifest-path")
        .arg(root.join("out").join("Cargo.toml"))
        .output()?;
    assert!(
        metadata.status.success(),
        "cargo metadata should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&metadata.stdout),
        String::from_utf8_lossy(&metadata.stderr)
    );
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)?;
    let target_dir = metadata["target_directory"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("missing target_directory in cargo metadata"))?;

    Ok(Utf8PathBuf::from(target_dir)
        .join("wasm32-wasip2")
        .join("debug")
        .join(format!("{wasm_name}.wasm")))
}

fn run_p3_string_export(wasm_path: &Utf8Path, export: &str) -> anyhow::Result<String> {
    let output = Command::new("wasmtime")
        .arg("run")
        .arg("-S")
        .arg("p3=y")
        .arg("--wasm")
        .arg("component-model=y")
        .arg("--wasm")
        .arg("component-model-async=y")
        .arg("--invoke")
        .arg(format!("{export}()"))
        .arg(wasm_path)
        .output()?;

    assert!(
        output.status.success(),
        "P3 component invocation should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).map_err(Into::into)
}

fn run_p3_string_export_with_dir(
    wasm_path: &Utf8Path,
    export: &str,
    host_dir: &Utf8Path,
    guest_dir: &str,
) -> anyhow::Result<String> {
    let output = Command::new("wasmtime")
        .arg("run")
        .arg("-S")
        .arg("p3=y")
        .arg("--wasm")
        .arg("component-model=y")
        .arg("--wasm")
        .arg("component-model-async=y")
        .arg("--dir")
        .arg(format!("{host_dir}::{guest_dir}"))
        .arg("--invoke")
        .arg(format!("{export}()"))
        .arg(wasm_path)
        .output()?;

    assert!(
        output.status.success(),
        "P3 component invocation should succeed; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).map_err(Into::into)
}

#[test]
fn p3_rejects_sync_wizer_initialize_export_from_input_wit() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:wizer;

            world wizer {
              export wizer-initialize: func();
            }
        "#},
        "",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject synchronous exports even when the export is named wizer-initialize"
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_wasi_system_clock_import() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:clock;

            world clock {
              import wasi:clocks/system-clock@0.3.0-rc-2026-03-15;
              export run: async func() -> u64;
            }
        "#},
        "export async function run() { return 1n; }\n",
    )?;
    write_wit_dep(
        temp.path(),
        "clocks.wit",
        indoc! {r#"
            package wasi:clocks@0.3.0-rc-2026-03-15;

            interface types {
              type duration = u64;
            }

            interface system-clock {
              use types.{duration};

              record instant {
                seconds: s64,
                nanoseconds: u32,
              }

              now: func() -> instant;
              get-resolution: func() -> duration;
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let output = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        output.status.success(),
        "P3 generated crate with a wasi:clocks/system-clock import should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_async_result_export() -> anyhow::Result<()> {
    // An async export returning `result<T, E>`. Per the documented contract a result-returning
    // JS function returns the bare `ok` value or `throw`s for the `err` arm (the `{ tag, val }`
    // shape is only used for results received as inputs/data, not for result *return* values).
    // This locks in that the P3 result-export glue (`JsResult` + `call_js_export_returning_result`)
    // generates a crate that compiles. The ok/err runtime behavior is validated by the
    // `examples/p3/async-result` host-runner harness.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:result-export;

            world result-export {
              export run: async func(flag: bool) -> result<u32, string>;
            }
        "#},
        indoc! {r#"
            export async function run(flag) {
              if (flag) {
                return 7;
              }
              throw "nope";
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        build.status.success(),
        "P3 generated crate with an async result export should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );
    Ok(())
}

#[test]
fn p3_generated_crate_builds_with_node_builtin_imports() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-builtins;

            world p3-builtins {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Buffer } from 'node:buffer';
            import process from 'node:process';
            import path from 'node:path';

            export async function run() {
              return `${Buffer.from('p3').toString('utf8')}:${process.platform}:${path.join('a', 'b')}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(temp.path().join("out").join("Cargo.toml"))
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;

    assert!(
        build.status.success(),
        "P3 generated crate with Node.js builtin imports should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );
    Ok(())
}

#[test]
fn p3_fs_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-named;

            world p3-fs-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { readFile } from 'node:fs';

            export async function run() {
              return typeof readFile;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_fs_read_write_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // Strong functional check that node:fs actually *executes* on the Preview 3 path
    // (native filesystem calls driven through `block_on`), not merely that the named
    // exports are importable. A regression back to throwing "not available" stubs would
    // fail here even though the `typeof`-only smoke tests above would still pass.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-rw;

            world p3-fs-rw {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';

            export async function run() {
              mkdirSync('/data/sub', { recursive: true });
              writeFileSync('/data/sub/hello.txt', 'p3-fs-works');
              const back = readFileSync('/data/sub/hello.txt', 'utf8');
              const listed = readdirSync('/data/sub').join(',');
              const ex = existsSync('/data/sub/hello.txt');
              return `${back}|${listed}|${ex}`;
            }
        "#},
    )?;

    let data_dir = temp.path().join("data");
    std::fs::create_dir_all(&data_dir)?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_rw")?;
    let result = run_p3_string_export_with_dir(&wasm_path, "run", &data_dir, "/data")?;

    assert_eq!(result, "p3-fs-works|hello.txt|true");
    // Confirm the write really hit the host filesystem through the P3 filesystem bindings.
    let written = std::fs::read_to_string(data_dir.join("sub").join("hello.txt"))?;
    assert_eq!(written, "p3-fs-works");
    Ok(())
}

#[test]
fn p3_fs_dirent_named_import_is_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-fs-dirent-named;

            world p3-fs-dirent-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Dirent } from 'node:fs';

            export async function run() {
              return typeof Dirent;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_fs_dirent_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_net_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-net-named;

            world p3-net-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createConnection, Socket } from 'node:net';

            export async function run() {
              return `${typeof createConnection}:${typeof Socket}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_net_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function:function");
    Ok(())
}

#[test]
fn p3_dgram_named_import_is_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dgram-named;

            world p3-dgram-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createSocket } from 'node:dgram';

            export async function run() {
              return typeof createSocket;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dgram_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function");
    Ok(())
}

#[test]
fn p3_dns_named_imports_are_supported() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dns-named;

            world p3-dns-named {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { lookup, promises } from 'node:dns';
            import { resolve4 } from 'node:dns/promises';

            export async function run() {
              return `${typeof lookup}:${typeof promises}:${typeof resolve4}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dns_named")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "function:object:function");
    Ok(())
}

#[test]
fn p3_dns_promises_default_matches_dns_promises_object() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-dns-promises-identity;

            world p3-dns-promises-identity {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import dnsPromises from 'node:dns/promises';
            import { promises } from 'node:dns';

            export async function run() {
              return String(dnsPromises === promises);
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_dns_promises_identity")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "true");
    Ok(())
}

#[test]
fn p3_crypto_sha256_matches_known_digest_on_wasi_p3() -> anyhow::Result<()> {
    // The default `normal-p3` tier enables the real `crypto` capability, so `node:crypto`
    // must expose the full hashing surface. The `web_crypto_lite` fallback only provides
    // randomness and has no `createHash`, so computing the well-known SHA-256 digest of "abc"
    // proves the native hash bridge is actually wired and functional on the Preview 3 path.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-crypto-sha256;

            world p3-crypto-sha256 {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { createHash } from 'node:crypto';

            export async function run() {
              return createHash('sha256').update('abc').digest('hex');
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_crypto_sha256")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(
        result,
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    Ok(())
}

#[test]
fn p3_zlib_gzip_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // The default `normal-p3` tier enables the real `zlib` capability. The `zlib_disabled`
    // fallback throws for every operation, so a gzip -> gunzip roundtrip that recovers the
    // original text proves the native flate2 bridge is actually wired on the Preview 3 path.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-zlib-roundtrip;

            world p3-zlib-roundtrip {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { Buffer } from 'node:buffer';
            import { gzipSync, gunzipSync } from 'node:zlib';

            export async function run() {
              const original = 'hello zlib on preview 3';
              const restored = gunzipSync(gzipSync(Buffer.from(original))).toString();
              return restored;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3(temp.path(), "p3_zlib_roundtrip")?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "hello zlib on preview 3");
    Ok(())
}

#[test]
fn p3_sqlite_roundtrip_on_wasi_p3() -> anyhow::Result<()> {
    // `sqlite` is intentionally kept out of the default `normal-p3` tier (it pulls in the
    // heavier rusqlite dependency), so this builds the generated crate with the `full-p3`
    // tier instead. An in-memory create/insert/select roundtrip proves the real rusqlite
    // bridge is wired and functional on the Preview 3 path rather than the throwing
    // `sqlite_disabled` stub.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-sqlite-roundtrip;

            world p3-sqlite-roundtrip {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            import { DatabaseSync } from 'node:sqlite';

            export async function run() {
              const db = new DatabaseSync(':memory:');
              db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
              const insert = db.prepare('INSERT INTO t (name) VALUES (?)');
              insert.run('alice');
              insert.run('bob');
              const rows = db.prepare('SELECT name FROM t ORDER BY id').all();
              db.close();
              return rows.map((r) => r.name).join(',');
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    let wasm_path = build_p3_with_features(temp.path(), "p3_sqlite_roundtrip", Some("full-p3"))?;
    let result = run_p3_string_export(&wasm_path, "run")?;

    assert_eq!(result, "alice,bob");
    Ok(())
}

#[test]
fn p3_websocket_builds_on_wasi_p3() -> anyhow::Result<()> {
    // `websocket` is an opt-in capability (like `logging`) intentionally kept out of the default
    // `normal-p3` and `full-p3` tiers because enabling it adds a required `golem:websocket/client`
    // host import that plain WASI hosts (including the wasmtime CLI used here) cannot satisfy. It
    // uses the fully synchronous `golem:websocket@1.5.0` interface, which is Preview 3-portable.
    // There is no `golem:websocket` host in this harness, so this is a build-only check that the
    // websocket builtin compiles and links into a Preview 3 crate (the `WebSocket`/`WebSocketStream`
    // globals it installs are exercised by the P2 runtime tests / a Golem host, not here).
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:p3-websocket;

            world p3-websocket {
              export run: async func() -> string;
            }
        "#},
        indoc! {r#"
            export async function run() {
              return `${typeof WebSocket},${typeof WebSocketStream}`;
            }
        "#},
    )?;

    generate_p3(temp.path())?;
    // Build only: enabling `websocket` adds an unsatisfiable `golem:websocket` import under the
    // wasmtime CLI, so we assert compilation/linking succeeds rather than invoking the component.
    let _wasm_path =
        build_p3_with_features(temp.path(), "p3_websocket", Some("normal-p3,websocket"))?;
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource;

            interface api {
              resource r;
            }

            world methodless-resource {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_exported_resource_alias() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-resource-alias;

            interface resources {
              resource r;
            }

            interface api {
              use resources.{r};
            }

            world methodless-resource-alias {
              export api;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject exported resources even when the exported interface re-exports the resource through a type alias"
    );
    Ok(())
}

#[test]
fn p3_rejects_methodless_world_level_resource() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:methodless-world-resource;

            world methodless-world-resource {
              resource r;
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources declared directly in the world even when the resource has no functions"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_imported_resource() -> anyhow::Result<()> {
    // A resource declared directly in the world (rather than inside an interface) is only usable
    // through functions imported directly into the world. Those are a documented limitation
    // ("only whole interfaces" are supported for imports): they would land in the synthetic
    // global import module, which is never registered with QuickJS's module resolver/loader.
    // The Preview 3 path must reject this instead of emitting a crate that fails to compile.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:world-resource;

            world world-resource {
              resource r;

              import make: func() -> r;
              import take: func(x: r);
              export run: async func() -> u32;
            }
        "#},
        "export async function run() { return 1; }\n",
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject resources imported directly into the world"
    );
    Ok(())
}

#[test]
fn p3_rejects_world_level_freestanding_import() -> anyhow::Result<()> {
    // Functions imported directly into the world (not through an interface) are a documented
    // limitation ("only whole interfaces" are supported for imports). On the Preview 3 path such
    // an import would build but trap at runtime ("Error resolving module ...") because the global
    // import module is never registered with QuickJS, so generation must reject it up front.
    let temp = Utf8TempDir::new()?;
    write_fixture(
        temp.path(),
        indoc! {r#"
            package bug:async-import-runtime;

            world async-import-runtime {
              import get-number: async func() -> u32;
              export run: async func() -> u32;
            }
        "#},
        indoc! {r#"
            import { getNumber } from 'async-import-runtime';

            export async function run() {
              return await getNumber();
            }
        "#},
    )?;

    assert!(
        generate_p3(temp.path()).is_err(),
        "P3 generation must reject functions imported directly into the world"
    );
    Ok(())
}

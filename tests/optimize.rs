use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use wasm_rquickjs::{OptimizeOptions, optimize_component, optimize_component_with_options};

#[path = "optimize/diagnostics.rs"]
mod diagnostics_tests;
mod p3_build;
#[path = "optimize/preinit.rs"]
mod preinit_tests;

// Initialization mutates the last byte, so verifying the optimized component
// checks that snapshot extraction retained memory, not just that Wizer returned.
fn write_component(path: &Utf8Path, pages: u32) -> anyhow::Result<()> {
    let last_byte = pages * 65536 - 1;
    let wasm = wat::parse_str(format!(
        r#"(component
            (core module $m
                (memory (export "memory") {pages})
                (func (export "init")
                    i32.const {last_byte} i32.const 77 i32.store8)
                (func (export "read") (result i32)
                    i32.const {last_byte} i32.load8_u))
            (core instance $i (instantiate $m))
            (func (export "wizer-initialize") (canon lift (core func $i "init")))
            (func (export "read") (result u32) (canon lift (core func $i "read"))))"#
    ))?;
    std::fs::write(path, wasm)?;
    Ok(())
}

async fn assert_snapshot(path: &Utf8Path) -> anyhow::Result<()> {
    let mut config = wasmtime::Config::new();
    config.wasm_component_model(true);
    let engine = wasmtime::Engine::new(&config)?;
    let component = wasmtime::component::Component::from_file(&engine, path)?;
    let mut store = wasmtime::Store::new(&engine, ());
    let linker = wasmtime::component::Linker::new(&engine);
    let instance = linker.instantiate_async(&mut store, &component).await?;
    let read = instance.get_typed_func::<(), (u32,)>(&mut store, "read")?;
    assert_eq!(read.call_async(&mut store, ()).await?.0, 77);
    Ok(())
}

#[tokio::test]
async fn optimizer_default_options_preserve_existing_behavior() -> anyhow::Result<()> {
    assert_eq!(OptimizeOptions::default().hostcall_fuel, None);
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let legacy = temp.path().join("legacy.wasm");
    let explicit = temp.path().join("explicit.wasm");
    write_component(&input, 3)?;
    optimize_component(&input, &legacy, "wizer-initialize").await?;
    optimize_component_with_options(
        &input,
        &explicit,
        "wizer-initialize",
        &OptimizeOptions::default(),
    )
    .await?;
    assert_eq!(std::fs::read(&legacy)?, std::fs::read(&explicit)?);
    assert_snapshot(&legacy).await?;
    Ok(())
}

#[tokio::test]
async fn optimizer_determinism_requires_matching_restore_capability() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let output = temp.path().join("output.wasm");
    for (marker, init_func, deterministic) in [
        ("", "wizer-initialize", false),
        (
            r#"(func (export "wasm-rquickjs-wizer-restore-v1") (canon lift (core func $i "marker")))"#,
            "wizer-initialize",
            true,
        ),
        // Same spelling, wrong signature: not a restore capability.
        (
            r#"(func (export "wasm-rquickjs-wizer-restore-v1") (result u64) (canon lift (core func $i "read")))"#,
            "wizer-initialize",
            false,
        ),
        (
            r#"(func (export "wasm-rquickjs-wizer-restore-v1") (canon lift (core func $i "marker")))"#,
            "other-initialize",
            false,
        ),
    ] {
        std::fs::write(
            &input,
            wat::parse_str(format!(
                r#"(component
            (import "wasi:random/random@0.2.0" (instance $random
                (export "get-random-u64" (func (result u64)))))
            (alias export $random "get-random-u64" (func $random-u64))
            (core func $random-u64 (canon lower (func $random-u64)))
            (core instance $host (export "random" (func $random-u64)))
            (core module $m
                (import "host" "random" (func $random (result i64)))
                (memory (export "memory") 1)
                (func (export "marker"))
                (func (export "init") i32.const 0 call $random i64.store)
                (func (export "read") (result i64) i32.const 0 i64.load))
            (core instance $i (instantiate $m (with "host" (instance $host))))
            (func (export "wizer-initialize") (canon lift (core func $i "init")))
            (func (export "other-initialize") (canon lift (core func $i "init")))
            (func (export "read") (result u64) (canon lift (core func $i "read")))
            {marker})"#
            ))?,
        )?;
        let mut snapshots = Vec::new();
        for _ in 0..2 {
            optimize_component(&input, &output, init_func).await?;
            snapshots.push(std::fs::read(&output)?);
        }
        assert_eq!(
            snapshots[0] == snapshots[1],
            deterministic,
            "only a supported capability paired with its initializer enables deterministic entropy"
        );
    }
    Ok(())
}

#[derive(Debug)]
struct ProbeOutput {
    json: String,
    stdout: String,
    stderr: String,
}

async fn run_probe(path: &Utf8Path, deny_entropy: bool) -> anyhow::Result<Option<String>> {
    Ok(run_probe_inner(path, deny_entropy, None, None)
        .await?
        .map(|output| output.json))
}

async fn run_filesystem_probe(path: &Utf8Path, filesystem: &Utf8Path) -> anyhow::Result<String> {
    let output = run_probe_inner(path, false, Some(filesystem), Some("/app"))
        .await?
        .unwrap();
    assert!(
        output.stdout.contains("runtime-stdio-out"),
        "stdout was not restored: {output:?}"
    );
    assert!(
        output.stderr.contains("runtime-stdio-err"),
        "stderr was not restored: {output:?}"
    );
    Ok(output.json)
}

async fn run_probe_inner(
    path: &Utf8Path,
    deny_entropy: bool,
    filesystem: Option<&Utf8Path>,
    cwd: Option<&str>,
) -> anyhow::Result<Option<ProbeOutput>> {
    use wasmtime::component::{Component, Linker, ResourceTable};
    use wasmtime::{Config, Engine, Store, StoreContextMut};

    struct Host {
        table: ResourceTable,
        wasi: wasmtime_wasi::WasiCtx,
        http: wasmtime_wasi_http::WasiHttpCtx,
        entropy_requested: bool,
        #[cfg(feature = "use-golem-wasmtime")]
        io_ctx: wasmtime_wasi::IoCtx,
    }
    impl wasmtime_wasi::WasiView for Host {
        fn ctx(&mut self) -> wasmtime_wasi::WasiCtxView<'_> {
            wasmtime_wasi::WasiCtxView {
                ctx: &mut self.wasi,
                table: &mut self.table,
                #[cfg(feature = "use-golem-wasmtime")]
                io_ctx: &mut self.io_ctx,
            }
        }
    }
    impl wasmtime_wasi_http::p2::WasiHttpView for Host {
        fn http(&mut self) -> wasmtime_wasi_http::p2::WasiHttpCtxView<'_> {
            wasmtime_wasi_http::p2::WasiHttpCtxView {
                ctx: &mut self.http,
                table: &mut self.table,
                hooks: wasmtime_wasi_http::p2::default_hooks(),
            }
        }
    }
    impl wasmtime_wasi_http::p3::WasiHttpView for Host {
        fn http(&mut self) -> wasmtime_wasi_http::p3::WasiHttpCtxView<'_> {
            wasmtime_wasi_http::p3::WasiHttpCtxView {
                ctx: &mut self.http,
                table: &mut self.table,
                hooks: wasmtime_wasi_http::p3::default_hooks(),
            }
        }
    }
    let mut config = Config::new();
    config
        .wasm_component_model(true)
        .wasm_component_model_async(true);
    if std::env::var("WASM_RQUICKJS_TEST_WASMTIME_CACHE").is_ok_and(|value| value == "1") {
        config.cache(Some(wasmtime::Cache::new(wasmtime::CacheConfig::new())?));
    }
    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, path)?;
    let stdout = wasmtime_wasi::p2::pipe::MemoryOutputPipe::new(64 * 1024);
    let stderr = wasmtime_wasi::p2::pipe::MemoryOutputPipe::new(64 * 1024);
    let mut builder = wasmtime_wasi::WasiCtxBuilder::new();
    builder.stdout(stdout.clone()).stderr(stderr.clone());
    builder.env("GOL787_RUNTIME", "live").arg(path.as_str());
    if let Some(filesystem) = filesystem {
        builder.preopened_dir(
            filesystem,
            "/",
            wasmtime_wasi::DirPerms::all(),
            wasmtime_wasi::FilePerms::all(),
        )?;
    }
    if let Some(cwd) = cwd {
        builder.initial_cwd(cwd);
    }
    #[cfg(not(feature = "use-golem-wasmtime"))]
    let wasi = builder.build();
    #[cfg(feature = "use-golem-wasmtime")]
    let (wasi, io_ctx) = builder.build();
    let mut store = Store::new(
        &engine,
        Host {
            table: ResourceTable::new(),
            wasi,
            http: wasmtime_wasi_http::WasiHttpCtx::new(),
            entropy_requested: false,
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx,
        },
    );
    let mut linker = Linker::new(&engine);
    // Populate trapping HTTP/logging definitions before installing live WASI;
    // define_unknown_imports_as_traps replaces entire instance definitions.
    linker.define_unknown_imports_as_traps(&component)?;
    linker.allow_shadowing(true);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi_http::p2::add_only_http_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    // Unknown-import stubs are synchronous; P3 HTTP imports require the real
    // async signatures even though this probe never performs HTTP requests.
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    // The probe does not provide a WebSocket service: every call must trap.
    // Register its complete imported ABI so a pure import also links on P3,
    // whose receive methods are async (the generic trap helper is sync-only).
    for (interface, item) in component.component_type().imports(&engine) {
        if !interface.starts_with("golem:websocket/client@") {
            continue;
        }
        let wasmtime::component::types::ComponentItem::ComponentInstance(instance) = item.ty else {
            continue;
        };
        let mut provider = linker.instance(interface)?;
        for (name, export) in instance.exports(&engine) {
            match export.ty {
                wasmtime::component::types::ComponentItem::Resource(_) => {
                    assert_eq!(
                        name, "websocket-connection",
                        "unexpected WebSocket resource"
                    );
                    provider.resource(
                        name,
                        wasmtime::component::ResourceType::host::<()>(),
                        |_, _| Ok(()),
                    )?;
                }
                wasmtime::component::types::ComponentItem::ComponentFunc(function) => {
                    let message = format!(
                        "WebSocket service unavailable in this filesystem probe: {interface}#{name}"
                    );
                    if function.async_() {
                        provider.func_new_concurrent(name, move |_, _, _, _| {
                            let message = message.clone();
                            Box::pin(async move { Err(wasmtime::Error::msg(message)) })
                        })?;
                    } else {
                        provider.func_new(name, move |_, _, _, _| {
                            Err(wasmtime::Error::msg(message.clone()))
                        })?;
                    }
                }
                _ => {}
            }
        }
    }
    for (name, _) in component.component_type().imports(&engine) {
        if name.starts_with("wasi:logging/logging") {
            linker.instance(name)?.func_new("log", |_, _, args, _| {
                if let Some(wasmtime::component::Val::String(message)) = args.last() {
                    eprintln!("[guest log] {message}");
                }
                Ok(())
            })?;
        }
    }
    for (name, _) in component.component_type().imports(&engine) {
        if deny_entropy && name.starts_with("wasi:random/random@") {
            let mut random = linker.instance(name)?;
            random.func_wrap(
                "get-random-u64",
                |mut ctx: StoreContextMut<'_, Host>, (): ()| {
                    ctx.data_mut().entropy_requested = true;
                    Err::<(u64,), _>(wasmtime::Error::msg("runtime entropy denied"))
                },
            )?;
            random.func_wrap(
                "get-random-bytes",
                |mut ctx: StoreContextMut<'_, Host>, (_len,): (u64,)| {
                    ctx.data_mut().entropy_requested = true;
                    Err::<(Vec<u8>,), _>(wasmtime::Error::msg("runtime entropy denied"))
                },
            )?;
        }
    }
    let instance = linker.instantiate_async(&mut store, &component).await?;
    if !deny_entropy {
        let run = instance.get_typed_func::<(), (String,)>(&mut store, "run")?;
        let (json,) = store
            .run_concurrent(async move |accessor| run.call_concurrent(accessor, ()).await)
            .await
            .map_err(|error| {
                error.context(format!(
                    "guest stderr: {}",
                    String::from_utf8_lossy(&stderr.contents())
                ))
            })?
            .map_err(|error| {
                error.context(format!(
                    "guest stderr: {}",
                    String::from_utf8_lossy(&stderr.contents())
                ))
            })?;
        return Ok(Some(ProbeOutput {
            json,
            stdout: String::from_utf8(stdout.contents().to_vec())?,
            stderr: String::from_utf8(stderr.contents().to_vec())?,
        }));
    }
    let ready = instance.get_typed_func::<(), (String,)>(&mut store, "ready")?;
    let result = ready.call_async(&mut store, ()).await;
    assert!(result.is_err(), "restore ignored unavailable entropy");
    assert!(
        store.data().entropy_requested,
        "failure was not an entropy request: {result:?}"
    );
    assert!(
        ready.call_async(&mut store, ()).await.is_err(),
        "retry after a failed restore exposed application JS"
    );
    Ok(None)
}

fn build_preinit_template(
    root: &Utf8Path,
    target: wasm_rquickjs::GenerationTarget,
    tier: &str,
) -> anyhow::Result<camino::Utf8PathBuf> {
    use std::process::Command;
    use wasm_rquickjs::{EmbeddingMode, GenerationTarget, JsModuleSpec};
    std::fs::create_dir_all(root.join("wit"))?;
    let async_keyword = if target == GenerationTarget::WasiP3 {
        "async "
    } else {
        ""
    };
    std::fs::write(
        root.join("wit/world.wit"),
        format!(
            "package test:preinit; world preinit-probe {{ export run: {async_keyword}func() -> string; export ready: {async_keyword}func() -> string; }}"
        ),
    )?;
    wasm_rquickjs::generate_wrapper_crate_with_target(
        &root.join("wit"),
        &[JsModuleSpec {
            name: "module".into(),
            mode: EmbeddingMode::BinarySlot,
        }],
        &root.join("out"),
        None,
        target,
    )?;
    let cache = p3_build::BuildCache::new()?;
    let mut build = Command::new("cargo");
    cache.configure(&mut build);
    // This matrix repeatedly compiles the same guest for different JS slots.
    // Keep full templates compact so Wasmtime compilation does not dominate
    // every negative case; all stores and component instances remain fresh.
    if tier.contains("full") {
        build
            .env("CARGO_PROFILE_DEV_DEBUG", "0")
            .env("CARGO_PROFILE_DEV_OPT_LEVEL", "1");
    }
    let result = build
        .args([
            "build",
            "--target",
            "wasm32-wasip2",
            "--no-default-features",
            "--features",
            tier,
            "--manifest-path",
        ])
        .arg(root.join("out/Cargo.toml"))
        .output()?;
    assert!(
        result.status.success(),
        "{tier}: {}",
        String::from_utf8_lossy(&result.stderr)
    );
    let mut metadata = Command::new("cargo");
    cache.configure(&mut metadata);
    let result = metadata
        .args([
            "metadata",
            "--no-deps",
            "--format-version",
            "1",
            "--manifest-path",
        ])
        .arg(root.join("out/Cargo.toml"))
        .output()?;
    assert!(result.status.success());
    let metadata: serde_json::Value = serde_json::from_slice(&result.stdout)?;
    let wasm = Utf8Path::new(metadata["target_directory"].as_str().unwrap())
        .join("wasm32-wasip2/debug/preinit_probe.wasm");
    let template = cache.finish(wasm.as_std_path(), root.as_std_path())?;
    let template = camino::Utf8PathBuf::from_path_buf(template).unwrap();
    Ok(template)
}

#[test]
fn optimizer_restores_live_services_after_deterministic_preinit() -> anyhow::Result<()> {
    use std::process::Command;
    use wasm_rquickjs::GenerationTarget;

    let temp = Utf8TempDir::new()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    for (target, tier) in [
        (GenerationTarget::WasiP2, "p2,encoding"),
        (GenerationTarget::WasiP2, "p2,crypto,encoding"),
        (GenerationTarget::WasiP3, "p3,encoding"),
        (GenerationTarget::WasiP3, "p3,crypto,encoding"),
    ] {
        let root = temp.path().join(tier.replace(',', "-"));
        let template = build_preinit_template(&root, target, tier)?;
        let js = root.join("main.js");
        std::fs::write(
            &js,
            r#"
            import { performance } from 'node:perf_hooks';
            import { runInNewContext } from 'node:vm';
            const random = Math.random;
            const vmRandom = runInNewContext('Math.random');
            const now = performance.now.bind(performance);
            const uuid = crypto.randomUUID.bind(crypto);
            const frozen = { time: Date.now(), random: random(),
                bytes: [...crypto.getRandomValues(new Uint8Array(32))],
                origin: performance.timeOrigin, uptime: process.uptime() };
            export function ready() { return 'ready'; }
            export function run() {
                const monotonic = process.hrtime.bigint();
                const perfStart = now();
                const start = Date.now();
                while (Date.now() - start < 20) {}
                return JSON.stringify({ frozen, time: Date.now(),
                    origin: performance.timeOrigin, jsonOrigin: performance.toJSON().timeOrigin,
                    elapsed: now() - perfStart, uptime: process.uptime(),
                    monotonicElapsed: Number(process.hrtime.bigint() - monotonic),
                    random: [random(), random()], vmRandom: [vmRandom(), vmRandom()],
                    bytes: [...crypto.getRandomValues(new Uint8Array(32))], uuid: uuid(),
                    env: process.env.GOL787_RUNTIME, argv: process.argv });
            }
        "#,
        )?;
        let input = root.join("input.wasm");
        let source = std::fs::read_to_string(&js)?;
        wasm_rquickjs::inject_js_into_component(&template, &input, &[&source])?;
        let mut previous = None;
        let optimized = root.join("optimized.wasm");
        for _ in 0..3 {
            // Independent optimizer processes: no host RNG/clock state is reused.
            let result = Command::new(env!("CARGO_BIN_EXE_wasm-rquickjs"))
                .args(["optimize", "--input"])
                .arg(&input)
                .arg("--output")
                .arg(&optimized)
                .output()?;
            assert!(
                result.status.success(),
                "{tier}: {}",
                String::from_utf8_lossy(&result.stderr)
            );
            assert!(!String::from_utf8_lossy(&result.stderr).contains("preserving legacy"));
            let bytes = std::fs::read(&optimized)?;
            if let Some(previous) = &previous {
                assert!(previous == &bytes, "{tier}: independent builds differ");
            }
            previous = Some(bytes);
        }
        eprintln!(
            "{tier}: 3 independent optimizations byte-identical; BLAKE3={}",
            blake3::hash(previous.as_ref().unwrap())
        );
        let mut previous: Option<serde_json::Value> = None;
        for component in [&optimized, &optimized, &input] {
            let before = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_millis() as u64;
            let json = runtime.block_on(run_probe(component, false))?.unwrap();
            let value: serde_json::Value = serde_json::from_str(&json)?;
            let after = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_millis() as u64;
            assert!((before..=after).contains(&value["time"].as_u64().unwrap()));
            assert!((before..=after).contains(&value["origin"].as_u64().unwrap()));
            assert_eq!(value["origin"], value["jsonOrigin"]);
            assert!(value["elapsed"].as_f64().unwrap() >= 15.0);
            assert!(value["monotonicElapsed"].as_u64().unwrap() >= 15_000_000);
            assert!((0.015..10.0).contains(&value["uptime"].as_f64().unwrap()));
            assert_eq!(value["env"], "live");
            assert!(value["argv"].as_array().unwrap().iter().any(|arg| {
                arg.as_str()
                    .is_some_and(|s| s.ends_with(component.file_name().unwrap()))
            }));
            for key in ["random", "vmRandom"] {
                let numbers = value[key].as_array().unwrap();
                assert_ne!(numbers[0], numbers[1]);
                assert!(
                    numbers
                        .iter()
                        .all(|n| (0.0..1.0).contains(&n.as_f64().unwrap()))
                );
            }
            if component == &optimized {
                assert_eq!(value["frozen"]["time"], 0);
                assert_eq!(value["frozen"]["origin"], 0);
                if let Some(previous) = &previous {
                    assert_eq!(
                        value["frozen"], previous["frozen"],
                        "application top-level values remain snapshotted"
                    );
                    for key in ["bytes", "random", "vmRandom", "uuid"] {
                        assert_ne!(
                            value[key], previous[key],
                            "{tier}: restored instances reused {key}"
                        );
                    }
                }
                assert_ne!(value["bytes"], value["frozen"]["bytes"]);
                previous = Some(value.clone());
            } else {
                assert!((before..=after).contains(&value["frozen"]["time"].as_u64().unwrap()));
            }
            eprintln!("{tier} {}: {json}", component.file_name().unwrap());
        }
        // This export makes no random calls. Without restore-time reseeding it
        // would succeed, silently leaving the build-time stream available.
        runtime.block_on(run_probe(&optimized, true))?;
        eprintln!("{tier}: entropy-denied restoration trapped before ready()");
    }
    Ok(())
}

#[cfg(feature = "use-golem-wasmtime")]
#[tokio::test]
async fn optimizer_copy_budget_controls_snapshot_extraction() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let input = temp.path().join("input.wasm");
    let output = temp.path().join("output.wasm");
    // Initialization itself performs no hostcalls; exhaustion is in extraction.
    // Zero must fail even for a snapshot that succeeds with the engine default.
    // 129 MiB exceeds the fork's default 128 MiB copy budget.
    for (pages, fuel) in [
        (3, Some(0)),
        (129 * 16, None),
        (129 * 16, Some(128 * 1024 * 1024)),
    ] {
        write_component(&input, pages)?;
        let input = input.clone();
        let task_output = output.clone();
        let failure = tokio::spawn(async move {
            optimize_component_with_options(
                &input,
                &task_output,
                "wizer-initialize",
                &OptimizeOptions {
                    hostcall_fuel: fuel,
                },
            )
            .await
        })
        .await
        .expect_err("Wizer currently panics when snapshot extraction exhausts fuel");
        assert!(failure.is_panic());
        let panic = failure.into_panic();
        let message = panic.downcast_ref::<String>().expect("panic message");
        assert!(message.contains("fuel allocated for hostcalls has been exhausted"));
        assert!(!output.exists());
    }
    optimize_component_with_options(
        &input,
        &output,
        "wizer-initialize",
        &OptimizeOptions {
            hostcall_fuel: Some(512 * 1024 * 1024),
        },
    )
    .await?;
    assert_snapshot(&output).await?;
    Ok(())
}

#[cfg(not(feature = "use-golem-wasmtime"))]
#[tokio::test]
async fn optimizer_rejects_unsupported_copy_budget_before_io() {
    for fuel in [0, 512 * 1024 * 1024] {
        let error = optimize_component_with_options(
            Utf8Path::new("nonexistent-input.wasm"),
            Utf8Path::new("nonexistent-output.wasm"),
            "wizer-initialize",
            &OptimizeOptions {
                hostcall_fuel: Some(fuel),
            },
        )
        .await
        .unwrap_err();
        assert!(error.to_string().contains("requires use-golem-wasmtime"));
    }
}

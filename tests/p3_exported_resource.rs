//! End-to-end runtime test for an **exported** WIT resource on the WASI Preview 3 path (Phase 4).
//!
//! The component under test is generated from the committed example under
//! `examples/p3/exported-resource` (a `counter` resource exported through an interface) and then
//! instantiated in an embedded wasmtime host that constructs the resource and drives every method
//! shape end-to-end:
//!
//!   * `constructor` — a synchronous component-model export (a plain `fn` in the generated Guest
//!     trait, driven into the async QuickJS runtime with `block_on`).
//!   * `increment` / `get` — synchronous instance methods (same sync/`block_on` path).
//!   * `%static-zero` — a synchronous static method.
//!   * `increment-async` — an `async func` instance method (an `async fn` in the generated Guest
//!     trait that awaits the JS Promise).
//!   * resource drop — the generated `Drop` enqueues a JS-side drop drained at the next JS entry.
//!
//! wit-bindgen-p3 lowers the synchronous exports as ordinary (non-`start_task`) component
//! functions, so wasmtime exposes them as *synchronous* host calls that take a store context
//! (driven here through `accessor.with`), while only `increment-async` takes the async `Accessor`.
//!
//! The whole guest interaction is wrapped in a hard timeout so a deadlock regression surfaces as a
//! test failure rather than a hung `cargo test`.

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use std::future::Future;
use std::process::Command;
use std::time::Duration;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{Component, Linker, ResourceTable, bindgen};
use wasmtime::{Config, Engine, Result, Store};
use wasmtime_wasi::{WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p3::{WasiHttpCtxView, WasiHttpView};

bindgen!({
    world: "exported-res",
    path: "examples/p3/exported-resource/wit",
    // The store is async (component-model-async), so every guest export must be driven through the
    // concurrent (`Accessor`-based) calling convention — even the *synchronous* resource
    // constructor/methods/statics, whose default sync `TypedFunc::call` bindings an async store
    // rejects. `exports: { default: async }` gives every export an `async fn call_*` that uses
    // `call_concurrent`, which works for both the sync and the `async func` component exports.
    exports: { default: async },
});

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
    // The Golem wasmtime fork's `WasiCtxBuilder::build()` also yields an `IoCtx` that the
    // `WasiCtxView` requires; on stock wasmtime this field does not exist.
    #[cfg(feature = "use-golem-wasmtime")]
    io_ctx: wasmtime_wasi::IoCtx,
}

impl wasmtime_wasi::WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: &mut self.io_ctx,
        }
    }
}

impl WasiHttpView for Host {
    fn http(&mut self) -> WasiHttpCtxView<'_> {
        WasiHttpCtxView {
            ctx: &mut self.http,
            table: &mut self.table,
            hooks: wasmtime_wasi_http::p3::default_hooks(),
        }
    }
}

fn engine() -> Result<Engine> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.consume_fuel(false);
    Engine::new(&config)
}

fn new_store(engine: &Engine) -> Store<Host> {
    #[cfg(feature = "use-golem-wasmtime")]
    let (wasi, io_ctx) = WasiCtxBuilder::new().inherit_stdio().build();
    #[cfg(not(feature = "use-golem-wasmtime"))]
    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    Store::new(
        engine,
        Host {
            wasi,
            http: WasiHttpCtx::new(),
            table: ResourceTable::new(),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx,
        },
    )
}

fn base_linker(engine: &Engine) -> Result<Linker<Host>> {
    let mut linker = Linker::<Host>::new(engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    add_wasi_logging_stub(&mut linker)?;
    Ok(linker)
}

/// Mock logging level for `wasi:logging/logging`.
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(enum)]
#[repr(u8)]
#[allow(dead_code)]
enum LogLevel {
    #[component(name = "trace")]
    Trace,
    #[component(name = "debug")]
    Debug,
    #[component(name = "info")]
    Info,
    #[component(name = "warn")]
    Warn,
    #[component(name = "error")]
    Error,
    #[component(name = "critical")]
    Critical,
}

/// No-op `wasi:logging/logging` stub kept for feature-set parity with the shared P3 test host.
/// The generated crate in this file is built without the `logging` feature so it does not normally
/// import this interface.
fn add_wasi_logging_stub(linker: &mut Linker<Host>) -> Result<()> {
    let mut logging = linker.instance("wasi:logging/logging")?;
    logging.func_wrap(
        "log",
        |_ctx: wasmtime::StoreContextMut<'_, Host>,
         (_level, _context, _message): (LogLevel, String, String)|
         -> Result<(), wasmtime::Error> { Ok(()) },
    )?;
    Ok(())
}

/// Constructs the exported `counter`, exercises every method shape, drops it, and returns the
/// four observed values: `increment(5)`, `get()`, `staticZero()`, `incrementAsync(100)`.
async fn drive_exported_counter(component_path: &Utf8Path) -> Result<(u32, u32, u32, u32)> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let linker = base_linker(&engine)?;

    let mut store = new_store(&engine);
    let bindings = ExportedRes::instantiate_async(&mut store, &component, &linker).await?;

    // The synchronous exports (constructor, `increment`, `get`, `static-zero`) are lowered as
    // ordinary (non-`start_task`) component functions, so with `exports: { default: async }`
    // wasmtime drives them with `TypedFunc::call_async`, which takes a *store* directly and runs
    // the export to completion. Only the genuine `async func` export (`increment-async`) uses the
    // concurrent (`Accessor`-based) convention and must run inside `run_concurrent`.
    let instance;
    let after_increment;
    let value;
    let zero;
    {
        let api = bindings.test_exported_res_api();
        let counter = api.counter();
        instance = counter.call_constructor(&mut store, 10).await?;
        after_increment = counter.call_increment(&mut store, instance, 5).await?;
        value = counter.call_get(&mut store, instance).await?;
        zero = counter.call_static_zero(&mut store).await?;
    }

    // Drop the guest resource handle (the generated guest `Drop` enqueues the JS-side removal,
    // drained at the next JS entry point).
    instance.resource_drop_async(&mut store).await?;

    let async_instance;
    {
        let api = bindings.test_exported_res_api();
        let counter = api.counter();
        async_instance = counter.call_constructor(&mut store, 15).await?;
    }

    let after_async = store
        .run_concurrent(async move |accessor| -> Result<u32> {
            let api = bindings.test_exported_res_api();
            let counter = api.counter();
            counter
                .call_increment_async(accessor, async_instance, 100)
                .await
        })
        .await??;
    async_instance.resource_drop_async(&mut store).await?;

    Ok((after_increment, value, zero, after_async))
}

/// Generates a wrapper crate from `examples/p3/exported-resource` and builds it to a
/// `wasm32-wasip2` component, returning the path to the built `.wasm`.
fn generate_and_build(temp: &Utf8TempDir) -> anyhow::Result<Utf8PathBuf> {
    let manifest_dir = Utf8PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let example_dir = manifest_dir
        .join("examples")
        .join("p3")
        .join("exported-resource");
    let wit_dir = example_dir.join("wit");
    let js = example_dir.join("src").join("exported-resource.js");

    let out = temp.path().join("out");
    generate_wrapper_crate_with_target(
        &wit_dir,
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(js),
        }],
        &out,
        None,
        GenerationTarget::WasiP3,
    )?;

    let build = Command::new("cargo")
        .arg("build")
        .arg("--manifest-path")
        .arg(out.join("Cargo.toml"))
        .arg("--no-default-features")
        .arg("--features")
        .arg("p3,crypto,zlib,encoding")
        .arg("--target")
        .arg("wasm32-wasip2")
        .output()?;
    assert!(
        build.status.success(),
        "generated P3 crate for the exported-resource example should build; stdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&build.stdout),
        String::from_utf8_lossy(&build.stderr)
    );

    let metadata = Command::new("cargo")
        .arg("metadata")
        .arg("--no-deps")
        .arg("--format-version")
        .arg("1")
        .arg("--manifest-path")
        .arg(out.join("Cargo.toml"))
        .output()?;
    assert!(metadata.status.success(), "cargo metadata should succeed");
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)?;
    let target_dir = metadata["target_directory"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("missing target_directory in cargo metadata"))?;

    Ok(Utf8PathBuf::from(target_dir)
        .join("wasm32-wasip2")
        .join("debug")
        .join("exported_res.wasm"))
}

/// Runs `fut` on a fresh multi-thread tokio runtime, failing the test if it does not complete
/// within `secs`. A timeout here means the guest resource interaction deadlocked.
fn block_on_with_timeout<F, T, E>(secs: u64, fut: F) -> T
where
    F: Future<Output = std::result::Result<T, E>>,
    E: std::fmt::Debug,
{
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build tokio runtime");
    rt.block_on(async {
        match tokio::time::timeout(Duration::from_secs(secs), fut).await {
            Ok(result) => result.expect("guest call failed"),
            Err(_) => {
                panic!("guest call did not complete within {secs}s (resource deadlock regression)")
            }
        }
    })
}

#[test]
fn p3_exported_resource_roundtrip() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp).expect("generate + build");

    let (after_increment, value, zero, after_async) =
        block_on_with_timeout(120, drive_exported_counter(&wasm));

    // JS: new Counter(10); increment(5) -> 15; get() -> 15; staticZero() -> 0;
    //     new Counter(15).incrementAsync(100) -> 115.
    assert_eq!(after_increment, 15, "increment(5) should return 15");
    assert_eq!(value, 15, "get() should return 15");
    assert_eq!(zero, 0, "staticZero() should return 0");
    assert_eq!(after_async, 115, "incrementAsync(100) should return 115");
}

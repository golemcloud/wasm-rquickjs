use anyhow::{Result, anyhow};
use wasmtime::component::bindgen;
use wasmtime::component::{Component, Linker, ResourceTable};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p3::{WasiHttpCtxView, WasiHttpView};

bindgen!({
    world: "exported-res",
    path: "../exported-resource/wit",
    // The store is async (component-model-async), so every guest export must be driven through an
    // async calling convention. `exports: { default: async }` makes the synchronous exports
    // (constructor, `increment`, `get`, `static-zero`) use `TypedFunc::call_async` (which takes a
    // store) instead of the sync `TypedFunc::call` that an async store rejects; the `async func`
    // export (`increment-async`) uses the concurrent (`Accessor`-based) convention.
    exports: { default: async },
});

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
}

impl wasmtime_wasi::WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
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

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tmp/p3-exported-resource/Cargo.toml"
    );
    let status = std::process::Command::new("cargo")
        .args([
            "build",
            "--manifest-path",
            manifest,
            "--target",
            "wasm32-wasip2",
        ])
        .status()?;
    if !status.success() {
        return Err(anyhow!("component build failed with {status}"));
    }
    let output = std::process::Command::new("cargo")
        .args([
            "metadata",
            "--no-deps",
            "--format-version",
            "1",
            "--manifest-path",
            manifest,
        ])
        .output()?;
    if !output.status.success() {
        return Err(anyhow!("cargo metadata failed"));
    }
    let json: serde_json::Value = serde_json::from_slice(&output.stdout)?;
    let target_dir = json["target_directory"]
        .as_str()
        .ok_or_else(|| anyhow!("missing target_directory"))?;
    Ok(format!(
        "{target_dir}/wasm32-wasip2/debug/exported_res.wasm"
    ))
}

async fn instantiate() -> Result<(Store<Host>, ExportedRes)> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.consume_fuel(false);

    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, component_path()?)
        .map_err(|e| anyhow!("load component: {e:#}"))?;
    let mut linker = Linker::<Host>::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            http: WasiHttpCtx::new(),
            table: ResourceTable::new(),
        },
    );
    let bindings = ExportedRes::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

#[tokio::main]
async fn main() -> Result<()> {
    let (mut store, bindings) = instantiate().await?;

    // The synchronous exports (constructor, `increment`, `get`, `static-zero`) are lowered as
    // ordinary (non-`start_task`) component functions, so wasmtime drives them with
    // `TypedFunc::call_async`, which takes a *store* directly. Only the genuine `async func` export
    // (`increment-async`) uses the concurrent (`Accessor`-based) convention inside `run_concurrent`.
    let instance;
    let after_increment;
    let value;
    let zero;
    {
        let api = bindings.test_exported_res_api();
        let counter = api.counter();
        // constructor(10)
        instance = counter.call_constructor(&mut store, 10).await?;
        // increment(5) -> 15
        after_increment = counter.call_increment(&mut store, instance, 5).await?;
        // get() -> 15
        value = counter.call_get(&mut store, instance).await?;
        // static-zero() -> 0
        zero = counter.call_static_zero(&mut store).await?;
    }

    // increment-async(100) -> 115
    let after_async = store
        .run_concurrent(async move |accessor| -> wasmtime::Result<u32> {
            let api = bindings.test_exported_res_api();
            let counter = api.counter();
            counter.call_increment_async(accessor, instance, 100).await
        })
        .await??;

    // Drop the guest resource handle.
    instance.resource_drop_async(&mut store).await?;

    println!("increment(5) = {after_increment}");
    println!("get() = {value}");
    println!("staticZero() = {zero}");
    println!("incrementAsync(100) = {after_async}");
    assert_eq!(after_increment, 15, "increment(5) should return 15");
    assert_eq!(value, 15, "get() should return 15");
    assert_eq!(zero, 0, "staticZero() should return 0");
    assert_eq!(after_async, 115, "incrementAsync(100) should return 115");
    println!("OK: exported-resource constructor/method/static/async/drop all correct");
    Ok(())
}

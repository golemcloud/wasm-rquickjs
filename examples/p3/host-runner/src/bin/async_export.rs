use anyhow::{Result, anyhow};
use wasmtime::component::bindgen;
use wasmtime::component::{Component, Linker};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};

bindgen!({
    world: "async-export",
    path: "../async-export/wit",
});

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
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

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tmp/p3-async-export/Cargo.toml"
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
        "{target_dir}/wasm32-wasip2/debug/async_export.wasm"
    ))
}

async fn instantiate() -> Result<(Store<Host>, AsyncExport)> {
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

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            table: ResourceTable::new(),
        },
    );
    let bindings = AsyncExport::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

#[tokio::main]
async fn main() -> Result<()> {
    let (mut store, bindings) = instantiate().await?;
    let (run_result, add_result) = store
        .run_concurrent(async move |accessor| -> Result<(String, u32)> {
            let r = bindings.call_run(accessor).await?;
            let a = bindings.call_add(accessor, 2, 40).await?;
            Ok((r, a))
        })
        .await??;
    println!("run() = {run_result:?}");
    println!("add(2, 40) = {add_result}");
    assert_eq!(run_result, "hello from p3");
    assert_eq!(add_result, 42);
    println!("OK: async-export run()==\"hello from p3\", add(2,40)==42");
    Ok(())
}

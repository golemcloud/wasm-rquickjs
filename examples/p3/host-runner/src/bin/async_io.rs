use anyhow::{Result, anyhow};
use wasmtime::component::{Component, HasSelf, Linker, bindgen};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};

bindgen!({
    world: "async-io",
    path: "../async-io/wit",
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

impl test::async_io::host::Host for Host {}

impl test::async_io::host::HostWithStore for HasSelf<Host> {
    async fn host_delay<T: Send>(
        _accessor: &wasmtime::component::Accessor<T, Self>,
        ms: u32,
    ) -> u32 {
        tokio::time::sleep(std::time::Duration::from_millis(ms as u64)).await;
        ms + 1000
    }
}

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tmp/p3-async-io/Cargo.toml"
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
    Ok(format!("{target_dir}/wasm32-wasip2/debug/async_io.wasm"))
}

async fn instantiate() -> Result<(Store<Host>, AsyncIo)> {
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
    test::async_io::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            table: ResourceTable::new(),
        },
    );
    let bindings = AsyncIo::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

async fn call_run(ms: u32) -> Result<u32> {
    let (mut store, bindings) = instantiate().await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run(accessor, ms).await)
        .await??;
    println!("run({ms}) = {result}");
    Ok(result)
}

#[tokio::main]
async fn main() -> Result<()> {
    // host_delay(ms) = ms + 1000; JS run(ms) = host_delay(ms) + 1
    let result = call_run(10).await?;
    assert_eq!(result, 1011, "expected run(10) == 1011, got {result}");
    println!("OK: run(10) == 1011");
    Ok(())
}

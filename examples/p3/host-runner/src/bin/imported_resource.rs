use anyhow::{Result, anyhow};
use wasmtime::component::bindgen;
use wasmtime::component::{Component, HasSelf, Linker, Resource, ResourceTable};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{WasiCtxBuilder, WasiCtxView};

/// Host-side state for the imported `counter` resource.
pub struct Counter {
    value: u32,
}

bindgen!({
    world: "res",
    path: "../imported-resource/wit",
    with: {
        "test:res/host.counter": Counter,
    },
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

impl test::res::host::Host for Host {}

impl test::res::host::HostCounter for Host {
    fn new(&mut self, initial: u32) -> Resource<Counter> {
        self.table.push(Counter { value: initial }).unwrap()
    }

    fn increment(&mut self, self_: Resource<Counter>, by: u32) -> u32 {
        let c = self.table.get_mut(&self_).unwrap();
        c.value += by;
        c.value
    }

    fn get(&mut self, self_: Resource<Counter>) -> u32 {
        self.table.get(&self_).unwrap().value
    }

    fn static_zero(&mut self) -> u32 {
        0
    }

    fn drop(&mut self, rep: Resource<Counter>) -> std::result::Result<(), wasmtime::Error> {
        self.table.delete(rep)?;
        Ok(())
    }
}

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tmp/p3-imported-resource/Cargo.toml"
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
    Ok(format!("{target_dir}/wasm32-wasip2/debug/res.wasm"))
}

async fn instantiate() -> Result<(Store<Host>, Res)> {
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
    test::res::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            table: ResourceTable::new(),
        },
    );
    let bindings = Res::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

#[tokio::main]
async fn main() -> Result<()> {
    let (mut store, bindings) = instantiate().await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run(accessor).await)
        .await??;
    println!("run() = {result}");
    // JS: new Counter(10); increment(5) -> 15; get() -> 15; Counter.staticZero() -> 0; 15 + 0
    assert_eq!(result, 15, "expected run() == 15, got {result}");
    println!("OK: imported-resource run() == 15");
    Ok(())
}

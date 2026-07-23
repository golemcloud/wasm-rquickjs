//! Host-runner for the `test:async-values` world, exercising `future<T>` / `stream<T>` at both
//! *export* boundaries:
//!
//!   * `run-future` / `run-stream`: the JS export returns a future/stream to the host, which the
//!     host reads (via a `oneshot` / `mpsc` consumer).
//!   * `take-future` / `take-stream`: the host passes a future/stream to the JS export, which the
//!     JS awaits / iterates and returns an aggregate.

use anyhow::{Result, anyhow};
use futures::StreamExt;
use futures::channel::{mpsc, oneshot};
use p3_host_runner::util::{OneshotConsumer, OneshotProducer, PipeConsumer, PipeProducer};
use wasmtime::component::{Component, FutureReader, Linker, StreamReader, bindgen};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p3::{WasiHttpCtxView, WasiHttpView};

bindgen!({
    world: "async-values",
    path: "../async-values/wit",
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
        "/../../../tmp/p3-async-values/Cargo.toml"
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
    Ok(format!("{target_dir}/wasm32-wasip2/debug/async_values.wasm"))
}

async fn instantiate() -> Result<(Store<Host>, AsyncValues)> {
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
    let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

/// `run-future` returns a `future<u32>`; the JS side resolves it to 42.
async fn call_run_future() -> Result<u32> {
    let (mut store, bindings) = instantiate().await?;
    let value = store
        .run_concurrent(async move |accessor| -> Result<u32> {
            let reader: FutureReader<u32> = bindings.call_run_future(accessor).await?;
            let (tx, rx) = oneshot::channel();
            accessor.with(|access| reader.pipe(access, OneshotConsumer::new(tx)))?;
            Ok(rx.await?)
        })
        .await??;
    println!("run_future() = {value}");
    Ok(value)
}

/// `run-stream` returns a `stream<u8>`; the JS side yields 1..=5.
async fn call_run_stream() -> Result<Vec<u8>> {
    let (mut store, bindings) = instantiate().await?;
    let items = store
        .run_concurrent(async move |accessor| -> Result<Vec<u8>> {
            let reader: StreamReader<u8> = bindings.call_run_stream(accessor).await?;
            let (tx, rx) = mpsc::channel::<u8>(16);
            accessor.with(|access| reader.pipe(access, PipeConsumer::new(tx)))?;
            Ok(rx.collect::<Vec<u8>>().await)
        })
        .await??;
    println!("run_stream() = {items:?}");
    Ok(items)
}

/// `take-future(f)` awaits the host-provided `future<u32>` and returns `value + 1`.
async fn call_take_future(value: u32) -> Result<u32> {
    let (mut store, bindings) = instantiate().await?;
    let (tx, rx) = oneshot::channel::<u32>();
    tx.send(value).map_err(|_| anyhow!("send failed"))?;
    let reader = FutureReader::new(&mut store, OneshotProducer::new(rx))?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_take_future(accessor, reader).await)
        .await??;
    println!("take_future({value}) = {result}");
    Ok(result)
}

/// `take-stream(s)` sums the host-provided `stream<u8>`.
async fn call_take_stream(items: Vec<u8>) -> Result<u32> {
    let (mut store, bindings) = instantiate().await?;
    let reader = StreamReader::new(&mut store, PipeProducer::new(futures::stream::iter(items)))?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_take_stream(accessor, reader).await)
        .await??;
    println!("take_stream(..) = {result}");
    Ok(result)
}

#[tokio::main]
async fn main() -> Result<()> {
    let run_future = call_run_future().await?;
    assert_eq!(run_future, 42, "expected run_future() == 42, got {run_future}");

    let run_stream = call_run_stream().await?;
    assert_eq!(
        run_stream,
        vec![1, 2, 3, 4, 5],
        "expected run_stream() == [1,2,3,4,5], got {run_stream:?}"
    );

    let take_future = call_take_future(41).await?;
    assert_eq!(
        take_future, 42,
        "expected take_future(41) == 42, got {take_future}"
    );

    let take_stream = call_take_stream(vec![10, 20, 30]).await?;
    assert_eq!(
        take_stream, 60,
        "expected take_stream([10,20,30]) == 60, got {take_stream}"
    );

    println!(
        "OK: run_future==42, run_stream==[1..5], take_future(41)==42, take_stream([10,20,30])==60"
    );
    Ok(())
}

//! Host-runner for the `test:async-values-import` world, exercising `future<T>` / `stream<T>` at
//! both *import* boundaries:
//!
//!   * `make-future` / `make-stream`: the host returns a future/stream to the guest, which the JS
//!     code awaits / iterates.
//!   * `consume-future` / `consume-stream`: the JS code passes a future/stream to the host, which
//!     the host reads (via a `oneshot` / `mpsc` consumer).

use anyhow::{Result, anyhow};
use futures::StreamExt;
use futures::channel::{mpsc, oneshot};
use p3_host_runner::util::{OneshotConsumer, OneshotProducer, PipeConsumer, PipeProducer};
use wasmtime::component::{
    Access, Accessor, Component, FutureReader, HasSelf, Linker, StreamReader, bindgen,
};
use wasmtime::{Config, Engine, Store};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p3::{WasiHttpCtxView, WasiHttpView};

bindgen!({
    world: "async-values-import",
    path: "../async-values-import/wit",
    // `make-future` / `make-stream` are synchronous WIT imports that return a `future` / `stream`.
    // Constructing the host write end requires store access, so request the `store` form of these
    // imports (an `Accessor`-based `HostWithStore` method) as wasmtime's own tests do.
    imports: {
        "test:async-values-import/host.make-future": store,
        "test:async-values-import/host.make-stream": store,
    },
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

impl test::async_values_import::host::Host for Host {}

impl test::async_values_import::host::HostWithStore for HasSelf<Host> {
    fn make_future<T>(mut host: Access<T, Self>, x: u32) -> FutureReader<u32> {
        // Construct a component `future<u32>` whose value is `x`, resolved immediately.
        let (tx, rx) = oneshot::channel();
        let _ = tx.send(x);
        FutureReader::new(&mut host, OneshotProducer::new(rx)).expect("failed to create future")
    }

    fn make_stream<T>(mut host: Access<T, Self>, n: u32) -> StreamReader<u8> {
        // Construct a component `stream<u8>` yielding `1, 2, ..., n`.
        let items: Vec<u8> = (1..=n).map(|i| i as u8).collect();
        StreamReader::new(&mut host, PipeProducer::new(futures::stream::iter(items)))
            .expect("failed to create stream")
    }

    async fn consume_future<T: Send>(
        accessor: &Accessor<T, Self>,
        f: FutureReader<u32>,
    ) -> u32 {
        let (tx, rx) = oneshot::channel();
        accessor
            .with(|access| f.pipe(access, OneshotConsumer::new(tx)))
            .expect("failed to pipe host future");
        rx.await.expect("host future did not resolve")
    }

    async fn consume_stream<T: Send>(
        accessor: &Accessor<T, Self>,
        s: StreamReader<u8>,
    ) -> u32 {
        let (tx, rx) = mpsc::channel::<u8>(16);
        accessor
            .with(|access| s.pipe(access, PipeConsumer::new(tx)))
            .expect("failed to pipe host stream");
        rx.map(|b| b as u32)
            .fold(0u32, |acc, v| async move { acc + v })
            .await
    }
}

fn component_path() -> Result<String> {
    if let Ok(path) = std::env::var("P3_COMPONENT") {
        return Ok(path);
    }
    let manifest = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../../tmp/p3-async-values-import/Cargo.toml"
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
        "{target_dir}/wasm32-wasip2/debug/async_values_import.wasm"
    ))
}

async fn instantiate() -> Result<(Store<Host>, AsyncValuesImport)> {
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
    test::async_values_import::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            http: WasiHttpCtx::new(),
            table: ResourceTable::new(),
        },
    );
    let bindings = AsyncValuesImport::instantiate_async(&mut store, &component, &linker).await?;
    Ok((store, bindings))
}

#[tokio::main]
async fn main() -> Result<()> {
    let (mut store, bindings) = instantiate().await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run(accessor).await)
        .await??;
    println!("run() = {result:?}");
    assert_eq!(
        result, "41|1,2,3,4|7|10",
        "expected run() == \"41|1,2,3,4|7|10\", got {result:?}"
    );
    println!("OK: async-values-import run() == \"41|1,2,3,4|7|10\"");
    Ok(())
}

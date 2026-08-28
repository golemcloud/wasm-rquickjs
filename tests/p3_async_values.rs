//! End-to-end runtime tests for WASI Preview 3 `future<T>` / `stream<T>` values at all four
//! JS ⇄ component function boundaries (Phase 3, part 2):
//!
//!   * export returning a future/stream (`run-future` / `run-stream`)
//!   * export receiving a future/stream (`take-future` / `take-stream`)
//!   * import returning a future/stream (`make-future` / `make-stream`)
//!   * import receiving a future/stream (`consume-future` / `consume-stream`)
//!
//! The two components under test are generated from the committed examples under
//! `examples/p3/async-values` and `examples/p3/async-values-import`, then instantiated in an
//! embedded wasmtime host that provides the host read/write ends of the futures/streams.
//!
//! Every guest call is wrapped in a hard timeout: the import-parameter path in particular used to
//! deadlock (a cross-executor lost-wakeup between the rquickjs scheduler and the wit-bindgen
//! writer tasks), so a regression must surface as a **test failure**, never a hung `cargo test`.

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use futures::channel::{mpsc, oneshot};
use futures::{Sink, Stream, StreamExt};
use std::future::Future;
use std::marker::PhantomData;
use std::pin::Pin;
use std::process::Command;
use std::task::{Context, Poll};
use std::time::Duration;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{
    Access, Accessor, Component, Destination, FutureConsumer, FutureProducer, FutureReader,
    HasSelf, Lift, Linker, Lower, Source, StreamConsumer, StreamProducer, StreamReader,
    StreamResult, bindgen,
};
use wasmtime::{Config, Engine, Result, Store, StoreContextMut};
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p3::{WasiHttpCtxView, WasiHttpView};

mod export_bindings {
    use wasmtime::component::bindgen;

    bindgen!({
        world: "async-values",
        path: "examples/p3/async-values/wit",
    });
}

use export_bindings::AsyncValues;

bindgen!({
    world: "async-values-import",
    path: "examples/p3/async-values-import/wit",
    // `make-future` / `make-stream` are synchronous WIT imports that return a `future` / `stream`.
    // Constructing the host write end requires store access, so request the `store` form of these
    // imports (an `Accessor`-based `HostWithStore` method) as wasmtime's own tests do.
    imports: {
        "test:async-values-import/host.make-future": store,
        "test:async-values-import/host.make-stream": store,
    },
});

// ---------------------------------------------------------------------------------------------
// Host state
// ---------------------------------------------------------------------------------------------

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
    stored_future: Option<oneshot::Receiver<u32>>,
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

impl test::async_values_import::host::Host for Host {}

impl<T> test::async_values_import::host::HostWithStore<T> for HasSelf<Host> {
    fn make_future(mut host: Access<T, Self>, x: u32) -> FutureReader<u32> {
        // Construct a component `future<u32>` whose value is `x`, resolved immediately.
        let (tx, rx) = oneshot::channel();
        let _ = tx.send(x);
        FutureReader::new(&mut host, OneshotProducer::new(rx)).expect("failed to create future")
    }

    fn make_stream(mut host: Access<T, Self>, n: u32) -> StreamReader<u8> {
        // Construct a component `stream<u8>` yielding `1, 2, ..., n`.
        let items: Vec<u8> = (1..=n).map(|i| i as u8).collect();
        StreamReader::new(&mut host, PipeProducer::new(futures::stream::iter(items)))
            .expect("failed to create stream")
    }

    async fn consume_future(accessor: &Accessor<T, Self>, f: FutureReader<u32>) -> u32 {
        let (tx, rx) = oneshot::channel();
        accessor
            .with(|access| f.pipe(access, OneshotConsumer::new(tx)))
            .expect("failed to pipe host future");
        rx.await.expect("host future did not resolve")
    }

    async fn consume_stream(accessor: &Accessor<T, Self>, s: StreamReader<u8>) -> u32 {
        let (tx, rx) = mpsc::channel::<u8>(16);
        accessor
            .with(|access| s.pipe(access, PipeConsumer::new(tx)))
            .expect("failed to pipe host stream");
        rx.map(|b| b as u32)
            .fold(0u32, |acc, v| async move { acc + v })
            .await
    }

    async fn store_future(accessor: &Accessor<T, Self>, f: FutureReader<u32>) {
        let (tx, rx) = oneshot::channel();
        accessor
            .with(|mut access| {
                access.get().stored_future = Some(rx);
                f.pipe(access, OneshotConsumer::new(tx))
            })
            .expect("failed to pipe stored host future");
    }

    async fn read_stored_future(accessor: &Accessor<T, Self>) -> u32 {
        let rx = accessor
            .with(|mut access| access.get().stored_future.take())
            .expect("no stored host future");
        rx.await.expect("stored host future did not resolve")
    }
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
            stored_future: None,
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx,
        },
    )
}

fn engine() -> Result<Engine> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.consume_fuel(false);
    Engine::new(&config)
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
/// The generated crates in this file are built without the `logging` feature so they do not
/// normally import this interface.
fn add_wasi_logging_stub(linker: &mut Linker<Host>) -> Result<()> {
    let mut logging = linker.instance("wasi:logging/logging")?;
    logging.func_wrap(
        "log",
        |_ctx: StoreContextMut<'_, Host>,
         (_level, _context, _message): (LogLevel, String, String)|
         -> Result<(), wasmtime::Error> { Ok(()) },
    )?;
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// Export-boundary world (`test:async-values`)
// ---------------------------------------------------------------------------------------------

async fn run_export_world(
    component_path: &Utf8Path,
) -> Result<(
    u32,
    Vec<u8>,
    String,
    u32,
    Vec<u8>,
    Vec<u8>,
    String,
    u32,
    u32,
    u32,
)> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let linker = base_linker(&engine)?;

    // `run-future` returns a `future<u32>`; the JS side resolves it to 42.
    let run_future = {
        let mut store = new_store(&engine);
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| -> Result<u32> {
                let reader: FutureReader<u32> = bindings.call_run_future(accessor).await?;
                let (tx, rx) = oneshot::channel();
                accessor.with(|access| reader.pipe(access, OneshotConsumer::new(tx)))?;
                Ok(rx.await?)
            })
            .await??
    };

    // A direct future<T> return uses call_js_export_raw. Its host boundary must run the rejection
    // checkpoint before the next exported call reads the listener's state.
    let checkpoint_count = {
        let mut store = new_store(&engine);
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| -> Result<u32> {
                let reader: FutureReader<u32> =
                    bindings.call_run_checkpoint_future(accessor).await?;
                let (tx, rx) = oneshot::channel();
                accessor.with(|access| reader.pipe(access, OneshotConsumer::new(tx)))?;
                assert_eq!(rx.await?, 7, "checkpoint future should resolve to 7");
                bindings.call_read_checkpoint_count(accessor).await
            })
            .await??
    };

    // `run-stream` returns a `stream<u8>`; the JS side yields 1..=5.
    let run_stream = {
        let mut store = new_store(&engine);
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| -> Result<Vec<u8>> {
                let reader: StreamReader<u8> = bindings.call_run_stream(accessor).await?;
                let (tx, rx) = mpsc::channel::<u8>(16);
                accessor.with(|access| reader.pipe(access, PipeConsumer::new(tx)))?;
                Ok(rx.collect::<Vec<u8>>().await)
            })
            .await??
    };

    // `run-nested` returns a record containing both a future and optional streams. The record must
    // be returned before the host can attach consumers, so waiting for either writer in the guest
    // export path would deadlock this call.
    let (nested_label, nested_future, nested_stdout, nested_stderr) = {
        let mut store = new_store(&engine);
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(
                async move |accessor| -> Result<(String, u32, Vec<u8>, Vec<u8>)> {
                    let nested = bindings
                        .call_run_nested(accessor)
                        .await?
                        .expect("run-nested should return the success arm");

                    let (future_tx, future_rx) = oneshot::channel();
                    accessor.with(|access| {
                        nested
                            .future_value
                            .pipe(access, OneshotConsumer::new(future_tx))
                    })?;

                    let stdout = nested.stdout.expect("nested stdout should be present");
                    let (stdout_tx, stdout_rx) = mpsc::channel::<u8>(16);
                    accessor.with(|access| stdout.pipe(access, PipeConsumer::new(stdout_tx)))?;

                    let stderr = nested.stderr.expect("nested stderr should be present");
                    let (stderr_tx, stderr_rx) = mpsc::channel::<u8>(16);
                    accessor.with(|access| stderr.pipe(access, PipeConsumer::new(stderr_tx)))?;

                    let (future_value, stdout, stderr) = futures::join!(
                        future_rx,
                        stdout_rx.collect::<Vec<_>>(),
                        stderr_rx.collect::<Vec<_>>(),
                    );
                    Ok((nested.label, future_value?, stdout, stderr))
                },
            )
            .await??
    };

    let nested_error = {
        let mut store = new_store(&engine);
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| -> Result<String> {
                match bindings.call_run_nested_error(accessor).await? {
                    Ok(_) => panic!("run-nested-error should return the error arm"),
                    Err(error) => Ok(error),
                }
            })
            .await??
    };

    // `take-future(f)` awaits a host-provided `future<u32>` and returns `value + 1`.
    let take_future = {
        let mut store = new_store(&engine);
        let (tx, rx) = oneshot::channel::<u32>();
        tx.send(41).expect("oneshot send failed");
        let reader = FutureReader::new(&mut store, OneshotProducer::new(rx))?;
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| bindings.call_take_future(accessor, reader).await)
            .await??
    };

    // `take-stream(s)` sums a host-provided `stream<u8>`.
    let take_stream = {
        let mut store = new_store(&engine);
        let reader = StreamReader::new(
            &mut store,
            PipeProducer::new(futures::stream::iter(vec![10u8, 20, 30])),
        )?;
        let bindings = AsyncValues::instantiate_async(&mut store, &component, &linker).await?;
        store
            .run_concurrent(async move |accessor| bindings.call_take_stream(accessor, reader).await)
            .await??
    };

    Ok((
        run_future,
        run_stream,
        nested_label,
        nested_future,
        nested_stdout,
        nested_stderr,
        nested_error,
        take_future,
        take_stream,
        checkpoint_count,
    ))
}

// ---------------------------------------------------------------------------------------------
// Import-boundary world (`test:async-values-import`)
// ---------------------------------------------------------------------------------------------

async fn run_import_world(component_path: &Utf8Path) -> Result<String> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = base_linker(&engine)?;
    test::async_values_import::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let mut store = new_store(&engine);
    let bindings = AsyncValuesImport::instantiate_async(&mut store, &component, &linker).await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run(accessor).await)
        .await??;
    Ok(result)
}

async fn run_import_world_promise_stream_items(component_path: &Utf8Path) -> Result<String> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = base_linker(&engine)?;
    test::async_values_import::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let mut store = new_store(&engine);
    let bindings = AsyncValuesImport::instantiate_async(&mut store, &component, &linker).await?;
    let result = store
        .run_concurrent(async move |accessor| {
            bindings.call_run_promise_stream_items(accessor).await
        })
        .await??;
    Ok(result)
}

async fn run_import_world_stored_future(component_path: &Utf8Path) -> Result<String> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = base_linker(&engine)?;
    test::async_values_import::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let mut store = new_store(&engine);
    let bindings = AsyncValuesImport::instantiate_async(&mut store, &component, &linker).await?;
    let result = store
        .run_concurrent(async move |accessor| bindings.call_run_stored_future(accessor).await)
        .await??;
    Ok(result)
}

async fn run_import_world_checkpoint(component_path: &Utf8Path) -> Result<u32> {
    let engine = engine()?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = base_linker(&engine)?;
    test::async_values_import::host::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |h| h)?;

    let mut store = new_store(&engine);
    let bindings = AsyncValuesImport::instantiate_async(&mut store, &component, &linker).await?;
    store
        .run_concurrent(async move |accessor| -> Result<u32> {
            let reader: FutureReader<u32> =
                bindings.call_run_import_checkpoint_future(accessor).await?;
            let (tx, rx) = oneshot::channel();
            accessor.with(|access| reader.pipe(access, OneshotConsumer::new(tx)))?;
            assert_eq!(rx.await?, 9, "checkpoint import future should resolve to 9");
            bindings.call_read_import_checkpoint_count(accessor).await
        })
        .await?
}

// ---------------------------------------------------------------------------------------------
// Component generation + build
// ---------------------------------------------------------------------------------------------

/// Generates a wrapper crate from a committed `examples/p3/<example>` directory and builds it to a
/// `wasm32-wasip2` component. Returns the path to the built `.wasm`.
fn generate_and_build(
    temp: &Utf8TempDir,
    example: &str,
    wasm_name: &str,
) -> anyhow::Result<Utf8PathBuf> {
    let manifest_dir = Utf8PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let example_dir = manifest_dir.join("examples").join("p3").join(example);
    let wit_dir = example_dir.join("wit");
    let js = example_dir.join("src").join(format!("{example}.js"));

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
        "generated P3 crate for `{example}` should build; stdout:\n{}\nstderr:\n{}",
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
        .ok_or_else(|| anyhow_msg("missing target_directory in cargo metadata"))?;

    Ok(Utf8PathBuf::from(target_dir)
        .join("wasm32-wasip2")
        .join("debug")
        .join(format!("{wasm_name}.wasm")))
}

// ---------------------------------------------------------------------------------------------
// Timeout-guarded runtime driver
// ---------------------------------------------------------------------------------------------

/// Runs `fut` on a fresh multi-thread tokio runtime, failing the test if it does not complete
/// within `secs`. A timeout here means a guest future/stream deadlocked.
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
            Err(_) => panic!(
                "guest call did not complete within {secs}s (future/stream deadlock regression)"
            ),
        }
    })
}

fn anyhow_msg(msg: &'static str) -> anyhow::Error {
    anyhow::anyhow!(msg)
}

// ---------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------

#[test]
fn p3_async_values_export_boundaries_roundtrip() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp, "async-values", "async_values").expect("generate + build");

    let (
        run_future,
        run_stream,
        nested_label,
        nested_future,
        nested_stdout,
        nested_stderr,
        nested_error,
        take_future,
        take_stream,
        checkpoint_count,
    ) = block_on_with_timeout(120, run_export_world(&wasm));

    assert_eq!(run_future, 42, "run-future should return 42");
    assert_eq!(
        run_stream,
        vec![1, 2, 3, 4, 5],
        "run-stream should yield 1..=5"
    );
    assert_eq!(nested_label, "nested-ok");
    assert_eq!(nested_future, 99);
    assert_eq!(nested_stdout, vec![6, 7, 8]);
    assert_eq!(nested_stderr, vec![9, 10]);
    assert_eq!(nested_error, "nested-error");
    assert_eq!(take_future, 42, "take-future(41) should return 42");
    assert_eq!(take_stream, 60, "take-stream([10,20,30]) should return 60");
    assert_eq!(
        checkpoint_count, 1,
        "the raw future export should checkpoint before the next host call"
    );
}

#[test]
fn p3_async_values_import_boundaries_roundtrip() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp, "async-values-import", "async_values_import")
        .expect("generate + build");

    let result = block_on_with_timeout(120, run_import_world(&wasm));

    // `41` from make-future, `1,2,3,4` from make-stream, `7` from consume-future(Promise.resolve(7)),
    // `10` from consume-stream(async generator yielding 2,3,5).
    assert_eq!(result, "41|1,2,3,4|7|10");
}

#[test]
fn p3_async_values_import_stream_accepts_promise_items_from_sync_iterable() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp, "async-values-import", "async_values_import")
        .expect("generate + build");

    let result = block_on_with_timeout(120, run_import_world_promise_stream_items(&wasm));

    assert_eq!(result, "10");
}

#[test]
fn p3_async_values_import_future_param_can_be_consumed_after_import_returns() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp, "async-values-import", "async_values_import")
        .expect("generate + build");

    let result = block_on_with_timeout(120, run_import_world_stored_future(&wasm));

    assert_eq!(result, "99");
}

#[test]
fn p3_async_values_import_settlement_runs_rejection_checkpoint() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = generate_and_build(&temp, "async-values-import", "async_values_import")
        .expect("generate + build");

    let checkpoint_count = block_on_with_timeout(120, run_import_world_checkpoint(&wasm));

    assert_eq!(
        checkpoint_count, 1,
        "async import settlement should checkpoint before the next host call"
    );
}

// ---------------------------------------------------------------------------------------------
// Host-side producers/consumers for Component Model `future<T>` / `stream<T>` values.
//
// Adapted from wasmtime's own `component-async-tests` test utilities
// (`crates/misc/component-async-tests/src/util.rs`), which are not published on crates.io.
// ---------------------------------------------------------------------------------------------

/// Produces the items of a component `stream<T>` from a `futures::Stream`.
struct PipeProducer<S>(S);

impl<S> PipeProducer<S> {
    fn new(rx: S) -> Self {
        Self(rx)
    }
}

impl<D, T: Send + Sync + Lower + 'static, S: Stream<Item = T> + Send + 'static> StreamProducer<D>
    for PipeProducer<S>
{
    type Item = T;
    type Buffer = Option<T>;

    fn poll_produce<'a>(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        _: StoreContextMut<D>,
        mut destination: Destination<'a, Self::Item, Self::Buffer>,
        finish: bool,
    ) -> Poll<Result<StreamResult>> {
        // SAFETY: standard pin-projection; we never move out of `self`.
        let stream = unsafe { self.map_unchecked_mut(|v| &mut v.0) };

        match stream.poll_next(cx) {
            Poll::Pending => {
                if finish {
                    Poll::Ready(Ok(StreamResult::Cancelled))
                } else {
                    Poll::Pending
                }
            }
            Poll::Ready(Some(item)) => {
                destination.set_buffer(Some(item));
                Poll::Ready(Ok(StreamResult::Completed))
            }
            Poll::Ready(None) => Poll::Ready(Ok(StreamResult::Dropped)),
        }
    }
}

/// Consumes the items of a component `stream<T>` into a `futures::Sink`.
struct PipeConsumer<T, S>(S, PhantomData<fn() -> T>);

impl<T, S> PipeConsumer<T, S> {
    fn new(tx: S) -> Self {
        Self(tx, PhantomData)
    }
}

impl<D, T: Lift + 'static, S: Sink<T, Error: std::error::Error + Send + Sync> + Send + 'static>
    StreamConsumer<D> for PipeConsumer<T, S>
{
    type Item = T;

    fn poll_consume(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        store: StoreContextMut<D>,
        mut source: Source<Self::Item>,
        finish: bool,
    ) -> Poll<Result<StreamResult>> {
        // SAFETY: standard pin-projection; we never move out of `self`.
        let mut sink = unsafe { self.map_unchecked_mut(|v| &mut v.0) };

        let on_pending = || {
            if finish {
                Poll::Ready(Ok(StreamResult::Cancelled))
            } else {
                Poll::Pending
            }
        };

        match sink.as_mut().poll_flush(cx) {
            Poll::Pending => on_pending(),
            Poll::Ready(result) => {
                result?;
                match sink.as_mut().poll_ready(cx) {
                    Poll::Pending => on_pending(),
                    Poll::Ready(result) => {
                        result?;
                        let item = &mut None;
                        source.read(store, item)?;
                        sink.start_send(item.take().unwrap())?;
                        Poll::Ready(Ok(StreamResult::Completed))
                    }
                }
            }
        }
    }
}

/// Produces the value of a component `future<T>` from a `oneshot::Receiver`.
struct OneshotProducer<T>(oneshot::Receiver<T>);

impl<T> OneshotProducer<T> {
    fn new(rx: oneshot::Receiver<T>) -> Self {
        Self(rx)
    }
}

impl<D, T: Send + 'static> FutureProducer<D> for OneshotProducer<T> {
    type Item = T;

    fn poll_produce(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        _: StoreContextMut<D>,
        finish: bool,
    ) -> Poll<Result<Option<T>>> {
        match Pin::new(&mut self.get_mut().0).poll(cx) {
            Poll::Pending if finish => Poll::Ready(Ok(None)),
            Poll::Pending => Poll::Pending,
            Poll::Ready(result) => Poll::Ready(Ok(Some(result?))),
        }
    }
}

/// Consumes the value of a component `future<T>` into a `oneshot::Sender`.
struct OneshotConsumer<T>(Option<oneshot::Sender<T>>);

impl<T> OneshotConsumer<T> {
    fn new(tx: oneshot::Sender<T>) -> Self {
        Self(Some(tx))
    }
}

impl<D, T: Lift + Send + 'static> FutureConsumer<D> for OneshotConsumer<T> {
    type Item = T;

    fn poll_consume(
        self: Pin<&mut Self>,
        _: &mut Context<'_>,
        store: StoreContextMut<D>,
        mut source: Source<'_, T>,
        _: bool,
    ) -> Poll<Result<()>> {
        let value = &mut None;
        source.read(store, value)?;
        _ = self.get_mut().0.take().unwrap().send(value.take().unwrap());
        Poll::Ready(Ok(()))
    }
}

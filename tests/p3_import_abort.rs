//! End-to-end tests for `wasm-rquickjs:import-abort` on WASI Preview 3.
//!
//! The component under test is generated from `examples/p3/import-abort`. Every host call records
//! when it starts and when it finishes. A host call that the guest cancels is dropped by Wasmtime
//! before it finishes, which records its cancellation.

use camino::Utf8PathBuf;
use camino_tempfile::Utf8TempDir;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{
    Accessor, Component, FutureReader, HasSelf, Linker, Resource, StreamReader, bindgen,
};
use wasmtime::{Config, Engine, Result, Store};
use wasmtime_wasi::p2::pipe::MemoryOutputPipe;
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpCtxView, WasiHttpView};

mod p3_build;

pub struct Timer;

bindgen!({
    world: "import-abort",
    path: "examples/p3/import-abort/wit",
    with: {
        "test:import-abort/host.timer": Timer,
    },
});

use test::import_abort::host as host_api;

type Records = Arc<Mutex<Vec<String>>>;

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
    stderr: MemoryOutputPipe,
    #[cfg(feature = "use-golem-wasmtime")]
    io_ctx: wasmtime_wasi::IoCtx,
    records: Records,
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
            hooks: wasmtime_wasi_http::default_hooks(),
        }
    }
}

/// Records `cancelled:<label>` when dropped before [`Call::finish`].
struct Call {
    label: String,
    records: Records,
    finished: bool,
}

impl Call {
    fn start(records: Records, label: &str) -> Self {
        records.lock().unwrap().push(format!("start:{label}"));
        Self {
            label: label.to_string(),
            records,
            finished: false,
        }
    }

    async fn sleep_and_finish(mut self, delay_ms: u32) -> String {
        tokio::time::sleep(Duration::from_millis(delay_ms.into())).await;
        self.finished = true;
        self.records
            .lock()
            .unwrap()
            .push(format!("done:{}", self.label));
        self.label.clone()
    }
}

impl Drop for Call {
    fn drop(&mut self) {
        if !self.finished {
            self.records
                .lock()
                .unwrap()
                .push(format!("cancelled:{}", self.label));
        }
    }
}

fn records<T>(accessor: &Accessor<T, HasSelf<Host>>) -> Records {
    accessor.with(|mut access| access.get().records.clone())
}

impl host_api::Host for Host {}

impl host_api::HostTimer for Host {
    fn new(&mut self) -> Resource<Timer> {
        self.table.push(Timer).expect("failed to store timer")
    }

    fn drop(&mut self, rep: Resource<Timer>) -> Result<()> {
        self.table.delete(rep)?;
        Ok(())
    }
}

impl<T> host_api::HostWithStore<T> for HasSelf<Host> {
    async fn wait(accessor: &Accessor<T, Self>, label: String, delay_ms: u32) -> String {
        Call::start(records(accessor), &label)
            .sleep_and_finish(delay_ms)
            .await
    }

    async fn wait_result(
        accessor: &Accessor<T, Self>,
        label: String,
        delay_ms: u32,
    ) -> std::result::Result<String, String> {
        Ok(Call::start(records(accessor), &label)
            .sleep_and_finish(delay_ms)
            .await)
    }

    async fn consume(
        accessor: &Accessor<T, Self>,
        label: String,
        mut data: StreamReader<u8>,
        delay_ms: u32,
    ) -> u32 {
        let call = Call::start(records(accessor), &label);
        let _ = accessor.with(|access| data.close(access));
        call.sleep_and_finish(delay_ms).await;
        0
    }

    async fn hold(
        accessor: &Accessor<T, Self>,
        label: String,
        data: StreamReader<u8>,
        delay_ms: u32,
    ) -> u32 {
        let call = Call::start(records(accessor), &label);
        // Closes the stream when the call finishes or is cancelled, without reading it.
        let _data = data.guard(accessor);
        call.sleep_and_finish(delay_ms).await;
        0
    }

    async fn take_future(
        accessor: &Accessor<T, Self>,
        label: String,
        mut value: FutureReader<Option<u32>>,
        delay_ms: u32,
    ) -> u32 {
        let call = Call::start(records(accessor), &label);
        let _ = accessor.with(|access| value.close(access));
        call.sleep_and_finish(delay_ms).await;
        0
    }
}

impl<T> host_api::HostTimerWithStore<T> for HasSelf<Host> {
    async fn await_(
        accessor: &Accessor<T, Self>,
        _self: Resource<Timer>,
        label: String,
        delay_ms: u32,
    ) -> String {
        Call::start(records(accessor), &label)
            .sleep_and_finish(delay_ms)
            .await
    }

    async fn wait(
        accessor: &Accessor<T, Self>,
        _self: Resource<Timer>,
        label: String,
        delay_ms: u32,
    ) -> String {
        Call::start(records(accessor), &label)
            .sleep_and_finish(delay_ms)
            .await
    }

    async fn wait_static(accessor: &Accessor<T, Self>, label: String, delay_ms: u32) -> String {
        Call::start(records(accessor), &label)
            .sleep_and_finish(delay_ms)
            .await
    }
}

fn build_component(temp: &Utf8TempDir) -> anyhow::Result<Utf8PathBuf> {
    let example_dir = Utf8PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("examples")
        .join("p3")
        .join("import-abort");
    let out = temp.path().join("out");
    generate_wrapper_crate_with_target(
        &example_dir.join("wit"),
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(example_dir.join("src").join("import-abort.js")),
        }],
        &out,
        None,
        GenerationTarget::WasiP3,
    )?;

    let cache = p3_build::BuildCache::new()?;
    let mut build_cmd = Command::new("cargo");
    cache.configure(&mut build_cmd);
    let build = build_cmd
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
        "generated P3 crate should build; stderr:\n{}",
        String::from_utf8_lossy(&build.stderr)
    );

    let mut metadata_cmd = Command::new("cargo");
    cache.configure(&mut metadata_cmd);
    let metadata = metadata_cmd
        .args([
            "metadata",
            "--no-deps",
            "--format-version",
            "1",
            "--manifest-path",
        ])
        .arg(out.join("Cargo.toml"))
        .output()?;
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)?;
    let wasm = Utf8PathBuf::from(metadata["target_directory"].as_str().unwrap())
        .join("wasm32-wasip2")
        .join("debug")
        .join("import_abort.wasm");
    Ok(
        Utf8PathBuf::from_path_buf(cache.finish(wasm.as_std_path(), out.as_std_path())?)
            .expect("generated paths are UTF-8"),
    )
}

async fn run(
    component_path: &camino::Utf8Path,
    records: Records,
) -> Result<(serde_json::Value, Vec<String>, String)> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = Linker::<Host>::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    // Timer sleeps run on the host's tokio runtime, as in the custom invocation context test.
    linker.allow_shadowing(true);
    linker
        .instance("wasi:clocks/monotonic-clock@0.3.0")?
        .func_wrap_concurrent(
            "wait-for",
            |_accessor: &Accessor<Host>, (how_long,): (u64,)| {
                Box::pin(async move {
                    tokio::time::sleep(Duration::from_nanos(how_long)).await;
                    Ok(())
                })
            },
        )?;
    linker.allow_shadowing(false);
    host_api::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |host| host)?;

    let stderr = MemoryOutputPipe::new(1024 * 1024);
    let mut builder = WasiCtxBuilder::new();
    builder.inherit_stdout().stderr(stderr.clone());
    #[cfg(feature = "use-golem-wasmtime")]
    let (wasi, io_ctx) = builder.build();
    #[cfg(not(feature = "use-golem-wasmtime"))]
    let wasi = builder.build();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            http: WasiHttpCtx::new(),
            table: ResourceTable::new(),
            stderr,
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx,
            records: records.clone(),
        },
    );
    let bindings = ImportAbort::instantiate_async(&mut store, &component, &linker).await?;
    let started = std::time::Instant::now();
    let result = store
        .run_concurrent(async |accessor| bindings.call_run(accessor).await)
        .await??;
    // Each aborted import would otherwise wait 10 seconds.
    let elapsed = started.elapsed();
    assert!(
        elapsed < Duration::from_secs(8),
        "aborted imports did not end early: {elapsed:?}; records: {:#?}",
        records.lock().unwrap()
    );
    let stderr = String::from_utf8_lossy(&store.data().stderr.contents()).into_owned();
    let records = records.lock().unwrap().clone();
    Ok((serde_json::from_str(&result)?, records, stderr))
}

#[test]
fn p3_import_abort_cancels_the_signalled_imports() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp).expect("generate + build");
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build tokio runtime");
    let shared = Records::default();
    let (outcomes, records, stderr) = rt.block_on(async {
        tokio::time::timeout(Duration::from_secs(120), run(&wasm, shared.clone()))
            .await
            .unwrap_or_else(|_| {
                panic!(
                    "guest call did not complete within 120s; records: {:#?}",
                    shared.lock().unwrap()
                )
            })
            .expect("guest call failed")
    });
    let context = format!("outcomes: {outcomes:#}\nrecords: {records:#?}\nstderr: {stderr}");
    let has = |record: &str| records.iter().any(|candidate| candidate == record);

    // An abort rejects with the signal's reason and cancels the started host call, for every
    // bridge shape: freestanding, `result`, resource method, resource static and deferred.
    for label in ["free", "result", "method", "static", "deferred"] {
        assert_eq!(
            outcomes[label]["error"],
            format!("stop-{label}"),
            "{label}\n{context}"
        );
        assert!(has(&format!("start:{label}")), "{label}\n{context}");
        assert!(has(&format!("cancelled:{label}")), "{label}\n{context}");
        assert!(!has(&format!("done:{label}")), "{label}\n{context}");
    }

    // A method whose WIT name is a JavaScript keyword is callable under the escaped name its
    // TypeScript declaration uses.
    assert_eq!(
        outcomes["keyword"]["value"], "keyword",
        "keyword\n{context}"
    );
    assert!(has("done:keyword"), "keyword\n{context}");

    // An already aborted signal starts no host call.
    for (outcome, label) in [("pre", "pre"), ("preDeferred", "pre-deferred")] {
        assert_eq!(outcomes[outcome]["error"], "stop-pre", "{label}\n{context}");
        assert!(!has(&format!("start:{label}")), "{label}\n{context}");
    }
    // ... and does not lower a stream argument, so its JS source is not read.
    assert_eq!(outcomes["preDeferred"]["pulled"], 0, "{context}");
    assert_eq!(outcomes["preDeferred"]["closed"], false, "{context}");

    // A lowered JS stream source is closed (its iterator's `return()` runs) and not read to its
    // end when the signal aborts: after the host took the stream without reading it, after the
    // parameters were lowered but before the import was first polled, and while the parameters
    // were lowered.
    for (outcome, label, started) in [
        ("held", "held", true),
        ("prePoll", "pre-poll", false),
        ("lowering", "lowering", false),
    ] {
        assert_eq!(
            outcomes[outcome]["error"],
            format!("stop-{label}"),
            "{label}\n{context}"
        );
        assert_eq!(
            has(&format!("start:{label}")),
            started,
            "{label}\n{context}"
        );
        assert!(!has(&format!("done:{label}")), "{label}\n{context}");
        assert_eq!(outcomes[outcome]["closed"], true, "{label}\n{context}");
        assert_eq!(outcomes[outcome]["exhausted"], false, "{label}\n{context}");
    }
    assert!(has("cancelled:held"), "{context}");

    // A finished import keeps its result when the signal aborts later.
    assert_eq!(outcomes["finished"]["value"], "finished", "{context}");
    assert_eq!(outcomes["finishedDeferred"]["value"], 0, "{context}");
    assert!(
        has("done:finished") && has("done:finished-deferred"),
        "{context}"
    );

    // The outer signal reaches only the import called synchronously after the inner
    // `withSignal` returned.
    assert_eq!(outcomes["nestedOuter"]["error"], "stop-outer", "{context}");
    assert!(has("cancelled:nested-outer"), "{context}");
    for (outcome, label) in [
        ("nestedInner", "nested-inner"),
        ("afterAwait", "after-await"),
        ("unsignalled", "unsignalled"),
    ] {
        assert_eq!(outcomes[outcome]["value"], label, "{context}");
        assert!(has(&format!("done:{label}")), "{context}");
        assert!(!has(&format!("cancelled:{label}")), "{context}");
    }

    // An exception from `fn` propagates out of `withSignal` and restores the previous signal:
    // the outer signal after a nested `withSignal`, and no signal after a top-level one.
    assert_eq!(outcomes["thrownInner"], "boom-inner", "{context}");
    assert_eq!(
        outcomes["throwOuter"]["error"], "stop-throw-outer",
        "{context}"
    );
    assert!(has("cancelled:throw-outer"), "{context}");
    assert_eq!(outcomes["thrownTop"], "boom-top", "{context}");
    assert_eq!(outcomes["afterThrow"]["value"], "after-throw", "{context}");
    assert!(has("done:after-throw"), "{context}");

    // The bridge registers one abort listener while the import runs and none stays once the
    // import settled.
    let listeners = &outcomes["listeners"];
    for (outcome, label, expected) in [
        (
            "freeFinished",
            "count-free-finished",
            Some(serde_json::json!("count-free-finished")),
        ),
        ("freeAborted", "count-free-aborted", None),
        (
            "deferredFinished",
            "count-deferred-finished",
            Some(serde_json::json!(0)),
        ),
        ("deferredAborted", "count-deferred-aborted", None),
    ] {
        let outcome = &listeners[outcome];
        match expected {
            Some(value) => assert_eq!(outcome["value"], value, "{label}\n{context}"),
            None => assert_eq!(
                outcome["error"],
                format!("stop-{label}"),
                "{label}\n{context}"
            ),
        }
        assert_eq!(outcome["during"], 1, "{label}\n{context}");
        assert_eq!(outcome["after"], 0, "{label}\n{context}");
    }
    // A parameter that fails to convert throws from the call and leaves no listener.
    let conversion_error = &listeners["conversionError"];
    assert!(
        conversion_error["error"]
            .as_str()
            .is_some_and(|error| error.contains("bad-future")),
        "{context}"
    );
    assert_eq!(conversion_error["after"], 0, "{context}");
    assert!(!has("start:count-bad-future"), "{context}");
}

#[test]
fn p3_import_abort_declarations_are_generated_only_for_worlds_with_async_imports() {
    let declarations = |example: &str| {
        let temp = Utf8TempDir::new().expect("temp dir");
        let wit = Utf8PathBuf::from("examples/p3").join(example).join("wit");
        let generated =
            wasm_rquickjs::generate_dts(&wit, temp.path(), None).expect("generate d.ts");
        let abort = generated
            .iter()
            .find(|path| path.file_name() == Some("wasm-rquickjs-import-abort.d.ts"))
            .map(|path| std::fs::read_to_string(path).expect("read d.ts"));
        (abort, temp)
    };

    let (abort, _temp) = declarations("import-abort");
    let abort = abort.expect("a world with async imports declares the import-abort module");
    assert!(
        abort.contains("declare module 'wasm-rquickjs:import-abort'"),
        "{abort}"
    );
    assert!(
        abort.contains("export function withSignal<T>(signal: ImportSignal | undefined | null, fn: () => T): T;"),
        "{abort}"
    );

    // Async exports alone do not make the module available.
    let (abort, _temp) = declarations("async-export");
    assert_eq!(abort, None);
}

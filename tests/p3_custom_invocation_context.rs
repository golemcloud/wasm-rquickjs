//! End-to-end tests for `wasm-rquickjs:custom-invocation-context` on WASI Preview 3.
//!
//! The component under test is generated from `examples/p3/custom-invocation-context`. The
//! embedded wasmtime host implements the custom invocation subset of
//! `golem:durability/durability@1.6.0` the way Golem does: one installed context per task,
//! `exchange-custom-invocation-context` swaps it, async begin takes its parent from the installed
//! context, and installing a snapshot of a closed invocation is an error. Every host effect
//! records the invocation that was installed when it started.

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use std::collections::HashMap;
use std::future::Future;
use std::process::Command;
use std::time::Duration;
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{Accessor, Component, HasSelf, Linker, Resource, bindgen};
use wasmtime::{Config, Engine, Result, Store};
use wasmtime_wasi::p2::pipe::MemoryOutputPipe;
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpCtxView, WasiHttpView};

mod p3_build;

pub struct Snapshot(Option<u32>);
pub struct Live(u32);

bindgen!({
    world: "custom-invocation-context",
    path: "examples/p3/custom-invocation-context/wit",
    with: {
        "golem:durability/durability.custom-invocation-context": Snapshot,
        "golem:durability/durability.live-custom-durable-invocation": Live,
    },
});

use golem::durability::durability as host_durability;
use test::custom_invocation_context::effects as host_effects;

struct Invocation {
    name: String,
    parent: Option<u32>,
    closed: bool,
}

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
    stderr: MemoryOutputPipe,
    #[cfg(feature = "use-golem-wasmtime")]
    io_ctx: wasmtime_wasi::IoCtx,
    current: Option<u32>,
    invocations: HashMap<u32, Invocation>,
    next_id: u32,
    /// `label@invocation` for every effect, begin, finish and drop, in start order.
    records: Vec<String>,
    exchanges: usize,
    violations: Vec<String>,
}

impl Host {
    fn name(&self, id: Option<u32>) -> String {
        match id {
            Some(id) => self.invocations[&id].name.clone(),
            None => "root".to_string(),
        }
    }

    fn record(&mut self, label: &str) {
        let scope = self.name(self.current);
        self.records.push(format!("{label}@{scope}"));
    }
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

impl host_durability::Host for Host {
    fn exchange_custom_invocation_context(
        &mut self,
        next: Option<Resource<Snapshot>>,
    ) -> Resource<Snapshot> {
        self.exchanges += 1;
        let previous = self.current;
        if let Some(next) = next {
            let Snapshot(next) = self.table.delete(next).expect("unknown snapshot");
            if let Some(id) = next
                && self.invocations[&id].closed
            {
                let name = self.name(Some(id));
                self.violations
                    .push(format!("installed a snapshot of closed invocation {name}"));
            }
            self.current = next;
        }
        self.table
            .push(Snapshot(previous))
            .expect("failed to store snapshot")
    }
}

impl host_durability::HostCustomInvocationContext for Host {
    fn drop(&mut self, rep: Resource<Snapshot>) -> Result<()> {
        self.table.delete(rep)?;
        Ok(())
    }
}

impl host_durability::HostLiveCustomDurableInvocation for Host {
    fn enter(&mut self, live: Resource<Live>) {
        let id = self.table.get(&live).expect("unknown live invocation").0;
        self.current = Some(id);
    }

    fn drop(&mut self, rep: Resource<Live>) -> Result<()> {
        let Live(id) = self.table.delete(rep)?;
        let name = self.name(Some(id));
        self.record(&format!("drop:{name}"));
        self.invocations.get_mut(&id).unwrap().closed = true;
        Ok(())
    }
}

impl<T> host_durability::HostWithStore<T> for HasSelf<Host> {
    async fn begin_custom_durable_invocation_async(
        accessor: &Accessor<T, Self>,
        name: String,
    ) -> Resource<Live> {
        let live = accessor.with(|mut access| {
            let host = access.get();
            let id = host.next_id;
            host.next_id += 1;
            host.record(&format!("begin:{name}"));
            host.invocations.insert(
                id,
                Invocation {
                    name,
                    parent: host.current,
                    closed: false,
                },
            );
            host.table.push(Live(id)).expect("failed to store live")
        });
        tokio::time::sleep(Duration::from_millis(1)).await;
        live
    }
}

impl<T> host_durability::HostLiveCustomDurableInvocationWithStore<T> for HasSelf<Host> {
    async fn finish_async(accessor: &Accessor<T, Self>, live: Resource<Live>) {
        accessor.with(|mut access| {
            let host = access.get();
            let id = host.table.get(&live).expect("unknown live invocation").0;
            let name = host.name(Some(id));
            host.record(&format!("finish:{name}"));
            if host.current != Some(id) {
                let installed = host.name(host.current);
                host.violations
                    .push(format!("finished {name} while {installed} was installed"));
            }
        });
        tokio::time::sleep(Duration::from_millis(1)).await;
    }
}

impl host_effects::Host for Host {
    fn sync_effect(&mut self, label: String) {
        self.record(&label);
    }

    fn exchange_count(&mut self) -> u32 {
        self.exchanges as u32
    }
}

impl<T> host_effects::HostWithStore<T> for HasSelf<Host> {
    async fn effect(accessor: &Accessor<T, Self>, label: String, delay_ms: u32) {
        accessor.with(|mut access| access.get().record(&label));
        tokio::time::sleep(Duration::from_millis(delay_ms.into())).await;
    }
}

struct Outcome {
    results: Vec<String>,
    records: Vec<String>,
    parents: HashMap<String, String>,
    exchanges: usize,
    violations: Vec<String>,
    stderr: String,
}

async fn run_exports(component_path: &Utf8Path, exports: &[&str]) -> Result<Outcome> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = Linker::<Host>::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    // Timer sleeps are host calls too: record the invocation each `wait-for` starts in.
    linker.allow_shadowing(true);
    linker
        .instance("wasi:clocks/monotonic-clock@0.3.0")?
        .func_wrap_concurrent(
            "wait-for",
            |accessor: &Accessor<Host>, (how_long,): (u64,)| {
                Box::pin(async move {
                    accessor.with(|mut access| access.get().record("wait-for"));
                    tokio::time::sleep(Duration::from_nanos(how_long)).await;
                    Ok(())
                })
            },
        )?;
    linker.allow_shadowing(false);
    host_durability::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |host| host)?;
    host_effects::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |host| host)?;

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
            current: None,
            invocations: HashMap::new(),
            next_id: 1,
            records: Vec::new(),
            exchanges: 0,
            violations: Vec::new(),
        },
    );
    let bindings =
        CustomInvocationContext::instantiate_async(&mut store, &component, &linker).await?;

    let mut results = Vec::new();
    for export in exports {
        let result = store
            .run_concurrent(async |accessor| match *export {
                "run" => bindings.call_run(accessor).await,
                "run-after" => bindings.call_run_after(accessor).await,
                "run-plain" => bindings.call_run_plain(accessor).await,
                "run-edge-cases" => bindings.call_run_edge_cases(accessor).await,
                "run-first-scope" => bindings.call_run_first_scope(accessor).await,
                other => panic!("unknown export {other}"),
            })
            .await??;
        let host = store.data_mut();
        if host.current.is_some() {
            let installed = host.name(host.current);
            host.violations
                .push(format!("{export} returned with {installed} installed"));
        }
        results.push(result);
    }

    let host = store.data();
    let parents = host
        .invocations
        .values()
        .map(|invocation| (invocation.name.clone(), host.name(invocation.parent)))
        .collect();
    Ok(Outcome {
        results,
        records: host.records.clone(),
        parents,
        exchanges: host.exchanges,
        violations: host.violations.clone(),
        stderr: String::from_utf8_lossy(&host.stderr.contents()).into_owned(),
    })
}

fn build_component(temp: &Utf8TempDir) -> anyhow::Result<Utf8PathBuf> {
    let example_dir = Utf8PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("examples")
        .join("p3")
        .join("custom-invocation-context");
    let out = temp.path().join("out");
    generate_wrapper_crate_with_target(
        &example_dir.join("wit"),
        &[
            JsModuleSpec {
                name: "module".to_string(),
                mode: EmbeddingMode::EmbedFile(
                    example_dir.join("src").join("custom-invocation-context.js"),
                ),
            },
            JsModuleSpec {
                name: "middleware".to_string(),
                mode: EmbeddingMode::EmbedFile(example_dir.join("src").join("middleware.js")),
            },
        ],
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
        .join("custom_invocation_context.wasm");
    Ok(
        Utf8PathBuf::from_path_buf(cache.finish(wasm.as_std_path(), out.as_std_path())?)
            .expect("generated paths are UTF-8"),
    )
}

fn block_on_with_timeout<T>(fut: impl Future<Output = Result<T>>) -> T {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to build tokio runtime");
    rt.block_on(async {
        tokio::time::timeout(Duration::from_secs(120), fut)
            .await
            .expect("guest call did not complete within 120s")
            .expect("guest call failed")
    })
}

fn position(records: &[String], record: &str) -> usize {
    records
        .iter()
        .position(|candidate| candidate == record)
        .unwrap_or_else(|| panic!("missing record {record} in {records:#?}"))
}

/// The `wait-for` records: one per timer sleep.
fn waits(records: &[String]) -> Vec<&str> {
    records
        .iter()
        .map(String::as_str)
        .filter(|record| record.starts_with("wait-for@"))
        .collect()
}

#[test]
fn p3_custom_invocation_context_follows_each_flow() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp).expect("generate + build");
    let outcome = block_on_with_timeout(run_exports(&wasm, &["run", "run-after"]));

    assert_eq!(
        outcome.violations,
        Vec::<String>::new(),
        "{:#?}",
        outcome.records
    );
    assert_eq!(outcome.results[0], r#"{"identity":true}"#);

    let records = &outcome.records;
    for expected in [
        // Concurrent siblings and a root effect while both wait.
        "a1@a",
        "a2@a",
        "b1@b",
        "b2@b",
        "root1@root",
        "finish:a@a",
        "finish:b@b",
        "drop:a@a",
        "drop:b@b",
        // Nesting.
        "i1@inner",
        "finish:inner@inner",
        "o1@outer",
        "finish:outer@outer",
        // Runtime-scheduled callbacks and async generators.
        "timer@cb",
        "microtask@cb",
        "tick@cb",
        "then@cb",
        "thenable@cb",
        "cb-gen@cb",
        "loop@cb",
        // A shared promise resumes each awaiter in its own scope.
        "s1@s1",
        "s2@s2",
        // Closed tokens resolve to the nearest open ancestor.
        "closed-in-parent@parent",
        "closed-at-root@root",
        "saved@saved",
        "root2@root",
        // A token of an earlier export call resolves to the running root.
        "foreign@root",
    ] {
        position(records, expected);
    }
    // The siblings really overlapped: b finished while a was still waiting.
    assert!(
        position(records, "finish:b@b") < position(records, "a2@a"),
        "{records:#?}"
    );
    // A timer sleeps in the scope that registered it: the `cb` timer and the wakeup timer of
    // `process.nextTick` in `cb`, and the root's `sleep(10)` and shared `sleep(5)` at the root.
    let mut sleeps = waits(records);
    sleeps.sort();
    assert_eq!(
        sleeps,
        [
            "wait-for@cb",
            "wait-for@cb",
            "wait-for@root",
            "wait-for@root"
        ],
        "{records:#?}"
    );

    for (name, parent) in [
        ("a", "root"),
        ("b", "root"),
        ("outer", "root"),
        ("inner", "outer"),
        ("closed", "parent"),
    ] {
        assert_eq!(outcome.parents[name], parent, "parent of {name}");
    }
    assert!(
        outcome.stderr.contains("runs in an enclosing context"),
        "{}",
        outcome.stderr
    );
}

#[test]
fn p3_custom_invocation_context_costs_nothing_without_scopes() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp).expect("generate + build");
    let outcome = block_on_with_timeout(run_exports(&wasm, &["run-plain", "run-plain"]));

    assert_eq!(outcome.violations, Vec::<String>::new());
    assert_eq!(
        outcome.records,
        ["plain1@root", "plain2@root", "plain1@root", "plain2@root"]
    );
    assert_eq!(outcome.exchanges, 0);
}

#[test]
fn p3_custom_invocation_context_covers_edge_cases() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp).expect("generate + build");
    let outcome = block_on_with_timeout(run_exports(&wasm, &["run-edge-cases"]));

    assert_eq!(
        outcome.violations,
        Vec::<String>::new(),
        "{:#?}",
        outcome.records
    );
    let report: serde_json::Value = serde_json::from_str(&outcome.results[0]).unwrap();
    assert_eq!(
        report,
        serde_json::json!({
            "unchangedExchanges": 0,
            "closeWithChild": "refused",
            "sharedToken": true,
            "sharedChild": true,
        })
    );

    let records = &outcome.records;
    assert_eq!(
        records.iter().filter(|r| *r == "interval@cb2").count(),
        3,
        "{records:#?}"
    );
    // Every period of the intervals, the immediate and each sleep wait in `cb2`. `late`'s
    // interval sleeps in `late` while it is open, and in `cb2` once it closed, right after its drop.
    let closed_at = position(records, "drop:late@late");
    assert!(
        closed_at < position(records, "late-tick@cb2"),
        "{records:#?}"
    );
    let sleeps = waits(records);
    assert!(sleeps.len() >= 6, "{records:#?}");
    assert!(
        sleeps
            .iter()
            .all(|r| *r == "wait-for@cb2" || *r == "wait-for@late"),
        "{records:#?}"
    );
    assert!(
        !records[closed_at..].iter().any(|r| r == "wait-for@late"),
        "{records:#?}"
    );
    for expected in [
        "immediate@cb2",
        "race@cb2",
        "finally@cb2",
        "rejected@cb2",
        "run-current@cb2",
        "finalized@root",
        "finish:c2@c2",
        "finish:p2@p2",
        "mw1@mw",
        "finish:mw@mw",
    ] {
        position(records, expected);
    }
    assert_eq!(outcome.parents["c2"], "p2");
    assert_eq!(outcome.parents["mw"], "main");
}

#[test]
fn p3_custom_invocation_context_keeps_root_work_queued_before_the_first_scope() {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp).expect("generate + build");
    let outcome = block_on_with_timeout(run_exports(&wasm, &["run-first-scope"]));

    assert_eq!(
        outcome.violations,
        Vec::<String>::new(),
        "{:#?}",
        outcome.records
    );
    for expected in [
        "first-microtask@root",
        "first-tick@root",
        "first-timer@root",
        "wait-for@root",
        "first-child@first",
        "finish:first@first",
        "first-after@root",
    ] {
        position(&outcome.records, expected);
    }
}

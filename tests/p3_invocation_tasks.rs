//! End-to-end tests that each exported call's JavaScript work runs on that call's own
//! component-model task.
//!
//! The component under test is generated from `examples/p3/invocation-tasks`. The host attributes
//! every host call the way Golem does: by the task group of the calling task, using the Golem
//! Wasmtime fork's `TaskGroupHook`. A task group is created for each host-to-guest call and holds
//! that call's task and its subtasks; it finishes when all of them have exited. The tests run
//! overlapping calls on one instance and check which call each host effect is attributed to, when
//! each call returns, and when each call's task group finishes.
#![cfg(feature = "use-golem-wasmtime")]

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{
    Accessor, Component, Func, HasSelf, Linker, TaskGroupHook, TaskGroupId, Val, bindgen,
};
use wasmtime::{Config, Engine, Result, Store};
use wasmtime_wasi::p2::pipe::MemoryOutputPipe;
use wasmtime_wasi::{ResourceTable, WasiCtxBuilder, WasiCtxView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpCtxView, WasiHttpView};

mod p3_build;

bindgen!({
    world: "invocation-tasks",
    path: "examples/p3/invocation-tasks/wit",
});

use test::invocation_tasks::effects as host_effects;

#[derive(Debug, Clone)]
struct Event {
    /// `record:<label>`, `result:<call>` or `finish:<call>`.
    what: String,
    /// The call whose task group made the host call, for records.
    call: String,
    at: Instant,
}

#[derive(Default)]
struct Groups {
    /// Call names for the next task groups, in the order the calls are prepared.
    armed: VecDeque<String>,
    names: HashMap<TaskGroupId, String>,
    current: Option<TaskGroupId>,
    events: Vec<Event>,
}

impl Groups {
    fn current_call(&self) -> String {
        match self.current {
            Some(group) => self
                .names
                .get(&group)
                .cloned()
                .unwrap_or_else(|| "unarmed".to_string()),
            None => "none".to_string(),
        }
    }

    fn push(&mut self, what: String, call: String) {
        self.events.push(Event {
            what,
            call,
            at: Instant::now(),
        });
    }
}

#[derive(Clone, Default)]
struct Attribution(Arc<Mutex<Groups>>);

impl Attribution {
    fn arm(&self, call: &str) {
        self.0.lock().unwrap().armed.push_back(call.to_string());
    }

    fn record(&self, label: &str) {
        let mut groups = self.0.lock().unwrap();
        let call = groups.current_call();
        groups.push(format!("record:{label}"), call);
    }

    fn result(&self, call: &str) {
        self.0
            .lock()
            .unwrap()
            .push(format!("result:{call}"), call.to_string());
    }

    fn finished(&self, call: &str) -> bool {
        let what = format!("finish:{call}");
        self.0.lock().unwrap().events.iter().any(|e| e.what == what)
    }

    fn events(&self) -> Vec<Event> {
        self.0.lock().unwrap().events.clone()
    }
}

impl TaskGroupHook for Attribution {
    fn handle_start(&mut self, id: TaskGroupId) -> Result<()> {
        let mut groups = self.0.lock().unwrap();
        let name = groups
            .armed
            .pop_front()
            .unwrap_or_else(|| "unarmed".to_string());
        groups.names.insert(id, name);
        Ok(())
    }

    fn handle_enter(&mut self, id: TaskGroupId) -> Result<()> {
        self.0.lock().unwrap().current = Some(id);
        Ok(())
    }

    fn handle_exit(&mut self, _id: TaskGroupId) -> Result<()> {
        self.0.lock().unwrap().current = None;
        Ok(())
    }

    fn handle_finish(&mut self, id: TaskGroupId) -> Result<()> {
        let mut groups = self.0.lock().unwrap();
        if let Some(name) = groups.names.remove(&id) {
            groups.push(format!("finish:{name}"), name);
        }
        Ok(())
    }
}

struct Host {
    wasi: wasmtime_wasi::WasiCtx,
    http: WasiHttpCtx,
    table: ResourceTable,
    io_ctx: wasmtime_wasi::IoCtx,
    attribution: Attribution,
}

impl wasmtime_wasi::WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi,
            table: &mut self.table,
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

impl host_effects::Host for Host {
    fn note(&mut self, label: String) {
        self.attribution.record(&label);
    }
}

impl<T> host_effects::HostWithStore<T> for HasSelf<Host> {
    async fn effect(accessor: &Accessor<T, Self>, label: String, delay_ms: u32) {
        accessor.with(|mut access| access.get().attribution.record(&label));
        tokio::time::sleep(Duration::from_millis(delay_ms.into())).await;
    }
}

struct Instance {
    store: Store<Host>,
    bindings: InvocationTasks,
    /// The synchronous `sync-timer` export, called untyped so that it can overlap other calls.
    sync_timer: Func,
    attribution: Attribution,
    stderr: MemoryOutputPipe,
}

async fn instantiate(component_path: &Utf8Path) -> Result<Instance> {
    let mut config = Config::new();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    let engine = Engine::new(&config)?;
    let component = Component::from_file(&engine, component_path)?;
    let mut linker = Linker::<Host>::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    host_effects::add_to_linker::<Host, HasSelf<Host>>(&mut linker, |host| host)?;

    let stderr = MemoryOutputPipe::new(1024 * 1024);
    let mut builder = WasiCtxBuilder::new();
    builder.inherit_stdout().stderr(stderr.clone());
    let (wasi, io_ctx) = builder.build();
    let attribution = Attribution::default();
    let mut store = Store::new(
        &engine,
        Host {
            wasi,
            http: WasiHttpCtx::new(),
            table: ResourceTable::new(),
            io_ctx,
            attribution: attribution.clone(),
        },
    );
    store.task_group_hook(attribution.clone());
    let instance = linker.instantiate_async(&mut store, &component).await?;
    let bindings = InvocationTasks::new(&mut store, &instance)?;
    let sync_timer = instance
        .get_func(&mut store, "sync-timer")
        .expect("sync-timer is exported");
    Ok(Instance {
        store,
        bindings,
        sync_timer,
        attribution,
        stderr,
    })
}

/// Waits inside `run_concurrent`, so that the guest's remaining tasks keep running, until the
/// task groups of `calls` have finished.
async fn wait_for_finish(attribution: &Attribution, calls: &[&str]) {
    let deadline = Instant::now() + Duration::from_secs(30);
    while !calls.iter().all(|call| attribution.finished(call)) {
        assert!(
            Instant::now() < deadline,
            "task groups of {calls:?} did not finish: {:#?}",
            attribution.events()
        );
        tokio::time::sleep(Duration::from_millis(5)).await;
    }
}

async fn call_sync_timer(
    accessor: &Accessor<Host>,
    sync_timer: Func,
    name: &str,
    delay_ms: u32,
) -> Result<()> {
    sync_timer
        .call_concurrent(
            accessor,
            &[Val::String(name.into()), Val::U32(delay_ms)],
            &mut [],
        )
        .await
}

fn build_component(temp: &Utf8TempDir, features: &str) -> anyhow::Result<Utf8PathBuf> {
    let example_dir = Utf8PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("examples")
        .join("p3")
        .join("invocation-tasks");
    let out = temp.path().join("out");
    generate_wrapper_crate_with_target(
        &example_dir.join("wit"),
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(example_dir.join("src").join("invocation-tasks.js")),
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
        .arg(format!(
            "p3,crypto,zlib,encoding,test-observability {features}"
        ))
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
        .join("invocation_tasks.wasm");
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
        tokio::time::timeout(Duration::from_secs(180), fut)
            .await
            .expect("guest calls did not complete within 180s")
            .expect("guest call failed")
    })
}

/// The component built for a host that keeps driving each call's task until it exits, as Golem
/// does, so calls return before they drain their remaining work.
fn component() -> (Utf8TempDir, Utf8PathBuf) {
    component_with_features("post-return-drain")
}

fn component_with_features(features: &str) -> (Utf8TempDir, Utf8PathBuf) {
    let temp = Utf8TempDir::new().expect("temp dir");
    let wasm = build_component(&temp, features).expect("generate + build");
    (temp, wasm)
}

/// The call each record with `prefix` is attributed to, keyed by label.
fn attributions(events: &[Event], prefix: &str) -> Vec<(String, String)> {
    events
        .iter()
        .filter_map(|event| {
            event
                .what
                .strip_prefix("record:")
                .map(|label| (label, event))
        })
        .filter(|(label, _)| label.starts_with(prefix))
        .map(|(label, event)| (label.to_string(), event.call.clone()))
        .collect()
}

fn at(events: &[Event], what: &str) -> Instant {
    events
        .iter()
        .find(|event| event.what == what)
        .unwrap_or_else(|| panic!("missing event {what} in {events:#?}"))
        .at
}

/// The records of the `background` export.
fn background_labels() -> Vec<String> {
    let mut labels: Vec<String> = ["sync", "job", "microtask", "tick", "timer", "timer-job"]
        .into_iter()
        .map(String::from)
        .collect();
    for round in 0..5 {
        labels.push(format!("effect-{round}"));
        labels.push(format!("after-await-{round}"));
    }
    labels
}

fn assert_attributed(events: &[Event], call: &str, labels: &[impl AsRef<str>]) {
    let attributed = attributions(events, &format!("{call}:"));
    for label in labels {
        let label = format!("{call}:{}", label.as_ref());
        let calls: Vec<&String> = attributed
            .iter()
            .filter(|(candidate, _)| *candidate == label)
            .map(|(_, call)| call)
            .collect();
        assert_eq!(
            calls,
            vec![call],
            "{label} must be recorded once, by {call}'s task: {events:#?}"
        );
    }
}

#[test]
fn each_call_runs_its_jobs_and_timers_on_its_own_task() {
    let (_temp, wasm) = component();
    let (events, results) = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        let results = store
            .run_concurrent(async |accessor| -> Result<Vec<String>> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) = futures::join!(
                    async {
                        let result = bindings.call_background(accessor, "a".into(), 7).await;
                        attribution.result("a");
                        result
                    },
                    async {
                        let result = bindings.call_background(accessor, "b".into(), 11).await;
                        attribution.result("b");
                        result
                    },
                );
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(vec![a?, b?])
            })
            .await??;
        Ok((attribution.events(), results))
    });

    assert_eq!(results, ["a", "b"]);
    assert_attributed(&events, "a", &background_labels());
    assert_attributed(&events, "b", &background_labels());
}

#[test]
fn a_continuation_runs_on_the_task_of_the_call_that_awaits() {
    let (_temp, wasm) = component();
    let (events, results) = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        let results = store
            .run_concurrent(async |accessor| -> Result<Vec<String>> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) = futures::join!(
                    bindings.call_wait_for_signal(accessor, "a".into()),
                    bindings.call_send_signal(accessor, "b".into(), 20),
                );
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(vec![a?, b?])
            })
            .await??;
        Ok((attribution.events(), results))
    });

    assert_eq!(results, ["a:b", "b"]);
    assert_attributed(
        &events,
        "a",
        &["waiting", "continued-from-b", "continued-job"],
    );
    assert_attributed(&events, "b", &["effect", "send", "sent"]);
}

#[test]
fn a_call_returns_before_its_background_work_and_its_task_exits_after_it() {
    let (_temp, wasm) = component();
    let events = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        store
            .run_concurrent(async |accessor| -> Result<()> {
                attribution.arm("a");
                let a = bindings.call_start_timer(accessor, "a".into(), 500).await?;
                attribution.result("a");
                assert_eq!(a, "a");
                attribution.arm("b");
                let b = bindings.call_quick(accessor, "b".into()).await?;
                attribution.result("b");
                assert_eq!(b, "b");
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(())
            })
            .await??;
        Ok(attribution.events())
    });

    assert_attributed(&events, "a", &["returning", "timer", "timer-job"]);
    assert_attributed(&events, "b", &["quick"]);
    let a_timer = at(&events, "record:a:timer");
    let a_timer_job = at(&events, "record:a:timer-job");
    // A returns its result without waiting for its timer.
    assert!(at(&events, "result:a") < a_timer, "{events:#?}");
    // B runs and returns while A's timer is pending, and its task exits without waiting for it.
    assert!(at(&events, "result:b") < a_timer, "{events:#?}");
    assert!(at(&events, "finish:b") < a_timer, "{events:#?}");
    // A's task exits only after its background work is done.
    assert!(at(&events, "finish:a") > a_timer_job, "{events:#?}");
}

#[test]
fn without_post_return_drain_a_call_drains_only_its_own_work_before_it_returns() {
    let (_temp, wasm) = component_with_features("");
    let events = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        store
            .run_concurrent(async |accessor| -> Result<()> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) = futures::join!(
                    async {
                        let a = bindings.call_start_timer(accessor, "a".into(), 500).await;
                        attribution.result("a");
                        a
                    },
                    async {
                        let b = bindings.call_quick(accessor, "b".into()).await;
                        attribution.result("b");
                        b
                    },
                );
                assert_eq!(a?, "a");
                assert_eq!(b?, "b");
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(())
            })
            .await??;
        Ok(attribution.events())
    });

    assert_attributed(&events, "a", &["returning", "timer", "timer-job"]);
    assert_attributed(&events, "b", &["quick"]);
    // A drains its timer before it returns.
    assert!(
        at(&events, "result:a") > at(&events, "record:a:timer-job"),
        "{events:#?}"
    );
    // B's drain does not wait for A's timer.
    let a_timer = at(&events, "record:a:timer");
    assert!(at(&events, "result:b") < a_timer, "{events:#?}");
    assert!(at(&events, "finish:b") < a_timer, "{events:#?}");
}

#[test]
fn a_running_call_adopts_the_work_a_synchronous_call_leaves() {
    let (_temp, wasm) = component();
    let (events, a) = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            sync_timer,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        let a = store
            .run_concurrent(async |accessor| -> Result<String> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) =
                    futures::join!(bindings.call_wait_for_signal(accessor, "a".into()), async {
                        tokio::time::sleep(Duration::from_millis(50)).await;
                        call_sync_timer(accessor, sync_timer, "b", 0).await
                    },);
                b?;
                wait_for_finish(&attribution, &["a", "b"]).await;
                a
            })
            .await??;
        Ok((attribution.events(), a))
    });

    // A was parked when B's timer was left behind; A's running task runs it.
    assert_eq!(a, "a:b");
    assert_attributed(&events, "b", &["sync"]);
    assert_eq!(
        attributions(&events, "b:timer"),
        [("b:timer".to_string(), "a".to_string())],
        "{events:#?}"
    );
    assert_attributed(
        &events,
        "a",
        &["waiting", "continued-from-b", "continued-job"],
    );
}

#[test]
fn without_post_return_drain_a_call_drains_the_work_it_adopts_before_it_returns() {
    let (_temp, wasm) = component_with_features("");
    let events = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            sync_timer,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        store
            .run_concurrent(async |accessor| -> Result<()> {
                attribution.arm("a");
                call_sync_timer(accessor, sync_timer, "a", 300).await?;
                attribution.arm("b");
                let b = bindings.call_quick(accessor, "b".into()).await?;
                attribution.result("b");
                assert_eq!(b, "b");
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(())
            })
            .await??;
        Ok(attribution.events())
    });

    assert_eq!(
        attributions(&events, "a:timer"),
        [("a:timer".to_string(), "b".to_string())],
        "{events:#?}"
    );
    assert!(
        at(&events, "result:b") > at(&events, "record:a:timer"),
        "{events:#?}"
    );
}

#[test]
fn a_throwing_job_affects_only_its_own_call() {
    let (_temp, wasm) = component();
    let (events, results, stderr) = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            stderr,
            ..
        } = instantiate(&wasm).await?;
        let results = store
            .run_concurrent(async |accessor| -> Result<Vec<String>> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) = futures::join!(
                    bindings.call_throwing(accessor, "a".into(), 10),
                    bindings.call_background(accessor, "b".into(), 15),
                );
                wait_for_finish(&attribution, &["a", "b"]).await;
                // The instance still serves calls.
                attribution.arm("c");
                let c = bindings.call_quick(accessor, "c".into()).await?;
                Ok(vec![a?, b?, c])
            })
            .await??;
        let stderr = String::from_utf8_lossy(&stderr.contents()).into_owned();
        Ok((attribution.events(), results, stderr))
    });

    assert_eq!(results, ["a", "b", "c"]);
    assert_attributed(
        &events,
        "a",
        &["after-microtask", "effect", "after-await", "later-timer"],
    );
    assert_attributed(&events, "b", &background_labels());
    assert_attributed(&events, "c", &["quick"]);
    // The timer failure reaches the uncaught-error handler. A failing microtask is dropped by the
    // job loop without a report, as before; it must still not stop any other work.
    assert!(stderr.contains("a timer failure"), "{stderr}");
}

#[test]
fn a_second_promise_hook_consumer_and_job_routing_share_the_hook() {
    let (_temp, wasm) = component();
    let (events, results) = block_on_with_timeout(async {
        let Instance {
            mut store,
            bindings,
            attribution,
            ..
        } = instantiate(&wasm).await?;
        let results = store
            .run_concurrent(async |accessor| -> Result<Vec<String>> {
                attribution.arm("a");
                attribution.arm("b");
                let (a, b) = futures::join!(
                    bindings.call_context_flow(accessor, "a".into(), 1, 20),
                    bindings.call_context_flow(accessor, "b".into(), 2, 15),
                );
                wait_for_finish(&attribution, &["a", "b"]).await;
                Ok(vec![a?, b?])
            })
            .await??;
        Ok((attribution.events(), results))
    });

    assert_eq!(results, ["a:1", "b:2"]);
    assert_attributed(
        &events,
        "a",
        &["effect-1", "after-first:1", "effect-2", "after-second:1"],
    );
    assert_attributed(
        &events,
        "b",
        &["effect-1", "after-first:2", "effect-2", "after-second:2"],
    );
}

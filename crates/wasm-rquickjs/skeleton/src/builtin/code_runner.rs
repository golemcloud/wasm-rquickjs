use crate::internal::runtime_services::{OwnedJsRuntime, RuntimeOutputSink, RuntimeServices};
use rquickjs::{CatchResultExt, Ctx, Module, Promise, async_with};
use serde::Deserialize;
use std::cell::{Cell, RefCell};
use std::collections::{HashMap, VecDeque};
use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

const MAX_ACTIVE_JOBS: usize = 8;

pub const CODE_RUNNER_JS: &str = include_str!("code_runner.js");
pub const CODE_RUNNER_TEST_JS: &str = r#"
import { owned_runtime_isolation_probe } from '__wasm_rquickjs_builtin/code_runner_native';
export const ownedRuntimeIsolationProbe = owned_runtime_isolation_probe;
"#;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RunnerOptions {
    entry: Option<String>,
    source: Option<String>,
    #[serde(default = "default_cwd")]
    cwd: String,
    #[serde(default)]
    argv: Vec<String>,
    #[serde(default)]
    env: HashMap<String, String>,
    #[serde(default)]
    timeout_ms: Option<u64>,
    #[serde(default = "default_max_bytes")]
    max_bytes: usize,
    #[serde(default)]
    overflow: OverflowPolicy,
}

fn default_cwd() -> String {
    "/".to_string()
}
fn default_max_bytes() -> usize {
    1024 * 1024
}

#[derive(Default, Deserialize, Copy, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
enum OverflowPolicy {
    #[default]
    Terminate,
    Truncate,
}

pub(crate) struct RunnerJob {
    options: RefCell<Option<RunnerOptions>>,
    stdout: RefCell<VecDeque<String>>,
    stderr: RefCell<VecDeque<String>>,
    stdout_bytes: Cell<usize>,
    stderr_bytes: Cell<usize>,
    max_bytes: usize,
    overflow: OverflowPolicy,
    cancel: Arc<AtomicBool>,
    overflowed: Arc<AtomicBool>,
    timed_out: Arc<AtomicBool>,
    completion: RefCell<Option<Result<String, String>>>,
}

impl RunnerJob {
    fn new(options: RunnerOptions) -> Self {
        Self {
            max_bytes: options.max_bytes,
            overflow: options.overflow,
            options: RefCell::new(Some(options)),
            stdout: RefCell::default(),
            stderr: RefCell::default(),
            stdout_bytes: Cell::new(0),
            stderr_bytes: Cell::new(0),
            cancel: Arc::new(AtomicBool::new(false)),
            overflowed: Arc::new(AtomicBool::new(false)),
            timed_out: Arc::new(AtomicBool::new(false)),
            completion: RefCell::default(),
        }
    }

    fn push(&self, stdout: bool, data: &[u8]) {
        let count = if stdout {
            &self.stdout_bytes
        } else {
            &self.stderr_bytes
        };
        let remaining = self.max_bytes.saturating_sub(count.get());
        if data.len() > remaining {
            self.overflowed.store(true, Ordering::Relaxed);
            if self.overflow == OverflowPolicy::Terminate {
                self.cancel.store(true, Ordering::Relaxed);
            }
        }
        let mut accepted = data.len().min(remaining);
        while accepted > 0 && std::str::from_utf8(&data[..accepted]).is_err() {
            accepted -= 1;
        }
        if accepted == 0 {
            return;
        }
        count.set(count.get() + accepted);
        let chunk = String::from_utf8_lossy(&data[..accepted]).into_owned();
        if stdout {
            self.stdout.borrow_mut().push_back(chunk);
        } else {
            self.stderr.borrow_mut().push_back(chunk);
        }
    }
}

impl RuntimeOutputSink for RunnerJob {
    fn write_stdout(&self, data: &[u8]) {
        self.push(true, data);
    }
    fn write_stderr(&self, data: &[u8]) {
        self.push(false, data);
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PollResult {
    stdout: Vec<String>,
    stderr: Vec<String>,
    done: bool,
    value: Option<String>,
    error: Option<String>,
    overflowed: bool,
}

#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use super::*;

    // Kept internal for the deep cross-runtime filesystem/process isolation
    // regression. The public golem:code-runner wrapper does not export it.
    #[rquickjs::function]
    pub async fn owned_runtime_isolation_probe(ctx: Ctx<'_>) -> rquickjs::Result<String> {
        crate::internal::runtime_services::owned_runtime_isolation_probe()
            .await
            .map_err(|message| rquickjs::Exception::throw_message(&ctx, &message))
    }

    #[rquickjs::function]
    pub fn create_job(ctx: Ctx<'_>, options_json: String) -> rquickjs::Result<usize> {
        let options: RunnerOptions = serde_json::from_str(&options_json)
            .map_err(|error| rquickjs::Exception::throw_type(&ctx, &error.to_string()))?;
        if options.entry.is_some() == options.source.is_some() {
            return Err(rquickjs::Exception::throw_type(
                &ctx,
                "exactly one of entry or source is required",
            ));
        }
        if options.max_bytes == 0 {
            return Err(rquickjs::Exception::throw_range(
                &ctx,
                "maxBytes must be greater than zero",
            ));
        }
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        if !services.runner_enabled.get() {
            return Err(rquickjs::Exception::throw_message(
                &ctx,
                "nested code-runner jobs are not supported",
            ));
        }
        if services.runner_jobs.borrow().len() >= MAX_ACTIVE_JOBS {
            return Err(rquickjs::Exception::throw_range(
                &ctx,
                "code-runner supports at most 8 active jobs per runtime",
            ));
        }
        let id = services.next_runner_job_id.get();
        services.next_runner_job_id.set(id.wrapping_add(1));
        let job = Rc::new(RunnerJob::new(options));
        services.runner_jobs.borrow_mut().insert(id, job.clone());
        Ok(id)
    }

    /// Async native callbacks are owned and driven by rquickjs's promise
    /// machinery. Unlike a detached `Ctx::spawn` task, this remains live while
    /// the parent export awaits JavaScript promises on the P2 executor.
    #[rquickjs::function]
    pub async fn start_job(ctx: Ctx<'_>, id: usize) -> rquickjs::Result<()> {
        let job = {
            let services = ctx
                .userdata::<RuntimeServices>()
                .expect("runtime services not initialized");
            let jobs = services.runner_jobs.borrow();
            jobs.get(&id).cloned()
        }
        .ok_or_else(|| rquickjs::Exception::throw_range(&ctx, "unknown runner job"))?;
        let options =
            job.options.borrow_mut().take().ok_or_else(|| {
                rquickjs::Exception::throw_range(&ctx, "runner job already started")
            })?;
        run_job(options, job).await;
        Ok(())
    }

    #[rquickjs::function]
    pub fn poll_job(ctx: Ctx<'_>, id: usize) -> rquickjs::Result<String> {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        let jobs = services.runner_jobs.borrow();
        let job = jobs
            .get(&id)
            .ok_or_else(|| rquickjs::Exception::throw_range(&ctx, "unknown runner job"))?;
        let completion = job.completion.borrow();
        let (done, value, error) = match completion.as_ref() {
            Some(Ok(value)) => (true, Some(value.clone()), None),
            Some(Err(error)) => (true, None, Some(error.clone())),
            None => (false, None, None),
        };
        serde_json::to_string(&PollResult {
            stdout: job.stdout.borrow_mut().drain(..).collect(),
            stderr: job.stderr.borrow_mut().drain(..).collect(),
            done,
            value,
            error,
            overflowed: job.overflowed.load(Ordering::Relaxed),
        })
        .map_err(|error| rquickjs::Exception::throw_message(&ctx, &error.to_string()))
    }

    #[rquickjs::function]
    pub fn cancel_job(ctx: Ctx<'_>, id: usize) -> bool {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        let Some(job) = services.runner_jobs.borrow().get(&id).cloned() else {
            return false;
        };
        job.cancel.store(true, Ordering::Relaxed);
        true
    }

    #[rquickjs::function]
    pub fn forget_job(ctx: Ctx<'_>, id: usize) {
        ctx.userdata::<RuntimeServices>()
            .expect("runtime services not initialized")
            .runner_jobs
            .borrow_mut()
            .remove(&id);
    }
}

async fn run_job(options: RunnerOptions, job: Rc<RunnerJob>) {
    if job.cancel.load(Ordering::Relaxed) {
        *job.completion.borrow_mut() = Some(Err("runner job cancelled".to_string()));
        return;
    }
    let runtime = OwnedJsRuntime::new().await;
    runtime.disable_runner().await;
    let cancelled = job.cancel.clone();
    let timed_out = job.timed_out.clone();
    let deadline = options
        .timeout_ms
        .map(|ms| Instant::now() + Duration::from_millis(ms));
    runtime
        .rt
        .set_interrupt_handler(Some(Box::new(move || {
            if cancelled.load(Ordering::Relaxed) {
                return true;
            }
            if deadline.is_some_and(|deadline| Instant::now() >= deadline) {
                timed_out.store(true, Ordering::Relaxed);
                return true;
            }
            false
        })))
        .await;
    let mut argv = options.argv.clone();
    if argv.is_empty() {
        argv.push("golem-code-runner".to_string());
    }
    let execution = async {
        runtime
            .configure_process(argv, options.env, PathBuf::from(&options.cwd))
            .await?;
        runtime.set_output_sink(job.clone()).await;
        runtime.initialize_node_builtins().await?;
        let clone_guard = r#"
            const __runnerNoResources = (value, seen = new Set()) => {
                if ((typeof value !== 'object' && typeof value !== 'function') || value === null || seen.has(value)) return value;
                seen.add(value);
                if (typeof value[Symbol.for('__wasm_rquickjs.structuredClone')] === 'function')
                    throw new TypeError('runner results cannot contain resources');
                if (value instanceof Map) for (const [key, entry] of value) { __runnerNoResources(key, seen); __runnerNoResources(entry, seen); }
                else if (value instanceof Set) for (const entry of value) __runnerNoResources(entry, seen);
                else for (const key of Object.keys(value)) __runnerNoResources(value[key], seen);
                return value;
            };
        "#;
        let (name, source) = if let Some(entry) = options.entry {
            let entry = PathBuf::from(entry);
            let entry = if entry.is_absolute() {
                entry
            } else {
                PathBuf::from(&options.cwd).join(entry)
            };
            let specifier =
                serde_json::to_string(&entry.to_string_lossy()).map_err(|e| e.to_string())?;
            ("__golem_code_runner_entry.mjs".to_string(), format!(
                "import {{ serialize }} from '__wasm_rquickjs_builtin/structured_clone';\n\
                 {clone_guard}\n\
                 globalThis.__golemCodeRunnerResult = (async () => {{
                   const module = await import({specifier});
                   const entrypoint = typeof module.default === 'function' ? module.default : module.run;
                   const value = typeof entrypoint === 'function' ? await entrypoint() : module.default;
                   return JSON.stringify(serialize(__runnerNoResources(value)));
                 }})();"))
        } else {
            (
                "__golem_code_runner_inline.mjs".to_string(),
                format!(
                    "import {{ serialize }} from '__wasm_rquickjs_builtin/structured_clone';\n\
                 {clone_guard}\n\
                 globalThis.__golemCodeRunnerResult = (async () => JSON.stringify(serialize(__runnerNoResources(await (async () => {{ {}\n}})()))))();",
                    options.source.unwrap_or_default()
                ),
            )
        };
        async_with!(runtime.ctx => |ctx| {
            Module::evaluate(ctx.clone(), name, source).catch(&ctx)
                .map_err(|e| crate::internal::format_caught_error(e))?.finish::<()>().catch(&ctx)
                .map_err(|e| crate::internal::format_caught_error(e))?;
            let promise: Promise = ctx.globals().get("__golemCodeRunnerResult")
                .map_err(|e| format!("runner result unavailable: {e:?}"))?;
            promise
                .into_future::<String>()
                .await
                .catch(&ctx)
                .map_err(crate::internal::format_caught_error)
        })
        .await
    };
    let control = async {
        loop {
            if job.timed_out.load(Ordering::Relaxed) {
                return Err("runner job timed out".to_string());
            }
            if job.overflowed.load(Ordering::Relaxed) && job.overflow == OverflowPolicy::Terminate {
                return Err("runner output exceeded maxBytes".to_string());
            }
            if job.cancel.load(Ordering::Relaxed) {
                return Err("runner job cancelled".to_string());
            }
            if deadline.is_some_and(|deadline| Instant::now() >= deadline) {
                job.timed_out.store(true, Ordering::Relaxed);
                return Err("runner job timed out".to_string());
            }
            sleep_for_runner_control().await;
        }
    };
    futures::pin_mut!(execution, control);
    let result = match futures::future::select(execution, control).await {
        futures::future::Either::Left((result, _)) => result,
        futures::future::Either::Right((result, _)) => result,
    };
    let result = if job.timed_out.load(Ordering::Relaxed) {
        Err("runner job timed out".to_string())
    } else if job.overflowed.load(Ordering::Relaxed) && job.overflow == OverflowPolicy::Terminate {
        Err("runner output exceeded maxBytes".to_string())
    } else if job.cancel.load(Ordering::Relaxed) {
        Err("runner job cancelled".to_string())
    } else {
        result
    };
    *job.completion.borrow_mut() = Some(result);
}

async fn sleep_for_runner_control() {
    #[cfg(feature = "p2")]
    wstd::task::sleep(wstd::time::Duration::from_millis(1)).await;

    #[cfg(feature = "p3")]
    wasip3::clocks::monotonic_clock::wait_for(1_000_000).await;
}

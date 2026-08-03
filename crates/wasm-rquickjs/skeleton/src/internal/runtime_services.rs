use futures::future::AbortHandle;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Function, JsLifetime, Module, Promise, Value,
    async_with,
};
use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::rc::Rc;
use std::sync::atomic::AtomicUsize;

/// Mutable services owned by one QuickJS runtime.
///
/// These live in rquickjs runtime userdata rather than the component-global
/// `JsState`, so additional runtimes can use built-ins without reaching into
/// the main component runtime.
pub(crate) struct RuntimeServices {
    pub(crate) timers: TimerServices,
    pub(crate) node_package_deprecation_warnings: RefCell<HashSet<String>>,
    pub(crate) process: ProcessServices,
    pub(crate) fs: RefCell<FsServices>,
    output: RefCell<Rc<dyn RuntimeOutputSink>>,
    pub(crate) runner_jobs: RefCell<HashMap<usize, Rc<crate::builtin::code_runner::RunnerJob>>>,
    pub(crate) next_runner_job_id: Cell<usize>,
    pub(crate) runner_enabled: Cell<bool>,
}

impl Default for RuntimeServices {
    fn default() -> Self {
        Self {
            timers: TimerServices::default(),
            node_package_deprecation_warnings: RefCell::default(),
            process: ProcessServices::default(),
            fs: RefCell::new(FsServices::default()),
            output: RefCell::new(Rc::new(ComponentOutputSink)),
            runner_jobs: RefCell::default(),
            next_runner_job_id: Cell::new(1),
            runner_enabled: Cell::new(true),
        }
    }
}

pub(crate) struct FsServices {
    pub(crate) files: HashMap<i32, std::fs::File>,
    pub(crate) next_fd: i32,
    pub(crate) path_mode_overrides: HashMap<String, u32>,
    pub(crate) fd_mode_overrides: HashMap<i32, u32>,
    pub(crate) fd_paths: HashMap<i32, String>,
    pub(crate) emulated_symlinks: HashMap<String, String>,
}

impl Default for FsServices {
    fn default() -> Self {
        Self {
            files: HashMap::new(),
            next_fd: 10,
            path_mode_overrides: HashMap::new(),
            fd_mode_overrides: HashMap::new(),
            fd_paths: HashMap::new(),
            emulated_symlinks: HashMap::new(),
        }
    }
}

impl FsServices {
    pub(crate) fn insert_file(&mut self, file: std::fs::File) -> i32 {
        let fd = self.next_fd;
        self.next_fd += 1;
        self.files.insert(fd, file);
        fd
    }
}

#[derive(Default)]
pub(crate) struct ProcessServices {
    isolated: RefCell<Option<IsolatedProcessState>>,
}

struct IsolatedProcessState {
    argv: Vec<String>,
    env: HashMap<String, String>,
    cwd: PathBuf,
}

impl ProcessServices {
    pub(crate) fn configure(
        &self,
        argv: Vec<String>,
        env: HashMap<String, String>,
        cwd: PathBuf,
    ) -> std::io::Result<()> {
        let cwd = normalize_absolute_path(&cwd)?;
        if !cwd.is_dir() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "runner cwd is not a directory",
            ));
        }
        *self.isolated.borrow_mut() = Some(IsolatedProcessState { argv, env, cwd });
        Ok(())
    }

    pub(crate) fn args(&self) -> Vec<String> {
        self.isolated
            .borrow()
            .as_ref()
            .map(|state| state.argv.clone())
            .unwrap_or_else(|| std::env::args().collect())
    }

    pub(crate) fn env(&self) -> HashMap<String, String> {
        self.isolated
            .borrow()
            .as_ref()
            .map(|state| state.env.clone())
            .unwrap_or_else(|| std::env::vars().collect())
    }

    pub(crate) fn cwd(&self) -> PathBuf {
        self.isolated
            .borrow()
            .as_ref()
            .map(|state| state.cwd.clone())
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from("/")))
    }

    /// Resolve a guest path without mutating the component-wide process cwd.
    ///
    /// Owned runtimes can execute concurrently, so relative filesystem paths
    /// must be anchored in this runtime's process state rather than delegated
    /// to `std::fs` (which would use shared ambient state).
    pub(crate) fn resolve_path(&self, path: &Path) -> std::io::Result<PathBuf> {
        let anchored = if path.is_absolute() {
            path.to_path_buf()
        } else {
            self.cwd().join(path)
        };
        normalize_absolute_path(&anchored)
    }

    pub(crate) fn chdir(&self, path: &Path) -> std::io::Result<()> {
        let mut isolated = self.isolated.borrow_mut();
        let Some(state) = isolated.as_mut() else {
            return std::env::set_current_dir(path);
        };
        let resolved = if path.is_absolute() {
            normalize_absolute_path(path)?
        } else {
            normalize_absolute_path(&state.cwd.join(path))?
        };
        if !resolved.is_dir() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "cwd is not a directory",
            ));
        }
        state.cwd = resolved;
        Ok(())
    }
}

pub(crate) fn normalize_absolute_path(path: &Path) -> std::io::Result<PathBuf> {
    if !path.is_absolute() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "path must be absolute",
        ));
    }
    let mut normalized = PathBuf::from("/");
    for component in path.components() {
        match component {
            Component::RootDir | Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::Normal(part) => normalized.push(part),
            Component::Prefix(_) => {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "unsupported path prefix",
                ));
            }
        }
    }
    Ok(normalized)
}

pub(crate) trait RuntimeOutputSink {
    fn write_stdout(&self, data: &str);
    fn write_stderr(&self, data: &str);

    fn is_component_output(&self) -> bool {
        false
    }
}

struct ComponentOutputSink;

impl RuntimeOutputSink for ComponentOutputSink {
    fn write_stdout(&self, data: &str) {
        let _ = std::io::stdout().write_all(data.as_bytes());
        let _ = std::io::stdout().flush();
    }

    fn write_stderr(&self, data: &str) {
        let _ = std::io::stderr().write_all(data.as_bytes());
        let _ = std::io::stderr().flush();
    }

    fn is_component_output(&self) -> bool {
        true
    }
}

#[cfg(feature = "internal-test-code-runner")]
#[derive(Default)]
#[allow(dead_code)]
struct BufferOutputSink {
    stdout: RefCell<String>,
    stderr: RefCell<String>,
}

#[cfg(feature = "internal-test-code-runner")]
#[allow(dead_code)]
impl BufferOutputSink {
    fn stdout(&self) -> String {
        self.stdout.borrow().clone()
    }

    fn stderr(&self) -> String {
        self.stderr.borrow().clone()
    }
}

#[cfg(feature = "internal-test-code-runner")]
impl RuntimeOutputSink for BufferOutputSink {
    fn write_stdout(&self, data: &str) {
        self.stdout.borrow_mut().push_str(data);
    }

    fn write_stderr(&self, data: &str) {
        self.stderr.borrow_mut().push_str(data);
    }
}

impl RuntimeServices {
    pub(crate) fn output_sink(&self) -> Rc<dyn RuntimeOutputSink> {
        self.output.borrow().clone()
    }

    pub(crate) fn set_output_sink(&self, output: Rc<dyn RuntimeOutputSink>) {
        *self.output.borrow_mut() = output;
    }
}

/// A standalone QuickJS runtime with all context-local native services installed.
///
/// It deliberately does not initialize component resource bridges, builtin JS
/// wiring, or the generated component user module. Those are explicit policies
/// layered on top by the main component runtime and by future runner jobs.
pub(crate) struct OwnedJsRuntime {
    pub(crate) rt: AsyncRuntime,
    pub(crate) ctx: AsyncContext,
}

impl OwnedJsRuntime {
    pub(crate) async fn new() -> Self {
        let rt = AsyncRuntime::new().expect("Failed to create AsyncRuntime");
        rt.set_gc_threshold(256 * 1024 * 1024).await;
        let ctx = AsyncContext::full(&rt)
            .await
            .expect("Failed to create AsyncContext");

        async_with!(ctx => |ctx| {
            ctx.store_userdata(RuntimeServices::default())
                .expect("Failed to initialize runtime services");
        })
        .await;

        super::module_loading::initialize_module_loading(&rt, &ctx).await;

        rt.set_host_promise_rejection_tracker(Some(Box::new(
            |ctx, promise, reason, is_handled| {
                if let Ok(handler) = ctx
                    .globals()
                    .get::<_, Function>("__wasm_rquickjs_rejection_tracker")
                {
                    let _ = handler.call::<_, Value>((promise, reason, is_handled));
                }
            },
        )))
        .await;

        Self { rt, ctx }
    }

    /// Install the ordinary Node-compatible global environment without loading
    /// the generated component entry module or any generated WIT bridge state.
    pub(crate) async fn initialize_node_builtins(&self) -> Result<(), String> {
        initialize_dispose_symbols(&self.ctx).await?;
        self.rt.idle().await;
        initialize_builtin_wiring(&self.ctx).await?;
        self.rt.idle().await;
        Ok(())
    }

    pub(crate) async fn configure_process(
        &self,
        argv: Vec<String>,
        env: HashMap<String, String>,
        cwd: PathBuf,
    ) -> Result<(), String> {
        async_with!(self.ctx => |ctx| {
            ctx.userdata::<RuntimeServices>()
                .expect("runtime services not initialized")
                .process
                .configure(argv, env, cwd)
                .map_err(|error| error.to_string())
        })
        .await
    }

    pub(crate) async fn set_output_sink(&self, output: Rc<dyn RuntimeOutputSink>) {
        async_with!(self.ctx => |ctx| {
            ctx.userdata::<RuntimeServices>()
                .expect("runtime services not initialized")
                .set_output_sink(output);
        })
        .await;
    }

    pub(crate) async fn disable_runner(&self) {
        async_with!(self.ctx => |ctx| {
            ctx.userdata::<RuntimeServices>()
                .expect("runtime services not initialized")
                .runner_enabled
                .set(false);
        })
        .await;
    }
}

/// Temporary integration probe used while the public runner lifecycle is built.
/// Its native bridge and fixture are removed once runner tests cover these same
/// cross-runtime invariants.
#[cfg(feature = "internal-test-code-runner")]
#[allow(dead_code)]
pub(crate) async fn owned_runtime_isolation_probe() -> Result<String, String> {
    let left_cwd = PathBuf::from("/tmp/wasm-rquickjs-owned-left");
    let right_cwd = PathBuf::from("/tmp/wasm-rquickjs-owned-right");
    prepare_owned_runtime_probe_dir(&left_cwd, "left")?;
    prepare_owned_runtime_probe_dir(&right_cwd, "right")?;

    let active = Rc::new(Cell::new(0));
    let peak_active = Rc::new(Cell::new(0));
    let left = run_owned_runtime_probe(
        "left",
        8,
        left_cwd.clone(),
        active.clone(),
        peak_active.clone(),
    );
    let right = run_owned_runtime_probe(
        "right",
        1,
        right_cwd.clone(),
        active.clone(),
        peak_active.clone(),
    );
    let (left, right) = futures::future::join(left, right).await;
    let left = left?;
    let right = right?;
    let report = serde_json::to_string(&serde_json::json!({
        "left": left,
        "right": right,
        "peakActive": peak_active.get(),
    }))
    .map_err(|error| error.to_string())?;
    std::fs::remove_dir_all(&left_cwd).map_err(|error| error.to_string())?;
    std::fs::remove_dir_all(&right_cwd).map_err(|error| error.to_string())?;
    Ok(report)
}

#[cfg(feature = "internal-test-code-runner")]
#[allow(dead_code)]
fn prepare_owned_runtime_probe_dir(cwd: &Path, label: &str) -> Result<(), String> {
    if cwd.exists() {
        std::fs::remove_dir_all(cwd).map_err(|error| error.to_string())?;
    }
    std::fs::create_dir_all(cwd).map_err(|error| error.to_string())?;
    std::fs::write(cwd.join("local.mjs"), format!("export default {label:?};"))
        .map_err(|error| error.to_string())
}

#[cfg(feature = "internal-test-code-runner")]
#[allow(dead_code)]
async fn run_owned_runtime_probe(
    label: &str,
    delay_ms: u32,
    cwd: PathBuf,
    active: Rc<Cell<usize>>,
    peak_active: Rc<Cell<usize>>,
) -> Result<serde_json::Value, String> {
    struct ActiveGuard(Rc<Cell<usize>>);

    impl Drop for ActiveGuard {
        fn drop(&mut self) {
            self.0.set(self.0.get() - 1);
        }
    }

    let runtime = OwnedJsRuntime::new().await;
    let output = Rc::new(BufferOutputSink::default());
    runtime
        .configure_process(
            vec!["node".to_string(), format!("/{label}.mjs")],
            HashMap::from([("RUNNER_LABEL".to_string(), label.to_string())]),
            cwd.clone(),
        )
        .await?;
    runtime.set_output_sink(output.clone()).await;
    runtime.initialize_node_builtins().await?;

    active.set(active.get() + 1);
    peak_active.set(peak_active.get().max(active.get()));
    let _active_guard = ActiveGuard(active);

    let label_json = serde_json::to_string(label).map_err(|error| error.to_string())?;
    let module_name = cwd.join("entry.mjs").to_string_lossy().into_owned();
    let source = format!(
        r#"
        import fs from 'node:fs';
        import fsp from 'node:fs/promises';
        globalThis.__ownedRuntimeProbe = (async () => {{
            let probeStage = 'process-state';
            try {{
            process.env.RUNTIME_MUTATION = {label_json} + ':mutated';
            probeStage = 'write-data';
            fs.writeFileSync('./data.txt', {label_json});
            const syncFile = fs.readFileSync('./data.txt', 'utf8');
            const asyncFile = await fsp.readFile('./data.txt', 'utf8');
            probeStage = 'open-fds';
            const fd = fs.openSync('./data.txt', 'r');
            const secondFd = {label_json} === 'left' ? fs.openSync('./data.txt', 'r') : null;
            let foreignFdError = null;
            if ({label_json} === 'right') {{
                try {{ fs.fstatSync(14); }} catch (error) {{ foreignFdError = error.code; }}
            }}
            probeStage = 'mode';
            fs.chmodSync('./data.txt', {label_json} === 'left' ? 0o600 : 0o640);
            const mode = fs.statSync('./data.txt').mode & 0o7777;
            probeStage = 'file-symlink';
            fs.writeFileSync('./target.txt', {label_json} + ':target');
            fs.symlinkSync('./target.txt', './link.txt');
            const linkTarget = fs.readlinkSync('./link.txt');
            const linkValue = fs.readFileSync('./link.txt', 'utf8');
            probeStage = 'link-parent';
            fs.mkdirSync('./real/sub', {{ recursive: true }});
            fs.writeFileSync('./real/sibling.txt', {label_json} + ':sibling');
            fs.symlinkSync('./real/sub', './dir-link');
            const linkParentValue = fs.readFileSync('./dir-link/../sibling.txt', 'utf8');
            fs.closeSync(fd);
            if (secondFd !== null) fs.closeSync(secondFd);
            probeStage = 'symlinked-modules';
            process.execArgv.push('--preserve-symlinks');
            fs.mkdirSync('./node_modules/real-pkg', {{ recursive: true }});
            fs.writeFileSync('./node_modules/real-pkg/package.json', JSON.stringify({{
                name: 'linked-pkg',
                type: 'module',
                exports: './index.mjs',
            }}));
            fs.writeFileSync('./node_modules/real-pkg/index.mjs',
                'export default "' + {label_json} + ':package";');
            fs.symlinkSync('./real-pkg', './node_modules/linked-pkg');
            fs.writeFileSync('./esm-target.mjs',
                'export default "' + {label_json} + ':esm";');
            fs.symlinkSync('./esm-target.mjs', './esm-link.mjs');
            fs.writeFileSync('./json-target.json', JSON.stringify({{ value: {label_json} + ':json' }}));
            fs.symlinkSync('./json-target.json', './json-link.json');
            fs.writeFileSync('./json-consumer.mjs',
                'import value from "./json-link.json" with {{ type: "json" }}; export default value;');
            fs.mkdirSync('./cjs-physical', {{ recursive: true }});
            fs.mkdirSync('./cjs-logical', {{ recursive: true }});
            fs.writeFileSync('./cjs-physical/dep.cjs',
                'exports.physicalOnly = "wrong";');
            fs.writeFileSync('./cjs-logical/dep.cjs',
                'exports.reexported = "' + {label_json} + ':cjs";');
            fs.writeFileSync('./cjs-physical/target.cjs',
                'module.exports = require("./dep.cjs");');
            fs.symlinkSync('../cjs-physical/target.cjs', './cjs-logical/link.cjs');
            const packageModule = await import('linked-pkg');
            const esmModule = await import('./esm-link.mjs');
            const jsonModule = await import('./json-consumer.mjs');
            const cjsModule = await import('./cjs-logical/link.cjs');
            probeStage = 'relative-import';
            const relativeModule = await import('./local.mjs');
            console.log({label_json} + ':start');
            process.stderr.write({label_json} + ':stderr\n');
            return await new Promise((resolve) => {{
                const timer = setTimeout(() => {{
                    console.log({label_json} + ':end');
                    resolve(JSON.stringify({{
                    label: process.env.RUNNER_LABEL,
                    mutation: process.env.RUNTIME_MUTATION,
                    argv: process.argv,
                    cwd: process.cwd(),
                    timerId: Number(timer),
                    syncFile,
                    asyncFile,
                    fd,
                    secondFd,
                    foreignFdError,
                    mode,
                    linkTarget,
                    linkValue,
                    linkParentValue,
                    packageValue: packageModule.default,
                    esmValue: esmModule.default,
                    jsonValue: jsonModule.default.value,
                    cjsReexportValue: cjsModule.reexported,
                    relativeModule: relativeModule.default,
                    }}));
                }}, {delay_ms});
            }});
            }} catch (error) {{
                return JSON.stringify({{
                    probeError: {{
                        stage: probeStage,
                        name: error?.name ?? null,
                        code: error?.code ?? null,
                        message: error?.message ?? String(error),
                        stack: error?.stack ?? null,
                    }},
                }});
            }}
        }})();
        "#
    );

    let result = async_with!(runtime.ctx => |ctx| {
        Module::evaluate(ctx.clone(), module_name, source)
            .catch(&ctx)
            .map_err(|error| super::format_caught_error(error))?
            .finish::<()>()
            .catch(&ctx)
            .map_err(|error| super::format_caught_error(error))?;
        let promise: Promise = ctx
            .globals()
            .get("__ownedRuntimeProbe")
            .map_err(|error| format!("probe promise unavailable: {error:?}"))?;
        promise
            .into_future::<String>()
            .await
            .map_err(|error| format!("probe promise failed: {error:?}"))
    })
    .await
    .map_err(|error| {
        format!(
            "{error}; captured stdout: {:?}; captured stderr: {:?}",
            output.stdout(),
            output.stderr()
        )
    })?;
    runtime.rt.idle().await;

    let value: serde_json::Value =
        serde_json::from_str(&result).map_err(|error| error.to_string())?;
    Ok(serde_json::json!({
        "value": value,
        "stdout": output.stdout(),
        "stderr": output.stderr(),
    }))
}

pub(crate) async fn initialize_dispose_symbols(ctx: &AsyncContext) -> Result<(), String> {
    async_with!(ctx => |ctx| {
        Module::evaluate(
            ctx.clone(),
            "dispose",
            r#"
            const dispose = Symbol.for("dispose");
            globalThis.__wasm_rquickjs_symbol_dispose = dispose;
            Symbol.dispose = dispose;
            const asyncDispose = Symbol.for("asyncDispose");
            Symbol.asyncDispose = asyncDispose;
            "#,
        )
        .catch(&ctx)
        .map_err(|error| {
            format!(
                "Failed to evaluate dispose module initialization:\n{}",
                super::format_caught_error(error)
            )
        })?
        .finish::<()>()
        .catch(&ctx)
        .map_err(|error| {
            format!(
                "Failed to finish dispose module initialization:\n{}",
                super::format_caught_error(error)
            )
        })?;
        Ok::<(), String>(())
    })
    .await
}

pub(crate) async fn initialize_builtin_wiring(ctx: &AsyncContext) -> Result<(), String> {
    async_with!(ctx => |ctx| {
        Module::evaluate(
            ctx.clone(),
            "__wasm_rquickjs_init_wiring",
            crate::builtin::wire_builtins(),
        )
        .catch(&ctx)
        .map_err(|error| {
            format!(
                "Failed to evaluate built-in wiring:\n{}",
                super::format_caught_error(error)
            )
        })?
        .finish::<()>()
        .catch(&ctx)
        .map_err(|error| {
            format!(
                "Failed to finish built-in wiring:\n{}",
                super::format_caught_error(error)
            )
        })?;
        Ok::<(), String>(())
    })
    .await
}

// RuntimeServices contains no JavaScript-lifetime-bound values.
unsafe impl<'js> JsLifetime<'js> for RuntimeServices {
    type Changed<'to> = RuntimeServices;
}

#[derive(Default)]
pub(crate) struct TimerServices {
    pub(crate) abort_handles: RefCell<HashMap<usize, AbortHandle>>,
    pub(crate) last_abort_id: AtomicUsize,
    pub(crate) unrefed_timers: RefCell<HashSet<usize>>,
}

impl TimerServices {
    pub(crate) fn abort_unrefed(&self) {
        let unrefed = self.unrefed_timers.borrow().clone();
        let mut abort_handles = self.abort_handles.borrow_mut();
        let mut unrefed_mut = self.unrefed_timers.borrow_mut();
        for id in &unrefed {
            if let Some(handle) = abort_handles.remove(id) {
                handle.abort();
            }
            unrefed_mut.remove(id);
        }
    }

    pub(crate) fn is_empty(&self) -> bool {
        self.abort_handles.borrow().is_empty() && self.unrefed_timers.borrow().is_empty()
    }
}

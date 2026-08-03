use futures::future::AbortHandle;
use rquickjs::{
    AsyncContext, AsyncRuntime, CatchResultExt, Function, JsLifetime, Module, Value, async_with,
};
use std::cell::RefCell;
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
    output: RefCell<Rc<dyn RuntimeOutputSink>>,
}

impl Default for RuntimeServices {
    fn default() -> Self {
        Self {
            timers: TimerServices::default(),
            node_package_deprecation_warnings: RefCell::default(),
            process: ProcessServices::default(),
            output: RefCell::new(Rc::new(ComponentOutputSink)),
        }
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

fn normalize_absolute_path(path: &Path) -> std::io::Result<PathBuf> {
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
    fn write_stdout(&self, data: &[u8]);
    fn write_stderr(&self, data: &[u8]);
}

struct ComponentOutputSink;

impl RuntimeOutputSink for ComponentOutputSink {
    fn write_stdout(&self, data: &[u8]) {
        let _ = std::io::stdout().write_all(data);
        let _ = std::io::stdout().flush();
    }

    fn write_stderr(&self, data: &[u8]) {
        let _ = std::io::stderr().write_all(data);
        let _ = std::io::stderr().flush();
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

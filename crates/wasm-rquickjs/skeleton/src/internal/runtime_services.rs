use futures::future::AbortHandle;
use rquickjs::{AsyncContext, AsyncRuntime, Function, JsLifetime, Value, async_with};
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::io::Write;
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
    output: RefCell<Rc<dyn RuntimeOutputSink>>,
}

impl Default for RuntimeServices {
    fn default() -> Self {
        Self {
            timers: TimerServices::default(),
            node_package_deprecation_warnings: RefCell::default(),
            output: RefCell::new(Rc::new(ComponentOutputSink)),
        }
    }
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

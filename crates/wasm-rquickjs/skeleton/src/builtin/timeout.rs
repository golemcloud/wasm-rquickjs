use crate::internal::{
    format_caught_error,
    runtime_services::{RuntimeServices, TimerServices, run_process_turn_checkpoint},
};
use rquickjs::function::Args;
use rquickjs::{CatchResultExt, Ctx, Persistent, Value};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};

// Native functions for the timeout implementation
#[rquickjs::module]
pub mod native_module {
    use crate::internal::runtime_services::RuntimeServices;
    use futures::future::abortable;
    use rquickjs::{Ctx, Persistent, Value};
    use std::sync::atomic::Ordering;

    #[rquickjs::function]
    pub fn schedule(
        ctx: Ctx<'_>,
        code_or_fn: Persistent<Value<'static>>,
        delay: u32,
        periodic: bool,
        args: Persistent<Vec<Value<'static>>>,
    ) -> usize {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        let key = services
            .timers
            .last_abort_id
            .fetch_add(1, Ordering::Relaxed);

        let timers = services.timers.clone();
        drop(services);
        #[cfg(feature = "p3")]
        if let Some(owner) = timers
            .child_owner
            .borrow()
            .as_ref()
            .and_then(std::rc::Weak::upgrade)
        {
            let (handle, registration) = futures::future::AbortHandle::new_pair();
            timers.abort_handles.borrow_mut().insert(key, handle);
            owner.schedule(
                super::super::child_timers::ChildTimer {
                    key,
                    delay,
                    periodic,
                    callback: code_or_fn,
                    args,
                },
                registration,
            );
            timers.changed();
            return key;
        }
        if timers.component_owned.get() {
            let (task, handle) = abortable(super::scheduled_component_task(
                code_or_fn, delay, periodic, args, key,
            ));
            timers.abort_handles.borrow_mut().insert(key, handle);
            timers.active_tasks.borrow_mut().insert(key);
            let task = super::ComponentTimerTask {
                task: Some(Box::pin(async move {
                    let _ = task.await;
                })),
                timers: timers.clone(),
                key,
            };
            // A synchronous P3 resource call must return without starting clock imports.
            // Transfer the already-rooted task when the JS scheduler is next driven; only
            // the dispatcher lives there, so sleeping clocks still do not keep it busy.
            ctx.spawn(async move {
                crate::internal::spawn_component_timer(task);
            });
        } else {
            // Owned execution jobs keep their own context and cancellation scope.
            let (task, handle) = abortable(super::scheduled_task(
                ctx.clone(),
                code_or_fn,
                delay,
                periodic,
                args,
                key,
            ));
            timers.abort_handles.borrow_mut().insert(key, handle);
            let task_timers = timers.clone();
            ctx.spawn(async move {
                let _ = task.await;
                task_timers.abort_handles.borrow_mut().remove(&key);
                task_timers.unrefed_timers.borrow_mut().remove(&key);
                task_timers.changed();
            });
        }
        timers.changed();
        key
    }

    #[rquickjs::function]
    pub fn clear_schedule(ctx: Ctx<'_>, timeout_id: usize) {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        services
            .timers
            .unrefed_timers
            .borrow_mut()
            .remove(&timeout_id);
        let mut abort_handles = services.timers.abort_handles.borrow_mut();
        if let Some(handle) = abort_handles.remove(&timeout_id) {
            handle.abort();
        }
        drop(abort_handles);
        services.timers.changed();
    }

    #[rquickjs::function]
    pub fn unref_schedule(ctx: Ctx<'_>, timeout_id: usize) {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        if services
            .timers
            .abort_handles
            .borrow()
            .contains_key(&timeout_id)
        {
            services
                .timers
                .unrefed_timers
                .borrow_mut()
                .insert(timeout_id);
            services.timers.changed();
        }
    }

    #[rquickjs::function]
    pub fn ref_schedule(ctx: Ctx<'_>, timeout_id: usize) {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        services
            .timers
            .unrefed_timers
            .borrow_mut()
            .remove(&timeout_id);
        services.timers.changed();
    }

    #[rquickjs::function]
    pub fn ref_timer_count(ctx: Ctx<'_>) -> usize {
        let services = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized");
        let total = services.timers.abort_handles.borrow().len();
        let unrefed = services.timers.unrefed_timers.borrow().len();
        total.saturating_sub(unrefed)
    }
}

// JS functions for the timeout implementation
pub const TIMEOUT_JS: &str = include_str!("timeout.js");

// JS code wiring the timeout module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_timeout from '__wasm_rquickjs_builtin/timeout';
        globalThis.setTimeout = __wasm_rquickjs_timeout.setTimeout;
        globalThis.setImmediate = __wasm_rquickjs_timeout.setImmediate;
        globalThis.setInterval = __wasm_rquickjs_timeout.setInterval;
        globalThis.clearTimeout = __wasm_rquickjs_timeout.clearTimeout;
        globalThis.clearInterval = __wasm_rquickjs_timeout.clearInterval;
        globalThis.clearImmediate = __wasm_rquickjs_timeout.clearImmediate;
        globalThis.__wasm_rquickjs_ref_timer_count = __wasm_rquickjs_timeout.getRefTimerCount;
    "#;

/// The task's JS roots must be released before completion is observable to a snapshot/export.
struct ComponentTimerTask<F> {
    task: Option<Pin<Box<F>>>,
    timers: Rc<TimerServices>,
    key: usize,
}

impl<F: Future<Output = ()>> Future for ComponentTimerTask<F> {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        self.get_mut()
            .task
            .as_mut()
            .expect("timer task missing")
            .as_mut()
            .poll(cx)
    }
}

impl<F> Drop for ComponentTimerTask<F> {
    fn drop(&mut self) {
        drop(self.task.take());
        self.timers.abort_handles.borrow_mut().remove(&self.key);
        self.timers.unrefed_timers.borrow_mut().remove(&self.key);
        self.timers.active_tasks.borrow_mut().remove(&self.key);
        self.timers.changed();
    }
}

async fn scheduled_loop<F: Future<Output = bool>>(
    delay: u32,
    periodic: bool,
    mut callback: impl FnMut() -> F,
) {
    loop {
        #[cfg(feature = "p2")]
        wstd::task::sleep(wstd::time::Duration::from_millis(delay as u64)).await;
        #[cfg(feature = "p3")]
        wasip3::clocks::monotonic_clock::wait_for((delay as u64).saturating_mul(1_000_000)).await;
        let active = callback().await;
        if !periodic || !active {
            break;
        }
    }
}

async fn scheduled_task(
    ctx: Ctx<'_>,
    code_or_fn: Persistent<Value<'static>>,
    delay: u32,
    periodic: bool,
    args: Persistent<Vec<Value<'static>>>,
    timer_key: usize,
) {
    scheduled_loop(delay, periodic, || {
        let ctx = ctx.clone();
        let code_or_fn = code_or_fn.clone();
        let args = args.clone();
        async move { invoke_scheduled_task(ctx, code_or_fn, args, timer_key) }
    })
    .await;
}

async fn scheduled_component_task(
    code_or_fn: Persistent<Value<'static>>,
    delay: u32,
    periodic: bool,
    args: Persistent<Vec<Value<'static>>>,
    timer_key: usize,
) {
    scheduled_loop(delay, periodic, || {
        let code_or_fn = code_or_fn.clone();
        let args = args.clone();
        async move {
            let state = crate::internal::get_js_state();
            state
                .ctx
                .with(|ctx| {
                    let active = invoke_scheduled_task(ctx.clone(), code_or_fn, args, timer_key);
                    ctx.userdata::<RuntimeServices>()
                        .expect("runtime services not initialized")
                        .timers
                        .changed();
                    active
                })
                .await
        }
    })
    .await;
}

pub(crate) fn invoke_scheduled_task(
    ctx: Ctx<'_>,
    code_or_fn: Persistent<Value<'static>>,
    args: Persistent<Vec<Value<'static>>>,
    timer_key: usize,
) -> bool {
    run_scheduled_task(ctx.clone(), code_or_fn, args, timer_key)
        .catch(&ctx)
        .unwrap_or_else(|e| {
            eprintln!(
                "Timer callback error escaped JS uncaught handler: {}",
                format_caught_error(e)
            );
        });
    ctx.userdata::<RuntimeServices>()
        .expect("runtime services not initialized")
        .timers
        .abort_handles
        .borrow()
        .contains_key(&timer_key)
}

fn run_scheduled_task(
    ctx: Ctx,
    code_or_fn: Persistent<Value<'static>>,
    args: Persistent<Vec<Value<'static>>>,
    timer_key: usize,
) -> rquickjs::Result<()> {
    // A timer is the next host callback. Give nextTick and Promise jobs from
    // the preceding turn their normal handler opportunity, then report any
    // remaining unhandled rejections before this callback runs.
    run_process_turn_checkpoint(&ctx)?;

    // A rejection listener may cancel the timer whose callback was about to
    // run. The abort signal is observed only at the next async poll, so honor
    // the removed handle synchronously at this callback boundary as Node does.
    if !ctx
        .userdata::<RuntimeServices>()
        .expect("runtime services not initialized")
        .timers
        .abort_handles
        .borrow()
        .contains_key(&timer_key)
    {
        return Ok(());
    }

    let restored_code_or_fn = code_or_fn.restore(&ctx)?;
    let restored_args = args.restore(&ctx)?;

    let result = if let Some(func) = restored_code_or_fn.as_function() {
        let mut args = Args::new(ctx.clone(), restored_args.len());
        args.push_args(&restored_args)?;
        func.call_arg(args)
    } else if let Some(code) = restored_code_or_fn.as_string() {
        ctx.eval(code.to_string()?)
    } else {
        eprintln!("Unsupported value passed to setTimeout or setInterval: {restored_code_or_fn:?}");
        Ok(())
    };

    result?;

    // A timer callback is itself a Node turn. Drain nextTick before Promise jobs and process
    // rejection events to a fixpoint before another timer callback can run.
    run_process_turn_checkpoint(&ctx)?;

    Ok(())
}

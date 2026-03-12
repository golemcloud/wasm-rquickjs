use crate::internal::format_caught_error;
use rquickjs::function::Args;
use rquickjs::{CatchResultExt, Ctx, Persistent, Value};

// Native functions for the timeout implementation
#[rquickjs::module]
pub mod native_module {
    use crate::internal::get_js_state;
    use futures::future::abortable;
    use rquickjs::{Ctx, Persistent, Value};
    use std::sync::atomic::Ordering;

    #[rquickjs::function]
    pub fn schedule(
        ctx: Ctx<'_>,
        code_or_fn: Persistent<Value<'static>>,
        delay: Value<'_>,
        periodic: bool,
        args: Persistent<Vec<Value<'static>>>,
    ) -> usize {
        let state = get_js_state();
        let delay: u32 = if delay.is_null() || delay.is_undefined() {
            0
        } else if let Some(n) = delay.as_number() {
            if n.is_finite() && n > 0.0 {
                n as u32
            } else {
                0
            }
        } else if let Some(n) = delay.as_int() {
            if n > 0 { n as u32 } else { 0 }
        } else {
            0
        };

        let (task, abort_handle) = abortable(super::scheduled_task(
            ctx.clone(),
            code_or_fn,
            delay,
            periodic,
            args,
        ));

        let key = state.last_abort_id.fetch_add(1, Ordering::Relaxed);
        ctx.spawn(async move {
            let _ = task.await;
            // Clean up after the task completes naturally
            let state = get_js_state();
            state.abort_handles.borrow_mut().remove(&key);
            state.unrefed_timers.borrow_mut().remove(&key);
        });
        state.abort_handles.borrow_mut().insert(key, abort_handle);
        key
    }

    #[rquickjs::function]
    pub fn clear_schedule(timeout_id: usize) {
        let state = get_js_state();
        state.unrefed_timers.borrow_mut().remove(&timeout_id);
        let mut abort_handles = state.abort_handles.borrow_mut();
        if let Some(handle) = abort_handles.remove(&timeout_id) {
            handle.abort();
        }
    }

    #[rquickjs::function]
    pub fn unref_schedule(timeout_id: usize) {
        let state = get_js_state();
        state.unrefed_timers.borrow_mut().insert(timeout_id);
    }

    #[rquickjs::function]
    pub fn ref_schedule(timeout_id: usize) {
        let state = get_js_state();
        state.unrefed_timers.borrow_mut().remove(&timeout_id);
    }

    #[rquickjs::function]
    pub fn ref_timer_count() -> usize {
        let state = get_js_state();
        let total = state.abort_handles.borrow().len();
        let unrefed = state.unrefed_timers.borrow().len();
        total.saturating_sub(unrefed)
    }
}

// JS functions for the console implementation
pub const TIMEOUT_JS: &str = include_str!("timeout.js");

// JS code wiring the console module into the global context
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

async fn scheduled_task(
    ctx: Ctx<'_>,
    code_or_fn: Persistent<Value<'static>>,
    delay: u32,
    periodic: bool,
    args: Persistent<Vec<Value<'static>>>,
) {
    if delay == 0 {
        run_scheduled_task(ctx.clone(), code_or_fn.clone(), args.clone())
            .catch(&ctx)
            .unwrap_or_else(|e| {
                eprintln!(
                    "Uncaught exception in timer callback: {}",
                    format_caught_error(e)
                )
            });
    } else {
        let duration = wstd::time::Duration::from_millis(delay as u64);

        loop {
            wstd::task::sleep(duration).await;

            run_scheduled_task(ctx.clone(), code_or_fn.clone(), args.clone())
                .catch(&ctx)
                .unwrap_or_else(|e| {
                    eprintln!(
                        "Uncaught exception in timer callback: {}",
                        format_caught_error(e)
                    )
                });

            if !periodic {
                break;
            }
        }
    }
}

fn run_scheduled_task(
    ctx: Ctx,
    code_or_fn: Persistent<Value<'static>>,
    args: Persistent<Vec<Value<'static>>>,
) -> rquickjs::Result<()> {
    let restored_code_or_fn = code_or_fn.restore(&ctx)?;
    let restored_args = args.restore(&ctx)?;

    if let Some(func) = restored_code_or_fn.as_function() {
        let mut args = Args::new(ctx, restored_args.len());
        args.push_args(&restored_args)?;
        func.call_arg(args)
    } else if let Some(code) = restored_code_or_fn.as_string() {
        ctx.eval(code.to_string()?)
    } else {
        eprintln!("Unsupported value passed to setTimeout or setInterval: {restored_code_or_fn:?}");
        Ok(())
    }
}

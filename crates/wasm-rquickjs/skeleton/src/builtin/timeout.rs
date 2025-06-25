use crate::internal::get_js_state;
use rquickjs::function::Args;
use rquickjs::{Ctx, Persistent, Value};
use std::time::Duration;
use tokio::select;
use tokio_util::sync::CancellationToken;

// Native functions for the timeout implementation
#[rquickjs::module]
pub mod native_module {
    use crate::internal::get_js_state;
    use rquickjs::{Persistent, Value};
    use tokio_util::sync::CancellationToken;

    #[rquickjs::function]
    pub fn schedule(
        code_or_fn: Persistent<Value<'static>>,
        delay: Option<u32>,
        periodic: bool,
        args: Persistent<Vec<Value<'static>>>,
    ) -> u32 {
        let state = get_js_state();
        let delay = delay.unwrap_or(0);

        let id = state
            .last_scheduled_task_id
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        let token = CancellationToken::new();

        let mut scheduled_tasks = state.scheduled_tasks.borrow_mut();
        scheduled_tasks.insert(id, token.clone());
        drop(scheduled_tasks);

        let mut join_set = state.current_join_set.borrow_mut();
        if let Some(join_set) = join_set.as_mut() {
            let _ = join_set.spawn_local(async move {
                super::scheduled_task(token, code_or_fn, delay, periodic, args).await;
            });

            id
        } else {
            panic!("No JoinSet available, cannot spawn new task");
        }
    }

    #[rquickjs::function]
    pub fn clear_schedule(timeout_id: u32) {
        let state = get_js_state();
        let mut scheduled_tasks = state.scheduled_tasks.borrow_mut();
        if let Some(token) = scheduled_tasks.remove(&timeout_id) {
            token.cancel();
        }
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
    "#;

async fn scheduled_task(
    token: CancellationToken,
    code_or_fn: Persistent<Value<'static>>,
    delay: u32,
    periodic: bool,
    args: Persistent<Vec<Value<'static>>>,
) {
    let state = get_js_state();
    let context = &state.ctx;

    if delay == 0 {
        context
            .with(|ctx| {
                run_scheduled_task(ctx, code_or_fn.clone(), args.clone())
                    .expect("Failed to run scheduled task");
            })
            .await;
    } else {
        let duration = Duration::from_millis(delay as u64);

        loop {
            select! {
                _ = token.cancelled() => break,
                _ = tokio::time::sleep(duration) => {
                        context.with(|ctx| {
                            run_scheduled_task(ctx, code_or_fn.clone(), args.clone()).expect("Failed to run scheduled task");
                        }).await;
                }
            }

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
        func.defer_arg(args)
    } else if let Some(code) = restored_code_or_fn.as_string() {
        if restored_args.len() > 0 {
            panic!("Passing arguments to scheduled code snippets is not supported");
        }
        ctx.eval(code.to_string()?)
    } else {
        panic!(
            "Unsupported value passed to setTimeout or setInterval: {:?}",
            restored_code_or_fn
        );
    }
}

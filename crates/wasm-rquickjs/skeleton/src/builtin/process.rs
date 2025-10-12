// Native functions for the process implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use crate::internal::{format_caught_error, get_js_state};
    use rquickjs::function::Args;
    use rquickjs::{CatchResultExt, Ctx, Function, Persistent, Value, async_with};
    use std::collections::HashMap;

    #[rquickjs::function]
    pub fn get_args() -> Vec<String> {
        std::env::args().collect()
    }

    #[rquickjs::function]
    pub fn get_env() -> HashMap<String, String> {
        std::env::vars().collect()
    }

    #[rquickjs::function]
    pub fn next_tick(
        ctx: Ctx<'_>,
        function: Persistent<Function<'static>>,
        args: Persistent<Vec<Value<'static>>>,
    ) {
        let state = get_js_state();

        println!("add_next_tick_callback");
        state.add_next_tick_callback(Box::new(move || {
            Box::pin(next_tick_callback(function, args))
        }))
    }

    async fn next_tick_callback(
        function: Persistent<Function<'static>>,
        args: Persistent<Vec<Value<'static>>>,
    ) {
        let state = get_js_state();
        async_with!(state.ctx => |ctx| {
            let restored_function = function
                .restore(&ctx)
                .expect("Failed to restore nextTick function");
            let restored_args = args.restore(&ctx).expect("Failed to restore args");

            let mut args = Args::new(ctx.clone(), restored_args.len());
            args.push_args(&restored_args)
                .expect("Failed to set args for nextTick callback");
            restored_function
                .call_arg::<()>(args)
                .catch(&ctx)
                .unwrap_or_else(|e| {
                    panic!("Failed to run scheduled task:\n{}", format_caught_error(e))
                });
        })
        .await;
    }
}

// JS functions for the process implementation
pub const PROCESS_JS: &str = include_str!("process.js");

// Native functions for the process implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::function::Args;
    use rquickjs::{Ctx, Function, Value};
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
    pub fn next_tick<'js>(ctx: Ctx<'js>, function: Function<'js>, args: Vec<Value<'js>>) {
        let mut js_args = Args::new(ctx, args.len());
        js_args
            .push_args(args)
            .expect("Failed to set args for nextTick");
        js_args
            .defer(function)
            .expect("Failed to defer nextTick callback");
    }
}

// JS functions for the process implementation
pub const PROCESS_JS: &str = include_str!("process.js");

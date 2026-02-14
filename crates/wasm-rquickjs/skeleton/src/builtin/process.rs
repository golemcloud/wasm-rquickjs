// Native functions for the process implementation
#[rquickjs::module(rename = "camelCase")]
pub mod native_module {
    use rquickjs::function::Args;
    use rquickjs::{Ctx, Function, Value};
    use std::collections::HashMap;
    use std::io::Write;

    #[rquickjs::function]
    pub fn write_stdout(data: String) {
        let _ = std::io::stdout().write_all(data.as_bytes());
        let _ = std::io::stdout().flush();
    }

    #[rquickjs::function]
    pub fn write_stderr(data: String) {
        let _ = std::io::stderr().write_all(data.as_bytes());
        let _ = std::io::stderr().flush();
    }

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

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:process'; export { default } from 'node:process';"#;

pub const WIRE_JS: &str = r#"
        import __wasm_rquickjs_process from 'node:process';
        globalThis.process = __wasm_rquickjs_process;
    "#;

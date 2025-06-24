// Native functions for the console implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    #[rquickjs::function]
    pub fn println(line: String) {
        println!("{line}");
    }

    // TODO: function for different log levels, linking to wasi:logging if present, otherwise fallback to println
}

// JS functions for the console implementation
pub const CONSOLE_JS: &str = include_str!("console.js");

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = r#"
        import * as console from '__wasm_rquickjs_builtin/console';
        globalThis.console = console;
    "#;

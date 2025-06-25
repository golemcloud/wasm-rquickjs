// Native functions for the console implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    #[rquickjs::function]
    pub fn println(line: String) {
        println!("{line}");
    }

    #[rquickjs::function]
    pub fn trace(line: String) {
        trace_impl(line)
    }

    #[rquickjs::function]
    pub fn debug(line: String) {
        debug_impl(line)
    }

    #[rquickjs::function]
    pub fn info(line: String) {
        info_impl(line)
    }

    #[rquickjs::function]
    pub fn warn(line: String) {
        warn_impl(line)
    }

    #[rquickjs::function]
    pub fn error(line: String) {
        error_impl(line)
    }

    #[cfg(not(feature = "logging"))]
    fn trace_impl(line: String) {
        println!("TRACE: {line}");
    }

    #[cfg(feature = "logging")]
    fn trace_impl(line: String) {
        log::trace!(target: "js", "{line}");
    }

    #[cfg(not(feature = "logging"))]
    fn debug_impl(line: String) {
        println!("DEBUG: {line}");
    }

    #[cfg(feature = "logging")]
    fn debug_impl(line: String) {
        log::debug!(target: "js", "{line}");
    }

    #[cfg(not(feature = "logging"))]
    fn info_impl(line: String) {
        println!("INFO: {line}");
    }

    #[cfg(feature = "logging")]
    fn info_impl(line: String) {
        log::info!(target: "js", "{line}");
    }

    #[cfg(not(feature = "logging"))]
    fn warn_impl(line: String) {
        println!("WARN: {line}");
    }

    #[cfg(feature = "logging")]
    fn warn_impl(line: String) {
        log::warn!(target: "js", "{line}");
    }

    #[cfg(not(feature = "logging"))]
    fn error_impl(line: String) {
        println!("ERROR: {line}");
    }

    #[cfg(feature = "logging")]
    fn error_impl(line: String) {
        log::error!(target: "js", "{line}");
    }
}

// JS functions for the console implementation
pub const CONSOLE_JS: &str = include_str!("console.js");

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_console from '__wasm_rquickjs_builtin/console';
        globalThis.console = __wasm_rquickjs_console;
    "#;

// Native functions for the console implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {
    use crate::internal::runtime_services::RuntimeServices;
    use rquickjs::Ctx;

    #[rquickjs::function]
    pub fn println(ctx: Ctx<'_>, line: String) {
        let output = ctx
            .userdata::<RuntimeServices>()
            .expect("runtime services not initialized")
            .output_sink();
        output.write_stdout(&format!("{line}\n"));
    }

    #[rquickjs::function]
    pub fn trace(ctx: Ctx<'_>, line: String) {
        log_line(ctx, LogLevel::Trace, &line);
    }

    #[rquickjs::function]
    pub fn debug(ctx: Ctx<'_>, line: String) {
        log_line(ctx, LogLevel::Debug, &line);
    }

    #[rquickjs::function]
    pub fn info(ctx: Ctx<'_>, line: String) {
        log_line(ctx, LogLevel::Info, &line);
    }

    #[rquickjs::function]
    pub fn warn(ctx: Ctx<'_>, line: String) {
        log_line(ctx, LogLevel::Warn, &line);
    }

    #[rquickjs::function]
    pub fn error(ctx: Ctx<'_>, line: String) {
        log_line(ctx, LogLevel::Error, &line);
    }

    enum LogLevel {
        Trace,
        Debug,
        Info,
        Warn,
        Error,
    }

    #[cfg(not(feature = "logging"))]
    fn log_line(ctx: Ctx<'_>, level: LogLevel, line: &str) {
        let prefix = match level {
            LogLevel::Trace => "TRACE",
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
        };
        println(ctx, format!("{prefix}: {line}"));
    }

    #[cfg(feature = "logging")]
    fn log_line(_ctx: Ctx<'_>, level: LogLevel, line: &str) {
        let wasi_level = match level {
            LogLevel::Trace => wasi_logging::Level::Trace,
            LogLevel::Debug => wasi_logging::Level::Debug,
            LogLevel::Info => wasi_logging::Level::Info,
            LogLevel::Warn => wasi_logging::Level::Warn,
            LogLevel::Error => wasi_logging::Level::Error,
        };
        wasi_logging::log(wasi_level, "", line);
    }

    #[rquickjs::function]
    pub fn is_logging_enabled(ctx: rquickjs::Ctx<'_>) -> bool {
        cfg!(feature = "logging")
            && ctx
                .userdata::<crate::internal::runtime_services::RuntimeServices>()
                .expect("runtime services not initialized")
                .output_sink()
                .is_component_output()
    }

    #[rquickjs::function]
    pub fn timestamp() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or_default()
    }
}

// JS functions for the console implementation
pub const CONSOLE_JS: &str = include_str!("console.js");
pub const PUBLIC_IMPLEMENTATION_JS: &str = r#"export * from '__wasm_rquickjs_builtin/console'; export { default } from '__wasm_rquickjs_builtin/console';"#;
pub const REEXPORT_JS: &str = r#"export * from 'node:console'; import { Console } from 'node:console'; const c = globalThis.console; c.Console = Console; export default c;"#;

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = "import { default as __console } from '__wasm_rquickjs_builtin/console'; globalThis.console = __console;";

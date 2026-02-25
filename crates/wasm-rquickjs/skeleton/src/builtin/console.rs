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
        wasi_logging::log(wasi_logging::Level::Trace, "", &line);
    }

    #[cfg(not(feature = "logging"))]
    fn debug_impl(line: String) {
        println!("DEBUG: {line}");
    }

    #[cfg(feature = "logging")]
    fn debug_impl(line: String) {
        wasi_logging::log(wasi_logging::Level::Debug, "", &line);
    }

    #[cfg(not(feature = "logging"))]
    fn info_impl(line: String) {
        println!("INFO: {line}");
    }

    #[cfg(feature = "logging")]
    fn info_impl(line: String) {
        wasi_logging::log(wasi_logging::Level::Info, "", &line);
    }

    #[cfg(not(feature = "logging"))]
    fn warn_impl(line: String) {
        println!("WARN: {line}");
    }

    #[cfg(feature = "logging")]
    fn warn_impl(line: String) {
        wasi_logging::log(wasi_logging::Level::Warn, "", &line);
    }

    #[cfg(not(feature = "logging"))]
    fn error_impl(line: String) {
        println!("ERROR: {line}");
    }

    #[cfg(feature = "logging")]
    fn error_impl(line: String) {
        wasi_logging::log(wasi_logging::Level::Error, "", &line);
    }

    #[rquickjs::function]
    pub fn timestamp() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }
}

// JS functions for the console implementation
pub const CONSOLE_JS: &str = include_str!("console.js");
pub const REEXPORT_JS: &str =
    r#"export * from 'node:console'; import { Console } from 'node:console'; const c = globalThis.console; c.Console = Console; export default c;"#;

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_console from '__wasm_rquickjs_builtin/console';

        const __wrap_console_method = (fn, name) => {
            if (name === 'Console' || typeof fn !== 'function') {
                return fn;
            }

            const wrapped = new Proxy(fn, {
                construct() {
                    throw new TypeError(`${name} is not a constructor`);
                }
            });

            Object.defineProperty(wrapped, 'name', {
                value: name,
                configurable: true
            });

            return wrapped;
        };

        const __console_obj = {};
        const __console_keys = Object.keys(__wasm_rquickjs_console);
        for (let i = 0; i < __console_keys.length; i++) {
            const k = __console_keys[i];
            if (k !== 'default') {
                __console_obj[k] = __wrap_console_method(__wasm_rquickjs_console[k], k);
            }
        }
        Object.defineProperty(__console_obj, '_stdout', {
            get() { return globalThis.process ? globalThis.process.stdout : undefined; },
            set(v) { Object.defineProperty(this, '_stdout', { value: v, writable: true, configurable: true, enumerable: false }); },
            configurable: true,
            enumerable: false
        });
        Object.defineProperty(__console_obj, '_stderr', {
            get() { return globalThis.process ? globalThis.process.stderr : undefined; },
            set(v) { Object.defineProperty(this, '_stderr', { value: v, writable: true, configurable: true, enumerable: false }); },
            configurable: true,
            enumerable: false
        });
        globalThis.console = __console_obj;
    "#;

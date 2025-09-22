use std::fmt::Write;

mod base64;
mod buffer;
mod console;
mod encoding;
mod fs;

#[cfg(feature = "http")]
mod http;

#[cfg(not(feature = "http"))]
mod http_disabled;
#[cfg(not(feature = "http"))]
mod http {
    pub use super::http_disabled::*;
}

mod ieee754;
mod process;
mod streams;
mod timeout;
mod url;
mod util;

pub fn add_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    resolver
        .with_module("__wasm_rquickjs_builtin/console_native")
        .with_module("__wasm_rquickjs_builtin/console")
        .with_module("__wasm_rquickjs_builtin/timeout_native")
        .with_module("__wasm_rquickjs_builtin/timeout")
        .with_module("__wasm_rquickjs_builtin/http_native")
        .with_module("__wasm_rquickjs_builtin/http")
        .with_module("__wasm_rquickjs_builtin/http_blob")
        .with_module("__wasm_rquickjs_builtin/http_form_data")
        .with_module("__wasm_rquickjs_builtin/streams")
        .with_module("__wasm_rquickjs_builtin/encoding_native")
        .with_module("__wasm_rquickjs_builtin/encoding")
        .with_module("node:util")
        .with_module("util")
        .with_module("__wasm_rquickjs_builtin/fs_native")
        .with_module("node:fs")
        .with_module("fs")
        .with_module("node:buffer")
        .with_module("buffer")
        .with_module("base64-js")
        .with_module("ieee754")
        .with_module("__wasm_rquickjs_builtin/process_native")
        .with_module("node:process")
        .with_module("process")
        .with_module("__wasm_rquickjs_builtin/url_native")
        .with_module("__wasm_rquickjs_builtin/url")
}

pub fn module_loader() -> (
    rquickjs::loader::ModuleLoader,
    rquickjs::loader::BuiltinLoader,
) {
    (
        rquickjs::loader::ModuleLoader::default()
            .with_module(
                "__wasm_rquickjs_builtin/console_native",
                console::js_native_module,
            )
            .with_module(
                "__wasm_rquickjs_builtin/timeout_native",
                timeout::js_native_module,
            )
            .with_module(
                "__wasm_rquickjs_builtin/http_native",
                http::js_native_module,
            )
            .with_module(
                "__wasm_rquickjs_builtin/encoding_native",
                encoding::js_native_module,
            )
            .with_module("__wasm_rquickjs_builtin/fs_native", fs::js_native_module)
            .with_module(
                "__wasm_rquickjs_builtin/process_native",
                process::js_native_module,
            )
            .with_module("__wasm_rquickjs_builtin/url_native", url::js_native_module),
        rquickjs::loader::BuiltinLoader::default()
            .with_module("__wasm_rquickjs_builtin/console", console::CONSOLE_JS)
            .with_module("__wasm_rquickjs_builtin/timeout", timeout::TIMEOUT_JS)
            .with_module("__wasm_rquickjs_builtin/http_blob", http::FETCH_BLOB_JS)
            .with_module("__wasm_rquickjs_builtin/http_form_data", http::FORMDATA_JS)
            .with_module("__wasm_rquickjs_builtin/http", http::HTTP_JS)
            .with_module("__wasm_rquickjs_builtin/streams", streams::STREAMS_JS)
            .with_module("__wasm_rquickjs_builtin/encoding", encoding::ENCODING_JS)
            .with_module("node:util", util::UTIL_JS)
            .with_module("util", util::UTIL_JS)
            .with_module("base64-js", base64::BASE64_JS)
            .with_module("ieee754", ieee754::IEEE754_JS)
            .with_module("node:buffer", buffer::BUFFER_JS)
            .with_module("buffer", buffer::BUFFER_JS)
            .with_module("node:fs", fs::FS_JS)
            .with_module("fs", fs::FS_JS)
            .with_module("node:process", process::PROCESS_JS)
            .with_module("process", process::PROCESS_JS)
            .with_module("__wasm_rquickjs_builtin/url", url::URL_JS),
    )
}

pub fn wire_builtins() -> String {
    let mut result = String::new();
    writeln!(result, "{}", console::WIRE_JS).unwrap();
    writeln!(result, "{}", timeout::WIRE_JS).unwrap();
    writeln!(result, "{}", http::WIRE_JS).unwrap();
    writeln!(result, "{}", streams::WIRE_JS).unwrap();
    writeln!(result, "{}", encoding::WIRE_JS).unwrap();
    writeln!(result, "{}", url::WIRE_JS).unwrap();

    result
}

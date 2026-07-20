use std::fmt::Write;

mod abort_controller;
mod assert;
mod async_hooks;
mod base64;
mod buffer;
mod child_process;
mod cluster;
mod console;
mod constants;
mod dgram;
mod diagnostics_channel;
mod dns;
mod domain;
mod encoding;
mod formdata_node;
mod fs;
mod gc;

#[cfg(feature = "fetch")]
mod http;

#[cfg(not(feature = "fetch"))]
mod http_disabled;
#[cfg(not(feature = "fetch"))]
mod http {
    pub use super::http_disabled::*;
}

mod events;
mod http2;
mod https;
mod ieee754;
mod inspector;
mod internal;
mod internal_binding_util;
mod intl;
mod module;
mod net;
mod socket_helpers;

#[cfg(feature = "node-http")]
mod node_http;

#[cfg(not(feature = "node-http"))]
mod node_http_disabled;
#[cfg(not(feature = "node-http"))]
mod node_http {
    pub use super::node_http_disabled::*;
}

mod node_test;
mod os;
mod path;
mod perf_hooks;
mod process;
mod punycode;
mod querystring;
mod readline;
mod repl;
mod stream;
mod string_decoder;
mod structured_clone;
mod timeout;
mod timers;
mod tls;
mod trace_events;
mod tty;
mod url;
mod util;
mod v8;
mod vm;
#[cfg(feature = "crypto")]
mod web_crypto;

#[cfg(not(feature = "crypto"))]
mod web_crypto_lite;
#[cfg(not(feature = "crypto"))]
mod web_crypto {
    pub use super::web_crypto_lite::*;
}

#[cfg(feature = "golem")]
mod websocket;
mod webstreams;
mod worker_threads;

#[cfg(feature = "zlib")]
mod zlib;

#[cfg(not(feature = "zlib"))]
mod zlib_disabled;
#[cfg(not(feature = "zlib"))]
mod zlib {
    pub use super::zlib_disabled::*;
}

#[cfg(feature = "sqlite")]
mod sqlite;

#[cfg(not(feature = "sqlite"))]
mod sqlite_disabled;
#[cfg(not(feature = "sqlite"))]
mod sqlite {
    pub use super::sqlite_disabled::*;
}

pub(crate) fn realpath_for_module_resolution(path: &str) -> Option<String> {
    fs::realpath_for_module_resolution(path)
}

pub fn add_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    let resolver = resolver
        .with_module("__wasm_rquickjs_builtin/abort_controller")
        .with_module("__wasm_rquickjs_builtin/base64_native")
        .with_module("__wasm_rquickjs_builtin/console_native")
        .with_module("__wasm_rquickjs_builtin/console")
        .with_module("__wasm_rquickjs_builtin/timeout_native")
        .with_module("__wasm_rquickjs_builtin/timeout")
        .with_module("__wasm_rquickjs_builtin/gc_native")
        .with_module("__wasm_rquickjs_builtin/http_native")
        .with_module("__wasm_rquickjs_builtin/http")
        .with_module("__wasm_rquickjs_builtin/http_blob")
        .with_module("__wasm_rquickjs_builtin/http_form_data")
        .with_module("__wasm_rquickjs_builtin/streams")
        .with_module("__wasm_rquickjs_builtin/webstreams_wrapper")
        .with_module("__wasm_rquickjs_builtin/encoding_native")
        .with_module("__wasm_rquickjs_builtin/encoding")
        .with_module("__wasm_rquickjs_builtin/intl_native")
        .with_module("__wasm_rquickjs_builtin/intl")
        .with_module("node:util")
        .with_module("node:util/types")
        .with_module("util")
        .with_module("util/types")
        .with_module("__wasm_rquickjs_builtin/fs_native")
        .with_module("node:fs")
        .with_module("fs")
        .with_module("node:fs/promises")
        .with_module("fs/promises")
        .with_module("internal/fs/promises")
        .with_module("node:buffer")
        .with_module("buffer")
        .with_module("base64-js")
        .with_module("ieee754")
        .with_module("__wasm_rquickjs_builtin/os_native")
        .with_module("node:os")
        .with_module("os")
        .with_module("node:assert")
        .with_module("assert")
        .with_module("node:assert/strict")
        .with_module("assert/strict")
        .with_module("node:querystring")
        .with_module("querystring")
        .with_module("node:child_process")
        .with_module("child_process")
        .with_module("node:test")
        .with_module("node:module")
        .with_module("module")
        .with_module("__wasm_rquickjs_builtin/process_native")
        .with_module("node:process")
        .with_module("process")
        .with_module("node:path")
        .with_module("path")
        .with_module("node:path/posix")
        .with_module("path/posix")
        .with_module("node:path/win32")
        .with_module("path/win32")
        .with_module("node:punycode")
        .with_module("punycode")
        .with_module("__wasm_rquickjs_builtin/url_native")
        .with_module("__wasm_rquickjs_builtin/url")
        .with_module("node:url")
        .with_module("url")
        .with_module("node:events")
        .with_module("events")
        .with_module("node:stream")
        .with_module("node:stream/promises")
        .with_module("node:stream/consumers")
        .with_module("node:stream/web")
        .with_module("stream")
        .with_module("stream/promises")
        .with_module("stream/consumers")
        .with_module("stream/web")
        .with_module("web-streams-polyfill")
        .with_module("formdata-node")
        .with_module("__wasm_rquickjs_builtin/string_decoder_native")
        .with_module("node:string_decoder")
        .with_module("string_decoder")
        .with_module("node:timers")
        .with_module("timers")
        .with_module("node:timers/promises")
        .with_module("timers/promises")
        .with_module("__wasm_rquickjs_builtin/web_crypto_native")
        .with_module("__wasm_rquickjs_builtin/web_crypto")
        .with_module("node:crypto")
        .with_module("crypto")
        .with_module("__wasm_rquickjs_builtin/vm_native")
        .with_module("__wasm_rquickjs_builtin/vm")
        .with_module("node:vm")
        .with_module("vm")
        .with_module("__wasm_rquickjs_builtin/structured_clone")
        .with_module("node:async_hooks")
        .with_module("async_hooks")
        .with_module("node:cluster")
        .with_module("cluster")
        .with_module("node:constants")
        .with_module("constants")
        .with_module("__wasm_rquickjs_builtin/dgram_native")
        .with_module("node:dgram")
        .with_module("dgram")
        .with_module("node:diagnostics_channel")
        .with_module("diagnostics_channel")
        .with_module("__wasm_rquickjs_builtin/dns_native")
        .with_module("node:dns")
        .with_module("dns")
        .with_module("node:dns/promises")
        .with_module("dns/promises")
        .with_module("node:domain")
        .with_module("domain")
        .with_module("node:http2")
        .with_module("http2")
        .with_module("node:https")
        .with_module("https")
        .with_module("node:inspector")
        .with_module("inspector")
        .with_module("__wasm_rquickjs_builtin/node_http_native")
        .with_module("__wasm_rquickjs_builtin/node_http_server")
        .with_module("node:_http_common")
        .with_module("_http_common")
        .with_module("node:_http_agent")
        .with_module("_http_agent")
        .with_module("node:http")
        .with_module("http")
        .with_module("__wasm_rquickjs_builtin/net_native")
        .with_module("node:net")
        .with_module("net")
        .with_module("node:perf_hooks")
        .with_module("perf_hooks")
        .with_module("node:readline")
        .with_module("readline")
        .with_module("node:readline/promises")
        .with_module("readline/promises")
        .with_module("node:repl")
        .with_module("repl")
        .with_module("node:console")
        .with_module("console")
        .with_module("node:trace_events")
        .with_module("trace_events")
        .with_module("node:tls")
        .with_module("tls")
        .with_module("node:tty")
        .with_module("tty")
        .with_module("node:v8")
        .with_module("v8")
        .with_module("node:worker_threads")
        .with_module("worker_threads")
        .with_module("__wasm_rquickjs_builtin/zlib_native")
        .with_module("node:zlib")
        .with_module("zlib")
        // SQLite - only node:sqlite, no bare "sqlite" (matches Node.js behavior)
        .with_module("__wasm_rquickjs_builtin/sqlite_native")
        .with_module("node:sqlite");

    #[cfg(feature = "golem")]
    let resolver = resolver
        .with_module("__wasm_rquickjs_builtin/diagnostics_channel_native")
        .with_module("__wasm_rquickjs_builtin/diagnostics_channel_golem")
        .with_module("__wasm_rquickjs_builtin/websocket_native")
        .with_module("__wasm_rquickjs_builtin/websocket");

    internal::add_to_resolver(resolver)
}

pub fn module_loader() -> (
    rquickjs::loader::ModuleLoader,
    rquickjs::loader::BuiltinLoader,
    rquickjs::loader::BuiltinLoader,
) {
    let native_loader = rquickjs::loader::ModuleLoader::default()
        .with_module(
            "__wasm_rquickjs_builtin/base64_native",
            base64::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/console_native",
            console::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/timeout_native",
            timeout::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/gc_native", gc::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/http_native",
            http::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/encoding_native",
            encoding::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/intl_native",
            intl::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/fs_native", fs::js_native_module)
        .with_module("__wasm_rquickjs_builtin/os_native", os::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/process_native",
            process::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/internal/binding/util_native",
            internal_binding_util::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/url_native", url::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/web_crypto_native",
            web_crypto::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/vm_native", vm::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/zlib_native",
            zlib::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/dgram_native",
            dgram::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/dns_native", dns::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/node_http_native",
            node_http::js_native_module,
        )
        .with_module("__wasm_rquickjs_builtin/net_native", net::js_native_module)
        .with_module(
            "__wasm_rquickjs_builtin/sqlite_native",
            sqlite::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/string_decoder_native",
            string_decoder::js_native_module,
        );

    #[cfg(feature = "golem")]
    let native_loader = native_loader
        .with_module(
            "__wasm_rquickjs_builtin/diagnostics_channel_native",
            diagnostics_channel::js_native_module,
        )
        .with_module(
            "__wasm_rquickjs_builtin/websocket_native",
            websocket::js_native_module,
        );

    let builtin_loader = rquickjs::loader::BuiltinLoader::default()
        .with_module(
            "__wasm_rquickjs_builtin/abort_controller",
            abort_controller::ABORT_CONTROLLER_JS,
        )
        .with_module("__wasm_rquickjs_builtin/console", console::CONSOLE_JS)
        .with_module("__wasm_rquickjs_builtin/timeout", timeout::TIMEOUT_JS)
        .with_module("__wasm_rquickjs_builtin/http_blob", http::FETCH_BLOB_JS)
        .with_module("__wasm_rquickjs_builtin/http_form_data", http::FORMDATA_JS)
        .with_module("__wasm_rquickjs_builtin/http", http::HTTP_JS)
        .with_module("__wasm_rquickjs_builtin/streams", webstreams::WEBSTREAMS_JS)
        .with_module(
            "__wasm_rquickjs_builtin/webstreams_wrapper",
            webstreams::WEBSTREAMS_WRAPPER_JS,
        )
        .with_module("node:stream/web", webstreams::REEXPORT_JS)
        .with_module("stream/web", webstreams::REEXPORT_JS)
        .with_module("web-streams-polyfill", webstreams::REEXPORT_JS)
        .with_module("formdata-node", formdata_node::FORMDATA_NODE_JS)
        .with_module("__wasm_rquickjs_builtin/encoding", encoding::ENCODING_JS)
        .with_module("__wasm_rquickjs_builtin/intl", intl::INTL_JS)
        .with_module("node:util", util::UTIL_JS)
        .with_module("node:util/types", util::UTIL_TYPES_JS)
        .with_module("util", util::BARE_UTIL_REEXPORT_JS)
        .with_module("util/types", util::UTIL_TYPES_JS)
        .with_module("base64-js", base64::BASE64_JS)
        .with_module("ieee754", ieee754::IEEE754_JS)
        .with_module("node:buffer", buffer::BUFFER_JS)
        .with_module("buffer", buffer::REEXPORT_JS)
        .with_module("node:fs", fs::FS_JS)
        .with_module("fs", fs::REEXPORT_JS)
        .with_module("node:fs/promises", fs::FS_PROMISES_JS)
        .with_module("fs/promises", fs::REEXPORT_PROMISES_JS)
        .with_module("internal/fs/promises", fs::REEXPORT_PROMISES_JS)
        .with_module("node:os", os::OS_JS)
        .with_module("os", os::REEXPORT_JS)
        .with_module("node:assert", assert::ASSERT_JS)
        .with_module("assert", assert::REEXPORT_JS)
        .with_module("node:assert/strict", assert::ASSERT_STRICT_JS)
        .with_module("assert/strict", assert::REEXPORT_STRICT_JS)
        .with_module("node:querystring", querystring::QUERYSTRING_JS)
        .with_module("querystring", querystring::REEXPORT_JS)
        .with_module("node:child_process", child_process::CHILD_PROCESS_JS)
        .with_module("child_process", child_process::REEXPORT_JS)
        .with_module("node:test", node_test::TEST_JS)
        .with_module("node:module", module::MODULE_JS)
        .with_module("module", module::REEXPORT_JS)
        .with_module("node:process", process::PROCESS_JS)
        .with_module("process", process::REEXPORT_JS)
        .with_module("node:path", path::PATH_JS)
        .with_module("path", path::REEXPORT_JS)
        .with_module("node:path/posix", path::PATH_POSIX_REEXPORT_JS)
        .with_module("path/posix", path::PATH_POSIX_REEXPORT_JS)
        .with_module("node:path/win32", path::PATH_WIN32_REEXPORT_JS)
        .with_module("path/win32", path::PATH_WIN32_REEXPORT_JS)
        .with_module("node:punycode", punycode::PUNYCODE_JS)
        .with_module("punycode", punycode::REEXPORT_JS)
        .with_module("__wasm_rquickjs_builtin/url", url::URL_JS)
        .with_module("node:url", url::URL_JS)
        .with_module("url", url::REEXPORT_JS)
        .with_module("node:events", events::EVENTS_JS)
        .with_module("events", events::REEXPORT_JS)
        .with_module("node:stream", stream::STREAM_JS)
        .with_module("stream", stream::REEXPORT_JS)
        .with_module("node:stream/promises", stream::STREAM_PROMISES_JS)
        .with_module("stream/promises", stream::REEXPORT_PROMISES_JS)
        .with_module("node:stream/consumers", stream::STREAM_CONSUMERS_JS)
        .with_module("stream/consumers", stream::REEXPORT_CONSUMERS_JS)
        .with_module("node:string_decoder", string_decoder::STRING_DECODER_JS)
        .with_module("string_decoder", string_decoder::REEXPORT_JS)
        .with_module("node:timers", timers::TIMERS_JS)
        .with_module("timers", timers::REEXPORT_JS)
        .with_module("node:timers/promises", timers::TIMERS_PROMISES_JS)
        .with_module("timers/promises", timers::REEXPORT_PROMISES_JS)
        .with_module(
            "__wasm_rquickjs_builtin/web_crypto",
            web_crypto::WEB_CRYPTO_JS,
        )
        .with_module("node:crypto", web_crypto::REEXPORT_JS)
        .with_module("crypto", web_crypto::REEXPORT_JS)
        .with_module("__wasm_rquickjs_builtin/vm", vm::VM_JS)
        .with_module("node:vm", vm::REEXPORT_JS)
        .with_module("vm", vm::REEXPORT_JS)
        .with_module(
            "__wasm_rquickjs_builtin/structured_clone",
            structured_clone::STRUCTURED_CLONE_JS,
        )
        .with_module("node:async_hooks", async_hooks::ASYNC_HOOKS_JS)
        .with_module("async_hooks", async_hooks::REEXPORT_JS)
        .with_module("node:cluster", cluster::CLUSTER_JS)
        .with_module("cluster", cluster::REEXPORT_JS)
        .with_module("node:constants", constants::CONSTANTS_JS)
        .with_module("constants", constants::REEXPORT_JS)
        .with_module("node:dgram", dgram::DGRAM_JS)
        .with_module("dgram", dgram::REEXPORT_JS)
        .with_module(
            "node:diagnostics_channel",
            diagnostics_channel::DIAGNOSTICS_CHANNEL_JS,
        )
        .with_module("diagnostics_channel", diagnostics_channel::REEXPORT_JS)
        .with_module("node:dns", dns::DNS_JS)
        .with_module("dns", dns::REEXPORT_JS)
        .with_module("node:dns/promises", dns::DNS_PROMISES_JS)
        .with_module("dns/promises", dns::REEXPORT_PROMISES_JS)
        .with_module("node:domain", domain::DOMAIN_JS)
        .with_module("domain", domain::REEXPORT_JS)
        .with_module(
            "__wasm_rquickjs_builtin/node_http_server",
            node_http::NODE_HTTP_SERVER_JS,
        )
        .with_module("node:_http_common", node_http::HTTP_COMMON_JS)
        .with_module("_http_common", node_http::HTTP_COMMON_JS)
        .with_module("node:_http_agent", node_http::HTTP_AGENT_JS)
        .with_module("_http_agent", node_http::HTTP_AGENT_JS)
        .with_module("node:http", node_http::NODE_HTTP_JS)
        .with_module("http", node_http::REEXPORT_JS)
        .with_module("node:http2", http2::HTTP2_JS)
        .with_module("http2", http2::REEXPORT_JS)
        .with_module("node:https", https::HTTPS_JS)
        .with_module("https", https::REEXPORT_JS)
        .with_module("node:inspector", inspector::INSPECTOR_JS)
        .with_module("inspector", inspector::REEXPORT_JS)
        .with_module("node:net", net::NET_JS)
        .with_module("net", net::REEXPORT_JS)
        .with_module("node:perf_hooks", perf_hooks::PERF_HOOKS_JS)
        .with_module("perf_hooks", perf_hooks::REEXPORT_JS)
        .with_module("node:readline", readline::READLINE_JS)
        .with_module("readline", readline::REEXPORT_JS)
        .with_module("node:readline/promises", readline::READLINE_PROMISES_JS)
        .with_module("readline/promises", readline::REEXPORT_PROMISES_JS)
        .with_module("node:repl", repl::REPL_JS)
        .with_module("repl", repl::REEXPORT_JS)
        .with_module("node:console", console::CONSOLE_JS)
        .with_module("console", console::REEXPORT_JS)
        .with_module("node:trace_events", trace_events::TRACE_EVENTS_JS)
        .with_module("trace_events", trace_events::REEXPORT_JS)
        .with_module("node:tls", tls::TLS_JS)
        .with_module("tls", tls::REEXPORT_JS)
        .with_module("node:tty", tty::TTY_JS)
        .with_module("tty", tty::REEXPORT_JS)
        .with_module("node:v8", v8::V8_JS)
        .with_module("v8", v8::REEXPORT_JS)
        .with_module("node:worker_threads", worker_threads::WORKER_THREADS_JS)
        .with_module("worker_threads", worker_threads::REEXPORT_JS)
        .with_module("node:zlib", zlib::ZLIB_JS)
        .with_module("zlib", zlib::REEXPORT_JS)
        .with_module("node:sqlite", sqlite::SQLITE_JS);

    #[cfg(feature = "golem")]
    let builtin_loader = builtin_loader
        .with_module(
            "__wasm_rquickjs_builtin/diagnostics_channel_golem",
            diagnostics_channel::DIAGNOSTICS_CHANNEL_GOLEM_JS,
        )
        .with_module("__wasm_rquickjs_builtin/websocket", websocket::WEBSOCKET_JS);

    (native_loader, builtin_loader, internal::module_loader())
}

pub fn wire_builtins() -> String {
    let mut result = String::new();
    writeln!(result, "{}", events::WIRE_JS).unwrap();
    writeln!(result, "{}", abort_controller::WIRE_JS).unwrap();
    writeln!(result, "{}", base64::WIRE_JS).unwrap();
    writeln!(result, "{}", buffer::WIRE_JS).unwrap();
    writeln!(result, "{}", console::WIRE_JS).unwrap();
    writeln!(result, "{}", timeout::WIRE_JS).unwrap();
    writeln!(result, "{}", gc::WIRE_JS).unwrap();
    writeln!(result, "{}", http::WIRE_JS).unwrap();
    writeln!(result, "{}", webstreams::WIRE_JS).unwrap();
    writeln!(result, "{}", encoding::WIRE_JS).unwrap();
    writeln!(result, "{}", intl::WIRE_JS).unwrap();
    writeln!(result, "{}", url::WIRE_JS).unwrap();
    writeln!(result, "{}", web_crypto::WIRE_JS).unwrap();
    writeln!(result, "{}", process::WIRE_JS).unwrap();
    writeln!(result, "{}", structured_clone::WIRE_JS).unwrap();
    writeln!(result, "{}", module::WIRE_JS).unwrap();
    writeln!(result, "{}", worker_threads::WIRE_JS).unwrap();
    writeln!(result, "globalThis.global = globalThis;").unwrap();
    writeln!(result, "globalThis.self = globalThis;").unwrap();
    writeln!(result, "{}", IMPORT_META_RESOLVE_JS).unwrap();
    writeln!(result, "{}", IMPORT_ATTRS_VALIDATE_JS).unwrap();

    #[cfg(feature = "golem")]
    writeln!(result, "{}", diagnostics_channel::GOLEM_WIRE_JS).unwrap();

    #[cfg(feature = "golem")]
    writeln!(result, "{}", websocket::WIRE_JS).unwrap();

    result
}

const IMPORT_META_RESOLVE_JS: &str = r#"function __wasm_rquickjs_import_meta_resolve_impl(baseUrl, specifier) {
  baseUrl = String(baseUrl);
  specifier = String(specifier);
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(specifier) || specifier.startsWith('data:')) return specifier;
  var builtinResolved = typeof globalThis.__wasm_rquickjs_import_meta_resolve_builtin === 'function'
    ? globalThis.__wasm_rquickjs_import_meta_resolve_builtin(specifier)
    : undefined;
  if (builtinResolved !== undefined) return builtinResolved;
  function codedError(message, code, typeError) {
    var err = typeError ? new TypeError(message) : new Error(message);
    err.code = code;
    return err;
  }
  function ensureSupportedBase() {
    if (baseUrl.startsWith('data:')) {
      throw codedError('Failed to resolve module specifier "' + specifier + '" from "' + baseUrl + '": Invalid relative URL or base scheme is not hierarchical.', 'ERR_UNSUPPORTED_RESOLVE_REQUEST', false);
    }
  }
  function normalizePath(p) {
    var parts = p.split('/'); var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i] || parts[i] === '.') continue;
      if (parts[i] === '..') { if (out.length > 0) out.pop(); }
      else out.push(parts[i]);
    }
    return '/' + out.join('/');
  }
  function splitSuffix(value) {
    var query = value.indexOf('?');
    var hash = value.indexOf('#');
    var end = query < 0 ? hash : (hash < 0 ? query : Math.min(query, hash));
    return end < 0 ? [value, ''] : [value.substring(0, end), value.substring(end)];
  }
  function preserveTrailingSlash(path, original) {
    return original.endsWith('/') && !path.endsWith('/') ? path + '/' : path;
  }
  if (specifier.startsWith('/')) {
    ensureSupportedBase();
    if (typeof globalThis.__wasm_rquickjs_import_meta_resolve_path === 'function') {
      var pathResolved = globalThis.__wasm_rquickjs_import_meta_resolve_path(baseUrl, specifier);
      if (pathResolved !== undefined && pathResolved !== null) return pathResolved;
    }
    var parts = splitSuffix(specifier);
    var path = preserveTrailingSlash(normalizePath(parts[0]), parts[0]);
    return (baseUrl.startsWith('file://') ? 'file://' + path : path) + parts[1];
  }
  if (specifier.startsWith('.')) {
    ensureSupportedBase();
    if (typeof globalThis.__wasm_rquickjs_import_meta_resolve_path === 'function') {
      var pathResolved = globalThis.__wasm_rquickjs_import_meta_resolve_path(baseUrl, specifier);
      if (pathResolved !== undefined && pathResolved !== null) return pathResolved;
    }
    var base = baseUrl;
    if (base.startsWith('file://')) base = base.slice(7);
    base = splitSuffix(base)[0];
    var dir = base.substring(0, base.lastIndexOf('/') + 1);
    var parts = splitSuffix(specifier);
    var path = preserveTrailingSlash(normalizePath(dir + parts[0]), parts[0]);
    return (baseUrl.startsWith('file://') ? 'file://' + path : path) + parts[1];
  }
  ensureSupportedBase();
  if (typeof globalThis.__wasm_rquickjs_import_meta_resolve_package === 'function') {
    var packageResolved = globalThis.__wasm_rquickjs_import_meta_resolve_package(baseUrl, specifier);
    if (packageResolved !== undefined && packageResolved !== null) return packageResolved;
  }
  if (specifier.endsWith('/') && baseUrl.startsWith('file://')) {
    var base = splitSuffix(baseUrl.slice(7))[0];
    var dir = base.endsWith('/') ? base : base.substring(0, base.lastIndexOf('/') + 1);
    var resolved = normalizePath(dir + 'node_modules/' + specifier);
    return 'file://' + (resolved.endsWith('/') ? resolved : resolved + '/');
  }
  throw codedError('Cannot find package "' + specifier + '" imported from ' + baseUrl, 'ERR_MODULE_NOT_FOUND', false);
}
Object.defineProperty(globalThis, '__wasm_rquickjs_import_meta_resolve', {
  value: __wasm_rquickjs_import_meta_resolve_impl,
  writable: false,
  configurable: false,
});"#;

const IMPORT_ATTRS_VALIDATE_JS: &str = r#"
const __wasm_rquickjs_import_attr_global = globalThis;

function __wasm_rquickjs_import_attr_read_options(options) {
  var typeValue;
  var unsupportedKey;
  var unsupportedValue;

  if (options !== undefined) {
    if (options === null || typeof options !== 'object') {
      throw new TypeError('The second argument to import() must be an object');
    }
    var w = options['with'];
    if (w !== undefined) {
      if (w === null || typeof w !== 'object') {
        throw new TypeError("The 'with' option must be an object");
      }
      var attrs = w;
      var keys = Object.keys(attrs);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k] === 'type') {
          typeValue = attrs.type;
          if (typeof typeValue !== 'string') {
            throw new TypeError('Import attribute value must be a string');
          }
        } else if (unsupportedKey === undefined) {
          unsupportedKey = keys[k];
          unsupportedValue = attrs[keys[k]];
        }
      }
    }
  }
  return { typeValue: typeValue, unsupportedKey: unsupportedKey, unsupportedValue: unsupportedValue };
}

function __wasm_rquickjs_import_attr_prepare_from_options(value, parsedOptions, asyncSemanticErrors) {
  value = String(value);
  parsedOptions = parsedOptions || {};
  var typeValue = parsedOptions.typeValue;
  var unsupportedKey = parsedOptions.unsupportedKey;
  var unsupportedValue = parsedOptions.unsupportedValue;

  function semanticError(error) {
    if (!asyncSemanticErrors) throw error;
    return 'data:text/javascript,' + encodeURIComponent(
      'await Promise.reject(Object.assign(new TypeError(' +
      JSON.stringify(error.message) + '), { code: ' + JSON.stringify(error.code) + ' }));'
    );
  }

  var format = null;
  if (value.startsWith('data:')) {
    var rest = value.substring(5);
    var ci = rest.indexOf(',');
    if (ci >= 0) {
      var meta = rest.substring(0, ci).split(';')[0].trim();
      if (meta === 'application/json') format = 'json';
      else if (meta === 'text/javascript' || meta === 'application/javascript') format = 'module';
      else if (meta === 'text/css') format = 'css';
    }
  } else if (value.startsWith('node:')) {
    format = 'module';
  } else if (value.endsWith('.json')) {
    format = 'json';
  } else if (value.endsWith('.js') || value.endsWith('.mjs') || value.endsWith('.cjs')) {
    format = 'module';
  }

  if (typeValue !== undefined && typeValue !== 'json' && !(typeValue === 'css' && format === 'css')) {
    return semanticError(Object.assign(
      new TypeError('Import attribute type "' + typeValue + '" is not supported'),
      { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' }
    ));
  }

  var moduleTypeErrorCache;
  var moduleTypeErrorCacheKey;
  if (asyncSemanticErrors) {
    moduleTypeErrorCache = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_module_type_error_cache;
    if (moduleTypeErrorCache === undefined) {
      moduleTypeErrorCache = Object.create(null);
      __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_module_type_error_cache = moduleTypeErrorCache;
    }
    moduleTypeErrorCacheKey = value + '\x00type=' + (typeValue === undefined ? '' : typeValue);
    if (moduleTypeErrorCache[moduleTypeErrorCacheKey] !== undefined) {
      return moduleTypeErrorCache[moduleTypeErrorCacheKey];
    }
  }

  function moduleTypeSemanticError(error) {
    var prepared = semanticError(error);
    if (asyncSemanticErrors) moduleTypeErrorCache[moduleTypeErrorCacheKey] = prepared;
    return prepared;
  }

  if (unsupportedKey !== undefined) {
    var unsupportedValueText = typeof unsupportedValue === 'string'
      ? '"' + unsupportedValue + '"'
      : String(unsupportedValue);
    return semanticError(Object.assign(
      new TypeError('Import attribute "' + unsupportedKey + '" with value ' + unsupportedValueText + ' is not supported'),
      { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' }
    ));
  }

  if (typeValue !== undefined) {
    if (typeValue === 'json') {
      if (format === 'module') {
        return moduleTypeSemanticError(Object.assign(
          new TypeError('Cannot use import attributes to change the type of a JavaScript module'),
          { code: 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE' }
        ));
      }
    } else if (typeValue === 'css' && format === 'css') {
      // Let the loader report unsupported CSS modules as an unknown format.
    }
  }

  if (format === 'json') {
    if (typeValue !== 'json') {
      return moduleTypeSemanticError(Object.assign(
        new TypeError('Module "' + value + '" needs an import attribute of "type: json"'),
        { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' }
      ));
    }
  }

  if (typeValue !== 'json') return value;
  return __wasm_rquickjs_import_attr_global.__wasm_rquickjs_register_import_attr_rewrite(value, 'json');
}

function __wasm_rquickjs_import_attr_prepare(specifier, options, asyncSemanticErrors) {
  var value = String(specifier);
  var parsedOptions = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_read_options(options);
  return __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_prepare_from_options(value, parsedOptions, asyncSemanticErrors);
}

async function __wasm_rquickjs_import_attr_prepare_for_base(baseUrl, specifier, options, asyncSemanticErrors) {
  var originalValue = String(specifier);
  var parsedOptions = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_read_options(options);
  return __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_prepare_for_base_parsed(baseUrl, originalValue, parsedOptions, asyncSemanticErrors);
}

async function __wasm_rquickjs_import_attr_prepare_for_base_parsed(baseUrl, originalValue, parsedOptions, asyncSemanticErrors) {
  originalValue = String(originalValue);
  parsedOptions = parsedOptions || {};
  if (
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_registered_loaders &&
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_registered_loaders.length > 0
  ) {
    var hooked = await __wasm_rquickjs_import_attr_global.__wasm_rquickjs_run_registered_loaders(String(baseUrl), originalValue, parsedOptions);
    if (hooked !== undefined) return hooked;
  }
  var value = originalValue;
  if (
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('/') ||
    value.startsWith('file://')
  ) {
    value = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_meta_resolve(String(baseUrl), value);
  }
  return __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_prepare_from_options(value, parsedOptions, asyncSemanticErrors);
}

async function __wasm_rquickjs_import_attr_dynamic_import(baseUrl, specifier, options, asyncSemanticErrors, importer) {
  var originalSpecifier = String(specifier);
  var parsedOptions = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_read_options(options);
  return __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_dynamic_import_parsed(baseUrl, originalSpecifier, parsedOptions, asyncSemanticErrors, importer);
}

async function __wasm_rquickjs_import_attr_dynamic_import_parsed(baseUrl, originalSpecifier, parsedOptions, asyncSemanticErrors, importer) {
  originalSpecifier = String(originalSpecifier);
  parsedOptions = parsedOptions || {};
  var prepared = await __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_prepare_for_base_parsed(baseUrl, originalSpecifier, parsedOptions, asyncSemanticErrors);
  var key = String(prepared);
  var completedKey = key;
  var originalHasRewriteToken = originalSpecifier.indexOf('__wasm_rquickjs_import_type=') >= 0;
  var tokenMatch = originalHasRewriteToken ? null : /^data:([^,]*);__wasm_rquickjs_import_type=([^;,]+)(,.*)$/.exec(key);
  if (tokenMatch) {
    completedKey = 'import-attr:' + tokenMatch[2].split('-')[0] + ':data:' + tokenMatch[1] + tokenMatch[3];
  } else {
    tokenMatch = originalHasRewriteToken ? null : /([?#&])__wasm_rquickjs_import_type=([^&#]+)(&?)/.exec(key);
    if (tokenMatch) {
      var tokenStart = tokenMatch.index;
      var tokenEnd = tokenStart + tokenMatch[0].length;
      var prefix = key.slice(0, tokenStart);
      var suffix = key.slice(tokenEnd);
      var separator = tokenMatch[1];
      if (separator === '&') {
        completedKey = prefix + (suffix ? '&' + suffix : '');
      } else if (tokenMatch[3] === '&') {
        completedKey = prefix + separator + suffix;
      } else {
        completedKey = prefix + suffix;
      }
      if (completedKey.endsWith('?') || completedKey.endsWith('#')) completedKey = completedKey.slice(0, -1);
      completedKey = 'import-attr:' + tokenMatch[2].split('-')[0] + ':' + completedKey;
    }
  }
  var generatedRewriteToken = completedKey !== key && !originalHasRewriteToken;
  function discardGeneratedRewriteToken() {
    if (generatedRewriteToken && typeof __wasm_rquickjs_import_attr_global.__wasm_rquickjs_discard_import_attr_rewrite === 'function') {
      __wasm_rquickjs_import_attr_global.__wasm_rquickjs_discard_import_attr_rewrite(key);
    }
  }
  var importFn = typeof importer === 'function' ? importer : function(value) { return import(value); };
  if (
    typeof __wasm_rquickjs_import_attr_global.__wasm_rquickjs_has_import_mock === 'function' &&
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_has_import_mock(prepared, baseUrl)
  ) {
    try {
      return await importFn(prepared);
    } finally {
      discardGeneratedRewriteToken();
    }
  }
  var cache = __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_inflight;
  if (!cache) {
    cache = Object.create(null);
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_import_attr_inflight = cache;
  }
  if (cache[completedKey] !== undefined) {
    var cached = cache[completedKey];
    if (cached.preparedKey !== key) {
      discardGeneratedRewriteToken();
    }
    return cached.promise;
  }
  if (
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_registered_loaders &&
    __wasm_rquickjs_import_attr_global.__wasm_rquickjs_registered_loaders.length > 0 &&
    typeof __wasm_rquickjs_import_attr_global.__wasm_rquickjs_prepare_static_registered_loader_graph === 'function' &&
    !String(prepared).startsWith('data:application/json') &&
    !/[.]json(?:[?#]|$)/.test(String(prepared))
  ) {
    await __wasm_rquickjs_import_attr_global.__wasm_rquickjs_prepare_static_registered_loader_graph(prepared, originalSpecifier, baseUrl, parsedOptions);
  }
  var promise = importFn(prepared);
  var entry = { promise: promise, preparedKey: key };
  cache[completedKey] = entry;
  try {
    var result = await promise;
    discardGeneratedRewriteToken();
    return result;
  } catch (error) {
    if (cache[completedKey] === entry) delete cache[completedKey];
    discardGeneratedRewriteToken();
    throw error;
  } finally {
  }
}

[
  ['__wasm_rquickjs_import_attr_read_options', __wasm_rquickjs_import_attr_read_options],
  ['__wasm_rquickjs_import_attr_prepare_from_options', __wasm_rquickjs_import_attr_prepare_from_options],
  ['__wasm_rquickjs_import_attr_prepare', __wasm_rquickjs_import_attr_prepare],
  ['__wasm_rquickjs_import_attr_prepare_for_base', __wasm_rquickjs_import_attr_prepare_for_base],
  ['__wasm_rquickjs_import_attr_prepare_for_base_parsed', __wasm_rquickjs_import_attr_prepare_for_base_parsed],
  ['__wasm_rquickjs_import_attr_dynamic_import', __wasm_rquickjs_import_attr_dynamic_import],
  ['__wasm_rquickjs_import_attr_dynamic_import_parsed', __wasm_rquickjs_import_attr_dynamic_import_parsed],
].forEach(function(entry) {
  var name = entry[0];
  var fn = entry[1];
  Object.defineProperty(__wasm_rquickjs_import_attr_global, name, {
    value: fn,
    writable: false,
    configurable: false,
  });
});
"#;

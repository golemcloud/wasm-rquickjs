use crate::capabilities;
use std::fmt::Write;

macro_rules! capability_enabled {
    (AbortController) => {
        capabilities::cap_abort_controller()
    };
    (Assert) => {
        capabilities::cap_assert()
    };
    (AsyncHooks) => {
        capabilities::cap_async_hooks()
    };
    (Base64) => {
        capabilities::cap_base64()
    };
    (Buffer) => {
        capabilities::cap_buffer()
    };
    (ChildProcess) => {
        capabilities::cap_child_process()
    };
    (Cluster) => {
        capabilities::cap_cluster()
    };
    (Console) => {
        capabilities::cap_console()
    };
    (Constants) => {
        capabilities::cap_constants()
    };
    (Dgram) => {
        capabilities::cap_dgram()
    };
    (DiagnosticsChannel) => {
        capabilities::cap_diagnostics_channel()
    };
    (Dns) => {
        capabilities::cap_dns()
    };
    (Domain) => {
        capabilities::cap_domain()
    };
    (Encoding) => {
        capabilities::cap_encoding()
    };
    (Events) => {
        capabilities::cap_events()
    };
    (FormDataNode) => {
        capabilities::cap_formdata_node()
    };
    (Fs) => {
        capabilities::cap_fs()
    };
    (Gc) => {
        capabilities::cap_gc()
    };
    (Http2) => {
        capabilities::cap_http2()
    };
    (Https) => {
        capabilities::cap_https()
    };
    (Inspector) => {
        capabilities::cap_inspector()
    };
    (Intl) => {
        capabilities::cap_intl()
    };
    (Module) => {
        capabilities::cap_module()
    };
    (Net) => {
        capabilities::cap_net()
    };
    (NodeFetch) => {
        capabilities::cap_node_fetch()
    };
    (NodeHttp) => {
        capabilities::cap_node_http()
    };
    (NodeTest) => {
        capabilities::cap_node_test()
    };
    (Os) => {
        capabilities::cap_os()
    };
    (Path) => {
        capabilities::cap_path()
    };
    (PerfHooks) => {
        capabilities::cap_perf_hooks()
    };
    (Process) => {
        capabilities::cap_process()
    };
    (Punycode) => {
        capabilities::cap_punycode()
    };
    (Querystring) => {
        capabilities::cap_querystring()
    };
    (Readline) => {
        capabilities::cap_readline()
    };
    (Repl) => {
        capabilities::cap_repl()
    };
    (Sqlite) => {
        capabilities::cap_sqlite()
    };
    (Stream) => {
        capabilities::cap_stream()
    };
    (StringDecoder) => {
        capabilities::cap_string_decoder()
    };
    (StructuredClone) => {
        capabilities::cap_structured_clone()
    };
    (Timers) => {
        capabilities::cap_timers()
    };
    (Tls) => {
        capabilities::cap_tls()
    };
    (TraceEvents) => {
        capabilities::cap_trace_events()
    };
    (Tty) => {
        capabilities::cap_tty()
    };
    (Url) => {
        capabilities::cap_url()
    };
    (Util) => {
        capabilities::cap_util()
    };
    (V8) => {
        capabilities::cap_v8()
    };
    (Vm) => {
        capabilities::cap_vm()
    };
    (WebCrypto) => {
        capabilities::cap_web_crypto()
    };
    (Websocket) => {
        capabilities::cap_websocket()
    };
    (Webstreams) => {
        capabilities::cap_webstreams()
    };
    (WorkerThreads) => {
        capabilities::cap_worker_threads()
    };
    (Zlib) => {
        capabilities::cap_zlib()
    };
}

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

pub fn add_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    // Each block below is gated by a single capability. The default gate value
    // is "enabled", so this is a no-op shape change unless the host patches the
    // capability slot in the wasm. See `crate::capabilities`.

    let resolver = if capability_enabled!(AbortController) {
        resolver.with_module("__wasm_rquickjs_builtin/abort_controller")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Base64) {
        resolver.with_module("__wasm_rquickjs_builtin/base64_native")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Console) {
        resolver
            .with_module("__wasm_rquickjs_builtin/console_native")
            .with_module("__wasm_rquickjs_builtin/console")
            .with_module("node:console")
            .with_module("console")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Timers) {
        resolver
            .with_module("__wasm_rquickjs_builtin/timeout_native")
            .with_module("__wasm_rquickjs_builtin/timeout")
            .with_module("node:timers")
            .with_module("timers")
            .with_module("node:timers/promises")
            .with_module("timers/promises")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Gc) {
        resolver.with_module("__wasm_rquickjs_builtin/gc_native")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(NodeFetch) {
        resolver
            .with_module("__wasm_rquickjs_builtin/http_native")
            .with_module("__wasm_rquickjs_builtin/http")
            .with_module("__wasm_rquickjs_builtin/http_blob")
            .with_module("__wasm_rquickjs_builtin/http_form_data")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Webstreams) {
        resolver
            .with_module("__wasm_rquickjs_builtin/streams")
            .with_module("__wasm_rquickjs_builtin/webstreams_wrapper")
            .with_module("node:stream/web")
            .with_module("stream/web")
            .with_module("web-streams-polyfill")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Encoding) {
        resolver
            .with_module("__wasm_rquickjs_builtin/encoding_native")
            .with_module("__wasm_rquickjs_builtin/encoding")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Intl) {
        resolver
            .with_module("__wasm_rquickjs_builtin/intl_native")
            .with_module("__wasm_rquickjs_builtin/intl")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Util) {
        resolver.with_module("node:util").with_module("util")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Fs) {
        resolver
            .with_module("__wasm_rquickjs_builtin/fs_native")
            .with_module("node:fs")
            .with_module("fs")
            .with_module("node:fs/promises")
            .with_module("fs/promises")
            .with_module("internal/fs/promises")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Buffer) {
        resolver
            .with_module("node:buffer")
            .with_module("buffer")
            .with_module("base64-js")
            .with_module("ieee754")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Os) {
        resolver
            .with_module("__wasm_rquickjs_builtin/os_native")
            .with_module("node:os")
            .with_module("os")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Assert) {
        resolver
            .with_module("node:assert")
            .with_module("assert")
            .with_module("node:assert/strict")
            .with_module("assert/strict")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Querystring) {
        resolver
            .with_module("node:querystring")
            .with_module("querystring")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(ChildProcess) {
        resolver
            .with_module("node:child_process")
            .with_module("child_process")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(NodeTest) {
        resolver.with_module("node:test").with_module("test")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Module) {
        resolver.with_module("node:module").with_module("module")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Process) {
        resolver
            .with_module("__wasm_rquickjs_builtin/process_native")
            .with_module("node:process")
            .with_module("process")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Path) {
        resolver
            .with_module("node:path")
            .with_module("path")
            .with_module("node:path/posix")
            .with_module("path/posix")
            .with_module("node:path/win32")
            .with_module("path/win32")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Punycode) {
        resolver
            .with_module("node:punycode")
            .with_module("punycode")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Url) {
        resolver
            .with_module("__wasm_rquickjs_builtin/url_native")
            .with_module("__wasm_rquickjs_builtin/url")
            .with_module("node:url")
            .with_module("url")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Events) {
        resolver.with_module("node:events").with_module("events")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Stream) {
        resolver
            .with_module("node:stream")
            .with_module("node:stream/promises")
            .with_module("node:stream/consumers")
            .with_module("stream")
            .with_module("stream/promises")
            .with_module("stream/consumers")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(FormDataNode) {
        resolver.with_module("formdata-node")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(StringDecoder) {
        resolver
            .with_module("__wasm_rquickjs_builtin/string_decoder_native")
            .with_module("node:string_decoder")
            .with_module("string_decoder")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(WebCrypto) {
        resolver
            .with_module("__wasm_rquickjs_builtin/web_crypto_native")
            .with_module("__wasm_rquickjs_builtin/web_crypto")
            .with_module("node:crypto")
            .with_module("crypto")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Vm) {
        resolver
            .with_module("__wasm_rquickjs_builtin/vm_native")
            .with_module("__wasm_rquickjs_builtin/vm")
            .with_module("node:vm")
            .with_module("vm")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(StructuredClone) {
        resolver.with_module("__wasm_rquickjs_builtin/structured_clone")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(AsyncHooks) {
        resolver
            .with_module("node:async_hooks")
            .with_module("async_hooks")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Cluster) {
        resolver.with_module("node:cluster").with_module("cluster")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Constants) {
        resolver
            .with_module("node:constants")
            .with_module("constants")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Dgram) {
        resolver
            .with_module("__wasm_rquickjs_builtin/dgram_native")
            .with_module("node:dgram")
            .with_module("dgram")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(DiagnosticsChannel) {
        resolver
            .with_module("node:diagnostics_channel")
            .with_module("diagnostics_channel")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Dns) {
        resolver
            .with_module("__wasm_rquickjs_builtin/dns_native")
            .with_module("node:dns")
            .with_module("dns")
            .with_module("node:dns/promises")
            .with_module("dns/promises")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Domain) {
        resolver.with_module("node:domain").with_module("domain")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Http2) {
        resolver.with_module("node:http2").with_module("http2")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Https) {
        resolver.with_module("node:https").with_module("https")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Inspector) {
        resolver
            .with_module("node:inspector")
            .with_module("inspector")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(NodeHttp) {
        resolver
            .with_module("__wasm_rquickjs_builtin/node_http_native")
            .with_module("__wasm_rquickjs_builtin/node_http_server")
            .with_module("node:_http_common")
            .with_module("_http_common")
            .with_module("node:_http_agent")
            .with_module("_http_agent")
            .with_module("node:http")
            .with_module("http")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Net) {
        resolver
            .with_module("__wasm_rquickjs_builtin/net_native")
            .with_module("node:net")
            .with_module("net")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(PerfHooks) {
        resolver
            .with_module("node:perf_hooks")
            .with_module("perf_hooks")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Readline) {
        resolver
            .with_module("node:readline")
            .with_module("readline")
            .with_module("node:readline/promises")
            .with_module("readline/promises")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Repl) {
        resolver.with_module("node:repl").with_module("repl")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(TraceEvents) {
        resolver
            .with_module("node:trace_events")
            .with_module("trace_events")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Tls) {
        resolver.with_module("node:tls").with_module("tls")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Tty) {
        resolver.with_module("node:tty").with_module("tty")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(V8) {
        resolver.with_module("node:v8").with_module("v8")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(WorkerThreads) {
        resolver
            .with_module("node:worker_threads")
            .with_module("worker_threads")
    } else {
        resolver
    };

    let resolver = if capability_enabled!(Zlib) {
        resolver
            .with_module("__wasm_rquickjs_builtin/zlib_native")
            .with_module("node:zlib")
            .with_module("zlib")
    } else {
        resolver
    };

    // SQLite - only node:sqlite, no bare "sqlite" (matches Node.js behavior)
    let resolver = if capability_enabled!(Sqlite) {
        resolver
            .with_module("__wasm_rquickjs_builtin/sqlite_native")
            .with_module("node:sqlite")
    } else {
        resolver
    };

    #[cfg(feature = "golem")]
    let resolver = if capability_enabled!(DiagnosticsChannel) {
        resolver
            .with_module("__wasm_rquickjs_builtin/diagnostics_channel_native")
            .with_module("__wasm_rquickjs_builtin/diagnostics_channel_golem")
    } else {
        resolver
    };

    #[cfg(feature = "golem")]
    let resolver = if capability_enabled!(Websocket) {
        resolver
            .with_module("__wasm_rquickjs_builtin/websocket_native")
            .with_module("__wasm_rquickjs_builtin/websocket")
    } else {
        resolver
    };

    internal::add_to_resolver(resolver)
}

fn module_from_declarations<'a, 'js>(
    declarations: &'a rquickjs::module::Declarations<'js>,
) -> &'a rquickjs::Module<'js, rquickjs::module::Declared> {
    debug_assert_eq!(
        std::mem::size_of::<rquickjs::module::Declarations<'js>>(),
        std::mem::size_of::<rquickjs::Module<'js, rquickjs::module::Declared>>()
    );
    debug_assert_eq!(
        std::mem::align_of::<rquickjs::module::Declarations<'js>>(),
        std::mem::align_of::<rquickjs::Module<'js, rquickjs::module::Declared>>()
    );

    // SAFETY: rquickjs 0.10 declares `Declarations<'js>` as a single-field
    // tuple wrapper around `Module<'js, Declared>`:
    //
    //     pub struct Declarations<'js>(Module<'js, Declared>);
    //
    // rquickjs does not expose the wrapped module publicly, but the unified
    // builtin trampoline needs the current module name to dispatch back to the
    // original per-builtin `ModuleDef`. Keep this cast isolated and guarded by
    // the debug size/alignment assertions above.
    unsafe {
        &*(declarations as *const rquickjs::module::Declarations<'js>
            as *const rquickjs::Module<'js, rquickjs::module::Declared>)
    }
}

fn module_from_exports<'a, 'js>(
    exports: &'a rquickjs::module::Exports<'js>,
) -> &'a rquickjs::Module<'js, rquickjs::module::Declared> {
    debug_assert_eq!(
        std::mem::size_of::<rquickjs::module::Exports<'js>>(),
        std::mem::size_of::<rquickjs::Module<'js, rquickjs::module::Declared>>()
    );
    debug_assert_eq!(
        std::mem::align_of::<rquickjs::module::Exports<'js>>(),
        std::mem::align_of::<rquickjs::Module<'js, rquickjs::module::Declared>>()
    );

    // SAFETY: Same layout assumption as `module_from_declarations`, for
    // rquickjs' single-field `Exports<'js>(Module<'js, Declared>)` wrapper.
    unsafe {
        &*(exports as *const rquickjs::module::Exports<'js>
            as *const rquickjs::Module<'js, rquickjs::module::Declared>)
    }
}

fn declaration_module_name(
    declarations: &rquickjs::module::Declarations<'_>,
) -> rquickjs::Result<String> {
    module_from_declarations(declarations).name::<String>()
}

fn export_module_name(exports: &rquickjs::module::Exports<'_>) -> rquickjs::Result<String> {
    module_from_exports(exports).name::<String>()
}

struct UnifiedBuiltinNativeModule;

macro_rules! builtin_native_modules {
    ($($(#[$meta:meta])* $cap:ident, $path:literal, $module:path;)*) => {
        fn is_enabled_native_module_path(path: &str) -> bool {
            $(
                $(#[$meta])*
                if capability_enabled!($cap) && path == $path {
                    return true;
                }
            )*

            false
        }

        impl rquickjs::module::ModuleDef for UnifiedBuiltinNativeModule {
            fn declare(declarations: &rquickjs::module::Declarations<'_>) -> rquickjs::Result<()> {
                let name = declaration_module_name(declarations)?;

                $(
                    $(#[$meta])*
                    if capability_enabled!($cap) && name == $path {
                        return <$module as rquickjs::module::ModuleDef>::declare(declarations);
                    }
                )*

                Err(rquickjs::Error::new_loading(name))
            }

            fn evaluate<'js>(
                ctx: &rquickjs::Ctx<'js>,
                exports: &rquickjs::module::Exports<'js>,
            ) -> rquickjs::Result<()> {
                let name = export_module_name(exports)?;

                $(
                    $(#[$meta])*
                    if capability_enabled!($cap) && name == $path {
                        return <$module as rquickjs::module::ModuleDef>::evaluate(ctx, exports);
                    }
                )*

                Err(rquickjs::Error::new_loading(name))
            }
        }
    };
}

builtin_native_modules! {
    Base64, "__wasm_rquickjs_builtin/base64_native", base64::js_native_module;
    Console, "__wasm_rquickjs_builtin/console_native", console::js_native_module;
    Timers, "__wasm_rquickjs_builtin/timeout_native", timeout::js_native_module;
    Gc, "__wasm_rquickjs_builtin/gc_native", gc::js_native_module;
    NodeFetch, "__wasm_rquickjs_builtin/http_native", http::js_native_module;
    Encoding, "__wasm_rquickjs_builtin/encoding_native", encoding::js_native_module;
    Intl, "__wasm_rquickjs_builtin/intl_native", intl::js_native_module;
    Fs, "__wasm_rquickjs_builtin/fs_native", fs::js_native_module;
    Os, "__wasm_rquickjs_builtin/os_native", os::js_native_module;
    Process, "__wasm_rquickjs_builtin/process_native", process::js_native_module;
    Util, "__wasm_rquickjs_builtin/internal/binding/util_native", internal_binding_util::js_native_module;
    Url, "__wasm_rquickjs_builtin/url_native", url::js_native_module;
    WebCrypto, "__wasm_rquickjs_builtin/web_crypto_native", web_crypto::js_native_module;
    Vm, "__wasm_rquickjs_builtin/vm_native", vm::js_native_module;
    Zlib, "__wasm_rquickjs_builtin/zlib_native", zlib::js_native_module;
    Dgram, "__wasm_rquickjs_builtin/dgram_native", dgram::js_native_module;
    Dns, "__wasm_rquickjs_builtin/dns_native", dns::js_native_module;
    NodeHttp, "__wasm_rquickjs_builtin/node_http_native", node_http::js_native_module;
    Net, "__wasm_rquickjs_builtin/net_native", net::js_native_module;
    Sqlite, "__wasm_rquickjs_builtin/sqlite_native", sqlite::js_native_module;
    StringDecoder, "__wasm_rquickjs_builtin/string_decoder_native", string_decoder::js_native_module;
    #[cfg(feature = "golem")]
    DiagnosticsChannel, "__wasm_rquickjs_builtin/diagnostics_channel_native", diagnostics_channel::js_native_module;
    #[cfg(feature = "golem")]
    Websocket, "__wasm_rquickjs_builtin/websocket_native", websocket::js_native_module;
}

/// Custom native-module loader for builtins.
///
/// Replaces the generic [`rquickjs::loader::ModuleLoader`] that previously
/// backed wasm-rquickjs' native builtin modules. The generic loader stores
/// one `fn(Ctx<'js>, Vec<u8>) -> Result<Module<'js>>` per registered builtin
/// in a `HashMap<String, LoadFn>`; each `with_module(..., X::js_native_module)`
/// monomorphises `ModuleLoader::load_func::<X>` and the resulting function
/// pointer survives in the wasm function table even when the registering
/// `with_module` call is dead code. The single `call_indirect` in
/// `ModuleLoader::load` then keeps every type-compatible `load_func<X>`
/// alive after wasm-eliminator DCE because the call's index operand is
/// runtime-dynamic, so all type-matching elem slots stay reachable.
///
/// This loader avoids that retention by using exactly one native module type,
/// [`UnifiedBuiltinNativeModule`], for every builtin. The QuickJS callback table
/// therefore contains one rquickjs `eval_fn` instantiation instead of one per
/// builtin. The unified callback recovers the current module name from
/// rquickjs' declaration/export wrapper and dispatches through direct,
/// capability-gated calls to the original per-builtin `ModuleDef`.
pub struct BuiltinNativeLoader;

impl rquickjs::loader::Loader for BuiltinNativeLoader {
    fn load<'js>(
        &mut self,
        ctx: &rquickjs::Ctx<'js>,
        path: &str,
    ) -> rquickjs::Result<rquickjs::Module<'js, rquickjs::module::Declared>> {
        if is_enabled_native_module_path(path) {
            return rquickjs::Module::declare_def::<UnifiedBuiltinNativeModule, _>(
                ctx.clone(),
                Vec::from(path),
            );
        }

        Err(rquickjs::Error::new_loading(path))
    }
}

pub fn module_loader() -> (
    BuiltinNativeLoader,
    rquickjs::loader::BuiltinLoader,
    rquickjs::loader::BuiltinLoader,
) {
    // Native module registrations are now handled by `BuiltinNativeLoader`'s
    // direct match. The remaining loaders below cover JS source modules,
    // which already store inert bytes per builtin and have no per-builtin
    // monomorphisation issue.

    let native_loader = BuiltinNativeLoader;

    // Builtin loader: registers JS source strings for each capability's
    // user-visible / internal modules. Mirrors the resolver gating above so
    // that a disabled capability has neither a name in the resolver nor a
    // body in the loader.

    let builtin_loader = rquickjs::loader::BuiltinLoader::default();

    let builtin_loader = if capability_enabled!(AbortController) {
        builtin_loader.with_module(
            "__wasm_rquickjs_builtin/abort_controller",
            abort_controller::ABORT_CONTROLLER_JS,
        )
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Console) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/console", console::CONSOLE_JS)
            .with_module("node:console", console::CONSOLE_JS)
            .with_module("console", console::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Timers) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/timeout", timeout::TIMEOUT_JS)
            .with_module("node:timers", timers::TIMERS_JS)
            .with_module("timers", timers::REEXPORT_JS)
            .with_module("node:timers/promises", timers::TIMERS_PROMISES_JS)
            .with_module("timers/promises", timers::REEXPORT_PROMISES_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(NodeFetch) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/http_blob", http::FETCH_BLOB_JS)
            .with_module("__wasm_rquickjs_builtin/http_form_data", http::FORMDATA_JS)
            .with_module("__wasm_rquickjs_builtin/http", http::HTTP_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Webstreams) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/streams", webstreams::WEBSTREAMS_JS)
            .with_module(
                "__wasm_rquickjs_builtin/webstreams_wrapper",
                webstreams::WEBSTREAMS_WRAPPER_JS,
            )
            .with_module("node:stream/web", webstreams::REEXPORT_JS)
            .with_module("stream/web", webstreams::REEXPORT_JS)
            .with_module("web-streams-polyfill", webstreams::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(FormDataNode) {
        builtin_loader.with_module("formdata-node", formdata_node::FORMDATA_NODE_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Encoding) {
        builtin_loader.with_module("__wasm_rquickjs_builtin/encoding", encoding::ENCODING_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Intl) {
        builtin_loader.with_module("__wasm_rquickjs_builtin/intl", intl::INTL_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Util) {
        builtin_loader
            .with_module("node:util", util::UTIL_JS)
            .with_module("util", util::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Buffer) {
        builtin_loader
            .with_module("base64-js", base64::BASE64_JS)
            .with_module("ieee754", ieee754::IEEE754_JS)
            .with_module("node:buffer", buffer::BUFFER_JS)
            .with_module("buffer", buffer::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Fs) {
        builtin_loader
            .with_module("node:fs", fs::FS_JS)
            .with_module("fs", fs::REEXPORT_JS)
            .with_module("node:fs/promises", fs::FS_PROMISES_JS)
            .with_module("fs/promises", fs::REEXPORT_PROMISES_JS)
            .with_module("internal/fs/promises", fs::REEXPORT_PROMISES_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Os) {
        builtin_loader
            .with_module("node:os", os::OS_JS)
            .with_module("os", os::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Assert) {
        builtin_loader
            .with_module("node:assert", assert::ASSERT_JS)
            .with_module("assert", assert::REEXPORT_JS)
            .with_module("node:assert/strict", assert::ASSERT_STRICT_JS)
            .with_module("assert/strict", assert::REEXPORT_STRICT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Querystring) {
        builtin_loader
            .with_module("node:querystring", querystring::QUERYSTRING_JS)
            .with_module("querystring", querystring::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(ChildProcess) {
        builtin_loader
            .with_module("node:child_process", child_process::CHILD_PROCESS_JS)
            .with_module("child_process", child_process::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(NodeTest) {
        builtin_loader
            .with_module("node:test", node_test::TEST_JS)
            .with_module("test", node_test::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Module) {
        builtin_loader
            .with_module("node:module", module::MODULE_JS)
            .with_module("module", module::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Process) {
        builtin_loader
            .with_module("node:process", process::PROCESS_JS)
            .with_module("process", process::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Path) {
        builtin_loader
            .with_module("node:path", path::PATH_JS)
            .with_module("path", path::REEXPORT_JS)
            .with_module("node:path/posix", path::PATH_POSIX_REEXPORT_JS)
            .with_module("path/posix", path::PATH_POSIX_REEXPORT_JS)
            .with_module("node:path/win32", path::PATH_WIN32_REEXPORT_JS)
            .with_module("path/win32", path::PATH_WIN32_REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Punycode) {
        builtin_loader
            .with_module("node:punycode", punycode::PUNYCODE_JS)
            .with_module("punycode", punycode::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Url) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/url", url::URL_JS)
            .with_module("node:url", url::URL_JS)
            .with_module("url", url::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Events) {
        builtin_loader
            .with_module("node:events", events::EVENTS_JS)
            .with_module("events", events::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Stream) {
        builtin_loader
            .with_module("node:stream", stream::STREAM_JS)
            .with_module("stream", stream::REEXPORT_JS)
            .with_module("node:stream/promises", stream::STREAM_PROMISES_JS)
            .with_module("stream/promises", stream::REEXPORT_PROMISES_JS)
            .with_module("node:stream/consumers", stream::STREAM_CONSUMERS_JS)
            .with_module("stream/consumers", stream::REEXPORT_CONSUMERS_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(StringDecoder) {
        builtin_loader
            .with_module("node:string_decoder", string_decoder::STRING_DECODER_JS)
            .with_module("string_decoder", string_decoder::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(WebCrypto) {
        builtin_loader
            .with_module(
                "__wasm_rquickjs_builtin/web_crypto",
                web_crypto::WEB_CRYPTO_JS,
            )
            .with_module("node:crypto", web_crypto::REEXPORT_JS)
            .with_module("crypto", web_crypto::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Vm) {
        builtin_loader
            .with_module("__wasm_rquickjs_builtin/vm", vm::VM_JS)
            .with_module("node:vm", vm::REEXPORT_JS)
            .with_module("vm", vm::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(StructuredClone) {
        builtin_loader.with_module(
            "__wasm_rquickjs_builtin/structured_clone",
            structured_clone::STRUCTURED_CLONE_JS,
        )
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(AsyncHooks) {
        builtin_loader
            .with_module("node:async_hooks", async_hooks::ASYNC_HOOKS_JS)
            .with_module("async_hooks", async_hooks::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Cluster) {
        builtin_loader
            .with_module("node:cluster", cluster::CLUSTER_JS)
            .with_module("cluster", cluster::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Constants) {
        builtin_loader
            .with_module("node:constants", constants::CONSTANTS_JS)
            .with_module("constants", constants::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Dgram) {
        builtin_loader
            .with_module("node:dgram", dgram::DGRAM_JS)
            .with_module("dgram", dgram::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(DiagnosticsChannel) {
        builtin_loader
            .with_module(
                "node:diagnostics_channel",
                diagnostics_channel::DIAGNOSTICS_CHANNEL_JS,
            )
            .with_module("diagnostics_channel", diagnostics_channel::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Dns) {
        builtin_loader
            .with_module("node:dns", dns::DNS_JS)
            .with_module("dns", dns::REEXPORT_JS)
            .with_module("node:dns/promises", dns::DNS_PROMISES_JS)
            .with_module("dns/promises", dns::REEXPORT_PROMISES_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Domain) {
        builtin_loader
            .with_module("node:domain", domain::DOMAIN_JS)
            .with_module("domain", domain::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(NodeHttp) {
        builtin_loader
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
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Http2) {
        builtin_loader
            .with_module("node:http2", http2::HTTP2_JS)
            .with_module("http2", http2::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Https) {
        builtin_loader
            .with_module("node:https", https::HTTPS_JS)
            .with_module("https", https::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Inspector) {
        builtin_loader
            .with_module("node:inspector", inspector::INSPECTOR_JS)
            .with_module("inspector", inspector::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Net) {
        builtin_loader
            .with_module("node:net", net::NET_JS)
            .with_module("net", net::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(PerfHooks) {
        builtin_loader
            .with_module("node:perf_hooks", perf_hooks::PERF_HOOKS_JS)
            .with_module("perf_hooks", perf_hooks::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Readline) {
        builtin_loader
            .with_module("node:readline", readline::READLINE_JS)
            .with_module("readline", readline::REEXPORT_JS)
            .with_module("node:readline/promises", readline::READLINE_PROMISES_JS)
            .with_module("readline/promises", readline::REEXPORT_PROMISES_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Repl) {
        builtin_loader
            .with_module("node:repl", repl::REPL_JS)
            .with_module("repl", repl::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(TraceEvents) {
        builtin_loader
            .with_module("node:trace_events", trace_events::TRACE_EVENTS_JS)
            .with_module("trace_events", trace_events::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Tls) {
        builtin_loader
            .with_module("node:tls", tls::TLS_JS)
            .with_module("tls", tls::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Tty) {
        builtin_loader
            .with_module("node:tty", tty::TTY_JS)
            .with_module("tty", tty::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(V8) {
        builtin_loader
            .with_module("node:v8", v8::V8_JS)
            .with_module("v8", v8::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(WorkerThreads) {
        builtin_loader
            .with_module("node:worker_threads", worker_threads::WORKER_THREADS_JS)
            .with_module("worker_threads", worker_threads::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Zlib) {
        builtin_loader
            .with_module("node:zlib", zlib::ZLIB_JS)
            .with_module("zlib", zlib::REEXPORT_JS)
    } else {
        builtin_loader
    };

    let builtin_loader = if capability_enabled!(Sqlite) {
        builtin_loader.with_module("node:sqlite", sqlite::SQLITE_JS)
    } else {
        builtin_loader
    };

    #[cfg(feature = "golem")]
    let builtin_loader = if capability_enabled!(DiagnosticsChannel) {
        builtin_loader.with_module(
            "__wasm_rquickjs_builtin/diagnostics_channel_golem",
            diagnostics_channel::DIAGNOSTICS_CHANNEL_GOLEM_JS,
        )
    } else {
        builtin_loader
    };

    #[cfg(feature = "golem")]
    let builtin_loader = if capability_enabled!(Websocket) {
        builtin_loader.with_module("__wasm_rquickjs_builtin/websocket", websocket::WEBSOCKET_JS)
    } else {
        builtin_loader
    };

    (native_loader, builtin_loader, internal::module_loader())
}

pub fn wire_builtins() -> String {
    let mut result = String::new();

    // Each `WIRE_JS` block installs that capability's globals (e.g. `Buffer`,
    // `fetch`, `EventTarget`). Skipping the block means the global is never
    // installed, which lets the JS-level capability scanner / wasm-level DCE
    // drop both the corresponding `WIRE_JS` strings and any host imports they
    // would have transitively kept alive.

    if capability_enabled!(Events) {
        writeln!(result, "{}", events::WIRE_JS).unwrap();
    }
    if capability_enabled!(AbortController) {
        writeln!(result, "{}", abort_controller::WIRE_JS).unwrap();
    }
    if capability_enabled!(Base64) {
        writeln!(result, "{}", base64::WIRE_JS).unwrap();
    }
    if capability_enabled!(Buffer) {
        writeln!(result, "{}", buffer::WIRE_JS).unwrap();
    }
    if capability_enabled!(Console) {
        writeln!(result, "{}", console::WIRE_JS).unwrap();
    }
    if capability_enabled!(Timers) {
        writeln!(result, "{}", timeout::WIRE_JS).unwrap();
    }
    if capability_enabled!(Gc) {
        writeln!(result, "{}", gc::WIRE_JS).unwrap();
    }
    if capability_enabled!(NodeFetch) {
        writeln!(result, "{}", http::WIRE_JS).unwrap();
    }
    if capability_enabled!(Webstreams) {
        writeln!(result, "{}", webstreams::WIRE_JS).unwrap();
    }
    if capability_enabled!(Encoding) {
        writeln!(result, "{}", encoding::WIRE_JS).unwrap();
    }
    if capability_enabled!(Intl) {
        writeln!(result, "{}", intl::WIRE_JS).unwrap();
    }
    if capability_enabled!(Url) {
        writeln!(result, "{}", url::WIRE_JS).unwrap();
    }
    if capability_enabled!(WebCrypto) {
        writeln!(result, "{}", web_crypto::WIRE_JS).unwrap();
    }
    if capability_enabled!(Process) {
        writeln!(result, "{}", process::WIRE_JS).unwrap();
    }
    if capability_enabled!(StructuredClone) {
        writeln!(result, "{}", structured_clone::WIRE_JS).unwrap();
    }
    if capability_enabled!(Module) {
        writeln!(result, "{}", module::WIRE_JS).unwrap();
    }
    if capability_enabled!(WorkerThreads) {
        writeln!(result, "{}", worker_threads::WIRE_JS).unwrap();
    }
    writeln!(result, "globalThis.global = globalThis;").unwrap();
    writeln!(result, "globalThis.self = globalThis;").unwrap();
    writeln!(result, "{}", IMPORT_META_RESOLVE_JS).unwrap();
    writeln!(result, "{}", IMPORT_ATTRS_VALIDATE_JS).unwrap();

    #[cfg(feature = "golem")]
    if capability_enabled!(DiagnosticsChannel) {
        writeln!(result, "{}", diagnostics_channel::GOLEM_WIRE_JS).unwrap();
    }

    #[cfg(feature = "golem")]
    if capability_enabled!(Websocket) {
        writeln!(result, "{}", websocket::WIRE_JS).unwrap();
    }

    result
}

const IMPORT_META_RESOLVE_JS: &str = r#"globalThis.__wasm_rquickjs_import_meta_resolve = function(baseUrl, specifier) {
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(specifier) || specifier.startsWith('data:')) return specifier;
  if (specifier.startsWith('node:')) return specifier;
  var NODE_BUILTINS = new Set(['fs','path','os','crypto','http','https','url','util','stream','events','buffer','querystring','string_decoder','zlib','assert','module','net','tls','child_process','timers','dns','dgram','cluster','constants','readline','tty','v8','vm','worker_threads','perf_hooks','async_hooks','diagnostics_channel','trace_events','inspector','punycode','console','process','test','sqlite','domain','http2','repl']);
  function normalizePath(p) {
    var parts = p.split('/'); var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i] || parts[i] === '.') continue;
      if (parts[i] === '..') { if (out.length > 0) out.pop(); }
      else out.push(parts[i]);
    }
    return '/' + out.join('/');
  }
  if (specifier.startsWith('/')) {
    var path = normalizePath(specifier);
    return baseUrl.startsWith('file://') ? 'file://' + path : path;
  }
  if (specifier.startsWith('.')) {
    var base = baseUrl;
    if (base.startsWith('file://')) base = base.slice(7);
    var dir = base.substring(0, base.lastIndexOf('/') + 1);
    var path = normalizePath(dir + specifier);
    return baseUrl.startsWith('file://') ? 'file://' + path : path;
  }
  if (NODE_BUILTINS.has(specifier)) return 'node:' + specifier;
  throw new Error('Cannot resolve bare specifier "' + specifier + '" from "' + baseUrl + '"');
};"#;

const IMPORT_ATTRS_VALIDATE_JS: &str = r#"
globalThis.__wasm_rquickjs_validate_import_attrs = function(specifier, options) {
  var attrs = null;
  if (options != null && typeof options === 'object') {
    var w = options['with'];
    if (w != null && typeof w === 'object') {
      attrs = w;
    }
  }

  var format = null;
  if (typeof specifier === 'string') {
    if (specifier.startsWith('data:')) {
      var rest = specifier.substring(5);
      var ci = rest.indexOf(',');
      if (ci >= 0) {
        var meta = rest.substring(0, ci).split(';')[0].trim();
        if (meta === 'application/json') format = 'json';
        else if (meta === 'text/javascript' || meta === 'application/javascript') format = 'module';
        else if (meta === 'text/css') format = 'css';
      }
    } else if (specifier.endsWith('.json')) {
      format = 'json';
    } else if (specifier.endsWith('.js') || specifier.endsWith('.mjs') || specifier.endsWith('.cjs')) {
      format = 'module';
    }
  }

  if (attrs) {
    var typeValue;
    var keys = Object.keys(attrs);
    for (var k = 0; k < keys.length; k++) {
      if (keys[k] === 'type') typeValue = attrs.type;
    }
    if (typeValue !== undefined) {
      if (typeValue === 'json') {
        if (format === 'module') {
          return Promise.reject(Object.assign(
            new TypeError('Cannot use import attributes to change the type of a JavaScript module'),
            { code: 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE' }
          ));
        }
      } else if (typeValue !== 'css') {
        return Promise.reject(Object.assign(
          new TypeError('Import attribute type "' + typeValue + '" is not supported'),
          { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' }
        ));
      }
    }
  }

  if (format === 'json') {
    if (!attrs || attrs.type !== 'json') {
      return Promise.reject(Object.assign(
        new TypeError('Module "' + specifier + '" needs an import attribute of "type: json"'),
        { code: 'ERR_IMPORT_ATTRIBUTE_MISSING' }
      ));
    }
  }

  if (attrs) {
    var keys2 = Object.keys(attrs);
    for (var j = 0; j < keys2.length; j++) {
      if (keys2[j] !== 'type') {
        return Promise.reject(Object.assign(
          new TypeError('Import attribute "' + keys2[j] + '" is not supported'),
          { code: 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED' }
        ));
      }
    }
  }

  return false;
};
"#;

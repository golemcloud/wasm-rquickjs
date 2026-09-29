use std::fmt::Write;
use std::sync::{Mutex, OnceLock};

use rquickjs::loader::{BuiltinLoader, BuiltinResolver};

use crate::internal::module_loading::collect_static_esm_export_names;

const IMPLEMENTATION_PREFIX: &str = "__wasm_rquickjs_builtin/sync-implementation/";

const SYNCABLE_BUILTIN_NAMES: &[&str] = &[
    "node:_http_agent",
    "node:_http_common",
    "node:assert",
    "node:assert/strict",
    "node:async_hooks",
    "node:buffer",
    "node:child_process",
    "node:cluster",
    "node:console",
    "node:constants",
    "node:crypto",
    "node:dgram",
    "node:diagnostics_channel",
    "node:dns",
    "node:dns/promises",
    "node:domain",
    "node:events",
    "node:fs",
    "node:fs/promises",
    "node:http",
    "node:http2",
    "node:https",
    "node:inspector",
    "node:module",
    "node:net",
    "node:os",
    "node:path",
    "node:path/posix",
    "node:path/win32",
    "node:perf_hooks",
    "node:process",
    "node:punycode",
    "node:querystring",
    "node:readline",
    "node:readline/promises",
    "node:repl",
    "node:sqlite",
    "node:stream",
    "node:stream/consumers",
    "node:stream/promises",
    "node:stream/web",
    "node:string_decoder",
    "node:test",
    "node:timers",
    "node:timers/promises",
    "node:tls",
    "node:trace_events",
    "node:tty",
    "node:url",
    "node:util",
    "node:util/types",
    "node:v8",
    "node:vm",
    "node:worker_threads",
    "node:zlib",
];

pub(super) fn syncable_builtin_names() -> Vec<String> {
    SYNCABLE_BUILTIN_NAMES
        .iter()
        .map(|name| (*name).to_string())
        .collect()
}

fn implementation_name(name: &str) -> String {
    format!("{IMPLEMENTATION_PREFIX}{name}")
}

fn facade_source(name: &str, implementation: &str, exports_source: &str) -> Vec<u8> {
    let export_names = collect_static_esm_export_names(exports_source);
    assert!(
        !export_names.is_empty(),
        "syncable builtin {name} has no named exports"
    );

    let mut source = format!(
        "import __wasmRquickjsDefault, * as __wasmRquickjsNamespace from {implementation:?};\n"
    );
    for (index, export_name) in export_names.iter().enumerate() {
        writeln!(
            source,
            "let __wasmRquickjsExport{index} = __wasmRquickjsNamespace[{export_name:?}];"
        )
        .unwrap();
    }
    source.push_str("export {\n");
    for (index, export_name) in export_names.iter().enumerate() {
        writeln!(
            source,
            "  __wasmRquickjsExport{index} as {export_name},"
        )
        .unwrap();
    }
    source.push_str("};\nexport default __wasmRquickjsDefault;\n");
    source.push_str(
        "const __wasmRquickjsRegistry = globalThis.__wasm_rquickjs_sync_builtin_esm_exports ||\n\
Object.defineProperty(globalThis, '__wasm_rquickjs_sync_builtin_esm_exports', {\n\
  value: Object.create(null), writable: false, configurable: false,\n\
}).__wasm_rquickjs_sync_builtin_esm_exports;\n\
const __wasmRquickjsHasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);\n\
const __wasmRquickjsExportSet = Object.create(null);\n\
const __wasmRquickjsSyncOrder = [];\n\
const __wasmRquickjsSeen = Object.create(null);\n",
    );
    for export_name in &export_names {
        writeln!(
            source,
            "__wasmRquickjsExportSet[{export_name:?}] = true;"
        )
        .unwrap();
    }
    source.push_str(
        "for (const __wasmRquickjsKey of Object.keys(__wasmRquickjsDefault)) {\n\
  if (__wasmRquickjsHasOwn(__wasmRquickjsExportSet, __wasmRquickjsKey)) {\n\
    __wasmRquickjsSeen[__wasmRquickjsKey] = true;\n\
    __wasmRquickjsSyncOrder.push(__wasmRquickjsKey);\n\
  }\n\
}\n",
    );
    for export_name in &export_names {
        writeln!(
            source,
            "if (!__wasmRquickjsSeen[{export_name:?}]) __wasmRquickjsSyncOrder.push({export_name:?});"
        )
        .unwrap();
    }
    writeln!(
        source,
        "__wasmRquickjsRegistry[{name:?}] = function(__wasmRquickjsCommonJs) {{"
    )
    .unwrap();
    source.push_str(
        "  for (const __wasmRquickjsKey of __wasmRquickjsSyncOrder) {\n\
    switch (__wasmRquickjsKey) {\n",
    );
    for (index, export_name) in export_names.iter().enumerate() {
        writeln!(
            source,
            "      case {export_name:?}: __wasmRquickjsExport{index} = __wasmRquickjsCommonJs != null && __wasmRquickjsHasOwn(__wasmRquickjsCommonJs, __wasmRquickjsKey) ? __wasmRquickjsCommonJs[__wasmRquickjsKey] : undefined; break;"
        )
        .unwrap();
    }
    source.push_str("    }\n  }\n};\n");
    source.into_bytes()
}

fn cached_facade_source(
    name: &'static str,
    implementation: &str,
    exports_source: &str,
) -> Vec<u8> {
    static FACADES: OnceLock<Mutex<std::collections::HashMap<&'static str, Vec<u8>>>> =
        OnceLock::new();
    let facades = FACADES.get_or_init(|| Mutex::new(std::collections::HashMap::new()));
    let mut facades = facades.lock().expect("syncable builtin facade cache poisoned");
    facades
        .entry(name)
        .or_insert_with(|| facade_source(name, implementation, exports_source))
        .clone()
}

pub(super) trait SyncableBuiltinLoaderExt {
    fn with_syncable_module(self, name: &'static str, source: &'static str) -> Self;

    fn with_syncable_module_exports(
        self,
        name: &'static str,
        source: &'static str,
        exports_source: &'static str,
    ) -> Self;
}

impl SyncableBuiltinLoaderExt for BuiltinLoader {
    fn with_syncable_module(self, name: &'static str, source: &'static str) -> Self {
        self.with_syncable_module_exports(name, source, source)
    }

    fn with_syncable_module_exports(
        self,
        name: &'static str,
        source: &'static str,
        exports_source: &'static str,
    ) -> Self {
        let implementation = implementation_name(name);
        // The component creates a fresh QuickJS runtime for each execution job.
        // Cache immutable generated sources so those jobs clone the small facade
        // instead of rescanning every builtin implementation.
        let facade = cached_facade_source(name, &implementation, exports_source);
        self.with_module(implementation, source)
            .with_module(name, facade)
    }
}

pub(super) fn add_implementation_resolvers(mut resolver: BuiltinResolver) -> BuiltinResolver {
    for name in SYNCABLE_BUILTIN_NAMES {
        resolver = resolver.with_module(implementation_name(name));
    }
    resolver
}

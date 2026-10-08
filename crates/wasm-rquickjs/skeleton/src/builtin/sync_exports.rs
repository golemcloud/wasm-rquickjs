use std::fmt::Write;
use std::sync::{Mutex, OnceLock};

use rquickjs::loader::{BuiltinLoader, BuiltinResolver};

use crate::internal::module_loading::{
    collect_static_esm_export_names, has_static_esm_star_reexport,
};

const PRIVATE_BUILTIN_PREFIX: &str = "__wasm_rquickjs_builtin/";
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

pub(super) fn schemeless_syncable_builtin_names() -> Vec<String> {
    SYNCABLE_BUILTIN_NAMES
        .iter()
        .filter(|name| !matches!(**name, "node:sqlite" | "node:test"))
        .map(|name| (*name).to_string())
        .collect()
}

pub(super) fn canonical_public_builtin_alias(name: &str) -> Option<&'static str> {
    SYNCABLE_BUILTIN_NAMES.iter().copied().find(|canonical| {
        !matches!(*canonical, "node:sqlite" | "node:test")
            && canonical.strip_prefix("node:") == Some(name)
    })
}

fn implementation_name(name: &str) -> String {
    format!("{IMPLEMENTATION_PREFIX}{name}")
}

pub(super) fn implementation_import(base: &str, name: &str) -> Option<String> {
    if !base.starts_with(PRIVATE_BUILTIN_PREFIX) {
        return None;
    }
    let canonical = SYNCABLE_BUILTIN_NAMES
        .iter()
        .copied()
        .find(|canonical| *canonical == name)
        .or_else(|| canonical_public_builtin_alias(name))?;
    Some(implementation_name(canonical))
}

fn export_name_source(name: &str) -> String {
    let bytes = name.as_bytes();
    if bytes
        .first()
        .is_some_and(|byte| byte.is_ascii_alphabetic() || matches!(byte, b'_' | b'$'))
        && bytes
            .iter()
            .skip(1)
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'$'))
    {
        name.to_string()
    } else {
        serde_json::to_string(name).expect("ESM export name must serialize")
    }
}

fn facade_source(name: &str, implementation: &str, exports_source: &str) -> Vec<u8> {
    assert!(
        !has_static_esm_star_reexport(exports_source),
        "syncable builtin {name} uses an unresolved export *; pass its concrete implementation as exports_source"
    );
    let export_names = collect_static_esm_export_names(exports_source);

    let mut source = format!(
        "import __wasmRquickjsDefault, * as __wasmRquickjsNamespace from {implementation:?};\n\
const __wasmRquickjsHasOwn = globalThis.__wasm_rquickjs_builtin_facade_has_own;\n\
const __wasmRquickjsCreate = globalThis.__wasm_rquickjs_builtin_facade_object_create;\n\
const __wasmRquickjsDefineProperty = globalThis.__wasm_rquickjs_builtin_facade_define_property;\n\
const __wasmRquickjsKeys = globalThis.__wasm_rquickjs_builtin_facade_object_keys;\n"
    );
    source.push_str(
        "if (typeof __wasmRquickjsDefault === 'function' ||\n\
    (typeof __wasmRquickjsDefault === 'object' && __wasmRquickjsDefault !== null)) {\n",
    );
    for export_name in &export_names {
        writeln!(
            source,
            "  if (!__wasmRquickjsHasOwn(__wasmRquickjsDefault, {export_name:?})) __wasmRquickjsDefineProperty(__wasmRquickjsDefault, {export_name:?}, {{ value: __wasmRquickjsNamespace[{export_name:?}], writable: true, configurable: true, enumerable: true }});"
        )
        .unwrap();
    }
    source.push_str("}\n");
    for (index, export_name) in export_names.iter().enumerate() {
        writeln!(
            source,
            "let __wasmRquickjsExport{index} = __wasmRquickjsNamespace[{export_name:?}];"
        )
        .unwrap();
    }
    source.push_str("export {\n");
    for (index, export_name) in export_names.iter().enumerate() {
        let export_name_source = export_name_source(export_name);
        writeln!(
            source,
            "  __wasmRquickjsExport{index} as {export_name_source},"
        )
        .unwrap();
    }
    source.push_str("};\nexport default __wasmRquickjsDefault;\n");
    source.push_str(
        "const __wasmRquickjsRegistry = globalThis.__wasm_rquickjs_sync_builtin_esm_exports ||\n\
__wasmRquickjsDefineProperty(globalThis, '__wasm_rquickjs_sync_builtin_esm_exports', {\n\
  value: __wasmRquickjsCreate(null), writable: false, configurable: false,\n\
}).__wasm_rquickjs_sync_builtin_esm_exports;\n\
const __wasmRquickjsExportSet = __wasmRquickjsCreate(null);\n\
const __wasmRquickjsSyncOrder = [];\n\
const __wasmRquickjsSeen = __wasmRquickjsCreate(null);\n",
    );
    for export_name in &export_names {
        writeln!(source, "__wasmRquickjsExportSet[{export_name:?}] = true;").unwrap();
    }
    source.push_str(
        "const __wasmRquickjsDefaultKeys = __wasmRquickjsKeys(__wasmRquickjsDefault);\n\
for (let __wasmRquickjsIndex = 0; __wasmRquickjsIndex < __wasmRquickjsDefaultKeys.length; __wasmRquickjsIndex++) {\n\
  const __wasmRquickjsKey = __wasmRquickjsDefaultKeys[__wasmRquickjsIndex];\n\
  if (__wasmRquickjsHasOwn(__wasmRquickjsExportSet, __wasmRquickjsKey)) {\n\
    __wasmRquickjsSeen[__wasmRquickjsKey] = true;\n\
    __wasmRquickjsSyncOrder[__wasmRquickjsSyncOrder.length] = __wasmRquickjsKey;\n\
  }\n\
}\n",
    );
    for export_name in &export_names {
        writeln!(
            source,
            "if (!__wasmRquickjsSeen[{export_name:?}]) __wasmRquickjsSyncOrder[__wasmRquickjsSyncOrder.length] = {export_name:?};"
        )
        .unwrap();
    }
    source.push_str("const __wasmRquickjsSync = function(__wasmRquickjsCommonJs) {\n");
    source.push_str(
        "  for (let __wasmRquickjsIndex = 0; __wasmRquickjsIndex < __wasmRquickjsSyncOrder.length; __wasmRquickjsIndex++) {\n\
    const __wasmRquickjsKey = __wasmRquickjsSyncOrder[__wasmRquickjsIndex];\n\
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
    writeln!(
        source,
        "__wasmRquickjsDefineProperty(__wasmRquickjsRegistry, {name:?}, {{\n  value: __wasmRquickjsSync, writable: false, configurable: false, enumerable: true,\n}});"
    )
    .unwrap();
    source.push_str("__wasmRquickjsSync(__wasmRquickjsDefault);\n");
    source.into_bytes()
}

fn cached_facade_source(name: &'static str, implementation: &str, exports_source: &str) -> Vec<u8> {
    static FACADES: OnceLock<Mutex<std::collections::HashMap<&'static str, Vec<u8>>>> =
        OnceLock::new();
    let facades = FACADES.get_or_init(|| Mutex::new(std::collections::HashMap::new()));
    let mut facades = facades
        .lock()
        .expect("syncable builtin facade cache poisoned");
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_only_facades_are_valid_no_op_sync_targets() {
        let source = String::from_utf8(facade_source(
            "node:default-only",
            "__implementation",
            "export default {};",
        ))
        .unwrap();
        assert!(source.contains("export {\n};"));
        assert!(source.contains("__wasmRquickjsSync(__wasmRquickjsDefault);"));
    }

    #[test]
    fn string_literal_export_names_stay_valid_in_generated_facades() {
        let source = String::from_utf8(facade_source(
            "node:quoted-export",
            "__implementation",
            "const value = 1; export { value as 'not-an-identifier' }; export default {};",
        ))
        .unwrap();
        assert!(source.contains("as \"not-an-identifier\","));
    }

    #[test]
    fn only_private_builtin_sources_bypass_public_facades() {
        assert_eq!(
            implementation_import("__wasm_rquickjs_builtin/console", "node:util"),
            Some("__wasm_rquickjs_builtin/sync-implementation/node:util".to_string())
        );
        assert_eq!(
            implementation_import("__wasm_rquickjs_builtin/console", "util"),
            Some("__wasm_rquickjs_builtin/sync-implementation/node:util".to_string())
        );
        assert_eq!(
            implementation_import("file:///app/main.mjs", "node:util"),
            None
        );
        assert_eq!(
            implementation_import("__wasm_rquickjs_builtin/console", "test"),
            None
        );
    }

    #[test]
    fn generated_facades_use_runtime_owned_primordials_and_indexed_loops() {
        let source = String::from_utf8(facade_source(
            "node:sample",
            "__implementation",
            "export const value = 1; export default { value };",
        ))
        .unwrap();

        assert!(source.contains("__wasm_rquickjs_builtin_facade_object_keys"));
        assert!(!source.contains("Object.keys"));
        assert!(!source.contains("for (const __wasmRquickjsKey of"));
        assert!(!source.contains(".push("));
    }
}

pub mod js_subtest_parser;
pub mod test_server;

use crate::common::WasmSource::Precompiled;
use anyhow::anyhow;
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use futures::FutureExt;
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Write;
use std::process::Command;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use tokio::time::timeout;
use wac_graph::types::{Package, SubtypeChecker};
use wac_graph::{CompositionGraph, EncodeOptions, PackageId, PlugError};
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{
    Component, Func, Instance, Linker, ResourceAny, ResourceTable, ResourceType, Val,
};
use wasmtime::{Engine, Store, StoreContextMut, UpdateDeadline};
use wasmtime_wasi::cli::OutputFile;
use wasmtime_wasi::p2::bindings;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtx, WasiCtxView, WasiView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p2::{WasiHttpCtxView, WasiHttpView, default_hooks};

/// Default timeout for node_compat tests (in seconds).
pub const DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS: u64 = 120;

/// Strip JSONC comments (// and /* */) while respecting string literals.
pub fn strip_jsonc_comments(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '"' {
            result.push(chars[i]);
            i += 1;
            while i < len && chars[i] != '"' {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '/' {
            i += 2;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2;
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    result
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NodeCompatCategory {
    /// The test exercises supported public API and should pass. Failures count against primary compatibility.
    Runnable,
    /// The tested public API is not implemented yet, but is in scope for this runtime.
    KnownGap,
    /// The test requires capabilities that WASI Preview 2 cannot provide.
    WasmImpossible,
    /// The test depends on V8-specific behavior that QuickJS cannot reasonably mirror.
    EngineDifference,
    /// The test checks Node.js internal implementation details rather than public API.
    NodeInternals,
    /// The test has not been triaged yet and should not affect compatibility percentages.
    Unevaluated,
}

impl NodeCompatCategory {
    pub fn from_config_value(value: &str) -> anyhow::Result<Self> {
        match value {
            "runnable" | "expected-pass" => Ok(Self::Runnable),
            "gap" | "known-gap" | "not-implemented" => Ok(Self::KnownGap),
            "wasi-impossible" | "wasm-impossible" | "impossible" | "unsupported-by-wasi" => {
                Ok(Self::WasmImpossible)
            }
            "engine-difference" | "quickjs-difference" | "v8-specific" => {
                Ok(Self::EngineDifference)
            }
            "node-internals" | "internals" | "implementation-detail" => Ok(Self::NodeInternals),
            "unevaluated" | "untriaged" => Ok(Self::Unevaluated),
            other => anyhow::bail!("unknown node_compat category '{other}'"),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Runnable => "runnable",
            Self::KnownGap => "known gap",
            Self::WasmImpossible => "WASI-impossible",
            Self::EngineDifference => "engine difference",
            Self::NodeInternals => "Node.js internals",
            Self::Unevaluated => "unevaluated",
        }
    }

    pub fn should_ignore_in_runner(self) -> bool {
        !matches!(self, Self::Runnable)
    }

    pub fn is_primary_surface(self) -> bool {
        matches!(self, Self::Runnable | Self::KnownGap)
    }
}

#[derive(Debug, Clone)]
pub struct NodeCompatSubtestEntry {
    pub name: String,
    pub index: usize,
    pub category: NodeCompatCategory,
    pub reason: Option<String>,
    pub flaky: bool,
}

#[derive(Debug, Clone)]
pub struct NodeCompatTestEntry {
    pub path: String,
    pub category: NodeCompatCategory,
    pub reason: Option<String>,
    pub split: bool,
    pub timeout_secs: u64,
    pub flaky: bool,
    pub subtests: Vec<NodeCompatSubtestEntry>,
}

/// Extract the numeric index from a subtest name like "block_00_foo" or "test_03_bar".
/// Panics if the name doesn't match the expected format (config is authoritative).
pub fn extract_node_compat_subtest_index(name: &str) -> usize {
    let after_prefix = if let Some(rest) = name.strip_prefix("block_") {
        rest
    } else if let Some(rest) = name.strip_prefix("test_") {
        rest
    } else {
        panic!("Subtest name '{name}' must start with 'block_' or 'test_'");
    };
    let digits: String = after_prefix
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect();
    digits
        .parse()
        .unwrap_or_else(|_| panic!("Subtest name '{name}' has no valid numeric index after prefix"))
}

fn is_unevaluated_node_compat_reason(reason: &str) -> bool {
    let r = reason.trim();
    r == "newly discovered, not yet evaluated" || r.starts_with("inherited: newly discovered")
}

fn node_compat_category_from_entry(
    path: &str,
    entry: &serde_json::Value,
    inherited: Option<NodeCompatCategory>,
) -> anyhow::Result<NodeCompatCategory> {
    if let Some(category) = entry.get("category").and_then(|v| v.as_str()) {
        return NodeCompatCategory::from_config_value(category);
    }

    if entry
        .get("impossible")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return Ok(NodeCompatCategory::WasmImpossible);
    }

    if entry.get("skip").and_then(|v| v.as_bool()).unwrap_or(false) {
        let reason = entry.get("reason").and_then(|v| v.as_str()).unwrap_or("");
        return Ok(if is_unevaluated_node_compat_reason(reason) {
            NodeCompatCategory::Unevaluated
        } else if uses_node_internals(path) {
            NodeCompatCategory::NodeInternals
        } else {
            NodeCompatCategory::KnownGap
        });
    }

    if let Some(category) = inherited
        && category.should_ignore_in_runner()
    {
        return Ok(category);
    }

    if uses_node_internals(path) {
        Ok(NodeCompatCategory::NodeInternals)
    } else {
        Ok(NodeCompatCategory::Runnable)
    }
}

pub fn load_node_compat_config(path: &str) -> anyhow::Result<Vec<NodeCompatTestEntry>> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let tests_obj = value
        .get("tests")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("config.jsonc missing 'tests' object"))?;

    let mut tests = Vec::new();
    for (path, opts) in tests_obj {
        let category = node_compat_category_from_entry(path, opts, None)?;
        let reason = opts
            .get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let split = opts.get("split").and_then(|v| v.as_bool()).unwrap_or(false);
        let timeout_secs = opts
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS);
        let flaky = opts.get("flaky").and_then(|v| v.as_bool()).unwrap_or(false);

        let mut subtests = Vec::new();
        if let Some(subtests_obj) = opts.get("subtests").and_then(|v| v.as_object()) {
            for (subtest_name, subtest_opts) in subtests_obj {
                let sub_category =
                    node_compat_category_from_entry(path, subtest_opts, Some(category))?;
                let sub_reason = subtest_opts
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .or_else(|| reason.clone());
                let sub_flaky = subtest_opts
                    .get("flaky")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(flaky);
                let index = extract_node_compat_subtest_index(subtest_name);
                subtests.push(NodeCompatSubtestEntry {
                    name: subtest_name.clone(),
                    index,
                    category: sub_category,
                    reason: sub_reason,
                    flaky: sub_flaky,
                });
            }
        }

        tests.push(NodeCompatTestEntry {
            path: path.clone(),
            category,
            reason,
            split,
            timeout_secs,
            flaky,
            subtests,
        });
    }

    Ok(tests)
}

/// Recursively copy a directory and all its contents to a destination.
pub fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> anyhow::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Copy a vendored Node.js test file and common shims into a temp directory.
///
/// Sets up the directory layout expected by the node-compat-runner:
/// - `/home/node/test/<suite>/<test_file>` — the test itself
/// - `/home/node/test/common/` — common shims
/// - `/tmp/` — for tmpdir shim
/// - `/home/node/test/fixtures/` — fixture data files (recursively copied)
pub fn setup_node_compat_test_files(temp: &Utf8Path, test_rel_path: &str) -> anyhow::Result<()> {
    // Parse the suite name from the relative path (e.g., "parallel/test-foo.js" → "parallel")
    let suite = test_rel_path.split('/').next().unwrap_or("parallel");

    // Create directory structure: /home/node/test/<suite>/ and /home/node/test/common/
    // The /home/node prefix ensures import.meta.url matches patterns like /.*\/test\//.
    let test_root = temp.join("home").join("node").join("test");
    let suite_dir = test_root.join(suite);
    let common_dir = test_root.join("common");
    fs::create_dir_all(&suite_dir)?;
    fs::create_dir_all(&common_dir)?;

    // Copy the test file
    let test_filename = test_rel_path.rsplit('/').next().unwrap_or(test_rel_path);
    let src_test = format!("tests/node_compat/suite/{test_rel_path}");
    let dst_test = suite_dir.join(test_filename);
    fs::copy(&src_test, &dst_test)?;

    // Copy the common shim
    let src_shim = "tests/node_compat/common-shim/index.js";
    let dst_shim = common_dir.join("index.js");
    fs::copy(src_shim, &dst_shim)?;

    // Copy the common ESM shim if it exists
    let src_shim_mjs = "tests/node_compat/common-shim/index.mjs";
    if std::path::Path::new(src_shim_mjs).exists() {
        fs::copy(src_shim_mjs, common_dir.join("index.mjs"))?;
    }

    // Copy all additional common shims from common-shim directory
    let shim_dir = std::path::Path::new("tests/node_compat/common-shim");
    if shim_dir.exists() {
        for entry in fs::read_dir(shim_dir)? {
            let entry = entry?;
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            // Skip index.js and index.mjs (already copied above)
            if file_name_str == "index.js" || file_name_str == "index.mjs" {
                continue;
            }
            if entry.file_type()?.is_file() {
                fs::copy(entry.path(), common_dir.join(file_name_str.as_ref()))?;
            }
        }
    }

    // Create /tmp directory for tmpdir shim
    let tmp_dir = temp.join("tmp");
    fs::create_dir_all(&tmp_dir)?;

    // Copy fixture data files for tests that use require('../common/fixtures')
    let fixtures_dst = test_root.join("fixtures");

    // First copy vendored suite fixtures
    let vendored_fixtures_src = std::path::Path::new("tests/node_compat/suite/fixtures");
    if vendored_fixtures_src.exists() {
        copy_dir_recursive(vendored_fixtures_src, fixtures_dst.as_std_path())?;
    }

    // Then overlay with our custom fixtures (take priority over vendored ones)
    let fixtures_src = std::path::Path::new("tests/node_compat/fixtures");
    if fixtures_src.exists() {
        copy_dir_recursive(fixtures_src, fixtures_dst.as_std_path())?;
    }

    Ok(())
}

pub fn collect_example_paths(dirs: &[&str]) -> anyhow::Result<Vec<Utf8PathBuf>> {
    let mut result = Vec::new();
    for dir in dirs {
        let paths = fs::read_dir(dir)?;
        for example_path in paths {
            let example_path = example_path?;
            let metadata = example_path.metadata()?;
            if metadata.is_dir() {
                let path = Utf8PathBuf::from_path_buf(example_path.path())
                    .map_err(|_| anyhow!("Non UTF-8 example path"))?;
                result.push(path);
            }
        }
    }
    Ok(result)
}

/// The WASI generation target a runtime/node_compat test is exercised against.
///
/// Selected once per process via the `WASM_RQUICKJS_TEST_TARGET` environment variable
/// (`p2` — the default — or `p3`). Preview 2 reproduces the historical behavior; Preview 3
/// generates async component exports and runs them on a Component Model async host.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestTarget {
    P2,
    P3,
}

impl TestTarget {
    /// Suffix appended to generated crate / shared-target directories so that P2 and P3 builds of
    /// the same example never share an output tree (the P3 generator writes a different Cargo.toml
    /// and skeleton set).
    pub fn dir_suffix(self) -> &'static str {
        match self {
            TestTarget::P2 => "",
            TestTarget::P3 => "-p3",
        }
    }

    pub fn generation_target(self) -> GenerationTarget {
        match self {
            TestTarget::P2 => GenerationTarget::WasiP2,
            TestTarget::P3 => GenerationTarget::WasiP3,
        }
    }
}

/// Reads the active test target once from `WASM_RQUICKJS_TEST_TARGET` (default: `p2`).
pub fn test_target() -> TestTarget {
    static TARGET: OnceLock<TestTarget> = OnceLock::new();
    *TARGET.get_or_init(
        || match std::env::var("WASM_RQUICKJS_TEST_TARGET").ok().as_deref() {
            Some("p3") | Some("P3") => TestTarget::P3,
            Some("p2") | Some("P2") | None => TestTarget::P2,
            Some(other) => {
                panic!("Unknown WASM_RQUICKJS_TEST_TARGET '{other}'; expected 'p2' or 'p3'")
            }
        },
    )
}

/// Copies a WIT directory to `dst`, turning every synchronous freestanding exported function into
/// an `async func`.
///
/// The Preview 3 generation path rejects *synchronous freestanding exports* — both world-level
/// `export …: func(…)` and plain `name: func(…)` declarations inside an exported `interface`. A
/// synchronous *resource instance method* additionally traps at runtime if its JS implementation
/// returns a Promise. Because the JS in these examples freely uses `async` methods, the rewrite
/// async-ifies every `name: func(` declaration — freestanding functions and resource instance
/// methods alike (see [`rewrite_wit_source_exports_async`]). Resource `constructor`s and `static
/// func`s are left synchronous: WIT has no async spelling for them, and their JS returns values
/// directly.
///
/// Only the package's own `.wit` files (those directly in `src_wit_dir`) are rewritten; the
/// `deps/` subtree is copied verbatim. Dependency interfaces are *imported* (e.g. `wasi:random`),
/// and their function signatures must keep matching the host imports, so they must never be
/// async-ified. Examples that *export* an interface defined in a dependency package may therefore
/// still fail to build or run under the P3 lane; every test is run in P3 mode on CI so such gaps
/// surface directly.
pub fn rewrite_wit_exports_async(
    src_wit_dir: &Utf8Path,
    dst_wit_dir: &Utf8Path,
) -> anyhow::Result<()> {
    if dst_wit_dir.exists() {
        fs::remove_dir_all(dst_wit_dir)?;
    }
    fs::create_dir_all(dst_wit_dir)?;

    for entry in fs::read_dir(src_wit_dir)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path =
            Utf8PathBuf::from_path_buf(entry.path()).map_err(|_| anyhow!("Non UTF-8 WIT path"))?;
        let file_name = src_path
            .file_name()
            .ok_or_else(|| anyhow!("WIT entry without file name"))?;
        let dst_path = dst_wit_dir.join(file_name);

        if file_type.is_dir() {
            // A `deps/` subtree holds *imported* interfaces — copy it verbatim so the import
            // signatures keep matching the host, never rewriting them to async.
            copy_dir_recursive(src_path.as_std_path(), dst_path.as_std_path())?;
        } else if src_path.extension() == Some("wit") {
            let rewritten = rewrite_wit_source_exports_async(&fs::read_to_string(&src_path)?);
            fs::write(&dst_path, rewritten)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Line-oriented rewrite backing [`rewrite_wit_exports_async`]. Kept separate so it is trivially
/// unit-testable and free of any filesystem access.
///
/// Every line declaring a function type as `name: func(` is turned into `name: async func(`. This
/// covers world-level `export foo: func(…)`, freestanding `foo: func(…)` inside an exported
/// interface, and resource *instance* methods `bar: func(…)`. It deliberately does **not** match
/// `constructor(…)` (no `: func(`) or `baz: static func(…)` (spelled `: static func(`, not
/// `: func(`): WIT has no async spelling for those, and their JS returns values directly.
fn rewrite_wit_source_exports_async(source: &str) -> String {
    source
        .lines()
        .map(|line| {
            if line.contains(": func(") && !line.contains(": async func(") {
                line.replacen(": func(", ": async func(", 1)
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
        + if source.ends_with('\n') { "\n" } else { "" }
}

#[derive(Copy, Clone)]
pub enum FeatureCombination {
    None,
    Lite,
    Normal,
    Full,
    FullNoLogging,
    Golem,
    FullWithGolem,
    FullNoLoggingWithGolem,
}

impl FeatureCombination {
    pub fn all() -> Vec<FeatureCombination> {
        vec![Self::Lite, Self::Normal, Self::Full, Self::FullWithGolem]
    }

    pub fn label(&self) -> &str {
        match self {
            Self::None => "none",
            Self::Lite => "lite",
            Self::Normal => "normal",
            Self::Full => "full",
            Self::FullNoLogging => "full-no-logging",
            Self::Golem => "golem",
            Self::FullWithGolem => "full-golem",
            Self::FullNoLoggingWithGolem => "full-no-logging-golem",
        }
    }

    pub fn cargo_args(&self) -> Vec<&'static str> {
        match self {
            // The skeleton now requires exactly one WASI target feature (`p2` or `p3`), so the
            // minimal Preview 2 build must still enable `p2` even with no other features.
            FeatureCombination::None => vec!["--no-default-features", "--features", "p2"],
            FeatureCombination::Lite => {
                vec!["--no-default-features", "--features", "lite"]
            }
            FeatureCombination::Normal => vec![],
            FeatureCombination::Full => {
                vec!["--no-default-features", "--features", "full"]
            }
            FeatureCombination::FullNoLogging => {
                vec!["--no-default-features", "--features", "full-no-logging"]
            }
            FeatureCombination::Golem => vec!["--features", "golem"],
            FeatureCombination::FullWithGolem => {
                vec!["--no-default-features", "--features", "full,golem"]
            }
            FeatureCombination::FullNoLoggingWithGolem => {
                vec![
                    "--no-default-features",
                    "--features",
                    "full-no-logging,golem",
                ]
            }
        }
    }

    /// Cargo `--features` args for a given [`TestTarget`].
    ///
    /// For Preview 2 this is the historical [`cargo_args`](Self::cargo_args). For Preview 3 the
    /// P2-only capabilities (`logging`, `node-http`, `fetch`, `golem`, `websocket`) are not
    /// available, so every combination collapses onto one of the two P3 feature bundles the
    /// skeleton exposes: `normal-p3` (crypto/zlib/encoding) or `full-p3` (adds crypto-full,
    /// brotli, sqlite, timezone). The features are always spelled out explicitly so the P3 build
    /// never silently falls back to the P2 default feature set.
    pub fn cargo_args_for_target(&self, target: TestTarget) -> Vec<&'static str> {
        match target {
            TestTarget::P2 => self.cargo_args(),
            TestTarget::P3 => {
                let features = match self {
                    FeatureCombination::None | FeatureCombination::Lite => "normal-p3",
                    FeatureCombination::Normal => "normal-p3",
                    FeatureCombination::Full
                    | FeatureCombination::FullNoLogging
                    | FeatureCombination::Golem
                    | FeatureCombination::FullWithGolem
                    | FeatureCombination::FullNoLoggingWithGolem => "full-p3",
                };
                vec!["--no-default-features", "--features", features]
            }
        }
    }
}

pub struct PreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
}

impl PreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        match test_target() {
            TestTarget::P2 => Self::new_p2(wasm_path),
            TestTarget::P3 => Self::new_p3(wasm_path),
        }
    }

    /// Preview 3 host: a Component Model async engine, a P2+P3 WASI/HTTP linker, and the same
    /// component. Works on both stock wasmtime and the Golem fork — see [`p3_engine`].
    fn new_p3(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let engine = p3_engine()?;
        let linker = p3_linker(&engine)?;
        let component = Component::from_file(&engine, wasm_path)?;
        Ok(Self {
            engine,
            linker,
            component,
        })
    }

    fn new_p2(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.async_stack_size(32 * 1024 * 1024); // 32MB async stack (must be >= max_wasm_stack)
        config.max_wasm_stack(16 * 1024 * 1024); // 16MB WASM stack (default is 512KB, QuickJS in WASM needs more for deep recursion)
        let engine = Engine::new(&config)?;

        // Start a background thread that increments the epoch every 10ms,
        // enabling epoch-based interruption to enforce timeouts on spinning WASM.
        let epoch_engine = engine.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_millis(10));
                epoch_engine.increment_epoch();
            }
        });
        let mut linker: Linker<Host> = Linker::new(&engine);

        wasmtime_wasi::p2::add_to_linker_with_options_async(
            &mut linker,
            &bindings::LinkOptions::default(),
        )?;
        wasmtime_wasi_http::p2::add_only_http_to_linker_async(&mut linker)?;

        // Mock wasi:logging/logging (required by the full feature)
        {
            let mut logging = linker.instance("wasi:logging/logging")?;
            logging.func_wrap(
                "log",
                |mut ctx: StoreContextMut<'_, Host>,
                 (level, context, message): (LogLevel, String, String)|
                 -> Result<(), wasmtime::Error> {
                    ctx.data_mut()
                        .log_messages
                        .lock()
                        .unwrap()
                        .push((level, context, message));
                    Ok(())
                },
            )?;
        }

        // Mock golem:websocket/client@1.5.0 (required when websocket module is included)
        {
            struct WsConn;
            let mut ws = linker.instance("golem:websocket/client@1.5.0")?;
            ws.resource("websocket-connection", ResourceType::host::<WsConn>(), {
                move |_ctx: StoreContextMut<'_, Host>, _rep: u32| Ok(())
            })?;

            ws.func_new(
                "[static]websocket-connection.connect",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket connect not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.send",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket send not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.receive",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket receive not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.receive-with-timeout",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket receive-with-timeout not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.close",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket close not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.subscribe",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket subscribe not available in tests",
                    ))
                },
            )?;
        }

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
        })
    }
}

/// Mock logging level for wasi:logging/logging
#[derive(Debug, Clone, wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(enum)]
#[repr(u8)]
#[allow(dead_code)]
pub enum LogLevel {
    #[component(name = "trace")]
    Trace,
    #[component(name = "debug")]
    Debug,
    #[component(name = "info")]
    Info,
    #[component(name = "warn")]
    Warn,
    #[component(name = "error")]
    Error,
    #[component(name = "critical")]
    Critical,
}

/// Mock attribute-value variant for golem:api/context
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(variant)]
pub enum AttributeValue {
    #[component(name = "string")]
    String(String),
}

/// Mock span for golem:api/context testing
pub struct GolemSpan {
    pub name: String,
    pub attributes: Vec<(String, String)>,
    pub finished: bool,
}

/// A PreparedComponent that includes a mock golem:api/context host implementation.
pub struct GolemPreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
    pub spans: Arc<Mutex<Vec<GolemSpan>>>,
}

impl GolemPreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        match test_target() {
            TestTarget::P2 => Self::new_p2(wasm_path),
            TestTarget::P3 => Self::new_p3(wasm_path),
        }
    }

    /// Preview 3 host for node_compat. The Golem context/websocket/logging capabilities are only
    /// wired up for the `full` (Preview 2) profile, so the P3 node-compat runner is built with
    /// `full-p3` (no Golem) and the linker carries only the P2+P3 WASI/HTTP surface. `spans` is
    /// therefore always empty in P3. Works on both stock wasmtime and the Golem fork.
    fn new_p3(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let engine = p3_engine()?;
        let linker = p3_linker(&engine)?;
        let component = Component::from_file(&engine, wasm_path)?;
        Ok(Self {
            engine,
            linker,
            component,
            spans: Arc::new(Mutex::new(Vec::new())),
        })
    }

    fn new_p2(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.async_stack_size(32 * 1024 * 1024);
        config.max_wasm_stack(16 * 1024 * 1024);
        let engine = Engine::new(&config)?;

        // Start a background thread that increments the epoch every 10ms,
        // enabling epoch-based interruption to enforce timeouts on spinning WASM.
        let epoch_engine = engine.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_millis(10));
                epoch_engine.increment_epoch();
            }
        });
        let mut linker: Linker<Host> = Linker::new(&engine);

        wasmtime_wasi::p2::add_to_linker_with_options_async(
            &mut linker,
            &bindings::LinkOptions::default(),
        )?;
        wasmtime_wasi_http::p2::add_only_http_to_linker_async(&mut linker)?;

        // Mock wasi:logging/logging (required by the golem feature)
        {
            let mut logging = linker.instance("wasi:logging/logging")?;
            logging.func_wrap(
                "log",
                |mut ctx: StoreContextMut<'_, Host>,
                 (level, context, message): (LogLevel, String, String)|
                 -> Result<(), wasmtime::Error> {
                    ctx.data_mut()
                        .log_messages
                        .lock()
                        .unwrap()
                        .push((level, context, message));
                    Ok(())
                },
            )?;
        }

        // Mock golem:websocket/client@1.5.0 (required when websocket module is included)
        {
            struct WsConn;
            let mut ws = linker.instance("golem:websocket/client@1.5.0")?;
            ws.resource("websocket-connection", ResourceType::host::<WsConn>(), {
                move |_ctx: StoreContextMut<'_, Host>, _rep: u32| Ok(())
            })?;

            ws.func_new(
                "[static]websocket-connection.connect",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket connect not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.send",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket send not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.receive",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket receive not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.receive-with-timeout",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket receive-with-timeout not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.close",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket close not available in tests",
                    ))
                },
            )?;

            ws.func_new(
                "[method]websocket-connection.subscribe",
                |_store, _ty, _params, _results| {
                    Err(wasmtime::Error::msg(
                        "WebSocket subscribe not available in tests",
                    ))
                },
            )?;
        }

        // Mock golem:api/context@1.5.0
        let spans: Arc<Mutex<Vec<GolemSpan>>> = Arc::new(Mutex::new(Vec::new()));
        let spans_clone = spans.clone();

        let mut golem_ctx = linker.instance("golem:api/context@1.5.0")?;

        // Register the span resource type
        let span_resource_type = ResourceType::host::<GolemSpan>();
        golem_ctx.resource("span", span_resource_type, {
            let spans = spans_clone.clone();
            move |mut ctx: StoreContextMut<'_, Host>, rep: u32| {
                // Destructor: mark span as finished if not already
                let table = ctx.data_mut().table.lock().unwrap();
                // Resource already dropped by wasmtime
                let _ = (spans.as_ref(), rep, table);
                Ok(())
            }
        })?;

        // start-span: func(name: string) -> span
        golem_ctx.func_wrap("start-span", {
            let spans = spans_clone.clone();
            move |mut ctx: StoreContextMut<'_, Host>,
                  (name,): (String,)|
                  -> Result<(wasmtime::component::Resource<GolemSpan>,), wasmtime::Error> {
                let span = GolemSpan {
                    name,
                    attributes: Vec::new(),
                    finished: false,
                };
                let mut table = ctx.data_mut().table.lock().unwrap();
                let resource = table.push(span)?;
                spans.lock().unwrap().push(GolemSpan {
                    name: String::new(), // placeholder, real data is in table
                    attributes: Vec::new(),
                    finished: false,
                });
                Ok((resource,))
            }
        })?;

        // [method]span.set-attribute: func(name: string, value: attribute-value)
        // attribute-value is a variant with one case: string(string)
        // In the component model, a single-case variant is lifted as a tuple (u32, string) or similar.
        // But since it has only one case, wasmtime may simplify it.
        // Let's check what the actual signature is - it's (resource<span>, string, attribute-value)
        // where attribute-value = variant { string(string) }
        // A variant with one case lifts as (discriminant: u32, payload: string) but wasmtime component
        // may represent it as an enum. Let's use a tuple.
        golem_ctx.func_wrap("[method]span.set-attribute", {
            let spans = spans_clone.clone();
            move |mut ctx: StoreContextMut<'_, Host>,
                  (span_res, attr_name, attr_value): (
                wasmtime::component::Resource<GolemSpan>,
                String,
                AttributeValue,
            )|
                  -> Result<(), wasmtime::Error> {
                let value_str = match &attr_value {
                    AttributeValue::String(s) => s.clone(),
                };
                let mut table = ctx.data_mut().table.lock().unwrap();
                if let Ok(span) = table.get_mut(&span_res) {
                    span.attributes.push((attr_name.clone(), value_str.clone()));
                }
                // Also record in the shared spans list
                let mut shared = spans.lock().unwrap();
                if let Some(last) = shared.last_mut() {
                    last.attributes.push((attr_name, value_str));
                }
                Ok(())
            }
        })?;

        // [method]span.finish: func()
        golem_ctx.func_wrap("[method]span.finish", {
            let spans = spans_clone.clone();
            move |mut ctx: StoreContextMut<'_, Host>,
                  (span_res,): (wasmtime::component::Resource<GolemSpan>,)|
                  -> Result<(), wasmtime::Error> {
                let mut table = ctx.data_mut().table.lock().unwrap();
                if let Ok(span) = table.get_mut(&span_res) {
                    span.finished = true;
                    // Copy final state to shared spans
                    let name = span.name.clone();
                    let attributes = span.attributes.clone();
                    let mut shared = spans.lock().unwrap();
                    if let Some(last) = shared.last_mut() {
                        last.name = name;
                        last.finished = true;
                        last.attributes = attributes;
                    }
                }
                Ok(())
            }
        })?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
            spans,
        })
    }
}

#[allow(dead_code)]
pub struct TestInstance {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
    store: Store<Host>,
    instance: Instance,
    stdout_file: NamedUtf8TempFile,
    stderr_file: NamedUtf8TempFile,
    temp_dir: Utf8TempDir,
}

impl TestInstance {
    pub async fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let prepared = PreparedComponent::new(wasm_path)?;
        Self::from_prepared(&prepared).await
    }

    pub async fn from_prepared(prepared: &PreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(&prepared.engine, &prepared.linker, &prepared.component).await
    }

    pub async fn from_golem_prepared(prepared: &GolemPreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(&prepared.engine, &prepared.linker, &prepared.component).await
    }

    async fn from_parts(
        engine: &Engine,
        linker: &Linker<Host>,
        component: &Component,
    ) -> anyhow::Result<Self> {
        let stdout_file = NamedUtf8TempFile::new()?;
        let stderr_file = NamedUtf8TempFile::new()?;

        let temp_dir = Utf8TempDir::new()?;
        fs::write(temp_dir.path().join("input.txt"), "test file contents")?;
        fs::create_dir(temp_dir.path().join("test"))?;

        let mut ctx_builder = WasiCtx::builder();
        ctx_builder
            .stdout(OutputFile::new(stdout_file.reopen()?))
            .stderr(OutputFile::new(stderr_file.reopen()?))
            .arg("first-arg")
            .arg("second-arg")
            .env("TEST_KEY", "TEST_VALUE")
            .env("TEST_KEY_2", "TEST_VALUE_2")
            .preopened_dir(&temp_dir, "/", DirPerms::all(), FilePerms::all())?
            .inherit_network()
            .allow_ip_name_lookup(true);
        #[cfg(feature = "use-golem-wasmtime")]
        let (ctx, io_ctx) = ctx_builder.build();
        #[cfg(not(feature = "use-golem-wasmtime"))]
        let ctx = ctx_builder.build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(Mutex::new(http_ctx)),
            started_at: Instant::now(),
            timeout: Duration::from_secs(120),
            log_messages: Arc::new(Mutex::new(Vec::new())),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: Arc::new(Mutex::new(io_ctx)),
        };

        let mut store = Store::new(engine, host);
        store.set_epoch_deadline(0);
        store.epoch_deadline_callback(|cx| {
            let data = cx.data();
            if data.started_at.elapsed() >= data.timeout {
                Ok(UpdateDeadline::Interrupt)
            } else {
                Ok(UpdateDeadline::YieldCustom(
                    1,
                    tokio::task::yield_now().boxed(),
                ))
            }
        });

        let instance = linker.instantiate_async(&mut store, component).await?;

        Ok(Self {
            engine: engine.clone(),
            linker: linker.clone(),
            component: component.clone(),
            store,
            instance,
            stdout_file,
            stderr_file,
            temp_dir,
        })
    }

    pub async fn invoke_and_capture_output(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String) {
        let (results, stdout, _stderr) = self
            .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
            .await;
        (results, stdout)
    }

    pub async fn invoke(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> anyhow::Result<Option<Val>> {
        self.invoke_and_capture_output_inner(interface_name, function_name, args)
            .await
            .map(|results| results.first().cloned())
    }

    pub async fn invoke_and_capture_output_with_stderr(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String, String) {
        let results = self
            .invoke_and_capture_output_inner(interface_name, function_name, args)
            .await;

        let stdout = fs::read_to_string(&self.stdout_file).expect("failed to read stdout");
        let stderr = fs::read_to_string(&self.stderr_file).expect("failed to read stderr");

        if results.is_err() {
            for line in stdout.lines() {
                println!("[stdout] {line}");
            }
        }

        for line in stderr.lines() {
            println!("[stderr] {line}");
        }

        (
            results.map(|results| results.first().cloned()),
            stdout,
            stderr,
        )
    }

    pub fn set_epoch_deadline(&mut self, timeout_secs: u64) {
        self.store.data_mut().timeout = Duration::from_secs(timeout_secs);
        self.store.data_mut().started_at = Instant::now();
    }

    pub fn temp_dir_path(&self) -> &Utf8Path {
        self.temp_dir.path()
    }

    pub fn read_stdout(&self) -> anyhow::Result<String> {
        Ok(fs::read_to_string(&self.stdout_file)?)
    }

    pub fn read_stderr(&self) -> anyhow::Result<String> {
        Ok(fs::read_to_string(&self.stderr_file)?)
    }

    pub fn read_log_messages(&self) -> Vec<(LogLevel, String, String)> {
        self.store.data().log_messages.lock().unwrap().clone()
    }

    async fn invoke_and_capture_output_inner(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> anyhow::Result<Vec<Val>> {
        let func = match interface_name {
            Some(interface_name) => {
                let (_, exported_instance_id) = self
                    .instance
                    .get_export(&mut self.store, None, interface_name)
                    .ok_or_else(|| anyhow!("Interface {interface_name} not found"))?;
                let (_, func_id) = self
                    .instance
                    .get_export(&mut self.store, Some(&exported_instance_id), function_name)
                    .ok_or_else(|| {
                        anyhow!("Function {function_name} not found in interface {interface_name}")
                    })?;
                self.instance
                    .get_func(&mut self.store, func_id)
                    .ok_or_else(|| anyhow!("Function {function_name} not found"))?
            }
            None => self
                .instance
                .get_func(&mut self.store, function_name)
                .ok_or_else(|| anyhow!("Function {function_name} not found"))?,
        };

        match timeout(Duration::from_secs(300), self.perform_invoke(func, args)).await {
            Ok(result) => result,
            Err(_) => Err(anyhow!("Function {function_name} timed out")),
        }
    }

    async fn perform_invoke(&mut self, func: Func, args: &[Val]) -> anyhow::Result<Vec<Val>> {
        let mut results = (0..func.ty(&self.store).results().len())
            .map(|_| Val::Bool(false))
            .collect::<Vec<_>>();
        func.call_async(&mut self.store, args, &mut results).await?;
        Ok(results)
    }

    pub async fn drop_resource(&mut self, resource: ResourceAny) -> anyhow::Result<()> {
        resource.resource_drop_async(&mut self.store).await?;
        Ok(())
    }
}

pub async fn invoke_and_capture_output(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String) {
    match TestInstance::new(wasm_path).await {
        Ok(mut test_instance) => {
            test_instance
                .invoke_and_capture_output(interface_name, function_name, args)
                .await
        }
        Err(e) => (Err(e), String::new()),
    }
}

pub async fn invoke_and_capture_output_with_stderr(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String, String) {
    match TestInstance::new(wasm_path).await {
        Ok(mut test_instance) => {
            test_instance
                .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
                .await
        }
        Err(e) => (Err(e), String::new(), String::new()),
    }
}

enum WasmSource {
    Precompiled(Utf8PathBuf),
    OwnedTemporary(NamedUtf8TempFile),
}

pub struct CompiledTest {
    wasm: WasmSource,
}

impl CompiledTest {
    pub async fn new(path: &Utf8Path, use_shared_target: bool) -> anyhow::Result<CompiledTest> {
        Self::new_with_features(path, use_shared_target, FeatureCombination::Normal).await
    }

    pub async fn new_unoptimized_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        Self::compile_with_features(path, use_shared_target, feature_combination).await
    }

    pub async fn new_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        let compiled =
            Self::compile_with_features(path, use_shared_target, feature_combination).await?;
        // Wizer pre-initialization is only wired up for the Preview 2 generation path; the P3
        // generator deliberately does not inject a `wizer-initialize` export, so optimizing a P3
        // component would fail. Return the unoptimized artifact for P3.
        match test_target() {
            TestTarget::P2 => compiled.optimize().await,
            TestTarget::P3 => Ok(compiled),
        }
    }

    async fn compile_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        let target = test_target();
        let name = path.file_name().unwrap();
        // P2 and P3 builds of the same example never share an output tree.
        let feature_label = format!("{}{}", feature_combination.label(), target.dir_suffix());
        let wrapper_crate_root = Utf8Path::new("tmp").join(name).join(&feature_label);

        // shared_target is relative to wrapper_crate_root.
        // this is a _different_ shared target than the one used in the compilation tests to make
        // sure different feature combinations do not interfere with these tests. P3 uses its own
        // shared target so P2 and P3 artifacts never collide.
        let shared_target_name = format!("rt-target{}", target.dir_suffix());
        let shared_target = Utf8Path::new("..").join("..").join(&shared_target_name);

        // The Preview 3 generation path rejects synchronous freestanding exports, so for P3 we
        // rewrite the example's WIT so its world-level exported functions become `async func`
        // before generation. The rewritten WIT lives inside the wrapper crate dir so it never
        // touches the committed example sources.
        let wit_dir = match target {
            TestTarget::P2 => path.join("wit"),
            TestTarget::P3 => {
                let rewritten = wrapper_crate_root.join("wit-async");
                rewrite_wit_exports_async(&path.join("wit"), &rewritten)?;
                rewritten
            }
        };

        println!(
            "Generating wrapper create for example '{name}' ({:?}) to {wrapper_crate_root}",
            target
        );
        generate_wrapper_crate_with_target(
            &wit_dir,
            &[JsModuleSpec {
                name: name.to_string(),
                mode: EmbeddingMode::EmbedFile(path.join("src").join(format!("{name}.js"))),
            }],
            &wrapper_crate_root,
            None,
            target.generation_target(),
        )?;

        println!("Compiling wrapper crate in {wrapper_crate_root}");
        let mut command = Command::new("cargo");
        command.arg("build").arg("--target").arg("wasm32-wasip2");
        if use_shared_target {
            command.arg("--target-dir");
            command.arg(shared_target);
        }
        command
            .args(feature_combination.cargo_args_for_target(target))
            .current_dir(&wrapper_crate_root)
            .status()
            .and_then(|status| {
                if status.success() {
                    Ok(status)
                } else {
                    Err(std::io::Error::other(format!(
                        "cargo build failed for {wrapper_crate_root}"
                    )))
                }
            })?;

        let compiled = if use_shared_target {
            CompiledTest {
                wasm: Precompiled(
                    Utf8Path::new("tmp")
                        .join(&shared_target_name)
                        .join("wasm32-wasip2")
                        .join("debug")
                        .join(format!("{}.wasm", name.to_snake_case())),
                ),
            }
        } else {
            CompiledTest {
                wasm: Precompiled(
                    wrapper_crate_root
                        .join("target")
                        .join("wasm32-wasip2")
                        .join("debug")
                        .join(format!("{}.wasm", name.to_snake_case())),
                ),
            }
        };

        Ok(compiled)
    }

    /// Run Wizer pre-initialization on the compiled component.
    /// Returns a new `CompiledTest` pointing to the optimized wasm file.
    pub async fn optimize(&self) -> anyhow::Result<CompiledTest> {
        let input = self.wasm_path();
        let optimized = input.with_extension("optimized.wasm");
        println!("Optimizing component {input} -> {optimized}");
        wasm_rquickjs::optimize_component(input, &optimized, "wizer-initialize").await?;
        Ok(CompiledTest {
            wasm: Precompiled(optimized),
        })
    }

    pub fn wasm_path(&self) -> &Utf8Path {
        match &self.wasm {
            WasmSource::Precompiled(path) => path,
            WasmSource::OwnedTemporary(temp_file) => temp_file.path(),
        }
    }
}

/// Opt `CompiledTest` into test-r's `Cloneable` sharing strategy so that
/// worker subprocesses can share the parent's compilation result instead
/// of forcing the suite into single-threaded mode under output capturing.
///
/// The wire format is just the **absolute** wasm path. The parent compiles
/// the wrapper crate once (via the existing `CompiledTest::new*` ctors) into
/// a stable on-disk location under `tmp/<example>/<features>/...` (or the
/// shared `tmp/rt-target/...` tree when `use_shared_target = true`) — these
/// paths outlive both the dep value and the suite. Each worker simply receives
/// the path and reconstructs a `Precompiled(...)` `CompiledTest` that points
/// at the same on-disk artifact.
///
/// `OwnedTemporary` is only ever produced by `plug_into`, which is called
/// inside test bodies (never inside a `#[test_dep]` ctor). Shipping an
/// `OwnedTemporary` over wire would silently delete the temp file as soon as
/// the parent dropped the value after `to_wire`, leaving workers reading a
/// dangling path. We refuse loudly instead.
impl test_r::core::CloneableDep for CompiledTest {
    fn to_wire(&self) -> Vec<u8> {
        match &self.wasm {
            Precompiled(path) => {
                let abs = path.canonicalize_utf8().unwrap_or_else(|e| {
                    panic!(
                        "CompiledTest path '{path}' must exist before \
                         being shipped via Cloneable scope: {e}"
                    )
                });
                abs.as_str().as_bytes().to_vec()
            }
            WasmSource::OwnedTemporary(_) => panic!(
                "OwnedTemporary CompiledTest cannot be shared via Cloneable \
                 scope; plug_into() output must stay inside a single test body"
            ),
        }
    }

    fn from_wire(bytes: &[u8]) -> Self {
        let path_str = std::str::from_utf8(bytes)
            .expect("Cloneable CompiledTest wire bytes must be valid UTF-8 path");
        let path = Utf8PathBuf::from(path_str);
        assert!(
            path.exists(),
            "Cloneable CompiledTest received path that does not exist: {path}. \
             The parent must keep the compiled wasm artifact alive for the suite duration."
        );
        CompiledTest {
            wasm: Precompiled(path),
        }
    }
}

impl CompiledTest {
    pub fn plug_into(&self, other: &CompiledTest) -> anyhow::Result<CompiledTest> {
        let mut graph = CompositionGraph::new();
        let socket_package =
            Package::from_file("socket", None, other.wasm_path(), graph.types_mut())?;
        let socket_id = graph.register_package(socket_package)?;

        let plug_package = Package::from_file("plug", None, self.wasm_path(), graph.types_mut())?;
        let plug_id = graph.register_package(plug_package)?;

        plug(
            &mut graph,
            vec![(self.wasm_path().to_string(), plug_id)],
            socket_id,
        )?;

        let bytes = graph.encode(EncodeOptions::default())?;
        let mut wasm_path = NamedUtf8TempFile::new()?;
        wasm_path.write_all(bytes.as_slice())?;
        wasm_path.flush()?;
        Ok(CompiledTest {
            wasm: WasmSource::OwnedTemporary(wasm_path),
        })
    }
}

#[derive(Clone)]
pub struct Host {
    pub table: Arc<Mutex<ResourceTable>>,
    pub wasi: Arc<Mutex<WasiCtx>>,
    pub wasi_http: Arc<Mutex<WasiHttpCtx>>,
    pub started_at: Instant,
    pub timeout: Duration,
    pub log_messages: Arc<Mutex<Vec<(LogLevel, String, String)>>>,
    #[cfg(feature = "use-golem-wasmtime")]
    pub io_ctx: Arc<Mutex<wasmtime_wasi::IoCtx>>,
}

impl WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: Arc::get_mut(&mut self.wasi)
                .expect("WasiCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiCtx mutex must never fail"),
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: Arc::get_mut(&mut self.io_ctx)
                .expect("IoCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("IoCtx mutex must never fail"),
        }
    }
}

impl WasiHttpView for Host {
    fn http(&mut self) -> WasiHttpCtxView<'_> {
        WasiHttpCtxView {
            ctx: Arc::get_mut(&mut self.wasi_http)
                .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiHttpCtx mutex must never fail"),
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            hooks: default_hooks(),
        }
    }
}

// ---------------------------------------------------------------------------------------------
// WASI Preview 3 (Component Model async) host support.
//
// Works on both stock wasmtime and the Golem wasmtime fork (`use-golem-wasmtime`): the fork
// supports Preview 3 just like upstream, and the only fork-specific difference (the extra `IoCtx`
// returned by `WasiCtxBuilder::build()` / required by `WasiCtxView`) is handled on the shared
// `Host` type above.
// ---------------------------------------------------------------------------------------------

/// Preview 3 engine: same stack/epoch configuration as the P2 host, plus Component Model async
/// support so that async-lifted exports can be driven by the concurrent executor that
/// `Func::call_async` uses internally.
fn p3_engine() -> anyhow::Result<Engine> {
    let mut config = wasmtime::Config::default();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.epoch_interruption(true);
    config.async_stack_size(32 * 1024 * 1024);
    config.max_wasm_stack(16 * 1024 * 1024);
    let engine = Engine::new(&config)?;

    let epoch_engine = engine.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(10));
            epoch_engine.increment_epoch();
        }
    });
    Ok(engine)
}

/// Preview 3 linker: the P2 WASI surface (P3 components still import residual `wasi:io`/0.2 std
/// interfaces), the P3 WASI surface, and the P3 async HTTP surface used by `fetch`.
fn p3_linker(engine: &Engine) -> anyhow::Result<Linker<Host>> {
    let mut linker: Linker<Host> = Linker::new(engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    Ok(linker)
}

impl wasmtime_wasi_http::p3::WasiHttpView for Host {
    fn http(&mut self) -> wasmtime_wasi_http::p3::WasiHttpCtxView<'_> {
        wasmtime_wasi_http::p3::WasiHttpCtxView {
            hooks: wasmtime_wasi_http::p3::default_hooks(),
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            ctx: Arc::get_mut(&mut self.wasi_http)
                .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiHttpCtx mutex must never fail"),
        }
    }
}

// Based on https://github.com/bytecodealliance/wac/blob/release-0.6.0/crates/wac-graph/src/plug.rs#L23
// but instead of returning NoPlugError, it logs skipped instantiations
fn plug(
    graph: &mut CompositionGraph,
    plugs: Vec<(String, PackageId)>,
    socket: PackageId,
) -> Result<(), PlugError> {
    let socket_instantiation = graph.instantiate(socket);

    let mut requested_plugs = BTreeSet::<String>::new();
    let mut plug_exports_to_plug = BTreeMap::<String, String>::new();

    for (plug_name, plug) in plugs {
        requested_plugs.insert(plug_name.clone());

        let mut plug_exports = Vec::new();
        let mut cache = Default::default();
        let mut checker = SubtypeChecker::new(&mut cache);
        for (name, plug_ty) in &graph.types()[graph[plug].ty()].exports {
            if let Some(socket_ty) = graph.types()[graph[socket].ty()].imports.get(name)
                && checker
                    .is_subtype(*plug_ty, graph.types(), *socket_ty, graph.types())
                    .is_ok()
            {
                plug_exports.push(name.clone());
            }
        }

        // Instantiate the plug component
        let mut plug_instantiation = None;
        for plug_export_name in plug_exports {
            plug_exports_to_plug.insert(plug_export_name.clone(), plug_name.clone());

            let plug_instantiation =
                *plug_instantiation.get_or_insert_with(|| graph.instantiate(plug));
            let export = graph
                .alias_instance_export(plug_instantiation, &plug_export_name)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
            graph
                .set_instantiation_argument(socket_instantiation, &plug_export_name, export)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
        }
    }

    // Export all exports from the socket component.
    for name in graph.types()[graph[socket].ty()]
        .exports
        .keys()
        .cloned()
        .collect::<Vec<_>>()
    {
        let export = graph
            .alias_instance_export(socket_instantiation, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;

        graph
            .export(export, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;
    }

    Ok(())
}

/// Classify a test filename into a module category based on its name prefix.
pub fn classify_test(filename: &str) -> &str {
    // Strip "test-" prefix
    let name = filename
        .strip_prefix("test-")
        .unwrap_or(filename)
        .strip_suffix(".js")
        .unwrap_or(filename);

    if name.starts_with("path") {
        "path"
    } else if name.starts_with("assert") {
        "assert"
    } else if name.starts_with("buffer") {
        "buffer"
    } else if name.starts_with("stream") {
        "stream"
    } else if name.starts_with("string-decoder") || name.starts_with("stringdecoder") {
        "string_decoder"
    } else if name.starts_with("url") {
        "url"
    } else if name.starts_with("util") {
        "util"
    } else if name.starts_with("querystring") {
        "querystring"
    } else if name.starts_with("events") || name.starts_with("event-emitter") {
        "events"
    } else if name.starts_with("fs") || name.starts_with("file") {
        "fs"
    } else if name.starts_with("crypto") {
        "crypto"
    } else if name.starts_with("http") || name.starts_with("http2") || name.starts_with("https") {
        "http"
    } else if name.starts_with("net") {
        "net"
    } else if name.starts_with("dns") {
        "dns"
    } else if name.starts_with("os") {
        "os"
    } else if name.starts_with("process") {
        "process"
    } else if name.starts_with("child-process") || name.starts_with("child_process") {
        "child_process"
    } else if name.starts_with("tls") || name.starts_with("ssl") {
        "tls"
    } else if name.starts_with("zlib") {
        "zlib"
    } else if name.starts_with("console") {
        "console"
    } else if name.starts_with("timers")
        || name.starts_with("settimeout")
        || name.starts_with("setinterval")
        || name.starts_with("setimmediate")
    {
        "timers"
    } else if name.starts_with("worker") || name.starts_with("worker-threads") {
        "worker_threads"
    } else if name.starts_with("cluster") {
        "cluster"
    } else if name.starts_with("readline") {
        "readline"
    } else if name.starts_with("repl") {
        "repl"
    } else if name.starts_with("vm") {
        "vm"
    } else if name.starts_with("dgram") {
        "dgram"
    } else if name.starts_with("tty") {
        "tty"
    } else if name.starts_with("async-hooks")
        || name.starts_with("async-context")
        || name.starts_with("async-local-storage")
    {
        "async_hooks"
    } else if name.starts_with("inspector") || name.starts_with("debugger") {
        "inspector"
    } else if name.starts_with("module")
        || name.starts_with("require")
        || name.starts_with("esm")
        || name.starts_with("cjs")
        || name.starts_with("loaders")
    {
        "module"
    } else if name.starts_with("perf") || name.starts_with("performance") {
        "perf_hooks"
    } else if name.starts_with("diagnostics") {
        "diagnostics_channel"
    } else if name.starts_with("domain") {
        "domain"
    } else if name.starts_with("v8") {
        "v8"
    } else if name.starts_with("trace") {
        "trace_events"
    } else if name.starts_with("runner") || name.starts_with("test-runner") {
        "test_runner"
    } else if name.starts_with("abortcontroller")
        || name.starts_with("abortsignal")
        || name.starts_with("aborted")
    {
        "abort"
    } else if name.starts_with("encoding")
        || name.starts_with("textdecoder")
        || name.starts_with("textencoder")
    {
        "encoding"
    } else if name.starts_with("blob") {
        "blob"
    } else if name.starts_with("fetch")
        || name.starts_with("response")
        || name.starts_with("request")
        || name.starts_with("headers")
    {
        "fetch"
    } else if name.starts_with("readable")
        || name.starts_with("writable")
        || name.starts_with("transform")
        || name.starts_with("duplex")
    {
        "stream"
    } else if name.starts_with("sqlite") {
        "sqlite"
    } else if name.starts_with("whatwg") {
        "whatwg"
    } else if name.starts_with("webcrypto") {
        "webcrypto"
    } else if name.starts_with("permission") {
        "permission"
    } else if name.starts_with("promise") || name.starts_with("promises") {
        "promises"
    } else if name.starts_with("global") {
        "global"
    } else if name.starts_with("compile") {
        "compile"
    } else if name.starts_with("cli") {
        "cli"
    } else if name.starts_with("stdin") || name.starts_with("stdout") || name.starts_with("stdio") {
        "stdio"
    } else if name.starts_with("signal") {
        "signal"
    } else if name.starts_with("errors") || name.starts_with("error") {
        "errors"
    } else if name.starts_with("pipe")
        || name.starts_with("socket")
        || name.starts_with("listen")
        || name.starts_with("tcp")
    {
        "net"
    } else if name.starts_with("webstream") || name.starts_with("webstreams") {
        "webstreams"
    } else if name.starts_with("snapshot") {
        "snapshot"
    } else if name.starts_with("eslint") {
        "eslint"
    } else if name.starts_with("internal") {
        "internal"
    } else if name.starts_with("heap") {
        "heap"
    } else if name.starts_with("node") {
        "node"
    } else if name.starts_with("inspect") {
        "inspector"
    } else if name.starts_with("shadow-realm") {
        "shadow_realm"
    } else if name.starts_with("btoa") || name.starts_with("atob") {
        "encoding"
    } else if name.starts_with("common") {
        "common"
    } else {
        "other"
    }
}

/// Check if a test file relies on Node.js internals (not public API).
///
/// Detects patterns like `// Flags: --expose-internals`, `require('internal/...')`,
/// and `internalBinding(...)` in the test source code.
pub fn uses_node_internals(test_path: &str) -> bool {
    let file_path = format!("tests/node_compat/suite/{test_path}");
    let content = match fs::read_to_string(&file_path) {
        Ok(c) => c,
        Err(_) => return false,
    };
    // Only check the first 50 lines for the Flags comment (it's always near the top)
    let header: String = content.lines().take(50).collect::<Vec<_>>().join("\n");
    if header.contains("--expose-internals") {
        return true;
    }
    // Check the full file for internal requires/bindings
    content.contains("require('internal/")
        || content.contains("require(\"internal/")
        || content.contains("internalBinding(")
}

pub mod js_subtest_parser;
pub mod test_server;

use crate::common::WasmSource::Precompiled;
use anyhow::anyhow;
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use futures::FutureExt;
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::{Read, Write};
use std::process::Command;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::{Duration, Instant, SystemTime};
use tokio::time::timeout;
use wac_graph::types::{Package, SubtypeChecker};
use wac_graph::{CompositionGraph, EncodeOptions, PackageId, PlugError};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
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

const TEST_FAST_ENV: &str = "WASM_RQUICKJS_TEST_FAST";
const TEST_ARTIFACT_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_ARTIFACT_CACHE";
const TEST_DROP_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_DROP_CACHE";
const TEST_PREPARED_COMPONENT_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE";
const TEST_UNOPTIMIZED_ENV: &str = "WASM_RQUICKJS_TEST_UNOPTIMIZED";
const TEST_WASMTIME_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_WASMTIME_CACHE";

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

fn truthy_env(name: &str) -> bool {
    std::env::var(name)
        .map(|value| {
            matches!(
                value.to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

fn test_cache_enabled(name: &str) -> bool {
    truthy_env(TEST_FAST_ENV) || truthy_env(name)
}

fn test_artifact_cache_enabled() -> bool {
    test_cache_enabled(TEST_ARTIFACT_CACHE_ENV)
}

fn test_drop_cache_enabled() -> bool {
    truthy_env(TEST_DROP_CACHE_ENV)
}

fn test_prepared_component_cache_enabled() -> bool {
    test_cache_enabled(TEST_PREPARED_COMPONENT_CACHE_ENV)
}

fn test_unoptimized_enabled() -> bool {
    truthy_env(TEST_UNOPTIMIZED_ENV)
}

fn test_wasmtime_cache_enabled() -> bool {
    test_cache_enabled(TEST_WASMTIME_CACHE_ENV) && !test_drop_cache_enabled()
}

fn test_cache_stamp_dir() -> Utf8PathBuf {
    Utf8Path::new("tmp").join("test-artifact-cache")
}

fn drop_test_artifact_cache_once() {
    static DROPPED: OnceLock<()> = OnceLock::new();
    DROPPED.get_or_init(|| {
        if test_drop_cache_enabled() {
            let _ = fs::remove_dir_all(test_cache_stamp_dir());
        }
    });
}

fn test_cache_stamp(
    name: &str,
    feature_combination: FeatureCombination,
    kind: &str,
) -> Utf8PathBuf {
    test_cache_stamp_dir().join(format!(
        "{}-{}-{kind}.stamp",
        name.to_snake_case(),
        feature_combination.label()
    ))
}

fn test_cache_lock(name: &str, feature_combination: FeatureCombination, kind: &str) -> Utf8PathBuf {
    test_cache_stamp_dir().join(format!(
        "{}-{}-{kind}.lock",
        name.to_snake_case(),
        feature_combination.label()
    ))
}

fn rustc_version_verbose() -> String {
    Command::new("rustc")
        .arg("-Vv")
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "rustc-version-unavailable".to_string())
}

fn cache_stamp_signature(
    name: &str,
    feature_combination: FeatureCombination,
    kind: &str,
    extra: &[(&str, String)],
) -> String {
    static RUSTC_VERSION_VERBOSE: OnceLock<String> = OnceLock::new();
    let rustc_version = RUSTC_VERSION_VERBOSE.get_or_init(rustc_version_verbose);
    let mut signature = format!(
        "wasm-rquickjs-test-cache-v2\nname={name}\nfeature={}\nkind={kind}\nrustc={rustc_version}\n",
        feature_combination.label(),
    );

    for env_name in [
        "CARGO",
        "CARGO_BUILD_TARGET",
        "CARGO_ENCODED_RUSTFLAGS",
        "CARGO_PROFILE_TEST_OPT_LEVEL",
        "CARGO_TARGET_DIR",
        "RUSTC",
        "RUSTFLAGS",
        "RUSTUP_TOOLCHAIN",
    ] {
        if let Ok(value) = std::env::var(env_name) {
            signature.push_str(env_name);
            signature.push('=');
            signature.push_str(&value);
            signature.push('\n');
        }
    }

    for (key, value) in extra {
        signature.push_str(key);
        signature.push('=');
        signature.push_str(value);
        signature.push('\n');
    }

    signature
}

fn modified_time(path: &Utf8Path) -> anyhow::Result<SystemTime> {
    Ok(fs::metadata(path)?.modified()?)
}

fn newest_modified_time(path: &Utf8Path) -> anyhow::Result<SystemTime> {
    let metadata = fs::metadata(path)?;
    let mut newest = metadata.modified()?;
    if metadata.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let entry_path = Utf8PathBuf::from_path_buf(entry.path())
                .map_err(|_| anyhow!("Non UTF-8 path under {path}"))?;
            newest = newest.max(newest_modified_time(&entry_path)?);
        }
    }
    Ok(newest)
}

fn newest_modified_time_of_existing(paths: &[Utf8PathBuf]) -> anyhow::Result<SystemTime> {
    let mut newest = SystemTime::UNIX_EPOCH;
    for path in paths {
        if path.exists() {
            newest = newest.max(newest_modified_time(path)?);
        }
    }
    Ok(newest)
}

fn output_fresh_for_inputs(
    output: &Utf8Path,
    stamp: &Utf8Path,
    inputs: &[Utf8PathBuf],
    signature: &str,
) -> bool {
    drop_test_artifact_cache_once();

    if !output.exists() || !stamp.exists() || test_drop_cache_enabled() {
        return false;
    }

    let Ok(stamp_contents) = fs::read_to_string(stamp) else {
        return false;
    };
    if stamp_contents != signature {
        return false;
    }

    let Ok(output_mtime) = modified_time(output) else {
        return false;
    };
    let Ok(stamp_mtime) = modified_time(stamp) else {
        return false;
    };
    let Ok(input_mtime) = newest_modified_time_of_existing(inputs) else {
        return false;
    };

    output_mtime >= input_mtime && stamp_mtime >= input_mtime
}

fn refresh_cache_stamp(stamp: &Utf8Path, signature: &str) -> anyhow::Result<()> {
    if let Some(parent) = stamp.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(stamp, signature)?;
    Ok(())
}

struct TestCacheLock {
    path: Utf8PathBuf,
}

impl TestCacheLock {
    fn acquire(path: Utf8PathBuf) -> anyhow::Result<Self> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let started = Instant::now();
        loop {
            match fs::create_dir(&path) {
                Ok(()) => return Ok(Self { path }),
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                    if fs::metadata(&path)
                        .and_then(|metadata| metadata.modified())
                        .ok()
                        .and_then(|modified| modified.elapsed().ok())
                        .is_some_and(|age| age > Duration::from_secs(10 * 60))
                    {
                        let _ = fs::remove_dir_all(&path);
                        continue;
                    }
                    if started.elapsed() > Duration::from_secs(120) {
                        anyhow::bail!("timed out waiting for test artifact cache lock {path}");
                    }
                    thread::sleep(Duration::from_millis(100));
                }
                Err(error) => return Err(error.into()),
            }
        }
    }
}

impl Drop for TestCacheLock {
    fn drop(&mut self) {
        let _ = fs::remove_dir(&self.path);
    }
}

fn configure_test_wasmtime_cache(config: &mut wasmtime::Config) -> anyhow::Result<()> {
    if test_wasmtime_cache_enabled() {
        config.cache(Some(wasmtime::Cache::new(wasmtime::CacheConfig::new())?));
    }
    Ok(())
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
    pub nested_node_test: bool,
    pub isolate_block_subtests: bool,
    pub timeout_secs: u64,
    pub flaky: bool,
    pub subtests: Vec<NodeCompatSubtestEntry>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NodeModulesAppCategory {
    Runnable,
    KnownGap,
    Deferred,
}

impl NodeModulesAppCategory {
    pub fn from_config_value(value: &str) -> anyhow::Result<Self> {
        match value {
            "runnable" => Ok(Self::Runnable),
            "known-gap" | "gap" => Ok(Self::KnownGap),
            "deferred" => Ok(Self::Deferred),
            other => anyhow::bail!("unknown node_modules_apps category '{other}'"),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Runnable => "runnable",
            Self::KnownGap => "known gap",
            Self::Deferred => "deferred",
        }
    }

    pub fn status_label(self) -> &'static str {
        match self {
            Self::Runnable => "Passing",
            Self::KnownGap => "Known gap",
            Self::Deferred => "Deferred",
        }
    }

    pub fn should_ignore_in_runner(self) -> bool {
        !matches!(self, Self::Runnable)
    }
}

#[derive(Debug, Clone)]
pub struct NodeModulesAppTestEntry {
    pub file: String,
    pub category: NodeModulesAppCategory,
    pub coverage: String,
    pub reason: Option<String>,
    pub timeout_secs: u64,
    pub flaky: bool,
}

#[derive(Debug, Clone)]
pub struct NodeModulesAppEntry {
    pub name: String,
    pub category: NodeModulesAppCategory,
    pub reason: Option<String>,
    pub tests: Vec<NodeModulesAppTestEntry>,
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
        let nested_node_test = opts
            .get("nestedNodeTest")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let isolate_block_subtests = opts
            .get("isolateBlockSubtests")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
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
            nested_node_test,
            isolate_block_subtests,
            timeout_secs,
            flaky,
            subtests,
        });
    }

    Ok(tests)
}

pub fn load_node_modules_apps_config(path: &str) -> anyhow::Result<Vec<NodeModulesAppEntry>> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let apps_obj = value
        .get("apps")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("node_modules_apps config missing 'apps' object"))?;

    let mut apps = Vec::new();
    for (app_name, opts) in apps_obj {
        let category = node_modules_app_category_from_value(opts, None)?;
        let reason = opts
            .get("reason")
            .and_then(|v| v.as_str())
            .map(str::to_string);
        let default_timeout_secs = opts
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS);
        let tests_obj = opts
            .get("tests")
            .and_then(|v| v.as_object())
            .ok_or_else(|| {
                anyhow::anyhow!("node_modules app '{app_name}' missing 'tests' object")
            })?;

        let mut tests = Vec::new();
        for (test_file, test_opts) in tests_obj {
            let test_category = node_modules_app_category_from_value(test_opts, Some(category))?;
            let (coverage, test_reason, timeout_secs, flaky) = match test_opts {
                serde_json::Value::String(coverage) => (
                    coverage.clone(),
                    reason.clone(),
                    default_timeout_secs,
                    false,
                ),
                serde_json::Value::Object(_) => {
                    let coverage = test_opts
                        .get("coverage")
                        .or_else(|| test_opts.get("description"))
                        .and_then(|v| v.as_str())
                        .ok_or_else(|| {
                            anyhow::anyhow!(
                                "node_modules app '{app_name}' test '{test_file}' missing coverage"
                            )
                        })?
                        .to_string();
                    let test_reason = test_opts
                        .get("reason")
                        .and_then(|v| v.as_str())
                        .map(str::to_string)
                        .or_else(|| reason.clone());
                    let timeout_secs = test_opts
                        .get("timeout")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(default_timeout_secs);
                    let flaky = test_opts
                        .get("flaky")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    (coverage, test_reason, timeout_secs, flaky)
                }
                _ => anyhow::bail!(
                    "node_modules app '{app_name}' test '{test_file}' must be a coverage string or object"
                ),
            };

            tests.push(NodeModulesAppTestEntry {
                file: test_file.clone(),
                category: test_category,
                coverage,
                reason: test_reason,
                timeout_secs,
                flaky,
            });
        }
        tests.sort_by(|a, b| a.file.cmp(&b.file));

        apps.push(NodeModulesAppEntry {
            name: app_name.clone(),
            category,
            reason,
            tests,
        });
    }
    apps.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(apps)
}

fn node_modules_app_category_from_value(
    value: &serde_json::Value,
    inherited: Option<NodeModulesAppCategory>,
) -> anyhow::Result<NodeModulesAppCategory> {
    if let Some(category) = value.get("category").and_then(|v| v.as_str()) {
        return NodeModulesAppCategory::from_config_value(category);
    }
    if value.get("skip").and_then(|v| v.as_bool()).unwrap_or(false) {
        return Ok(NodeModulesAppCategory::KnownGap);
    }
    Ok(inherited.unwrap_or(NodeModulesAppCategory::Runnable))
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

    // Some vendored ESM tests import sibling test files with relative specifiers.
    // The split runner still executes one configured test at a time, but those
    // relative imports need the original suite directory shape.
    let src_suite_dir = std::path::Path::new("tests/node_compat/suite").join(suite);
    if suite == "es-module" && src_suite_dir.exists() {
        for entry in fs::read_dir(&src_suite_dir)? {
            let entry = entry?;
            if entry.file_type()?.is_file() {
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy();
                let dst = suite_dir.join(file_name_str.as_ref());
                if !dst.exists() {
                    fs::copy(entry.path(), dst)?;
                }
            }
        }
    }

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

    // Copy vendored ESM common helpers that are not replaced by local shims.
    let vendored_common_dir = std::path::Path::new("tests/node_compat/suite/common");
    if vendored_common_dir.exists() {
        for entry in fs::read_dir(vendored_common_dir)? {
            let entry = entry?;
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            if entry.file_type()?.is_file()
                && file_name_str.ends_with(".mjs")
                && !common_dir.join(file_name_str.as_ref()).exists()
            {
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

    if test_rel_path == "sequential/test-module-loading.js" && vendored_fixtures_src.exists() {
        copy_dir_recursive(vendored_fixtures_src, fixtures_dst.as_std_path())?;
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
            FeatureCombination::None => vec!["--no-default-features"],
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
}

pub struct PreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
}

impl PreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.async_stack_size(32 * 1024 * 1024); // 32MB async stack (must be >= max_wasm_stack)
        config.max_wasm_stack(16 * 1024 * 1024); // 16MB WASM stack (default is 512KB, QuickJS in WASM needs more for deep recursion)
        configure_test_wasmtime_cache(&mut config)?;
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
        let mut config = wasmtime::Config::default();
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.async_stack_size(32 * 1024 * 1024);
        config.max_wasm_stack(16 * 1024 * 1024);
        configure_test_wasmtime_cache(&mut config)?;
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
        if test_prepared_component_cache_enabled() {
            let prepared = prepared_component_for_path(wasm_path)?;
            return Self::from_prepared(&prepared).await;
        }

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
        let (ctx, io_ctx) = ctx_builder.build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(Mutex::new(http_ctx)),
            started_at: Instant::now(),
            timeout: Duration::from_secs(120),
            log_messages: Arc::new(Mutex::new(Vec::new())),
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

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
struct PreparedComponentCacheKey {
    path: Utf8PathBuf,
    len: u64,
    modified: Duration,
    content_hash: u64,
}

fn prepared_component_cache_key(wasm_path: &Utf8Path) -> anyhow::Result<PreparedComponentCacheKey> {
    let metadata = fs::metadata(wasm_path)?;
    let path = fs::canonicalize(wasm_path)
        .ok()
        .and_then(|path| Utf8PathBuf::from_path_buf(path).ok())
        .unwrap_or_else(|| wasm_path.to_path_buf());
    let modified = metadata
        .modified()?
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    let mut file = fs::File::open(wasm_path)?;
    let mut buffer = [0; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        buffer[..read].hash(&mut hasher);
    }
    Ok(PreparedComponentCacheKey {
        path,
        len: metadata.len(),
        modified,
        content_hash: hasher.finish(),
    })
}

fn prepared_component_for_path(wasm_path: &Utf8Path) -> anyhow::Result<Arc<PreparedComponent>> {
    static PREPARED_COMPONENTS: OnceLock<
        Mutex<HashMap<PreparedComponentCacheKey, Arc<PreparedComponent>>>,
    > = OnceLock::new();

    let mut prepared = PREPARED_COMPONENTS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .unwrap();

    if test_drop_cache_enabled() {
        prepared.clear();
    }

    let key = prepared_component_cache_key(wasm_path)?;
    if let Some(component) = prepared.get(&key) {
        return Ok(component.clone());
    }

    let component = Arc::new(PreparedComponent::new(wasm_path)?);
    prepared.insert(key, component.clone());
    Ok(component)
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
        if test_unoptimized_enabled() {
            Ok(compiled)
        } else {
            compiled.optimize().await
        }
    }

    async fn compile_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        drop_test_artifact_cache_once();

        let name = path.file_name().unwrap();
        let wrapper_crate_root = Utf8Path::new("tmp")
            .join(name)
            .join(feature_combination.label());

        // shared_target is relative to wrapper_crate_root.
        // this is a _different_ shared target than the one used in the compilation tests to make
        // sure different feature combinations do not interfere with these tests.
        let shared_target = Utf8Path::new("..").join("..").join("rt-target");
        let wasm_file_name = format!("{}.wasm", name.to_snake_case());
        let compiled_wasm_path = if use_shared_target {
            Utf8Path::new("tmp")
                .join("rt-target")
                .join("wasm32-wasip2")
                .join("debug")
                .join(&wasm_file_name)
        } else {
            wrapper_crate_root
                .join("target")
                .join("wasm32-wasip2")
                .join("debug")
                .join(&wasm_file_name)
        };
        let compile_stamp = test_cache_stamp(name, feature_combination, "compile");
        let compile_inputs = vec![
            path.to_path_buf(),
            Utf8Path::new("crates").join("wasm-rquickjs").join("src"),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("skeleton"),
            Utf8Path::new("crates").join("wasi-logging").join("src"),
            Utf8Path::new("Cargo.toml").to_path_buf(),
            Utf8Path::new("Cargo.lock").to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("Cargo.toml"),
            Utf8Path::new("crates")
                .join("wasi-logging")
                .join("Cargo.toml"),
        ];
        let compile_signature = cache_stamp_signature(
            name,
            feature_combination,
            "compile",
            &[
                ("target", "wasm32-wasip2".to_string()),
                ("use_shared_target", use_shared_target.to_string()),
                ("cargo_args", feature_combination.cargo_args().join("|")),
            ],
        );

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &compiled_wasm_path,
                &compile_stamp,
                &compile_inputs,
                &compile_signature,
            )
        {
            println!("Reusing cached wrapper component {compiled_wasm_path}");
            return Ok(CompiledTest {
                wasm: Precompiled(compiled_wasm_path),
            });
        }

        let _cache_lock = if test_artifact_cache_enabled() {
            Some(TestCacheLock::acquire(test_cache_lock(
                name,
                feature_combination,
                "compile",
            ))?)
        } else {
            None
        };

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &compiled_wasm_path,
                &compile_stamp,
                &compile_inputs,
                &compile_signature,
            )
        {
            println!("Reusing cached wrapper component {compiled_wasm_path}");
            return Ok(CompiledTest {
                wasm: Precompiled(compiled_wasm_path),
            });
        }

        println!("Generating wrapper create for example '{name}' to {wrapper_crate_root}");
        generate_wrapper_crate(
            &path.join("wit"),
            &[JsModuleSpec {
                name: name.to_string(),
                mode: EmbeddingMode::EmbedFile(path.join("src").join(format!("{name}.js"))),
            }],
            &wrapper_crate_root,
            None,
        )?;

        println!("Compiling wrapper crate in {wrapper_crate_root}");
        let mut command = Command::new("cargo");
        command.arg("build").arg("--target").arg("wasm32-wasip2");
        if use_shared_target {
            command.arg("--target-dir");
            command.arg(shared_target);
        }
        command
            .args(feature_combination.cargo_args())
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

        if test_artifact_cache_enabled() {
            refresh_cache_stamp(&compile_stamp, &compile_signature)?;
        }

        Ok(CompiledTest {
            wasm: Precompiled(compiled_wasm_path),
        })
    }

    /// Run Wizer pre-initialization on the compiled component.
    /// Returns a new `CompiledTest` pointing to the optimized wasm file.
    pub async fn optimize(&self) -> anyhow::Result<CompiledTest> {
        drop_test_artifact_cache_once();

        let input = self.wasm_path();
        let optimized = input.with_extension("optimized.wasm");
        let optimize_stamp = input.with_extension("optimized.stamp");
        let optimize_inputs = vec![
            input.to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("src")
                .join("optimize.rs"),
            Utf8Path::new("Cargo.toml").to_path_buf(),
            Utf8Path::new("Cargo.lock").to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("Cargo.toml"),
        ];
        let optimize_signature = cache_stamp_signature(
            input.file_stem().unwrap_or("component"),
            FeatureCombination::Normal,
            "optimize",
            &[
                ("input", input.to_string()),
                ("init_func", "wizer-initialize".to_string()),
                ("optimizer", "wasm_rquickjs::optimize_component".to_string()),
            ],
        );
        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &optimized,
                &optimize_stamp,
                &optimize_inputs,
                &optimize_signature,
            )
        {
            println!("Reusing cached optimized component {optimized}");
            return Ok(CompiledTest {
                wasm: Precompiled(optimized),
            });
        }

        let _cache_lock = if test_artifact_cache_enabled() {
            let lock_name = input.file_stem().unwrap_or("component");
            Some(TestCacheLock::acquire(test_cache_lock(
                lock_name,
                FeatureCombination::Normal,
                "optimize",
            ))?)
        } else {
            None
        };

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &optimized,
                &optimize_stamp,
                &optimize_inputs,
                &optimize_signature,
            )
        {
            println!("Reusing cached optimized component {optimized}");
            return Ok(CompiledTest {
                wasm: Precompiled(optimized),
            });
        }

        println!("Optimizing component {input} -> {optimized}");
        wasm_rquickjs::optimize_component(input, &optimized, "wizer-initialize").await?;
        if test_artifact_cache_enabled() {
            refresh_cache_stamp(&optimize_stamp, &optimize_signature)?;
        }
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

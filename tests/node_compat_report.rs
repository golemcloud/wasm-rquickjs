//! Node.js compatibility report generator.
//!
//! Runs ALL vendored Node.js test files from tests/node_compat/suite/parallel/
//! through the node-compat-runner WASM component and generates a compatibility report.
//!
//! Usage:
//!   cargo test --test node_compat_report -- --nocapture 2>&1 | tee node_compat_report.txt
//!
//! The report is also written to tests/node_compat/report.md

test_r::enable!();

#[allow(dead_code)]
mod common;

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use common::js_subtest_parser::{
    SubtestDiscovery, discover_subtests, rewrite_for_block, rewrite_for_node_test,
};
use common::{setup_node_compat_test_files, strip_jsonc_comments};
use futures::FutureExt;
use futures::stream::{FuturesUnordered, StreamExt};
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use test_r::test;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
use wasmtime::component::{Component, Linker, ResourceTable, Val};
use wasmtime::{Engine, Store, UpdateDeadline};
use wasmtime_wasi::cli::OutputFile;
use wasmtime_wasi::p2::bindings;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtx, WasiCtxView, WasiView};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};

// --- Host type (same as common/mod.rs) ---

#[derive(Clone)]
struct Host {
    pub table: Arc<Mutex<ResourceTable>>,
    pub wasi: Arc<Mutex<WasiCtx>>,
    pub wasi_http: Arc<WasiHttpCtx>,
    pub started_at: Instant,
    pub timeout: Duration,
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
        }
    }
}

impl WasiHttpView for Host {
    fn ctx(&mut self) -> &mut WasiHttpCtx {
        Arc::get_mut(&mut self.wasi_http)
            .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
    }

    fn table(&mut self) -> &mut ResourceTable {
        Arc::get_mut(&mut self.table)
            .expect("ResourceTable is shared and cannot be borrowed mutably")
            .get_mut()
            .expect("ResourceTable mutex must never fail")
    }
}

// --- Shared runner: Engine + Component + Linker created once ---

struct SharedRunner {
    engine: Engine,
    component: Component,
    linker: Linker<Host>,
}

impl SharedRunner {
    fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let mut config = wasmtime::Config::default();
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.cache(Some(wasmtime::Cache::from_file(None)?));
        let engine = Engine::new(&config)?;

        // Start a background thread that increments the epoch every 10ms
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
        wasmtime_wasi_http::add_only_http_to_linker_async(&mut linker)?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            component,
            linker,
        })
    }

    async fn run_test(&self, test_rel_path: &str) -> anyhow::Result<TestResult> {
        let stdout_file = NamedUtf8TempFile::new()?;
        let stderr_file = NamedUtf8TempFile::new()?;
        let temp_dir = Utf8TempDir::new()?;

        // Setup test files in temp dir
        setup_node_compat_test_files(temp_dir.path(), test_rel_path)?;

        // Create store with fresh WASI context
        let ctx = WasiCtx::builder()
            .stdout(OutputFile::new(stdout_file.reopen()?))
            .stderr(OutputFile::new(stderr_file.reopen()?))
            .arg("test")
            .env("TEST_KEY", "TEST_VALUE")
            .preopened_dir(&temp_dir, "/", DirPerms::all(), FilePerms::all())?
            .inherit_network()
            .allow_ip_name_lookup(true)
            .build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(http_ctx),
            started_at: Instant::now(),
            timeout: Duration::from_secs(30),
        };

        let mut store = Store::new(&self.engine, host);
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
        let instance = self
            .linker
            .instantiate_async(&mut store, &self.component)
            .await?;

        let guest_path = format!("/home/node/test/{}", test_rel_path);

        let func = instance
            .get_func(&mut store, "run-test")
            .ok_or_else(|| anyhow::anyhow!("Function run-test not found"))?;

        let args = [Val::String(guest_path)];
        let mut results = vec![Val::Bool(false)];

        let invoke_result = match func.call_async(&mut store, &args, &mut results).await {
            Ok(()) => Ok(()),
            Err(e) => {
                let msg = format!("{e:#}");
                if msg.contains("epoch") || msg.contains("interrupt") {
                    Err(anyhow::anyhow!("Timeout (epoch deadline exceeded)"))
                } else {
                    Err(anyhow::anyhow!(e))
                }
            }
        };

        let _stdout = fs::read_to_string(&stdout_file).unwrap_or_default();
        let _stderr = fs::read_to_string(&stderr_file).unwrap_or_default();

        match invoke_result {
            Ok(()) => match &results[0] {
                Val::String(s) => {
                    if s.starts_with("PASS") {
                        Ok(TestResult::Pass)
                    } else if let Some(reason) = s.strip_prefix("SKIP:") {
                        Ok(TestResult::Skip(reason.trim().to_string()))
                    } else if let Some(msg) = s.strip_prefix("FAIL:") {
                        Ok(TestResult::Fail(msg.trim().to_string()))
                    } else {
                        Ok(TestResult::Fail(s.clone()))
                    }
                }
                other => Ok(TestResult::Fail(format!("Unexpected return: {other:?}"))),
            },
            Err(e) => Ok(TestResult::Error(format!("{e:#}"))),
        }
    }

    async fn run_subtest(
        &self,
        test_rel_path: &str,
        source: &str,
        discovery: &SubtestDiscovery,
        subtest_index: usize,
    ) -> anyhow::Result<TestResult> {
        let stdout_file = NamedUtf8TempFile::new()?;
        let stderr_file = NamedUtf8TempFile::new()?;
        let temp_dir = Utf8TempDir::new()?;

        // Setup test files in temp dir
        setup_node_compat_test_files(temp_dir.path(), test_rel_path)?;

        // Rewrite the test file to isolate the target subtest
        let rewritten = match discovery {
            SubtestDiscovery::Block(blocks) => rewrite_for_block(source, blocks, subtest_index),
            SubtestDiscovery::NodeTest(_) => rewrite_for_node_test(source, subtest_index),
            SubtestDiscovery::None => source.to_string(),
        };

        // Write the rewritten file
        let test_filename = test_rel_path.rsplit('/').next().unwrap_or(test_rel_path);
        let suite = test_rel_path.split('/').next().unwrap_or("parallel");
        let rewritten_path = temp_dir
            .path()
            .join("home")
            .join("node")
            .join("test")
            .join(suite)
            .join(test_filename);
        fs::write(&rewritten_path, &rewritten)?;

        // Create store with fresh WASI context
        let ctx = WasiCtx::builder()
            .stdout(OutputFile::new(stdout_file.reopen()?))
            .stderr(OutputFile::new(stderr_file.reopen()?))
            .arg("test")
            .env("TEST_KEY", "TEST_VALUE")
            .preopened_dir(&temp_dir, "/", DirPerms::all(), FilePerms::all())?
            .inherit_network()
            .allow_ip_name_lookup(true)
            .build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(http_ctx),
            started_at: Instant::now(),
            timeout: Duration::from_secs(30),
        };

        let mut store = Store::new(&self.engine, host);
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
        let instance = self
            .linker
            .instantiate_async(&mut store, &self.component)
            .await?;

        let guest_path = format!("/home/node/test/{}", test_rel_path);
        let func = instance
            .get_func(&mut store, "run-test")
            .ok_or_else(|| anyhow::anyhow!("Function run-test not found"))?;

        let args = [Val::String(guest_path)];
        let mut results = vec![Val::Bool(false)];

        let invoke_result = match func.call_async(&mut store, &args, &mut results).await {
            Ok(()) => Ok(()),
            Err(e) => {
                let msg = format!("{e:#}");
                if msg.contains("epoch") || msg.contains("interrupt") {
                    Err(anyhow::anyhow!("Timeout (epoch deadline exceeded)"))
                } else {
                    Err(anyhow::anyhow!(e))
                }
            }
        };

        match invoke_result {
            Ok(()) => match &results[0] {
                Val::String(s) => {
                    if s.starts_with("PASS") {
                        Ok(TestResult::Pass)
                    } else if let Some(reason) = s.strip_prefix("SKIP:") {
                        Ok(TestResult::Skip(reason.trim().to_string()))
                    } else if let Some(msg) = s.strip_prefix("FAIL:") {
                        Ok(TestResult::Fail(msg.trim().to_string()))
                    } else {
                        Ok(TestResult::Fail(s.clone()))
                    }
                }
                other => Ok(TestResult::Fail(format!("Unexpected return: {other:?}"))),
            },
            Err(e) => Ok(TestResult::Error(format!("{e:#}"))),
        }
    }
}

#[derive(Debug, Clone)]
enum TestResult {
    Pass,
    Skip(String),
    Fail(String),
    Error(String),
}

// Drop unused items
#[allow(dead_code)]
impl TestResult {
    fn category(&self) -> &str {
        match self {
            TestResult::Pass => "PASS",
            TestResult::Skip(_) => "SKIP",
            TestResult::Fail(_) => "FAIL",
            TestResult::Error(_) => "ERROR",
        }
    }

    fn error_message(&self) -> Option<&str> {
        match self {
            TestResult::Fail(msg) | TestResult::Error(msg) | TestResult::Skip(msg) => Some(msg),
            TestResult::Pass => None,
        }
    }
}

#[derive(Debug, Clone)]
struct SkippedObservation {
    config_reason: String,
    actual: TestResult,
    inferred_impossible: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ReportBucket {
    Pass,
    Skip,
    Impossible,
    Fail,
    Error,
}

fn is_unevaluated_reason(reason: &str) -> bool {
    let r = reason.trim();
    r == "newly discovered, not yet evaluated" || r.starts_with("inherited: newly discovered")
}

/// Check if an error message indicates a fundamentally impossible test for the WASM runtime.
/// Returns a short classification reason if so.
fn infer_impossible_reason(error_msg: &str) -> Option<&'static str> {
    let lower = error_msg.to_lowercase();
    let first_line = lower.lines().next().unwrap_or(&lower);

    if first_line.contains("tls is not supported") || first_line.contains("tls is not available") {
        return Some("tls not available in WASM");
    }
    if first_line.contains("https.createserver is not supported") {
        return Some("https server not available in WASM");
    }
    if first_line.contains("http2 is not supported") {
        return Some("http2 not available in WASM");
    }
    if first_line.contains("worker_threads is not supported") {
        return Some("worker_threads not available in WASM");
    }
    if first_line.contains("cluster is not supported") {
        return Some("cluster not available in WASM");
    }
    if first_line.contains("repl is not supported") {
        return Some("REPL not available in WASM");
    }
    if first_line.contains("inspector") && first_line.contains("not") {
        return Some("inspector not available in WASM");
    }
    None
}

fn report_bucket(
    path: &str,
    actual: &TestResult,
    skipped_observations: &BTreeMap<String, SkippedObservation>,
    config_impossible: &BTreeMap<String, String>,
) -> ReportBucket {
    if config_impossible.contains_key(path) {
        return ReportBucket::Impossible;
    }
    if let Some(obs) = skipped_observations.get(path) {
        if obs.inferred_impossible.is_some() {
            return ReportBucket::Impossible;
        }
        if matches!(obs.actual, TestResult::Pass) {
            return ReportBucket::Pass;
        }
        return ReportBucket::Skip;
    }
    match actual {
        TestResult::Pass => ReportBucket::Pass,
        TestResult::Skip(_) => ReportBucket::Skip,
        TestResult::Fail(_) => ReportBucket::Fail,
        TestResult::Error(_) => ReportBucket::Error,
    }
}

/// Normalize an error message for grouping: take first meaningful line, strip dynamic content.
fn normalize_error_for_grouping(msg: &str) -> String {
    let first_line = msg.lines().next().unwrap_or(msg).trim();
    // Strip stack frames starting with "     at "
    let cleaned = if let Some(pos) = first_line.find("     at ") {
        first_line[..pos].trim()
    } else {
        first_line
    };
    // Strip absolute paths (e.g. /home/node/test/..., /tmp/...)
    let mut result = String::with_capacity(cleaned.len());
    let mut chars = cleaned.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '/' && chars.peek().is_some_and(|&nc| nc == 'h' || nc == 't') {
            let rest: String =
                std::iter::once(c)
                    .chain(chars.by_ref().take_while(|&ch| {
                        !ch.is_whitespace() && ch != ')' && ch != '\'' && ch != '"'
                    }))
                    .collect();
            if rest.starts_with("/home/node") || rest.starts_with("/tmp") {
                result.push_str("<path>");
            } else {
                result.push_str(&rest);
            }
        } else {
            result.push(c);
        }
    }
    let cleaned = result.trim().to_string();
    // Truncate to reasonable length
    if cleaned.len() > 120 {
        format!("{}...", &cleaned[..120])
    } else {
        cleaned
    }
}

/// Find the byte span (start, end) of a JSON object value for a given key in JSONC text.
/// Returns the byte range of the value object `{...}` (inclusive of braces).
fn find_value_span_in_jsonc(content: &str, key: &str) -> Option<(usize, usize)> {
    let search = format!("\"{}\"", key);
    let key_pos = content.find(&search)?;
    let bytes = content.as_bytes();
    let mut pos = key_pos + search.len();

    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b':' {
        return None;
    }
    pos += 1;
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b'{' {
        return None;
    }

    let value_start = pos;
    let mut depth = 0;
    let mut in_string = false;

    while pos < bytes.len() {
        if in_string {
            if bytes[pos] == b'\\' && pos + 1 < bytes.len() {
                pos += 2;
                continue;
            }
            if bytes[pos] == b'"' {
                in_string = false;
            }
        } else {
            match bytes[pos] {
                b'"' => in_string = true,
                b'{' => depth += 1,
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some((value_start, pos + 1));
                    }
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'/' => {
                    pos += 2;
                    while pos < bytes.len() && bytes[pos] != b'\n' {
                        pos += 1;
                    }
                    continue;
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'*' => {
                    pos += 2;
                    while pos + 1 < bytes.len() && !(bytes[pos] == b'*' && bytes[pos + 1] == b'/') {
                        pos += 1;
                    }
                    if pos + 1 < bytes.len() {
                        pos += 2;
                    }
                    continue;
                }
                _ => {}
            }
        }
        pos += 1;
    }

    None
}

/// Find the byte position of the closing '}' of the "tests" object in JSONC content.
fn find_tests_object_close(content: &str) -> Option<usize> {
    let tests_key = "\"tests\"";
    let key_pos = content.find(tests_key)?;
    let bytes = content.as_bytes();
    let mut pos = key_pos + tests_key.len();

    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b':' {
        return None;
    }
    pos += 1;
    while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
        pos += 1;
    }
    if pos >= bytes.len() || bytes[pos] != b'{' {
        return None;
    }

    let mut depth = 0;
    let mut in_string = false;

    while pos < bytes.len() {
        if in_string {
            if bytes[pos] == b'\\' && pos + 1 < bytes.len() {
                pos += 2;
                continue;
            }
            if bytes[pos] == b'"' {
                in_string = false;
            }
        } else {
            match bytes[pos] {
                b'"' => in_string = true,
                b'{' => depth += 1,
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some(pos);
                    }
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'/' => {
                    pos += 2;
                    while pos < bytes.len() && bytes[pos] != b'\n' {
                        pos += 1;
                    }
                    continue;
                }
                b'/' if pos + 1 < bytes.len() && bytes[pos + 1] == b'*' => {
                    pos += 2;
                    while pos + 1 < bytes.len() && !(bytes[pos] == b'*' && bytes[pos + 1] == b'/') {
                        pos += 1;
                    }
                    if pos + 1 < bytes.len() {
                        pos += 2;
                    }
                    continue;
                }
                _ => {}
            }
        }
        pos += 1;
    }

    None
}

/// Update config.jsonc to auto-enable passing tests and add missing passing tests.
fn update_config_jsonc(should_not_be_skipped: &[String], missing_from_config: &[String]) {
    let config_path = "tests/node_compat/config.jsonc";
    let Ok(mut content) = fs::read_to_string(config_path) else {
        eprintln!("WARNING: Could not read config.jsonc for auto-update");
        return;
    };

    let mut unskip_count = 0;
    let mut add_count = 0;

    // Phase 1: Unskip tests that pass — replace their value with {}
    // Process in reverse order of position to preserve byte offsets
    let mut updates: Vec<(usize, usize, String)> = Vec::new();

    for path in should_not_be_skipped {
        // Handle subtests (path contains #)
        if let Some((base_path, subtest_name)) = path.split_once('#') {
            // Find the parent entry's value span, then find the subtest within it
            if let Some((parent_start, parent_end)) = find_value_span_in_jsonc(&content, base_path)
            {
                let parent_content = &content[parent_start..parent_end];
                if let Some((sub_start, sub_end)) =
                    find_value_span_in_jsonc(parent_content, subtest_name)
                {
                    let abs_start = parent_start + sub_start;
                    let abs_end = parent_start + sub_end;
                    updates.push((abs_start, abs_end, "{}".to_string()));
                    unskip_count += 1;
                }
            }
        } else if let Some((start, end)) = find_value_span_in_jsonc(&content, path) {
            updates.push((start, end, "{}".to_string()));
            unskip_count += 1;
        }
    }

    // Apply updates in reverse order to preserve byte offsets
    updates.sort_by(|a, b| b.0.cmp(&a.0));
    for (start, end, new_value) in updates {
        content.replace_range(start..end, &new_value);
    }

    // Phase 2: Add missing passing tests before the closing '}' of the tests object
    if !missing_from_config.is_empty()
        && let Some(close_pos) = find_tests_object_close(&content)
    {
        let prefix = &content[..close_pos];
        let suffix = &content[close_pos..];

        let trimmed_prefix = prefix.trim_end();
        let needs_comma = !trimmed_prefix.ends_with(',') && !trimmed_prefix.ends_with('{');

        let mut new_section = String::new();
        if needs_comma {
            new_section.push(',');
        }

        for test_path in missing_from_config {
            new_section.push_str(&format!("\n    \"{}\": {{}},", test_path));
            add_count += 1;
        }

        // Remove trailing comma
        if new_section.ends_with(',') {
            new_section.pop();
        }
        new_section.push_str("\n  ");

        content = format!("{}{}{}", trimmed_prefix, new_section, suffix);
    }

    if unskip_count > 0 || add_count > 0 {
        if let Err(e) = fs::write(config_path, &content) {
            eprintln!("WARNING: Could not write config.jsonc: {e}");
        } else {
            println!(
                "\n✅ Auto-updated config.jsonc: {} test(s) unskipped, {} test(s) added",
                unskip_count, add_count
            );
        }
    }
}

fn compile_runner() -> anyhow::Result<Utf8PathBuf> {
    let path = Utf8Path::new("examples/runtime/node-compat-runner");
    let name = "node-compat-runner";
    let feature_combination_label = "full-no-logging";
    let wrapper_crate_root = Utf8Path::new("tmp")
        .join(name)
        .join(feature_combination_label);
    let shared_target = Utf8Path::new("..").join("..").join("rt-target");

    let wasm_path = Utf8Path::new("tmp")
        .join("rt-target")
        .join("wasm32-wasip1")
        .join("debug")
        .join(format!("{}.wasm", name.to_snake_case()));

    // If already compiled, skip
    if wasm_path.exists() {
        println!("Runner WASM already exists at {wasm_path}");
        return Ok(wasm_path);
    }

    println!("Generating wrapper crate for '{name}' to {wrapper_crate_root}");
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
    let status = Command::new("cargo-component")
        .arg("build")
        .arg("--target-dir")
        .arg(&shared_target)
        .args(["--no-default-features", "--features", "full-no-logging"])
        .current_dir(&wrapper_crate_root)
        .status()?;

    if !status.success() {
        anyhow::bail!("Failed to compile runner");
    }

    Ok(wasm_path)
}

/// Classify a test filename into a module category based on its name prefix.
fn classify_test(filename: &str) -> &str {
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
fn uses_node_internals(test_path: &str) -> bool {
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

#[test]
async fn generate_node_compat_report() -> anyhow::Result<()> {
    let total_start = Instant::now();

    // Step 1: Compile/locate the runner
    println!("=== Compiling node-compat-runner ===");
    let wasm_path = compile_runner()?;
    println!("Runner WASM: {wasm_path}");

    // Step 2: Create shared runner
    println!("=== Loading shared runner ===");
    let runner = SharedRunner::new(&wasm_path)?;
    println!("Engine and component loaded.");

    // Start a background thread that increments the epoch every second.
    // This allows epoch-based interruption to enforce timeouts on spinning WASM.
    let epoch_engine = runner.engine.clone();
    let _epoch_handle = std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));
            epoch_engine.increment_epoch();
        }
    });

    // Step 3: Collect all .js test files from all suites
    let suites = ["parallel", "sequential", "es-module"];
    let mut test_files: Vec<String> = Vec::new();
    for suite in &suites {
        let suite_dir = format!("tests/node_compat/suite/{suite}");
        let suite_path = std::path::Path::new(&suite_dir);
        if !suite_path.exists() {
            println!("Suite directory {suite_dir} not found, skipping");
            continue;
        }
        for entry in fs::read_dir(&suite_dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".js") {
                test_files.push(format!("{suite}/{name}"));
            }
        }
    }
    test_files.sort();

    // Pre-scan all test files to classify internals vs public API
    let internals_tests: BTreeSet<String> = test_files
        .iter()
        .filter(|p| uses_node_internals(p))
        .cloned()
        .collect();

    let total_tests = test_files.len();
    let total_internals = internals_tests.len();
    let total_public = total_tests - total_internals;
    println!(
        "=== Running {total_tests} tests ({total_public} public API, {total_internals} internals) ===\n"
    );

    // Load config.jsonc to find tests explicitly skipped or impossible
    let config_content_for_flags =
        fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
    let config_json_str_for_flags = strip_jsonc_comments(&config_content_for_flags);
    let config_tests_obj: Option<serde_json::Map<String, serde_json::Value>> =
        serde_json::from_str::<serde_json::Value>(&config_json_str_for_flags)
            .ok()
            .and_then(|v| v.get("tests")?.as_object().cloned());

    let config_skipped: BTreeMap<String, String> = config_tests_obj
        .as_ref()
        .map(|obj| {
            obj.iter()
                .filter_map(|(key, entry)| {
                    let skip = entry.get("skip").and_then(|v| v.as_bool()).unwrap_or(false);
                    if skip {
                        let reason = entry
                            .get("reason")
                            .and_then(|r| r.as_str())
                            .unwrap_or("skipped in config.jsonc")
                            .to_string();
                        Some((key.clone(), reason))
                    } else {
                        None
                    }
                })
                .collect()
        })
        .unwrap_or_default();

    let config_impossible: BTreeMap<String, String> = config_tests_obj
        .as_ref()
        .map(|obj| {
            obj.iter()
                .filter_map(|(key, entry)| {
                    let impossible = entry
                        .get("impossible")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    if impossible {
                        let reason = entry
                            .get("reason")
                            .and_then(|r| r.as_str())
                            .unwrap_or("impossible in config.jsonc")
                            .to_string();
                        Some((key.clone(), reason))
                    } else {
                        None
                    }
                })
                .collect()
        })
        .unwrap_or_default();

    // Load full config to detect split entries
    let config_split_entries: BTreeMap<String, Vec<String>> = {
        let config_content =
            fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
        let config_json_str = strip_jsonc_comments(&config_content);
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&config_json_str) {
            val.get("tests")
                .and_then(|v| v.as_object())
                .map(|obj| {
                    obj.iter()
                        .filter_map(|(key, entry)| {
                            let is_split = entry.get("split")?.as_bool()?;
                            if is_split {
                                let subtests = entry.get("subtests")?.as_object()?;
                                let names: Vec<String> = subtests.keys().cloned().collect();
                                Some((key.clone(), names))
                            } else {
                                None
                            }
                        })
                        .collect()
                })
                .unwrap_or_default()
        } else {
            BTreeMap::new()
        }
    };

    // Also include config-skipped/impossible tests that weren't found in the suite directory scan
    // (e.g. .mjs files) so they still appear in the report
    for path in config_skipped.keys().chain(config_impossible.keys()) {
        if !test_files.contains(path) {
            let suite_file = format!("tests/node_compat/suite/{path}");
            if std::path::Path::new(&suite_file).exists() {
                test_files.push(path.clone());
            }
        }
    }
    test_files.sort();

    // Step 4: Run all tests in parallel
    let mut results: BTreeMap<String, TestResult> = BTreeMap::new();
    let mut should_not_be_skipped: Vec<String> = Vec::new();
    let mut skipped_observations: BTreeMap<String, SkippedObservation> = BTreeMap::new();

    // First pass: handle impossible tests without execution
    for test_path in &test_files {
        if let Some(reason) = config_impossible.get(test_path) {
            let is_internal = internals_tests.contains(test_path);
            let filename = test_path.rsplit('/').next().unwrap_or(test_path);
            let tag = if is_internal { " [internal]" } else { "" };
            println!("IMPOSSIBLE {filename}{tag} ({reason})");
            results.insert(
                test_path.clone(),
                TestResult::Skip(format!("impossible: {reason}")),
            );
        }
    }

    // Collect tests that need execution
    let tests_to_run: Vec<String> = test_files
        .iter()
        .filter(|p| !config_impossible.contains_key(p.as_str()))
        .cloned()
        .collect();

    let parallelism = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);
    println!(
        "\n=== Running {} tests ({} impossible, skipped), concurrency={} ===\n",
        tests_to_run.len(),
        test_files.len() - tests_to_run.len(),
        parallelism
    );

    // Run whole-file tests in parallel, limited to the number of CPU cores
    let runner = Arc::new(runner);
    let progress = Arc::new(AtomicUsize::new(0));
    let total_to_run = tests_to_run.len();
    let semaphore = Arc::new(tokio::sync::Semaphore::new(parallelism));

    let mut futures = FuturesUnordered::new();
    for test_path in tests_to_run.clone() {
        let runner = runner.clone();
        let progress = progress.clone();
        let semaphore = semaphore.clone();
        let skip_reason = config_skipped.get(&test_path).cloned();
        futures.push(tokio::spawn(async move {
            let _permit = semaphore.acquire().await.expect("semaphore closed");
            let test_start = Instant::now();
            let r = match tokio::time::timeout(Duration::from_secs(60), runner.run_test(&test_path))
                .await
            {
                Ok(Ok(r)) => r,
                Ok(Err(e)) => TestResult::Error(format!("{e:#}")),
                Err(_) => TestResult::Error("Timeout (tokio 60s deadline exceeded)".to_string()),
            };
            let elapsed = test_start.elapsed();
            let p = progress.fetch_add(1, Ordering::Relaxed) + 1;
            (test_path, r, elapsed, skip_reason, p)
        }));
    }

    while let Some(join_result) = futures.next().await {
        let (test_path, r, elapsed, skip_reason, p) = join_result.expect("test task panicked");
        let filename = test_path.rsplit('/').next().unwrap_or(&test_path);
        let is_internal = internals_tests.contains(&test_path);
        let tag = if is_internal { " [internal]" } else { "" };

        let result = if let Some(reason) = skip_reason {
            match &r {
                TestResult::Pass => {
                    println!(
                        "[{:>4}/{total_to_run}] PASS* {filename}{tag} ({:.1}s) [was skipped: {reason}]",
                        p,
                        elapsed.as_secs_f64()
                    );
                    should_not_be_skipped.push(test_path.clone());
                    skipped_observations.insert(
                        test_path.clone(),
                        SkippedObservation {
                            config_reason: reason,
                            actual: r.clone(),
                            inferred_impossible: None,
                        },
                    );
                    TestResult::Pass
                }
                _ => {
                    let inferred = if is_unevaluated_reason(&reason) {
                        let msg = match &r {
                            TestResult::Fail(m) | TestResult::Error(m) | TestResult::Skip(m) => {
                                m.as_str()
                            }
                            TestResult::Pass => "",
                        };
                        infer_impossible_reason(msg).map(|s| s.to_string())
                    } else {
                        None
                    };

                    if let Some(ref imp_reason) = inferred {
                        println!(
                            "[{:>4}/{total_to_run}] IMPOSSIBLE* {filename}{tag} (auto: {imp_reason})",
                            p
                        );
                    } else {
                        println!("[{:>4}/{total_to_run}] SKIP  {filename}{tag} ({reason})", p);
                    }

                    skipped_observations.insert(
                        test_path.clone(),
                        SkippedObservation {
                            config_reason: reason.clone(),
                            actual: r.clone(),
                            inferred_impossible: inferred,
                        },
                    );
                    TestResult::Skip(reason)
                }
            }
        } else {
            match &r {
                TestResult::Pass => {
                    println!(
                        "[{:>4}/{total_to_run}] PASS  {filename}{tag} ({:.1}s)",
                        p,
                        elapsed.as_secs_f64()
                    );
                }
                TestResult::Skip(reason) => {
                    println!("[{:>4}/{total_to_run}] SKIP  {filename}{tag} ({reason})", p);
                }
                TestResult::Fail(msg) => {
                    let short_msg = if msg.len() > 120 {
                        format!("{}...", truncate_str(msg, 120))
                    } else {
                        msg.clone()
                    };
                    println!(
                        "[{:>4}/{total_to_run}] FAIL  {filename}{tag}: {short_msg}",
                        p
                    );
                }
                TestResult::Error(msg) => {
                    let short_msg = if msg.len() > 120 {
                        format!("{}...", truncate_str(msg, 120))
                    } else {
                        msg.clone()
                    };
                    println!(
                        "[{:>4}/{total_to_run}] ERROR {filename}{tag}: {short_msg}",
                        p
                    );
                }
            }
            r
        };

        results.insert(test_path, result);
    }

    // Run subtests in parallel for split files
    println!("\n=== Running subtests for split files ===\n");
    let subtest_progress = Arc::new(AtomicUsize::new(0));
    let mut subtest_futures = FuturesUnordered::new();

    // Prepare all subtest tasks
    let mut total_subtests = 0usize;
    for test_path in &test_files {
        // Don't run subtests for impossible tests — they were never executed
        if config_impossible.contains_key(test_path) {
            continue;
        }
        if config_split_entries.contains_key(test_path) {
            let source = fs::read_to_string(format!("tests/node_compat/suite/{}", test_path))
                .unwrap_or_default();
            let discovery = discover_subtests(test_path, &source);

            let subtest_list: Vec<(usize, String)> = match &discovery {
                SubtestDiscovery::None => vec![],
                SubtestDiscovery::Block(blocks) => {
                    blocks.iter().map(|b| (b.index, b.name.clone())).collect()
                }
                SubtestDiscovery::NodeTest(tests) => {
                    tests.iter().map(|t| (t.index, t.name.clone())).collect()
                }
            };

            for (idx, subtest_name) in subtest_list {
                total_subtests += 1;
                let runner = runner.clone();
                let progress = subtest_progress.clone();
                let semaphore = semaphore.clone();
                let test_path = test_path.clone();
                let source = source.clone();
                let discovery = discovery.clone();
                subtest_futures.push(tokio::spawn(async move {
                    let _permit = semaphore.acquire().await.expect("semaphore closed");
                    let sub_result = match tokio::time::timeout(
                        Duration::from_secs(60),
                        runner.run_subtest(&test_path, &source, &discovery, idx),
                    )
                    .await
                    {
                        Ok(Ok(r)) => r,
                        Ok(Err(e)) => TestResult::Error(format!("{e:#}")),
                        Err(_) => TestResult::Error("Timeout".to_string()),
                    };
                    let p = progress.fetch_add(1, Ordering::Relaxed) + 1;
                    let subtest_key = format!("{}#{}", test_path, subtest_name);
                    (subtest_key, sub_result, test_path, subtest_name, p)
                }));
            }
        }
    }

    println!("Running {total_subtests} subtests in parallel...\n");

    while let Some(join_result) = subtest_futures.next().await {
        let (subtest_key, sub_result, test_path, subtest_name, p) =
            join_result.expect("subtest task panicked");
        let filename = test_path.rsplit('/').next().unwrap_or(&test_path);
        let is_internal = internals_tests.contains(&test_path);
        let sub_filename = format!("{}#{}", filename, subtest_name);
        let sub_tag = if is_internal { " [internal]" } else { "" };

        match &sub_result {
            TestResult::Pass => {
                println!("[{:>4}/{total_subtests}] PASS  {sub_filename}{sub_tag}", p)
            }
            TestResult::Skip(r) => {
                println!(
                    "[{:>4}/{total_subtests}] SKIP  {sub_filename}{sub_tag} ({r})",
                    p
                )
            }
            TestResult::Fail(msg) => {
                let short = if msg.len() > 100 {
                    &msg[..100]
                } else {
                    msg.as_str()
                };
                println!(
                    "[{:>4}/{total_subtests}] FAIL  {sub_filename}{sub_tag}: {short}",
                    p
                );
            }
            TestResult::Error(msg) => {
                let short = if msg.len() > 100 {
                    &msg[..100]
                } else {
                    msg.as_str()
                };
                println!(
                    "[{:>4}/{total_subtests}] ERROR {sub_filename}{sub_tag}: {short}",
                    p
                );
            }
        }

        results.insert(subtest_key, sub_result);
    }

    // Build set of file-level paths that have subtests — we count subtests instead of
    // the parent file entry for those, to get fine-grained numbers.
    let files_with_subtests: BTreeSet<String> = results
        .keys()
        .filter(|k| k.contains('#'))
        .map(|k| k.split('#').next().unwrap().to_string())
        .collect();

    // Compute counts from collected results
    let mut pass_count = 0usize;
    let mut fail_count = 0usize;
    let mut skip_count = 0usize;
    let mut impossible_count = 0usize;
    let mut error_count = 0usize;
    let mut internals_pass = 0usize;
    let mut internals_fail = 0usize;
    let mut internals_skip = 0usize;
    let mut internals_impossible = 0usize;
    let mut internals_error = 0usize;

    for (path, result) in &results {
        let base_path = path.split('#').next().unwrap_or(path);
        // Skip file-level entries that have subtests (subtests are counted individually)
        if !path.contains('#') && files_with_subtests.contains(path) {
            continue;
        }
        let is_internal = internals_tests.contains(base_path);
        let bucket = report_bucket(path, result, &skipped_observations, &config_impossible);
        match bucket {
            ReportBucket::Pass => {
                if is_internal {
                    internals_pass += 1;
                } else {
                    pass_count += 1;
                }
            }
            ReportBucket::Skip => {
                if is_internal {
                    internals_skip += 1;
                } else {
                    skip_count += 1;
                }
            }
            ReportBucket::Impossible => {
                if is_internal {
                    internals_impossible += 1;
                } else {
                    impossible_count += 1;
                }
            }
            ReportBucket::Fail => {
                if is_internal {
                    internals_fail += 1;
                } else {
                    fail_count += 1;
                }
            }
            ReportBucket::Error => {
                if is_internal {
                    internals_error += 1;
                } else {
                    error_count += 1;
                }
            }
        }
    }

    let total_elapsed = total_start.elapsed();

    // Recompute totals based on the subtest-expanded counts
    let total_public = pass_count + fail_count + skip_count + impossible_count + error_count;
    let total_internals =
        internals_pass + internals_fail + internals_skip + internals_impossible + internals_error;
    let total_tests = total_public + total_internals;

    // Step 5: Generate report
    println!("\n=== Generating report ===");

    let mut report = String::new();
    report.push_str("# Node.js v22 Compatibility Report\n\n");
    report.push_str(&format!(
        "Generated: {} | Runtime: {:.0}s | Engine: wasm-rquickjs (QuickJS)\n\n",
        now_date(),
        total_elapsed.as_secs_f64()
    ));

    // Summary (public API tests only)
    report.push_str("## Summary (Public API Tests)\n\n");
    report.push_str(&format!(
        "Tests that rely on Node.js internals (`--expose-internals`, `internalBinding`, `require('internal/...')`) \
         are excluded from the primary counts ({total_internals} internals tests listed separately below).\n\n"
    ));
    report.push_str("| Result | Count | Percentage |\n");
    report.push_str("|--------|-------|------------|\n");
    report.push_str(&format!(
        "| ✅ PASS | {pass_count} | {:.1}% |\n",
        pass_count as f64 / total_public as f64 * 100.0
    ));
    report.push_str(&format!(
        "| ⏭️ SKIP | {skip_count} | {:.1}% |\n",
        skip_count as f64 / total_public as f64 * 100.0
    ));
    report.push_str(&format!(
        "| 🚫 IMPOSSIBLE | {impossible_count} | {:.1}% |\n",
        impossible_count as f64 / total_public as f64 * 100.0
    ));
    report.push_str(&format!(
        "| ❌ FAIL | {fail_count} | {:.1}% |\n",
        fail_count as f64 / total_public as f64 * 100.0
    ));
    report.push_str(&format!(
        "| 💥 ERROR | {error_count} | {:.1}% |\n",
        error_count as f64 / total_public as f64 * 100.0
    ));
    report.push_str(&format!(
        "| **Total** | **{total_public}** | **100%** |\n\n"
    ));

    // All tests summary (public + internals combined)
    let all_pass = pass_count + internals_pass;
    let all_skip = skip_count + internals_skip;
    let all_impossible = impossible_count + internals_impossible;
    let all_fail = fail_count + internals_fail;
    let all_error = error_count + internals_error;

    report.push_str("### All Tests (Public + Internals)\n\n");
    report.push_str(&format!(
        "Including {total_internals} tests that use Node.js internals \
         (`--expose-internals`, `internalBinding`, `require('internal/...')`).\n\n"
    ));
    report.push_str("| Result | Count | Percentage |\n");
    report.push_str("|--------|-------|------------|\n");
    report.push_str(&format!(
        "| ✅ PASS | {all_pass} | {:.1}% |\n",
        all_pass as f64 / total_tests as f64 * 100.0
    ));
    report.push_str(&format!(
        "| ⏭️ SKIP | {all_skip} | {:.1}% |\n",
        all_skip as f64 / total_tests as f64 * 100.0
    ));
    report.push_str(&format!(
        "| 🚫 IMPOSSIBLE | {all_impossible} | {:.1}% |\n",
        all_impossible as f64 / total_tests as f64 * 100.0
    ));
    report.push_str(&format!(
        "| ❌ FAIL | {all_fail} | {:.1}% |\n",
        all_fail as f64 / total_tests as f64 * 100.0
    ));
    report.push_str(&format!(
        "| 💥 ERROR | {all_error} | {:.1}% |\n",
        all_error as f64 / total_tests as f64 * 100.0
    ));
    report.push_str(&format!("| **Total** | **{total_tests}** | **100%** |\n\n"));

    // By module category (public API only)
    report.push_str("## Results by Module\n\n");
    let mut by_module_public: BTreeMap<String, Vec<(&String, &TestResult)>> = BTreeMap::new();
    for (path, result) in &results {
        let base_path = path.split('#').next().unwrap_or(path);
        if internals_tests.contains(base_path) {
            continue;
        }
        // Skip file-level entries that have subtests
        if !path.contains('#') && files_with_subtests.contains(path) {
            continue;
        }
        let filename = path.rsplit('/').next().unwrap_or(path);
        let base_filename = filename.split('#').next().unwrap_or(filename);
        let module = classify_test(base_filename).to_string();
        by_module_public
            .entry(module)
            .or_default()
            .push((path, result));
    }

    report.push_str("| Module | Total | Pass | Fail | Error | Skip | Impossible | Pass% |\n");
    report.push_str("|--------|-------|------|------|-------|------|------------|-------|\n");

    for (module, tests) in &by_module_public {
        let total = tests.len();
        let mut pass = 0;
        let mut fail = 0;
        let mut error = 0;
        let mut skip = 0;
        let mut impossible = 0;
        for (path, result) in tests {
            match report_bucket(path, result, &skipped_observations, &config_impossible) {
                ReportBucket::Pass => pass += 1,
                ReportBucket::Fail => fail += 1,
                ReportBucket::Error => error += 1,
                ReportBucket::Skip => skip += 1,
                ReportBucket::Impossible => impossible += 1,
            }
        }
        let pass_pct = if total > 0 {
            pass as f64 / total as f64 * 100.0
        } else {
            0.0
        };
        report.push_str(&format!(
            "| {module} | {total} | {pass} | {fail} | {error} | {skip} | {impossible} | {pass_pct:.1}% |\n"
        ));
    }

    // Passing tests (public API only)
    report.push_str("\n## Passing Tests\n\n");
    let passing: Vec<_> = results
        .iter()
        .filter(|(p, r)| {
            matches!(r, TestResult::Pass)
                && !internals_tests.contains(p.split('#').next().unwrap_or(p))
        })
        .collect();
    if passing.is_empty() {
        report.push_str("_No tests passed._\n\n");
    } else {
        for (path, _) in &passing {
            report.push_str(&format!("- `{path}`\n"));
        }
        report.push('\n');
    }

    // Failing tests with error messages (grouped by module, public API only)
    report.push_str("## Failing Tests\n\n");
    for (module, tests) in &by_module_public {
        let failures: Vec<_> = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Fail(_)))
            .collect();
        if failures.is_empty() {
            continue;
        }
        report.push_str(&format!("### {module}\n\n"));
        for (path, result) in &failures {
            if let TestResult::Fail(msg) = result {
                let short = if msg.len() > 200 {
                    format!("{}...", truncate_str(msg, 200))
                } else {
                    msg.clone()
                };
                let short = short.replace('\n', " ").replace('|', "\\|");
                report.push_str(&format!("- `{path}`: {short}\n"));
            }
        }
        report.push('\n');
    }

    // Error tests (public API only)
    report.push_str("## Error Tests (runtime/instantiation errors)\n\n");
    let errors: Vec<_> = results
        .iter()
        .filter(|(p, r)| {
            matches!(r, TestResult::Error(_))
                && !internals_tests.contains(p.split('#').next().unwrap_or(p))
        })
        .collect();
    if errors.is_empty() {
        report.push_str("_No errors._\n\n");
    } else {
        report.push_str(&format!("{} tests had runtime errors.\n\n", errors.len()));
        report.push_str("<details>\n<summary>Click to expand</summary>\n\n");
        for (path, result) in &errors {
            if let TestResult::Error(msg) = result {
                let short = if msg.len() > 200 {
                    format!("{}...", truncate_str(msg, 200))
                } else {
                    msg.clone()
                };
                let short = short.replace('\n', " ").replace('|', "\\|");
                report.push_str(&format!("- `{path}`: {short}\n"));
            }
        }
        report.push_str("\n</details>\n\n");
    }

    // Skipped tests (public API only, file-level only — subtests are in Split Test Summary)
    // Collect skipped tests, separating unevaluated (with actual errors) from manually skipped
    let all_skipped: Vec<_> = results
        .iter()
        .filter(|(p, r)| {
            // Exclude subtests (they are covered by Split Test Summary)
            if p.contains('#') {
                return false;
            }
            let base_path = p.split('#').next().unwrap_or(p);
            !internals_tests.contains(base_path)
                && report_bucket(p, r, &skipped_observations, &config_impossible)
                    == ReportBucket::Skip
        })
        .collect();

    // Separate unevaluated tests (newly discovered) from manually skipped
    let mut unevaluated: Vec<(&String, &SkippedObservation)> = Vec::new();
    let mut manually_skipped: Vec<(&String, &str)> = Vec::new();
    for (path, result) in &all_skipped {
        if let Some(obs) = skipped_observations.get(*path) {
            if is_unevaluated_reason(&obs.config_reason) {
                unevaluated.push((path, obs));
            } else {
                manually_skipped.push((path, &obs.config_reason));
            }
        } else if let TestResult::Skip(reason) = result {
            manually_skipped.push((path, reason));
        }
    }

    // Auto-classified impossible from unevaluated
    let auto_impossible: Vec<_> = skipped_observations
        .iter()
        .filter(|(p, obs)| {
            let base_path = p.split('#').next().unwrap_or(p);
            !internals_tests.contains(base_path) && obs.inferred_impossible.is_some()
        })
        .collect();

    // Section: Unevaluated Tests with actual errors
    report.push_str("## Unevaluated Tests (newly discovered, with actual errors)\n\n");
    report.push_str(
        "These tests were added by `migrate_config_split` but have not been manually evaluated.\n\
         The report ran each test and captured the actual error. Tests are grouped by error pattern.\n\n",
    );

    if unevaluated.is_empty() && auto_impossible.is_empty() {
        report.push_str("_No unevaluated tests._\n\n");
    } else {
        // Auto-classified impossible subsection
        if !auto_impossible.is_empty() {
            report.push_str(&format!(
                "### Auto-classified as impossible ({} tests)\n\n\
                 These tests fail with errors indicating features fundamentally unavailable in WASM.\n\
                 They are counted as IMPOSSIBLE in the summary.\n\n",
                auto_impossible.len()
            ));
            report.push_str("| Reason | Count | Example tests |\n");
            report.push_str("|--------|-------|---------------|\n");
            let mut by_reason: BTreeMap<&str, Vec<&String>> = BTreeMap::new();
            for (path, obs) in &auto_impossible {
                if let Some(ref reason) = obs.inferred_impossible {
                    by_reason.entry(reason.as_str()).or_default().push(path);
                }
            }
            for (reason, paths) in &by_reason {
                let examples: Vec<_> = paths
                    .iter()
                    .take(3)
                    .map(|p| {
                        let f = p.rsplit('/').next().unwrap_or(p);
                        format!("`{f}`")
                    })
                    .collect();
                let suffix = if paths.len() > 3 {
                    format!(", ... (+{})", paths.len() - 3)
                } else {
                    String::new()
                };
                report.push_str(&format!(
                    "| {} | {} | {}{} |\n",
                    reason,
                    paths.len(),
                    examples.join(", "),
                    suffix
                ));
            }
            report.push('\n');
        }

        // Unevaluated tests grouped by error pattern
        if !unevaluated.is_empty() {
            report.push_str(&format!(
                "### Needs investigation ({} tests)\n\n\
                 These unevaluated tests fail with errors that may be fixable.\n\n",
                unevaluated.len()
            ));

            // Group by normalized error
            let mut by_pattern: BTreeMap<String, Vec<&String>> = BTreeMap::new();
            for (path, obs) in &unevaluated {
                let error_msg = match &obs.actual {
                    TestResult::Fail(m) | TestResult::Error(m) | TestResult::Skip(m) => m.clone(),
                    TestResult::Pass => "passed (unexpected)".to_string(),
                };
                let pattern = normalize_error_for_grouping(&error_msg);
                by_pattern.entry(pattern).or_default().push(path);
            }

            // Sort by count descending
            let mut patterns: Vec<_> = by_pattern.into_iter().collect();
            patterns.sort_by(|a, b| b.1.len().cmp(&a.1.len()));

            report.push_str("| Error Pattern | Count | Example tests |\n");
            report.push_str("|---------------|-------|---------------|\n");
            for (pattern, paths) in &patterns {
                let examples: Vec<_> = paths
                    .iter()
                    .take(3)
                    .map(|p| {
                        let f = p.rsplit('/').next().unwrap_or(p);
                        format!("`{f}`")
                    })
                    .collect();
                let suffix = if paths.len() > 3 {
                    format!(", ... (+{})", paths.len() - 3)
                } else {
                    String::new()
                };
                let escaped_pattern = pattern.replace('|', "\\|");
                report.push_str(&format!(
                    "| {} | {} | {}{} |\n",
                    escaped_pattern,
                    paths.len(),
                    examples.join(", "),
                    suffix
                ));
            }
            report.push('\n');

            // Also list all unevaluated tests with their actual errors in a collapsible section
            report.push_str("<details>\n<summary>Full list of unevaluated tests with actual errors</summary>\n\n");
            for (path, obs) in &unevaluated {
                let actual_msg = match &obs.actual {
                    TestResult::Fail(m) => format!("FAIL: {}", m),
                    TestResult::Error(m) => format!("ERROR: {}", m),
                    TestResult::Skip(m) => format!("SKIP: {}", m),
                    TestResult::Pass => "PASS".to_string(),
                };
                let short = if actual_msg.len() > 200 {
                    format!("{}...", truncate_str(&actual_msg, 200))
                } else {
                    actual_msg
                };
                let short = short.replace('\n', " ").replace('|', "\\|");
                report.push_str(&format!("- `{path}`: {short}\n"));
            }
            report.push_str("\n</details>\n\n");
        }
    }

    // Manually skipped tests (with known reasons)
    report.push_str("## Skipped Tests\n\n");
    if manually_skipped.is_empty() {
        report.push_str("_No manually skipped tests._\n\n");
    } else {
        report.push_str(&format!(
            "{} tests are manually skipped with known reasons.\n\n",
            manually_skipped.len()
        ));
        report.push_str("<details>\n<summary>Click to expand</summary>\n\n");
        for (path, reason) in &manually_skipped {
            report.push_str(&format!("- `{path}`: {reason}\n"));
        }
        report.push_str("\n</details>\n\n");
    }

    // Split Test Summary
    report.push_str("## Split Test Summary\n\n");
    if !config_split_entries.is_empty() {
        report.push_str("| File | Subtests | Pass | Fail | Error | Skip |\n");
        report.push_str("|------|----------|------|------|-------|------|\n");

        for split_path in config_split_entries.keys() {
            let split_filename = split_path.rsplit('/').next().unwrap_or(split_path);
            let prefix = format!("{}#", split_path);
            let sub_results: Vec<(&String, &TestResult)> = results
                .iter()
                .filter(|(k, _)| k.starts_with(&prefix))
                .collect();

            if sub_results.is_empty() {
                continue;
            }

            let total = sub_results.len();
            let pass = sub_results
                .iter()
                .filter(|(_, r)| matches!(r, TestResult::Pass))
                .count();
            let fail = sub_results
                .iter()
                .filter(|(_, r)| matches!(r, TestResult::Fail(_)))
                .count();
            let error = sub_results
                .iter()
                .filter(|(_, r)| matches!(r, TestResult::Error(_)))
                .count();
            let skip = sub_results
                .iter()
                .filter(|(_, r)| matches!(r, TestResult::Skip(_)))
                .count();

            report.push_str(&format!(
                "| {split_filename} | {total} | {pass} | {fail} | {error} | {skip} |\n"
            ));
        }
        report.push('\n');
    } else {
        report.push_str("_No split test entries in config.jsonc._\n\n");
    }

    // Check subtest-level skips that actually pass
    {
        let config_content =
            fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
        let config_json_str = strip_jsonc_comments(&config_content);
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&config_json_str)
            && let Some(tests_obj) = val.get("tests").and_then(|v| v.as_object())
        {
            for (key, entry) in tests_obj {
                if let Some(subtests) = entry.get("subtests").and_then(|v| v.as_object()) {
                    for (subtest_name, subtest_entry) in subtests {
                        let is_skipped = subtest_entry
                            .get("skip")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);
                        if is_skipped {
                            let subtest_key = format!("{}#{}", key, subtest_name);
                            if let Some(TestResult::Pass) = results.get(&subtest_key) {
                                should_not_be_skipped.push(subtest_key);
                            }
                        }
                    }
                }
            }
        }
    }

    // Tests that should not be skipped (marked skip in config.jsonc but actually pass)
    report.push_str("## Tests That Were Auto-Enabled\n\n");
    report.push_str(
        "These tests were marked with `\"skip\": true` in `config.jsonc` but actually pass.\n\
         The report has automatically removed the skip flag.\n\n",
    );
    if should_not_be_skipped.is_empty() {
        report.push_str("_All skipped tests still fail — no changes needed._\n\n");
    } else {
        report.push_str(&format!(
            "{} test(s) were auto-enabled:\n\n",
            should_not_be_skipped.len()
        ));
        for path in &should_not_be_skipped {
            report.push_str(&format!("- `{path}`\n"));
        }
        report.push('\n');
    }

    // Passing tests not in config.jsonc
    report.push_str("## Passing Tests Auto-Added to Config\n\n");
    report.push_str(
        "These tests pass but were not listed in `config.jsonc`.\n\
         The report has automatically added them.\n\n",
    );
    let missing_from_config_for_report: Vec<String>;
    {
        let config_content =
            fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
        let config_json_str = strip_jsonc_comments(&config_content);
        let config_tests_for_report: BTreeSet<String> = {
            let mut keys: BTreeSet<String> =
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&config_json_str) {
                    val.get("tests")
                        .and_then(|v| v.as_object())
                        .map(|obj| obj.keys().cloned().collect())
                        .unwrap_or_default()
                } else {
                    BTreeSet::new()
                };
            keys.extend(config_skipped.keys().cloned());
            keys
        };

        missing_from_config_for_report = results
            .iter()
            .filter(|(path, result)| {
                if !matches!(result, TestResult::Pass) {
                    return false;
                }
                // Only file-level entries (not subtests)
                if path.contains('#') {
                    return false;
                }
                let base_path = path.split('#').next().unwrap_or(path);
                if internals_tests.contains(base_path) {
                    return false;
                }
                !config_tests_for_report.contains(path.as_str())
            })
            .map(|(path, _)| path.clone())
            .collect();

        if missing_from_config_for_report.is_empty() {
            report.push_str("_All passing tests are already in config.jsonc._\n\n");
        } else {
            report.push_str(&format!(
                "{} test(s) were auto-added:\n\n",
                missing_from_config_for_report.len()
            ));
            for path in &missing_from_config_for_report {
                report.push_str(&format!("- `{path}`\n"));
            }
            report.push('\n');
        }
    }

    // All tests by module (public + internals combined)
    report.push_str("## All Results by Module (Public + Internals)\n\n");
    let mut by_module_all: BTreeMap<String, Vec<(&String, &TestResult)>> = BTreeMap::new();
    for (path, result) in &results {
        // Skip file-level entries that have subtests
        if !path.contains('#') && files_with_subtests.contains(path) {
            continue;
        }
        let filename = path.rsplit('/').next().unwrap_or(path);
        let base_filename = filename.split('#').next().unwrap_or(filename);
        let module = classify_test(base_filename).to_string();
        by_module_all
            .entry(module)
            .or_default()
            .push((path, result));
    }

    report.push_str("| Module | Total | Pass | Fail | Error | Skip | Impossible | Pass% |\n");
    report.push_str("|--------|-------|------|------|-------|------|------------|-------|\n");
    for (module, tests) in &by_module_all {
        let total = tests.len();
        let mut pass = 0;
        let mut fail = 0;
        let mut error = 0;
        let mut skip = 0;
        let mut impossible = 0;
        for (path, result) in tests {
            match report_bucket(path, result, &skipped_observations, &config_impossible) {
                ReportBucket::Pass => pass += 1,
                ReportBucket::Fail => fail += 1,
                ReportBucket::Error => error += 1,
                ReportBucket::Skip => skip += 1,
                ReportBucket::Impossible => impossible += 1,
            }
        }
        let pass_pct = if total > 0 {
            pass as f64 / total as f64 * 100.0
        } else {
            0.0
        };
        report.push_str(&format!(
            "| {module} | {total} | {pass} | {fail} | {error} | {skip} | {impossible} | {pass_pct:.1}% |\n"
        ));
    }
    report.push('\n');

    // Write report
    fs::write("tests/node_compat/report.md", &report)?;
    println!("Report written to tests/node_compat/report.md");

    // Print summary to console
    println!("\n============================================");
    println!("  Node.js v22 Compatibility Report Summary");
    println!("  (Public API Tests Only)");
    println!("============================================");
    println!(
        "  ✅ PASS:       {pass_count:>5} ({:.1}%)",
        pass_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  ⏭️  SKIP:       {skip_count:>5} ({:.1}%)",
        skip_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  🚫 IMPOSSIBLE: {impossible_count:>5} ({:.1}%)",
        impossible_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  ❌ FAIL:       {fail_count:>5} ({:.1}%)",
        fail_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  💥 ERROR:      {error_count:>5} ({:.1}%)",
        error_count as f64 / total_public as f64 * 100.0
    );
    println!("  ─────────────────────────────────");
    println!("  Total:         {total_public:>5}");
    println!("  ─────────────────────────────────");
    println!("  All (incl. internals):");
    println!(
        "    PASS: {all_pass}, SKIP: {all_skip}, IMPOSSIBLE: {all_impossible}, FAIL: {all_fail}, ERROR: {all_error}, Total: {total_tests}"
    );
    println!("  Runtime:  {:.0}s", total_elapsed.as_secs_f64());
    println!("============================================\n");

    // Print top passing modules (public API only)
    println!("Top passing modules (public API):");
    let mut module_stats: Vec<(String, usize, usize)> = by_module_public
        .iter()
        .map(|(m, tests)| {
            let pass = tests
                .iter()
                .filter(|(_, r)| matches!(r, TestResult::Pass))
                .count();
            (m.clone(), pass, tests.len())
        })
        .filter(|(_, pass, _)| *pass > 0)
        .collect();
    module_stats.sort_by(|a, b| b.1.cmp(&a.1));
    for (module, pass, total) in module_stats.iter().take(20) {
        println!(
            "  {module:<20} {pass:>4}/{total:<4} ({:.1}%)",
            *pass as f64 / *total as f64 * 100.0
        );
    }

    // Step 6: Auto-update config.jsonc
    update_config_jsonc(&should_not_be_skipped, &missing_from_config_for_report);

    // Don't fail the test - this is a report generator
    Ok(())
}

fn truncate_str(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes {
        return s;
    }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) {
        end -= 1;
    }
    &s[..end]
}

fn now_date() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}

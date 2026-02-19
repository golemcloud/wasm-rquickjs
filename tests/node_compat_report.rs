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

mod common;

use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use common::{setup_node_compat_test_files, strip_jsonc_comments};
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use test_r::test;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
use wasmtime::component::{Component, Linker, ResourceTable, Val};
use wasmtime::{Engine, Store};
use wasmtime_wasi::p2::{IoView, OutputFile, WasiCtx, WasiView, bindings};
use wasmtime_wasi::{DirPerms, FilePerms};
use wasmtime_wasi_http::{WasiHttpCtx, WasiHttpView};

// --- Host type (same as common/mod.rs) ---

#[derive(Clone)]
struct Host {
    pub table: Arc<Mutex<ResourceTable>>,
    pub wasi: Arc<Mutex<WasiCtx>>,
    pub wasi_http: Arc<WasiHttpCtx>,
}

impl IoView for Host {
    fn table(&mut self) -> &mut ResourceTable {
        Arc::get_mut(&mut self.table)
            .expect("ResourceTable is shared and cannot be borrowed mutably")
            .get_mut()
            .expect("ResourceTable mutex must never fail")
    }
}

impl WasiView for Host {
    fn ctx(&mut self) -> &mut WasiCtx {
        Arc::get_mut(&mut self.wasi)
            .expect("WasiCtx is shared and cannot be borrowed mutably")
            .get_mut()
            .expect("WasiCtx mutex must never fail")
    }
}

impl WasiHttpView for Host {
    fn ctx(&mut self) -> &mut WasiHttpCtx {
        Arc::get_mut(&mut self.wasi_http)
            .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
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
        config.async_support(true);
        config.wasm_component_model(true);
        config.epoch_interruption(true);
        config.cache(Some(wasmtime::Cache::from_file(None)?));
        let engine = Engine::new(&config)?;
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
            .build();
        let http_ctx = WasiHttpCtx::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(http_ctx),
        };

        let mut store = Store::new(&self.engine, host);
        // Set epoch deadline: allow 30 ticks (each tick is ~1 second via background thread)
        store.set_epoch_deadline(30);
        let instance = self
            .linker
            .instantiate_async(&mut store, &self.component)
            .await?;

        let guest_path = format!("/test/{}", test_rel_path);

        let func = instance
            .get_func(&mut store, "run-test")
            .ok_or_else(|| anyhow::anyhow!("Function run-test not found"))?;

        let args = [Val::String(guest_path)];
        let mut results = vec![Val::Bool(false)];

        let invoke_result = match func.call_async(&mut store, &args, &mut results).await {
            Ok(()) => {
                let _ = func.post_return_async(&mut store).await;
                Ok(())
            }
            Err(e) => {
                let msg = format!("{e:#}");
                if msg.contains("epoch") || msg.contains("interrupt") {
                    Err(anyhow::anyhow!("Timeout (epoch deadline exceeded)"))
                } else {
                    Err(e)
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
}

fn compile_runner() -> anyhow::Result<Utf8PathBuf> {
    let path = Utf8Path::new("examples/node-compat-runner");
    let name = "node-compat-runner";
    let feature_combination_label = "http";
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
        .args(["--no-default-features", "--features", "http"])
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

    // Load config.jsonc to find tests explicitly skipped with a reason
    let config_skipped: BTreeMap<String, String> = {
        let config_content =
            fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
        let config_json_str = strip_jsonc_comments(&config_content);
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&config_json_str) {
            val.get("tests")
                .and_then(|v| v.as_object())
                .map(|obj| {
                    obj.iter()
                        .filter_map(|(key, entry)| {
                            let skip = entry.get("skip")?.as_bool()?;
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
                .unwrap_or_default()
        } else {
            BTreeMap::new()
        }
    };

    // Also include config-skipped tests that weren't found in the suite directory scan
    // (e.g. .mjs files) so they still appear in the report
    for (path, _) in &config_skipped {
        if !test_files.contains(path) {
            let suite_file = format!("tests/node_compat/suite/{path}");
            if std::path::Path::new(&suite_file).exists() {
                test_files.push(path.clone());
            }
        }
    }
    test_files.sort();

    // Recompute totals after adding config-skipped files
    let total_tests = test_files.len();
    let total_internals = internals_tests.len();
    let total_public = total_tests - total_internals;

    // Step 4: Run all tests
    let mut results: BTreeMap<String, TestResult> = BTreeMap::new();
    let mut pass_count = 0usize;
    let mut fail_count = 0usize;
    let mut skip_count = 0usize;
    let mut error_count = 0usize;
    let mut internals_pass = 0usize;
    let mut internals_fail = 0usize;
    let mut internals_skip = 0usize;
    let mut internals_error = 0usize;

    // Run all tests sequentially
    let mut progress = 0usize;
    for test_path in &test_files {
        progress += 1;
        let filename = test_path.rsplit('/').next().unwrap_or(test_path);
        let is_internal = internals_tests.contains(test_path);
        let tag = if is_internal { " [internal]" } else { "" };

        // Check if this test is explicitly skipped in config.jsonc
        let result = if let Some(reason) = config_skipped.get(test_path) {
            println!(
                "[{:>4}/{total_tests}] SKIP  {filename}{tag} ({reason})",
                progress
            );
            TestResult::Skip(reason.clone())
        } else {
            let test_start = Instant::now();
            let r = match tokio::time::timeout(Duration::from_secs(60), runner.run_test(test_path))
                .await
            {
                Ok(Ok(r)) => r,
                Ok(Err(e)) => TestResult::Error(format!("{e:#}")),
                Err(_) => TestResult::Error("Timeout (tokio 60s deadline exceeded)".to_string()),
            };

            let elapsed = test_start.elapsed();

            match &r {
                TestResult::Pass => {
                    println!(
                        "[{:>4}/{total_tests}] PASS  {filename}{tag} ({:.1}s)",
                        progress,
                        elapsed.as_secs_f64()
                    );
                }
                TestResult::Skip(reason) => {
                    println!(
                        "[{:>4}/{total_tests}] SKIP  {filename}{tag} ({reason})",
                        progress
                    );
                }
                TestResult::Fail(msg) => {
                    let short_msg = if msg.len() > 120 {
                        format!("{}...", truncate_str(msg, 120))
                    } else {
                        msg.clone()
                    };
                    println!(
                        "[{:>4}/{total_tests}] FAIL  {filename}{tag}: {short_msg}",
                        progress
                    );
                }
                TestResult::Error(msg) => {
                    let short_msg = if msg.len() > 120 {
                        format!("{}...", truncate_str(msg, 120))
                    } else {
                        msg.clone()
                    };
                    println!(
                        "[{:>4}/{total_tests}] ERROR {filename}{tag}: {short_msg}",
                        progress
                    );
                }
            }

            r
        };

        match &result {
            TestResult::Pass => {
                if is_internal {
                    internals_pass += 1;
                } else {
                    pass_count += 1;
                }
            }
            TestResult::Skip(_) => {
                if is_internal {
                    internals_skip += 1;
                } else {
                    skip_count += 1;
                }
            }
            TestResult::Fail(_) => {
                if is_internal {
                    internals_fail += 1;
                } else {
                    fail_count += 1;
                }
            }
            TestResult::Error(_) => {
                if is_internal {
                    internals_error += 1;
                } else {
                    error_count += 1;
                }
            }
        }

        results.insert(test_path.clone(), result);
    }

    let total_elapsed = total_start.elapsed();

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
        if internals_tests.contains(path) {
            continue;
        }
        let filename = path.rsplit('/').next().unwrap_or(path);
        let module = classify_test(filename).to_string();
        by_module_public
            .entry(module)
            .or_default()
            .push((path, result));
    }

    report.push_str("| Module | Total | Pass | Fail | Error | Skip | Pass% |\n");
    report.push_str("|--------|-------|------|------|-------|------|-------|\n");

    for (module, tests) in &by_module_public {
        let total = tests.len();
        let pass = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Pass))
            .count();
        let fail = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Fail(_)))
            .count();
        let error = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Error(_)))
            .count();
        let skip = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Skip(_)))
            .count();
        let pass_pct = if total > 0 {
            pass as f64 / total as f64 * 100.0
        } else {
            0.0
        };
        report.push_str(&format!(
            "| {module} | {total} | {pass} | {fail} | {error} | {skip} | {pass_pct:.1}% |\n"
        ));
    }

    // Passing tests (public API only)
    report.push_str("\n## Passing Tests\n\n");
    let passing: Vec<_> = results
        .iter()
        .filter(|(p, r)| matches!(r, TestResult::Pass) && !internals_tests.contains(p.as_str()))
        .collect();
    if passing.is_empty() {
        report.push_str("_No tests passed._\n\n");
    } else {
        for (path, _) in &passing {
            report.push_str(&format!("- `{path}`\n"));
        }
        report.push_str("\n");
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
        report.push_str("\n");
    }

    // Error tests (public API only)
    report.push_str("## Error Tests (runtime/instantiation errors)\n\n");
    let errors: Vec<_> = results
        .iter()
        .filter(|(p, r)| matches!(r, TestResult::Error(_)) && !internals_tests.contains(p.as_str()))
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

    // Skipped tests (public API only)
    report.push_str("## Skipped Tests\n\n");
    let skipped: Vec<_> = results
        .iter()
        .filter(|(p, r)| matches!(r, TestResult::Skip(_)) && !internals_tests.contains(p.as_str()))
        .collect();
    if skipped.is_empty() {
        report.push_str("_No tests skipped._\n\n");
    } else {
        report.push_str(&format!("{} tests were skipped.\n\n", skipped.len()));
        report.push_str("<details>\n<summary>Click to expand</summary>\n\n");
        for (path, result) in &skipped {
            if let TestResult::Skip(reason) = result {
                report.push_str(&format!("- `{path}`: {reason}\n"));
            }
        }
        report.push_str("\n</details>\n\n");
    }

    // All tests by module (public + internals combined)
    report.push_str("## All Results by Module (Public + Internals)\n\n");
    let mut by_module_all: BTreeMap<String, Vec<(&String, &TestResult)>> = BTreeMap::new();
    for (path, result) in &results {
        let filename = path.rsplit('/').next().unwrap_or(path);
        let module = classify_test(filename).to_string();
        by_module_all
            .entry(module)
            .or_default()
            .push((path, result));
    }

    report.push_str("| Module | Total | Pass | Fail | Error | Skip | Pass% |\n");
    report.push_str("|--------|-------|------|------|-------|------|-------|\n");
    for (module, tests) in &by_module_all {
        let total = tests.len();
        let pass = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Pass))
            .count();
        let fail = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Fail(_)))
            .count();
        let error = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Error(_)))
            .count();
        let skip = tests
            .iter()
            .filter(|(_, r)| matches!(r, TestResult::Skip(_)))
            .count();
        let pass_pct = if total > 0 {
            pass as f64 / total as f64 * 100.0
        } else {
            0.0
        };
        report.push_str(&format!(
            "| {module} | {total} | {pass} | {fail} | {error} | {skip} | {pass_pct:.1}% |\n"
        ));
    }
    report.push_str("\n");

    // Write report
    fs::write("tests/node_compat/report.md", &report)?;
    println!("Report written to tests/node_compat/report.md");

    // Print summary to console
    println!("\n============================================");
    println!("  Node.js v22 Compatibility Report Summary");
    println!("  (Public API Tests Only)");
    println!("============================================");
    println!(
        "  ✅ PASS:  {pass_count:>5} ({:.1}%)",
        pass_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  ⏭️  SKIP:  {skip_count:>5} ({:.1}%)",
        skip_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  ❌ FAIL:  {fail_count:>5} ({:.1}%)",
        fail_count as f64 / total_public as f64 * 100.0
    );
    println!(
        "  💥 ERROR: {error_count:>5} ({:.1}%)",
        error_count as f64 / total_public as f64 * 100.0
    );
    println!("  ─────────────────────────────────");
    println!("  Total:    {total_public:>5}");
    println!("  ─────────────────────────────────");
    println!("  All (incl. internals):");
    println!(
        "    PASS: {all_pass}, SKIP: {all_skip}, FAIL: {all_fail}, ERROR: {all_error}, Total: {total_tests}"
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

    // Step 6: Warn about passing tests not in config.jsonc
    let config_content = fs::read_to_string("tests/node_compat/config.jsonc").unwrap_or_default();
    let config_json_str = strip_jsonc_comments(&config_content);
    let config_tests: BTreeSet<String> = {
        let mut keys: BTreeSet<String> =
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&config_json_str) {
                val.get("tests")
                    .and_then(|v| v.as_object())
                    .map(|obj| obj.keys().cloned().collect())
                    .unwrap_or_default()
            } else {
                BTreeSet::new()
            };
        // Also include all config-skipped keys (already loaded earlier)
        keys.extend(config_skipped.keys().cloned());
        keys
    };

    let missing_from_config: Vec<&String> = results
        .iter()
        .filter(|(path, result)| {
            matches!(result, TestResult::Pass)
                && !internals_tests.contains(path.as_str())
                && !config_tests.contains(path.as_str())
        })
        .map(|(path, _)| path)
        .collect();

    if !missing_from_config.is_empty() {
        println!(
            "\n⚠️  WARNING: {} passing test(s) are NOT in config.jsonc!",
            missing_from_config.len()
        );
        println!(
            "Add the following entries to the \"tests\" object in tests/node_compat/config.jsonc:\n"
        );
        for path in &missing_from_config {
            println!("    \"{path}\": {{}},");
        }
        println!();
    }

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

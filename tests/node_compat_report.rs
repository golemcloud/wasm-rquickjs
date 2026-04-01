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
use common::js_subtest_parser::{
    SubtestDiscovery, discover_subtests, rewrite_for_block, rewrite_for_node_test,
};
use common::{
    GolemPreparedComponent, TestInstance, classify_test, setup_node_compat_test_files,
    strip_jsonc_comments, uses_node_internals,
};
use futures::stream::{FuturesUnordered, StreamExt};
use heck::ToSnakeCase;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::process::Command;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};
use test_r::test;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};
use wasmtime::component::Val;

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

async fn compile_runner() -> anyhow::Result<Utf8PathBuf> {
    let path = Utf8Path::new("examples/runtime/node-compat-runner");
    let name = "node-compat-runner";
    let feature_combination_label = "full-no-logging-golem";
    let wrapper_crate_root = Utf8Path::new("tmp")
        .join(name)
        .join(feature_combination_label);
    let shared_target = Utf8Path::new("..").join("..").join("rt-target");

    let wasm_path = Utf8Path::new("tmp")
        .join("rt-target")
        .join("wasm32-wasip1")
        .join("debug")
        .join(format!("{}.wasm", name.to_snake_case()));

    // If already compiled and optimized, skip
    let optimized_path = wasm_path.with_extension("optimized.wasm");
    if optimized_path.exists() {
        println!("Optimized runner WASM already exists at {optimized_path}");
        return Ok(optimized_path);
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
        .args([
            "--no-default-features",
            "--features",
            "full-no-logging,golem",
        ])
        .current_dir(&wrapper_crate_root)
        .status()?;

    if !status.success() {
        anyhow::bail!("Failed to compile runner");
    }

    // Optimize with Wizer pre-initialization
    let optimized_path = wasm_path.with_extension("optimized.wasm");
    println!("Optimizing component {wasm_path} -> {optimized_path}");
    wasm_rquickjs::optimize_component(&wasm_path, &optimized_path, "wizer-initialize").await?;

    Ok(optimized_path)
}

#[test]
async fn generate_node_compat_report() -> anyhow::Result<()> {
    let total_start = Instant::now();

    // Step 1: Compile/locate the runner
    println!("=== Compiling node-compat-runner ===");
    let wasm_path = compile_runner().await?;
    println!("Runner WASM: {wasm_path}");

    // Step 2: Create shared prepared component
    println!("=== Loading shared runner ===");
    let prepared = Arc::new(GolemPreparedComponent::new(&wasm_path)?);
    println!("Engine and component loaded.");

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

    // Build tasks for unified execution
    struct TestTask {
        key: String,
        test_path: String,
        skip_reason: Option<String>,
        rewrite_source: Option<String>,
        rewrite_discovery: Option<SubtestDiscovery>,
        rewrite_index: Option<usize>,
    }

    let mut tasks: Vec<TestTask> = Vec::new();
    for test_path in &test_files {
        if config_impossible.contains_key(test_path) {
            continue;
        }
        if let Some(_subtest_names) = config_split_entries.get(test_path) {
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

            if subtest_list.is_empty() {
                eprintln!(
                    "WARNING: split file {} has 0 discoverable subtests, running as whole file",
                    test_path
                );
                tasks.push(TestTask {
                    key: test_path.clone(),
                    test_path: test_path.clone(),
                    skip_reason: config_skipped.get(test_path).cloned(),
                    rewrite_source: None,
                    rewrite_discovery: None,
                    rewrite_index: None,
                });
            } else {
                let file_skip_reason = config_skipped.get(test_path).cloned();
                for (idx, subtest_name) in subtest_list {
                    tasks.push(TestTask {
                        key: format!("{}#{}", test_path, subtest_name),
                        test_path: test_path.clone(),
                        skip_reason: file_skip_reason.clone(),
                        rewrite_source: Some(source.clone()),
                        rewrite_discovery: Some(discovery.clone()),
                        rewrite_index: Some(idx),
                    });
                }
            }
        } else {
            tasks.push(TestTask {
                key: test_path.clone(),
                test_path: test_path.clone(),
                skip_reason: config_skipped.get(test_path).cloned(),
                rewrite_source: None,
                rewrite_discovery: None,
                rewrite_index: None,
            });
        }
    }

    let parallelism = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);
    let total_to_run = tasks.len();
    println!(
        "\n=== Running {} tasks ({} impossible, skipped), concurrency={} ===\n",
        total_to_run,
        test_files.len()
            - test_files
                .iter()
                .filter(|p| !config_impossible.contains_key(p.as_str()))
                .count(),
        parallelism
    );

    let progress = Arc::new(AtomicUsize::new(0));
    let semaphore = Arc::new(tokio::sync::Semaphore::new(parallelism));

    let mut futures = FuturesUnordered::new();
    for task in tasks {
        let prepared = prepared.clone();
        let progress = progress.clone();
        let semaphore = semaphore.clone();
        futures.push(tokio::spawn(async move {
            let _permit = semaphore.acquire().await.expect("semaphore closed");
            let test_start = Instant::now();

            let r = match tokio::time::timeout(Duration::from_secs(60), async {
                let mut instance = TestInstance::from_golem_prepared(&prepared).await?;
                instance.set_epoch_deadline(30);
                setup_node_compat_test_files(instance.temp_dir_path(), &task.test_path)?;

                // If rewrite is provided, rewrite the test file to isolate a subtest
                if let (Some(source), Some(discovery), Some(idx)) = (
                    &task.rewrite_source,
                    &task.rewrite_discovery,
                    task.rewrite_index,
                ) {
                    let rewritten = match discovery {
                        SubtestDiscovery::Block(blocks) => rewrite_for_block(source, blocks, idx),
                        SubtestDiscovery::NodeTest(_) => rewrite_for_node_test(source, idx),
                        SubtestDiscovery::None => source.to_string(),
                    };

                    let test_filename =
                        task.test_path.rsplit('/').next().unwrap_or(&task.test_path);
                    let suite = task.test_path.split('/').next().unwrap_or("parallel");
                    let rewritten_path = instance
                        .temp_dir_path()
                        .join("home")
                        .join("node")
                        .join("test")
                        .join(suite)
                        .join(test_filename);
                    fs::write(&rewritten_path, &rewritten)?;
                }

                let guest_path = format!("/home/node/test/{}", task.test_path);
                let (result, _stdout, _stderr) = instance
                    .invoke_and_capture_output_with_stderr(
                        None,
                        "run-test",
                        &[Val::String(guest_path)],
                    )
                    .await;

                match result {
                    Ok(Some(Val::String(ref s))) if s.starts_with("PASS") => {
                        Ok::<TestResult, anyhow::Error>(TestResult::Pass)
                    }
                    Ok(Some(Val::String(ref s))) if s.starts_with("SKIP:") => Ok(TestResult::Skip(
                        s.strip_prefix("SKIP:").unwrap().trim().to_string(),
                    )),
                    Ok(Some(Val::String(ref s))) if s.starts_with("FAIL:") => Ok(TestResult::Fail(
                        s.strip_prefix("FAIL:").unwrap().trim().to_string(),
                    )),
                    Ok(Some(Val::String(ref s))) => Ok(TestResult::Fail(s.clone())),
                    Ok(other) => Ok(TestResult::Fail(format!("Unexpected return: {other:?}"))),
                    Err(e) => {
                        let msg = format!("{e:#}");
                        if msg.contains("epoch") || msg.contains("interrupt") {
                            Ok(TestResult::Error(
                                "Timeout (epoch deadline exceeded)".to_string(),
                            ))
                        } else {
                            Ok(TestResult::Error(msg))
                        }
                    }
                }
            })
            .await
            {
                Ok(Ok(r)) => r,
                Ok(Err(e)) => TestResult::Error(format!("{e:#}")),
                Err(_) => TestResult::Error("Timeout (tokio 60s deadline exceeded)".to_string()),
            };

            let elapsed = test_start.elapsed();
            let p = progress.fetch_add(1, Ordering::Relaxed) + 1;
            (task.key, task.test_path, r, elapsed, task.skip_reason, p)
        }));
    }

    while let Some(join_result) = futures.next().await {
        let (key, _test_path, r, elapsed, skip_reason, p) =
            join_result.expect("test task panicked");
        let display_name = key.rsplit('/').next().unwrap_or(&key);
        let base_path = key.split('#').next().unwrap_or(&key);
        let is_internal = internals_tests.contains(base_path);
        let tag = if is_internal { " [internal]" } else { "" };

        let result = if let Some(reason) = skip_reason {
            match &r {
                TestResult::Pass => {
                    println!(
                        "[{:>4}/{total_to_run}] PASS* {display_name}{tag} ({:.1}s) [was skipped: {reason}]",
                        p,
                        elapsed.as_secs_f64()
                    );
                    should_not_be_skipped.push(key.clone());
                    skipped_observations.insert(
                        key.clone(),
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
                            "[{:>4}/{total_to_run}] IMPOSSIBLE* {display_name}{tag} (auto: {imp_reason})",
                            p
                        );
                    } else {
                        println!(
                            "[{:>4}/{total_to_run}] SKIP  {display_name}{tag} ({reason})",
                            p
                        );
                    }

                    skipped_observations.insert(
                        key.clone(),
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
                        "[{:>4}/{total_to_run}] PASS  {display_name}{tag} ({:.1}s)",
                        p,
                        elapsed.as_secs_f64()
                    );
                }
                TestResult::Skip(reason) => {
                    println!(
                        "[{:>4}/{total_to_run}] SKIP  {display_name}{tag} ({reason})",
                        p
                    );
                }
                TestResult::Fail(msg) => {
                    let short_msg = if msg.len() > 120 {
                        format!("{}...", truncate_str(msg, 120))
                    } else {
                        msg.clone()
                    };
                    println!(
                        "[{:>4}/{total_to_run}] FAIL  {display_name}{tag}: {short_msg}",
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
                        "[{:>4}/{total_to_run}] ERROR {display_name}{tag}: {short_msg}",
                        p
                    );
                }
            }
            r
        };

        results.insert(key, result);
    }

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

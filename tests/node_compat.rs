test_r::enable!();

use crate::common::{
    CompiledTest, PreparedComponent, TestInstance, setup_node_compat_test_files,
    strip_jsonc_comments,
};
use camino::Utf8Path;
use futures::stream::{self, StreamExt};
use std::collections::BTreeMap;
use std::fs;
use std::sync::Arc;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

#[test_dep(tagged_as = "node_compat_runner")]
fn compile_node_compat_runner() -> CompiledTest {
    let path = Utf8Path::new("examples/node-compat-runner");
    CompiledTest::new(path, true).expect("Failed to compile node-compat-runner")
}

// --- Config loading ---

#[derive(Debug)]
struct TestEntry {
    path: String,
    skip: bool,
    reason: Option<String>,
    #[allow(dead_code)]
    flaky: bool,
}

#[derive(Debug)]
struct Config {
    tests: Vec<TestEntry>,
}

impl Config {
    fn tests_matching(&self, prefix: &str) -> Vec<&TestEntry> {
        self.tests
            .iter()
            .filter(|t| {
                let filename = t.path.rsplit('/').next().unwrap_or(&t.path);
                filename.starts_with(prefix)
            })
            .collect()
    }

    fn tests_in_suite(&self, suite: &str) -> Vec<&TestEntry> {
        self.tests
            .iter()
            .filter(|t| t.path.starts_with(&format!("{suite}/")))
            .collect()
    }
}

fn load_config(path: &str) -> anyhow::Result<Config> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let tests_obj = value
        .get("tests")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("config.jsonc missing 'tests' object"))?;

    let mut tests = Vec::new();
    for (path, opts) in tests_obj {
        let skip = opts.get("skip").and_then(|v| v.as_bool()).unwrap_or(false);
        let flaky = opts.get("flaky").and_then(|v| v.as_bool()).unwrap_or(false);
        let reason = opts
            .get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        tests.push(TestEntry {
            path: path.clone(),
            skip,
            reason,
            flaky,
        });
    }

    Ok(Config { tests })
}

// --- Test file setup ---

/// Copy a vendored test file and the common shim into the TestInstance's temp dir.
fn setup_test_files(instance: &TestInstance, test_rel_path: &str) -> anyhow::Result<()> {
    setup_node_compat_test_files(instance.temp_dir_path(), test_rel_path)
}

// --- Test runner ---

fn process_result(
    path: String,
    result_str: String,
    stdout: String,
    stderr: String,
    results: &mut BTreeMap<String, String>,
    failures: &mut Vec<String>,
) {
    if result_str.starts_with("PASS") {
        println!("  {} ... ok", path);
        results.insert(path, "PASS".to_string());
    } else if let Some(reason) = result_str.strip_prefix("SKIP:") {
        println!("  {} ... SKIP ({})", path, reason.trim());
        results.insert(path, result_str);
    } else if result_str.starts_with("UNEXPECTED:") {
        let msg = format!("Unexpected return value: {}", &result_str[12..]);
        println!("  {} ... FAIL ({})", path, msg);
        if !stdout.is_empty() {
            println!("    [stdout] {}", stdout.trim());
        }
        if !stderr.is_empty() {
            println!("    [stderr] {}", stderr.trim());
        }
        results.insert(path.clone(), format!("FAIL: {msg}"));
        failures.push(path);
    } else if result_str.starts_with("ERROR:") {
        let msg = format!("Invocation error: {}", &result_str[7..]);
        println!("  {} ... FAIL ({})", path, msg);
        if !stdout.is_empty() {
            println!("    [stdout] {}", stdout.trim());
        }
        if !stderr.is_empty() {
            println!("    [stderr] {}", stderr.trim());
        }
        results.insert(path.clone(), format!("FAIL: {msg}"));
        failures.push(path);
    } else {
        println!("  {} ... FAIL", path);
        println!("    {}", result_str);
        if !stdout.is_empty() {
            println!("    [stdout] {}", stdout.trim());
        }
        if !stderr.is_empty() {
            println!("    [stderr] {}", stderr.trim());
        }
        results.insert(path.clone(), result_str);
        failures.push(path);
    }
}

async fn run_test_entry(
    prepared: &PreparedComponent,
    entry: &TestEntry,
) -> (String, String, String) {
    let (result, stdout, stderr) = match TestInstance::from_prepared(prepared).await {
        Ok(mut instance) => match setup_test_files(&instance, &entry.path) {
            Ok(()) => {
                let guest_path = format!("/tests/{}", entry.path);
                instance
                    .invoke_and_capture_output_with_stderr(
                        None,
                        "run-test",
                        &[Val::String(guest_path)],
                    )
                    .await
            }
            Err(e) => (Err(e), String::new(), String::new()),
        },
        Err(e) => (Err(e), String::new(), String::new()),
    };
    let result_str = match result {
        Ok(Some(Val::String(ref s))) => s.clone(),
        Ok(other) => format!("UNEXPECTED: {other:?}"),
        Err(e) => format!("ERROR: {e}"),
    };
    (result_str, stdout, stderr)
}

async fn run_tests(
    runner: &CompiledTest,
    tests: &[&TestEntry],
    parallel: bool,
) -> anyhow::Result<()> {
    let prepared = Arc::new(PreparedComponent::new(runner.wasm_path())?);

    let mut results: BTreeMap<String, String> = BTreeMap::new();
    let mut failures = Vec::new();

    // Handle skipped tests first
    for entry in tests {
        if entry.skip {
            let reason = entry.reason.as_deref().unwrap_or("no reason");
            println!("  {} ... SKIP ({})", entry.path, reason);
            results.insert(entry.path.clone(), format!("SKIP: {reason}"));
        }
    }

    let non_skipped: Vec<&TestEntry> = tests.iter().filter(|e| !e.skip).copied().collect();

    if parallel {
        let parallelism = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);

        let parallel_results: Vec<(String, String, String, String)> = stream::iter(non_skipped)
            .map(|entry| {
                let prepared = Arc::clone(&prepared);
                let path = entry.path.clone();
                async move {
                    let (result_str, stdout, stderr) =
                        run_test_entry(&prepared, entry).await;
                    (path, result_str, stdout, stderr)
                }
            })
            .buffer_unordered(parallelism)
            .collect()
            .await;

        for (path, result_str, stdout, stderr) in parallel_results {
            process_result(path, result_str, stdout, stderr, &mut results, &mut failures);
        }
    } else {
        for entry in non_skipped {
            let (result_str, stdout, stderr) = run_test_entry(&prepared, entry).await;
            process_result(
                entry.path.clone(),
                result_str,
                stdout,
                stderr,
                &mut results,
                &mut failures,
            );
        }
    }

    let total = tests.len();
    let passed = results.values().filter(|v| *v == "PASS").count();
    let skipped = results.values().filter(|v| v.starts_with("SKIP")).count();
    let failed = failures.len();
    println!("\n  Results: {passed} passed, {failed} failed, {skipped} skipped (total {total})");

    if !failures.is_empty() {
        anyhow::bail!("{failed} test(s) failed:\n  {}", failures.join("\n  "));
    }

    Ok(())
}

async fn run_node_compat_suite(runner: &CompiledTest, prefix: &str) -> anyhow::Result<()> {
    let config = load_config("tests/node_compat/config.jsonc")?;
    let tests = config.tests_matching(prefix);
    assert!(!tests.is_empty(), "No {prefix} tests found in config.jsonc");
    run_tests(runner, &tests, true).await
}

async fn run_node_compat_by_suite(runner: &CompiledTest, suite: &str) -> anyhow::Result<()> {
    let config = load_config("tests/node_compat/config.jsonc")?;
    let tests = config.tests_in_suite(suite);
    if tests.is_empty() {
        println!("  No {suite} tests found in config.jsonc, skipping");
        return Ok(());
    }
    run_tests(runner, &tests, false).await
}

// --- Tests ---

#[test]
async fn node_compat_btoa_atob(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-btoa-atob").await
}

#[test]
async fn node_compat_path(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-path").await
}

#[test]
async fn node_compat_assert(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-assert").await
}

#[test]
async fn node_compat_querystring(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-querystring").await
}

#[test]
async fn node_compat_url(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-url").await
}

#[test]
async fn node_compat_util(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-util").await
}

#[test]
async fn node_compat_fs(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-fs").await
}

#[test]
async fn node_compat_timers(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-timers").await
}

#[test]
async fn node_compat_events(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-events").await
}

#[test]
async fn node_compat_event_target(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-event-target").await
}

#[test]
async fn node_compat_eventtarget(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-eventtarget").await
}

#[test]
async fn node_compat_eventsource(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-eventsource").await
}

#[test]
async fn node_compat_abortcontroller(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-abortcontroller").await
}

#[test]
async fn node_compat_abortsignal(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-abortsignal").await
}

#[test]
async fn node_compat_aborted(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-aborted").await
}

#[test]
async fn node_compat_crypto(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-crypto").await
}

#[test]
async fn node_compat_stream(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-stream").await
}

#[test]
async fn node_compat_process_hrtime(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-process-hrtime").await
}

#[test]
async fn node_compat_buffer(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-buffer").await
}

#[test]
async fn node_compat_readable(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-readable").await
}

#[test]
async fn node_compat_console(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-console").await
}

#[test]
async fn node_compat_eval(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-eval").await
}

#[test]
async fn node_compat_event_emitter(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-event-emitter").await
}

#[test]
async fn node_compat_global(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-global").await
}

#[test]
async fn node_compat_module(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-module").await
}

#[test]
async fn node_compat_next_tick(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-next-tick").await
}

#[test]
async fn node_compat_require(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-require").await
}

#[test]
async fn node_compat_v8(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-v8").await
}

#[test]
async fn node_compat_vm(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-vm").await
}

#[test]
async fn node_compat_whatwg(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-whatwg").await
}

#[test]
async fn node_compat_test_runner(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_suite(runner, "test-runner").await
}

#[test]
async fn node_compat_misc(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    // Tests that don't fit into other prefix-based groups
    let config = load_config("tests/node_compat/config.jsonc")?;
    let all_other_prefixes = [
        "test-btoa-atob",
        "test-path",
        "test-assert",
        "test-querystring",
        "test-url",
        "test-util",
        "test-fs",
        "test-timers",
        "test-events",
        "test-event-target",
        "test-eventtarget",
        "test-eventsource",
        "test-abortcontroller",
        "test-abortsignal",
        "test-aborted",
        "test-crypto",
        "test-stream",
        "test-process-hrtime",
        "test-buffer",
        "test-readable",
        "test-console",
        "test-eval",
        "test-event-emitter",
        "test-global",
        "test-module",
        "test-next-tick",
        "test-require",
        "test-v8",
        "test-vm",
        "test-whatwg",
        "test-runner",
    ];
    let misc_tests: Vec<&TestEntry> = config
        .tests
        .iter()
        .filter(|t| {
            if !t.path.starts_with("parallel/") {
                return false;
            }
            let filename = t.path.rsplit('/').next().unwrap_or(&t.path);
            !all_other_prefixes.iter().any(|p| filename.starts_with(p))
        })
        .collect();

    if misc_tests.is_empty() {
        println!("  No miscellaneous tests found, skipping");
        return Ok(());
    }

    run_tests(runner, &misc_tests, true).await
}

// --- es-module suite ---

#[test]
async fn node_compat_es_module(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_by_suite(runner, "es-module").await
}

// --- sequential suite ---

#[test]
async fn node_compat_sequential(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    run_node_compat_by_suite(runner, "sequential").await
}

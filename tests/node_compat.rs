test_r::enable!();

use crate::common::{CompiledTest, PreparedComponent, TestInstance, setup_node_compat_test_files};
use camino::Utf8Path;
use std::collections::BTreeMap;
use std::fs;
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
}

/// Strip JSONC comments (// and /* */) while respecting string literals.
fn strip_jsonc_comments(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Inside a string literal
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
                result.push(chars[i]); // closing quote
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '/' {
            // Line comment — skip to end of line
            i += 2;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '*' {
            // Block comment — skip to */
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2; // skip */
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    result
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

async fn run_node_compat_suite(runner: &CompiledTest, prefix: &str) -> anyhow::Result<()> {
    let config = load_config("tests/node_compat/config.jsonc")?;
    let tests = config.tests_matching(prefix);

    assert!(!tests.is_empty(), "No {prefix} tests found in config.jsonc");

    let prepared = PreparedComponent::new(runner.wasm_path())?;

    let mut results: BTreeMap<String, String> = BTreeMap::new();
    let mut failures = Vec::new();

    for entry in &tests {
        if entry.skip {
            let reason = entry.reason.as_deref().unwrap_or("no reason");
            println!("  {} ... SKIP ({})", entry.path, reason);
            results.insert(entry.path.clone(), format!("SKIP: {reason}"));
            continue;
        }

        let mut instance = TestInstance::from_prepared(&prepared).await?;
        setup_test_files(&instance, &entry.path)?;

        let guest_path = format!("/tests/{}", entry.path);

        let (result, stdout, stderr) = instance
            .invoke_and_capture_output_with_stderr(None, "run-test", &[Val::String(guest_path)])
            .await;

        match result {
            Ok(Some(Val::String(ref s))) => {
                if s.starts_with("PASS") {
                    println!("  {} ... ok", entry.path);
                    results.insert(entry.path.clone(), "PASS".to_string());
                } else if let Some(reason) = s.strip_prefix("SKIP:") {
                    println!("  {} ... SKIP ({})", entry.path, reason.trim());
                    results.insert(entry.path.clone(), s.clone());
                } else {
                    println!("  {} ... FAIL", entry.path);
                    println!("    {}", s);
                    if !stdout.is_empty() {
                        println!("    [stdout] {}", stdout.trim());
                    }
                    if !stderr.is_empty() {
                        println!("    [stderr] {}", stderr.trim());
                    }
                    results.insert(entry.path.clone(), s.clone());
                    failures.push(entry.path.clone());
                }
            }
            Ok(other) => {
                let msg = format!("Unexpected return value: {other:?}");
                println!("  {} ... FAIL ({})", entry.path, msg);
                if !stdout.is_empty() {
                    println!("    [stdout] {}", stdout.trim());
                }
                if !stderr.is_empty() {
                    println!("    [stderr] {}", stderr.trim());
                }
                results.insert(entry.path.clone(), format!("FAIL: {msg}"));
                failures.push(entry.path.clone());
            }
            Err(e) => {
                let msg = format!("Invocation error: {e}");
                println!("  {} ... FAIL ({})", entry.path, msg);
                if !stdout.is_empty() {
                    println!("    [stdout] {}", stdout.trim());
                }
                if !stderr.is_empty() {
                    println!("    [stderr] {}", stderr.trim());
                }
                results.insert(entry.path.clone(), format!("FAIL: {msg}"));
                failures.push(entry.path.clone());
            }
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

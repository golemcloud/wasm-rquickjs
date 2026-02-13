test_r::enable!();

use crate::common::{CompiledTest, TestInstance};
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
    let temp = instance.temp_dir_path();

    // Create directory structure: /tests/parallel/ and /tests/common/
    let parallel_dir = temp.join("tests").join("parallel");
    let common_dir = temp.join("tests").join("common");
    fs::create_dir_all(&parallel_dir)?;
    fs::create_dir_all(&common_dir)?;

    // Copy the test file
    let test_filename = test_rel_path.rsplit('/').next().unwrap_or(test_rel_path);
    let src_test = format!("tests/node_compat/suite/{test_rel_path}");
    let dst_test = parallel_dir.join(test_filename);
    fs::copy(&src_test, &dst_test)?;

    // Copy the common shim
    let src_shim = "tests/node_compat/common-shim/index.js";
    let dst_shim = common_dir.join("index.js");
    fs::copy(src_shim, &dst_shim)?;

    Ok(())
}

// --- Tests ---

#[test]
async fn node_compat_path(
    #[tagged_as("node_compat_runner")] runner: &CompiledTest,
) -> anyhow::Result<()> {
    let config = load_config("tests/node_compat/config.jsonc")?;
    let path_tests = config.tests_matching("test-path");

    assert!(
        !path_tests.is_empty(),
        "No test-path tests found in config.jsonc"
    );

    let mut results: BTreeMap<String, String> = BTreeMap::new();
    let mut failures = Vec::new();

    for entry in &path_tests {
        if entry.skip {
            let reason = entry.reason.as_deref().unwrap_or("no reason");
            println!("  {} ... SKIP ({})", entry.path, reason);
            results.insert(entry.path.clone(), format!("SKIP: {reason}"));
            continue;
        }

        let mut instance = TestInstance::new(runner.wasm_path()).await?;
        setup_test_files(&instance, &entry.path)?;

        let guest_path = format!("/tests/{}", entry.path);

        let (result, stdout, stderr) = instance
            .invoke_and_capture_output_with_stderr(
                None,
                "run-test",
                &[Val::String(guest_path)],
            )
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

    // Summary
    let total = path_tests.len();
    let passed = results.values().filter(|v| *v == "PASS").count();
    let skipped = results.values().filter(|v| v.starts_with("SKIP")).count();
    let failed = failures.len();
    println!("\n  Results: {passed} passed, {failed} failed, {skipped} skipped (total {total})");

    if !failures.is_empty() {
        anyhow::bail!("{failed} test(s) failed:\n  {}", failures.join("\n  "));
    }

    Ok(())
}

//! Resumable node_compat classification validator.
//!
//! This harness expands `tests/node_compat/config.jsonc` into the same file/subtest inventory as
//! the dynamic runner, executes each entry directly through the node-compat runner component, and
//! appends one JSON object per validated entry to a JSONL file. On restart, already-recorded keys
//! are skipped.
//!
//! Usage:
//!   NODE_COMPAT_VALIDATE_RESULTS=tmp/node-compat-validation/results.jsonl \
//!     cargo test --test node_compat_validate -- --nocapture
//!
//! Useful optional environment variables:
//!   NODE_COMPAT_VALIDATE_LIMIT=10       # stop after N new entries
//!   NODE_COMPAT_VALIDATE_START_AFTER=...# skip until after this expanded key

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

use camino::Utf8Path;
use common::js_subtest_parser::{
    SubtestDiscovery, discover_subtests_with_options, rewrite_for_block, rewrite_for_node_test,
};
use common::{
    CompiledTest, GolemPreparedComponent, NodeCompatCategory, TestInstance,
    load_node_compat_config, setup_node_compat_test_files,
};
use serde_json::json;
use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::time::timeout;
use wasmtime::component::Val;

#[derive(Clone)]
struct ValidationCase {
    key: String,
    path: String,
    category: NodeCompatCategory,
    reason: Option<String>,
    timeout_secs: u64,
    subtest_index: Option<usize>,
    nested_node_test: bool,
}

#[derive(Debug)]
enum ActualResult {
    Pass,
    Skip(String),
    Fail(String),
    Error(String),
}

fn main() -> anyhow::Result<()> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?
        .block_on(async_main())
}

async fn async_main() -> anyhow::Result<()> {
    let results_path = std::env::var("NODE_COMPAT_VALIDATE_RESULTS")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("tmp/node-compat-validation/results.jsonl"));
    let limit = std::env::var("NODE_COMPAT_VALIDATE_LIMIT")
        .ok()
        .and_then(|v| v.parse::<usize>().ok());
    let start_after = std::env::var("NODE_COMPAT_VALIDATE_START_AFTER").ok();

    let cases = load_cases()?;
    let completed = load_completed_keys(&results_path)?;
    let pending_count = cases
        .iter()
        .filter(|case| !completed.contains(&case.key))
        .count();

    println!(
        "Loaded {} validation cases ({} completed, {} pending). Results: {}",
        cases.len(),
        completed.len(),
        pending_count,
        results_path.display()
    );

    if limit == Some(0) || pending_count == 0 {
        return Ok(());
    }

    let prepared = prepare_runner().await?;
    if let Some(parent) = results_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut results_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&results_path)?;

    let mut source_cache: BTreeMap<String, (String, SubtestDiscovery)> = BTreeMap::new();
    let mut processed = 0usize;
    let mut seen_start = start_after.is_none();

    for case in cases {
        if !seen_start {
            if start_after.as_deref() == Some(case.key.as_str()) {
                seen_start = true;
            }
            continue;
        }
        if completed.contains(&case.key) {
            continue;
        }
        if limit.is_some_and(|limit| processed >= limit) {
            break;
        }

        let started = Instant::now();
        println!(
            "[{}/{}] {} ({})",
            processed + 1,
            limit.unwrap_or(pending_count),
            case.key,
            category_id(case.category)
        );

        let actual = run_case(&prepared, &case, &mut source_cache).await;
        let elapsed_ms = started.elapsed().as_millis();
        let validation = validation_status(case.category, case.reason.as_deref(), &actual);

        let record = json!({
            "key": case.key,
            "path": case.path,
            "category": category_id(case.category),
            "reason": case.reason,
            "actual": actual_json(&actual),
            "validation": validation,
            "elapsed_ms": elapsed_ms,
        });
        serde_json::to_writer(&mut results_file, &record)?;
        writeln!(results_file)?;
        results_file.flush()?;

        println!("  -> {} ({elapsed_ms}ms)", validation);
        processed += 1;
    }

    println!("Validated {processed} new case(s).");
    Ok(())
}

fn load_cases() -> anyhow::Result<Vec<ValidationCase>> {
    let entries = load_node_compat_config("tests/node_compat/config.jsonc")?;
    let mut cases = Vec::new();
    for entry in entries {
        if entry.split && !entry.subtests.is_empty() {
            for subtest in entry.subtests {
                cases.push(ValidationCase {
                    key: format!("{}#{}", entry.path, subtest.name),
                    path: entry.path.clone(),
                    category: subtest.category,
                    reason: subtest.reason,
                    timeout_secs: entry.timeout_secs,
                    subtest_index: Some(subtest.index),
                    nested_node_test: entry.nested_node_test,
                });
            }
        } else {
            cases.push(ValidationCase {
                key: entry.path.clone(),
                path: entry.path,
                category: entry.category,
                reason: entry.reason,
                timeout_secs: entry.timeout_secs,
                subtest_index: None,
                nested_node_test: entry.nested_node_test,
            });
        }
    }
    Ok(cases)
}

fn load_completed_keys(path: &Path) -> anyhow::Result<BTreeSet<String>> {
    let mut completed = BTreeSet::new();
    if !path.exists() {
        return Ok(completed);
    }

    let file = fs::File::open(path)?;
    for line in BufReader::new(file).lines() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&line)
            && let Some(key) = value.get("key").and_then(|v| v.as_str())
        {
            completed.insert(key.to_string());
        }
    }
    Ok(completed)
}

async fn prepare_runner() -> anyhow::Result<Arc<GolemPreparedComponent>> {
    let path = Utf8Path::new("examples/runtime/node-compat-runner");
    let compiled = CompiledTest::new_with_features(
        path,
        true,
        common::FeatureCombination::FullNoLoggingWithGolem,
    )
    .await?;
    Ok(Arc::new(GolemPreparedComponent::new(compiled.wasm_path())?))
}

async fn run_case(
    prepared: &Arc<GolemPreparedComponent>,
    case: &ValidationCase,
    source_cache: &mut BTreeMap<String, (String, SubtestDiscovery)>,
) -> ActualResult {
    let result: anyhow::Result<ActualResult> = async {
        let mut instance = TestInstance::from_golem_prepared(prepared).await?;
        instance.set_epoch_deadline(case.timeout_secs);
        setup_node_compat_test_files(instance.temp_dir_path(), &case.path)?;

        if let Some(index) = case.subtest_index {
            let (source, discovery) =
                load_split_source(&case.path, case.nested_node_test, source_cache)?;
            let rewritten = match discovery {
                SubtestDiscovery::Block(blocks) => rewrite_for_block(source, blocks, index),
                SubtestDiscovery::NodeTest(tests) => rewrite_for_node_test(source, tests, index),
                SubtestDiscovery::None => source.to_string(),
            };
            let test_filename = case.path.rsplit('/').next().unwrap_or(&case.path);
            let suite = case.path.split('/').next().unwrap_or("parallel");
            let rewritten_path = instance
                .temp_dir_path()
                .join("home")
                .join("node")
                .join("test")
                .join(suite)
                .join(test_filename);
            fs::write(&rewritten_path, &rewritten)?;
        }

        let guest_path = format!("/home/node/test/{}", case.path);
        let invocation = async {
            instance
                .invoke_and_capture_output_with_stderr(None, "run-test", &[Val::String(guest_path)])
                .await
        };

        match timeout(Duration::from_secs(case.timeout_secs), invocation).await {
            Ok((result, stdout, stderr)) => Ok(parse_invocation_result(result, stdout, stderr)),
            Err(_) => {
                let stdout = instance.read_stdout().unwrap_or_default();
                let stderr = instance.read_stderr().unwrap_or_default();
                Ok(ActualResult::Error(format!(
                    "Timeout after {}s\n[stdout]\n{}\n[stderr]\n{}",
                    case.timeout_secs,
                    stdout.trim(),
                    stderr.trim()
                )))
            }
        }
    }
    .await;

    match result {
        Ok(actual) => actual,
        Err(err) => ActualResult::Error(format!("{err:#}")),
    }
}

fn load_split_source<'a>(
    path: &str,
    nested_node_test: bool,
    source_cache: &'a mut BTreeMap<String, (String, SubtestDiscovery)>,
) -> anyhow::Result<(&'a str, &'a SubtestDiscovery)> {
    let cache_key = format!("{path}#{nested_node_test}");
    if !source_cache.contains_key(&cache_key) {
        let source = fs::read_to_string(format!("tests/node_compat/suite/{path}"))?;
        let discovery = discover_subtests_with_options(path, &source, nested_node_test);
        source_cache.insert(cache_key.clone(), (source, discovery));
    }
    let (source, discovery) = source_cache
        .get(&cache_key)
        .expect("split source was just inserted");
    Ok((source.as_str(), discovery))
}

fn parse_invocation_result(
    result: anyhow::Result<Option<Val>>,
    stdout: String,
    stderr: String,
) -> ActualResult {
    match result {
        Ok(Some(Val::String(ref s))) if s.starts_with("PASS") => ActualResult::Pass,
        Ok(Some(Val::String(ref s))) if s.starts_with("SKIP:") => {
            ActualResult::Skip(s.strip_prefix("SKIP:").unwrap().trim().to_string())
        }
        Ok(Some(Val::String(ref s))) if s.starts_with("FAIL:") => {
            ActualResult::Fail(s.strip_prefix("FAIL:").unwrap().trim().to_string())
        }
        Ok(Some(Val::String(s))) => ActualResult::Fail(s),
        Ok(other) => ActualResult::Fail(format!(
            "Unexpected return: {other:?}\n[stdout]\n{}\n[stderr]\n{}",
            stdout.trim(),
            stderr.trim()
        )),
        Err(err) => ActualResult::Error(format!(
            "Invocation error: {err:#}\n[stdout]\n{}\n[stderr]\n{}",
            stdout.trim(),
            stderr.trim()
        )),
    }
}

fn validation_status(
    category: NodeCompatCategory,
    reason: Option<&str>,
    actual: &ActualResult,
) -> &'static str {
    let has_reason = reason.is_some_and(|reason| !reason.trim().is_empty());
    match category {
        NodeCompatCategory::Runnable => match actual {
            ActualResult::Pass => "ok",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => "mismatch",
        },
        NodeCompatCategory::KnownGap => match actual {
            ActualResult::Pass => "stale-pass",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_)
                if has_reason =>
            {
                "ok-observed-gap"
            }
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => {
                "missing-reason"
            }
        },
        NodeCompatCategory::WasmImpossible => match actual {
            ActualResult::Pass => "mismatch-pass",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_)
                if has_reason =>
            {
                "ok-observed-impossible"
            }
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => {
                "missing-reason"
            }
        },
        NodeCompatCategory::EngineDifference => match actual {
            ActualResult::Pass => "mismatch-pass",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_)
                if has_reason =>
            {
                "ok-observed-engine-difference"
            }
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => {
                "missing-reason"
            }
        },
        NodeCompatCategory::NodeInternals => match actual {
            ActualResult::Pass => "stale-pass",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => {
                "ok-observed-internals"
            }
        },
        NodeCompatCategory::Unevaluated => match actual {
            ActualResult::Pass => "needs-triage-pass",
            ActualResult::Skip(_) | ActualResult::Fail(_) | ActualResult::Error(_) => {
                "needs-triage"
            }
        },
    }
}

fn actual_json(actual: &ActualResult) -> serde_json::Value {
    match actual {
        ActualResult::Pass => json!({ "result": "pass" }),
        ActualResult::Skip(message) => json!({ "result": "skip", "message": message }),
        ActualResult::Fail(message) => json!({ "result": "fail", "message": message }),
        ActualResult::Error(message) => json!({ "result": "error", "message": message }),
    }
}

fn category_id(category: NodeCompatCategory) -> &'static str {
    match category {
        NodeCompatCategory::Runnable => "runnable",
        NodeCompatCategory::KnownGap => "known-gap",
        NodeCompatCategory::WasmImpossible => "wasi-impossible",
        NodeCompatCategory::EngineDifference => "engine-difference",
        NodeCompatCategory::NodeInternals => "node-internals",
        NodeCompatCategory::Unevaluated => "unevaluated",
    }
}

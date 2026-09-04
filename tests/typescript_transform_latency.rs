//! Bounded manual measurements for synchronous native TypeScript transformation.
//!
//! The default path validates checked-in reports. Set
//! `TYPESCRIPT_TRANSFORM_LATENCY_MEASURE=1` to execute the workloads.

#![allow(dead_code)]

#[path = "common/mod.rs"]
mod common;

use camino::Utf8Path;
use common::{CompiledTest, FeatureCombination, TestInstance, test_target};
use serde_json::{Value, json};
use std::fs;
use std::io::Read as _;
use std::process::Command;
use std::time::{Duration, Instant};
use wasmtime::component::Val;

const EXAMPLE_DIR: &str = "examples/runtime/typescript-transform-latency";
const RESULTS_DIR: &str = "tests/typescript_transform_latency/results";
const INVOCATION_DEADLINE_SECONDS: u64 = 120;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    if std::env::var_os("TYPESCRIPT_TRANSFORM_LATENCY_MEASURE").is_none() {
        return validate_checked_reports();
    }

    let mode = std::env::var("TYPESCRIPT_TRANSFORM_LATENCY_MODE").map_err(|_| {
        anyhow::anyhow!("TYPESCRIPT_TRANSFORM_LATENCY_MODE must be strip or transform")
    })?;
    let features = match mode.as_str() {
        "strip" => FeatureCombination::TypeScriptRuntime,
        "transform" => FeatureCombination::TypeScriptTransformRuntime,
        _ => anyhow::bail!("TYPESCRIPT_TRANSFORM_LATENCY_MODE must be strip or transform"),
    };
    let sizes = parse_sizes()?;
    let iterations = std::env::var("TYPESCRIPT_TRANSFORM_LATENCY_ITERATIONS")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(3);
    anyhow::ensure!(iterations >= 3, "at least three iterations are required");

    let build_started = Instant::now();
    let compiled =
        CompiledTest::new_with_features(Utf8Path::new(EXAMPLE_DIR), true, features).await?;
    let build_ms = millis(build_started.elapsed());
    let component_bytes = fs::metadata(compiled.wasm_path())?.len();
    let instantiate_started = Instant::now();
    let mut instance = TestInstance::new_with_memory_tracking(compiled.wasm_path()).await?;
    let instantiate_ms = millis(instantiate_started.elapsed());

    let mut cases = Vec::new();
    for size in &sizes {
        let mut kinds = vec!["api", "inline", "entry", "esm", "prepared-esm", "cjs"];
        if mode == "transform" {
            kinds.push("transform-only");
        }
        for kind in kinds {
            eprintln!("measuring {mode}/{kind}/{size} bytes");
            let mut samples = Vec::new();
            for sample in 0..iterations {
                samples.push(
                    invoke_json(
                        &mut instance,
                        "measure-case",
                        &[
                            Val::String(kind.to_string()),
                            Val::U64(*size),
                            Val::U64(sample as u64),
                        ],
                    )
                    .await?,
                );
            }
            cases.push(json!({
                "kind": kind,
                "sourceBytes": size,
                "summary": summarize(&samples),
            }));
        }
    }

    let largest = *sizes.last().unwrap();
    eprintln!("probing {mode} controls at {largest} bytes");
    let controls = invoke_json(&mut instance, "probe-controls", &[Val::U64(largest)]).await?;
    eprintln!("probing {mode} concurrency at {largest} bytes");
    let concurrency = invoke_json(&mut instance, "probe-concurrency", &[Val::U64(largest)]).await?;
    let report = json!({
        "schemaVersion": 1,
        "environment": environment()?,
        "inputs": {
            "runtimeHash": runtime_hash()?,
            "benchmarkHash": benchmark_hash()?,
        },
        "target": format!("{:?}", test_target()).to_lowercase(),
        "mode": mode,
        "iterations": iterations,
        "sizesBytes": sizes,
        "component": {
            "bytes": component_bytes,
            "blake3": hash_file(compiled.wasm_path())?,
            "buildMs": build_ms,
            "instantiateMs": instantiate_ms,
        },
        "cases": cases,
        "controlsAtLargestSize": controls,
        "concurrencyAtLargestSize": concurrency,
        "wasmLinearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "notes": [
            "manual local measurement; timings are not CI thresholds",
            "execution-path samples use fresh jobs and unique filesystem module paths; direct API samples run in the outer runtime",
            "the timeout deadline and cancellation timer are armed before the synchronous native transform; the cancellation call is delivered after the outer runtime regains control",
            "linear-memory values are monotone instance-wide high-water observations, not retained-allocation measurements",
        ],
    });
    validate_report(&report)?;
    let encoded = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("TYPESCRIPT_TRANSFORM_LATENCY_REPORT") {
        fs::write(path, format!("{encoded}\n"))?;
    }
    println!("{encoded}");
    Ok(())
}

fn parse_sizes() -> anyhow::Result<Vec<u64>> {
    let configured = std::env::var("TYPESCRIPT_TRANSFORM_LATENCY_SIZES")
        .unwrap_or_else(|_| "4096,16384,65536".to_string());
    let sizes = configured
        .split(',')
        .map(|value| value.trim().parse::<u64>())
        .collect::<Result<Vec<_>, _>>()?;
    anyhow::ensure!(
        sizes.len() >= 3
            && sizes.iter().all(|size| *size > 0)
            && sizes.windows(2).all(|pair| pair[0] < pair[1]),
        "sizes must contain at least three increasing positive byte counts"
    );
    Ok(sizes)
}

async fn invoke_json(
    instance: &mut TestInstance,
    function: &str,
    args: &[Val],
) -> anyhow::Result<Value> {
    instance.set_epoch_deadline(INVOCATION_DEADLINE_SECONDS);
    let started = Instant::now();
    let value = instance.invoke(None, function, args).await?;
    let Some(Val::String(encoded)) = value else {
        anyhow::bail!("{function} did not return a JSON string")
    };
    Ok(json!({
        "outerWallMs": millis(started.elapsed()),
        "linearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "result": serde_json::from_str::<Value>(&encoded)?,
    }))
}

fn summarize(samples: &[Value]) -> Value {
    let mut elapsed = samples
        .iter()
        .filter_map(|sample| sample.pointer("/result/elapsedMs").and_then(Value::as_f64))
        .collect::<Vec<_>>();
    elapsed.sort_by(f64::total_cmp);
    json!({
        "iterations": samples.len(),
        "medianMs": elapsed[elapsed.len() / 2],
        "maximumMs": elapsed[elapsed.len() - 1],
        "samples": samples,
    })
}

fn validate_checked_reports() -> anyhow::Result<()> {
    let directory = Utf8Path::new(RESULTS_DIR);
    anyhow::ensure!(directory.exists(), "checked report directory is missing");
    let current_runtime_hash = runtime_hash()?;
    let current_benchmark_hash = benchmark_hash()?;
    let mut profiles = std::collections::BTreeSet::new();
    for entry in fs::read_dir(directory)? {
        let path = entry?.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let report: Value = serde_json::from_slice(&fs::read(&path)?)?;
        validate_report(&report).map_err(|error| anyhow::anyhow!("{}: {error}", path.display()))?;
        anyhow::ensure!(
            report["inputs"]["runtimeHash"] == current_runtime_hash
                && report["inputs"]["benchmarkHash"] == current_benchmark_hash,
            "{} is stale for the current source",
            path.display()
        );
        anyhow::ensure!(
            report["sizesBytes"] == json!([4096, 16384, 65536]),
            "{} does not use the calibrated requested 4/16/64 KiB size matrix",
            path.display()
        );
        let profile = (
            report["target"].as_str().unwrap().to_string(),
            report["mode"].as_str().unwrap().to_string(),
        );
        anyhow::ensure!(profiles.insert(profile), "duplicate target/mode report");
        let expected_suffix = format!(
            "-{}-{}-{}-{}.json",
            report["target"].as_str().unwrap(),
            report["mode"].as_str().unwrap(),
            report["environment"]["os"].as_str().unwrap(),
            report["environment"]["arch"].as_str().unwrap(),
        );
        anyhow::ensure!(
            path.file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.ends_with(&expected_suffix)),
            "{} filename does not match report metadata",
            path.display()
        );
    }
    anyhow::ensure!(
        profiles
            == [
                ("p2", "strip"),
                ("p2", "transform"),
                ("p3", "strip"),
                ("p3", "transform")
            ]
            .into_iter()
            .map(|(target, mode)| (target.to_string(), mode.to_string()))
            .collect(),
        "checked reports must contain exactly one complete P2/P3 by strip/transform matrix"
    );
    Ok(())
}

fn validate_report(report: &Value) -> anyhow::Result<()> {
    anyhow::ensure!(report["schemaVersion"] == 1, "unexpected report schema");
    anyhow::ensure!(
        report["environment"]["commitHint"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
            && report["environment"]["rustc"]
                .as_str()
                .is_some_and(|value| !value.is_empty())
            && report["inputs"]["runtimeHash"]
                .as_str()
                .is_some_and(is_blake3)
            && report["inputs"]["benchmarkHash"]
                .as_str()
                .is_some_and(is_blake3)
            && report["component"]["blake3"]
                .as_str()
                .is_some_and(is_blake3),
        "report source or component identity is incomplete"
    );
    anyhow::ensure!(
        matches!(report["target"].as_str(), Some("p2" | "p3"))
            && matches!(report["mode"].as_str(), Some("strip" | "transform")),
        "invalid target or mode"
    );
    let sizes = report["sizesBytes"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("missing sizes"))?;
    anyhow::ensure!(
        sizes.len() >= 3
            && sizes
                .iter()
                .all(|size| size.as_u64().is_some_and(|size| size > 0))
            && sizes
                .windows(2)
                .all(|pair| pair[0].as_u64() < pair[1].as_u64()),
        "report needs at least three increasing positive sizes"
    );
    let iterations = report["iterations"]
        .as_u64()
        .ok_or_else(|| anyhow::anyhow!("missing iteration count"))?;
    anyhow::ensure!(iterations >= 3, "report needs at least three iterations");
    let cases = report["cases"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("missing cases"))?;
    let expected_kinds = if report["mode"] == "transform" {
        vec![
            "api",
            "inline",
            "entry",
            "esm",
            "prepared-esm",
            "cjs",
            "transform-only",
        ]
    } else {
        vec!["api", "inline", "entry", "esm", "prepared-esm", "cjs"]
    };
    anyhow::ensure!(
        cases.len() == sizes.len() * expected_kinds.len(),
        "incomplete path matrix"
    );
    let mut matrix = std::collections::BTreeSet::new();
    for case in cases {
        let kind = case["kind"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("case is missing its kind"))?;
        let source_bytes = case["sourceBytes"]
            .as_u64()
            .ok_or_else(|| anyhow::anyhow!("case is missing its source size"))?;
        anyhow::ensure!(
            expected_kinds.contains(&kind)
                && sizes.iter().any(|size| size.as_u64() == Some(source_bytes))
                && matrix.insert((source_bytes, kind)),
            "unexpected or duplicate path/size case"
        );
        let samples = case["summary"]["samples"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("missing case samples"))?;
        anyhow::ensure!(
            samples.len() as u64 == iterations
                && case["summary"]["iterations"] == json!(iterations),
            "case iteration count differs from report"
        );
        let mut elapsed = Vec::with_capacity(samples.len());
        for sample in samples {
            let valid_value = if case["kind"] == "api" {
                sample
                    .pointer("/result/outputBytes")
                    .and_then(Value::as_u64)
                    .is_some_and(|bytes| bytes > 0)
            } else {
                sample.pointer("/result/value") == Some(&json!(42))
            };
            anyhow::ensure!(
                valid_value && sample.pointer("/result/overflowed") == Some(&json!(false)),
                "transform case returned an invalid result"
            );
            anyhow::ensure!(
                sample.pointer("/result/requestedSourceBytes") == Some(&json!(source_bytes)),
                "sample source size differs from its case"
            );
            elapsed.push(
                sample
                    .pointer("/result/elapsedMs")
                    .and_then(Value::as_f64)
                    .ok_or_else(|| anyhow::anyhow!("sample is missing elapsed time"))?,
            );
        }
        elapsed.sort_by(f64::total_cmp);
        anyhow::ensure!(
            approximately_equal(
                case["summary"]["medianMs"].as_f64(),
                Some(elapsed[elapsed.len() / 2])
            ) && approximately_equal(
                case["summary"]["maximumMs"].as_f64(),
                elapsed.last().copied()
            ),
            "case summary does not match raw samples"
        );
    }
    let controls = &report["controlsAtLargestSize"]["result"];
    anyhow::ensure!(
        controls["timeout"]["timedOut"] == true
            && controls["cancellation"]["cancelled"] == true
            && controls["timeout"]["completedMs"].as_f64().is_some()
            && controls["cancellation"]["issuedMs"].as_f64().is_some()
            && controls["cancellation"]["completedMs"].as_f64().is_some(),
        "control probe did not observe timeout and cancellation"
    );
    let concurrency = &report["concurrencyAtLargestSize"]["result"];
    anyhow::ensure!(
        concurrency["requestedMs"] == 1
            && concurrency["outputBytes"]
                .as_u64()
                .is_some_and(|bytes| bytes > 0)
            && concurrency["baselineTimerMs"].as_f64().is_some()
            && concurrency["transformMs"].as_f64().is_some()
            && concurrency["siblingIssuedMs"].as_f64().is_some()
            && concurrency["incrementalSiblingDelayMs"].as_f64().is_some(),
        "concurrency probe failed"
    );
    anyhow::ensure!(
        report["wasmLinearMemoryHighWaterBytes"]
            .as_u64()
            .is_some_and(|bytes| bytes > 0),
        "missing linear-memory high-water observation"
    );
    Ok(())
}

fn approximately_equal(left: Option<f64>, right: Option<f64>) -> bool {
    left.zip(right)
        .is_some_and(|(left, right)| (left - right).abs() <= f64::EPSILON * 8.0)
}

fn millis(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1000.0
}

fn environment() -> anyhow::Result<Value> {
    let source_root = source_root();
    let dirty = !command_text(Command::new("git").args([
        "-C",
        source_root.as_str(),
        "status",
        "--porcelain",
        "--",
        ".",
        ":(exclude)tests/typescript_transform_latency/results/*.json",
    ]))?
    .is_empty();
    Ok(json!({
        "commitHint": command_text(Command::new("git").args(["-C", source_root.as_str(), "rev-parse", "HEAD"]))?,
        "dirty": dirty,
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rustc": command_text(Command::new("rustc").arg("--version"))?,
        "cargo": command_text(Command::new("cargo").arg("--version"))?,
        "artifactCache": std::env::var("WASM_RQUICKJS_TEST_ARTIFACT_CACHE").ok(),
        "wasmtimeCache": std::env::var("WASM_RQUICKJS_TEST_WASMTIME_CACHE").ok(),
        "unoptimized": std::env::var("WASM_RQUICKJS_TEST_UNOPTIMIZED").ok(),
    }))
}

fn command_text(command: &mut Command) -> anyhow::Result<String> {
    let output = command.output()?;
    anyhow::ensure!(
        output.status.success(),
        "command failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(String::from_utf8(output.stdout)?.trim().to_string())
}

fn composite_hash(files: &[&str], directories: &[&str]) -> anyhow::Result<String> {
    let source_root = source_root();
    let mut paths = files
        .iter()
        .map(|path| camino::Utf8PathBuf::from(*path))
        .collect::<std::collections::BTreeSet<_>>();
    for directory in directories {
        collect_input_files(&source_root, Utf8Path::new(directory), &mut paths)?;
    }
    let mut hasher = blake3::Hasher::new();
    for path in paths {
        let bytes = fs::read(source_root.join(&path))?;
        hasher.update(&(path.as_str().len() as u64).to_le_bytes());
        hasher.update(path.as_str().as_bytes());
        hasher.update(&(bytes.len() as u64).to_le_bytes());
        hasher.update(&bytes);
    }
    Ok(hasher.finalize().to_hex().to_string())
}

fn runtime_hash() -> anyhow::Result<String> {
    composite_hash(
        &[
            "Cargo.toml",
            "Cargo.lock",
            ".github/scripts/enable-wasmtime-fork.sh",
            "crates/wasm-rquickjs/Cargo.toml",
            "crates/wasi-logging/Cargo.toml",
            "crates/wasm-rquickjs/skeleton/Cargo.toml_",
            "crates/wasm-rquickjs/skeleton/Cargo.lock",
        ],
        &[
            "crates/wasm-rquickjs/src",
            "crates/wasm-rquickjs/skeleton/src",
            "crates/wasi-logging/src",
        ],
    )
}

fn benchmark_hash() -> anyhow::Result<String> {
    composite_hash(
        &[
            "tests/typescript_transform_latency.rs",
            "tests/typescript_transform_latency/run.sh",
            "tools/dev-test.sh",
        ],
        &[
            "examples/runtime/typescript-transform-latency",
            "tests/common",
        ],
    )
}

fn collect_input_files(
    source_root: &Utf8Path,
    directory: &Utf8Path,
    files: &mut std::collections::BTreeSet<camino::Utf8PathBuf>,
) -> anyhow::Result<()> {
    for entry in fs::read_dir(source_root.join(directory))? {
        let entry = entry?;
        let name = entry
            .file_name()
            .into_string()
            .map_err(|name| anyhow::anyhow!("non-UTF-8 input name: {}", name.to_string_lossy()))?;
        let path = directory.join(name);
        let metadata = fs::symlink_metadata(source_root.join(&path))?;
        anyhow::ensure!(
            !metadata.file_type().is_symlink(),
            "input symlink is unsupported: {path}"
        );
        if metadata.is_dir() {
            collect_input_files(source_root, &path, files)?;
        } else {
            anyhow::ensure!(metadata.is_file(), "unsupported input type: {path}");
            files.insert(path);
        }
    }
    Ok(())
}

fn source_root() -> camino::Utf8PathBuf {
    std::env::var("TYPESCRIPT_TRANSFORM_LATENCY_SOURCE_ROOT")
        .unwrap_or_else(|_| ".".to_string())
        .into()
}

fn hash_file(path: &Utf8Path) -> anyhow::Result<String> {
    let mut file = fs::File::open(path)?;
    let mut hasher = blake3::Hasher::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(hasher.finalize().to_hex().to_string())
}

fn is_blake3(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

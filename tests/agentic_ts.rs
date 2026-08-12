//! Manual agentic TypeScript compatibility and performance suite.
//!
//! Use `tests/agentic_ts/run.sh`; this target is intentionally not part of CI.

#![allow(dead_code)]

#[path = "common/mod.rs"]
mod common;

use camino::Utf8Path;
use common::{CompiledTest, FeatureCombination, TestInstance, copy_dir_recursive, test_target};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::fs;
use std::io::Write as _;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use wasmtime::component::Val;

const SUITE_DIR: &str = "tests/agentic_ts";
const EXAMPLE_DIR: &str = "examples/runtime/agentic-ts";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    if let Ok(path) = std::env::var("AGENTIC_TS_REPORT_TO_CHECK") {
        return check_report(Utf8Path::new(&path));
    }
    verify_toolchain()?;
    let iterations = std::env::var("AGENTIC_TS_ITERATIONS")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(5);
    anyhow::ensure!(
        iterations >= 5,
        "AGENTIC_TS_ITERATIONS must be at least 5 to assess a warmed plateau"
    );

    let build_started = Instant::now();
    let compiled = CompiledTest::new_with_features(
        Utf8Path::new(EXAMPLE_DIR),
        true,
        FeatureCombination::TypeScriptTransformRuntime,
    )
    .await?;
    let build_elapsed = build_started.elapsed();
    let component_size = fs::metadata(compiled.wasm_path())?.len();

    let instantiate_started = Instant::now();
    let mut instance = TestInstance::new_with_memory_tracking(compiled.wasm_path()).await?;
    instance.set_epoch_deadline(900);
    let instantiate_elapsed = instantiate_started.elapsed();
    prepare_workspace(&instance)?;

    let node_baseline = node_baseline()?;
    let cold = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&["--noEmit", "-p", "projects/core/tsconfig.json"]),
            Val::U64(300_000),
        ],
    )
    .await?;

    let mut unchanged = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        unchanged.push(
            timed_invoke(
                &mut instance,
                "run-tsc",
                &[
                    string_list(&["--noEmit", "-p", "projects/core/tsconfig.json"]),
                    Val::U64(300_000),
                ],
            )
            .await?,
        );
    }

    let incremental_cold = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&[
                "--noEmit",
                "--incremental",
                "--tsBuildInfoFile",
                ".cache/manual.tsbuildinfo",
                "-p",
                "projects/core/tsconfig.json",
            ]),
            Val::U64(300_000),
        ],
    )
    .await?;
    let mut incremental = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        incremental.push(
            timed_invoke(
                &mut instance,
                "run-tsc",
                &[
                    string_list(&[
                        "--noEmit",
                        "--incremental",
                        "--tsBuildInfoFile",
                        ".cache/manual.tsbuildinfo",
                        "-p",
                        "projects/core/tsconfig.json",
                    ]),
                    Val::U64(300_000),
                ],
            )
            .await?,
        );
    }

    let broken_path = instance
        .temp_dir_path()
        .join("workspace/projects/core/src/broken.ts");
    fs::write(&broken_path, "export const broken: number = 'wrong';\n")?;
    let invalid = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&["--noEmit", "-p", "projects/core/tsconfig.json"]),
            Val::U64(300_000),
        ],
    )
    .await?;
    fs::write(&broken_path, "export const fixed: number = 42;\n")?;
    let valid = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&["--noEmit", "-p", "projects/core/tsconfig.json"]),
            Val::U64(300_000),
        ],
    )
    .await?;

    let project_build = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&["--build", "tsconfig.json"]),
            Val::U64(300_000),
        ],
    )
    .await?;
    let direct_ts = timed_invoke(
        &mut instance,
        "run-entry",
        &[Val::String("./projects/direct.ts".to_string())],
    )
    .await?;
    let emit_direct = timed_invoke(
        &mut instance,
        "run-tsc",
        &[
            string_list(&[
                "--module",
                "NodeNext",
                "--moduleResolution",
                "NodeNext",
                "--target",
                "ES2022",
                "--outDir",
                "dist/direct",
                "projects/direct.ts",
            ]),
            Val::U64(300_000),
        ],
    )
    .await?;
    let generated_js = timed_invoke(
        &mut instance,
        "run-generated",
        &[Val::String("./dist/direct/direct.js".to_string())],
    )
    .await?;
    let cpu_baseline = timed_invoke(&mut instance, "run-cpu", &[]).await?;
    let io_baseline = timed_invoke(&mut instance, "run-io", &[]).await?;
    let concurrent = json!({
        "cpuBaseline": cpu_baseline,
        "ioBaseline": io_baseline,
        "contended": timed_invoke(&mut instance, "run-concurrent", &[]).await?,
        "interpretation": "all jobs were submitted together; compare sibling completion with isolated baselines to identify overlap or serialization",
    });
    let timeout = timed_invoke(&mut instance, "probe-timeout", &[]).await?;
    let cancellation = timed_invoke(&mut instance, "probe-cancellation", &[]).await?;
    let memory_plateau = memory_plateau(&unchanged, &incremental)?;

    let report = json!({
        "schemaVersion": 1,
        "environment": environment(iterations)?,
        "sourceFiles": source_files()?,
        "runtimeSourceState": runtime_source_state()?,
        "target": format!("{:?}", test_target()).to_lowercase(),
        "component": {
            "path": compiled.wasm_path().as_str(),
            "bytes": component_size,
            "buildMs": millis(build_elapsed),
            "instantiateMs": millis(instantiate_elapsed),
        },
        "nodeBaseline": node_baseline,
        "workloads": {
            "coldNoEmit": cold,
            "unchangedFreshJobs": summarize(&unchanged),
            "incrementalCold": incremental_cold,
            "incrementalFreshJobs": summarize(&incremental),
            "invalidThenValid": { "invalid": invalid, "valid": valid },
            "projectReferences": project_build,
            "directTypeScript": direct_ts,
            "emitDirect": emit_direct,
            "generatedJavaScript": generated_js,
            "concurrent": concurrent,
            "timeout": timeout,
            "cancellation": cancellation,
            "memoryPlateau": memory_plateau,
        },
        "wasmLinearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "notes": [
            "manual local measurement; no CI threshold",
            "fresh QuickJS execution job per compiler/run operation",
            "workspace and .tsbuildinfo persist within the component instance",
        ],
    });

    validate_report(&report)?;
    validate_regression_guards(&report)?;
    let formatted = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("AGENTIC_TS_REPORT") {
        fs::write(path, format!("{formatted}\n"))?;
    }
    println!("{formatted}");
    Ok(())
}

fn check_report(path: &Utf8Path) -> anyhow::Result<()> {
    let report: Value = serde_json::from_slice(&fs::read(path)?)?;
    anyhow::ensure!(
        report["sourceFiles"] == serde_json::to_value(source_files()?)?,
        "{} was generated from different suite sources",
        path
    );
    let current_runtime_source_state = runtime_source_state()?;
    anyhow::ensure!(
        report["runtimeSourceState"] == current_runtime_source_state,
        "{} runtime source state is stale: report={}, current={}",
        path,
        report["runtimeSourceState"],
        current_runtime_source_state
    );
    anyhow::ensure!(
        report["environment"]["node"] == "22.14.0"
            && report["environment"]["npm"] == "10.9.2"
            && report["environment"]["typescript"] == "5.8.2"
            && report["environment"]["iterations"].as_u64().unwrap_or(0) >= 5,
        "{} does not use the pinned baseline settings",
        path
    );
    let expected_target = if path.as_str().contains("-p2-") {
        "p2"
    } else if path.as_str().contains("-p3-") {
        "p3"
    } else {
        anyhow::bail!("{} does not identify a P2 or P3 report", path)
    };
    anyhow::ensure!(
        report["target"] == expected_target,
        "{} has the wrong target",
        path
    );
    anyhow::ensure!(
        report["environment"]["os"] == std::env::consts::OS
            && report["environment"]["arch"] == std::env::consts::ARCH,
        "{} was produced for a different platform or architecture",
        path
    );
    validate_report(&report)
}

async fn timed_invoke(
    instance: &mut TestInstance,
    function: &str,
    args: &[Val],
) -> anyhow::Result<Value> {
    let started = Instant::now();
    let value = instance.invoke(None, function, args).await?;
    let elapsed = started.elapsed();
    let Some(Val::String(encoded)) = value else {
        anyhow::bail!("{function} did not return a JSON string")
    };
    let wall_ms = millis(elapsed);
    let result = serde_json::from_str::<Value>(&encoded)?;
    let host_overhead_ms = result
        .pointer("/value/toolAndCompilerMs")
        .and_then(Value::as_f64)
        .map(|inner_ms| wall_ms - inner_ms);
    Ok(json!({
        "wallMs": wall_ms,
        "hostOverheadMs": host_overhead_ms,
        "linearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "result": result,
    }))
}

fn summarize(samples: &[Value]) -> Value {
    let mut durations = samples
        .iter()
        .filter_map(|sample| sample["wallMs"].as_f64())
        .collect::<Vec<_>>();
    durations.sort_by(f64::total_cmp);
    let total = durations.iter().sum::<f64>();
    let p95_index = ((durations.len() as f64 * 0.95).ceil() as usize)
        .saturating_sub(1)
        .min(durations.len() - 1);
    json!({
        "iterations": durations.len(),
        "medianMs": durations[durations.len() / 2],
        "p95Ms": durations[p95_index],
        "throughputPerSecond": durations.len() as f64 / (total / 1000.0),
        "samples": samples,
    })
}

fn memory_plateau(unchanged: &[Value], incremental: &[Value]) -> anyhow::Result<Value> {
    fn series(samples: &[Value]) -> anyhow::Result<Value> {
        let values = samples
            .iter()
            .map(|sample| {
                sample["linearMemoryHighWaterBytes"]
                    .as_u64()
                    .ok_or_else(|| anyhow::anyhow!("missing linear-memory high-water sample"))
            })
            .collect::<anyhow::Result<Vec<_>>>()?;
        let minimum = values.iter().copied().min().unwrap_or(0);
        let maximum = values.iter().copied().max().unwrap_or(0);
        Ok(json!({
            "samples": values,
            "minimumBytes": minimum,
            "maximumBytes": maximum,
            "growthBytes": maximum - minimum,
        }))
    }

    Ok(json!({
        "allowedGrowthBytes": 65_536,
        "unchangedCompilerJobs": series(unchanged)?,
        "warmedIncrementalCompilerJobs": series(incremental)?,
    }))
}

fn source_files() -> anyhow::Result<BTreeMap<String, String>> {
    let source_root = std::env::var("AGENTIC_TS_SOURCE_ROOT").unwrap_or_else(|_| ".".to_string());
    let mut files = vec![
        Utf8Path::new("Cargo.toml").to_path_buf(),
        Utf8Path::new("Cargo.lock").to_path_buf(),
        Utf8Path::new("crates/wasm-rquickjs/Cargo.toml").to_path_buf(),
        Utf8Path::new("crates/wasm-rquickjs/skeleton/Cargo.toml_").to_path_buf(),
        Utf8Path::new("crates/wasm-rquickjs/skeleton/Cargo.lock").to_path_buf(),
        Utf8Path::new("tests/common/mod.rs").to_path_buf(),
        Utf8Path::new("tests/agentic_ts.rs").to_path_buf(),
        Utf8Path::new("tests/agentic_ts/package.json").to_path_buf(),
        Utf8Path::new("tests/agentic_ts/package-lock.json").to_path_buf(),
        Utf8Path::new("tests/agentic_ts/tsconfig.json").to_path_buf(),
        Utf8Path::new("tests/agentic_ts/run.sh").to_path_buf(),
    ];
    collect_files(Utf8Path::new("examples/runtime/agentic-ts"), &mut files)?;
    collect_files(Utf8Path::new("tests/agentic_ts/projects"), &mut files)?;
    files.sort();

    files
        .into_iter()
        .map(|path| {
            let source_path = Utf8Path::new(&source_root).join(&path);
            let hash =
                command_text(Command::new("git").args(["hash-object", source_path.as_str()]))?;
            Ok((path.into_string(), hash))
        })
        .collect()
}

fn runtime_source_state() -> anyhow::Result<String> {
    let source_root = std::env::var("AGENTIC_TS_SOURCE_ROOT").unwrap_or_else(|_| ".".to_string());
    let mut files = Vec::new();
    for directory in [
        "src",
        "crates/wasm-rquickjs/src",
        "crates/wasm-rquickjs/skeleton/src",
    ] {
        collect_files(&Utf8Path::new(&source_root).join(directory), &mut files)?;
    }
    files.sort();
    let mut manifest = String::new();
    for path in files {
        let hash = command_text(Command::new("git").args(["hash-object", path.as_str()]))?;
        manifest.push_str(&hash);
        manifest.push(' ');
        manifest.push_str(path.strip_prefix(&source_root).unwrap_or(&path).as_str());
        manifest.push('\n');
    }
    let mut child = Command::new("git")
        .args(["hash-object", "--stdin"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
    child
        .stdin
        .take()
        .ok_or_else(|| anyhow::anyhow!("git hash-object stdin unavailable"))?
        .write_all(manifest.as_bytes())?;
    let output = child.wait_with_output()?;
    anyhow::ensure!(
        output.status.success(),
        "failed to hash runtime source state"
    );
    Ok(String::from_utf8(output.stdout)?.trim().to_string())
}

fn collect_files(directory: &Utf8Path, files: &mut Vec<camino::Utf8PathBuf>) -> anyhow::Result<()> {
    for entry in fs::read_dir(directory)? {
        let path = camino::Utf8PathBuf::from_path_buf(entry?.path())
            .map_err(|path| anyhow::anyhow!("non-UTF-8 path: {}", path.display()))?;
        if path.is_dir() {
            collect_files(&path, files)?;
        } else {
            files.push(path);
        }
    }
    Ok(())
}

fn node_baseline() -> anyhow::Result<Value> {
    let build_info = camino_tempfile::NamedUtf8TempFile::new()?;
    let started = Instant::now();
    let output = Command::new("node")
        .current_dir(SUITE_DIR)
        .args([
            "node_modules/typescript/lib/tsc.js",
            "--noEmit",
            "--tsBuildInfoFile",
            build_info.path().as_str(),
            "-p",
            "projects/core/tsconfig.json",
        ])
        .output()?;
    Ok(json!({
        "wallMs": millis(started.elapsed()),
        "exitCode": output.status.code(),
        "stdout": String::from_utf8_lossy(&output.stdout),
        "stderr": String::from_utf8_lossy(&output.stderr),
    }))
}

fn prepare_workspace(instance: &TestInstance) -> anyhow::Result<()> {
    let source = Utf8Path::new(SUITE_DIR);
    let workspace = instance.temp_dir_path().join("workspace");
    fs::create_dir_all(&workspace)?;
    for file in ["package.json", "package-lock.json", "tsconfig.json"] {
        fs::copy(source.join(file), workspace.join(file))?;
    }
    for directory in ["node_modules", "projects"] {
        copy_dir_recursive(
            source.join(directory).as_std_path(),
            workspace.join(directory).as_std_path(),
        )?;
    }
    fs::create_dir_all(workspace.join(".home"))?;
    fs::create_dir_all(workspace.join(".cache"))?;
    Ok(())
}

fn environment(iterations: usize) -> anyhow::Result<Value> {
    Ok(json!({
        "commit": command_text(Command::new("git").args(["rev-parse", "HEAD"]))?,
        "dirty": !command_text(Command::new("git").args(["status", "--porcelain"]))?.is_empty(),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "node": command_text(Command::new("node").args(["-p", "process.versions.node"]))?,
        "npm": command_text(Command::new("npm").arg("--version"))?,
        "typescript": command_text(Command::new("node").args(["-p", "require('./tests/agentic_ts/node_modules/typescript/package.json').version"]))?,
        "iterations": iterations,
        "artifactCache": std::env::var("WASM_RQUICKJS_TEST_ARTIFACT_CACHE").ok(),
        "wasmtimeCache": std::env::var("WASM_RQUICKJS_TEST_WASMTIME_CACHE").ok(),
        "preparedComponentCache": std::env::var("WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE").ok(),
        "unoptimized": std::env::var("WASM_RQUICKJS_TEST_UNOPTIMIZED").ok(),
    }))
}

fn verify_toolchain() -> anyhow::Result<()> {
    let node = command_text(Command::new("node").args(["-p", "process.versions.node"]))?;
    let npm = command_text(Command::new("npm").arg("--version"))?;
    anyhow::ensure!(node == "22.14.0", "requires Node.js 22.14.0; found {node}");
    anyhow::ensure!(npm == "10.9.2", "requires npm 10.9.2; found {npm}");
    anyhow::ensure!(
        Utf8Path::new(SUITE_DIR)
            .join("node_modules/typescript/lib/tsc.js")
            .exists(),
        "run npm ci in {SUITE_DIR} first"
    );
    Ok(())
}

fn validate_report(report: &Value) -> anyhow::Result<()> {
    fn successful_result(value: &Value) -> bool {
        value["overflowed"] == false
            && value.get("runnerError").is_none()
            && value.get("value").is_some()
    }

    anyhow::ensure!(
        report["nodeBaseline"]["exitCode"] == 0,
        "Node baseline failed"
    );
    for path in [
        "/workloads/coldNoEmit/result/value/exitCode",
        "/workloads/incrementalCold/result/value/exitCode",
        "/workloads/invalidThenValid/valid/result/value/exitCode",
        "/workloads/projectReferences/result/value/exitCode",
        "/workloads/emitDirect/result/value/exitCode",
    ] {
        anyhow::ensure!(
            report.pointer(path) == Some(&json!(0))
                && successful_result(
                    report
                        .pointer(path.trim_end_matches("/value/exitCode"))
                        .unwrap_or(&Value::Null),
                ),
            "failed workload at {path}: {report:#}"
        );
    }
    for group in ["unchangedFreshJobs", "incrementalFreshJobs"] {
        let samples = report["workloads"][group]["samples"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("missing samples for {group}"))?;
        anyhow::ensure!(samples.len() >= 5, "{group} needs at least five samples");
        for sample in samples {
            anyhow::ensure!(
                sample.pointer("/result/value/exitCode") == Some(&json!(0))
                    && successful_result(&sample["result"]),
                "failed sample in {group}: {sample:#}"
            );
        }
    }
    anyhow::ensure!(
        report.pointer("/workloads/invalidThenValid/invalid/result/value/exitCode")
            == Some(&json!(2))
            && report["workloads"]["invalidThenValid"]["invalid"]["result"]["stdout"]
                .as_str()
                .is_some_and(|stdout| stdout.contains("error TS2322"))
            && report["workloads"]["invalidThenValid"]["invalid"]["result"]["overflowed"] == false
            && report["workloads"]["invalidThenValid"]["invalid"]["result"]
                .get("runnerError")
                .is_none(),
        "invalid TypeScript unexpectedly passed"
    );
    anyhow::ensure!(
        successful_result(&report["workloads"]["directTypeScript"]["result"])
            && successful_result(&report["workloads"]["generatedJavaScript"]["result"])
            && report.pointer("/workloads/directTypeScript/result/value/answer")
                == Some(&json!(42))
            && report.pointer("/workloads/generatedJavaScript/result/value/default/answer")
                == Some(&json!(42)),
        "direct TypeScript or generated JavaScript result was incorrect"
    );
    anyhow::ensure!(
        successful_result(&report["workloads"]["concurrent"]["cpuBaseline"]["result"])
            && successful_result(&report["workloads"]["concurrent"]["ioBaseline"]["result"])
            && successful_result(
                &report["workloads"]["concurrent"]["contended"]["result"]["compiler"]["result"]
            )
            && successful_result(
                &report["workloads"]["concurrent"]["contended"]["result"]["cpu"]["result"]
            )
            && successful_result(
                &report["workloads"]["concurrent"]["contended"]["result"]["io"]["result"]
            )
            && report.pointer("/workloads/concurrent/cpuBaseline/result/value") == Some(&json!(21))
            && report.pointer("/workloads/concurrent/ioBaseline/result/value/bytes")
                == Some(&json!(273))
            && report
                .pointer("/workloads/concurrent/contended/result/compiler/result/value/exitCode")
                == Some(&json!(0))
            && report.pointer("/workloads/concurrent/contended/result/cpu/result/value")
                == Some(&json!(21))
            && report.pointer("/workloads/concurrent/contended/result/io/result/value/bytes")
                == Some(&json!(273)),
        "concurrency workload result was incorrect"
    );
    anyhow::ensure!(
        report.pointer("/workloads/timeout/result/timedOut") == Some(&json!(true))
            && report.pointer("/workloads/timeout/result/message")
                == Some(&json!("execution job timed out"))
            && report["workloads"]["timeout"]["wallMs"]
                .as_f64()
                .unwrap_or(f64::INFINITY)
                < 1_000.0,
        "timeout probe failed"
    );
    anyhow::ensure!(
        report.pointer("/workloads/cancellation/result/cancelled") == Some(&json!(true))
            && report.pointer("/workloads/cancellation/result/message")
                == Some(&json!("execution job cancelled"))
            && report["workloads"]["cancellation"]["wallMs"]
                .as_f64()
                .unwrap_or(f64::INFINITY)
                < 1_000.0,
        "cancellation probe failed"
    );
    let allowed = report["workloads"]["memoryPlateau"]["allowedGrowthBytes"]
        .as_u64()
        .unwrap_or(0);
    for group in ["unchangedCompilerJobs", "warmedIncrementalCompilerJobs"] {
        anyhow::ensure!(
            report["workloads"]["memoryPlateau"][group]["growthBytes"]
                .as_u64()
                .unwrap_or(u64::MAX)
                <= allowed,
            "linear memory did not plateau for {group}"
        );
    }
    Ok(())
}

fn validate_regression_guards(report: &Value) -> anyhow::Result<()> {
    let mut failed_sample = report.clone();
    failed_sample["workloads"]["unchangedFreshJobs"]["samples"][0]["result"]["value"]["exitCode"] =
        json!(1);
    anyhow::ensure!(
        validate_report(&failed_sample).is_err(),
        "validation guard accepted a failed repeated workload"
    );

    let mut false_timeout = report.clone();
    false_timeout["workloads"]["timeout"]["result"]["message"] = json!("unrelated error");
    anyhow::ensure!(
        validate_report(&false_timeout).is_err(),
        "validation guard accepted an unrelated timeout error"
    );
    let mut invalid_runner_error = report.clone();
    invalid_runner_error["workloads"]["invalidThenValid"]["invalid"]["result"] =
        json!({ "runnerError": { "message": "broken" } });
    anyhow::ensure!(
        validate_report(&invalid_runner_error).is_err(),
        "validation guard accepted a failed invalid-TypeScript workload"
    );
    let mut overflowed = report.clone();
    overflowed["workloads"]["directTypeScript"]["result"]["overflowed"] = json!(true);
    anyhow::ensure!(
        validate_report(&overflowed).is_err(),
        "validation guard accepted an overflowed successful workload"
    );
    Ok(())
}

fn string_list(values: &[&str]) -> Val {
    Val::List(
        values
            .iter()
            .map(|value| Val::String((*value).to_string()))
            .collect(),
    )
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

fn millis(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1000.0
}

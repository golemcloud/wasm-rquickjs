//! Manual phase attribution for the slow strip-mode prepared-ESM path.
//!
//! The default path validates checked-in reports. Set
//! `ESM_MODULE_LOAD_PHASES_MEASURE=1` to execute five fresh-job samples.

#![allow(dead_code)]

#[path = "common/mod.rs"]
mod common;

use camino::Utf8Path;
use common::{CompiledTest, FeatureCombination, TestInstance, test_target};
use serde_json::{Map, Value, json};
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant};
use wasmtime::component::Val;

const EXAMPLE_DIR: &str = "examples/runtime/esm-module-load-phases";
const RESULTS_DIR: &str = "tests/esm_module_load_phases/results";
const SOURCE_BYTES: u64 = 65_536;
const ITERATIONS: usize = 5;
const INVOCATION_DEADLINE_SECONDS: u64 = 120;
const PHASES: &[&str] = &[
    "esm.importMetaLoader.total",
    "esm.importMetaLoader.realpath",
    "esm.importMetaLoader.sourceRead",
    "esm.importMetaLoader.importAttrs",
    "esm.importMetaLoader.cjsGlobalPreflight",
    "esm.importMetaLoader.namedImportDiagnostics",
    "esm.importMetaLoader.topLevelAwaitScan",
    "esm.importMetaLoader.prologueInjection",
    "esm.importMetaLoader.sourceMapRegistration",
    "esm.importMetaLoader.quickjsDeclare",
    "esm.importMetaLoader.importMetaInit",
    "esm.nodeFileResolve",
];
const EXCLUSIVE_LOADER_PHASES: &[&str] = &[
    "realpath",
    "sourceRead",
    "importAttrs",
    "cjsGlobalPreflight",
    "namedImportDiagnostics",
    "topLevelAwaitScan",
    "prologueInjection",
    "sourceMapRegistration",
    "quickjsDeclare",
    "importMetaInit",
];

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    if std::env::var_os("ESM_MODULE_LOAD_PHASES_MEASURE").is_none() {
        return validate_checked_reports();
    }

    let build_started = Instant::now();
    let compiled = CompiledTest::new_with_features(
        Utf8Path::new(EXAMPLE_DIR),
        true,
        FeatureCombination::TypeScriptCompilerProfiling,
    )
    .await?;
    let build_ms = millis(build_started.elapsed());
    let component_bytes = fs::metadata(compiled.wasm_path())?.len();
    let instantiate_started = Instant::now();
    let mut instance = TestInstance::new_with_memory_tracking(compiled.wasm_path()).await?;
    let instantiate_ms = millis(instantiate_started.elapsed());

    let mut samples = Vec::new();
    for sample in 0..ITERATIONS {
        eprintln!("measuring prepared ESM phase sample {}", sample + 1);
        samples.push(
            invoke_json(
                &mut instance,
                "measure-case",
                &[Val::U64(SOURCE_BYTES), Val::U64(sample as u64)],
            )
            .await?,
        );
    }

    let report = json!({
        "schemaVersion": 1,
        "environment": environment()?,
        "inputs": {
            "instrumentationPatchBlake3": hash_file(Utf8Path::new(&required_env("ESM_MODULE_LOAD_PHASES_PATCH_FILE")?))?,
            "patchedFilesHash": patched_files_hash()?,
        },
        "target": format!("{:?}", test_target()).to_lowercase(),
        "mode": "strip",
        "path": "prepared-esm",
        "iterations": ITERATIONS,
        "sourceBytes": SOURCE_BYTES,
        "component": {
            "bytes": component_bytes,
            "blake3": hash_file(compiled.wasm_path())?,
            "buildMs": build_ms,
            "instantiateMs": instantiate_ms,
        },
        "summary": summarize(&samples),
        "samples": samples,
        "wasmLinearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "notes": [
            "manual local attribution; timings are not CI thresholds",
            "each sample uses a unique module path and a fresh execution-job QuickJS runtime",
            "the component instance is reused within one target report; runtime state is not",
            "preEvaluationResidual includes uninstrumented resolver dispatch, QuickJS linking, and promise scheduling",
        ],
    });
    validate_report(&report)?;
    let encoded = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("ESM_MODULE_LOAD_PHASES_REPORT") {
        fs::write(path, format!("{encoded}\n"))?;
    }
    println!("{encoded}");
    Ok(())
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
    let result: Value = serde_json::from_str(&encoded)?;
    Ok(json!({
        "outerWallMs": millis(started.elapsed()),
        "linearMemoryHighWaterBytes": instance.linear_memory_high_water_bytes(),
        "derived": derive(&result)?,
        "result": result,
    }))
}

fn derive(result: &Value) -> anyhow::Result<Value> {
    let counters = result["profile"]["counters"]
        .as_object()
        .ok_or_else(|| anyhow::anyhow!("sample is missing profile counters"))?;
    let micros = |phase: &str| -> anyhow::Result<f64> {
        Ok(counters
            .get(&format!("{phase}.micros"))
            .and_then(Value::as_u64)
            .ok_or_else(|| anyhow::anyhow!("missing {phase}.micros"))? as f64
            / 1000.0)
    };
    let loader_total_ms = micros("esm.importMetaLoader.total")?;
    let node_file_resolve_ms = micros("esm.nodeFileResolve")?;
    let mut exclusive = Map::new();
    let mut known_loader_ms = 0.0;
    for phase in EXCLUSIVE_LOADER_PHASES {
        let value = micros(&format!("esm.importMetaLoader.{phase}"))?;
        known_loader_ms += value;
        exclusive.insert(format!("{phase}Ms"), json!(value));
    }
    let marks = result["marks"]
        .as_object()
        .ok_or_else(|| anyhow::anyhow!("sample is missing JS marks"))?;
    let mark = |name: &str| -> anyhow::Result<f64> {
        marks
            .get(name)
            .and_then(Value::as_f64)
            .ok_or_else(|| anyhow::anyhow!("missing {name} mark"))
    };
    let import_start = mark("importStart")?;
    let evaluation_start = mark("evaluationStart")?;
    let evaluation_end = mark("evaluationEnd")?;
    let import_resolved = mark("importResolved")?;
    let pre_evaluation_ms = evaluation_start - import_start;
    Ok(json!({
        "nodeFileResolveMs": node_file_resolve_ms,
        "loaderTotalMs": loader_total_ms,
        "exclusiveLoaderPhases": exclusive,
        "knownLoaderMs": known_loader_ms,
        "loaderMiscMs": loader_total_ms - known_loader_ms,
        "preEvaluationMs": pre_evaluation_ms,
        "preEvaluationResidualMs": pre_evaluation_ms - node_file_resolve_ms - loader_total_ms,
        "evaluationMs": evaluation_end - evaluation_start,
        "settlementMs": import_resolved - evaluation_end,
        "importPromiseMs": import_resolved - import_start,
    }))
}

fn summarize(samples: &[Value]) -> Value {
    let mut elapsed = samples
        .iter()
        .filter_map(|sample| sample.pointer("/result/elapsedMs").and_then(Value::as_f64))
        .collect::<Vec<_>>();
    elapsed.sort_by(f64::total_cmp);
    let mut pre_evaluation = samples
        .iter()
        .filter_map(|sample| {
            sample
                .pointer("/derived/preEvaluationMs")
                .and_then(Value::as_f64)
        })
        .collect::<Vec<_>>();
    pre_evaluation.sort_by(f64::total_cmp);
    json!({
        "medianElapsedMs": elapsed[elapsed.len() / 2],
        "maximumElapsedMs": elapsed[elapsed.len() - 1],
        "medianPreEvaluationMs": pre_evaluation[pre_evaluation.len() / 2],
    })
}

fn validate_checked_reports() -> anyhow::Result<()> {
    let directory = Utf8Path::new(RESULTS_DIR);
    anyhow::ensure!(directory.exists(), "checked report directory is missing");
    let mut targets = std::collections::BTreeSet::new();
    for entry in fs::read_dir(directory)? {
        let path = entry?.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let report: Value = serde_json::from_slice(&fs::read(&path)?)?;
        validate_report(&report).map_err(|error| anyhow::anyhow!("{}: {error}", path.display()))?;
        let target = report["target"].as_str().unwrap().to_string();
        anyhow::ensure!(targets.insert(target), "duplicate target report");
    }
    anyhow::ensure!(
        targets == ["p2".to_string(), "p3".to_string()].into_iter().collect(),
        "checked reports must contain exactly one P2 and one P3 report"
    );
    Ok(())
}

fn validate_report(report: &Value) -> anyhow::Result<()> {
    anyhow::ensure!(report["schemaVersion"] == 1, "unexpected report schema");
    anyhow::ensure!(
        matches!(report["target"].as_str(), Some("p2" | "p3")),
        "invalid target"
    );
    anyhow::ensure!(
        report["mode"] == "strip" && report["path"] == "prepared-esm",
        "invalid workload"
    );
    anyhow::ensure!(
        report["iterations"] == ITERATIONS && report["sourceBytes"] == SOURCE_BYTES,
        "invalid sample shape"
    );
    anyhow::ensure!(
        report["environment"]["baseRevision"]
            .as_str()
            .is_some_and(is_git_sha)
            && report["inputs"]["instrumentationPatchBlake3"]
                .as_str()
                .is_some_and(is_blake3)
            && report["inputs"]["patchedFilesHash"]
                .as_str()
                .is_some_and(is_blake3)
            && report["component"]["blake3"]
                .as_str()
                .is_some_and(is_blake3),
        "report source or component identity is incomplete"
    );
    let samples = report["samples"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("missing samples"))?;
    anyhow::ensure!(samples.len() == ITERATIONS, "wrong sample count");
    let mut elapsed = Vec::new();
    let mut pre_evaluation = Vec::new();
    for sample in samples {
        let result = &sample["result"];
        anyhow::ensure!(
            result["value"] == 42 && result["overflowed"] == false,
            "prepared ESM returned an invalid result"
        );
        anyhow::ensure!(
            result["requestedSourceBytes"] == SOURCE_BYTES,
            "source size differs from report"
        );
        anyhow::ensure!(
            result["profile"]["version"] == 1,
            "missing execution profile"
        );
        let counters = result["profile"]["counters"]
            .as_object()
            .ok_or_else(|| anyhow::anyhow!("missing counters"))?;
        for phase in PHASES {
            anyhow::ensure!(
                counters
                    .get(&format!("{phase}.calls"))
                    .and_then(Value::as_u64)
                    == Some(1),
                "{phase} did not run exactly once"
            );
            anyhow::ensure!(
                counters
                    .get(&format!("{phase}.micros"))
                    .and_then(Value::as_u64)
                    .is_some(),
                "{phase} is missing duration"
            );
        }
        let marks = &result["marks"];
        let ordered = [
            "importStart",
            "evaluationStart",
            "evaluationEnd",
            "importResolved",
        ]
        .into_iter()
        .map(|name| {
            marks[name]
                .as_f64()
                .ok_or_else(|| anyhow::anyhow!("missing {name}"))
        })
        .collect::<anyhow::Result<Vec<_>>>()?;
        anyhow::ensure!(
            ordered.windows(2).all(|pair| pair[0] <= pair[1]),
            "JS timestamps are not monotonic"
        );
        let loader_total = sample["derived"]["loaderTotalMs"].as_f64().unwrap();
        let known_loader = sample["derived"]["knownLoaderMs"].as_f64().unwrap();
        anyhow::ensure!(
            loader_total + 0.050 >= known_loader,
            "exclusive loader phases exceed loader total"
        );
        let import_promise = sample["derived"]["importPromiseMs"].as_f64().unwrap();
        let user_await = result["profile"]["phasesMs"]["userAwait"]
            .as_f64()
            .ok_or_else(|| anyhow::anyhow!("missing userAwait"))?;
        anyhow::ensure!(
            user_await + 1.0 >= import_promise,
            "userAwait does not cover the import promise"
        );
        elapsed.push(result["elapsedMs"].as_f64().unwrap());
        pre_evaluation.push(sample["derived"]["preEvaluationMs"].as_f64().unwrap());
    }
    elapsed.sort_by(f64::total_cmp);
    pre_evaluation.sort_by(f64::total_cmp);
    anyhow::ensure!(
        approximately_equal(
            report["summary"]["medianElapsedMs"].as_f64(),
            Some(elapsed[2])
        ) && approximately_equal(
            report["summary"]["maximumElapsedMs"].as_f64(),
            elapsed.last().copied()
        ) && approximately_equal(
            report["summary"]["medianPreEvaluationMs"].as_f64(),
            Some(pre_evaluation[2])
        ),
        "summary does not match raw samples"
    );
    Ok(())
}

fn environment() -> anyhow::Result<Value> {
    Ok(json!({
        "baseRevision": required_env("ESM_MODULE_LOAD_PHASES_BASE_REVISION")?,
        "dirty": !command_text(Command::new("git").args(["status", "--porcelain"]))?.is_empty(),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rustc": command_text(Command::new("rustc").arg("--version"))?,
        "cargo": command_text(Command::new("cargo").arg("--version"))?,
        "artifactCache": std::env::var("WASM_RQUICKJS_TEST_ARTIFACT_CACHE").ok(),
        "wasmtimeCache": std::env::var("WASM_RQUICKJS_TEST_WASMTIME_CACHE").ok(),
    }))
}

fn patched_files_hash() -> anyhow::Result<String> {
    let mut hasher = blake3::Hasher::new();
    for path in [
        "crates/wasm-rquickjs/skeleton/Cargo.toml_",
        "crates/wasm-rquickjs/skeleton/src/internal/module_loading.rs",
    ] {
        let bytes = fs::read(path)?;
        hasher.update(&(path.len() as u64).to_le_bytes());
        hasher.update(path.as_bytes());
        hasher.update(&(bytes.len() as u64).to_le_bytes());
        hasher.update(&bytes);
    }
    Ok(hasher.finalize().to_hex().to_string())
}

fn hash_file(path: &Utf8Path) -> anyhow::Result<String> {
    Ok(blake3::hash(&fs::read(path)?).to_hex().to_string())
}

fn required_env(name: &str) -> anyhow::Result<String> {
    std::env::var(name).map_err(|_| anyhow::anyhow!("{name} is required while measuring"))
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

fn approximately_equal(left: Option<f64>, right: Option<f64>) -> bool {
    left.zip(right)
        .is_some_and(|(left, right)| (left - right).abs() <= f64::EPSILON * 8.0)
}

fn is_blake3(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn is_git_sha(value: &str) -> bool {
    value.len() == 40 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

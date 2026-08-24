//! Agentic TypeScript compatibility and performance suite.
//!
//! Use `tests/agentic_ts/run.sh` for manual measurements. CI runs only the report-contract path.

#![allow(dead_code)]

#[path = "common/mod.rs"]
mod common;

use camino::Utf8Path;
use common::{CompiledTest, FeatureCombination, TestInstance, copy_dir_recursive, test_target};
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Read as _;
use std::process::Command;
use std::time::{Duration, Instant};
use wasmtime::component::Val;

const SUITE_DIR: &str = "tests/agentic_ts";
const EXAMPLE_DIR: &str = "examples/runtime/agentic-ts";
const INPUT_HASH_ALGORITHM: &str = "blake3-composite-v1";
const ALLOWED_LINEAR_MEMORY_GROWTH_BYTES: u64 = 65_536;
const ALLOWED_QUICKJS_HEAP_VARIATION_BYTES: u64 = 1_048_576;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    if std::env::var_os("AGENTIC_TS_VALIDATE_REPORTS").is_some() {
        return validate_checked_reports(Utf8Path::new(SUITE_DIR).join("results"));
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
    let mut failed_type_checks = Vec::with_capacity(iterations);
    for attempt in 0..iterations {
        fs::write(
            &broken_path,
            format!("export const broken: number = 'wrong-{attempt}';\n"),
        )?;
        failed_type_checks.push(
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
    fs::write(&broken_path, "export const fixed: number = 42;\n")?;
    let failed_recovery = timed_invoke(
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
    let mut timeouts = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        timeouts.push(timed_invoke(&mut instance, "probe-timeout", &[]).await?);
    }
    let timeout_recovery = timed_invoke(
        &mut instance,
        "run-entry",
        &[Val::String("./projects/direct.ts".to_string())],
    )
    .await?;
    let mut cancellations = Vec::with_capacity(iterations);
    for _ in 0..iterations {
        cancellations.push(timed_invoke(&mut instance, "probe-cancellation", &[]).await?);
    }
    let cancellation_recovery = timed_invoke(
        &mut instance,
        "run-entry",
        &[Val::String("./projects/direct.ts".to_string())],
    )
    .await?;
    let memory_plateau = memory_plateau(
        &unchanged,
        &incremental,
        &failed_type_checks,
        &timeouts,
        &cancellations,
    )?;

    let environment = environment(iterations)?;
    let input_hashes = input_hashes()?;
    let report = json!({
        "schemaVersion": 3,
        "environment": environment,
        "inputs": {
            "algorithm": INPUT_HASH_ALGORITHM,
            "buildHash": input_hashes.build,
            "benchmarkHash": input_hashes.benchmark,
        },
        "target": format!("{:?}", test_target()).to_lowercase(),
        "component": {
            "path": compiled.wasm_path().as_str(),
            "bytes": component_size,
            "blake3": hash_file(compiled.wasm_path())?,
            "buildMs": millis(build_elapsed),
            "instantiateMs": millis(instantiate_elapsed),
        },
        "nodeBaseline": node_baseline,
        "workloads": {
            "coldNoEmit": cold,
            "unchangedFreshJobs": summarize(&unchanged),
            "incrementalCold": incremental_cold,
            "incrementalFreshJobs": summarize(&incremental),
            "invalidThenValid": {
                "failedChecks": summarize(&failed_type_checks),
                "recovery": failed_recovery,
            },
            "projectReferences": project_build,
            "directTypeScript": direct_ts,
            "emitDirect": emit_direct,
            "generatedJavaScript": generated_js,
            "concurrent": concurrent,
            "timeouts": {
                "attempts": summarize(&timeouts),
                "recovery": timeout_recovery,
            },
            "cancellations": {
                "attempts": summarize(&cancellations),
                "recovery": cancellation_recovery,
            },
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

fn validate_checked_reports(directory: camino::Utf8PathBuf) -> anyhow::Result<()> {
    validate_composite_hash_contract()?;
    validate_report_path_contract()?;
    let tracker = fs::read_to_string(Utf8Path::new(SUITE_DIR).join("TRACKER.md"))?;
    let mut reports_to_check = reports_to_check()?;
    let current_input_hashes = if reports_to_check.is_empty() {
        None
    } else {
        Some(input_hashes()?)
    };
    let mut reports = BTreeMap::new();
    for entry in fs::read_dir(&directory)? {
        let path = camino::Utf8PathBuf::from_path_buf(entry?.path())
            .map_err(|path| anyhow::anyhow!("non-UTF-8 report path: {}", path.display()))?;
        if path.extension() != Some("json") {
            continue;
        }
        let filename = path
            .file_name()
            .ok_or_else(|| anyhow::anyhow!("report has no filename: {path}"))?
            .to_string();
        let report: Value = serde_json::from_slice(&fs::read(&path)?)?;
        validate_report_metadata(&path, &report)?;
        validate_report(&report)?;
        validate_regression_guards(&report)?;
        if reports_to_check.remove(&path) {
            validate_current_inputs(&path, &report, current_input_hashes.as_ref().unwrap())?;
        }
        anyhow::ensure!(
            tracker.contains(&filename),
            "TRACKER.md does not reference {filename}"
        );
        reports.insert(filename, report);
    }
    anyhow::ensure!(!reports.is_empty(), "no checked-in reports found");
    anyhow::ensure!(
        reports_to_check.is_empty(),
        "reports requested for currentness checking were not found: {reports_to_check:?}"
    );

    let mut paired = 0;
    for (filename, p2) in reports
        .iter()
        .filter(|(filename, _)| filename.contains("-p2-"))
    {
        let p3_filename = filename.replacen("-p2-", "-p3-", 1);
        let p3 = reports
            .get(&p3_filename)
            .ok_or_else(|| anyhow::anyhow!("missing P3 companion for {filename}"))?;
        validate_report_pair(filename, &p3_filename, p2, p3)?;
        let mut duplicate_component = p3.clone();
        duplicate_component["component"]["blake3"] = p2["component"]["blake3"].clone();
        anyhow::ensure!(
            validate_report_pair(filename, &p3_filename, p2, &duplicate_component).is_err(),
            "paired-report guard accepted an identical P2/P3 component digest"
        );
        paired += 2;
    }
    anyhow::ensure!(
        paired == reports.len(),
        "every checked-in report must belong to a P2/P3 pair"
    );
    Ok(())
}

fn validate_report_pair(
    p2_filename: &str,
    p3_filename: &str,
    p2: &Value,
    p3: &Value,
) -> anyhow::Result<()> {
    for field in [
        "/inputs/algorithm",
        "/inputs/buildHash",
        "/inputs/benchmarkHash",
        "/environment/commitHint",
        "/environment/dirty",
        "/environment/iterations",
        "/environment/node",
        "/environment/npm",
        "/environment/typescript",
        "/environment/rustc",
        "/environment/cargo",
    ] {
        anyhow::ensure!(
            p2.pointer(field) == p3.pointer(field),
            "paired reports {p2_filename} and {p3_filename} disagree at {field}"
        );
    }
    anyhow::ensure!(
        p2.pointer("/component/blake3") != p3.pointer("/component/blake3"),
        "paired reports {p2_filename} and {p3_filename} use the same component digest"
    );
    Ok(())
}

fn validate_report_metadata(path: &Utf8Path, report: &Value) -> anyhow::Result<()> {
    anyhow::ensure!(report["schemaVersion"] == 3, "{path} uses an old schema");
    anyhow::ensure!(
        report["environment"]["node"] == "22.14.0"
            && report["environment"]["npm"] == "10.9.2"
            && report["environment"]["typescript"] == "5.8.2"
            && report["environment"]["iterations"].as_u64().unwrap_or(0) >= 5,
        "{path} does not use the pinned baseline settings"
    );
    let target = report["target"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("{path} has no target"))?;
    let os = report["environment"]["os"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("{path} has no OS"))?;
    let arch = report["environment"]["arch"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("{path} has no architecture"))?;
    let filename = path
        .file_name()
        .ok_or_else(|| anyhow::anyhow!("{path} has no filename"))?;
    anyhow::ensure!(
        filename.ends_with(&format!("-{target}-{os}-{arch}.json")),
        "{path} filename does not match its target and host metadata"
    );
    anyhow::ensure!(
        report["inputs"]["algorithm"] == INPUT_HASH_ALGORITHM
            && is_blake3_hash(&report["inputs"]["buildHash"])
            && is_blake3_hash(&report["inputs"]["benchmarkHash"])
            && is_blake3_hash(&report["component"]["blake3"])
            && report["environment"]["commitHint"]
                .as_str()
                .is_some_and(|commit| !commit.is_empty())
            && report["environment"]["rustc"]
                .as_str()
                .is_some_and(|version| !version.is_empty())
            && report["environment"]["cargo"]
                .as_str()
                .is_some_and(|version| !version.is_empty()),
        "{path} has incomplete source fingerprints"
    );
    Ok(())
}

fn reports_to_check() -> anyhow::Result<BTreeSet<camino::Utf8PathBuf>> {
    let results_directory = Utf8Path::new(SUITE_DIR).join("results");
    let current_directory = camino::Utf8PathBuf::from_path_buf(std::env::current_dir()?)
        .map_err(|path| anyhow::anyhow!("non-UTF-8 current directory: {}", path.display()))?;
    let configured_source_root = camino::Utf8PathBuf::from(
        std::env::var("AGENTIC_TS_SOURCE_ROOT").unwrap_or_else(|_| ".".to_string()),
    );
    let source_root = if configured_source_root == Utf8Path::new(".") {
        current_directory
    } else if configured_source_root.is_absolute() {
        configured_source_root
    } else {
        current_directory.join(configured_source_root)
    };
    std::env::var("AGENTIC_TS_REPORTS_TO_CHECK")
        .unwrap_or_default()
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| normalize_report_path(line.trim(), &source_root, &results_directory))
        .collect()
}

fn normalize_report_path(
    value: &str,
    source_root: &Utf8Path,
    results_directory: &Utf8Path,
) -> anyhow::Result<camino::Utf8PathBuf> {
    let path = Utf8Path::new(value);
    let path = if path.is_absolute() {
        path.strip_prefix(source_root).map_err(|_| {
            anyhow::anyhow!("report path to check is outside {source_root}: {value}")
        })?
    } else {
        path
    };
    anyhow::ensure!(
        path.parent() == Some(results_directory)
            && path.extension() == Some("json")
            && !path
                .components()
                .any(|component| component.as_str() == ".."),
        "report path to check is outside {results_directory}: {value}"
    );
    Ok(path.to_path_buf())
}

fn validate_report_path_contract() -> anyhow::Result<()> {
    let root = camino_tempfile::Utf8TempDir::new()?;
    let results_directory = Utf8Path::new(SUITE_DIR).join("results");
    let relative = results_directory.join("report.json");
    anyhow::ensure!(
        normalize_report_path(relative.as_str(), root.path(), &results_directory)? == relative,
        "relative report paths are not preserved"
    );
    anyhow::ensure!(
        normalize_report_path(
            root.path().join(&relative).as_str(),
            root.path(),
            &results_directory,
        )? == relative,
        "absolute report paths are not normalized"
    );
    anyhow::ensure!(
        normalize_report_path(
            "tests/agentic_ts/other/report.json",
            root.path(),
            &results_directory
        )
        .is_err(),
        "out-of-directory report path was accepted"
    );
    Ok(())
}

fn validate_current_inputs(
    path: &Utf8Path,
    report: &Value,
    current: &InputHashes,
) -> anyhow::Result<()> {
    anyhow::ensure!(
        report["inputs"]["buildHash"] == current.build,
        "{path} build inputs are stale: report={}, current={}",
        report["inputs"]["buildHash"],
        current.build,
    );
    anyhow::ensure!(
        report["inputs"]["benchmarkHash"] == current.benchmark,
        "{path} benchmark inputs are stale: report={}, current={}",
        report["inputs"]["benchmarkHash"],
        current.benchmark,
    );
    Ok(())
}

fn is_blake3_hash(value: &Value) -> bool {
    value.as_str().is_some_and(|hash| {
        hash.len() == 64
            && hash
                .bytes()
                .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    })
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

fn memory_plateau(
    unchanged: &[Value],
    incremental: &[Value],
    failed: &[Value],
    timeouts: &[Value],
    cancellations: &[Value],
) -> anyhow::Result<Value> {
    fn linear_memory_series(samples: &[Value]) -> anyhow::Result<Value> {
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

    fn quickjs_heap_series(samples: &[Value]) -> anyhow::Result<Value> {
        fn values_at(samples: &[Value], point: &str) -> anyhow::Result<Vec<u64>> {
            samples
                .iter()
                .map(|sample| {
                    sample
                        .pointer(&format!("/result/value/quickJsMemory/{point}/heapUsed"))
                        .and_then(Value::as_u64)
                        .ok_or_else(|| anyhow::anyhow!("missing QuickJS heap sample at {point}"))
                })
                .collect()
        }

        fn summarize_values(values: Vec<u64>) -> Value {
            let minimum = values.iter().copied().min().unwrap_or(0);
            let maximum = values.iter().copied().max().unwrap_or(0);
            json!({
                "samples": values,
                "minimumBytes": minimum,
                "maximumBytes": maximum,
                "variationBytes": maximum - minimum,
            })
        }

        Ok(json!({
            "beforeToolLoad": summarize_values(values_at(samples, "beforeToolLoad")?),
            "afterCompiler": summarize_values(values_at(samples, "afterCompiler")?),
        }))
    }

    Ok(json!({
        "wasmLinearMemory": {
            "allowedGrowthBytes": ALLOWED_LINEAR_MEMORY_GROWTH_BYTES,
            "unchangedCompilerJobs": linear_memory_series(unchanged)?,
            "warmedIncrementalCompilerJobs": linear_memory_series(incremental)?,
            "failedCompilerJobs": linear_memory_series(failed)?,
            "timedOutJobs": linear_memory_series(timeouts)?,
            "cancelledJobs": linear_memory_series(cancellations)?,
            "interpretation": "the instance-wide monotone high-water detects growth beyond earlier peaks; it cannot identify allocations that remain within already-reserved linear memory",
        },
        "quickJsHeap": {
            "allowedVariationBytes": ALLOWED_QUICKJS_HEAP_VARIATION_BYTES,
            "unchangedCompilerJobs": quickjs_heap_series(unchanged)?,
            "warmedIncrementalCompilerJobs": quickjs_heap_series(incremental)?,
            "failedCompilerJobs": quickjs_heap_series(failed)?,
            "interpretation": "before-tool-load samples compare fresh runtimes; after-compiler samples describe heap usage immediately before each runtime is dropped",
        },
    }))
}

struct InputHashes {
    build: String,
    benchmark: String,
}

fn input_hashes() -> anyhow::Result<InputHashes> {
    let source_root = std::env::var("AGENTIC_TS_SOURCE_ROOT").unwrap_or_else(|_| ".".to_string());
    let source_root = Utf8Path::new(&source_root);

    let mut build_files = input_files(&[
        "Cargo.toml",
        "Cargo.lock",
        ".github/scripts/enable-wasmtime-fork.sh",
        "crates/golem-context/Cargo.toml",
        "crates/golem-websocket/Cargo.toml",
        "crates/wasi-logging/Cargo.toml",
        "crates/wasm-rquickjs/Cargo.toml",
        "crates/wasm-rquickjs/skeleton/Cargo.toml_",
        "crates/wasm-rquickjs/skeleton/Cargo.lock",
    ]);
    for directory in [
        "crates/wasi-logging/src",
        "crates/wasm-rquickjs/src",
        "crates/wasm-rquickjs/skeleton/src",
        EXAMPLE_DIR,
    ] {
        collect_input_files(source_root, Utf8Path::new(directory), &mut build_files)?;
    }

    let mut benchmark_files = input_files(&[
        "tests/agentic_ts.rs",
        "tests/agentic_ts/package.json",
        "tests/agentic_ts/package-lock.json",
        "tests/agentic_ts/tsconfig.json",
        "tests/agentic_ts/run.sh",
        "tools/dev-test.sh",
    ]);
    collect_input_files(
        source_root,
        Utf8Path::new("tests/agentic_ts/projects"),
        &mut benchmark_files,
    )?;
    for directory in [
        "tests/common",
        "crates/golem-websocket/wit",
        "crates/golem-websocket/wit-p3",
    ] {
        collect_input_files(source_root, Utf8Path::new(directory), &mut benchmark_files)?;
    }
    for required in [
        "tests/common/js_subtest_parser.rs",
        "tests/common/test_server.rs",
        "crates/golem-websocket/wit/golem-websocket.wit",
        "crates/golem-websocket/wit-p3/golem-websocket.wit",
    ] {
        anyhow::ensure!(
            benchmark_files.contains(Utf8Path::new(required)),
            "required benchmark input is not covered: {required}"
        );
    }

    Ok(InputHashes {
        build: composite_hash(source_root, "build", &build_files)?,
        benchmark: composite_hash(source_root, "benchmark", &benchmark_files)?,
    })
}

fn input_files(paths: &[&str]) -> BTreeSet<camino::Utf8PathBuf> {
    paths
        .iter()
        .map(|path| Utf8Path::new(path).to_path_buf())
        .collect()
}

fn collect_input_files(
    source_root: &Utf8Path,
    directory: &Utf8Path,
    files: &mut BTreeSet<camino::Utf8PathBuf>,
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
            "input symlinks are unsupported: {path}"
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

fn composite_hash(
    source_root: &Utf8Path,
    domain: &str,
    files: &BTreeSet<camino::Utf8PathBuf>,
) -> anyhow::Result<String> {
    anyhow::ensure!(!files.is_empty(), "{domain} input set is empty");
    let mut hasher = blake3::Hasher::new();
    hash_part(&mut hasher, INPUT_HASH_ALGORITHM.as_bytes());
    hash_part(&mut hasher, domain.as_bytes());
    for path in files {
        anyhow::ensure!(
            path.is_relative()
                && !path
                    .components()
                    .any(|component| component.as_str() == ".."),
            "input path escapes the source root: {path}"
        );
        let metadata = fs::symlink_metadata(source_root.join(path))?;
        anyhow::ensure!(
            metadata.is_file() && !metadata.file_type().is_symlink(),
            "input is not a regular file: {path}"
        );
        let components = path.components().collect::<Vec<_>>();
        hasher.update(&(components.len() as u64).to_le_bytes());
        for component in components {
            hash_part(&mut hasher, component.as_str().as_bytes());
        }
        hash_part(&mut hasher, &fs::read(source_root.join(path))?);
    }
    Ok(hasher.finalize().to_hex().to_string())
}

fn hash_part(hasher: &mut blake3::Hasher, bytes: &[u8]) {
    hasher.update(&(bytes.len() as u64).to_le_bytes());
    hasher.update(bytes);
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

fn validate_composite_hash_contract() -> anyhow::Result<()> {
    let root = camino_tempfile::Utf8TempDir::new()?;
    fs::create_dir(root.path().join("inputs"))?;
    fs::write(root.path().join("inputs/a.txt"), b"alpha")?;

    let mut files = BTreeSet::new();
    collect_input_files(root.path(), Utf8Path::new("inputs"), &mut files)?;
    let original = composite_hash(root.path(), "test", &files)?;
    anyhow::ensure!(
        original == composite_hash(root.path(), "test", &files)?,
        "composite input hashes are not deterministic"
    );

    fs::write(root.path().join("unrelated.txt"), b"ignored")?;
    anyhow::ensure!(
        original == composite_hash(root.path(), "test", &files)?,
        "an out-of-scope file changed the composite hash"
    );

    fs::write(root.path().join("inputs/a.txt"), b"changed")?;
    anyhow::ensure!(
        original != composite_hash(root.path(), "test", &files)?,
        "an input content change did not change the composite hash"
    );

    fs::write(root.path().join("inputs/b.txt"), b"beta")?;
    let mut added_files = BTreeSet::new();
    collect_input_files(root.path(), Utf8Path::new("inputs"), &mut added_files)?;
    anyhow::ensure!(
        files.len() + 1 == added_files.len()
            && composite_hash(root.path(), "test", &files)?
                != composite_hash(root.path(), "test", &added_files)?,
        "an added input file did not change the composite hash"
    );
    anyhow::ensure!(
        composite_hash(root.path(), "test", &added_files)?
            != composite_hash(root.path(), "different-domain", &added_files)?,
        "the composite hash does not separate input domains"
    );
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
        "commitHint": command_text(Command::new("git").args(["rev-parse", "HEAD"]))?,
        "dirty": !command_text(Command::new("git").args(["status", "--porcelain"]))?.is_empty(),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rustc": command_text(Command::new("rustc").arg("--version"))?,
        "cargo": command_text(Command::new("cargo").arg("--version"))?,
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
    anyhow::ensure!(
        report["nodeBaseline"]["exitCode"] == 0,
        "Node baseline failed"
    );
    for path in [
        "/workloads/coldNoEmit/result/value/exitCode",
        "/workloads/incrementalCold/result/value/exitCode",
        "/workloads/invalidThenValid/recovery/result/value/exitCode",
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
    let failed_checks = report["workloads"]["invalidThenValid"]["failedChecks"]["samples"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("missing repeated failed type checks"))?;
    anyhow::ensure!(
        failed_checks.len() >= 5
            && failed_checks.iter().all(|sample| {
                sample.pointer("/result/value/exitCode") == Some(&json!(2))
                    && sample["result"]["stdout"]
                        .as_str()
                        .is_some_and(|stdout| stdout.contains("error TS2322"))
                    && sample["result"]["overflowed"] == false
                    && sample["result"].get("runnerError").is_none()
            }),
        "a repeated invalid TypeScript check unexpectedly passed or failed incorrectly"
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
    validate_termination_series(
        &report["workloads"]["timeouts"],
        "timedOut",
        "execution job timed out",
    )?;
    validate_termination_series(
        &report["workloads"]["cancellations"],
        "cancelled",
        "execution job cancelled",
    )?;

    let memory = &report["workloads"]["memoryPlateau"];
    anyhow::ensure!(
        memory["wasmLinearMemory"]["allowedGrowthBytes"] == ALLOWED_LINEAR_MEMORY_GROWTH_BYTES,
        "report changed the Wasm linear-memory growth limit"
    );
    for group in [
        "unchangedCompilerJobs",
        "warmedIncrementalCompilerJobs",
        "failedCompilerJobs",
        "timedOutJobs",
        "cancelledJobs",
    ] {
        anyhow::ensure!(
            memory["wasmLinearMemory"][group]["growthBytes"]
                .as_u64()
                .unwrap_or(u64::MAX)
                <= ALLOWED_LINEAR_MEMORY_GROWTH_BYTES,
            "Wasm linear-memory growth did not plateau for {group}"
        );
    }
    anyhow::ensure!(
        memory["quickJsHeap"]["allowedVariationBytes"] == ALLOWED_QUICKJS_HEAP_VARIATION_BYTES,
        "report changed the QuickJS heap-variation limit"
    );
    for group in [
        "unchangedCompilerJobs",
        "warmedIncrementalCompilerJobs",
        "failedCompilerJobs",
    ] {
        for point in ["beforeToolLoad", "afterCompiler"] {
            anyhow::ensure!(
                memory["quickJsHeap"][group][point]["samples"]
                    .as_array()
                    .is_some_and(|samples| samples.len() >= 5)
                    && memory["quickJsHeap"][group][point]["variationBytes"]
                        .as_u64()
                        .unwrap_or(u64::MAX)
                        <= ALLOWED_QUICKJS_HEAP_VARIATION_BYTES,
                "fresh-job QuickJS heap samples varied unexpectedly for {group}/{point}"
            );
        }
    }
    Ok(())
}

fn successful_result(value: &Value) -> bool {
    value["overflowed"] == false
        && value.get("runnerError").is_none()
        && value.get("value").is_some()
}

fn validate_termination_series(
    series: &Value,
    outcome: &str,
    expected_message: &str,
) -> anyhow::Result<()> {
    let samples = series["attempts"]["samples"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("missing repeated {outcome} samples"))?;
    anyhow::ensure!(
        samples.len() >= 5
            && samples.iter().all(|sample| {
                sample["result"][outcome] == true
                    && sample["result"]["message"] == expected_message
                    && sample["wallMs"]
                        .as_f64()
                        .is_some_and(|wall_ms| wall_ms < 1_000.0)
            }),
        "repeated {outcome} probe failed"
    );
    anyhow::ensure!(
        successful_result(&series["recovery"]["result"])
            && series["recovery"].pointer("/result/value/answer") == Some(&json!(42)),
        "execution capacity was not recovered after repeated {outcome} jobs"
    );
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
    false_timeout["workloads"]["timeouts"]["attempts"]["samples"][0]["result"]["message"] =
        json!("unrelated error");
    anyhow::ensure!(
        validate_report(&false_timeout).is_err(),
        "validation guard accepted an unrelated timeout error"
    );
    let mut invalid_runner_error = report.clone();
    invalid_runner_error["workloads"]["invalidThenValid"]["failedChecks"]["samples"][0]["result"] =
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
    let mut leaked_heap = report.clone();
    leaked_heap["workloads"]["memoryPlateau"]["quickJsHeap"]["unchangedCompilerJobs"]["beforeToolLoad"]
        ["variationBytes"] = json!(u64::MAX);
    anyhow::ensure!(
        validate_report(&leaked_heap).is_err(),
        "validation guard accepted unbounded fresh-job heap variation"
    );
    let mut relaxed_linear_memory = report.clone();
    relaxed_linear_memory["workloads"]["memoryPlateau"]["wasmLinearMemory"]["allowedGrowthBytes"] =
        json!(u64::MAX);
    anyhow::ensure!(
        validate_report(&relaxed_linear_memory).is_err(),
        "validation guard accepted a report-controlled linear-memory limit"
    );
    let mut relaxed_quickjs_heap = report.clone();
    relaxed_quickjs_heap["workloads"]["memoryPlateau"]["quickJsHeap"]["allowedVariationBytes"] =
        json!(u64::MAX);
    anyhow::ensure!(
        validate_report(&relaxed_quickjs_heap).is_err(),
        "validation guard accepted a report-controlled QuickJS heap limit"
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

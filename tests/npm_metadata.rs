//! Manual npm metadata benchmark; no network access or benchmark thresholds in CI.
#![allow(dead_code)] // The shared test host also serves the broader runtime test suite.
#[path = "common/mod.rs"]
mod common;

use anyhow::{Context, ensure};
use axum::{Router, body::Body, http::StatusCode, routing::get};
use camino::Utf8Path;
use common::{
    CompiledTest, FeatureCombination, PreparedComponent, TestInstance, TestTarget,
    copy_dir_recursive, test_target,
};
use serde_json::{Value, json};
use std::{
    fs,
    process::Command,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
    time::Instant,
};
use wasmtime::component::Val;

const VERSION: &str = "4.17.12";
const PACKAGES: &[(&str, &str)] = &[
    ("lodash", "@types/lodash"),
    ("lodash-es", "@types/lodash-es"),
];

fn target_name() -> &'static str {
    match test_target() {
        TestTarget::P2 => "p2",
        TestTarget::P3 => "p3",
    }
}

fn command(command: &mut Command) -> anyhow::Result<String> {
    let output = command.output()?;
    ensure!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(String::from_utf8(output.stdout)?.trim().to_owned())
}

fn cpu_ms() -> f64 {
    let mut usage = std::mem::MaybeUninit::<libc::rusage>::uninit();
    // SAFETY: getrusage writes the complete rusage on success.
    if unsafe { libc::getrusage(libc::RUSAGE_SELF, usage.as_mut_ptr()) } != 0 {
        return f64::NAN;
    }
    let usage = unsafe { usage.assume_init() };
    let micros = |t: libc::timeval| t.tv_sec as f64 * 1_000_000. + t.tv_usec as f64;
    (micros(usage.ru_utime) + micros(usage.ru_stime)) / 1000.
}

fn list(args: &[&str]) -> Val {
    Val::List(args.iter().map(|s| Val::String((*s).into())).collect())
}

async fn instance(prepared: &PreparedComponent, fixture: bool) -> anyhow::Result<TestInstance> {
    let instance = TestInstance::from_prepared(prepared).await?;
    let root = instance.temp_dir_path();
    for dir in [
        "tool/npm",
        "workspace",
        "home/npm",
        "cache/npm",
        "prefix/lib/node_modules",
        "prefix/bin",
    ] {
        fs::create_dir_all(root.join(dir))?;
    }
    let npm_root = command(Command::new("npm").args(["root", "-g"]))?;
    copy_dir_recursive(
        Utf8Path::new(&npm_root).join("npm").as_std_path(),
        root.join("tool/npm").as_std_path(),
    )?;
    if fixture {
        for file in ["package.json", "package-lock.json"] {
            fs::copy(
                Utf8Path::new("tests/npm_metadata/real").join(file),
                root.join("workspace").join(file),
            )?;
        }
    }
    Ok(instance)
}

fn pack(name: &str, destination: &Utf8Path) -> anyhow::Result<Vec<u8>> {
    let output = command(Command::new("npm").args([
        "pack",
        &format!("@types/{name}@{VERSION}"),
        "--json",
        "--ignore-scripts",
        "--registry=https://registry.npmjs.org/",
        "--pack-destination",
        destination.as_str(),
    ]))?;
    let value: Value = serde_json::from_str(&output)?;
    let filename = value[0]["filename"].as_str().context("npm pack filename")?;
    Ok(fs::read(destination.join(filename))?)
}

async fn local_registry(
    root: &Utf8Path,
) -> anyhow::Result<(String, tokio::task::JoinHandle<()>, Arc<AtomicUsize>)> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let base = format!("http://127.0.0.1:{}", listener.local_addr()?.port());
    let requests = Arc::new(AtomicUsize::new(0));
    let mut router = Router::new();
    for (short, name) in PACKAGES {
        let tarball = pack(short, root)?;
        let path = format!("/@types/{short}/-/{short}-{VERSION}.tgz");
        let metadata_path = format!("/@types%2f{short}");
        let dependencies = if *short == "lodash-es" {
            json!({"@types/lodash": "*"})
        } else {
            json!({})
        };
        let mut metadata = json!({"name": name, "dist-tags": {"latest": VERSION}, "versions": {}});
        metadata["versions"][VERSION] = json!({"name": name, "version": VERSION,
            "dependencies": dependencies, "dist": {"tarball": format!("{base}{path}")}});
        let counter = requests.clone();
        router = router.route(
            &metadata_path,
            get(move || {
                let counter = counter.clone();
                let metadata = metadata.clone();
                async move {
                    counter.fetch_add(1, Ordering::Relaxed);
                    axum::Json(metadata)
                }
            }),
        );
        let counter = requests.clone();
        router = router.route(
            &path,
            get(move || {
                let counter = counter.clone();
                let body = tarball.clone();
                async move {
                    counter.fetch_add(1, Ordering::Relaxed);
                    (StatusCode::OK, Body::from(body))
                }
            }),
        );
    }
    let server = tokio::spawn(async move {
        axum::serve(listener, router).await.expect("local registry");
    });
    Ok((base, server, requests))
}

async fn sample(
    prepared: &PreparedComponent,
    operation: &str,
    registry: &str,
    local: bool,
    sequence: usize,
    requests: Option<&AtomicUsize>,
) -> anyhow::Result<Vec<Value>> {
    let mut instance = instance(prepared, operation == "ci").await?;
    if local && operation == "ci" {
        let lock_path = instance.temp_dir_path().join("workspace/package-lock.json");
        let mut lock: Value = serde_json::from_slice(&fs::read(&lock_path)?)?;
        for (short, _) in PACKAGES {
            lock["packages"][format!("node_modules/@types/{short}")]["resolved"] = json!(format!(
                "{}/@types/{short}/-/{short}-{VERSION}.tgz",
                registry.trim_end_matches('/')
            ));
        }
        fs::write(lock_path, serde_json::to_vec_pretty(&lock)?)?;
    }
    let registry_arg = format!("--registry={registry}");
    let args: Vec<&str> = match operation {
        "version" => vec!["--version"],
        "view" => vec![
            "view",
            "@types/lodash-es@4.17.12",
            "version",
            &registry_arg,
            "--loglevel=http",
        ],
        "ci" => vec![
            "ci",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            &registry_arg,
            "--loglevel=http",
        ],
        _ => anyhow::bail!("unknown operation {operation}"),
    };
    let mut samples = vec![
        measure(
            &mut instance,
            &args,
            operation,
            local,
            "cold",
            sequence,
            requests,
        )
        .await?,
    ];
    if operation != "version" {
        samples.push(
            measure(
                &mut instance,
                &args,
                operation,
                local,
                "warm",
                sequence + 1,
                requests,
            )
            .await?,
        );
    }
    Ok(samples)
}

async fn measure(
    instance: &mut TestInstance,
    args: &[&str],
    operation: &str,
    local: bool,
    cache: &str,
    sequence: usize,
    requests: Option<&AtomicUsize>,
) -> anyhow::Result<Value> {
    let before_http = requests.map(|counter| counter.load(Ordering::Relaxed));
    let before_cpu = cpu_ms();
    let start = Instant::now();
    instance.set_epoch_deadline(180);
    let value = instance.invoke(None, "run", &[list(args)]).await?;
    let wall_ms = start.elapsed().as_secs_f64() * 1000.;
    let cpu_ms = cpu_ms() - before_cpu;
    let Some(Val::String(encoded)) = value else {
        anyhow::bail!("npm did not return JSON");
    };
    let result: Value = serde_json::from_str(&encoded)?;
    let success = result["value"]["exitCode"] == 0 && result.get("runnerError").is_none();
    let installed = if operation == "ci" {
        instance
            .temp_dir_path()
            .join("workspace/node_modules/@types/lodash-es/package.json")
            .exists()
    } else {
        false
    };
    let count = requests
        .zip(before_http)
        .map(|(counter, before)| counter.load(Ordering::Relaxed) - before);
    let stderr = result["stderr"].as_str().unwrap_or_default();
    let http_fetches = stderr
        .lines()
        .filter(|line| line.starts_with("npm http fetch "))
        .count();
    let http_cache_hits = stderr
        .lines()
        .filter(|line| line.starts_with("npm http cache "))
        .count();
    Ok(
        json!({"sequence": sequence, "operation": operation, "registry": if local {"local"} else {"npmjs"},
        "cache": cache, "success": success && (operation != "ci" || installed), "installed": installed, "wallMs": wall_ms,
        "processCpuMs": cpu_ms, "localHttpRequests": count, "npmHttpFetchLogLines": http_fetches,
        "npmHttpCacheLogLines": http_cache_hits, "result": result}),
    )
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    if std::env::var("NPM_METADATA_RUN").as_deref() != Ok("1") {
        println!("npm metadata benchmark is manual; set NPM_METADATA_RUN=1 to measure");
        return Ok(());
    }
    ensure!(
        command(Command::new("node").args(["-p", "process.versions.node"]))? == "22.14.0",
        "requires Node 22.14.0"
    );
    ensure!(
        command(Command::new("npm").arg("--version"))? == "10.9.2",
        "requires npm 10.9.2"
    );
    let iterations = std::env::var("NPM_METADATA_ITERATIONS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(3);
    ensure!(
        iterations > 0 && iterations <= 20,
        "iterations must be 1..=20"
    );
    let compiled = CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/npm-compat"),
        true,
        FeatureCombination::TypeScriptCompilerProfiling,
    )
    .await?;
    // Immutable compilation/linker state is shared; every sample still has a new Store,
    // component instance, QuickJS runtime, workspace, and npm cache.
    let prepared = PreparedComponent::new(compiled.wasm_path())?;
    let pack_dir = camino_tempfile::tempdir()?;
    let (local, server, requests) = local_registry(pack_dir.path()).await?;
    let mut samples = Vec::new();
    for iteration in 0..iterations {
        // Alternate the order to limit drift, never run invocations concurrently.
        for local_first in [iteration % 2 == 1, iteration % 2 == 0] {
            let (url, count) = if local_first {
                (local.as_str(), Some(requests.as_ref()))
            } else {
                ("https://registry.npmjs.org/", None)
            };
            for operation in ["version", "view", "ci"] {
                let next = samples.len();
                for value in sample(&prepared, operation, url, local_first, next, count).await? {
                    eprintln!(
                        "{} {} {} {}: success={} wall={}ms",
                        target_name(),
                        value["registry"],
                        operation,
                        value["cache"],
                        value["success"],
                        value["wallMs"]
                    );
                    samples.push(value);
                }
            }
        }
    }
    server.abort();
    let report = json!({"schema": "npm-metadata-v1", "revision": command(Command::new("git").args(["rev-parse", "HEAD"]))?,
        "target": target_name(), "node": "22.14.0", "npm": "10.9.2",
        "componentFeature": "typescript-compiler-profiling", "iterations": iterations, "samples": samples});
    let output = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("NPM_METADATA_REPORT") {
        fs::write(path, format!("{output}\n"))?;
    }
    println!("{output}");
    Ok(())
}

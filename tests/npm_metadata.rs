//! Manual npm metadata benchmark; no network access or benchmark thresholds in CI.
#![allow(dead_code)] // The shared test host also serves the broader runtime test suite.
#[path = "common/mod.rs"]
mod common;

use anyhow::{Context, ensure};
use axum::{
    Router, body::Body, extract::Request, http::StatusCode, middleware::Next, routing::get,
};
use camino::{Utf8Path, Utf8PathBuf};
use common::{
    CompiledTest, FeatureCombination, PreparedComponent, TestInstance, TestTarget,
    copy_dir_recursive, test_target,
};
use serde_json::{Value, json};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    io::Read as _,
    process::Command,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
    time::{Duration, Instant},
};
use wasmtime::component::Val;

const VERSION: &str = "4.17.12";
const SUITE_DIR: &str = "tests/npm_metadata";
const EXAMPLE_DIR: &str = "examples/runtime/npm-compat";
const INPUT_HASH_ALGORITHM: &str = "blake3-composite-v1";
const HOST_TIMING_BOUNDARY: &str = "Node process spawn through exit; workspace preparation, cache seeding, and install-tree cleanup are excluded";
const WASM_TIMING_BOUNDARY: &str = "run export invocation through result; component instantiation, workspace preparation, cache seeding, install-tree cleanup, and linear-memory observation are excluded";
const MEMORY_INTERPRETATION: &str = "per-sample Wasm linear-memory values are monotone instance high-water observations read after the timed invocation";
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
    if std::env::var_os("NPM_METADATA_VALIDATE_REPORTS").is_some() {
        return validate_checked_release_reports(Utf8Path::new(SUITE_DIR).join("results"));
    }
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
    if std::env::var_os("NPM_METADATA_RELEASE_BASELINE").is_some() {
        ensure!(
            iterations >= 5,
            "release baseline requires at least five iterations"
        );
        return run_release_baseline(iterations).await;
    }
    run_legacy_baseline(iterations).await
}

async fn run_legacy_baseline(iterations: usize) -> anyhow::Result<()> {
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

#[derive(Clone, Copy, Debug, Default)]
struct RegistrySnapshot {
    metadata: usize,
    tarballs: usize,
    total: usize,
}

impl RegistrySnapshot {
    fn difference(self, before: Self) -> Self {
        Self {
            metadata: self.metadata - before.metadata,
            tarballs: self.tarballs - before.tarballs,
            total: self.total - before.total,
        }
    }

    fn value(self) -> Value {
        let classified = self.metadata + self.tarballs;
        json!({
            "metadata": self.metadata,
            "tarballs": self.tarballs,
            "total": self.total,
            "unexpected": self.total.saturating_sub(classified),
        })
    }
}

#[derive(Default)]
struct RegistryCounters {
    metadata: AtomicUsize,
    tarballs: AtomicUsize,
    total: AtomicUsize,
}

impl RegistryCounters {
    fn snapshot(&self) -> RegistrySnapshot {
        RegistrySnapshot {
            metadata: self.metadata.load(Ordering::Relaxed),
            tarballs: self.tarballs.load(Ordering::Relaxed),
            total: self.total.load(Ordering::Relaxed),
        }
    }
}

struct ReleaseRegistry {
    base: String,
    server: tokio::task::JoinHandle<()>,
    counters: Arc<RegistryCounters>,
    tarballs: BTreeMap<String, Value>,
}

async fn release_registry(root: &Utf8Path) -> anyhow::Result<ReleaseRegistry> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let base = format!("http://127.0.0.1:{}", listener.local_addr()?.port());
    let counters = Arc::new(RegistryCounters::default());
    let mut tarballs = BTreeMap::new();
    let mut router = Router::new();
    for (short, name) in PACKAGES {
        let tarball = pack(short, root)?;
        tarballs.insert(
            (*name).to_string(),
            json!({
                "bytes": tarball.len(),
                "blake3": blake3::hash(&tarball).to_hex().to_string(),
            }),
        );
        let path = format!("/@types/{short}/-/{short}-{VERSION}.tgz");
        let metadata_path = format!("/@types%2f{short}");
        let dependencies = if *short == "lodash-es" {
            json!({"@types/lodash": "*"})
        } else {
            json!({})
        };
        let mut metadata = json!({"name": name, "dist-tags": {"latest": VERSION}, "versions": {}});
        metadata["versions"][VERSION] = json!({
            "name": name,
            "version": VERSION,
            "dependencies": dependencies,
            "dist": {"tarball": format!("{base}{path}")},
        });
        let route_counters = counters.clone();
        router = router.route(
            &metadata_path,
            get(move || {
                let route_counters = route_counters.clone();
                let metadata = metadata.clone();
                async move {
                    route_counters.metadata.fetch_add(1, Ordering::Relaxed);
                    axum::Json(metadata)
                }
            }),
        );
        let route_counters = counters.clone();
        router = router.route(
            &path,
            get(move || {
                let route_counters = route_counters.clone();
                let body = tarball.clone();
                async move {
                    route_counters.tarballs.fetch_add(1, Ordering::Relaxed);
                    (StatusCode::OK, Body::from(body))
                }
            }),
        );
    }
    let total_counters = counters.clone();
    let router = router.layer(axum::middleware::from_fn(
        move |request: Request, next: Next| {
            let total_counters = total_counters.clone();
            async move {
                total_counters.total.fetch_add(1, Ordering::Relaxed);
                next.run(request).await
            }
        },
    ));
    let server = tokio::spawn(async move {
        axum::serve(listener, router)
            .await
            .expect("release baseline local registry");
    });
    Ok(ReleaseRegistry {
        base,
        server,
        counters,
        tarballs,
    })
}

struct HostNpm {
    node: Utf8PathBuf,
    npm_cli: Utf8PathBuf,
    npm_dir: Utf8PathBuf,
}

fn resolve_host_npm() -> anyhow::Result<HostNpm> {
    let node = Utf8PathBuf::from(command(Command::new("which").arg("node"))?);
    let npm_dir = Utf8PathBuf::from(command(Command::new("npm").args(["root", "-g"]))?).join("npm");
    let npm_cli = npm_dir.join("bin/npm-cli.js");
    ensure!(
        node.is_file(),
        "resolved Node executable does not exist: {node}"
    );
    ensure!(
        npm_cli.is_file(),
        "resolved npm CLI does not exist: {npm_cli}"
    );
    let package: Value = serde_json::from_slice(&fs::read(npm_dir.join("package.json"))?)?;
    ensure!(
        package["version"] == "10.9.2",
        "resolved npm package is not 10.9.2"
    );
    Ok(HostNpm {
        node,
        npm_cli,
        npm_dir,
    })
}

fn prepare_release_root(root: &Utf8Path, fixture: bool, registry: &str) -> anyhow::Result<()> {
    for directory in [
        "workspace",
        "home/npm",
        "cache/npm",
        "prefix/lib/node_modules",
        "prefix/bin",
    ] {
        fs::create_dir_all(root.join(directory))?;
    }
    if fixture {
        for file in ["package.json", "package-lock.json"] {
            fs::copy(
                Utf8Path::new(SUITE_DIR).join("real").join(file),
                root.join("workspace").join(file),
            )?;
        }
        let lock_path = root.join("workspace/package-lock.json");
        let mut lock: Value = serde_json::from_slice(&fs::read(&lock_path)?)?;
        for (short, _) in PACKAGES {
            lock["packages"][format!("node_modules/@types/{short}")]["resolved"] = json!(format!(
                "{}/@types/{short}/-/{short}-{VERSION}.tgz",
                registry.trim_end_matches('/')
            ));
        }
        fs::write(lock_path, serde_json::to_vec_pretty(&lock)?)?;
    }
    Ok(())
}

async fn release_instance(
    prepared: &PreparedComponent,
    npm_dir: &Utf8Path,
    fixture: bool,
    registry: &str,
) -> anyhow::Result<TestInstance> {
    let instance = TestInstance::from_prepared_with_memory_tracking(prepared).await?;
    prepare_release_root(instance.temp_dir_path(), fixture, registry)?;
    fs::create_dir_all(instance.temp_dir_path().join("tool/npm"))?;
    copy_dir_recursive(
        npm_dir.as_std_path(),
        instance.temp_dir_path().join("tool/npm").as_std_path(),
    )?;
    Ok(instance)
}

fn metadata_args(registry: &str) -> Vec<String> {
    vec![
        "view".to_string(),
        format!("@types/lodash-es@{VERSION}"),
        "version".to_string(),
        format!("--registry={registry}"),
        "--prefer-offline".to_string(),
        "--loglevel=http".to_string(),
    ]
}

fn seed_ci_args(registry: &str) -> Vec<String> {
    vec![
        "ci".to_string(),
        "--install-links".to_string(),
        "--ignore-scripts".to_string(),
        "--no-audit".to_string(),
        "--no-fund".to_string(),
        format!("--registry={registry}"),
        "--loglevel=http".to_string(),
    ]
}

fn warm_ci_args(registry: &str) -> Vec<String> {
    vec![
        "ci".to_string(),
        "--offline".to_string(),
        "--install-links".to_string(),
        "--ignore-scripts".to_string(),
        "--no-audit".to_string(),
        "--no-fund".to_string(),
        format!("--registry={registry}"),
        "--loglevel=http".to_string(),
    ]
}

fn release_series_arguments(registry: &str) -> Value {
    json!({
        "metadata": metadata_args(registry),
        "ciSeed": seed_ci_args(registry),
        "ciTimed": warm_ci_args(registry),
    })
}

fn release_timing_boundary() -> Value {
    json!({
        "host": HOST_TIMING_BOUNDARY,
        "wasm": WASM_TIMING_BOUNDARY,
    })
}

fn installed_state(root: &Utf8Path) -> Value {
    let mut packages = BTreeMap::new();
    let mut complete = true;
    for (short, name) in PACKAGES {
        let path = root
            .join("workspace/node_modules/@types")
            .join(short)
            .join("package.json");
        let identity = fs::read(&path)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
            .map(|package| {
                json!({
                    "name": package["name"],
                    "version": package["version"],
                })
            });
        complete &= identity
            .as_ref()
            .is_some_and(|identity| identity["name"] == *name && identity["version"] == VERSION);
        packages.insert((*name).to_string(), identity);
    }
    let mut top_level = fs::read_dir(root.join("workspace/node_modules/@types"))
        .ok()
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect::<Vec<_>>();
    top_level.sort();
    complete &= top_level == ["lodash", "lodash-es"];
    json!({"complete": complete, "packages": packages, "topLevel": top_level})
}

struct ReleaseSampleContext<'a> {
    side: &'a str,
    operation: &'a str,
    cache: &'a str,
    sequence: usize,
    root: &'a Utf8Path,
    requests: RegistrySnapshot,
    linear_memory_high_water_bytes: Option<usize>,
    lockfile_before: Option<String>,
}

fn finish_release_sample(
    context: ReleaseSampleContext<'_>,
    wall_ms: f64,
    result: Value,
) -> anyhow::Result<Value> {
    let ReleaseSampleContext {
        side,
        operation,
        cache,
        sequence,
        root,
        requests,
        linear_memory_high_water_bytes,
        lockfile_before,
    } = context;
    let installed = (operation == "ci").then(|| installed_state(root));
    let lockfile_after = if operation == "ci" {
        Some(hash_file(root.join("workspace/package-lock.json"))?)
    } else {
        None
    };
    let lockfile_unchanged = lockfile_before
        .as_ref()
        .zip(lockfile_after.as_ref())
        .map(|(before, after)| before == after);
    let expected_output =
        operation != "view" || result["stdout"].as_str().unwrap_or_default().trim() == VERSION;
    let installed_ok = installed
        .as_ref()
        .is_none_or(|value| value["complete"] == true);
    let success = result["value"]["exitCode"] == 0
        && result["overflowed"] == false
        && result.get("runnerError").is_none()
        && expected_output
        && installed_ok
        && lockfile_unchanged.is_none_or(|unchanged| unchanged);
    let stderr = result["stderr"].as_str().unwrap_or_default();
    let npm_http_fetch_log_lines = stderr
        .lines()
        .filter(|line| line.starts_with("npm http fetch "))
        .count();
    let npm_http_cache_log_lines = stderr
        .lines()
        .filter(|line| line.starts_with("npm http cache "))
        .count();
    Ok(json!({
        "sequence": sequence,
        "side": side,
        "operation": operation,
        "registry": "local",
        "cache": cache,
        "success": success,
        "installed": installed,
        "lockfileBlake3": lockfile_after,
        "lockfileUnchanged": lockfile_unchanged,
        "wallMs": wall_ms,
        "localHttpRequests": requests.value(),
        "npmHttpFetchLogLines": npm_http_fetch_log_lines,
        "npmHttpCacheLogLines": npm_http_cache_log_lines,
        "linearMemoryHighWaterBytes": linear_memory_high_water_bytes,
        "result": result,
    }))
}

fn host_npm_sample(
    host: &HostNpm,
    root: &Utf8Path,
    args: &[String],
    operation: &str,
    cache: &str,
    sequence: usize,
    counters: &RegistryCounters,
) -> anyhow::Result<Value> {
    let lockfile_before = (operation == "ci")
        .then(|| hash_file(root.join("workspace/package-lock.json")))
        .transpose()?;
    let before = counters.snapshot();
    let mut command = Command::new(&host.node);
    command
        .arg(&host.npm_cli)
        .args(args)
        .current_dir(root.join("workspace"))
        .env_clear()
        .env("HOME", root.join("home/npm"))
        .env("NODE", &host.node)
        .env("NPM", &host.npm_cli)
        .env("NPM_CONFIG_AUDIT", "false")
        .env("NPM_CONFIG_CACHE", root.join("cache/npm"))
        .env("NPM_CONFIG_FETCH_RETRIES", "0")
        .env("NPM_CONFIG_FUND", "false")
        .env("NPM_CONFIG_PREFIX", root.join("prefix"))
        .env("NPM_CONFIG_UPDATE_NOTIFIER", "false")
        .env("PATH", "");
    let started = Instant::now();
    let output = command.output()?;
    let wall_ms = millis(started.elapsed());
    let result = json!({
        "value": {"exitCode": output.status.code().unwrap_or(-1)},
        "stdout": String::from_utf8_lossy(&output.stdout),
        "stderr": String::from_utf8_lossy(&output.stderr),
        "overflowed": false,
    });
    finish_release_sample(
        ReleaseSampleContext {
            side: "host",
            operation,
            cache,
            sequence,
            root,
            requests: counters.snapshot().difference(before),
            linear_memory_high_water_bytes: None,
            lockfile_before,
        },
        wall_ms,
        result,
    )
}

async fn wasm_npm_sample(
    instance: &mut TestInstance,
    args: &[String],
    operation: &str,
    cache: &str,
    sequence: usize,
    counters: &RegistryCounters,
) -> anyhow::Result<Value> {
    let lockfile_before = (operation == "ci")
        .then(|| hash_file(instance.temp_dir_path().join("workspace/package-lock.json")))
        .transpose()?;
    let before = counters.snapshot();
    instance.set_epoch_deadline(180);
    let arguments = [Val::List(
        args.iter()
            .map(|value| Val::String(value.clone()))
            .collect(),
    )];
    let started = Instant::now();
    let value = instance.invoke(None, "run", &arguments).await?;
    let wall_ms = millis(started.elapsed());
    let Some(Val::String(encoded)) = value else {
        anyhow::bail!("measured npm did not return JSON")
    };
    let result: Value = serde_json::from_str(&encoded)?;
    finish_release_sample(
        ReleaseSampleContext {
            side: "wasm",
            operation,
            cache,
            sequence,
            root: instance.temp_dir_path(),
            requests: counters.snapshot().difference(before),
            linear_memory_high_water_bytes: Some(instance.linear_memory_high_water_bytes()),
            lockfile_before,
        },
        wall_ms,
        result,
    )
}

struct ReleaseIteration {
    metadata_cold: Value,
    ci_seed: Value,
    ci_warm: Value,
}

fn host_release_iteration(
    host: &HostNpm,
    registry: &ReleaseRegistry,
    sequence: usize,
) -> anyhow::Result<ReleaseIteration> {
    let metadata_root = camino_tempfile::Utf8TempDir::new()?;
    prepare_release_root(metadata_root.path(), false, &registry.base)?;
    let metadata_args = metadata_args(&registry.base);
    let metadata_cold = host_npm_sample(
        host,
        metadata_root.path(),
        &metadata_args,
        "view",
        "cold",
        sequence,
        &registry.counters,
    )?;
    let ci_root = camino_tempfile::Utf8TempDir::new()?;
    prepare_release_root(ci_root.path(), true, &registry.base)?;
    let ci_seed = host_npm_sample(
        host,
        ci_root.path(),
        &seed_ci_args(&registry.base),
        "ci",
        "seed",
        sequence,
        &registry.counters,
    )?;
    ensure!(ci_seed["success"] == true, "host npm ci cache seed failed");
    fs::remove_dir_all(ci_root.path().join("workspace/node_modules"))?;
    let ci_warm = host_npm_sample(
        host,
        ci_root.path(),
        &warm_ci_args(&registry.base),
        "ci",
        "warm-tarball",
        sequence,
        &registry.counters,
    )?;
    Ok(ReleaseIteration {
        metadata_cold,
        ci_seed,
        ci_warm,
    })
}

async fn wasm_release_iteration(
    prepared: &PreparedComponent,
    npm_dir: &Utf8Path,
    registry: &ReleaseRegistry,
    sequence: usize,
) -> anyhow::Result<ReleaseIteration> {
    let mut metadata_instance = release_instance(prepared, npm_dir, false, &registry.base).await?;
    let metadata_args = metadata_args(&registry.base);
    let metadata_cold = wasm_npm_sample(
        &mut metadata_instance,
        &metadata_args,
        "view",
        "cold",
        sequence,
        &registry.counters,
    )
    .await?;
    let mut ci_instance = release_instance(prepared, npm_dir, true, &registry.base).await?;
    let ci_seed = wasm_npm_sample(
        &mut ci_instance,
        &seed_ci_args(&registry.base),
        "ci",
        "seed",
        sequence,
        &registry.counters,
    )
    .await?;
    ensure!(ci_seed["success"] == true, "Wasm npm ci cache seed failed");
    fs::remove_dir_all(ci_instance.temp_dir_path().join("workspace/node_modules"))?;
    let ci_warm = wasm_npm_sample(
        &mut ci_instance,
        &warm_ci_args(&registry.base),
        "ci",
        "warm-tarball",
        sequence,
        &registry.counters,
    )
    .await?;
    Ok(ReleaseIteration {
        metadata_cold,
        ci_seed,
        ci_warm,
    })
}

#[derive(Default)]
struct ReleaseSeries {
    metadata_cold: Vec<Value>,
    ci_seeds: Vec<Value>,
    ci_warm: Vec<Value>,
}

impl ReleaseSeries {
    fn push(&mut self, iteration: ReleaseIteration) {
        self.metadata_cold.push(iteration.metadata_cold);
        self.ci_seeds.push(iteration.ci_seed);
        self.ci_warm.push(iteration.ci_warm);
    }

    fn value(&self) -> Value {
        json!({
            "metadata": {
                "cold": summarize_release(&self.metadata_cold),
            },
            "warmTarballCi": {
                "seeds": summarize_release(&self.ci_seeds),
                "timed": summarize_release(&self.ci_warm),
            },
        })
    }

    fn samples(&self) -> impl Iterator<Item = &Value> {
        self.metadata_cold
            .iter()
            .chain(&self.ci_seeds)
            .chain(&self.ci_warm)
    }
}

async fn run_release_baseline(iterations: usize) -> anyhow::Result<()> {
    let host = resolve_host_npm()?;
    let build_started = Instant::now();
    let feature_combination = FeatureCombination::Normal;
    let compiled =
        CompiledTest::new_with_features(Utf8Path::new(EXAMPLE_DIR), true, feature_combination)
            .await?;
    let build_elapsed = build_started.elapsed();
    let component_size = fs::metadata(compiled.wasm_path())?.len();
    let prepare_started = Instant::now();
    let prepared = PreparedComponent::new(compiled.wasm_path())?;
    let prepare_elapsed = prepare_started.elapsed();
    let pack_dir = camino_tempfile::tempdir()?;
    let registry = release_registry(pack_dir.path()).await?;

    let mut host_series = ReleaseSeries::default();
    let mut wasm_series = ReleaseSeries::default();
    for iteration in 0..iterations {
        if iteration % 2 == 0 {
            host_series.push(host_release_iteration(&host, &registry, iteration)?);
            wasm_series.push(
                wasm_release_iteration(&prepared, &host.npm_dir, &registry, iteration).await?,
            );
        } else {
            wasm_series.push(
                wasm_release_iteration(&prepared, &host.npm_dir, &registry, iteration).await?,
            );
            host_series.push(host_release_iteration(&host, &registry, iteration)?);
        }
    }
    registry.server.abort();

    let environment = release_environment(iterations, feature_combination.label())?;
    let input_hashes = npm_input_hashes()?;
    let npm_tool = directory_hash_evidence(&host.npm_dir)?;
    let max_linear_memory = wasm_series
        .samples()
        .filter_map(|sample| sample["linearMemoryHighWaterBytes"].as_u64())
        .max()
        .unwrap_or(0);
    let report = json!({
        "schema": "npm-metadata-v2",
        "environment": environment,
        "inputs": {
            "algorithm": INPUT_HASH_ALGORITHM,
            "buildHash": input_hashes.build,
            "benchmarkHash": input_hashes.benchmark,
        },
        "target": target_name(),
        "fixture": {
            "name": "small-local-registry",
            "packages": PACKAGES.iter().map(|(_, name)| *name).collect::<Vec<_>>(),
            "version": VERSION,
            "packageJsonBlake3": hash_file(Utf8Path::new(SUITE_DIR).join("real/package.json"))?,
            "packageLockBlake3": hash_file(Utf8Path::new(SUITE_DIR).join("real/package-lock.json"))?,
            "npmTool": npm_tool,
            "tarballs": registry.tarballs,
            "seriesArguments": release_series_arguments("<local>"),
        },
        "component": {
            "path": compiled.wasm_path().as_str(),
            "bytes": component_size,
            "blake3": hash_file(compiled.wasm_path())?,
            "buildMs": millis(build_elapsed),
            "initialPrepareMs": millis(prepare_elapsed),
        },
        "host": host_series.value(),
        "wasm": wasm_series.value(),
        "timingBoundary": release_timing_boundary(),
        "memory": {
            "maxWasmLinearMemoryHighWaterBytes": max_linear_memory,
            "series": {
                "metadataCold": release_memory_series(&wasm_series.metadata_cold)?,
                "ciSeeds": release_memory_series(&wasm_series.ci_seeds)?,
                "ciWarmTarball": release_memory_series(&wasm_series.ci_warm)?,
            },
            "interpretation": MEMORY_INTERPRETATION,
        },
        "notes": [
            "manual local release measurement; no CI timing threshold",
            "production normal feature; profiling-only instrumentation disabled",
            "host and Wasm use the same loopback registry and pinned tarball bytes",
            "each iteration has independent host and Wasm workspaces and caches",
            "timed npm ci runs offline after an untimed local-registry seed and external node_modules removal",
        ],
    });
    validate_release_report(&report)?;
    validate_release_regression_guards(&report)?;
    let formatted = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("NPM_METADATA_REPORT") {
        fs::write(path, format!("{formatted}\n"))?;
    }
    println!("{formatted}");
    Ok(())
}

fn millis(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1000.0
}

fn summarize_release(samples: &[Value]) -> Value {
    let mut wall_ms = samples
        .iter()
        .filter_map(|sample| sample["wallMs"].as_f64())
        .collect::<Vec<_>>();
    wall_ms.sort_by(f64::total_cmp);
    let median_ms = wall_ms[wall_ms.len() / 2];
    let p95_index = ((wall_ms.len() as f64 * 0.95).ceil() as usize)
        .saturating_sub(1)
        .min(wall_ms.len() - 1);
    let total_ms = wall_ms.iter().sum::<f64>();
    json!({
        "iterations": samples.len(),
        "medianMs": median_ms,
        "p95Ms": wall_ms[p95_index],
        "throughputPerSecond": 1000.0 * samples.len() as f64 / total_ms,
        "samples": samples,
    })
}

fn integer_series(values: Vec<u64>) -> Value {
    let minimum = values.iter().copied().min().unwrap_or(0);
    let maximum = values.iter().copied().max().unwrap_or(0);
    json!({
        "minimumBytes": minimum,
        "maximumBytes": maximum,
        "variationBytes": maximum - minimum,
        "samples": values,
    })
}

fn release_memory_series(samples: &[Value]) -> anyhow::Result<Value> {
    let linear = samples
        .iter()
        .map(|sample| {
            sample["linearMemoryHighWaterBytes"]
                .as_u64()
                .context("missing npm linear-memory sample")
        })
        .collect::<anyhow::Result<Vec<_>>>()?;
    Ok(json!({
        "linearMemoryHighWater": integer_series(linear),
    }))
}

struct NpmInputHashes {
    build: String,
    benchmark: String,
}

struct CurrentReleaseInputs {
    hashes: NpmInputHashes,
    package_json: String,
    package_lock: String,
}

fn npm_source_root() -> anyhow::Result<Utf8PathBuf> {
    let current_directory = Utf8PathBuf::from_path_buf(std::env::current_dir()?)
        .map_err(|path| anyhow::anyhow!("non-UTF-8 current directory: {}", path.display()))?;
    let configured = Utf8PathBuf::from(
        std::env::var("NPM_METADATA_SOURCE_ROOT").unwrap_or_else(|_| ".".to_string()),
    );
    Ok(if configured == Utf8Path::new(".") {
        current_directory
    } else if configured.is_absolute() {
        configured
    } else {
        current_directory.join(configured)
    })
}

fn npm_input_hashes() -> anyhow::Result<NpmInputHashes> {
    let source_root = npm_source_root()?;
    let source_root = source_root.as_path();
    let mut build_files = npm_input_files(&[
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
        collect_npm_input_files(source_root, Utf8Path::new(directory), &mut build_files)?;
    }
    let mut benchmark_files = npm_input_files(&[
        "tests/npm_metadata.rs",
        "tests/npm_metadata/real/package.json",
        "tests/npm_metadata/real/package-lock.json",
        "tests/npm_metadata/run.sh",
        "tools/dev-test.sh",
    ]);
    for directory in [
        "tests/common",
        "crates/golem-websocket/wit",
        "crates/golem-websocket/wit-p3",
    ] {
        collect_npm_input_files(source_root, Utf8Path::new(directory), &mut benchmark_files)?;
    }
    Ok(NpmInputHashes {
        build: npm_composite_hash(source_root, "build", &build_files)?,
        benchmark: npm_composite_hash(source_root, "benchmark", &benchmark_files)?,
    })
}

fn current_release_inputs() -> anyhow::Result<CurrentReleaseInputs> {
    let source_root = npm_source_root()?;
    Ok(CurrentReleaseInputs {
        hashes: npm_input_hashes()?,
        package_json: hash_file(source_root.join(SUITE_DIR).join("real/package.json"))?,
        package_lock: hash_file(source_root.join(SUITE_DIR).join("real/package-lock.json"))?,
    })
}

fn npm_input_files(paths: &[&str]) -> BTreeSet<Utf8PathBuf> {
    paths.iter().map(Utf8PathBuf::from).collect()
}

fn collect_npm_input_files(
    source_root: &Utf8Path,
    directory: &Utf8Path,
    files: &mut BTreeSet<Utf8PathBuf>,
) -> anyhow::Result<()> {
    for entry in fs::read_dir(source_root.join(directory))? {
        let entry = entry?;
        let name = entry
            .file_name()
            .into_string()
            .map_err(|name| anyhow::anyhow!("non-UTF-8 input name: {}", name.to_string_lossy()))?;
        let path = directory.join(name);
        let metadata = fs::symlink_metadata(source_root.join(&path))?;
        ensure!(
            !metadata.file_type().is_symlink(),
            "input symlinks are unsupported: {path}"
        );
        if metadata.is_dir() {
            collect_npm_input_files(source_root, &path, files)?;
        } else {
            ensure!(metadata.is_file(), "unsupported input type: {path}");
            files.insert(path);
        }
    }
    Ok(())
}

fn npm_composite_hash(
    source_root: &Utf8Path,
    domain: &str,
    files: &BTreeSet<Utf8PathBuf>,
) -> anyhow::Result<String> {
    ensure!(!files.is_empty(), "{domain} input set is empty");
    let mut hasher = blake3::Hasher::new();
    hash_part(&mut hasher, INPUT_HASH_ALGORITHM.as_bytes());
    hash_part(&mut hasher, domain.as_bytes());
    for path in files {
        ensure!(
            path.is_relative()
                && !path
                    .components()
                    .any(|component| component.as_str() == ".."),
            "input path escapes the source root: {path}"
        );
        let metadata = fs::symlink_metadata(source_root.join(path))?;
        ensure!(
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

fn hash_file(path: impl AsRef<Utf8Path>) -> anyhow::Result<String> {
    let mut file = fs::File::open(path.as_ref())?;
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

fn directory_hash_evidence(root: &Utf8Path) -> anyhow::Result<Value> {
    let mut files = BTreeSet::new();
    collect_npm_input_files(root, Utf8Path::new(""), &mut files)?;
    let bytes = files.iter().try_fold(0_u64, |total, path| {
        Ok::<_, anyhow::Error>(total + fs::metadata(root.join(path))?.len())
    })?;
    Ok(json!({
        "algorithm": INPUT_HASH_ALGORITHM,
        "blake3": npm_composite_hash(root, "npm-tool", &files)?,
        "files": files.len(),
        "bytes": bytes,
    }))
}

fn release_environment(iterations: usize, component_features: &str) -> anyhow::Result<Value> {
    let source_root = npm_source_root()?;
    let host_lock_blake3 = std::env::var("WASM_RQUICKJS_TEST_HOST_LOCKFILE")
        .ok()
        .map(hash_file)
        .transpose()?;
    let dirty = !command(Command::new("git").args([
        "-C",
        source_root.as_str(),
        "status",
        "--porcelain",
        "--",
        ".",
        ":(exclude)tests/npm_metadata/results/*.json",
    ]))?
    .is_empty();
    Ok(json!({
        "commitHint": command(Command::new("git").args(["-C", source_root.as_str(), "rev-parse", "HEAD"]))?,
        "dirty": dirty,
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rustc": command(Command::new("rustc").arg("--version"))?,
        "cargo": command(Command::new("cargo").arg("--version"))?,
        "node": command(Command::new("node").args(["-p", "process.versions.node"]))?,
        "npm": command(Command::new("npm").arg("--version"))?,
        "componentFeatures": component_features,
        "componentCargoProfile": std::env::var("WASM_RQUICKJS_TEST_COMPONENT_PROFILE")
            .unwrap_or_else(|_| "dev".to_string()),
        "harnessCargoProfile": if cfg!(debug_assertions) { "dev" } else { "release" },
        "lockedBuilds": std::env::var("WASM_RQUICKJS_TEST_LOCKED_BUILDS").ok(),
        "hostDependencyGraph": {
            "kind": if test_target() == TestTarget::P2 { "p2-shadow" } else { "workspace" },
            "lockBlake3": host_lock_blake3,
        },
        "iterations": iterations,
        "artifactCache": std::env::var("WASM_RQUICKJS_TEST_ARTIFACT_CACHE").ok(),
        "wasmtimeCache": std::env::var("WASM_RQUICKJS_TEST_WASMTIME_CACHE").ok(),
        "preparedComponentCache": std::env::var("WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE").ok(),
        "unoptimized": std::env::var("WASM_RQUICKJS_TEST_UNOPTIMIZED").ok(),
    }))
}

fn validate_release_report(report: &Value) -> anyhow::Result<()> {
    ensure!(
        report["schema"] == "npm-metadata-v2",
        "unsupported npm release schema"
    );
    let iterations = report["environment"]["iterations"]
        .as_u64()
        .filter(|value| *value >= 5)
        .context("npm release report needs at least five iterations")?
        as usize;
    ensure!(
        report["fixture"]["name"] == "small-local-registry"
            && report["fixture"]["version"] == VERSION
            && report["fixture"]["packages"] == json!(["@types/lodash", "@types/lodash-es"])
            && report["fixture"]["seriesArguments"] == release_series_arguments("<local>")
            && report["inputs"]["algorithm"] == INPUT_HASH_ALGORITHM
            && report["timingBoundary"] == release_timing_boundary()
            && report["memory"]["interpretation"] == MEMORY_INTERPRETATION
            && report["environment"]["componentFeatures"] == "normal"
            && report["environment"]["componentCargoProfile"] == "release"
            && report["environment"]["harnessCargoProfile"] == "release"
            && report["environment"]["lockedBuilds"] == "1",
        "npm release report does not identify the production small fixture"
    );
    let expected = [
        (
            "metadata", "cold", "view", "cold", 1_u64, 0_u64, 1_u64, 0_u64,
        ),
        ("warmTarballCi", "seeds", "ci", "seed", 0, 2, 2, 2),
        ("warmTarballCi", "timed", "ci", "warm-tarball", 0, 0, 0, 2),
    ];
    let mut max_linear_memory = 0;
    for side in ["host", "wasm"] {
        for (
            group,
            series_name,
            operation,
            cache,
            metadata_requests,
            tarball_requests,
            fetch_log_lines,
            cache_log_lines,
        ) in expected
        {
            let series = &report[side][group][series_name];
            let samples = series["samples"]
                .as_array()
                .with_context(|| format!("missing {side} {group}/{series_name} samples"))?;
            ensure!(
                samples.len() == iterations && series == &summarize_release(samples),
                "{side} {group}/{series_name} summary does not reconcile"
            );
            for sample in samples {
                let wall_ms = sample["wallMs"]
                    .as_f64()
                    .filter(|value| value.is_finite() && *value > 0.0);
                ensure!(
                    sample["side"] == side
                        && sample["operation"] == operation
                        && sample["cache"] == cache
                        && sample["registry"] == "local"
                        && sample["success"] == true
                        && sample["result"]["value"]["exitCode"] == 0
                        && sample["result"]["overflowed"] == false
                        && wall_ms.is_some()
                        && sample["localHttpRequests"]["metadata"] == metadata_requests
                        && sample["localHttpRequests"]["tarballs"] == tarball_requests
                        && sample["localHttpRequests"]["total"]
                            == metadata_requests + tarball_requests
                        && sample["localHttpRequests"]["unexpected"] == 0
                        && sample["npmHttpFetchLogLines"] == fetch_log_lines
                        && sample["npmHttpCacheLogLines"] == cache_log_lines,
                    "invalid {side} {group}/{series_name} sample: {sample}"
                );
                if operation == "view" {
                    ensure!(
                        sample["result"]["stdout"]
                            .as_str()
                            .is_some_and(|stdout| stdout.trim() == VERSION)
                            && sample["installed"].is_null(),
                        "metadata sample has incorrect output or install state"
                    );
                } else {
                    ensure!(
                        sample["installed"]["complete"] == true
                            && sample["installed"]["packages"]["@types/lodash"]["name"]
                                == "@types/lodash"
                            && sample["installed"]["packages"]["@types/lodash"]["version"]
                                == VERSION
                            && sample["installed"]["packages"]["@types/lodash-es"]["name"]
                                == "@types/lodash-es"
                            && sample["installed"]["packages"]["@types/lodash-es"]["version"]
                                == VERSION
                            && sample["installed"]["topLevel"] == json!(["lodash", "lodash-es"])
                            && sample["lockfileUnchanged"] == true
                            && is_blake3_value(&sample["lockfileBlake3"]),
                        "npm ci sample did not install the pinned fixture"
                    );
                }
                if side == "wasm" {
                    let linear = sample["linearMemoryHighWaterBytes"]
                        .as_u64()
                        .filter(|value| *value > 0)
                        .context("Wasm npm sample has no linear-memory evidence")?;
                    max_linear_memory = max_linear_memory.max(linear);
                } else {
                    ensure!(
                        sample["linearMemoryHighWaterBytes"].is_null(),
                        "host npm sample unexpectedly has Wasm memory"
                    );
                }
            }
        }
    }
    ensure!(
        max_linear_memory > 0
            && report["memory"]["maxWasmLinearMemoryHighWaterBytes"] == max_linear_memory,
        "npm release memory summary does not reconcile"
    );
    for (name, path) in [
        ("metadataCold", "/wasm/metadata/cold/samples"),
        ("ciSeeds", "/wasm/warmTarballCi/seeds/samples"),
        ("ciWarmTarball", "/wasm/warmTarballCi/timed/samples"),
    ] {
        let samples = report
            .pointer(path)
            .and_then(Value::as_array)
            .with_context(|| format!("missing Wasm npm memory source series {name}"))?;
        ensure!(
            report["memory"]["series"][name] == release_memory_series(samples)?,
            "npm release memory series does not reconcile for {name}"
        );
    }
    Ok(())
}

fn validate_release_regression_guards(report: &Value) -> anyhow::Result<()> {
    let mut false_arguments = report.clone();
    false_arguments["fixture"]["seriesArguments"]["ciTimed"][1] = json!("--online");
    ensure!(
        validate_release_report(&false_arguments).is_err(),
        "npm release validator accepted incorrect command arguments"
    );
    let mut false_timing = report.clone();
    false_timing["timingBoundary"]["wasm"] = json!("component build through result");
    ensure!(
        validate_release_report(&false_timing).is_err(),
        "npm release validator accepted an incorrect timing boundary"
    );
    let mut false_algorithm = report.clone();
    false_algorithm["inputs"]["algorithm"] = json!("unversioned");
    ensure!(
        validate_release_report(&false_algorithm).is_err(),
        "npm release validator accepted an incorrect input hash algorithm"
    );
    let mut failed = report.clone();
    failed["host"]["metadata"]["cold"]["samples"][0]["success"] = json!(false);
    ensure!(
        validate_release_report(&failed).is_err(),
        "npm release validator accepted a failed sample"
    );
    let mut false_http = report.clone();
    false_http["wasm"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]["tarballs"] =
        json!(1);
    ensure!(
        validate_release_report(&false_http).is_err(),
        "npm release validator accepted unexpected warm-cache HTTP"
    );
    let mut unclassified_http = report.clone();
    unclassified_http["wasm"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]["total"] =
        json!(1);
    unclassified_http["wasm"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]["unexpected"] =
        json!(1);
    ensure!(
        validate_release_report(&unclassified_http).is_err(),
        "npm release validator accepted an unclassified registry request"
    );
    let mut missing_install = report.clone();
    missing_install["host"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["complete"] =
        json!(false);
    ensure!(
        validate_release_report(&missing_install).is_err(),
        "npm release validator accepted an incomplete install"
    );
    let mut missing_memory = report.clone();
    missing_memory["wasm"]["metadata"]["cold"]["samples"][0]["linearMemoryHighWaterBytes"] =
        Value::Null;
    ensure!(
        validate_release_report(&missing_memory).is_err(),
        "npm release validator accepted missing memory evidence"
    );
    Ok(())
}

fn validate_release_metadata(path: &Utf8Path, report: &Value) -> anyhow::Result<()> {
    let target = report["target"]
        .as_str()
        .filter(|target| matches!(*target, "p2" | "p3"))
        .context("npm release report has no supported target")?;
    let os = report["environment"]["os"]
        .as_str()
        .context("npm release report has no OS")?;
    let arch = report["environment"]["arch"]
        .as_str()
        .context("npm release report has no architecture")?;
    let filename = path
        .file_name()
        .context("npm release report has no filename")?;
    ensure!(
        filename.contains("-release-")
            && filename.ends_with(&format!("-{target}-{os}-{arch}.json")),
        "{path} filename does not identify a release target and host"
    );
    let expected_lock_kind = if target == "p2" {
        "p2-shadow"
    } else {
        "workspace"
    };
    ensure!(
        report["environment"]["node"] == "22.14.0"
            && report["environment"]["npm"] == "10.9.2"
            && report["environment"]["dirty"] == false
            && report["environment"]["artifactCache"].is_null()
            && report["environment"]["wasmtimeCache"].is_null()
            && report["environment"]["preparedComponentCache"].is_null()
            && report["environment"]["unoptimized"].is_null()
            && report["environment"]["hostDependencyGraph"]["kind"] == expected_lock_kind
            && report["inputs"]["algorithm"] == INPUT_HASH_ALGORITHM
            && is_blake3_value(&report["environment"]["hostDependencyGraph"]["lockBlake3"])
            && is_blake3_value(&report["inputs"]["buildHash"])
            && is_blake3_value(&report["inputs"]["benchmarkHash"])
            && is_blake3_value(&report["component"]["blake3"])
            && is_blake3_value(&report["fixture"]["packageJsonBlake3"])
            && is_blake3_value(&report["fixture"]["packageLockBlake3"])
            && is_blake3_value(&report["fixture"]["npmTool"]["blake3"])
            && report["fixture"]["npmTool"]["algorithm"] == INPUT_HASH_ALGORITHM
            && report["fixture"]["npmTool"]["files"]
                .as_u64()
                .is_some_and(|value| value > 0)
            && report["fixture"]["npmTool"]["bytes"]
                .as_u64()
                .is_some_and(|value| value > 0)
            && report["component"]["bytes"]
                .as_u64()
                .is_some_and(|value| value > 0)
            && report["environment"]["commitHint"]
                .as_str()
                .is_some_and(|value| !value.is_empty())
            && report["environment"]["rustc"]
                .as_str()
                .is_some_and(|value| !value.is_empty())
            && report["environment"]["cargo"]
                .as_str()
                .is_some_and(|value| !value.is_empty()),
        "{path} has incomplete npm release provenance"
    );
    for (_, name) in PACKAGES {
        ensure!(
            is_blake3_value(&report["fixture"]["tarballs"][*name]["blake3"])
                && report["fixture"]["tarballs"][*name]["bytes"]
                    .as_u64()
                    .is_some_and(|value| value > 0),
            "{path} has incomplete tarball provenance for {name}"
        );
    }
    Ok(())
}

fn validate_release_currentness(
    report: &Value,
    current: &CurrentReleaseInputs,
) -> anyhow::Result<()> {
    ensure!(
        report["inputs"]["buildHash"] == current.hashes.build
            && report["inputs"]["benchmarkHash"] == current.hashes.benchmark
            && report["fixture"]["packageJsonBlake3"] == current.package_json
            && report["fixture"]["packageLockBlake3"] == current.package_lock,
        "npm release report does not match the current source inputs"
    );
    Ok(())
}

fn validate_release_currentness_regression_guards(
    report: &Value,
    current: &CurrentReleaseInputs,
) -> anyhow::Result<()> {
    let mut false_package = report.clone();
    false_package["fixture"]["packageJsonBlake3"] = json!("0".repeat(64));
    ensure!(
        validate_release_currentness(&false_package, current).is_err(),
        "npm currentness validator accepted an incorrect package.json digest"
    );
    let mut false_lock = report.clone();
    false_lock["fixture"]["packageLockBlake3"] = json!("0".repeat(64));
    ensure!(
        validate_release_currentness(&false_lock, current).is_err(),
        "npm currentness validator accepted an incorrect package-lock.json digest"
    );
    Ok(())
}

fn validate_release_pair(
    p2_filename: &str,
    p3_filename: &str,
    p2: &Value,
    p3: &Value,
) -> anyhow::Result<()> {
    for field in [
        "/schema",
        "/environment/commitHint",
        "/environment/node",
        "/environment/npm",
        "/environment/rustc",
        "/environment/cargo",
        "/environment/iterations",
        "/inputs/algorithm",
        "/inputs/buildHash",
        "/inputs/benchmarkHash",
        "/fixture",
    ] {
        ensure!(
            p2.pointer(field) == p3.pointer(field),
            "paired npm release reports {p2_filename} and {p3_filename} disagree at {field}"
        );
    }
    ensure!(
        p2["target"] == "p2"
            && p3["target"] == "p3"
            && p2["component"]["blake3"] != p3["component"]["blake3"],
        "paired npm release reports do not identify distinct P2/P3 components"
    );
    Ok(())
}

fn validate_checked_release_reports(directory: Utf8PathBuf) -> anyhow::Result<()> {
    validate_npm_composite_hash_contract()?;
    validate_npm_report_path_contract()?;
    let readme = fs::read_to_string(Utf8Path::new(SUITE_DIR).join("results/README.md"))?;
    let allow_untracked = std::env::var_os("NPM_METADATA_ALLOW_UNTRACKED_REPORTS").is_some();
    let mut requested = npm_reports_to_check()?;
    let current_inputs = if requested.is_empty() {
        None
    } else {
        Some(current_release_inputs()?)
    };
    let mut reports = BTreeMap::new();
    for entry in fs::read_dir(&directory)? {
        let path = Utf8PathBuf::from_path_buf(entry?.path())
            .map_err(|path| anyhow::anyhow!("non-UTF-8 report path: {}", path.display()))?;
        if path.extension() != Some("json") {
            continue;
        }
        let report: Value = serde_json::from_slice(&fs::read(&path)?)?;
        if report["schema"] != "npm-metadata-v2" {
            continue;
        }
        validate_release_metadata(&path, &report)?;
        validate_release_report(&report)?;
        validate_release_regression_guards(&report)?;
        let check_current = requested.remove(&path);
        if check_current {
            let current = current_inputs.as_ref().expect("current inputs exist");
            validate_release_currentness(&report, current)
                .with_context(|| format!("{path} does not match current npm release inputs"))?;
            validate_release_currentness_regression_guards(&report, current)?;
        }
        let filename = path
            .file_name()
            .context("report has no filename")?
            .to_string();
        ensure!(
            readme.contains(&filename) || (allow_untracked && check_current),
            "results/README.md does not reference {filename}"
        );
        reports.insert(filename, report);
    }
    ensure!(
        requested.is_empty(),
        "requested npm release reports were not found: {requested:?}"
    );
    let mut paired = 0;
    for (filename, p2) in reports
        .iter()
        .filter(|(filename, _)| filename.contains("-p2-"))
    {
        let p3_filename = filename.replacen("-p2-", "-p3-", 1);
        let p3 = reports
            .get(&p3_filename)
            .with_context(|| format!("missing P3 companion for {filename}"))?;
        validate_release_pair(filename, &p3_filename, p2, p3)?;
        let mut duplicate = p3.clone();
        duplicate["component"]["blake3"] = p2["component"]["blake3"].clone();
        ensure!(
            validate_release_pair(filename, &p3_filename, p2, &duplicate).is_err(),
            "npm pair validator accepted identical component digests"
        );
        paired += 2;
    }
    ensure!(
        paired == reports.len(),
        "every checked npm release report must belong to a P2/P3 pair"
    );
    Ok(())
}

fn npm_reports_to_check() -> anyhow::Result<BTreeSet<Utf8PathBuf>> {
    let results_directory = Utf8Path::new(SUITE_DIR).join("results");
    let source_root = npm_source_root()?;
    std::env::var("NPM_METADATA_REPORTS_TO_CHECK")
        .unwrap_or_default()
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| normalize_npm_report_path(line.trim(), &source_root, &results_directory))
        .collect()
}

fn normalize_npm_report_path(
    value: &str,
    source_root: &Utf8Path,
    results_directory: &Utf8Path,
) -> anyhow::Result<Utf8PathBuf> {
    let path = Utf8Path::new(value);
    let path = if path.is_absolute() {
        path.strip_prefix(source_root)
            .map_err(|_| anyhow::anyhow!("report path is outside {source_root}: {value}"))?
    } else {
        path
    };
    ensure!(
        path.parent() == Some(results_directory)
            && path.extension() == Some("json")
            && !path
                .components()
                .any(|component| component.as_str() == ".."),
        "report path is outside {results_directory}: {value}"
    );
    Ok(path.to_path_buf())
}

fn validate_npm_report_path_contract() -> anyhow::Result<()> {
    let root = camino_tempfile::Utf8TempDir::new()?;
    let results = Utf8Path::new(SUITE_DIR).join("results");
    let relative = results.join("report.json");
    ensure!(
        normalize_npm_report_path(relative.as_str(), root.path(), &results)? == relative,
        "relative npm report path was not preserved"
    );
    let absolute = root.path().join(&relative);
    ensure!(
        normalize_npm_report_path(absolute.as_str(), root.path(), &results)? == relative,
        "absolute npm report path was not normalized"
    );
    ensure!(
        normalize_npm_report_path("../report.json", root.path(), &results).is_err(),
        "escaping npm report path was accepted"
    );
    Ok(())
}

fn validate_npm_composite_hash_contract() -> anyhow::Result<()> {
    let root = camino_tempfile::Utf8TempDir::new()?;
    fs::create_dir(root.path().join("inputs"))?;
    fs::write(root.path().join("inputs/a.txt"), b"alpha")?;
    let mut files = BTreeSet::new();
    collect_npm_input_files(root.path(), Utf8Path::new("inputs"), &mut files)?;
    let original = npm_composite_hash(root.path(), "test", &files)?;
    ensure!(
        original == npm_composite_hash(root.path(), "test", &files)?,
        "npm composite hashes are not deterministic"
    );
    fs::write(root.path().join("inputs/a.txt"), b"changed")?;
    ensure!(
        original != npm_composite_hash(root.path(), "test", &files)?,
        "changed npm input did not change its composite hash"
    );
    Ok(())
}

fn is_blake3_value(value: &Value) -> bool {
    value.as_str().is_some_and(|value| {
        value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
    })
}

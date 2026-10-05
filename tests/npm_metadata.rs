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
const MEDIUM_PACKAGES: &[(&str, &str)] = &[
    ("ajv", "8.17.1"),
    ("chalk", "5.4.1"),
    ("date-fns", "4.1.0"),
    ("debug", "4.4.1"),
    ("dotenv", "16.4.7"),
    ("fast-deep-equal", "3.1.3"),
    ("fast-uri", "3.1.4"),
    ("json-schema-traverse", "1.0.0"),
    ("lodash", "4.17.21"),
    ("ms", "2.1.3"),
    ("require-from-string", "2.0.2"),
    ("rxjs", "7.8.2"),
    ("semver", "7.7.2"),
    ("tslib", "2.8.1"),
    ("uuid", "11.1.0"),
    ("zod", "3.25.76"),
];
const MEDIUM_DIRECT_DEPENDENCIES: &[&str] = &[
    "ajv", "chalk", "date-fns", "debug", "dotenv", "lodash", "ms", "rxjs", "semver", "uuid", "zod",
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
    validate_release_fixture_contract()?;
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
        let minimum_iterations = if std::env::var_os("NPM_METADATA_RELEASE_SMOKE").is_some() {
            1
        } else {
            5
        };
        ensure!(
            iterations >= minimum_iterations,
            "release baseline requires at least {minimum_iterations} iterations"
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
    package_files: BTreeMap<String, BTreeMap<String, u64>>,
}

#[derive(Clone, Debug)]
struct ReleasePackage {
    lock_path: String,
    name: String,
    version: String,
    resolved_path: String,
    integrity: String,
    dependencies: BTreeMap<String, String>,
    bins: BTreeMap<String, String>,
}

#[derive(Clone, Debug)]
struct ReleaseFixture {
    name: &'static str,
    directory: Utf8PathBuf,
    direct_dependencies: Vec<String>,
    dependency_edges: usize,
    packages: Vec<ReleasePackage>,
}

fn load_release_fixture(name: &'static str, directory: &str) -> anyhow::Result<ReleaseFixture> {
    let directory = Utf8PathBuf::from(directory);
    let package_json: Value = serde_json::from_slice(&fs::read(directory.join("package.json"))?)?;
    let lock: Value = serde_json::from_slice(&fs::read(directory.join("package-lock.json"))?)?;
    ensure!(
        package_json["name"] == lock["name"]
            && package_json["version"] == lock["version"]
            && package_json["private"] == true
            && lock["lockfileVersion"] == 3,
        "invalid {name} npm fixture identity"
    );
    let direct = package_json["dependencies"]
        .as_object()
        .with_context(|| format!("{name} fixture has no dependencies"))?;
    ensure!(
        lock["packages"][""]["dependencies"] == package_json["dependencies"],
        "{name} manifest and lockfile dependencies differ"
    );
    let mut direct_dependencies = direct.keys().cloned().collect::<Vec<_>>();
    direct_dependencies.sort();
    let lock_packages = lock["packages"]
        .as_object()
        .with_context(|| format!("{name} fixture lock has no packages"))?;
    let mut packages = Vec::new();
    for (lock_path, package) in lock_packages {
        if lock_path.is_empty() {
            continue;
        }
        let package_name = lock_path
            .strip_prefix("node_modules/")
            .filter(|package_name| !package_name.contains("/node_modules/"))
            .with_context(|| format!("{name} fixture is not a flat npm graph: {lock_path}"))?;
        let version = package["version"]
            .as_str()
            .with_context(|| format!("{name} package {package_name} has no version"))?;
        let resolved = package["resolved"]
            .as_str()
            .with_context(|| format!("{name} package {package_name} has no tarball"))?;
        let resolved_path = resolved
            .strip_prefix("https://registry.npmjs.org")
            .filter(|path| path.starts_with('/') && path.ends_with(".tgz"))
            .with_context(|| {
                format!("{name} package {package_name} has an unsupported tarball URL")
            })?;
        let integrity = package["integrity"]
            .as_str()
            .filter(|integrity| integrity.starts_with("sha512-"))
            .with_context(|| format!("{name} package {package_name} has no SHA-512 integrity"))?;
        ensure!(
            package["hasInstallScript"] != true
                && package["link"] != true
                && package["optional"] != true
                && package["dev"] != true,
            "{name} package {package_name} is not an ordinary pure-JavaScript dependency"
        );
        let dependencies = package["dependencies"]
            .as_object()
            .map(|dependencies| {
                dependencies
                    .iter()
                    .map(|(dependency, requirement)| {
                        Ok((
                            dependency.clone(),
                            requirement
                                .as_str()
                                .with_context(|| {
                                    format!(
                                        "{name} package {package_name} has a non-string dependency"
                                    )
                                })?
                                .to_string(),
                        ))
                    })
                    .collect::<anyhow::Result<BTreeMap<_, _>>>()
            })
            .transpose()?
            .unwrap_or_default();
        let bins = match &package["bin"] {
            Value::Null => BTreeMap::new(),
            Value::String(target) => {
                let bin_name = package_name.rsplit('/').next().unwrap_or(package_name);
                BTreeMap::from([(bin_name.to_string(), target.clone())])
            }
            Value::Object(bins) => bins
                .iter()
                .map(|(bin_name, target)| {
                    Ok((
                        bin_name.clone(),
                        target
                            .as_str()
                            .with_context(|| {
                                format!("{name} package {package_name} has a non-string bin")
                            })?
                            .to_string(),
                    ))
                })
                .collect::<anyhow::Result<BTreeMap<_, _>>>()?,
            _ => anyhow::bail!("{name} package {package_name} has an invalid bin"),
        };
        packages.push(ReleasePackage {
            lock_path: lock_path.clone(),
            name: package_name.to_string(),
            version: version.to_string(),
            resolved_path: resolved_path.to_string(),
            integrity: integrity.to_string(),
            dependencies,
            bins,
        });
    }
    packages.sort_by(|left, right| left.name.cmp(&right.name));
    let package_names = packages
        .iter()
        .map(|package| package.name.as_str())
        .collect::<BTreeSet<_>>();
    ensure!(
        package_names.len() == packages.len()
            && direct_dependencies
                .iter()
                .all(|dependency| package_names.contains(dependency.as_str())),
        "{name} fixture package identities do not reconcile"
    );
    for package in &packages {
        ensure!(
            package
                .dependencies
                .keys()
                .all(|dependency| package_names.contains(dependency.as_str())),
            "{name} fixture has an unresolved dependency from {}",
            package.name
        );
    }
    let dependency_edges = packages
        .iter()
        .map(|package| package.dependencies.len())
        .sum();
    Ok(ReleaseFixture {
        name,
        directory,
        direct_dependencies,
        dependency_edges,
        packages,
    })
}

struct PackedReleasePackage {
    body: Vec<u8>,
    evidence: Value,
    files: BTreeMap<String, u64>,
}

fn packed_file_manifest(
    package: &ReleasePackage,
    packed: &Value,
) -> anyhow::Result<BTreeMap<String, u64>> {
    let packed_files = packed["files"]
        .as_array()
        .context("npm pack file manifest")?;
    let archive_root = packed_files.iter().find_map(|file| {
        let path = file["path"].as_str()?;
        let root = path.strip_suffix('/')?;
        (!root.is_empty()
            && !root.contains('/')
            && packed_files.iter().all(|candidate| {
                candidate["path"]
                    .as_str()
                    .is_some_and(|candidate| candidate == path || candidate.starts_with(path))
            }))
        .then(|| path.to_string())
    });
    let mut files = BTreeMap::new();
    for file in packed_files {
        let archive_path = file["path"].as_str().context("npm pack file path")?;
        if archive_path.ends_with('/') {
            continue;
        }
        let path = archive_root
            .as_deref()
            .and_then(|root| archive_path.strip_prefix(root))
            .unwrap_or(archive_path);
        let relative = Utf8Path::new(path);
        ensure!(
            !path.is_empty()
                && !relative.is_absolute()
                && !relative
                    .components()
                    .any(|component| component.as_str() == "..")
                && !path.ends_with(".node")
                && path != "binding.gyp"
                && !path.ends_with("/binding.gyp"),
            "{}@{} contains an unsupported archive entry: {archive_path}",
            package.name,
            package.version
        );
        let size = file["size"].as_u64().context("npm pack file size")?;
        ensure!(
            files.insert(path.to_string(), size).is_none(),
            "{}@{} has duplicate archive path {path}",
            package.name,
            package.version
        );
    }
    ensure!(
        !files.is_empty(),
        "{}@{} has no regular archive files",
        package.name,
        package.version
    );
    for target in package.bins.values() {
        ensure!(
            files.contains_key(target),
            "{}@{} bin target is absent from the archive: {target}",
            package.name,
            package.version
        );
    }
    Ok(files)
}

fn fixture_variant_is_rejected(package_json: &Value, lock: &Value) -> anyhow::Result<bool> {
    let root = camino_tempfile::Utf8TempDir::new()?;
    fs::write(
        root.path().join("package.json"),
        serde_json::to_vec_pretty(package_json)?,
    )?;
    fs::write(
        root.path().join("package-lock.json"),
        serde_json::to_vec_pretty(lock)?,
    )?;
    Ok(load_release_fixture("invalid", root.path().as_str()).is_err())
}

fn validate_release_fixture_contract() -> anyhow::Result<()> {
    let small = load_release_fixture("small-local-registry", "tests/npm_metadata/real")?;
    let medium = load_release_fixture("medium-local-registry", "tests/npm_metadata/medium")?;
    ensure!(
        small.direct_dependencies.len() == 2
            && small.packages.len() == 2
            && small.dependency_edges == 1
            && small.packages.iter().all(|package| package.bins.is_empty())
            && medium.direct_dependencies.len() == 11
            && medium.packages.len() == 16
            && medium.dependency_edges == 6
            && medium
                .packages
                .iter()
                .map(|package| package.bins.len())
                .sum::<usize>()
                == 2,
        "npm release fixture counts changed"
    );
    let medium_versions = medium
        .packages
        .iter()
        .map(|package| (package.name.as_str(), package.version.as_str()))
        .collect::<BTreeMap<_, _>>();
    ensure!(
        medium_versions == MEDIUM_PACKAGES.iter().copied().collect(),
        "medium npm fixture identities changed"
    );

    let package_path = Utf8Path::new("tests/npm_metadata/medium/package.json");
    let lock_path = Utf8Path::new("tests/npm_metadata/medium/package-lock.json");
    let package_json: Value = serde_json::from_slice(&fs::read(package_path)?)?;
    let lock: Value = serde_json::from_slice(&fs::read(lock_path)?)?;

    let mut missing_package = lock.clone();
    missing_package["packages"]
        .as_object_mut()
        .expect("validated fixture packages")
        .remove("node_modules/ajv");
    ensure!(
        fixture_variant_is_rejected(&package_json, &missing_package)?,
        "fixture parser accepted a missing locked package"
    );
    let mut bad_integrity = lock.clone();
    bad_integrity["packages"]["node_modules/ajv"]["integrity"] = json!("sha1-wrong");
    ensure!(
        fixture_variant_is_rejected(&package_json, &bad_integrity)?,
        "fixture parser accepted non-SHA-512 integrity"
    );
    let mut install_script = lock.clone();
    install_script["packages"]["node_modules/ajv"]["hasInstallScript"] = json!(true);
    ensure!(
        fixture_variant_is_rejected(&package_json, &install_script)?,
        "fixture parser accepted an install script"
    );
    let mut mismatched_manifest = package_json.clone();
    mismatched_manifest["dependencies"]["ajv"] = json!("8.17.0");
    ensure!(
        fixture_variant_is_rejected(&mismatched_manifest, &lock)?,
        "fixture parser accepted a manifest/lock mismatch"
    );

    let archive_package = medium
        .packages
        .iter()
        .find(|package| package.bins.is_empty())
        .context("medium fixture has no package for archive guards")?;
    let valid_archive = json!({"files": [{"path": "index.js", "size": 1}]});
    ensure!(
        packed_file_manifest(archive_package, &valid_archive).is_ok(),
        "archive validator rejected an ordinary JavaScript file"
    );
    for path in ["build/addon.node", "binding.gyp", "native/binding.gyp"] {
        let native_archive = json!({"files": [{"path": path, "size": 1}]});
        ensure!(
            packed_file_manifest(archive_package, &native_archive).is_err(),
            "archive validator accepted native entry {path}"
        );
    }
    Ok(())
}

fn pack_release_package(
    package: &ReleasePackage,
    destination: &Utf8Path,
) -> anyhow::Result<PackedReleasePackage> {
    let resolved = format!("https://registry.npmjs.org{}", package.resolved_path);
    let output = command(Command::new("npm").args([
        "pack",
        &resolved,
        "--json",
        "--ignore-scripts",
        "--registry=https://registry.npmjs.org/",
        "--pack-destination",
        destination.as_str(),
    ]))?;
    let value: Value = serde_json::from_str(&output)?;
    let packed = &value[0];
    ensure!(
        packed["name"] == package.name
            && packed["version"] == package.version
            && packed["integrity"] == package.integrity,
        "npm pack did not reproduce {}@{} with its locked integrity",
        package.name,
        package.version
    );
    let filename = packed["filename"].as_str().context("npm pack filename")?;
    let body = fs::read(destination.join(filename))?;
    let files = packed_file_manifest(package, packed)?;
    ensure!(
        packed["size"].as_u64() == Some(body.len() as u64)
            && packed["entryCount"]
                .as_u64()
                .is_some_and(|entries| entries >= files.len() as u64)
            && packed["unpackedSize"].as_u64() == Some(files.values().sum()),
        "npm pack returned incomplete evidence for {}@{}",
        package.name,
        package.version
    );
    let evidence = json!({
        "bytes": body.len(),
        "blake3": blake3::hash(&body).to_hex().to_string(),
        "integrity": package.integrity,
        "fileCount": files.len(),
        "unpackedBytes": packed["unpackedSize"],
    });
    Ok(PackedReleasePackage {
        body,
        evidence,
        files,
    })
}

async fn release_registry(
    root: &Utf8Path,
    fixtures: &[&ReleaseFixture],
) -> anyhow::Result<ReleaseRegistry> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let base = format!("http://127.0.0.1:{}", listener.local_addr()?.port());
    let counters = Arc::new(RegistryCounters::default());
    let mut tarballs = BTreeMap::new();
    let mut package_files = BTreeMap::new();
    let mut router = Router::new();
    let mut package_names = BTreeSet::new();
    for package in fixtures.iter().flat_map(|fixture| &fixture.packages) {
        ensure!(
            package_names.insert(package.name.clone()),
            "release fixtures contain duplicate package {}",
            package.name
        );
        let packed = pack_release_package(package, root)?;
        tarballs.insert(package.name.clone(), packed.evidence);
        package_files.insert(package.name.clone(), packed.files);
        let path = package.resolved_path.clone();
        let metadata_path = format!("/{}", package.name.replace('/', "%2f"));
        let mut metadata = json!({
            "name": package.name,
            "dist-tags": {"latest": package.version},
            "versions": {},
        });
        metadata["versions"][&package.version] = json!({
            "name": package.name,
            "version": package.version,
            "dependencies": package.dependencies,
            "dist": {
                "tarball": format!("{base}{path}"),
                "integrity": package.integrity,
            },
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
                let body = packed.body.clone();
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
        package_files,
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

fn prepare_release_root(
    root: &Utf8Path,
    fixture: Option<&ReleaseFixture>,
    registry: &str,
) -> anyhow::Result<()> {
    for directory in [
        "workspace",
        "home/npm",
        "cache/npm",
        "prefix/lib/node_modules",
        "prefix/bin",
    ] {
        fs::create_dir_all(root.join(directory))?;
    }
    if let Some(fixture) = fixture {
        for file in ["package.json", "package-lock.json"] {
            fs::copy(
                fixture.directory.join(file),
                root.join("workspace").join(file),
            )?;
        }
        let lock_path = root.join("workspace/package-lock.json");
        let mut lock: Value = serde_json::from_slice(&fs::read(&lock_path)?)?;
        for package in &fixture.packages {
            lock["packages"][&package.lock_path]["resolved"] = json!(format!(
                "{}{}",
                registry.trim_end_matches('/'),
                package.resolved_path
            ));
        }
        fs::write(lock_path, serde_json::to_vec_pretty(&lock)?)?;
    }
    Ok(())
}

async fn release_instance(
    prepared: &PreparedComponent,
    npm_dir: &Utf8Path,
    fixture: Option<&ReleaseFixture>,
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

fn release_timing_boundary() -> Value {
    json!({
        "host": HOST_TIMING_BOUNDARY,
        "wasm": WASM_TIMING_BOUNDARY,
    })
}

#[derive(Default)]
struct InstalledTreeEvidence {
    directories: u64,
    files: u64,
    symlinks: u64,
    bytes: u64,
    hasher: blake3::Hasher,
}

fn collect_installed_tree(
    root: &Utf8Path,
    directory: &Utf8Path,
    registry: &str,
    evidence: &mut InstalledTreeEvidence,
) -> anyhow::Result<()> {
    let mut entries = fs::read_dir(directory)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let path = Utf8PathBuf::from_path_buf(entry.path())
            .map_err(|path| anyhow::anyhow!("non-UTF-8 installed path: {}", path.display()))?;
        let relative = path.strip_prefix(root)?;
        let metadata = fs::symlink_metadata(&path)?;
        if metadata.is_dir() {
            evidence.directories += 1;
            hash_part(&mut evidence.hasher, b"directory");
            hash_part(&mut evidence.hasher, relative.as_str().as_bytes());
            collect_installed_tree(root, &path, registry, evidence)?;
        } else if metadata.is_file() {
            evidence.files += 1;
            evidence.bytes += metadata.len();
            let bytes = fs::read(&path)?;
            let normalized = if relative == Utf8Path::new(".package-lock.json") {
                String::from_utf8(bytes)?
                    .replace(registry, "<local>")
                    .into_bytes()
            } else {
                bytes
            };
            hash_part(&mut evidence.hasher, b"file");
            hash_part(&mut evidence.hasher, relative.as_str().as_bytes());
            hash_part(&mut evidence.hasher, &normalized);
        } else if metadata.file_type().is_symlink() {
            evidence.symlinks += 1;
            let target = fs::read_link(&path);
            let target = target
                .as_ref()
                .ok()
                .and_then(|target| target.to_str())
                .context("installed symlink has no UTF-8 target")?;
            hash_part(&mut evidence.hasher, b"symlink");
            hash_part(&mut evidence.hasher, relative.as_str().as_bytes());
            hash_part(&mut evidence.hasher, target.as_bytes());
        } else {
            anyhow::bail!("unsupported installed entry type: {path}");
        }
    }
    Ok(())
}

fn package_file_sizes(root: &Utf8Path) -> anyhow::Result<BTreeMap<String, u64>> {
    let mut files = BTreeMap::new();
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        let mut entries = fs::read_dir(&directory)?.collect::<Result<Vec<_>, _>>()?;
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            let path = Utf8PathBuf::from_path_buf(entry.path())
                .map_err(|path| anyhow::anyhow!("non-UTF-8 package path: {}", path.display()))?;
            let metadata = fs::symlink_metadata(&path)?;
            if metadata.is_dir() {
                pending.push(path);
            } else if metadata.is_file() {
                files.insert(
                    path.strip_prefix(root)?.as_str().to_string(),
                    metadata.len(),
                );
            } else {
                anyhow::bail!("package contains an unsupported installed entry: {path}");
            }
        }
    }
    Ok(files)
}

fn installed_package_names(node_modules: &Utf8Path) -> anyhow::Result<Vec<String>> {
    let mut names = Vec::new();
    for entry in fs::read_dir(node_modules)? {
        let entry = entry?;
        let name = entry.file_name().into_string().map_err(|name| {
            anyhow::anyhow!("non-UTF-8 package name: {}", name.to_string_lossy())
        })?;
        if name == ".bin" || name == ".package-lock.json" {
            continue;
        }
        if name.starts_with('@') {
            let scope = Utf8PathBuf::from_path_buf(entry.path())
                .map_err(|path| anyhow::anyhow!("non-UTF-8 package scope: {}", path.display()))?;
            for package in fs::read_dir(scope)? {
                let package = package?;
                let package_name = package.file_name().into_string().map_err(|name| {
                    anyhow::anyhow!("non-UTF-8 package name: {}", name.to_string_lossy())
                })?;
                names.push(format!("{name}/{package_name}"));
            }
        } else {
            names.push(name);
        }
    }
    names.sort();
    Ok(names)
}

fn installed_state(
    root: &Utf8Path,
    fixture: &ReleaseFixture,
    registry: &ReleaseRegistry,
) -> anyhow::Result<Value> {
    let node_modules = root.join("workspace/node_modules");
    let mut complete = true;
    let mut package_files = 0_u64;
    let mut package_bytes = 0_u64;
    let mut identity_mismatches = Vec::new();
    let mut file_mismatches = Vec::new();
    for package in &fixture.packages {
        let package_root = node_modules.join(&package.name);
        let identity = fs::read(package_root.join("package.json"))
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok());
        let identity_matches = identity.as_ref().is_some_and(|identity| {
            identity["name"] == package.name && identity["version"] == package.version
        });
        complete &= identity_matches;
        if !identity_matches {
            identity_mismatches.push(package.name.clone());
        }
        let actual_files = package_file_sizes(&package_root).unwrap_or_default();
        let expected_files = registry.package_files.get(&package.name);
        let files_match = expected_files == Some(&actual_files);
        complete &= files_match;
        if !files_match {
            let empty = BTreeMap::new();
            let expected_files = expected_files.unwrap_or(&empty);
            let missing = expected_files
                .keys()
                .filter(|path| !actual_files.contains_key(*path))
                .cloned()
                .collect::<Vec<_>>();
            let extra = actual_files
                .keys()
                .filter(|path| !expected_files.contains_key(*path))
                .cloned()
                .collect::<Vec<_>>();
            let size = expected_files
                .iter()
                .filter_map(|(path, expected)| {
                    actual_files
                        .get(path)
                        .filter(|actual| *actual != expected)
                        .map(|actual| {
                            json!({
                                "path": path,
                                "expected": expected,
                                "actual": actual,
                            })
                        })
                })
                .collect::<Vec<_>>();
            file_mismatches.push(json!({
                "package": package.name,
                "missing": missing,
                "extra": extra,
                "size": size,
            }));
        }
        package_files += actual_files.len() as u64;
        package_bytes += actual_files.values().sum::<u64>();
    }
    let expected_names = fixture
        .packages
        .iter()
        .map(|package| package.name.clone())
        .collect::<Vec<_>>();
    let actual_names = installed_package_names(&node_modules).unwrap_or_default();
    let package_names_match = actual_names == expected_names;
    complete &= package_names_match;

    let expected_bins = fixture
        .packages
        .iter()
        .flat_map(|package| {
            package
                .bins
                .iter()
                .map(|(name, target)| (name.clone(), format!("../{}/{}", package.name, target)))
        })
        .collect::<BTreeMap<_, _>>();
    let bin_directory = node_modules.join(".bin");
    let mut actual_bins = BTreeMap::new();
    if bin_directory.exists() {
        for entry in fs::read_dir(&bin_directory)? {
            let entry = entry?;
            let name = entry.file_name().into_string().map_err(|name| {
                anyhow::anyhow!("non-UTF-8 npm bin name: {}", name.to_string_lossy())
            })?;
            let target = fs::read_link(entry.path())?;
            actual_bins.insert(name, target.to_string_lossy().into_owned());
        }
    }
    let bins_match = actual_bins == expected_bins;
    complete &= bins_match;

    let mut tree = InstalledTreeEvidence::default();
    collect_installed_tree(&node_modules, &node_modules, &registry.base, &mut tree)?;
    Ok(json!({
        "complete": complete,
        "identityMismatches": identity_mismatches,
        "fileMismatches": file_mismatches,
        "packageNamesMatch": package_names_match,
        "binsMatch": bins_match,
        "packages": actual_names.len(),
        "packageFiles": package_files,
        "packageBytes": package_bytes,
        "bins": actual_bins.len(),
        "tree": {
            "directories": tree.directories,
            "files": tree.files,
            "symlinks": tree.symlinks,
            "bytes": tree.bytes,
            "blake3": tree.hasher.finalize().to_hex().to_string(),
        },
    }))
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
    fixture: Option<(&'a ReleaseFixture, &'a ReleaseRegistry)>,
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
        fixture,
    } = context;
    let installed = if operation == "ci" {
        let (fixture, registry) = fixture.context("npm ci sample has no fixture")?;
        Some(
            installed_state(root, fixture, registry).unwrap_or_else(|error| {
                json!({
                    "complete": false,
                    "error": format!("{error:#}"),
                })
            }),
        )
    } else {
        None
    };
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
    let stdout = result["stdout"].as_str().unwrap_or_default();
    let compact_result = json!({
        "exitCode": result["value"]["exitCode"],
        "overflowed": result["overflowed"],
        "runnerError": result.get("runnerError"),
        "stdout": stdout,
        "stdoutBytes": stdout.len(),
        "stdoutBlake3": blake3::hash(stdout.as_bytes()).to_hex().to_string(),
        "stderrBytes": stderr.len(),
        "stderrBlake3": blake3::hash(stderr.as_bytes()).to_hex().to_string(),
    });
    let sample = json!({
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
        "result": compact_result,
    });
    eprintln!(
        "npm release {side} {} {operation}/{cache}: success={} wall={}ms",
        fixture
            .map(|(fixture, _)| fixture.name)
            .unwrap_or("metadata"),
        sample["success"],
        sample["wallMs"],
    );
    Ok(sample)
}

fn host_npm_sample(
    host: &HostNpm,
    root: &Utf8Path,
    args: &[String],
    series: (&str, &str),
    sequence: usize,
    fixture: Option<&ReleaseFixture>,
    registry: &ReleaseRegistry,
) -> anyhow::Result<Value> {
    let (operation, cache) = series;
    let lockfile_before = (operation == "ci")
        .then(|| hash_file(root.join("workspace/package-lock.json")))
        .transpose()?;
    let before = registry.counters.snapshot();
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
            requests: registry.counters.snapshot().difference(before),
            linear_memory_high_water_bytes: None,
            lockfile_before,
            fixture: fixture.map(|fixture| (fixture, registry)),
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
    fixture: Option<&ReleaseFixture>,
    registry: &ReleaseRegistry,
) -> anyhow::Result<Value> {
    let lockfile_before = (operation == "ci")
        .then(|| hash_file(instance.temp_dir_path().join("workspace/package-lock.json")))
        .transpose()?;
    let before = registry.counters.snapshot();
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
            requests: registry.counters.snapshot().difference(before),
            linear_memory_high_water_bytes: Some(instance.linear_memory_high_water_bytes()),
            lockfile_before,
            fixture: fixture.map(|fixture| (fixture, registry)),
        },
        wall_ms,
        result,
    )
}

struct ReleaseIteration {
    small_metadata_cold: Value,
    small_ci_seed: Value,
    small_ci_warm: Value,
    medium_ci_seed: Value,
    medium_ci_warm: Value,
}

fn host_release_iteration(
    host: &HostNpm,
    registry: &ReleaseRegistry,
    small: &ReleaseFixture,
    medium: &ReleaseFixture,
    sequence: usize,
) -> anyhow::Result<ReleaseIteration> {
    let metadata_root = camino_tempfile::Utf8TempDir::new()?;
    prepare_release_root(metadata_root.path(), None, &registry.base)?;
    let metadata_args = metadata_args(&registry.base);
    let small_metadata_cold = host_npm_sample(
        host,
        metadata_root.path(),
        &metadata_args,
        ("view", "cold"),
        sequence,
        None,
        registry,
    )?;
    let small_root = camino_tempfile::Utf8TempDir::new()?;
    prepare_release_root(small_root.path(), Some(small), &registry.base)?;
    let small_ci_seed = host_npm_sample(
        host,
        small_root.path(),
        &seed_ci_args(&registry.base),
        ("ci", "seed"),
        sequence,
        Some(small),
        registry,
    )?;
    ensure!(
        small_ci_seed["success"] == true,
        "host small npm ci cache seed failed: {small_ci_seed}"
    );
    fs::remove_dir_all(small_root.path().join("workspace/node_modules"))?;
    let small_ci_warm = host_npm_sample(
        host,
        small_root.path(),
        &warm_ci_args(&registry.base),
        ("ci", "warm-tarball"),
        sequence,
        Some(small),
        registry,
    )?;
    let medium_root = camino_tempfile::Utf8TempDir::new()?;
    prepare_release_root(medium_root.path(), Some(medium), &registry.base)?;
    let medium_ci_seed = host_npm_sample(
        host,
        medium_root.path(),
        &seed_ci_args(&registry.base),
        ("ci", "seed"),
        sequence,
        Some(medium),
        registry,
    )?;
    ensure!(
        medium_ci_seed["success"] == true,
        "host medium npm ci cache seed failed: {medium_ci_seed}"
    );
    fs::remove_dir_all(medium_root.path().join("workspace/node_modules"))?;
    let medium_ci_warm = host_npm_sample(
        host,
        medium_root.path(),
        &warm_ci_args(&registry.base),
        ("ci", "warm-tarball"),
        sequence,
        Some(medium),
        registry,
    )?;
    Ok(ReleaseIteration {
        small_metadata_cold,
        small_ci_seed,
        small_ci_warm,
        medium_ci_seed,
        medium_ci_warm,
    })
}

async fn wasm_release_iteration(
    prepared: &PreparedComponent,
    npm_dir: &Utf8Path,
    registry: &ReleaseRegistry,
    small: &ReleaseFixture,
    medium: &ReleaseFixture,
    sequence: usize,
) -> anyhow::Result<ReleaseIteration> {
    let mut metadata_instance = release_instance(prepared, npm_dir, None, &registry.base).await?;
    let metadata_args = metadata_args(&registry.base);
    let small_metadata_cold = wasm_npm_sample(
        &mut metadata_instance,
        &metadata_args,
        "view",
        "cold",
        sequence,
        None,
        registry,
    )
    .await?;
    let mut small_instance =
        release_instance(prepared, npm_dir, Some(small), &registry.base).await?;
    let small_ci_seed = wasm_npm_sample(
        &mut small_instance,
        &seed_ci_args(&registry.base),
        "ci",
        "seed",
        sequence,
        Some(small),
        registry,
    )
    .await?;
    ensure!(
        small_ci_seed["success"] == true,
        "Wasm small npm ci cache seed failed: {small_ci_seed}"
    );
    fs::remove_dir_all(
        small_instance
            .temp_dir_path()
            .join("workspace/node_modules"),
    )?;
    let small_ci_warm = wasm_npm_sample(
        &mut small_instance,
        &warm_ci_args(&registry.base),
        "ci",
        "warm-tarball",
        sequence,
        Some(small),
        registry,
    )
    .await?;
    let mut medium_instance =
        release_instance(prepared, npm_dir, Some(medium), &registry.base).await?;
    let medium_ci_seed = wasm_npm_sample(
        &mut medium_instance,
        &seed_ci_args(&registry.base),
        "ci",
        "seed",
        sequence,
        Some(medium),
        registry,
    )
    .await?;
    ensure!(
        medium_ci_seed["success"] == true,
        "Wasm medium npm ci cache seed failed: {medium_ci_seed}"
    );
    fs::remove_dir_all(
        medium_instance
            .temp_dir_path()
            .join("workspace/node_modules"),
    )?;
    let medium_ci_warm = wasm_npm_sample(
        &mut medium_instance,
        &warm_ci_args(&registry.base),
        "ci",
        "warm-tarball",
        sequence,
        Some(medium),
        registry,
    )
    .await?;
    Ok(ReleaseIteration {
        small_metadata_cold,
        small_ci_seed,
        small_ci_warm,
        medium_ci_seed,
        medium_ci_warm,
    })
}

#[derive(Default)]
struct ReleaseSeries {
    small_metadata_cold: Vec<Value>,
    small_ci_seeds: Vec<Value>,
    small_ci_warm: Vec<Value>,
    medium_ci_seeds: Vec<Value>,
    medium_ci_warm: Vec<Value>,
}

impl ReleaseSeries {
    fn push(&mut self, iteration: ReleaseIteration) {
        self.small_metadata_cold.push(iteration.small_metadata_cold);
        self.small_ci_seeds.push(iteration.small_ci_seed);
        self.small_ci_warm.push(iteration.small_ci_warm);
        self.medium_ci_seeds.push(iteration.medium_ci_seed);
        self.medium_ci_warm.push(iteration.medium_ci_warm);
    }

    fn value(&self) -> Value {
        json!({
            "small": {
                "metadata": {
                    "cold": summarize_release(&self.small_metadata_cold),
                },
                "warmTarballCi": {
                    "seeds": summarize_release(&self.small_ci_seeds),
                    "timed": summarize_release(&self.small_ci_warm),
                },
            },
            "medium": {
                "warmTarballCi": {
                    "seeds": summarize_release(&self.medium_ci_seeds),
                    "timed": summarize_release(&self.medium_ci_warm),
                },
            },
        })
    }

    fn samples(&self) -> impl Iterator<Item = &Value> {
        self.small_metadata_cold
            .iter()
            .chain(&self.small_ci_seeds)
            .chain(&self.small_ci_warm)
            .chain(&self.medium_ci_seeds)
            .chain(&self.medium_ci_warm)
    }
}

fn release_fixture_value(
    fixture: &ReleaseFixture,
    registry: &ReleaseRegistry,
    include_metadata: bool,
) -> anyhow::Result<Value> {
    let mut packages = BTreeMap::new();
    let mut tarballs = BTreeMap::new();
    let mut bins = BTreeMap::new();
    let mut tarball_bytes = 0_u64;
    let mut archive_files = 0_u64;
    let mut unpacked_bytes = 0_u64;
    for package in &fixture.packages {
        packages.insert(
            package.name.clone(),
            json!({
                "version": package.version,
                "resolvedPath": package.resolved_path,
                "integrity": package.integrity,
                "dependencies": package.dependencies,
                "bins": package.bins,
            }),
        );
        for (name, target) in &package.bins {
            ensure!(
                bins.insert(
                    name.clone(),
                    json!({"package": package.name, "target": target}),
                )
                .is_none(),
                "{} fixture has duplicate bin {name}",
                fixture.name
            );
        }
        let tarball = registry
            .tarballs
            .get(&package.name)
            .with_context(|| format!("missing packed tarball for {}", package.name))?;
        tarball_bytes += tarball["bytes"].as_u64().context("tarball bytes")?;
        archive_files += tarball["fileCount"].as_u64().context("tarball files")?;
        unpacked_bytes += tarball["unpackedBytes"]
            .as_u64()
            .context("tarball unpacked bytes")?;
        tarballs.insert(package.name.clone(), tarball.clone());
    }
    let series_arguments = if include_metadata {
        json!({
            "metadata": metadata_args("<local>"),
            "ciSeed": seed_ci_args("<local>"),
            "ciTimed": warm_ci_args("<local>"),
        })
    } else {
        json!({
            "ciSeed": seed_ci_args("<local>"),
            "ciTimed": warm_ci_args("<local>"),
        })
    };
    Ok(json!({
        "name": fixture.name,
        "packageJsonBlake3": hash_file(fixture.directory.join("package.json"))?,
        "packageLockBlake3": hash_file(fixture.directory.join("package-lock.json"))?,
        "directDependencies": fixture.direct_dependencies,
        "directDependencyCount": fixture.direct_dependencies.len(),
        "packageCount": fixture.packages.len(),
        "dependencyEdgeCount": fixture.dependency_edges,
        "binCount": bins.len(),
        "bins": bins,
        "packages": packages,
        "tarballs": tarballs,
        "tarballBytes": tarball_bytes,
        "archiveFiles": archive_files,
        "unpackedBytes": unpacked_bytes,
        "seriesArguments": series_arguments,
    }))
}

async fn run_release_baseline(iterations: usize) -> anyhow::Result<()> {
    let small = load_release_fixture("small-local-registry", "tests/npm_metadata/real")?;
    let medium = load_release_fixture("medium-local-registry", "tests/npm_metadata/medium")?;
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
    let registry = release_registry(pack_dir.path(), &[&small, &medium]).await?;

    let mut host_series = ReleaseSeries::default();
    let mut wasm_series = ReleaseSeries::default();
    for iteration in 0..iterations {
        if iteration % 2 == 0 {
            host_series.push(host_release_iteration(
                &host, &registry, &small, &medium, iteration,
            )?);
            wasm_series.push(
                wasm_release_iteration(
                    &prepared,
                    &host.npm_dir,
                    &registry,
                    &small,
                    &medium,
                    iteration,
                )
                .await?,
            );
        } else {
            wasm_series.push(
                wasm_release_iteration(
                    &prepared,
                    &host.npm_dir,
                    &registry,
                    &small,
                    &medium,
                    iteration,
                )
                .await?,
            );
            host_series.push(host_release_iteration(
                &host, &registry, &small, &medium, iteration,
            )?);
        }
    }
    registry.server.abort();

    let environment = release_environment(iterations, feature_combination.label())
        .context("capture npm release environment")?;
    let input_hashes = npm_input_hashes().context("hash npm release inputs")?;
    let npm_tool =
        directory_hash_evidence(&host.npm_dir).context("hash the pinned npm tool tree")?;
    let max_linear_memory = wasm_series
        .samples()
        .filter_map(|sample| sample["linearMemoryHighWaterBytes"].as_u64())
        .max()
        .unwrap_or(0);
    let report = json!({
        "schema": "npm-metadata-v3",
        "environment": environment,
        "inputs": {
            "algorithm": INPUT_HASH_ALGORITHM,
            "buildHash": input_hashes.build,
            "benchmarkHash": input_hashes.benchmark,
        },
        "target": target_name(),
        "npmTool": npm_tool,
        "fixtures": {
            "small": release_fixture_value(&small, &registry, true)
                .context("build small npm fixture evidence")?,
            "medium": release_fixture_value(&medium, &registry, false)
                .context("build medium npm fixture evidence")?,
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
                "smallMetadataCold": release_memory_series(&wasm_series.small_metadata_cold)?,
                "smallCiSeeds": release_memory_series(&wasm_series.small_ci_seeds)?,
                "smallCiWarmTarball": release_memory_series(&wasm_series.small_ci_warm)?,
                "mediumCiSeeds": release_memory_series(&wasm_series.medium_ci_seeds)?,
                "mediumCiWarmTarball": release_memory_series(&wasm_series.medium_ci_warm)?,
            },
            "interpretation": MEMORY_INTERPRETATION,
        },
        "notes": [
            "manual local release measurement; no CI timing threshold",
            "production normal feature; profiling-only instrumentation disabled",
            "host and Wasm use the same loopback registry and pinned tarball bytes",
            "each iteration has independent host and Wasm workspaces and caches",
            "timed npm ci runs offline after an untimed local-registry seed and external node_modules removal",
            "the medium fixture measures installation only and never executes package bins",
        ],
    });
    validate_release_report(&report).context("validate generated npm release report")?;
    validate_release_regression_guards(&report)
        .context("validate npm release report corruption guards")?;
    let formatted = serde_json::to_string_pretty(&report)?;
    if let Ok(path) = std::env::var("NPM_METADATA_REPORT") {
        fs::write(path, format!("{formatted}\n")).context("write npm release report")?;
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
    small_package_json: String,
    small_package_lock: String,
    medium_package_json: String,
    medium_package_lock: String,
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
        "tests/npm_metadata/medium/package.json",
        "tests/npm_metadata/medium/package-lock.json",
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
        small_package_json: hash_file(source_root.join(SUITE_DIR).join("real/package.json"))?,
        small_package_lock: hash_file(source_root.join(SUITE_DIR).join("real/package-lock.json"))?,
        medium_package_json: hash_file(source_root.join(SUITE_DIR).join("medium/package.json"))?,
        medium_package_lock: hash_file(
            source_root.join(SUITE_DIR).join("medium/package-lock.json"),
        )?,
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
        let input_path = source_root.join(path);
        let metadata = fs::symlink_metadata(&input_path)
            .with_context(|| format!("inspect npm input {input_path}"))?;
        ensure!(
            metadata.is_file() && !metadata.file_type().is_symlink(),
            "input is not a regular file: {path}"
        );
        let components = path.components().collect::<Vec<_>>();
        hasher.update(&(components.len() as u64).to_le_bytes());
        for component in components {
            hash_part(&mut hasher, component.as_str().as_bytes());
        }
        hash_part(
            &mut hasher,
            &fs::read(&input_path).with_context(|| format!("read npm input {input_path}"))?,
        );
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

fn expected_release_packages(key: &str) -> BTreeMap<&'static str, &'static str> {
    match key {
        "small" => PACKAGES.iter().map(|(_, name)| (*name, VERSION)).collect(),
        "medium" => MEDIUM_PACKAGES.iter().copied().collect(),
        _ => unreachable!("validated fixture key"),
    }
}

fn validate_release_fixture(fixture: &Value, key: &str) -> anyhow::Result<()> {
    let expected_packages = expected_release_packages(key);
    let expected_direct = match key {
        "small" => PACKAGES.iter().map(|(_, name)| *name).collect::<Vec<_>>(),
        "medium" => MEDIUM_DIRECT_DEPENDENCIES.to_vec(),
        _ => anyhow::bail!("unsupported npm release fixture: {key}"),
    };
    let expected_name = format!("{key}-local-registry");
    let include_metadata = key == "small";
    let expected_arguments = if include_metadata {
        json!({
            "metadata": metadata_args("<local>"),
            "ciSeed": seed_ci_args("<local>"),
            "ciTimed": warm_ci_args("<local>"),
        })
    } else {
        json!({
            "ciSeed": seed_ci_args("<local>"),
            "ciTimed": warm_ci_args("<local>"),
        })
    };
    let packages = fixture["packages"]
        .as_object()
        .with_context(|| format!("{key} fixture has no package identities"))?;
    let tarballs = fixture["tarballs"]
        .as_object()
        .with_context(|| format!("{key} fixture has no tarball evidence"))?;
    ensure!(
        fixture["name"] == expected_name
            && fixture["directDependencies"] == json!(expected_direct)
            && fixture["directDependencyCount"] == expected_direct.len()
            && fixture["packageCount"] == expected_packages.len()
            && fixture["seriesArguments"] == expected_arguments
            && packages.len() == expected_packages.len()
            && tarballs.len() == expected_packages.len()
            && is_blake3_value(&fixture["packageJsonBlake3"])
            && is_blake3_value(&fixture["packageLockBlake3"]),
        "invalid {key} npm release fixture identity"
    );

    let mut dependency_edges = 0_usize;
    let mut expected_bins = BTreeMap::new();
    let mut tarball_bytes = 0_u64;
    let mut archive_files = 0_u64;
    let mut unpacked_bytes = 0_u64;
    for (name, version) in expected_packages {
        let package = &fixture["packages"][name];
        let dependencies = package["dependencies"]
            .as_object()
            .with_context(|| format!("{key} package {name} has no dependency map"))?;
        ensure!(
            package["version"] == version
                && package["resolvedPath"]
                    .as_str()
                    .is_some_and(|path| path.starts_with('/') && path.ends_with(".tgz"))
                && package["integrity"]
                    .as_str()
                    .is_some_and(|integrity| integrity.starts_with("sha512-"))
                && dependencies
                    .keys()
                    .all(|dependency| fixture["packages"].get(dependency).is_some()),
            "invalid {key} package identity for {name}"
        );
        dependency_edges += dependencies.len();
        let bins = package["bins"]
            .as_object()
            .with_context(|| format!("{key} package {name} has no bin map"))?;
        for (bin, target) in bins {
            ensure!(
                expected_bins
                    .insert(bin.clone(), json!({"package": name, "target": target}),)
                    .is_none(),
                "{key} fixture has duplicate bin {bin}"
            );
        }

        let tarball = &fixture["tarballs"][name];
        ensure!(
            tarball["integrity"] == package["integrity"]
                && is_blake3_value(&tarball["blake3"])
                && tarball["bytes"].as_u64().is_some_and(|value| value > 0)
                && tarball["fileCount"].as_u64().is_some_and(|value| value > 0)
                && tarball["unpackedBytes"]
                    .as_u64()
                    .is_some_and(|value| value > 0),
            "invalid {key} tarball evidence for {name}"
        );
        tarball_bytes += tarball["bytes"].as_u64().unwrap();
        archive_files += tarball["fileCount"].as_u64().unwrap();
        unpacked_bytes += tarball["unpackedBytes"].as_u64().unwrap();
    }
    ensure!(
        fixture["dependencyEdgeCount"] == dependency_edges
            && fixture["binCount"] == expected_bins.len()
            && fixture["bins"] == json!(expected_bins)
            && fixture["tarballBytes"] == tarball_bytes
            && fixture["archiveFiles"] == archive_files
            && fixture["unpackedBytes"] == unpacked_bytes,
        "{key} npm fixture aggregates do not reconcile"
    );
    Ok(())
}

fn validate_release_report(report: &Value) -> anyhow::Result<()> {
    ensure!(
        report["schema"] == "npm-metadata-v3",
        "unsupported npm release schema"
    );
    let minimum_iterations = if std::env::var_os("NPM_METADATA_RELEASE_SMOKE").is_some() {
        1
    } else {
        5
    };
    let iterations = report["environment"]["iterations"]
        .as_u64()
        .filter(|value| *value >= minimum_iterations)
        .with_context(|| {
            format!("npm release report needs at least {minimum_iterations} iterations")
        })? as usize;
    validate_release_fixture(&report["fixtures"]["small"], "small")?;
    validate_release_fixture(&report["fixtures"]["medium"], "medium")?;
    ensure!(
        report["inputs"]["algorithm"] == INPUT_HASH_ALGORITHM
            && report["timingBoundary"] == release_timing_boundary()
            && report["memory"]["interpretation"] == MEMORY_INTERPRETATION
            && report["environment"]["componentFeatures"] == "normal"
            && report["environment"]["componentCargoProfile"] == "release"
            && report["environment"]["harnessCargoProfile"] == "release"
            && report["environment"]["lockedBuilds"] == "1",
        "npm release report does not identify the production fixture contract"
    );

    let expected = [
        (
            "small", "metadata", "cold", "view", "cold", 1_u64, 0_u64, 1_u64, 0_u64,
        ),
        ("small", "warmTarballCi", "seeds", "ci", "seed", 0, 2, 2, 2),
        (
            "small",
            "warmTarballCi",
            "timed",
            "ci",
            "warm-tarball",
            0,
            0,
            0,
            2,
        ),
        (
            "medium",
            "warmTarballCi",
            "seeds",
            "ci",
            "seed",
            0,
            16,
            16,
            16,
        ),
        (
            "medium",
            "warmTarballCi",
            "timed",
            "ci",
            "warm-tarball",
            0,
            0,
            0,
            16,
        ),
    ];
    let mut max_linear_memory = 0;
    let mut installed_by_fixture = BTreeMap::<&str, Value>::new();
    for side in ["host", "wasm"] {
        for (
            fixture_key,
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
            let series = &report[side][fixture_key][group][series_name];
            let samples = series["samples"].as_array().with_context(|| {
                format!("missing {side} {fixture_key}/{group}/{series_name} samples")
            })?;
            let summary = summarize_release(samples);
            let summary_fields_match = ["medianMs", "p95Ms", "throughputPerSecond"]
                .into_iter()
                .all(|field| {
                    let Some(stored) = series[field].as_f64() else {
                        return false;
                    };
                    let expected = summary[field]
                        .as_f64()
                        .expect("recomputed npm summary field is numeric");
                    let tolerance = f64::EPSILON * expected.abs().max(1.0) * 8.0;
                    stored.is_finite() && (stored - expected).abs() <= tolerance
                });
            ensure!(
                samples.len() == iterations
                    && series.as_object().is_some_and(|series| series.len() == 5)
                    && series["iterations"] == summary["iterations"]
                    && summary_fields_match,
                "{side} {fixture_key}/{group}/{series_name} summary does not reconcile"
            );
            for sample in samples {
                let wall_ms = sample["wallMs"]
                    .as_f64()
                    .filter(|value| value.is_finite() && *value > 0.0);
                let stdout = sample["result"]["stdout"].as_str().unwrap_or_default();
                ensure!(
                    sample["sequence"]
                        .as_u64()
                        .is_some_and(|sequence| sequence < iterations as u64)
                        && sample["side"] == side
                        && sample["operation"] == operation
                        && sample["cache"] == cache
                        && sample["registry"] == "local"
                        && sample["success"] == true
                        && sample["result"]["exitCode"] == 0
                        && sample["result"]["overflowed"] == false
                        && sample["result"]["runnerError"].is_null()
                        && sample["result"]["stdoutBytes"] == stdout.len()
                        && sample["result"]["stdoutBlake3"]
                            == blake3::hash(stdout.as_bytes()).to_hex().to_string()
                        && sample["result"]["stderrBytes"].as_u64().is_some()
                        && is_blake3_value(&sample["result"]["stderrBlake3"])
                        && wall_ms.is_some()
                        && sample["localHttpRequests"]["metadata"] == metadata_requests
                        && sample["localHttpRequests"]["tarballs"] == tarball_requests
                        && sample["localHttpRequests"]["total"]
                            == metadata_requests + tarball_requests
                        && sample["localHttpRequests"]["unexpected"] == 0
                        && sample["npmHttpFetchLogLines"] == fetch_log_lines
                        && sample["npmHttpCacheLogLines"] == cache_log_lines,
                    "invalid {side} {fixture_key}/{group}/{series_name} sample: {sample}"
                );
                if operation == "view" {
                    ensure!(
                        stdout.trim() == VERSION && sample["installed"].is_null(),
                        "metadata sample has incorrect output or install state"
                    );
                } else {
                    let fixture = &report["fixtures"][fixture_key];
                    let installed = &sample["installed"];
                    ensure!(
                        installed["complete"] == true
                            && installed["packageNamesMatch"] == true
                            && installed["binsMatch"] == true
                            && installed["identityMismatches"] == json!([])
                            && installed["fileMismatches"] == json!([])
                            && installed["packages"] == fixture["packageCount"]
                            && installed["packageFiles"] == fixture["archiveFiles"]
                            && installed["packageBytes"] == fixture["unpackedBytes"]
                            && installed["bins"] == fixture["binCount"]
                            && installed["tree"]["directories"]
                                .as_u64()
                                .is_some_and(|value| value > 0)
                            && installed["tree"]["files"]
                                .as_u64()
                                .is_some_and(|value| value > 0)
                            && installed["tree"]["bytes"]
                                .as_u64()
                                .is_some_and(|value| value > 0)
                            && is_blake3_value(&installed["tree"]["blake3"])
                            && sample["lockfileUnchanged"] == true
                            && is_blake3_value(&sample["lockfileBlake3"]),
                        "npm ci sample did not install the pinned {fixture_key} fixture"
                    );
                    if let Some(expected) = installed_by_fixture.get(fixture_key) {
                        ensure!(
                            expected == installed,
                            "{fixture_key} installed trees differ across samples"
                        );
                    } else {
                        installed_by_fixture.insert(fixture_key, installed.clone());
                    }
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
        ("smallMetadataCold", "/wasm/small/metadata/cold/samples"),
        ("smallCiSeeds", "/wasm/small/warmTarballCi/seeds/samples"),
        (
            "smallCiWarmTarball",
            "/wasm/small/warmTarballCi/timed/samples",
        ),
        ("mediumCiSeeds", "/wasm/medium/warmTarballCi/seeds/samples"),
        (
            "mediumCiWarmTarball",
            "/wasm/medium/warmTarballCi/timed/samples",
        ),
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
    false_arguments["fixtures"]["medium"]["seriesArguments"]["ciTimed"][1] = json!("--online");
    ensure!(
        validate_release_report(&false_arguments).is_err(),
        "npm release validator accepted incorrect command arguments"
    );
    let mut false_fixture = report.clone();
    false_fixture["fixtures"]["medium"]["packageCount"] = json!(15);
    ensure!(
        validate_release_report(&false_fixture).is_err(),
        "npm release validator accepted an incorrect medium package count"
    );
    let mut false_integrity = report.clone();
    false_integrity["fixtures"]["medium"]["tarballs"]["ajv"]["integrity"] = json!("sha512-wrong");
    ensure!(
        validate_release_report(&false_integrity).is_err(),
        "npm release validator accepted incorrect tarball integrity"
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
    let mut false_summary = report.clone();
    false_summary["host"]["small"]["metadata"]["cold"]["throughputPerSecond"] = json!(1.0);
    ensure!(
        validate_release_report(&false_summary).is_err(),
        "npm release validator accepted an incorrect throughput summary"
    );
    let mut failed = report.clone();
    failed["host"]["small"]["metadata"]["cold"]["samples"][0]["success"] = json!(false);
    ensure!(
        validate_release_report(&failed).is_err(),
        "npm release validator accepted a failed sample"
    );
    let mut false_http = report.clone();
    false_http["wasm"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]["tarballs"] =
        json!(1);
    ensure!(
        validate_release_report(&false_http).is_err(),
        "npm release validator accepted unexpected warm-cache HTTP"
    );
    let mut unclassified_http = report.clone();
    unclassified_http["wasm"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]
        ["total"] = json!(1);
    unclassified_http["wasm"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["localHttpRequests"]
        ["unexpected"] = json!(1);
    ensure!(
        validate_release_report(&unclassified_http).is_err(),
        "npm release validator accepted an unclassified registry request"
    );
    let mut missing_install = report.clone();
    missing_install["host"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["complete"] =
        json!(false);
    ensure!(
        validate_release_report(&missing_install).is_err(),
        "npm release validator accepted an incomplete install"
    );
    let mut mismatched_identity = report.clone();
    mismatched_identity["host"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["identityMismatches"] =
        json!(["ajv"]);
    ensure!(
        validate_release_report(&mismatched_identity).is_err(),
        "npm release validator accepted a package identity mismatch"
    );
    let mut mismatched_files = report.clone();
    mismatched_files["host"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["fileMismatches"] =
        json!(["ajv: missing dist/ajv.js"]);
    ensure!(
        validate_release_report(&mismatched_files).is_err(),
        "npm release validator accepted a package file mismatch"
    );
    let mut mismatched_bins = report.clone();
    mismatched_bins["host"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["binsMatch"] =
        json!(false);
    ensure!(
        validate_release_report(&mismatched_bins).is_err(),
        "npm release validator accepted a package bin mismatch"
    );
    let mut false_tree = report.clone();
    false_tree["wasm"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["installed"]["tree"]["blake3"] =
        json!("0".repeat(64));
    ensure!(
        validate_release_report(&false_tree).is_err(),
        "npm release validator accepted a mismatched installed tree"
    );
    let mut missing_memory = report.clone();
    missing_memory["wasm"]["medium"]["warmTarballCi"]["timed"]["samples"][0]["linearMemoryHighWaterBytes"] =
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
            && is_blake3_value(&report["fixtures"]["small"]["packageJsonBlake3"])
            && is_blake3_value(&report["fixtures"]["small"]["packageLockBlake3"])
            && is_blake3_value(&report["fixtures"]["medium"]["packageJsonBlake3"])
            && is_blake3_value(&report["fixtures"]["medium"]["packageLockBlake3"])
            && is_blake3_value(&report["npmTool"]["blake3"])
            && report["npmTool"]["algorithm"] == INPUT_HASH_ALGORITHM
            && report["npmTool"]["files"]
                .as_u64()
                .is_some_and(|value| value > 0)
            && report["npmTool"]["bytes"]
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
    for fixture_key in ["small", "medium"] {
        let packages = report["fixtures"][fixture_key]["packages"]
            .as_object()
            .with_context(|| format!("{path} has no {fixture_key} packages"))?;
        for name in packages.keys() {
            let tarball = &report["fixtures"][fixture_key]["tarballs"][name];
            ensure!(
                is_blake3_value(&tarball["blake3"])
                    && tarball["bytes"].as_u64().is_some_and(|value| value > 0)
                    && tarball["integrity"] == packages[name]["integrity"],
                "{path} has incomplete tarball provenance for {name}"
            );
        }
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
            && report["fixtures"]["small"]["packageJsonBlake3"] == current.small_package_json
            && report["fixtures"]["small"]["packageLockBlake3"] == current.small_package_lock
            && report["fixtures"]["medium"]["packageJsonBlake3"] == current.medium_package_json
            && report["fixtures"]["medium"]["packageLockBlake3"] == current.medium_package_lock,
        "npm release report does not match the current source inputs"
    );
    Ok(())
}

fn validate_release_currentness_regression_guards(
    report: &Value,
    current: &CurrentReleaseInputs,
) -> anyhow::Result<()> {
    for pointer in [
        "/fixtures/small/packageJsonBlake3",
        "/fixtures/small/packageLockBlake3",
        "/fixtures/medium/packageJsonBlake3",
        "/fixtures/medium/packageLockBlake3",
    ] {
        let mut mismatched = report.clone();
        *mismatched
            .pointer_mut(pointer)
            .expect("validated report has fixture digest") = json!("0".repeat(64));
        ensure!(
            validate_release_currentness(&mismatched, current).is_err(),
            "npm currentness validator accepted an incorrect fixture digest: {pointer}"
        );
    }
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
        "/npmTool",
        "/fixtures",
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

struct CurrentNpmReportIdentity {
    source_hint: String,
    build_hash: String,
    benchmark_hash: String,
}

fn validate_current_npm_manifest_identity(
    path: &Utf8Path,
    report: &Value,
    identity: &CurrentNpmReportIdentity,
) -> anyhow::Result<()> {
    ensure!(
        report["environment"]["commitHint"].as_str() == Some(identity.source_hint.as_str()),
        "{path} source hint does not match its current-report manifest"
    );
    ensure!(
        report["inputs"]["buildHash"].as_str() == Some(identity.build_hash.as_str()),
        "{path} build hash does not match its current-report manifest"
    );
    ensure!(
        report["inputs"]["benchmarkHash"].as_str() == Some(identity.benchmark_hash.as_str()),
        "{path} benchmark hash does not match its current-report manifest"
    );
    Ok(())
}

fn validate_current_npm_manifest_identity_regression_guards(
    path: &Utf8Path,
    report: &Value,
    identity: &CurrentNpmReportIdentity,
) -> anyhow::Result<()> {
    for pointer in [
        "/environment/commitHint",
        "/inputs/buildHash",
        "/inputs/benchmarkHash",
    ] {
        let mut mismatched = report.clone();
        *mismatched
            .pointer_mut(pointer)
            .expect("validated report has currentness identity field") =
            json!("0000000000000000000000000000000000000000000000000000000000000000");
        ensure!(
            validate_current_npm_manifest_identity(path, &mismatched, identity).is_err(),
            "current npm report manifest identity accepted a mismatched field: {pointer}"
        );
    }
    Ok(())
}

fn validate_checked_release_reports(directory: Utf8PathBuf) -> anyhow::Result<()> {
    validate_npm_composite_hash_contract()?;
    validate_npm_report_path_contract()?;
    let readme = fs::read_to_string(Utf8Path::new(SUITE_DIR).join("results/README.md"))?;
    let allow_untracked = std::env::var_os("NPM_METADATA_ALLOW_UNTRACKED_REPORTS").is_some();
    let mut requested = npm_reports_to_check()?;
    let mut current_manifest_reports = npm_report_paths_from_env("NPM_METADATA_CURRENT_REPORTS")?;
    ensure!(
        allow_untracked || !current_manifest_reports.is_empty(),
        "checked-report validation requires manifest identity; use tests/npm_metadata/run.sh --check"
    );
    let current_manifest_identity = if current_manifest_reports.is_empty() {
        None
    } else {
        Some(CurrentNpmReportIdentity {
            source_hint: std::env::var("NPM_METADATA_EXPECTED_SOURCE_REF").context(
                "NPM_METADATA_CURRENT_REPORTS requires NPM_METADATA_EXPECTED_SOURCE_REF",
            )?,
            build_hash: std::env::var("NPM_METADATA_EXPECTED_BUILD_HASH").context(
                "NPM_METADATA_CURRENT_REPORTS requires NPM_METADATA_EXPECTED_BUILD_HASH",
            )?,
            benchmark_hash: std::env::var("NPM_METADATA_EXPECTED_BENCHMARK_HASH").context(
                "NPM_METADATA_CURRENT_REPORTS requires NPM_METADATA_EXPECTED_BENCHMARK_HASH",
            )?,
        })
    };
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
        ensure!(
            report["schema"] == "npm-metadata-v3",
            "{} is not a checked npm-metadata-v3 release report; retain historical aggregates in Markdown instead",
            path
        );
        validate_release_metadata(&path, &report)?;
        validate_release_report(&report)?;
        validate_release_regression_guards(&report)?;
        if current_manifest_reports.remove(&path) {
            let identity = current_manifest_identity
                .as_ref()
                .expect("manifest identity exists");
            validate_current_npm_manifest_identity(&path, &report, identity)?;
            validate_current_npm_manifest_identity_regression_guards(&path, &report, identity)?;
        }
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
    ensure!(
        current_manifest_reports.is_empty(),
        "current npm release reports were not found: {current_manifest_reports:?}"
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
    npm_report_paths_from_env("NPM_METADATA_REPORTS_TO_CHECK")
}

fn npm_report_paths_from_env(variable: &str) -> anyhow::Result<BTreeSet<Utf8PathBuf>> {
    let results_directory = Utf8Path::new(SUITE_DIR).join("results");
    let source_root = npm_source_root()?;
    std::env::var(variable)
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

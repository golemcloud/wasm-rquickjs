use crate::common::test_server::TestServerHandle;
use crate::common::{CompiledTest, FeatureCombination, TestInstance, copy_dir_recursive};
use axum::Router;
use axum::body::Body;
use axum::http::{StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::get;
use camino::{Utf8Path, Utf8PathBuf};
use std::fs;
use std::process::Command;
use test_r::{test, test_dep};
use wasmtime::component::Val;

const NODE_BASELINE: &str = "22.14.0";
const NPM_BASELINE: &str = "10.9.2";

#[test_dep(tagged_as = "npm_compat", scope = Cloneable)]
async fn compiled_npm_compat() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/npm-compat"),
        true,
        FeatureCombination::Normal,
    )
    .await
    .expect("Failed to compile npm-compat")
}

#[test_dep(tagged_as = "npm_typescript_compat", scope = Cloneable)]
async fn compiled_npm_typescript_compat() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/npm-compat"),
        false,
        FeatureCombination::TypeScriptTransformRuntime,
    )
    .await
    .expect("Failed to compile TypeScript npm-compat")
}

fn command_stdout(command: &mut Command) -> anyhow::Result<String> {
    let output = command.output()?;
    anyhow::ensure!(
        output.status.success(),
        "command failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(String::from_utf8(output.stdout)?.trim().to_string())
}

fn host_npm_dir() -> anyhow::Result<Utf8PathBuf> {
    let node_version = command_stdout(Command::new("node").args(["-p", "process.versions.node"]))?;
    anyhow::ensure!(
        node_version == NODE_BASELINE,
        "npm compatibility tests require Node.js {NODE_BASELINE}; found {node_version}"
    );

    let npm_root = command_stdout(Command::new("npm").args(["root", "-g"]))?;
    let npm_dir = Utf8PathBuf::from(npm_root).join("npm");
    let package: serde_json::Value =
        serde_json::from_slice(&fs::read(npm_dir.join("package.json"))?)?;
    anyhow::ensure!(
        package["version"] == NPM_BASELINE,
        "npm compatibility tests require npm {NPM_BASELINE}; found {}",
        package["version"]
    );
    Ok(npm_dir)
}

fn string_list(values: &[&str]) -> Val {
    Val::List(
        values
            .iter()
            .map(|value| Val::String((*value).to_string()))
            .collect(),
    )
}

fn npm_debug_logs(instance: &TestInstance) -> String {
    let log_dir = instance.temp_dir_path().join("cache/npm/_logs");
    let Ok(entries) = fs::read_dir(log_dir) else {
        return String::new();
    };
    let mut paths = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .collect::<Vec<_>>();
    paths.sort();
    paths
        .iter()
        .filter_map(|path| fs::read_to_string(path).ok())
        .collect::<Vec<_>>()
        .join("\n")
}

async fn start_registry_server(tarball: Vec<u8>) -> anyhow::Result<(u16, TestServerHandle)> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    let tarball_url = format!(
        "http://127.0.0.1:{port}/fixture-registry-dependency/-/fixture-registry-dependency-1.0.0.tgz"
    );
    let metadata = serde_json::json!({
        "name": "fixture-registry-dependency",
        "dist-tags": { "latest": "1.0.0" },
        "versions": {
            "1.0.0": {
                "name": "fixture-registry-dependency",
                "version": "1.0.0",
                "type": "module",
                "exports": "./index.js",
                "dist": { "tarball": tarball_url }
            }
        }
    });
    let router = Router::new()
        .route(
            "/fixture-registry-dependency",
            get(move || {
                let metadata = metadata.clone();
                async move { axum::Json(metadata) }
            }),
        )
        .route(
            "/fixture-registry-dependency/-/fixture-registry-dependency-1.0.0.tgz",
            get(move || {
                let tarball = tarball.clone();
                async move {
                    (
                        StatusCode::OK,
                        [(header::CONTENT_TYPE, "application/octet-stream")],
                        Body::from(tarball),
                    )
                        .into_response()
                }
            }),
        );
    let handle = tokio::spawn(async move {
        axum::serve(listener, router)
            .await
            .expect("npm registry fixture server failed");
    });
    Ok((port, TestServerHandle::new(handle)))
}

async fn start_hanging_registry_server() -> anyhow::Result<(u16, TestServerHandle)> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    let router = Router::new().route(
        "/fixture-registry-dependency",
        get(|| async {
            std::future::pending::<()>().await;
            StatusCode::GATEWAY_TIMEOUT
        }),
    );
    let handle = tokio::spawn(async move {
        axum::serve(listener, router)
            .await
            .expect("hanging npm registry fixture server failed");
    });
    Ok((port, TestServerHandle::new(handle)))
}

fn pack_registry_fixture(output_dir: &Utf8Path) -> anyhow::Result<Vec<u8>> {
    let fixture_dir = Utf8Path::new("tests/npm_compat/fixtures/registry-package");
    let output = Command::new("npm")
        .current_dir(fixture_dir)
        .args([
            "pack",
            "--ignore-scripts",
            "--json",
            "--pack-destination",
            output_dir.as_str(),
        ])
        .output()?;
    anyhow::ensure!(
        output.status.success(),
        "host npm pack failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let reports: serde_json::Value = serde_json::from_slice(&output.stdout)?;
    let filename = reports[0]["filename"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("host npm pack did not report a filename: {reports:#}"))?;
    Ok(fs::read(output_dir.join(filename))?)
}

async fn prepare_instance(
    compiled: &CompiledTest,
    fixture: Option<&str>,
) -> anyhow::Result<TestInstance> {
    let instance = TestInstance::new(compiled.wasm_path()).await?;
    let tool_dir = instance.temp_dir_path().join("tool/npm");
    let workspace_dir = instance.temp_dir_path().join("workspace");
    for path in [
        &tool_dir,
        &workspace_dir,
        &instance.temp_dir_path().join("home/npm"),
        &instance.temp_dir_path().join("cache/npm"),
        &instance.temp_dir_path().join("prefix"),
    ] {
        fs::create_dir_all(path)?;
    }
    copy_dir_recursive(host_npm_dir()?.as_std_path(), tool_dir.as_std_path())?;
    if let Some(fixture) = fixture {
        let fixture_dir = Utf8Path::new("tests/npm_compat/fixtures").join(fixture);
        copy_dir_recursive(fixture_dir.as_std_path(), workspace_dir.as_std_path())?;
    }
    Ok(instance)
}

#[test]
async fn npm_cli_version(#[tagged_as("npm_compat")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, None).await?;

    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(None, "run", &[string_list(&["--version"])])
        .await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert_eq!(report["stdout"], format!("{NPM_BASELINE}\n"), "{report:#}");
    assert_eq!(report["stderr"], "", "{report:#}");
    assert!(stdout.is_empty(), "nested npm stdout leaked: {stdout}");
    assert!(stderr.is_empty(), "nested npm stderr leaked: {stderr}");
    Ok(())
}

#[test]
async fn npm_cli_prefix(#[tagged_as("npm_compat")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let Some(Val::String(probe_json)) = instance.invoke(None, "probe-runtime", &[]).await? else {
        anyhow::bail!("expected runtime probe JSON result")
    };
    let probe: serde_json::Value = serde_json::from_str(&probe_json)?;
    assert_eq!(probe["cwd"], "/");
    assert_eq!(probe["fileUrl"], "/workspace/packages/fixture-dependency");
    let (result, _, _) = instance
        .invoke_and_capture_output_with_stderr(None, "run", &[string_list(&["prefix"])])
        .await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert_eq!(report["stdout"], "/workspace\n", "{report:#}");
    assert_eq!(report["stderr"], "", "{report:#}");
    Ok(())
}

#[test]
async fn npm_required_runtime_primitives(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let primitive = instance.invoke(None, "probe-primitives", &[]).await?;
    let Some(Val::String(primitive_json)) = primitive else {
        anyhow::bail!("expected runtime primitive probe JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&primitive_json)?;
    assert_eq!(report["value"]["constantsCjs"], true, "{report:#}");
    assert_eq!(
        report["value"]["heapSizeLimit"],
        512 * 1024 * 1024,
        "execution must report the exact memory limit enforced by its QuickJS runtime: {report:#}"
    );
    assert_eq!(report["value"]["bufferView"], true, "{report:#}");
    assert_eq!(report["value"]["zlibRoundTrip"], true, "{report:#}");
    assert_eq!(report["stderr"], "", "{report:#}");
    Ok(())
}

#[test]
async fn npm_cli_help_and_config(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    for (args, expected_exit, expected_stdout) in [
        (&["--help"][..], 1, "Usage:"),
        (&["config", "get", "cache"][..], 0, "/cache/npm\n"),
        (&["config", "get", "prefix"][..], 0, "/prefix\n"),
    ] {
        let result = instance.invoke(None, "run", &[string_list(args)]).await?;
        let Some(Val::String(json)) = result else {
            anyhow::bail!("expected npm execution JSON result for {args:?}")
        };
        let report: serde_json::Value = serde_json::from_str(&json)?;
        assert_eq!(
            report["value"]["exitCode"],
            expected_exit,
            "{args:?}: {report:#}\n[npm debug logs]\n{}",
            npm_debug_logs(&instance)
        );
        assert!(
            report["stdout"]
                .as_str()
                .is_some_and(|value| value.contains(expected_stdout)),
            "{args:?}: {report:#}"
        );
        assert_eq!(report["stderr"], "", "{args:?}: {report:#}");
    }
    Ok(())
}

#[test]
async fn npm_init_noninteractive(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, None).await?;
    let result = instance
        .invoke(None, "run", &[string_list(&["init", "--yes"])])
        .await?;
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected npm init JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    let package: serde_json::Value = serde_json::from_slice(&fs::read(
        instance.temp_dir_path().join("workspace/package.json"),
    )?)?;
    assert_eq!(package["name"], "workspace");
    assert_eq!(package["version"], "1.0.0");
    Ok(())
}

#[test]
async fn npm_pack_local_project_dry_run(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let result = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "pack",
                "--dry-run",
                "--json",
                "--ignore-scripts",
            ])],
        )
        .await?;
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected npm pack JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    let packs: serde_json::Value = serde_json::from_str(
        report["stdout"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("npm pack stdout was not a string: {report:#}"))?,
    )?;
    assert_eq!(packs[0]["filename"], "npm-compat-local-install-1.0.0.tgz");
    assert!(
        !instance
            .temp_dir_path()
            .join("workspace/npm-compat-local-install-1.0.0.tgz")
            .exists(),
        "npm pack --dry-run unexpectedly wrote an archive"
    );
    Ok(())
}

#[test]
async fn npm_install_local_pure_javascript(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let args = string_list(&[
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--install-links",
    ]);
    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(None, "run", &[args])
        .await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        report["stderr"].as_str().is_some_and(str::is_empty),
        "{report:#}"
    );
    assert!(stdout.is_empty(), "nested npm stdout leaked: {stdout}");
    assert!(stderr.is_empty(), "nested npm stderr leaked: {stderr}");

    let installed_package = instance
        .temp_dir_path()
        .join("workspace/node_modules/fixture-dependency/package.json");
    anyhow::ensure!(
        installed_package.exists(),
        "npm did not materialize local dependency"
    );
    anyhow::ensure!(
        instance
            .temp_dir_path()
            .join("workspace/package-lock.json")
            .exists(),
        "npm did not create package-lock.json"
    );

    let installed = instance.invoke(None, "run-installed", &[]).await?;
    let Some(Val::String(installed_json)) = installed else {
        anyhow::bail!("expected installed package execution JSON result")
    };
    let installed_report: serde_json::Value = serde_json::from_str(&installed_json)?;
    assert_eq!(installed_report["value"]["kind"], "pure-javascript");
    assert_eq!(
        installed_report["value"]["loadedFrom"],
        "file:///workspace/node_modules/fixture-dependency/index.js"
    );

    Ok(())
}

#[test]
async fn npm_installed_javascript_loads_from_typescript(
    #[tagged_as("npm_typescript_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let install = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "install",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(install_json)) = install else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let install_report: serde_json::Value = serde_json::from_str(&install_json)?;
    assert_eq!(
        install_report["value"]["exitCode"],
        0,
        "{install_report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );

    let typescript = instance
        .invoke(None, "run-installed-typescript", &[])
        .await?;
    let Some(Val::String(typescript_json)) = typescript else {
        anyhow::bail!("expected installed TypeScript execution JSON result")
    };
    let typescript_report: serde_json::Value = serde_json::from_str(&typescript_json)?;
    assert_eq!(typescript_report["project"]["value"]["answer"], 42);
    assert_eq!(
        typescript_report["project"]["value"]["runtime"],
        "typescript"
    );
    assert_eq!(
        typescript_report["project"]["value"]["dependencyKind"],
        "pure-javascript"
    );
    assert_eq!(
        typescript_report["rawTypeScriptDependencyError"]["code"],
        "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING"
    );
    assert_eq!(
        typescript_report["rawTypeScriptDependencyError"]["name"],
        "Error"
    );
    assert_eq!(
        typescript_report["rawTypeScriptDependencyError"]["message"],
        "Stripping types is currently unsupported for files under node_modules, for \"/workspace/node_modules/fixture-dependency/raw-typescript.ts\""
    );
    Ok(())
}

#[test]
async fn npm_install_package_lock_only(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let lockfile = instance.temp_dir_path().join("workspace/package-lock.json");
    fs::remove_file(&lockfile)?;
    let result = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "install",
                "--package-lock-only",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected package-lock-only JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(lockfile.exists(), "npm did not create package-lock.json");
    assert!(
        !instance
            .temp_dir_path()
            .join("workspace/node_modules")
            .exists(),
        "package-lock-only unexpectedly materialized node_modules"
    );
    let lock: serde_json::Value = serde_json::from_slice(&fs::read(lockfile)?)?;
    assert_eq!(lock["lockfileVersion"], 3);
    assert_eq!(
        lock["packages"]["node_modules/fixture-dependency"]["version"],
        "1.0.0"
    );
    Ok(())
}

#[test]
async fn npm_install_runs_node_lifecycle_script(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let result = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "install",
                "--foreground-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
                "--bin-links=false",
            ])],
        )
        .await?;
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected npm install JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        report["stdout"]
            .as_str()
            .is_some_and(|value| value.contains("npm-lifecycle:ok")),
        "{report:#}"
    );
    let lifecycle: serde_json::Value = serde_json::from_slice(&fs::read(
        instance
            .temp_dir_path()
            .join("workspace/lifecycle-result.json"),
    )?)?;
    assert_eq!(lifecycle["lifecycleEvent"], "postinstall");
    assert_eq!(lifecycle["packageName"], "fixture-dependency");
    assert_eq!(
        lifecycle["cwd"],
        "/workspace/node_modules/fixture-dependency"
    );
    Ok(())
}

#[test]
async fn npm_install_registry_pure_javascript(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("registry-install")).await?;
    let pack_dir = instance.temp_dir_path().join("registry-pack");
    fs::create_dir_all(&pack_dir)?;
    let tarball = pack_registry_fixture(&pack_dir)?;
    let (port, server) = start_registry_server(tarball).await?;
    let registry = format!("--registry=http://127.0.0.1:{port}");
    let view_args = [
        "view",
        "fixture-registry-dependency",
        "version",
        registry.as_str(),
    ];
    let view = instance
        .invoke(None, "run", &[string_list(&view_args)])
        .await?;
    let Some(Val::String(view_json)) = view else {
        anyhow::bail!("expected npm view JSON result")
    };
    let view_report: serde_json::Value = serde_json::from_str(&view_json)?;
    assert_eq!(view_report["value"]["exitCode"], 0, "{view_report:#}");
    assert_eq!(view_report["stdout"], "1.0.0\n", "{view_report:#}");

    let args = [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        registry.as_str(),
    ];
    let result = instance.invoke(None, "run", &[string_list(&args)]).await?;
    drop(server);
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected npm registry install JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    let installed = instance.invoke(None, "run-registry-installed", &[]).await?;
    let Some(Val::String(installed_json)) = installed else {
        anyhow::bail!("expected registry package execution JSON result")
    };
    let installed_report: serde_json::Value = serde_json::from_str(&installed_json)?;
    assert_eq!(
        installed_report["value"]["kind"],
        "registry-pure-javascript"
    );
    assert_eq!(
        installed_report["value"]["loadedFrom"],
        "file:///workspace/node_modules/fixture-registry-dependency/index.js"
    );

    fs::remove_dir_all(instance.temp_dir_path().join("workspace/node_modules"))?;
    let offline = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--offline",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
            ])],
        )
        .await?;
    let Some(Val::String(offline_json)) = offline else {
        anyhow::bail!("expected offline npm ci JSON result")
    };
    let offline_report: serde_json::Value = serde_json::from_str(&offline_json)?;
    assert_eq!(
        offline_report["value"]["exitCode"],
        0,
        "{offline_report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    let restored = instance.invoke(None, "run-registry-installed", &[]).await?;
    let Some(Val::String(restored_json)) = restored else {
        anyhow::bail!("expected offline-restored package execution JSON result")
    };
    let restored_report: serde_json::Value = serde_json::from_str(&restored_json)?;
    assert_eq!(restored_report["value"]["kind"], "registry-pure-javascript");
    Ok(())
}

#[test]
async fn npm_registry_timeout_releases_execution_capacity(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("registry-install")).await?;
    let (port, server) = start_hanging_registry_server().await?;
    let registry = format!("--registry=http://127.0.0.1:{port}");
    let args = [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        registry.as_str(),
    ];
    let timed_out = instance
        .invoke(
            None,
            "run-with-timeout",
            &[string_list(&args), Val::U32(100)],
        )
        .await?;
    drop(server);
    let Some(Val::String(timeout_json)) = timed_out else {
        anyhow::bail!("expected timed-out npm JSON result")
    };
    let timeout_report: serde_json::Value = serde_json::from_str(&timeout_json)?;
    assert!(
        timeout_report["runnerError"]["message"]
            .as_str()
            .is_some_and(|value| value.contains("execution job timed out")),
        "{timeout_report:#}"
    );

    let followup = instance
        .invoke(None, "run", &[string_list(&["--version"])])
        .await?;
    let Some(Val::String(followup_json)) = followup else {
        anyhow::bail!("expected follow-up npm JSON result")
    };
    let followup_report: serde_json::Value = serde_json::from_str(&followup_json)?;
    assert_eq!(
        followup_report["value"]["exitCode"], 0,
        "{followup_report:#}"
    );
    assert_eq!(followup_report["stdout"], format!("{NPM_BASELINE}\n"));
    Ok(())
}

#[test]
async fn npm_ci_local_pure_javascript(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let stale_file = instance
        .temp_dir_path()
        .join("workspace/node_modules/stale-package/index.js");
    fs::create_dir_all(stale_file.parent().expect("stale fixture has parent"))?;
    fs::write(
        &stale_file,
        "throw new Error('npm ci did not clean node_modules')",
    )?;

    let args = string_list(&[
        "ci",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--install-links",
    ]);
    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(None, "run", &[args])
        .await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        report["stderr"].as_str().is_some_and(str::is_empty),
        "{report:#}"
    );
    assert!(stdout.is_empty(), "nested npm stdout leaked: {stdout}");
    assert!(stderr.is_empty(), "nested npm stderr leaked: {stderr}");
    assert!(
        !stale_file.exists(),
        "npm ci did not remove the existing node_modules tree"
    );
    assert!(
        instance
            .temp_dir_path()
            .join("workspace/node_modules/fixture-dependency/package.json")
            .exists(),
        "npm ci did not materialize the locked local dependency"
    );

    let installed = instance.invoke(None, "run-installed", &[]).await?;
    let Some(Val::String(installed_json)) = installed else {
        anyhow::bail!("expected installed package execution JSON result")
    };
    let installed_report: serde_json::Value = serde_json::from_str(&installed_json)?;
    assert_eq!(installed_report["value"]["kind"], "pure-javascript");
    Ok(())
}

#[test]
async fn npm_ci_loads_commonjs_and_dual_packages(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let ci = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(ci_json)) = ci else {
        anyhow::bail!("expected npm ci JSON result")
    };
    let ci_report: serde_json::Value = serde_json::from_str(&ci_json)?;
    assert_eq!(ci_report["value"]["exitCode"], 0, "{ci_report:#}");

    let formats = instance.invoke(None, "run-package-formats", &[]).await?;
    let Some(Val::String(formats_json)) = formats else {
        anyhow::bail!("expected installed package format JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&formats_json)?;
    assert_eq!(report["value"]["commonjs"]["format"], "commonjs");
    assert_eq!(report["value"]["dualEsm"]["format"], "dual-esm");
    assert_eq!(report["value"]["dualCommonjs"]["format"], "dual-commonjs");
    assert!(
        report["value"]["commonjs"]["loadedFrom"]
            .as_str()
            .is_some_and(|value| value.ends_with("/fixture-commonjs-dependency/index.cjs")),
        "{report:#}"
    );
    Ok(())
}

#[test]
async fn npm_ci_omit_and_include_dependency_classes(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("dependency-selection")).await?;
    let omitted = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--omit=dev",
                "--omit=optional",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(omitted_json)) = omitted else {
        anyhow::bail!("expected npm ci omit JSON result")
    };
    let omitted_report: serde_json::Value = serde_json::from_str(&omitted_json)?;
    assert_eq!(omitted_report["value"]["exitCode"], 0, "{omitted_report:#}");
    let modules = instance.temp_dir_path().join("workspace/node_modules");
    assert!(modules.join("fixture-required").exists());
    assert!(!modules.join("fixture-dev").exists());
    assert!(!modules.join("fixture-optional").exists());

    let included = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--include=dev",
                "--include=optional",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(included_json)) = included else {
        anyhow::bail!("expected npm ci include JSON result")
    };
    let included_report: serde_json::Value = serde_json::from_str(&included_json)?;
    assert_eq!(
        included_report["value"]["exitCode"], 0,
        "{included_report:#}"
    );
    assert!(modules.join("fixture-required").exists());
    assert!(modules.join("fixture-dev").exists());
    assert!(modules.join("fixture-optional").exists());
    Ok(())
}

#[test]
async fn npm_concurrent_and_repeated_installs_are_isolated(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut left = prepare_instance(compiled, Some("local-install")).await?;
    let mut right = prepare_instance(compiled, Some("dependency-selection")).await?;
    let left_args = string_list(&[
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--install-links",
    ]);
    let right_args = string_list(&[
        "ci",
        "--omit=dev",
        "--omit=optional",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--install-links",
    ]);
    let left_params = [left_args];
    let right_params = [right_args];
    let (left_result, right_result) = tokio::join!(
        left.invoke(None, "run", &left_params),
        right.invoke(None, "run", &right_params),
    );
    for (name, result) in [("left", left_result?), ("right", right_result?)] {
        let Some(Val::String(json)) = result else {
            anyhow::bail!("expected {name} concurrent npm JSON result")
        };
        let report: serde_json::Value = serde_json::from_str(&json)?;
        assert_eq!(report["value"]["exitCode"], 0, "{name}: {report:#}");
    }
    assert!(
        left.temp_dir_path()
            .join("workspace/node_modules/fixture-dependency")
            .exists()
    );
    assert!(
        !left
            .temp_dir_path()
            .join("workspace/node_modules/fixture-required")
            .exists()
    );
    assert!(
        right
            .temp_dir_path()
            .join("workspace/node_modules/fixture-required")
            .exists()
    );
    assert!(
        !right
            .temp_dir_path()
            .join("workspace/node_modules/fixture-dependency")
            .exists()
    );

    let repeated = left
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(repeated_json)) = repeated else {
        anyhow::bail!("expected repeated npm ci JSON result")
    };
    let repeated_report: serde_json::Value = serde_json::from_str(&repeated_json)?;
    assert_eq!(
        repeated_report["value"]["exitCode"], 0,
        "{repeated_report:#}"
    );
    let installed = left.invoke(None, "run-installed", &[]).await?;
    let Some(Val::String(installed_json)) = installed else {
        anyhow::bail!("expected repeated-install package execution JSON result")
    };
    let installed_report: serde_json::Value = serde_json::from_str(&installed_json)?;
    assert_eq!(installed_report["value"]["kind"], "pure-javascript");
    Ok(())
}

#[test]
async fn npm_inspects_installed_local_tree(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let ci = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(ci_json)) = ci else {
        anyhow::bail!("expected npm ci JSON result")
    };
    let ci_report: serde_json::Value = serde_json::from_str(&ci_json)?;
    assert_eq!(ci_report["value"]["exitCode"], 0, "{ci_report:#}");

    let ls = instance
        .invoke(None, "run", &[string_list(&["ls", "--json"])])
        .await?;
    let Some(Val::String(ls_json)) = ls else {
        anyhow::bail!("expected npm ls JSON result")
    };
    let ls_report: serde_json::Value = serde_json::from_str(&ls_json)?;
    assert_eq!(ls_report["value"]["exitCode"], 1, "{ls_report:#}");
    assert!(
        ls_report["stderr"]
            .as_str()
            .is_some_and(|value| value.contains("ELSPROBLEMS") && value.contains("invalid")),
        "{ls_report:#}"
    );
    let tree: serde_json::Value = serde_json::from_str(
        ls_report["stdout"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("npm ls stdout was not a string: {ls_report:#}"))?,
    )?;
    assert_eq!(
        tree["dependencies"]["fixture-dependency"]["version"],
        "1.0.0"
    );

    let explain = instance
        .invoke(
            None,
            "run",
            &[string_list(&["explain", "fixture-dependency"])],
        )
        .await?;
    let Some(Val::String(explain_json)) = explain else {
        anyhow::bail!("expected npm explain JSON result")
    };
    let explain_report: serde_json::Value = serde_json::from_str(&explain_json)?;
    assert_eq!(explain_report["value"]["exitCode"], 0, "{explain_report:#}");
    assert!(
        explain_report["stdout"]
            .as_str()
            .is_some_and(|value| value.contains("fixture-dependency@1.0.0")),
        "{explain_report:#}"
    );
    Ok(())
}

#[test]
async fn npm_mutates_installed_local_tree(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let ci = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(ci_json)) = ci else {
        anyhow::bail!("expected npm ci JSON result")
    };
    let ci_report: serde_json::Value = serde_json::from_str(&ci_json)?;
    assert_eq!(ci_report["value"]["exitCode"], 0, "{ci_report:#}");

    for args in [
        &[
            "dedupe",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            "--bin-links=false",
        ][..],
        &[
            "update",
            "fixture-dependency",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            "--bin-links=false",
        ][..],
    ] {
        let result = instance.invoke(None, "run", &[string_list(args)]).await?;
        let Some(Val::String(json)) = result else {
            anyhow::bail!("expected npm execution JSON result for {args:?}")
        };
        let report: serde_json::Value = serde_json::from_str(&json)?;
        assert_eq!(
            report["value"]["exitCode"],
            0,
            "{args:?}: {report:#}\n[npm debug logs]\n{}",
            npm_debug_logs(&instance)
        );
    }

    let uninstall = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "uninstall",
                "fixture-dependency",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--bin-links=false",
            ])],
        )
        .await?;
    let Some(Val::String(uninstall_json)) = uninstall else {
        anyhow::bail!("expected npm uninstall JSON result")
    };
    let uninstall_report: serde_json::Value = serde_json::from_str(&uninstall_json)?;
    assert_eq!(
        uninstall_report["value"]["exitCode"],
        0,
        "{uninstall_report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        !instance
            .temp_dir_path()
            .join("workspace/node_modules/fixture-dependency")
            .exists()
    );
    let package: serde_json::Value = serde_json::from_slice(&fs::read(
        instance.temp_dir_path().join("workspace/package.json"),
    )?)?;
    assert!(package["dependencies"].get("fixture-dependency").is_none());
    Ok(())
}

#[test]
async fn npm_run_local_javascript(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let (result, _, _) = instance
        .invoke_and_capture_output_with_stderr(
            None,
            "run",
            &[string_list(&["run", "verify", "--", "forwarded"])],
        )
        .await;
    let Some(Val::String(json)) = result? else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(
        report["value"]["exitCode"],
        0,
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        report["stdout"]
            .as_str()
            .is_some_and(|value| value.contains("npm-run:ok")),
        "{report:#}"
    );
    let result_file = instance
        .temp_dir_path()
        .join("workspace/npm-run-result.json");
    let script_result: serde_json::Value = serde_json::from_slice(&fs::read(result_file)?)?;
    assert_eq!(script_result["cwd"], "/workspace");
    assert_eq!(script_result["lifecycleEvent"], "verify");
    assert_eq!(
        script_result["argv"]
            .as_array()
            .and_then(|args| args.last()),
        Some(&serde_json::json!("forwarded"))
    );
    Ok(())
}

#[test]
async fn npm_run_shell_operator_reports_unsupported(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let result = instance
        .invoke(None, "run", &[string_list(&["run", "unsupported-shell"])])
        .await?;
    let Some(Val::String(json)) = result else {
        anyhow::bail!("expected npm execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&json)?;
    assert_eq!(report["value"]["exitCode"], -38, "{report:#}");
    assert!(
        report["stderr"]
            .as_str()
            .is_some_and(|value| value.contains("spawnSync(sh) is not supported")),
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        !instance
            .temp_dir_path()
            .join("workspace/npm-run-result.json")
            .exists()
    );
    Ok(())
}

#[test]
async fn npm_exec_local_bin_reports_persistent_symlink_gap(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let ci = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(ci_json)) = ci else {
        anyhow::bail!("expected npm ci JSON result")
    };
    let ci_report: serde_json::Value = serde_json::from_str(&ci_json)?;
    assert_eq!(ci_report["value"]["exitCode"], 0, "{ci_report:#}");
    let bin_path = instance
        .temp_dir_path()
        .join("workspace/node_modules/.bin/fixture-bin");
    anyhow::ensure!(
        bin_path.exists(),
        "npm ci did not create the local package bin"
    );
    let direct = instance.invoke(None, "run-bin-direct", &[]).await?;
    let Some(Val::String(direct_json)) = direct else {
        anyhow::bail!("expected direct bin execution JSON result")
    };
    let direct_report: serde_json::Value = serde_json::from_str(&direct_json)?;
    assert_eq!(direct_report["value"]["code"], -38, "{direct_report:#}");
    assert_eq!(
        direct_report["value"]["events"],
        serde_json::json!(["error", "close"]),
        "{direct_report:#}"
    );
    assert!(
        direct_report["value"]["error"]
            .as_str()
            .is_some_and(|value| value.contains("ENOSYS:spawnSync(sh)")),
        "{direct_report:#}"
    );

    let execution = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "exec",
                "--offline",
                "--",
                "fixture-bin",
                "forwarded",
            ])],
        )
        .await?;
    let Some(Val::String(exec_json)) = execution else {
        anyhow::bail!("expected npm exec JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&exec_json)?;
    assert_eq!(report["value"]["exitCode"], -38, "{report:#}");
    assert!(
        report["stderr"]
            .as_str()
            .is_some_and(|value| value.contains("spawnSync(sh) is not supported")),
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    assert!(
        !instance
            .temp_dir_path()
            .join("workspace/npm-exec-result.json")
            .exists()
    );
    Ok(())
}

#[test]
async fn npx_local_bin_reports_persistent_symlink_gap(
    #[tagged_as("npm_compat")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let mut instance = prepare_instance(compiled, Some("local-install")).await?;
    let ci = instance
        .invoke(
            None,
            "run",
            &[string_list(&[
                "ci",
                "--ignore-scripts",
                "--no-audit",
                "--no-fund",
                "--install-links",
            ])],
        )
        .await?;
    let Some(Val::String(ci_json)) = ci else {
        anyhow::bail!("expected npm ci JSON result")
    };
    let ci_report: serde_json::Value = serde_json::from_str(&ci_json)?;
    assert_eq!(ci_report["value"]["exitCode"], 0, "{ci_report:#}");

    let execution = instance
        .invoke(
            None,
            "run-npx",
            &[string_list(&["--offline", "fixture-bin", "forwarded"])],
        )
        .await?;
    let Some(Val::String(npx_json)) = execution else {
        anyhow::bail!("expected npx execution JSON result")
    };
    let report: serde_json::Value = serde_json::from_str(&npx_json)?;
    assert_eq!(report["value"]["exitCode"], -38, "{report:#}");
    assert!(
        report["stderr"]
            .as_str()
            .is_some_and(|value| value.contains("spawnSync(sh) is not supported")),
        "{report:#}\n[npm debug logs]\n{}",
        npm_debug_logs(&instance)
    );
    Ok(())
}

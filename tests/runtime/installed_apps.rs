use crate::common::{
    CompiledTest, InstalledAppEntry, InstalledAppTestEntry, TestInstance, copy_dir_recursive,
    load_installed_apps_config,
};
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use std::fs;
use std::process::Command;
use std::sync::Arc;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::{test_dep, test_gen};
use wasmtime::component::Val;

const CONFIG_PATH: &str = "tests/installed_apps/config.jsonc";

#[test_dep(tagged_as = "installed_app_runner", scope = Cloneable)]
async fn compiled_installed_app_runner() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/installed-app-runner");
    CompiledTest::new_with_features(path, true, crate::common::FeatureCombination::FullNoLogging)
        .await
        .expect("Failed to compile installed-app-runner")
}

struct PreparedInstalledApp {
    _temp_dir: Utf8TempDir,
    app_dir: Utf8PathBuf,
}

fn prepare_installed_app(app_name: &str) -> anyhow::Result<PreparedInstalledApp> {
    let source_dir = Utf8Path::new("tests")
        .join("installed_apps")
        .join("apps")
        .join(app_name);
    let temp_dir = Utf8TempDir::new()?;
    let app_dir = temp_dir.path().join("app");

    copy_dir_recursive(source_dir.as_std_path(), app_dir.as_std_path())?;

    let status = Command::new("npm")
        .arg("install")
        .arg("--install-links")
        .arg("--ignore-scripts")
        .arg("--no-audit")
        .arg("--no-fund")
        .current_dir(&app_dir)
        .status()?;
    anyhow::ensure!(status.success(), "npm install failed for {app_name}");

    Ok(PreparedInstalledApp {
        _temp_dir: temp_dir,
        app_dir,
    })
}

fn ensure_node_supports_require_esm() -> anyhow::Result<()> {
    let output = Command::new("node")
        .arg("-p")
        .arg("process.versions.node")
        .output()?;
    anyhow::ensure!(
        output.status.success(),
        "failed to determine host Node.js version: {}",
        String::from_utf8_lossy(&output.stderr),
    );
    let version = String::from_utf8_lossy(&output.stdout);
    let mut parts = version.trim().split('.');
    let major = parts
        .next()
        .and_then(|part| part.parse::<u32>().ok())
        .unwrap_or(0);
    let minor = parts
        .next()
        .and_then(|part| part.parse::<u32>().ok())
        .unwrap_or(0);
    anyhow::ensure!(
        major > 22 || (major == 22 && minor >= 14),
        "installed-app Node baseline requires Node.js >= 22.14 for require(esm) and module-sync condition behavior; found {}",
        version.trim(),
    );
    Ok(())
}

fn verify_with_node(app: &PreparedInstalledApp, test_file: &str) -> anyhow::Result<()> {
    ensure_node_supports_require_esm()?;
    let output = Command::new("node")
        .arg("run-node.mjs")
        .arg(test_file)
        .current_dir(&app.app_dir)
        .output()?;
    anyhow::ensure!(
        output.status.success(),
        "Node baseline failed for {}:\n[stdout]\n{}\n[stderr]\n{}",
        test_file,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr),
    );
    Ok(())
}

async fn run_installed_app_test(
    compiled_test: &CompiledTest,
    app_name: &str,
    test_file: &str,
    timeout_secs: u64,
) -> anyhow::Result<()> {
    let app = prepare_installed_app(app_name)?;
    verify_with_node(&app, test_file)?;

    let mut instance = TestInstance::new(compiled_test.wasm_path()).await?;
    instance.set_epoch_deadline(timeout_secs);

    let mounted_app_dir = instance.temp_dir_path().join("app");
    fs::create_dir_all(&mounted_app_dir)?;
    copy_dir_recursive(app.app_dir.as_std_path(), mounted_app_dir.as_std_path())?;

    let guest_test_path = format!("/app/{test_file}");
    let (result, stdout, stderr) = instance
        .invoke_and_capture_output_with_stderr(None, "run-test", &[Val::String(guest_test_path)])
        .await;

    let result = result?;
    println!("Output:\n{}", stdout);
    if !stderr.trim().is_empty() {
        println!("Stderr:\n{}", stderr);
    }
    match result {
        Some(Val::String(s)) if s.starts_with("PASS:") => Ok(()),
        other => anyhow::bail!("Unexpected installed app result: {:?}", other),
    }
}

fn test_name(app: &InstalledAppEntry, test: &InstalledAppTestEntry) -> String {
    format!(
        "installed_app__{}__{}",
        sanitize_name(&app.name),
        sanitize_name(&test.file)
    )
}

fn sanitize_name(value: &str) -> String {
    value
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '_' })
        .collect()
}

#[test_gen]
fn gen_installed_app_tests(r: &mut DynamicTestRegistration) {
    let apps =
        load_installed_apps_config(CONFIG_PATH).expect("Failed to load installed app config");
    let dependency_name = "compiledtest_installed_app_runner".to_string();

    for app in apps {
        for test in app.tests.clone() {
            let app_name = app.name.clone();
            let test_file = test.file.clone();
            let timeout_secs = test.timeout_secs;
            let props = TestProperties {
                is_ignored: test.category.should_ignore_in_runner(),
                ..TestProperties::unit_test()
            };

            r.add_async_test(
                test_name(&app, &test),
                props,
                Some(vec![dependency_name.clone()]),
                move |deps| {
                    let compiled_test: Arc<CompiledTest> = deps
                        .get("compiledtest_installed_app_runner")
                        .expect("CompiledTest dependency not found")
                        .downcast::<CompiledTest>()
                        .expect("CompiledTest type mismatch");
                    let app_name = app_name.clone();
                    let test_file = test_file.clone();
                    Box::pin(async move {
                        run_installed_app_test(
                            compiled_test.as_ref(),
                            &app_name,
                            &test_file,
                            timeout_secs,
                        )
                        .await
                    })
                },
            );
        }
    }
}

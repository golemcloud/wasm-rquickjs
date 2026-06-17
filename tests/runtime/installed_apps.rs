use crate::common::{CompiledTest, TestInstance, copy_dir_recursive};
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::Utf8TempDir;
use std::fs;
use std::process::Command;
use test_r::{test, test_dep};
use wasmtime::component::Val;

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
) -> anyhow::Result<()> {
    let app = prepare_installed_app(app_name)?;
    verify_with_node(&app, test_file)?;

    let mut instance = TestInstance::new(compiled_test.wasm_path()).await?;
    instance.set_epoch_deadline(120);

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

#[test]
async fn installed_app_esm_imports_cjs(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "module-interop", "test-01-esm-import-cjs.js").await
}

#[test]
async fn installed_app_cjs_requires_esm(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-02-cjs-require-esm.cjs",
    )
    .await
}

#[test]
async fn installed_app_package_exports_imports(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-03-package-exports-imports.js",
    )
    .await
}

#[test]
async fn installed_app_require_esm_cycle(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-04-cycle-require-esm.cjs",
    )
    .await
}

#[test]
async fn installed_app_require_tla_esm(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "module-interop", "test-05-tla-require.cjs").await
}

#[test]
async fn installed_app_conditional_import_graph(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-06-conditional-import-graph.cjs",
    )
    .await
}

#[test]
async fn installed_app_conditional_import_no_false_positive(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-07-conditional-import-no-false-positive.cjs",
    )
    .await
}

#[test]
async fn installed_app_conditional_imports_alias_graph(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-08-conditional-imports-alias-graph.cjs",
    )
    .await
}

#[test]
async fn installed_app_create_require_alias_cycle(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-09-create-require-alias-cycle.cjs",
    )
    .await
}

#[test]
async fn installed_app_already_evaluated_dependency(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-10-already-evaluated-dependency.cjs",
    )
    .await
}

#[test]
async fn installed_app_module_sync_before_import_graph(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-11-module-sync-before-import-graph.cjs",
    )
    .await
}

#[test]
async fn installed_app_module_sync_before_imports_alias_graph(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-12-module-sync-before-imports-alias-graph.cjs",
    )
    .await
}

#[test]
async fn installed_app_scanner_false_positive_guards(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-13-scanner-false-positive-guards.cjs",
    )
    .await
}

#[test]
async fn installed_app_exports_patterns(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-14-exports-patterns.mjs",
    )
    .await
}

#[test]
async fn installed_app_imports_patterns(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "module-interop",
        "test-15-imports-patterns.cjs",
    )
    .await
}

#[test]
async fn installed_app_shim_patterns(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "module-interop", "test-16-shim-patterns.mjs").await
}

#[test]
async fn installed_app_popular_cjs_utilities(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "popular-pure-js",
        "test-01-cjs-utilities.cjs",
    )
    .await
}

#[test]
async fn installed_app_popular_modern_esm(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "popular-pure-js", "test-02-modern-esm.mjs").await
}

#[test]
async fn installed_app_popular_date_fns_subpaths(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "popular-pure-js",
        "test-03-date-fns-subpaths.mjs",
    )
    .await
}

#[test]
async fn installed_app_popular_dotenv_fs(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "popular-pure-js", "test-04-dotenv-fs.cjs").await
}

#[test]
async fn installed_app_popular_ajv(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "popular-pure-js", "test-05-ajv.cjs").await
}

#[test]
async fn installed_app_popular_rxjs(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "popular-pure-js", "test-06-rxjs.mjs").await
}

#[test]
async fn installed_app_http_axios(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "http-clients", "test-01-axios.cjs").await
}

#[test]
async fn installed_app_http_fetch_ky(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "http-clients", "test-02-fetch-ky.mjs").await
}

#[test]
async fn installed_app_http_graphql_request(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "http-clients", "test-03-graphql-request.mjs").await
}

#[test]
async fn installed_app_crypto_jsonwebtoken_bcrypt(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "crypto-auth",
        "test-01-jsonwebtoken-bcrypt.cjs",
    )
    .await
}

#[test]
async fn installed_app_crypto_jose(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "crypto-auth", "test-02-jose.mjs").await
}

#[test]
async fn installed_app_crypto_nanoid_cookie(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "crypto-auth", "test-03-nanoid-cookie.mjs").await
}

#[test]
async fn installed_app_data_csv(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "data-formats", "test-01-csv.cjs").await
}

#[test]
async fn installed_app_data_yaml_xml(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "data-formats", "test-02-yaml-xml.cjs").await
}

#[test]
async fn installed_app_data_binary_protobuf(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "data-formats", "test-03-binary-protobuf.cjs").await
}

#[test]
async fn installed_app_fs_config_parsers(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "fs-template-config",
        "test-01-config-parsers.cjs",
    )
    .await
}

#[test]
async fn installed_app_fs_template_engines(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "fs-template-config",
        "test-02-template-engines.cjs",
    )
    .await
}

#[test]
async fn installed_app_fs_fast_glob(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "fs-template-config",
        "test-03-fast-glob-fs.cjs",
    )
    .await
}

#[test]
async fn installed_app_validation_joi_yup(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "validation-schema", "test-01-joi-yup.cjs").await
}

#[test]
async fn installed_app_validation_superstruct_valibot(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "validation-schema",
        "test-02-superstruct-valibot.mjs",
    )
    .await
}

#[test]
async fn installed_app_logging_loggers(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "logging-observability",
        "test-01-loggers.cjs",
    )
    .await
}

#[test]
async fn installed_app_logging_consola_otel(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "logging-observability",
        "test-02-consola-otel.mjs",
    )
    .await
}

#[test]
async fn installed_app_cloud_openai(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "cloud-sdk-offline", "test-01-openai.mjs").await
}

#[test]
async fn installed_app_cloud_anthropic(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "cloud-sdk-offline", "test-02-anthropic.mjs").await
}

#[test]
async fn installed_app_cloud_aws_s3(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "cloud-sdk-offline", "test-03-aws-s3.mjs").await
}

#[test]
async fn installed_app_cloud_stripe(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "cloud-sdk-offline", "test-04-stripe.cjs").await
}

#[test]
async fn installed_app_db_sql_builders(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "db-clients-offline",
        "test-01-sql-builders.cjs",
    )
    .await
}

#[test]
async fn installed_app_db_pg_mysql(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "db-clients-offline", "test-02-pg-mysql.cjs").await
}

#[test]
async fn installed_app_db_mongodb_redis(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(
        compiled_test,
        "db-clients-offline",
        "test-03-mongodb-redis.mjs",
    )
    .await
}

#[test]
async fn installed_app_db_drizzle(
    #[tagged_as("installed_app_runner")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    run_installed_app_test(compiled_test, "db-clients-offline", "test-04-drizzle.mjs").await
}

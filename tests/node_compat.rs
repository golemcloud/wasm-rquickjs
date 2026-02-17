test_r::enable!();

use crate::common::{
    CompiledTest, PreparedComponent, TestInstance, setup_node_compat_test_files,
    strip_jsonc_comments,
};
use camino::Utf8Path;
use std::fs;
use std::sync::Arc;
use test_r::core::{DependencyView, DynamicTestRegistration, TestProperties};
use test_r::{test_dep, test_gen};
use wasmtime::component::Val;

#[allow(dead_code)]
#[path = "common/mod.rs"]
mod common;

#[test_dep]
fn prepare_node_compat() -> Arc<PreparedComponent> {
    let path = Utf8Path::new("examples/node-compat-runner");
    let compiled = CompiledTest::new(path, true).expect("Failed to compile node-compat-runner");
    Arc::new(PreparedComponent::new(compiled.wasm_path()).expect("Failed to prepare component"))
}

// --- Config loading ---

struct TestEntry {
    path: String,
    skip: bool,
}

fn load_config(path: &str) -> anyhow::Result<Vec<TestEntry>> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let tests_obj = value
        .get("tests")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("config.jsonc missing 'tests' object"))?;

    let mut tests = Vec::new();
    for (path, opts) in tests_obj {
        let skip = opts.get("skip").and_then(|v| v.as_bool()).unwrap_or(false);
        tests.push(TestEntry {
            path: path.clone(),
            skip,
        });
    }

    Ok(tests)
}

// --- Dynamic test generation ---

#[test_gen]
fn gen_node_compat_tests(r: &mut DynamicTestRegistration) {
    let entries = load_config("tests/node_compat/config.jsonc").expect("Failed to load config");

    for entry in entries {
        let path = entry.path.clone();
        let test_name = path
            .replace('/', "__")
            .replace('.', "_")
            .replace('-', "_");

        let props = TestProperties {
            is_ignored: entry.skip,
            ..TestProperties::unit_test()
        };

        r.add_async_test(test_name, props, move |deps| {
            let prepared: Arc<Arc<PreparedComponent>> = deps
                .get("arc_preparedcomponent")
                .expect("PreparedComponent dependency not found")
                .downcast::<Arc<PreparedComponent>>()
                .expect("PreparedComponent type mismatch");
            let path = path.clone();
            Box::pin(async move {
                let mut instance = TestInstance::from_prepared(&prepared).await?;
                setup_node_compat_test_files(instance.temp_dir_path(), &path)?;

                let guest_path = format!("/tests/{}", path);
                let (result, stdout, stderr) = instance
                    .invoke_and_capture_output_with_stderr(
                        None,
                        "run-test",
                        &[Val::String(guest_path)],
                    )
                    .await;

                match result {
                    Ok(Some(Val::String(ref s))) if s.starts_with("PASS") => Ok(()),
                    Ok(Some(Val::String(ref s))) if s.starts_with("SKIP:") => Ok(()),
                    Ok(Some(Val::String(ref s))) => {
                        anyhow::bail!(
                            "Test failed: {}\n[stdout]\n{}\n[stderr]\n{}",
                            s,
                            stdout.trim(),
                            stderr.trim()
                        )
                    }
                    Ok(other) => {
                        anyhow::bail!(
                            "Unexpected return: {:?}\n[stdout]\n{}\n[stderr]\n{}",
                            other,
                            stdout.trim(),
                            stderr.trim()
                        )
                    }
                    Err(e) => {
                        anyhow::bail!(
                            "Invocation error: {}\n[stdout]\n{}\n[stderr]\n{}",
                            e,
                            stdout.trim(),
                            stderr.trim()
                        )
                    }
                }
            })
        });
    }
}

use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;

use camino_tempfile::Utf8TempDir;

#[derive(Debug)]
struct Plan {
    values: HashMap<String, String>,
    command_args: Vec<String>,
}

fn plan(target: &str, profile: &str) -> Plan {
    let repo_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let output = Command::new("bash")
        .arg(repo_root.join("tools/dev-test.sh"))
        .args([target, profile, "runtime", "profile_probe"])
        .env("WASM_RQUICKJS_DEV_TEST_PLAN_ONLY", "1")
        .output()
        .expect("dev-test profile planning should run");

    assert!(
        output.status.success(),
        "profile planning failed:\n{}",
        String::from_utf8_lossy(&output.stderr)
    );

    let mut values = HashMap::new();
    let mut command_args = Vec::new();
    for line in String::from_utf8(output.stdout)
        .expect("profile plan should be UTF-8")
        .lines()
    {
        let (key, value) = line
            .split_once('=')
            .expect("profile plan lines should be key=value");
        if key == "command_arg" {
            command_args.push(value.to_string());
        } else {
            values.insert(key.to_string(), value.to_string());
        }
    }

    Plan {
        values,
        command_args,
    }
}

fn value<'a>(plan: &'a Plan, key: &str) -> &'a str {
    plan.values
        .get(key)
        .unwrap_or_else(|| panic!("missing {key} in {plan:?}"))
}

fn feature_list(plan: &Plan) -> Vec<&str> {
    value(plan, "features")
        .split(',')
        .filter(|feature| !feature.is_empty())
        .collect()
}

fn assert_common_fast_profile(plan: &Plan, expected_target: &str) {
    assert_eq!(value(plan, "artifact_cache"), "1");
    assert_eq!(value(plan, "locked_builds"), "1");
    assert_eq!(value(plan, "wasmtime_cache"), "1");
    assert_eq!(value(plan, "test_target"), expected_target);
    assert!(plan.command_args.iter().any(|arg| arg == "--locked"));
    assert!(plan.command_args.iter().any(|arg| arg == "--report-time"));
}

#[test]
fn dev_test_profile_matrix_preserves_standard_and_fast_semantics() {
    for target in ["p2", "p3"] {
        let standard = plan(target, "standard");
        let expected_standard_features = if target == "p2" {
            vec!["use-golem-wasmtime"]
        } else {
            Vec::new()
        };
        assert_eq!(feature_list(&standard), expected_standard_features);
        assert_eq!(value(&standard, "artifact_cache"), "0");
        assert_eq!(value(&standard, "locked_builds"), "0");
        assert_eq!(value(&standard, "precompile_component"), "0");
        assert_eq!(value(&standard, "prepared_component_cache"), "0");
        assert_eq!(value(&standard, "unoptimized"), "0");
        assert_eq!(value(&standard, "wasmtime_cache"), "0");
        assert!(!standard.command_args.iter().any(|arg| arg == "--locked"));
        assert!(
            !standard
                .command_args
                .iter()
                .any(|arg| arg == "--test-threads")
        );

        let fast_start = plan(target, "fast-start");
        let mut expected_fast_features = vec!["wasm-rquickjs/external-skeleton"];
        if target == "p2" {
            expected_fast_features.insert(0, "use-golem-wasmtime");
        }
        assert_eq!(feature_list(&fast_start), expected_fast_features);
        assert_common_fast_profile(&fast_start, target);
        assert_eq!(value(&fast_start, "unoptimized"), "1");
        assert_eq!(value(&fast_start, "precompile_component"), "0");
        assert_eq!(value(&fast_start, "prepared_component_cache"), "0");
        assert!(
            fast_start
                .command_args
                .windows(2)
                .any(|args| args == ["--test-threads", "1"])
        );

        let fast_run = plan(target, "fast-run");
        assert_eq!(feature_list(&fast_run), expected_fast_features);
        assert_common_fast_profile(&fast_run, target);
        assert_eq!(value(&fast_run, "unoptimized"), "0");
        assert_eq!(value(&fast_run, "precompile_component"), "1");
        assert_eq!(value(&fast_run, "prepared_component_cache"), "1");
        assert!(
            fast_run
                .command_args
                .windows(2)
                .any(|args| args == ["--test-threads", "8"])
        );
    }
}

#[test]
fn wasmtime_fork_transform_supports_copied_manifests_and_new_patch_crates() {
    let repo_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let temp = Utf8TempDir::new().expect("temporary directory should be created");
    let source = temp.path().join("source.toml");
    let output = temp.path().join("output.toml");
    let branch = "golem-wasmtime-v46.0.1-p3";
    fs::write(
        &source,
        format!(
            "[workspace]\n\
             #[patch.crates-io]\n\
             #wasmtime = {{ git = \"https://github.com/golemcloud/wasmtime.git\", branch = \"{branch}\" }}\n\
             #wasmtime-component-util = {{ git = \"https://github.com/golemcloud/wasmtime.git\", branch = \"{branch}\" }}\n"
        ),
    )
    .expect("source manifest should be written");

    let result = Command::new("bash")
        .arg(repo_root.join(".github/scripts/enable-wasmtime-fork.sh"))
        .arg(&source)
        .arg(&output)
        .output()
        .expect("Wasmtime fork transform should run");
    assert!(
        result.status.success(),
        "transform failed:\n{}",
        String::from_utf8_lossy(&result.stderr)
    );

    let source_after = fs::read_to_string(&source).expect("source manifest should remain");
    let output = fs::read_to_string(&output).expect("output manifest should exist");
    assert!(source_after.contains("#[patch.crates-io]"));
    assert!(output.contains("[patch.crates-io]"));
    assert!(output.contains("wasmtime = { git = "));
    assert!(output.contains("wasmtime-component-util = { git = "));
    assert!(!output.contains("#wasmtime"));
}

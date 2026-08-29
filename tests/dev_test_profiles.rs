use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

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

#[cfg(unix)]
fn skeleton_clippy_fixture() -> (Utf8TempDir, std::path::PathBuf, std::path::PathBuf) {
    let repo_root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let source_tests = fs::canonicalize(repo_root.join("tests"))
        .expect("source tests directory should be available");
    let source_root = source_tests
        .parent()
        .expect("source tests directory should have a repository parent");
    let helper = source_root.join("tools/check-skeleton-clippy.sh");
    let temp = Utf8TempDir::new().expect("temporary directory should be created");
    let tools_dir = temp.path().join("tools");
    let skeleton_dir = temp.path().join("crates/wasm-rquickjs/skeleton");
    fs::create_dir_all(&tools_dir).expect("fixture tools directory should be created");
    fs::create_dir_all(&skeleton_dir).expect("fixture skeleton directory should be created");
    fs::copy(helper, tools_dir.join("check-skeleton-clippy.sh"))
        .expect("Clippy helper should be copied");
    fs::write(skeleton_dir.join("Cargo.toml_"), "[workspace]\n")
        .expect("stored fixture manifest should be written");
    fs::write(skeleton_dir.join("Cargo.lock"), "# fixture lockfile\n")
        .expect("fixture lockfile should be written");
    fs::create_dir_all(skeleton_dir.join("src"))
        .expect("fixture source directory should be created");
    fs::write(skeleton_dir.join("src/lib.rs"), "mod builtin;\n")
        .expect("fixture lib.rs should be written");
    fs::write(skeleton_dir.join("src/builtin_p3.rs"), "")
        .expect("fixture P3 registry should be written");

    let fake_cargo = temp.path().join("fake-cargo.sh");
    fs::write(
        &fake_cargo,
        "#!/usr/bin/env bash\nset -euo pipefail\nmkdir -p \"$FAKE_SKELETON_TARGET\"\nprintf '%s\\n' \"$*\" >> \"$FAKE_CARGO_LOG\"\ncall=$(wc -l < \"$FAKE_CARGO_LOG\")\nif [[ -n \"${FAKE_CARGO_EXIT:-}\" && \"$call\" -eq \"${FAKE_CARGO_FAIL_ON_CALL:-1}\" ]]; then\n    exit \"$FAKE_CARGO_EXIT\"\nfi\n",
    )
    .expect("fake Cargo should be written");
    let mut permissions = fs::metadata(&fake_cargo)
        .expect("fake Cargo metadata should exist")
        .permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(&fake_cargo, permissions).expect("fake Cargo should be executable");

    (temp, skeleton_dir.into(), fake_cargo.into())
}

#[cfg(unix)]
#[test]
fn skeleton_clippy_helper_covers_the_supported_feature_matrix_and_cleans_up() {
    let (temp, skeleton_dir, fake_cargo) = skeleton_clippy_fixture();
    let log = temp.path().join("cargo.log");
    let output = Command::new("bash")
        .arg(temp.path().join("tools/check-skeleton-clippy.sh"))
        .env("CARGO", &fake_cargo)
        .env("FAKE_CARGO_LOG", &log)
        .env("FAKE_SKELETON_TARGET", skeleton_dir.join("target"))
        .output()
        .expect("Clippy helper should run");

    assert!(
        output.status.success(),
        "Clippy helper failed:\n{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(skeleton_dir.join("Cargo.toml_").is_file());
    assert!(!skeleton_dir.join("Cargo.toml").exists());
    assert!(!skeleton_dir.join("target").exists());

    let invocations = fs::read_to_string(log).expect("fake Cargo log should exist");
    let invocations = invocations.lines().collect::<Vec<_>>();
    assert_eq!(invocations.len(), 4);
    assert!(invocations.iter().all(|args| {
        args.contains("--locked")
            && args.contains("--target wasm32-wasip2")
            && args.contains("--all-targets")
            && args.contains("-Dwarnings")
    }));
    assert!(invocations[0].contains("clippy --manifest-path"));
    assert!(invocations[1].contains("--features full,golem,typescript-compiler-profiling"));
    assert!(invocations[2].contains("--features normal-p3"));
    assert!(invocations[3].contains("--features full-p3,golem,typescript-compiler-profiling"));
}

#[cfg(unix)]
#[test]
fn skeleton_clippy_helper_restores_the_manifest_after_a_lint_failure() {
    let (temp, skeleton_dir, fake_cargo) = skeleton_clippy_fixture();
    let log = temp.path().join("cargo.log");
    let output = Command::new("bash")
        .arg(temp.path().join("tools/check-skeleton-clippy.sh"))
        .env("CARGO", &fake_cargo)
        .env("FAKE_CARGO_EXIT", "23")
        .env("FAKE_CARGO_LOG", &log)
        .env("FAKE_SKELETON_TARGET", skeleton_dir.join("target"))
        .output()
        .expect("Clippy helper should run");

    assert_eq!(output.status.code(), Some(23));
    assert!(skeleton_dir.join("Cargo.toml_").is_file());
    assert!(!skeleton_dir.join("Cargo.toml").exists());
    assert!(!skeleton_dir.join("target").exists());
    assert_eq!(
        fs::read_to_string(log)
            .expect("fake Cargo log should exist")
            .lines()
            .count(),
        1
    );
}

#[cfg(unix)]
#[test]
fn skeleton_clippy_helper_restores_the_manifest_before_late_failure_cleanup() {
    let (temp, skeleton_dir, fake_cargo) = skeleton_clippy_fixture();
    let log = temp.path().join("cargo.log");
    let cleanup_log = temp.path().join("cleanup.log");
    let fake_bin = temp.path().join("fake-bin");
    fs::create_dir(&fake_bin).expect("fake binary directory should be created");
    let fake_rm = fake_bin.join("rm");
    fs::write(
        &fake_rm,
        "#!/usr/bin/env bash\nset -euo pipefail\nif [[ ! -f \"$FAKE_STORED_MANIFEST\" || -e \"$FAKE_LIVE_MANIFEST\" ]]; then\n    exit 41\nfi\nprintf 'manifest-restored %s\\n' \"$*\" >> \"$FAKE_CLEANUP_LOG\"\nexec /bin/rm \"$@\"\n",
    )
    .expect("fake rm should be written");
    let mut permissions = fs::metadata(&fake_rm)
        .expect("fake rm metadata should exist")
        .permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(&fake_rm, permissions).expect("fake rm should be executable");

    let path = format!(
        "{}:{}",
        fake_bin,
        std::env::var("PATH").expect("PATH should be set")
    );
    let output = Command::new("bash")
        .arg(temp.path().join("tools/check-skeleton-clippy.sh"))
        .env("PATH", path)
        .env("CARGO", &fake_cargo)
        .env("FAKE_CARGO_EXIT", "23")
        .env("FAKE_CARGO_FAIL_ON_CALL", "4")
        .env("FAKE_CARGO_LOG", &log)
        .env("FAKE_CLEANUP_LOG", &cleanup_log)
        .env("FAKE_LIVE_MANIFEST", skeleton_dir.join("Cargo.toml"))
        .env("FAKE_STORED_MANIFEST", skeleton_dir.join("Cargo.toml_"))
        .env("FAKE_SKELETON_TARGET", skeleton_dir.join("target"))
        .output()
        .expect("Clippy helper should run");

    assert_eq!(output.status.code(), Some(23));
    assert!(skeleton_dir.join("Cargo.toml_").is_file());
    assert!(!skeleton_dir.join("Cargo.toml").exists());
    assert!(!skeleton_dir.join("target").exists());
    assert_eq!(
        fs::read_to_string(log)
            .expect("fake Cargo log should exist")
            .lines()
            .count(),
        4
    );
    assert_eq!(
        fs::read_to_string(cleanup_log)
            .expect("cleanup log should exist")
            .lines()
            .count(),
        2
    );
}

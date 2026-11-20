test_r::enable!();

use crate::common::{FeatureCombination, collect_example_paths, use_local_golem_websocket};
use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use std::process::Command;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::{add_test, test, test_gen};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};

#[allow(dead_code)]
mod common;

/// The default library entry point (`generate_wrapper_crate`, used by Golem's generic
/// `generateQuickjsCrate`) emits a WASI Preview 3 crate that resolves from its lockfile.
#[test]
fn default_generation_emits_locked_p3_crate() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let wit = temp.path().join("wit");
    std::fs::create_dir(&wit)?;
    std::fs::write(
        wit.join("test.wit"),
        "package test:locked-bridge; world test { export run: func(); }",
    )?;
    let js = temp.path().join("module.js");
    std::fs::write(&js, "export function run() {}")?;
    let output = temp.path().join("out");
    generate_wrapper_crate(
        &wit,
        &[JsModuleSpec {
            name: "module".to_string(),
            mode: EmbeddingMode::EmbedFile(js),
        }],
        &output,
        None,
    )?;

    let manifest = std::fs::read_to_string(output.join("Cargo.toml"))?;
    assert!(
        manifest.contains("default = [\"p3\", \"normal-p3\"]"),
        "default generation must select the P3 feature tier:\n{manifest}"
    );
    assert!(manifest.contains("wit-bindgen-p3 = "), "{manifest}");
    let lib = std::fs::read_to_string(output.join("src/lib.rs"))?;
    assert!(
        lib.contains("async fn wizer_initialize()"),
        "default generation must emit the async P3 Wizer export:\n{lib}"
    );

    use_local_golem_websocket(&output)?;
    let fetch = Command::new("cargo")
        .args(["fetch", "--locked"])
        .current_dir(&output)
        .status()?;
    assert!(fetch.success(), "failed to fetch locked dependencies");
    let metadata = Command::new("cargo")
        .args([
            "metadata",
            "--locked",
            "--offline",
            "--format-version",
            "1",
            "--features",
            "websocket",
        ])
        .current_dir(&output)
        .output()?;
    assert!(
        metadata.status.success(),
        "{}",
        String::from_utf8_lossy(&metadata.stderr)
    );
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)?;
    let packages = metadata["packages"]
        .as_array()
        .expect("cargo metadata lists packages")
        .iter()
        .filter_map(|package| package["name"].as_str())
        .collect::<Vec<_>>();
    assert!(packages.contains(&"wasip3"), "{packages:?}");
    for removed in ["wstd", "golem-wasi-http"] {
        assert!(
            !packages.contains(&removed),
            "removed Preview 2 runtime crate {removed} is still locked: {packages:?}"
        );
    }
    Ok(())
}

/// Golem's SDK template scripts pass `--target wasi-p3` explicitly; the CLI keeps accepting it and
/// rejects the removed `wasi-p2` target instead of silently generating something else.
#[test]
fn cli_generation_accepts_explicit_wasi_p3() -> anyhow::Result<()> {
    let temp = Utf8TempDir::new()?;
    let wit = temp.path().join("wit");
    std::fs::create_dir(&wit)?;
    std::fs::write(
        wit.join("test.wit"),
        "package test:cli-target; world test { export run: func(); }",
    )?;
    let js = temp.path().join("module.js");
    std::fs::write(&js, "export function run() {}")?;

    let generate = |target: &str, output: &Utf8Path| {
        Command::new(env!("CARGO_BIN_EXE_wasm-rquickjs"))
            .args(["generate-wrapper-crate", "--target", target, "--js"])
            .arg(js.as_str())
            .args(["--wit", wit.as_str(), "--output", output.as_str()])
            .output()
    };

    let output = temp.path().join("p3");
    let result = generate("wasi-p3", &output)?;
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let manifest = std::fs::read_to_string(output.join("Cargo.toml"))?;
    assert!(
        manifest.contains("default = [\"p3\", \"normal-p3\"]"),
        "{manifest}"
    );
    let lib = std::fs::read_to_string(output.join("src/lib.rs"))?;
    assert!(lib.contains("async fn wizer_initialize()"), "{lib}");

    let removed = temp.path().join("p2");
    let result = generate("wasi-p2", &removed)?;
    assert!(
        !result.status.success(),
        "the removed wasi-p2 target was accepted"
    );
    let stderr = String::from_utf8_lossy(&result.stderr);
    assert!(
        stderr.contains("invalid value 'wasi-p2'"),
        "unexpected rejection: {stderr}"
    );
    assert!(!removed.join("Cargo.toml").exists());
    Ok(())
}

#[test_gen]
fn gen_compilation_tests(r: &mut DynamicTestRegistration) {
    for example_path in collect_example_paths(&["examples/compilation"]).unwrap() {
        for feature_combination in FeatureCombination::all() {
            let example_path_clone = example_path.clone();
            let example_name = example_path.file_name().unwrap().to_string();
            let label = feature_combination.label();

            add_test!(
                r,
                format!("{example_name}_{label}"),
                TestProperties {
                    ..TestProperties::unit_test()
                },
                || {
                    let example_name = example_name.clone();
                    let example_path_clone = example_path_clone.clone();
                    compilation_test(&example_name, &example_path_clone, feature_combination)
                }
            );
        }
    }
}

fn compilation_test(
    name: &str,
    path: &Utf8Path,
    feature_combination: FeatureCombination,
) -> anyhow::Result<()> {
    let wrapper_crate_root = Utf8Path::new("tmp")
        .join(name)
        .join(feature_combination.label());

    // shared_target is relative to wrapper_crate_root
    let share_target_dir = name != "pollable"; // <- exclude shared target dir for some examples

    let shared_target = Utf8Path::new("..").join("..").join("target");

    println!("Generating wrapper create for example '{name}' to {wrapper_crate_root}");
    generate_wrapper_crate(
        &path.join("wit"),
        &[JsModuleSpec {
            name: name.to_string(),
            mode: EmbeddingMode::EmbedFile(path.join("src").join(format!("{name}.js"))),
        }],
        &wrapper_crate_root,
        None,
    )?;
    use_local_golem_websocket(&wrapper_crate_root)?;

    println!("Compiling wrapper crate in {wrapper_crate_root}");
    let mut cmd = Command::new("cargo");
    cmd.arg("build").arg("--target").arg("wasm32-wasip2");
    if share_target_dir {
        cmd.arg("--target-dir").arg(shared_target);
    }
    let status = cmd
        .args(feature_combination.cargo_args())
        .current_dir(&wrapper_crate_root)
        .status()?;

    assert!(status.success());

    Ok(())
}

test_r::enable!();

use crate::common::{FeatureCombination, collect_example_paths, use_local_golem_websocket};
use camino::Utf8Path;
use camino_tempfile::Utf8TempDir;
use std::process::Command;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::{add_test, test, test_gen};
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate,
    generate_wrapper_crate_with_target,
};

#[allow(dead_code)]
mod common;

#[test]
fn local_websocket_bridge_supports_locked_resolution() -> anyhow::Result<()> {
    for target in [GenerationTarget::WasiP2, GenerationTarget::WasiP3] {
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
        generate_wrapper_crate_with_target(
            &wit,
            &[JsModuleSpec {
                name: "module".to_string(),
                mode: EmbeddingMode::EmbedFile(js),
            }],
            &output,
            None,
            target,
        )?;
        use_local_golem_websocket(&output)?;
        let fetch = Command::new("cargo")
            .args(["fetch", "--locked"])
            .current_dir(&output)
            .status()?;
        assert!(
            fetch.success(),
            "{target:?}: failed to fetch locked dependencies"
        );
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
            "{target:?}: {}",
            String::from_utf8_lossy(&metadata.stderr)
        );
    }
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

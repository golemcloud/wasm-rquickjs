test_r::enable!();

use crate::common::{FeatureCombination, collect_example_paths};
use camino::Utf8Path;
use std::process::Command;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::test_gen;
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec, generate_wrapper_crate};

#[allow(dead_code)]
mod common;

#[test_gen]
fn gen_compilation_tests(r: &mut DynamicTestRegistration) {
    for example_path in collect_example_paths().unwrap() {
        for feature_combination in FeatureCombination::all() {
            let example_path_clone = example_path.clone();
            let example_name = example_path.file_name().unwrap().to_string();
            let label = feature_combination.label();

            r.add_sync_test(
                format!("{example_name}_{label}"),
                TestProperties {
                    ..TestProperties::unit_test()
                },
                move |_deps| {
                    let example_name = example_name.clone();
                    let example_path_clone = example_path_clone.clone();
                    let gen_fn = move || {
                        compilation_test(&example_name, &example_path_clone, feature_combination)
                    };
                    gen_fn()
                },
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

    println!("Compiling wrapper crate in {wrapper_crate_root}");
    let mut cmd = Command::new("cargo-component");
    cmd.arg("build");
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

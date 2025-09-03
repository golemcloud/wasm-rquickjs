test_r::enable!();

use crate::common::collect_example_paths;
use camino::{Utf8Path, Utf8PathBuf};
use goldenfile::Mint;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::test_gen;
use wasm_rquickjs::generate_dts;

#[allow(dead_code)]
mod common;

#[test_gen]
fn gen_dts_tests(r: &mut DynamicTestRegistration) {
    for example_path in collect_example_paths().unwrap() {
        let example_path_clone = example_path.clone();
        let example_name = example_path.file_name().unwrap().to_string();

        r.add_sync_test(
            example_name.clone(),
            TestProperties {
                ..TestProperties::unit_test()
            },
            move |_deps| {
                let mut mint = Mint::new("tests/goldenfiles");

                let example_name = example_name.clone();
                let example_path_clone = example_path_clone.clone();
                let dts_paths = dts_test(&example_name, &example_path_clone)?;

                for dts_path in dts_paths {
                    let file_name = dts_path
                        .file_name()
                        .unwrap()
                        .strip_suffix(".d.ts")
                        .unwrap()
                        .to_string();
                    assert_types_match_goldenfile(&example_name, &file_name, &mut mint, dts_path)?;
                }

                Ok::<_, anyhow::Error>(())
            },
        );
    }
}

fn dts_test(name: &str, path: &Utf8Path) -> anyhow::Result<Vec<Utf8PathBuf>> {
    let target = Utf8Path::new("tmp").join(name).join("dts");

    println!("Generating d.ts for example '{name}' to {target}");
    generate_dts(&path.join("wit"), &target, None)
}

fn assert_types_match_goldenfile(
    example_name: &str,
    file_name: &str,
    mint: &mut Mint,
    generated_types: Utf8PathBuf,
) -> anyhow::Result<()> {
    let differ = Box::new(goldenfile::differs::text_diff);

    let path = mint.new_goldenpath_with_differ(
        format!("generated_types_{example_name}_{file_name}.d.ts"),
        differ,
    )?;

    std::fs::copy(generated_types, path)?;
    Ok(())
}

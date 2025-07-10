test_r::enable!();

use crate::common::collect_example_paths;
use camino::Utf8Path;
use test_r::core::{DynamicTestRegistration, TestProperties};
use test_r::test_gen;
use wasm_rquickjs::generate_dts;

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
                let example_name = example_name.clone();
                let example_path_clone = example_path_clone.clone();
                let gen_fn = move || dts_test(&example_name, &example_path_clone);
                gen_fn()
            },
        );
    }
}

fn dts_test(name: &str, path: &Utf8Path) -> anyhow::Result<()> {
    let target = Utf8Path::new("tmp").join(name).join("dts");

    println!("Generating d.ts for example '{name}' to {target}");
    generate_dts(&path.join("wit"), &target, None)?;

    Ok(())
}

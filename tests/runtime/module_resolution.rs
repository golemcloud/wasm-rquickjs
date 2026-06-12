use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "module_resolution", scope = Cloneable)]
async fn compiled_module_resolution() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/module-resolution");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile module_resolution")
}

#[test]
async fn esm_package_map_edge_cases(
    #[tagged_as("module_resolution")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-esm-package-map-edge-cases",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "export_from_inner_package")]
fn compiled_export_from_inner_package() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/export-from-inner-package");
    CompiledTest::new(path, true).expect("Failed to compile export_from_inner_package")
}

#[test]
async fn export_from_inner_package(
    #[tagged_as("export_from_inner_package")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("quickjs:inner/exp1@0.0.1"),
        "hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world!".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

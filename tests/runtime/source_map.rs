use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "source_map", scope = Cloneable)]
async fn compiled_source_map() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/source-map");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile source-map")
}

#[test]
async fn source_map_api(
    #[tagged_as("source_map")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-source-map-api", &[])
            .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

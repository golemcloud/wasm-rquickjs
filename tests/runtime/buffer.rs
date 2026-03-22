use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "buffer_utils")]
async fn compiled_buffer_utils() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/buffer-utils");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile buffer_utils")
}

#[test]
async fn buffer_test_is_ascii(
    #[tagged_as("buffer_utils")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-is-ascii", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn buffer_test_is_utf8(
    #[tagged_as("buffer_utils")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-is-utf8", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

use crate::common::{CompiledTest, invoke_and_capture_output};
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("buffer_utils")]
    CompiledTest
);

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

use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "example1")]
fn compiled_example1() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/example1");
    CompiledTest::new(path, true).expect("Failed to compile example1")
}

#[test]
async fn example1_sync(#[tagged_as("example1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world! (123)".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

#[test]
async fn example1_async(#[tagged_as("example1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "async-hello",
        &[Val::String("world".to_string())],
    )
    .await;
    let result = result?;

    assert_eq!(result, Some(Val::String("Hello, world! (123)".to_string())));
    assert_eq!(output, "hello called with world\n");

    Ok(())
}

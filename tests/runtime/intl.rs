use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "intl")]
fn compiled_intl() -> CompiledTest {
    let path = Utf8Path::new("examples/intl");
    CompiledTest::new(path, false).expect("Failed to compile intl")
}

#[test]
async fn intl_test1(#[tagged_as("intl")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test1", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn intl_test2(#[tagged_as("intl")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test2", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn intl_test3(#[tagged_as("intl")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test3", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn intl_test4(#[tagged_as("intl")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test4", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

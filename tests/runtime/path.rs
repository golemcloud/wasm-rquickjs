use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "path")]
fn compiled_path() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/path");
    CompiledTest::new(path, true).expect("Failed to compile path")
}

#[test]
async fn path_test_basename(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-basename", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_dirname(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-dirname", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_extname(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-extname", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_is_absolute(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-is-absolute", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_join(#[tagged_as("path")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-join", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_normalize(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-normalize", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_relative(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-relative", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_resolve(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-resolve", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_parse_format(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-parse-format", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_delimiter(
    #[tagged_as("path")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-delimiter", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn path_test_sep(#[tagged_as("path")] compiled_test: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-sep", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

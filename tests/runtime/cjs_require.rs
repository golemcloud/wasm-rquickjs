use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "cjs_require")]
fn compiled_cjs_require() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/cjs-require");
    CompiledTest::new(path, true).expect("Failed to compile cjs_require")
}

#[test]
async fn cjs_require_builtin(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-require-builtin", &[])
            .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_relative(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-require-relative",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_directory(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-require-directory",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_circular(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-require-circular",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_cache(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-require-cache", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_create_require(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-create-require", &[])
            .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_json(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled_test.wasm_path(), None, "test-require-json", &[]).await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_module_exports_function(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-require-module-exports-function",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn cjs_require_module_not_found(
    #[tagged_as("cjs_require")] compiled_test: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled_test.wasm_path(),
        None,
        "test-require-module-not-found",
        &[],
    )
    .await;
    let r = r?;
    println!("Output:\n{}", output);
    assert_eq!(r, Some(Val::Bool(true)));
    Ok(())
}

use crate::common::{CompiledTest, TestInstance};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "glob", scope = Cloneable)]
async fn compiled_glob() -> CompiledTest {
    CompiledTest::new(Utf8Path::new("examples/runtime/glob"), true)
        .await
        .expect("Failed to compile glob")
}

async fn check(compiled: &CompiledTest, export: &str) -> anyhow::Result<()> {
    let mut instance = TestInstance::new(compiled.wasm_path()).await?;
    let (result, _, _) = instance
        .invoke_and_capture_output_with_stderr(None, export, &[])
        .await;
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn glob_matcher_contract(#[tagged_as("glob")] compiled: &CompiledTest) -> anyhow::Result<()> {
    check(compiled, "matcher-contract").await
}

#[test]
async fn glob_sync_contract(#[tagged_as("glob")] compiled: &CompiledTest) -> anyhow::Result<()> {
    check(compiled, "sync-contract").await
}

#[test]
async fn glob_callback_contract(
    #[tagged_as("glob")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check(compiled, "callback-contract").await
}

#[test]
async fn glob_iterator_contract(
    #[tagged_as("glob")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check(compiled, "iterator-contract").await
}

#[test]
async fn glob_exclusion_contract(
    #[tagged_as("glob")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    check(compiled, "exclusion-contract").await
}

#[test]
async fn glob_symlink_contract(#[tagged_as("glob")] compiled: &CompiledTest) -> anyhow::Result<()> {
    check(compiled, "symlink-contract").await
}

use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("pollable")]
    CompiledTest
);

#[test]
async fn await_pollable(#[tagged_as("pollable")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, _) = invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let result = r?;

    let Some(Val::U64(n)) = result else {
        return Err(anyhow!("Expected a u64 result"));
    };
    assert!(n > 2000000000);
    Ok(())
}

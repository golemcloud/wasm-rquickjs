use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "pollable")]
fn compiled_pollable() -> CompiledTest {
    let path = Utf8Path::new("examples/pollable");
    CompiledTest::new(path, true).expect("Failed to compile pollable")
}

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

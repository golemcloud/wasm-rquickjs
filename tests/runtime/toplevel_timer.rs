use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "toplevel_timer")]
async fn compiled_toplevel_timer() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/toplevel-timer");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile toplevel-timer")
}

#[test]
async fn toplevel_timer_no_reentrant_block_on(
    #[tagged_as("toplevel_timer")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let result = result?;

    match &result {
        Some(Val::String(s)) => assert!(s.starts_with("PASS"), "Expected PASS but got: {s}"),
        other => panic!("Expected Some(Val::String(PASS...)) but got: {other:?}"),
    }
    assert!(output.is_empty(), "Unexpected output: {output}");

    Ok(())
}

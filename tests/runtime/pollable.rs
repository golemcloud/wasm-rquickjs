use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "pollable")]
async fn compiled_pollable() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/pollable");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile pollable")
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

#[test]
async fn abortable_promise_already_aborted(
    #[tagged_as("pollable")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-abortable-already-aborted",
        &[],
    )
    .await;

    assert!(
        output.contains("caught: already aborted"),
        "Expected abort reason in output: {output}"
    );
    assert!(
        output.contains("fast: true"),
        "Expected fast rejection: {output}"
    );
    assert!(!output.contains("ERROR"), "Should have thrown: {output}");
    Ok(())
}

#[test]
async fn abortable_promise_not_aborted(
    #[tagged_as("pollable")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-abortable-not-aborted",
        &[],
    )
    .await;

    assert!(
        output.contains("resolved: true"),
        "Expected normal resolution: {output}"
    );
    Ok(())
}

#[test]
async fn abortable_promise_mid_wait(
    #[tagged_as("pollable")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abortable-mid-wait", &[]).await;

    assert!(
        output.contains("caught: timeout abort"),
        "Expected abort reason in output: {output}"
    );
    assert!(
        output.contains("fast: true"),
        "Expected fast abort: {output}"
    );
    assert!(!output.contains("ERROR"), "Should have thrown: {output}");
    Ok(())
}

#[test]
async fn abortable_promise_race(
    #[tagged_as("pollable")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abortable-race", &[]).await;

    assert!(
        output.contains("winner: fast"),
        "Expected fast winner: {output}"
    );
    assert!(
        output.contains("fast: true"),
        "Expected fast completion: {output}"
    );
    Ok(())
}

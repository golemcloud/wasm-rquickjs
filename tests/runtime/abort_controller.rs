use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "abort_controller")]
fn compiled_abort_controller() -> CompiledTest {
    let path = Utf8Path::new("examples/abort-controller");
    CompiledTest::new(path, true).expect("Failed to compile abort_controller")
}

#[test]
async fn abort_controller_basic(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-basic", &[]).await;

    assert!(output.contains("Created AbortController"));
    assert!(output.contains("Signal aborted (before abort): false"));
    assert!(output.contains("Signal aborted (after abort): true"));
    assert!(output.contains("test-abort-basic passed"));

    Ok(())
}

#[test]
async fn abort_signal_static(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-signal", &[]).await;

    assert!(output.contains("Created aborted signal"));
    assert!(output.contains("Signal aborted: true"));
    assert!(output.contains("Signal reason: Custom abort reason"));
    assert!(output.contains("test-abort-signal passed"));

    Ok(())
}

#[test]
async fn abort_signal_timeout(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-timeout", &[]).await;

    assert!(output.contains("Created timeout signal (10ms)"));
    assert!(output.contains("Signal aborted (immediately): false"));
    assert!(output.contains("test-abort-timeout passed"));

    Ok(())
}

#[test]
async fn abort_controller_event(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-event", &[]).await;

    assert!(output.contains("Added abort event listener"));
    assert!(output.contains("Abort event fired"));
    assert!(output.contains("Event fired: true"));
    assert!(output.contains("test-abort-event passed"));

    Ok(())
}

#[test]
async fn abort_controller_reason(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-reason", &[]).await;

    assert!(output.contains("Signal reason (before abort): undefined"));
    assert!(output.contains("Signal reason message: Custom error"));
    assert!(output.contains("Reasons match: true"));
    assert!(output.contains("test-abort-reason passed"));

    Ok(())
}

#[test]
async fn abort_controller_multiple_listeners(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-abort-multiple-listeners",
        &[],
    )
    .await;

    assert!(output.contains("Added 2 abort event listeners"));
    assert!(output.contains("Listener 1 fired"));
    assert!(output.contains("Listener 2 fired"));
    assert!(output.contains("Both listeners called: true"));
    assert!(output.contains("test-abort-multiple-listeners passed"));

    Ok(())
}

#[test]
async fn abort_controller_throw_if_aborted(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-throw-if-aborted", &[]).await;

    assert!(output.contains("throwIfAborted: Caught error: Custom reason"));
    assert!(output.contains("test-throw-if-aborted passed"));

    Ok(())
}

#[test]
async fn abort_controller_throw_if_aborted_not_aborted(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-throw-if-aborted-not-aborted",
        &[],
    )
    .await;

    assert!(output.contains("throwIfAborted: Did not throw (correct)"));
    assert!(output.contains("throwIfAborted when not aborted - threw: false"));
    assert!(output.contains("test-throw-if-aborted-not-aborted passed"));

    Ok(())
}

#[test]
async fn abort_controller_onabort_handler(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-onabort-handler", &[]).await;

    assert!(output.contains("Set onabort handler"));
    assert!(output.contains("onabort handler fired"));
    assert!(output.contains("onabort called: true"));
    assert!(output.contains("test-onabort-handler passed"));

    Ok(())
}

#[test]
async fn abort_controller_once_option(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-once-option", &[]).await;

    assert!(output.contains("Added listener with once: true"));
    assert!(output.contains("Listener called"));
    assert!(output.contains("After first abort, call count: 1"));
    assert!(output.contains("test-once-option passed"));

    Ok(())
}

#[test]
async fn abort_controller_remove_event_listener(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-remove-event-listener",
        &[],
    )
    .await;

    assert!(output.contains("Added listener"));
    assert!(output.contains("Removed listener"));
    assert!(output.contains("After abort, listener called: false"));
    assert!(output.contains("test-remove-event-listener passed"));

    Ok(())
}

#[test]
async fn abort_controller_idempotent(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-idempotent", &[]).await;

    assert!(output.contains("First abort"));
    assert!(output.contains("Second abort"));
    assert!(output.contains("Listener called: 1 times"));
    assert!(output.contains("Reasons match (should stay same): true"));
    assert!(output.contains("test-abort-idempotent passed"));

    Ok(())
}

#[test]
async fn abort_controller_no_reason(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-abort-no-reason", &[]).await;

    assert!(output.contains("Abort without reason - reason type: DOMException"));
    assert!(output.contains("Abort without reason - reason name: AbortError"));
    assert!(output.contains("test-abort-no-reason passed"));

    Ok(())
}

#[test]
async fn abort_controller_duplicate_listeners(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-duplicate-listeners", &[])
            .await;

    assert!(output.contains("Added same handler twice"));
    assert!(output.contains("Handler call count: 1"));
    assert!(output.contains("test-duplicate-listeners passed"));

    Ok(())
}

#[test]
async fn timeout_unref_does_not_block_idle(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    // This test reproduces the bug where an unref'd long timer blocks rt.idle().await.
    // With the bug, invoke_and_capture_output will hang for 120s and then timeout.
    // After the fix, it should complete in ~100ms.
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-timeout-unref-does-not-block-idle", &[]).await;
    let _ = r?;

    assert!(output.contains("short unrefed fired"), "Expected 'short unrefed fired' in output (unref must not cancel timers): {output}");
    assert!(output.contains("short fired"), "Expected 'short fired' in output: {output}");
    assert!(output.contains("done"), "Expected 'done' in output: {output}");

    Ok(())
}

#[test]
async fn fetch_abort_already_aborted(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-fetch-abort-already-aborted",
        &[],
    )
    .await;

    assert!(output.contains("Testing fetch with already-aborted signal"));
    assert!(output.contains("Caught abort error"));
    assert!(output.contains("test-fetch-abort-already-aborted passed"));

    Ok(())
}

#[test]
async fn fetch_abort_during_request(
    #[tagged_as("abort_controller")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (_, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "test-fetch-abort-during-request",
        &[],
    )
    .await;

    assert!(output.contains("Testing fetch with signal aborted during request"));
    assert!(output.contains("Aborting fetch"));
    assert!(output.contains("Caught abort error"));
    assert!(output.contains("Result: aborted"));
    assert!(output.contains("test-fetch-abort-during-request passed"));

    Ok(())
}

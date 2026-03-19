use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "diagnostics_channel")]
fn compiled_diagnostics_channel() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/diagnostics-channel");
    CompiledTest::new(path, false).expect("Failed to compile diagnostics-channel")
}

#[test]
async fn diagnostics_channel_api(
    #[tagged_as("diagnostics_channel")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test", &[]).await;
    let result = result?;

    if let Some(Val::String(json_str)) = result {
        let r: serde_json::Value = serde_json::from_str(&json_str)?;

        let errors = r["errors"].as_array().unwrap();
        assert!(errors.is_empty(), "Unexpected errors: {:?}", errors);

        // Basic channel
        assert!(r["channelCreated"].as_bool().unwrap(), "channelCreated");
        assert!(r["channelName"].as_bool().unwrap(), "channelName");
        assert!(r["noSubscribers"].as_bool().unwrap(), "noSubscribers");
        assert!(r["hasSubscribers"].as_bool().unwrap(), "hasSubscribers");
        assert!(r["receivedMessage"].as_bool().unwrap(), "receivedMessage");
        assert!(r["receivedName"].as_bool().unwrap(), "receivedName");
        assert!(r["unsubscribed"].as_bool().unwrap(), "unsubscribed");

        // Module-level
        assert!(
            r["moduleHasSubscribers"].as_bool().unwrap(),
            "moduleHasSubscribers"
        );
        assert!(r["moduleCalled"].as_bool().unwrap(), "moduleCalled");
        assert!(
            r["moduleUnsubscribed"].as_bool().unwrap(),
            "moduleUnsubscribed"
        );

        // Symbol
        assert!(r["symbolChannel"].as_bool().unwrap(), "symbolChannel");

        // Error handling
        assert!(r["subscribeError"].as_bool().unwrap(), "subscribeError");
        assert!(r["errorIsolation"].as_bool().unwrap(), "errorIsolation");

        // Stores
        assert!(r["storeBeforeRun"].as_bool().unwrap(), "storeBeforeRun");
        assert!(r["storeInsideRun"].as_bool().unwrap(), "storeInsideRun");
        assert!(r["storeAfterRun"].as_bool().unwrap(), "storeAfterRun");
        assert!(r["storeTransform"].as_bool().unwrap(), "storeTransform");
        assert!(r["unbindStore"].as_bool().unwrap(), "unbindStore");
        assert!(r["unbindStoreFalse"].as_bool().unwrap(), "unbindStoreFalse");

        // TracingChannel
        assert!(
            r["tracingChannelStart"].as_bool().unwrap(),
            "tracingChannelStart"
        );
        assert!(
            r["tracingChannelEnd"].as_bool().unwrap(),
            "tracingChannelEnd"
        );
        assert!(
            r["tracingChannelAsyncStart"].as_bool().unwrap(),
            "tracingChannelAsyncStart"
        );
        assert!(
            r["tracingChannelAsyncEnd"].as_bool().unwrap(),
            "tracingChannelAsyncEnd"
        );
        assert!(
            r["tracingChannelError"].as_bool().unwrap(),
            "tracingChannelError"
        );

        // traceSync
        assert!(r["traceSyncResult"].as_bool().unwrap(), "traceSyncResult");
        assert!(r["traceSyncEvents"].as_bool().unwrap(), "traceSyncEvents");
        assert!(r["traceSyncError"].as_bool().unwrap(), "traceSyncError");
        assert!(
            r["traceSyncErrorEvents"].as_bool().unwrap(),
            "traceSyncErrorEvents"
        );
        assert!(
            r["traceSyncEarlyExit"].as_bool().unwrap(),
            "traceSyncEarlyExit"
        );
        assert!(
            r["traceSyncRunStores"].as_bool().unwrap(),
            "traceSyncRunStores"
        );

        // TracingChannel hasSubscribers
        assert!(r["tracingNoSubs"].as_bool().unwrap(), "tracingNoSubs");
        assert!(r["tracingHasSubs"].as_bool().unwrap(), "tracingHasSubs");
        assert!(
            r["tracingNoSubsAfter"].as_bool().unwrap(),
            "tracingNoSubsAfter"
        );

        // traceCallback
        assert!(
            r["traceCallbackSync"].as_bool().unwrap(),
            "traceCallbackSync"
        );
        assert!(
            r["traceCallbackThrows"].as_bool().unwrap(),
            "traceCallbackThrows"
        );

        // Custom TracingChannel
        assert!(
            r["customTracingChannel"].as_bool().unwrap(),
            "customTracingChannel"
        );
        assert!(
            r["tracingChannelCtorError"].as_bool().unwrap(),
            "tracingChannelCtorError"
        );
    } else {
        anyhow::bail!("Expected string result from test function");
    }

    Ok(())
}

use crate::common::{
    CompiledTest, FeatureCombination, GolemPreparedComponent, TestInstance, WsSentMessage,
};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "websocket", scope = Cloneable)]
async fn compiled_websocket() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/websocket");
    // WebSocket lives behind the `golem` feature, which also pulls in the
    // golem:api/context import, so compile with Golem and run against the
    // GolemPreparedComponent (which mocks context in addition to the functional
    // websocket mock).
    CompiledTest::new_with_features(path, true, FeatureCombination::Golem)
        .await
        .expect("Failed to compile websocket")
}

/// A JS WebSocket can send binary data (ArrayBuffer / typed array / Blob) as well
/// as text. The functional host mock records every frame; we assert the binary
/// frames arrived intact.
#[test]
async fn websocket_binary_send(
    #[tagged_as("websocket")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let prepared = GolemPreparedComponent::new(compiled.wasm_path())?;
    let mut instance = TestInstance::from_golem_prepared(&prepared).await?;

    let (result, output) = instance
        .invoke_and_capture_output(None, "test-binary-send", &[])
        .await;
    let result = result?;

    assert_eq!(
        result,
        Some(Val::Bool(true)),
        "test-binary-send should return true. Output:\n{output}"
    );

    let sent = instance.read_ws_sent();
    println!("Recorded WS frames: {sent:?}\nOutput:\n{output}");

    // Exact order matters: the Blob send is asynchronous, so a weaker `contains`
    // check would miss the regression where the trailing text overtakes the Blob.
    // The guest sends ArrayBuffer, typed array, Blob, then text — the wire order
    // must match that call order.
    assert_eq!(
        sent,
        vec![
            WsSentMessage::Binary(vec![1, 2, 3]),
            WsSentMessage::Binary(vec![4, 5, 6]),
            WsSentMessage::Binary(vec![7, 8, 9]),
            WsSentMessage::Text("hello".to_string()),
        ],
        "WS frames must preserve send() call order (Blob must not be overtaken \
         by the following text). Got {sent:?}"
    );

    Ok(())
}

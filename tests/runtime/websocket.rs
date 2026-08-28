use crate::common::{
    CompiledTest, FeatureCombination, GolemPreparedComponent, TestInstance, WsSentMessage,
};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "websocket", scope = Cloneable)]
async fn compiled_websocket() -> CompiledTest {
    CompiledTest::new_with_features(
        Utf8Path::new("examples/runtime/websocket"),
        true,
        FeatureCombination::Golem,
    )
    .await
    .expect("Failed to compile websocket")
}

async fn run_and_assert_frames(
    compiled: &CompiledTest,
    function: &str,
    expected: Vec<WsSentMessage>,
) -> anyhow::Result<()> {
    let prepared = GolemPreparedComponent::new(compiled.wasm_path())?;
    let mut instance = TestInstance::from_golem_prepared(&prepared).await?;
    let (result, output) = instance
        .invoke_and_capture_output(None, function, &[])
        .await;
    assert_eq!(
        result?,
        Some(Val::Bool(true)),
        "{function} should return true. Output:\n{output}"
    );
    assert_eq!(instance.read_ws_sent(), expected);
    Ok(())
}

#[test]
async fn websocket_binary_send(
    #[tagged_as("websocket")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_and_assert_frames(
        compiled,
        "test-binary-send",
        vec![
            WsSentMessage::Binary(vec![1, 2, 3]),
            WsSentMessage::Binary(vec![4, 5, 6]),
            WsSentMessage::Binary(vec![7, 8, 9]),
            WsSentMessage::Text("hello".to_string()),
        ],
    )
    .await
}

#[test]
async fn websocket_stream_send(
    #[tagged_as("websocket")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_and_assert_frames(
        compiled,
        "test-websocket-stream-send",
        vec![
            WsSentMessage::Text("hello".to_string()),
            WsSentMessage::Binary(vec![1, 2, 3]),
            WsSentMessage::Binary(vec![4, 5, 6]),
            WsSentMessage::Binary(vec![7, 8, 9]),
        ],
    )
    .await
}

#[test]
async fn websocket_send_snapshot_and_close_order(
    #[tagged_as("websocket")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_and_assert_frames(
        compiled,
        "test-send-snapshot-and-close-order",
        vec![
            WsSentMessage::Binary(vec![1]),
            WsSentMessage::Binary(vec![2, 3]),
            WsSentMessage::Binary(vec![4, 5]),
            WsSentMessage::Text("tail".to_string()),
            WsSentMessage::Close(Some(3000), Some("done".to_string())),
        ],
    )
    .await
}

#[test]
async fn websocket_receive_close_reentrancy(
    #[tagged_as("websocket")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_and_assert_frames(
        compiled,
        "test-receive-close-reentrancy",
        vec![WsSentMessage::Close(None, None)],
    )
    .await
}

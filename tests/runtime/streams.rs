use crate::common::{CompiledTest, invoke_and_capture_output};
use indoc::indoc;
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("streams")]
    CompiledTest
);

#[test]
async fn streams(#[tagged_as("streams")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "test1", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
    Enqueued 0
    Read 1 characters so far
    Most recently read chunk: 0
    Enqueued 1
    Read 2 characters so far
    Most recently read chunk: 1
    Enqueued 2
    Read 3 characters so far
    Most recently read chunk: 2
    Enqueued 3
    Read 4 characters so far
    Most recently read chunk: 3
    Enqueued 4
    Read 5 characters so far
    Most recently read chunk: 4
    Enqueued 5
    Read 6 characters so far
    Most recently read chunk: 5
    Enqueued 6
    Read 7 characters so far
    Most recently read chunk: 6
    Enqueued 7
    Read 8 characters so far
    Most recently read chunk: 7
    Enqueued 8
    Read 9 characters so far
    Most recently read chunk: 8
    Stream complete 012345678
    "#
        )
    );

    Ok(())
}

#[test]
async fn node_stream1(#[tagged_as("streams")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, _output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-node-stream1", &[]).await;
    let r = r?;

    assert_eq!(r, Some(Val::String("Good morning!".to_string())));

    Ok(())
}

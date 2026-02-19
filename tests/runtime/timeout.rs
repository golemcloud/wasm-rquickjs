use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use indoc::indoc;
use test_r::{test, test_dep};

#[test_dep(tagged_as = "timeout")]
fn compiled_timeout() -> CompiledTest {
    let path = Utf8Path::new("examples/timeout");
    CompiledTest::new(path, true).expect("Failed to compile timeout")
}

#[test]
async fn timeout_1(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
        timeout test starts
        Message from setImmediate #1
        Message from setImmediate #2
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a delayed message after 1s, with params x, 100
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a delayed message after 2s
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a repeated message every 250ms
        This is a followup delayed message after 1s
        "#
        )
    );

    Ok(())
}

#[test]
#[ignore] // NOTE: this test passes with Golem but not with wasmtime. To be investigated.
async fn timeout_2(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(compiled.wasm_path(), None, "parallel", &[]).await;
    let _ = r?;

    for i in 0..1000 {
        assert!(output.contains(&format!("test {i}")));
    }

    Ok(())
}

#[test]
async fn timeout_3(#[tagged_as("timeout")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "use-next-tick", &[]).await;
    let _ = r?;

    assert_eq!(
        output,
        indoc!(
            r#"
            start
            end
            nextTick callback 1
            nextTick callback 2
            setImmediate callback 1
        "#
        )
    );

    Ok(())
}

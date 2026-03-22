use crate::common::{CompiledTest, TestInstance};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "stateful1")]
async fn compiled_stateful1() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/stateful1");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile stateful1")
}

#[test]
async fn stateful1(#[tagged_as("stateful1")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let mut test_instance = TestInstance::new(compiled.wasm_path()).await?;

    let (v0, _) = test_instance
        .invoke_and_capture_output(None, "get", &[])
        .await;
    let v0 = v0?;

    let Val::S32(v0) = v0.unwrap() else {
        panic!("Expected s32")
    };

    let (r, output1) = test_instance
        .invoke_and_capture_output(None, "inc", &[Val::S32(1)])
        .await;
    let _ = r?;

    let (r, output2) = test_instance
        .invoke_and_capture_output(None, "inc", &[Val::S32(3)])
        .await;
    let _ = r?;

    let (v1, _) = test_instance
        .invoke_and_capture_output(None, "get", &[])
        .await;
    let v1 = v1?;

    let Val::S32(v1) = v1.unwrap() else {
        panic!("Expected s32")
    };

    assert_eq!(v0, 0);
    assert_eq!(output1, "inc by (1)\n");
    assert_eq!(output2, "inc by (1)\ninc by (3)\n");
    assert_eq!(v1, 4);

    Ok(())
}

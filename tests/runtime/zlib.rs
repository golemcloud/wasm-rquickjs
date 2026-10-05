use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "zlib", scope = Cloneable)]
async fn compiled_zlib() -> CompiledTest {
    CompiledTest::new(Utf8Path::new("examples/runtime/zlib"), true)
        .await
        .expect("Failed to compile zlib")
}

#[test]
async fn zlib_byte_transfer(#[tagged_as("zlib")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (result, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "test-byte-transfer", &[]).await;
    println!("Output:\n{}", output);
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

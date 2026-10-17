use crate::common::{CompiledTest, FeatureCombination, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasm_rquickjs::{EmbeddingMode, JsModuleSpec};
use wasmtime::component::Val;

#[test_dep(tagged_as = "process_backend", scope = Cloneable)]
async fn compiled_process_backend() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/process-backend");
    CompiledTest::new_with_features_and_additional_modules(
        path,
        true,
        FeatureCombination::Normal,
        &[JsModuleSpec {
            name: "wasm-rquickjs-runtime-init".to_string(),
            mode: EmbeddingMode::EmbedFile(path.join("src/runtime-init.js")),
        }],
    )
    .await
    .expect("Failed to compile process backend")
}

#[test]
async fn process_backend_is_runtime_local_and_preserves_inline_execution(
    #[tagged_as("process_backend")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(compiled.wasm_path(), None, "run", &[]).await;
    assert!(
        output.is_empty(),
        "backend output leaked to component stdio: {output}"
    );
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

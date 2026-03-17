use crate::common::{CompiledTest, invoke_and_capture_output};
use anyhow::anyhow;
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "response_constructor")]
fn compiled_response_constructor() -> CompiledTest {
    let path = Utf8Path::new("examples/response-constructor");
    CompiledTest::new(path, true).expect("Failed to compile response_constructor")
}

async fn run_test(
    compiled: &CompiledTest,
    func_name: &str,
) -> anyhow::Result<()> {
    let (result, _output) = invoke_and_capture_output(
        compiled.wasm_path(),
        Some("example:response-constructor/response-constructor-exports"),
        func_name,
        &[],
    )
    .await;

    let result = result?;

    match result {
        Some(Val::Record(vals)) => {
            let passed = vals
                .iter()
                .find(|(k, _)| k == "passed")
                .and_then(|(_, v)| match v {
                    Val::Bool(b) => Some(*b),
                    _ => None,
                })
                .ok_or_else(|| anyhow!("No passed field found"))?;

            let error = vals
                .iter()
                .find(|(k, _)| k == "error")
                .and_then(|(_, v)| match v {
                    Val::String(s) => Some(s.clone()),
                    _ => None,
                })
                .unwrap_or_default();

            assert!(passed, "Test failed: {}", error);
            Ok(())
        }
        _ => Err(anyhow!("Expected record result")),
    }
}

#[test]
async fn response_constructor_string_body(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-string-body").await
}

#[test]
async fn response_constructor_status_and_status_text(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-status-and-status-text").await
}

#[test]
async fn response_constructor_headers(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-headers").await
}

#[test]
async fn response_constructor_ok_property(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-ok-property").await
}

#[test]
async fn response_constructor_json_parse(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-json-parse").await
}

#[test]
async fn response_constructor_null_body(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-null-body").await
}

#[test]
async fn response_constructor_array_buffer_body(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-array-buffer-body").await
}

#[test]
async fn response_constructor_clone(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-clone").await
}

#[test]
async fn response_constructor_body_stream(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-body-stream").await
}

#[test]
async fn response_constructor_default_values(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-default-values").await
}

#[test]
async fn response_constructor_mock_fetch_pattern(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-mock-fetch-pattern").await
}

#[test]
async fn response_constructor_headers_iteration(
    #[tagged_as("response_constructor")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    run_test(compiled, "test-headers-iteration").await
}

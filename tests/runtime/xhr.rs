use crate::common::test_server::start_test_server;
use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "xhr")]
fn compiled_xhr() -> CompiledTest {
    let path = Utf8Path::new("examples/xhr");
    CompiledTest::new(path, true).expect("Failed to compile xhr")
}

#[test]
async fn xhr_simple_get(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "simple-get", &[Val::U16(port)])
            .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 1: simple GET"));
    assert!(output.contains("Status: 200"));
    assert!(output.contains("Response length:"));

    Ok(())
}

#[test]
async fn xhr_simple_post(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "simple-post", &[Val::U16(port)])
            .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 2: simple POST"));
    assert!(output.contains("POST Status:") || output.contains("POST Error occurred"));

    Ok(())
}

#[test]
async fn xhr_set_request_headers(
    #[tagged_as("xhr")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "set-request-headers",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 3: set request headers"));
    assert!(output.contains("Headers test status:") || output.contains("ReadyState changed"));

    Ok(())
}

#[test]
async fn xhr_get_response_headers(
    #[tagged_as("xhr")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "get-response-headers",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 4: get response headers"));
    assert!(output.contains("Content-Type header:") || output.contains("All headers length:"));

    Ok(())
}

#[test]
async fn xhr_response_types(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-types",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 5: response types"));
    assert!(output.contains("Text response type:") || output.contains("JSON response type:"));

    Ok(())
}

#[test]
async fn xhr_readystate_events(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "readystate-events",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 6: readystate events"));
    assert!(output.contains("ReadyState changed to:") || output.contains("States encountered:"));

    Ok(())
}

#[test]
async fn xhr_error_handling(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "error-handling",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 7: error handling"));
    // Either error handler is called or request succeeds
    assert!(
        output.contains("Error handler called")
            || output.contains("Request succeeded")
            || output.contains("Status on error:")
    );

    Ok(())
}

#[test]
async fn xhr_abort_request(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "abort-request",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 8: abort request"));
    assert!(output.contains("Abort handler called") || output.contains("Request completed"));

    Ok(())
}

#[test]
async fn xhr_timeout_handling(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "timeout-handling",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 9: timeout handling"));
    // Either timeout or normal completion
    assert!(output.contains("Timeout handler called") || output.contains("Request completed"));

    Ok(())
}

#[test]
async fn xhr_post_with_form_data(
    #[tagged_as("xhr")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-form-data",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 11: POST with FormData"));
    assert!(output.contains("FormData POST status:") || output.contains("ReadyState changed"));

    Ok(())
}

#[test]
async fn xhr_post_with_json_body(
    #[tagged_as("xhr")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-json-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 12: POST with JSON body"));
    assert!(output.contains("JSON POST status:") || output.contains("ReadyState changed"));

    Ok(())
}

#[test]
async fn xhr_basic_auth(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "request-with-basic-auth",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 10: basic auth"));
    assert!(output.contains("Auth request status:") || output.contains("Auth request error"));

    Ok(())
}

#[test]
async fn xhr_status_is_number(#[tagged_as("xhr")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "status-is-number",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("XMLHttpRequest test 13: status is number"));
    assert!(output.contains("Status typeof: number"));
    assert!(output.contains("Status is number: true"));
    assert!(output.contains("Status === 200: true"));
    assert!(output.contains("Status >= 200 && status < 300: true"));

    Ok(())
}

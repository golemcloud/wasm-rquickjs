use crate::common::test_server::start_test_server;
use crate::common::{CompiledTest, invoke_and_capture_output};
use test_r::{inherit_test_dep, test};
use wasmtime::component::Val;

inherit_test_dep!(
    #[tagged_as("node_http")]
    CompiledTest
);

#[test]
async fn node_http_get(#[tagged_as("node_http")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-get", &[Val::U16(port)]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 1 - http.get"));
    assert!(output.contains("Status: 200"));
    assert!(output.contains("StatusMessage: OK"));
    assert!(output.contains("HttpVersion: 1.1"));
    assert!(output.contains("Complete: true"));

    Ok(())
}

#[test]
async fn node_http_post_json(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    // First post to create a todo, then we check the response
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-post-json",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 2 - http.request POST"));
    assert!(output.contains("Status: 201"));
    assert!(output.contains("Response title: foo"));
    assert!(output.contains("Response userId: 1"));

    Ok(())
}

#[test]
async fn node_http_request_with_headers(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-request-with-headers",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 3 - headers"));
    assert!(output.contains("Status: 200"));
    assert!(output.contains("hasHeader X-Another: true"));
    assert!(output.contains("getHeader X-Another: value"));
    assert!(output.contains("hasHeader X-Another after remove: false"));
    assert!(output.contains("Body received: true"));

    Ok(())
}

#[test]
async fn node_http_constants(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-constants", &[]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 4 - constants"));
    assert!(output.contains("METHODS is array: true"));
    assert!(output.contains("METHODS includes GET: true"));
    assert!(output.contains("METHODS includes POST: true"));
    assert!(output.contains("STATUS_CODES[200]: OK"));
    assert!(output.contains("STATUS_CODES[404]: Not Found"));
    assert!(output.contains("STATUS_CODES[500]: Internal Server Error"));
    assert!(output.contains("maxHeaderSize: 16384"));
    assert!(output.contains("Agent keepAlive: true"));
    assert!(output.contains("Agent maxSockets: Infinity"));
    assert!(output.contains("globalAgent exists: true"));
    assert!(output.contains("validateHeaderName valid: passed"));
    assert!(output.contains("validateHeaderName invalid: correctly threw"));
    assert!(output.contains("createServer: correctly threw"));

    Ok(())
}

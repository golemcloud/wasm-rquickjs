use crate::common::test_server::start_test_server;
use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "node_http", scope = Cloneable)]
async fn compiled_node_http() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/node-http");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile node_http")
}

#[test]
async fn node_http_get(#[tagged_as("node_http")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _server) = start_test_server().await;

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
    let (port, _server) = start_test_server().await;

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
    let (port, _server) = start_test_server().await;

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
    assert!(output.contains("Agent options prototype is null: true"));
    assert!(output.contains("Agent options has scheduling: false"));
    assert!(output.contains("Agent options path is null: true"));
    assert!(output.contains("Agent options noDelay defaults true: true"));
    assert!(output.contains("Agent options preserve noDelay false: true"));
    assert!(output.contains("Agent timeout assignment: 1234"));
    assert!(output.contains("globalAgent exists: true"));
    assert!(output.contains("validateHeaderName valid: passed"));
    assert!(output.contains("validateHeaderName invalid: correctly threw"));
    assert!(output.contains("createServer: succeeded, type: object"));

    Ok(())
}

#[test]
async fn node_http_self_connect(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-self-connect", &[]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 5 - self-connect"));
    assert!(output.contains("Server listening on port"));
    assert!(output.contains("Server received request"));
    assert!(output.contains("Got response, status: 200"));
    assert!(output.contains("server closed"));

    Ok(())
}

#[test]
async fn node_http_self_connect_post(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-self-connect-post", &[]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("node:http test 6 - self-connect POST"));
    assert!(output.contains("Server listening on port"));
    assert!(output.contains("Server received POST request"));
    assert!(output.contains("Server body complete: \"hello\""));
    assert!(output.contains("Got response, status: 200"));
    assert!(output.contains("server closed"));

    Ok(())
}

#[test]
async fn node_http_abort_isolation(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-abort-isolation", &[]).await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_response_lifecycle(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-response-lifecycle", &[]).await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_pipelined_response_order(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-pipelined-response-order",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_half_open_pipelined_requests(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-half-open-pipelined-requests",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_pipelined_close_lifecycle(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-pipelined-close-lifecycle",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_pipelined_connection_close(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-pipelined-connection-close",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_pipelined_active_timeout(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-pipelined-active-timeout",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_close_idle_connections(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-close-idle-connections",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_idle_resource_reclamation(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-idle-resource-reclamation",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_zero_keep_alive_timeout(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-zero-keep-alive-timeout",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_unread_request_body_disposal(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-unread-request-body-disposal",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_server_request_destroy(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-server-request-destroy",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_partially_consumed_request_body(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-partially-consumed-request-body",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_resume_scheduled_request_body(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-resume-scheduled-request-body",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_complete_unread_request_body(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-complete-unread-request-body",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_client_response_ownership(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-client-response-ownership",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_informational_write_after_close(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-informational-write-after-close",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_max_requests_closes_socket(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-max-requests-closes-socket",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_net_writev_boundaries(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "net-writev-boundaries", &[]).await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_pipelined_max_requests(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-pipelined-max-requests",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(r?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_custom_connection_rejected(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-custom-connection-rejected",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_falsy_port_uses_protocol_default(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "http-falsy-port-uses-protocol-default",
        &[],
    )
    .await;
    println!("{output}");
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

#[test]
async fn node_http_response_persistence(
    #[tagged_as("node_http")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (result, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "http-response-persistence", &[])
            .await;
    println!("{output}");
    assert_eq!(result?, Some(Val::Bool(true)));
    Ok(())
}

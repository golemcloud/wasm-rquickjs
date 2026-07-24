use crate::common::test_server::{start_test_server, start_test_server_with_arrivals};
use crate::common::{CompiledTest, invoke_and_capture_output};
use camino::Utf8Path;
use std::time::{Duration, Instant};

use test_r::{test, test_dep};
use wasmtime::component::Val;

#[test_dep(tagged_as = "fetch", scope = Cloneable)]
async fn compiled_fetch() -> CompiledTest {
    let path = Utf8Path::new("examples/runtime/fetch");
    CompiledTest::new(path, true)
        .await
        .expect("Failed to compile fetch")
}

#[test]
async fn fetch_post_json_and_get(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-json-and-get",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)\n"
    )));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos/0: 200 OK (ok=true)\n"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_post_and_get_as_array_buffer(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-and-get-as-array-buffer",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert_eq!(
        output,
        "fetch test 2\nResponse body as ArrayBuffer: ArrayBuffer {\n  [Uint8Contents]: <7b 22 69 64 22 3a 30 2c 22 75 73 65 72 49 64 22 3a 31 2c 22 74 69 74 6c 65 22 3a 22 66 6f 6f 22 2c 22 62 6f 64 79 22 3a 22 62 61 72 22 2c 22 63 6f 6d 70 6c 65 74 65 64 22 3a 66 61 6c 73 65 7d>,\n  byteLength: 64\n}\n"
    );

    Ok(())
}

#[test]
async fn fetch_streaming_response_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "streaming-response-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    let chunk_count = output
        .lines()
        .filter(|l| l.starts_with("Received chunk: "))
        .count();
    assert!(chunk_count > 0);

    Ok(())
}

#[test]
async fn fetch_pipe_response_body_to_request(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "pipe-response-body-to-request",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"id\":"));

    Ok(())
}

#[test]
async fn fetch_pipe_buffered_response_body_to_request(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "pipe-buffered-response-body-to-request",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"id\":"));

    Ok(())
}

#[test]
async fn fetch_redirects(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    // Test: Redirect follow
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-follow",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;
    assert!(output.contains("Redirect followed successfully"));

    // Test: Redirect manual
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-manual",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;
    assert!(output.contains("Manual redirect handled correctly"));

    // Test: Redirect error
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-error",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;
    assert!(output.contains("Caught expected error for redirect: error"));

    // Test: Redirect loop
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-loop",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;
    assert!(output.contains("Caught expected error for loop"));

    // Test: Redirect with body (307)
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-redirect",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;
    assert!(output.contains("Status: 200"));
    assert!(output.contains("Redirected: true"));
    assert!(output.contains("Body: hello world"));

    Ok(())
}

#[test]
async fn fetch_concurrent_post_and_get(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "concurrent-post-and-get",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains("200 {\"id\":0,\""));
    assert!(output.contains("200 {\"id\":1,\""));
    assert!(output.contains("200 {\"id\":2,\""));
    assert!(output.contains("200 {\"id\":3,\""));
    assert!(output.contains("200 {\"id\":4,\""));

    Ok(())
}

#[test]
async fn fetch_post_with_slow_streaming_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-slow-streaming-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_blob_operations(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "blob-operations", &[]).await;
    let _ = r?;

    assert!(output.contains("Blob text: hello, world"));
    assert!(output.contains("Blob array buffer length: 12"));
    assert!(output.contains("FormData keys: [\"f1\",\"f2\"]"));
    assert!(output.contains("f1 {}"));
    assert!(output.contains("f2 {\"size\":123,\"type\":\"\",\"name\":\"cat-video.mp4\"}"));

    Ok(())
}

#[test]
async fn fetch_post_with_blob_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-blob-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_post_form_data_with_files(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;
    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-form-data-with-files",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains(&format!(
        "http://localhost:{port}/echo-form: 200 OK (ok=true)"
    )));
    assert!(output.contains("Body: [{\"name\":\"f1\",\"data\":[97,98,99]},{\"name\":\"f2\",\"data\":[123,34,116,105,116,108,101,34,58,34,102,111,111,34,44,34,98,111,100,121,34,58,34,98,97,114,34,44,34,117,115,101,114,73,100,34,58,49,125]}]"));

    Ok(())
}

#[test]
async fn fetch_with_request_object(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-with-request-object",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)\n"
    )));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos/0: 200 OK (ok=true)\n"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_post_with_data_view_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-data-view-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 11 (DataView)"));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/todos: 201 Created (ok=true)\n"
    )));
    assert!(output.contains(
        "Body: {\"id\":0,\"userId\":1,\"title\":\"foo\",\"body\":\"bar\",\"completed\":false}"
    ));

    Ok(())
}

#[test]
async fn fetch_post_with_url_search_params(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-url-search-params",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 12 (URLSearchParams)"));
    assert!(output.contains("URLSearchParams toString: title=foo&body=bar&userId=1"));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/form-echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("\"body\":\"title=foo&body=bar&userId=1\""));

    Ok(())
}

#[test]
async fn fetch_request_with_url_search_params(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "request-with-url-search-params",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 13 (URLSearchParams in Request)"));
    assert!(output.contains("Request body used: false"));
    assert!(output.contains(&format!(
        "Response from http://localhost:{port}/form-echo: 200 OK (ok=true)"
    )));
    assert!(output.contains("\"body\":\"name=John&email=john%40example.com\""));

    Ok(())
}

#[test]
async fn fetch_with_referrer(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-with-referrer",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 14 (referrer with fetch)"));
    assert!(output.contains("Test 1 referer sent: ''"));
    assert!(output.contains(&format!(
        "Test 2 referer sent: 'http://localhost:{port}/source'"
    )));
    assert!(output.contains("Test 3 referer sent: ''"));

    Ok(())
}

#[test]
async fn fetch_with_referrer_policy(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-with-referrer-policy",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 15 (referrerPolicy with fetch)"));
    assert!(output.contains("Test 1 referer sent: ''"));
    assert!(output.contains(&format!("Test 2 referer sent: 'http://localhost:{port}'")));
    assert!(output.contains(&format!(
        "Test 3 referer sent: 'http://localhost:{port}/source'"
    )));
    assert!(output.contains(&format!(
        "Test 4 referer sent: 'http://localhost:{port}/source'"
    )));

    Ok(())
}

#[test]
async fn fetch_with_credentials(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-with-credentials",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    assert!(output.contains("fetch test 16 (credentials option with fetch)"));
    assert!(output.contains("Test 1: credentials 'omit'"));
    // With "omit", credentials headers should NOT be sent
    assert!(output.contains("Test 1 authorization: '', cookie: ''"));
    // With "omit", Set-Cookie headers should be filtered from response
    assert!(output.contains("Test 1 set-cookie: ''"));

    assert!(output.contains("Test 2: credentials 'same-origin'"));
    // With "same-origin", credentials headers SHOULD be sent for same-origin requests
    assert!(
        output.contains(
            "Test 2 authorization: 'Bearer test-token', cookie: 'session=test-session-id'"
        )
    );
    // With "same-origin", Set-Cookie headers should be preserved
    assert!(output.contains("Test 2 set-cookie: 'test-cookie=test-value'"));

    assert!(output.contains("Test 3: credentials 'include'"));
    // With "include", credentials headers SHOULD always be sent
    assert!(
        output.contains(
            "Test 3 authorization: 'Bearer test-token', cookie: 'session=test-session-id'"
        )
    );
    // With "include", Set-Cookie headers should be preserved
    assert!(output.contains("Test 3 set-cookie: 'test-cookie=test-value'"));

    Ok(())
}

#[test]
async fn fetch_response_clone_basic(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-clone-basic",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 22 (response clone - basic)"));
    assert!(output.contains("Basic clone test passed"));

    Ok(())
}

#[test]
async fn fetch_response_clone_streaming_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-clone-streaming-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 23 (response clone - streaming body)"));
    assert!(output.contains("Original status: 200"));
    assert!(output.contains("Cloned status: 200"));
    assert!(output.contains("Streaming clone test passed"));

    Ok(())
}

#[test]
async fn fetch_response_clone_reuse_bodies(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-clone-reuse-bodies",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 24 (response clone - reuse bodies)"));
    assert!(output.contains("All clones have matching bodies"));

    Ok(())
}

#[test]
async fn fetch_response_clone_headers(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-clone-headers",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 25 (response clone - headers preservation)"));
    assert!(output.contains("Headers preserved in clone"));

    Ok(())
}

#[test]
async fn fetch_response_form_data(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-form-data",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("response-form-data test"));
    assert!(output.contains("Response status: 200"));
    assert!(output.contains("Response Content-Type: multipart/form-data"));
    assert!(output.contains("username: john_doe"));
    assert!(output.contains("email: john@example.com"));
    assert!(output.contains("file: File(test.txt"));
    assert!(output.contains("response-form-data test completed"));

    Ok(())
}

#[test]
async fn fetch_headers_iterator(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "headers-iterator",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 26 (Headers iterator)"));
    assert!(output.contains("Testing Headers Symbol.iterator:"));
    assert!(output.contains("Total headers via Symbol.iterator:"));
    assert!(output.contains("Total headers via entries():"));
    assert!(output.contains("Symbol.iterator test passed"));

    Ok(())
}

#[test]
async fn fetch_headers_constructor_iterator(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "headers-constructor-iterator",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 27 (Headers constructor iterator)"));
    assert!(output.contains("Testing Headers constructor with for-of loop:"));
    assert!(output.contains("x-custom-1 = value1"));
    assert!(output.contains("x-custom-2 = value2"));
    assert!(output.contains("x-custom-3 = value3"));
    assert!(output.contains("Total headers from for-of loop: 3"));
    assert!(output.contains("Total headers from entries(): 3"));
    assert!(output.contains("Headers constructor iterator test passed"));

    Ok(())
}

#[test]
async fn fetch_with_url_object(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-with-url-object",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 28 (URL object parameter)"));
    assert!(output.contains("URL object test: status=200"));
    assert!(output.contains("URL object fetch successful:"));

    Ok(())
}

#[test]
async fn post_with_url_object(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "post-with-url-object",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 29 (POST with URL object)"));
    assert!(output.contains("POST with URL object: status=201"));
    assert!(output.contains("POST with URL object successful: title=url_object_test"));

    Ok(())
}

#[test]
async fn fetch_url_object_with_query_params(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "fetch-url-object-with-query-params",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 30 (URL object with query parameters)"));
    assert!(output.contains("URL with query params: status=200"));
    assert!(output.contains("Fetched"));
    assert!(output.contains("item(s) with URL query params"));

    Ok(())
}

#[test]
async fn fetch_request_body_get_reader_after_access(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "request-body-get-reader-after-access",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 31 (Request body getReader after body access)"));
    assert!(output.contains("Stored body reference: exists"));
    assert!(output.contains("Got reader from request.body"));
    assert!(output.contains("Body content: test body content"));
    assert!(output.contains("Request body getReader after access test passed"));

    Ok(())
}

#[test]
async fn fetch_response_body_get_reader_after_access(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "response-body-get-reader-after-access",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains(
        "fetch test 32 (Response body getReader after body access - TanStack AI pattern)"
    ));
    assert!(output.contains("Stored body reference: exists"));
    assert!(output.contains("Got reader from response.body"));
    assert!(output.contains("Response body getReader after access test passed"));

    Ok(())
}

#[test]
async fn fetch_redirect_with_failing_stream_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-with-failing-stream-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 33 (redirect with failing stream body)"));
    assert!(output.contains("Stream body source error surfaced through redirect: PASSED"));

    Ok(())
}

#[test]
async fn fetch_redirect_with_infinite_stream_body(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let (r, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "redirect-with-infinite-stream-body",
        &[Val::U16(port)],
    )
    .await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 34 (redirect with infinite stream body)"));
    assert!(output.contains("Redirect handled promptly with infinite upload: PASSED"));

    Ok(())
}

#[test]
async fn fetch_function_shape(#[tagged_as("fetch")] compiled: &CompiledTest) -> anyhow::Result<()> {
    let (r, output) =
        invoke_and_capture_output(compiled.wasm_path(), None, "fetch-function-shape", &[]).await;
    let _ = r?;

    println!("{output}");

    assert!(output.contains("fetch test 35 (fetch function shape - Node compat)"));
    assert!(output.contains("fetch instanceof AsyncFunction: false"));
    assert!(output.contains("fetch has Function.prototype: true"));
    assert!(output.contains("new fetch threw: false"));
    assert!(output.contains("new fetch returned Promise: true"));
    assert!(output.contains("fetch function shape matches Node: PASSED"));

    Ok(())
}

/// Aborting an in-flight fetch must drop the underlying WASI HTTP request so the
/// invocation finishes promptly, instead of staying busy until the server
/// finally answers.
///
/// Rejecting the JS promise is not evidence of that on its own: a promise-level
/// abort rejects just as fast while the request keeps running, so only the
/// elapsed time discriminates. The arrival check makes sure we are measuring a
/// cancelled request rather than one that never left the guest.
#[test]
async fn fetch_abort_releases_request(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _handle, mut arrivals) = start_test_server_with_arrivals().await;

    // Stamp the arrival off to the side so the invocation is never blocked on it —
    // otherwise a guest that fails to reach the server takes the assertions down
    // with it before its output is ever printed.
    let arrival = tokio::spawn(async move { arrivals.recv().await.map(|_| Instant::now()) });

    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "abort-releases-request",
        &[Val::U16(port)],
    )
    .await;
    let finished_at = Instant::now();
    let _ = result?;

    println!("Output:\n{output}");

    let arrived_at = tokio::time::timeout(Duration::from_secs(5), arrival)
        .await
        .expect("the request never reached /slow-response (see guest output above)")?
        .expect("the arrivals channel closed before the request arrived");
    let elapsed = finished_at.duration_since(arrived_at);

    // The promise must reject *with the signal's reason* — without this, any fast
    // failure (a broken native send, a bad error path) would look like a success.
    // Both of these still pass with the leak present, so neither is the
    // discriminator for release.
    assert!(
        output.contains("Request reached the server: true"),
        "the guest aborted before the request went out, so nothing was cancelled \
         in flight. Output:\n{output}"
    );
    assert!(
        output.contains("Abort outcome: aborted"),
        "fetch should have rejected. Output:\n{output}"
    );
    assert!(
        output.contains("Abort reason matches: true"),
        "rejection did not carry the signal's reason. Output:\n{output}"
    );
    assert!(
        output.contains("abort rejected the promise promptly: PASSED"),
        "guest-side abort check failed. Output:\n{output}"
    );
    // The only assertion that proves the request was released: a promise-level
    // abort also rejects in ~100ms, but leaves the native request alive and the
    // invocation runs for the server's full 10s.
    assert!(
        elapsed < Duration::from_secs(10),
        "invocation took {elapsed:?} after the request reached the server; \
         the aborted request was not released (server delay is 30s)"
    );

    Ok(())
}

/// Aborting after the response has arrived but while a slow/never-resolving
/// request *body* is still uploading must also finish the invocation promptly.
///
/// The upload wait sits past `receiveResponse`, so the abort has to reach it
/// separately — otherwise the parked `reader.read()` never settles and the whole
/// invocation stalls until the epoch deadline instead of rejecting the fetch.
#[test]
async fn fetch_abort_during_body_upload(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let started = Instant::now();
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "abort-during-body-upload",
        &[Val::U16(port)],
    )
    .await;
    let elapsed = started.elapsed();
    // A stalled invocation surfaces here as an epoch-interrupt error, so the fix
    // is what lets `result?` succeed at all.
    let _ = result?;

    println!("Output:\n{output}");

    assert!(
        output.contains("Request reached the server: true"),
        "the guest aborted before the request went out, so nothing was parked on \
         the upload. Output:\n{output}"
    );
    assert!(
        output.contains("Abort outcome: aborted"),
        "fetch should have rejected. Output:\n{output}"
    );
    assert!(
        output.contains("Abort reason matches: true"),
        "rejection did not carry the signal's reason. Output:\n{output}"
    );
    assert!(
        output.contains("Upload stream cancelled: true"),
        "the request-body stream was not cancelled on abort. Output:\n{output}"
    );
    assert!(
        output.contains("abort during upload rejected promptly: PASSED"),
        "guest-side upload-abort check failed. Output:\n{output}"
    );
    // Belt and suspenders next to `result?`: prove we did not merely squeak under
    // the 120s epoch.
    assert!(
        elapsed < Duration::from_secs(60),
        "invocation took {elapsed:?}; the aborted upload was not released"
    );

    Ok(())
}

/// Aborting part-way through a redirect chain must stop it promptly: reject with
/// the signal reason and issue no further requests, instead of following the
/// chain to its 20-hop cap.
#[test]
async fn fetch_abort_during_redirect(
    #[tagged_as("fetch")] compiled: &CompiledTest,
) -> anyhow::Result<()> {
    let (port, _) = start_test_server().await;

    let started = Instant::now();
    let (result, output) = invoke_and_capture_output(
        compiled.wasm_path(),
        None,
        "abort-during-redirect",
        &[Val::U16(port)],
    )
    .await;
    let elapsed = started.elapsed();
    let _ = result?;

    println!("Output:\n{output}");

    assert!(
        output.contains("Redirect chain started: true"),
        "the guest aborted before the redirect chain got going. Output:\n{output}"
    );
    assert!(
        output.contains("Abort outcome: aborted"),
        "fetch should have rejected. Output:\n{output}"
    );
    assert!(
        output.contains("Abort reason matches: true"),
        "rejection did not carry the signal's reason (a leaked chain would reject \
         with 'Maximum redirects exceeded' instead). Output:\n{output}"
    );
    assert!(
        output.contains("No new redirects after abort: true"),
        "requests kept being issued after the abort. Output:\n{output}"
    );
    assert!(
        output.contains("abort during redirect stopped promptly: PASSED"),
        "guest-side redirect-abort check failed. Output:\n{output}"
    );
    // Backstop against a hard leak (which would stall to the 120s epoch): a
    // working abort finishes in well under this once the fixed instantiation and
    // native-cleanup cost is accounted for. The reason-match and no-new-redirects
    // checks above are the real proof the abort took effect; a non-working abort
    // would follow the chain to its cap and reject with "Maximum redirects
    // exceeded" instead, failing those.
    assert!(
        elapsed < Duration::from_secs(30),
        "invocation took {elapsed:?}; the aborted redirect chain kept running"
    );

    Ok(())
}

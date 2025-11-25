// Native functions for the timeout implementation
#[rquickjs::module]
pub mod native_module {
    pub use super::HttpRequest;
    pub use super::HttpResponse;
}

use futures::SinkExt;
use futures::channel::mpsc::{UnboundedReceiver, UnboundedSender};
use futures_concurrency::stream::IntoStream;
use golem_wasi_http::header::{HeaderName, HeaderValue};
use golem_wasi_http::{
    Body, CustomRequestBodyWriter, CustomRequestExecution, Method, Request, StreamError, Url,
    Version,
};
use rquickjs::class::Trace;
use rquickjs::prelude::List;
use rquickjs::{ArrayBuffer, Ctx, JsLifetime, TypedArray};
use std::cell::RefCell;
use std::collections::HashMap;
use wstd::runtime::AsyncPollable;

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct HttpRequest {
    #[qjs(skip_trace)]
    method: Method,
    #[qjs(skip_trace)]
    url: Url,
    #[qjs(skip_trace)]
    headers: HashMap<HeaderName, HeaderValue>,
    #[qjs(skip_trace)]
    version: Version,
    mode: String,
    referer: String,
    referrer_policy: String,
    #[qjs(skip_trace)]
    body: Option<Body>,
    #[qjs(skip_trace)]
    execution: Option<CustomRequestExecution>,
}

impl Default for HttpRequest {
    fn default() -> Self {
        HttpRequest {
            method: Method::GET,
            url: Url::parse("http://localhost").expect("failed to parse default URL"),
            headers: HashMap::new(),
            version: Version::HTTP_11,
            mode: "cors".to_string(),
            referer: "about:client".to_string(),
            referrer_policy: "strict-origin-when-cross-origin".to_string(),
            body: None,
            execution: None,
        }
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl HttpRequest {
    #[qjs(constructor)]
    pub fn new(
        url: String,
        method: String,
        headers: HashMap<String, String>,
        version: String,
        mode: String,
        referer: String,
        referrer_policy: String,
    ) -> Self {
        let url: Url = url.parse().expect("failed to parse url");
        let method: Method = method.parse().expect("failed to parse method");
        let version = match version.as_str() {
            "HTTP/0.9" => Version::HTTP_09,
            "HTTP/1.0" => Version::HTTP_10,
            "HTTP/1.1" => Version::HTTP_11,
            "HTTP/2.0" => Version::HTTP_2,
            "HTTP/3.0" => Version::HTTP_3,
            _ => panic!("Unsupported HTTP version: {version}"),
        };

        let mut hdrs = HashMap::new();
        for (key, value) in headers {
            let header_name =
                HeaderName::from_bytes(key.as_bytes()).expect("failed to parse header name");
            let header_value = HeaderValue::from_str(&value).expect("failed to parse header value");
            hdrs.insert(header_name, header_value);
        }

        HttpRequest {
            url,
            method,
            headers: hdrs,
            version,
            mode,
            referer,
            referrer_policy,
            body: None,
            execution: None,
        }
    }

    pub fn array_buffer_body(&mut self, body: ArrayBuffer<'_>) {
        self.body = body.as_bytes().map(|b| Body::from(b.to_vec()));
    }

    pub fn readable_stream_body(&mut self) -> BodySink {
        use futures::StreamExt;

        let mut body_sink = BodySink::new();
        let receiver = body_sink.take_receiver();

        let stream = receiver.into_stream().map(Ok);
        let body = Body::from_stream(stream);
        self.body = Some(body);
        body_sink
    }

    pub fn string_body(&mut self, body: String) {
        self.body = Some(Body::from(body));
    }

    pub fn uint8_array_body(&mut self, body: rquickjs::TypedArray<'_, u8>) {
        self.body = body.as_bytes().map(|b| Body::from(b.to_vec()));
    }

    pub fn add_header(&mut self, name: String, value: String) {
        let header_name =
            HeaderName::from_bytes(name.as_bytes()).expect("failed to parse header name");
        let header_value = HeaderValue::from_str(&value).expect("failed to parse header value");
        self.headers.insert(header_name, header_value);
    }

    #[qjs(get)]
    pub fn mode(&self) -> String {
        self.mode.clone()
    }

    #[qjs(get)]
    pub fn referer(&self) -> String {
        self.referer.clone()
    }

    #[qjs(get, rename = "referrerPolicy")]
    pub fn referrer_policy(&self) -> String {
        self.referrer_policy.clone()
    }

    pub fn init_send(&mut self) {
        let client = golem_wasi_http::ClientBuilder::new()
            .build()
            .expect("Failed to create HTTP client");

        let mut request = Request::new(self.method.clone(), self.url.clone());

        *request.version_mut() = self.version;
        for (name, value) in &self.headers {
            request.headers_mut().insert(name.clone(), value.clone());
        }

        // Apply referrer policy and set Referer header if appropriate
        if let Some(referer_header_value) =
            apply_referrer_policy(&self.referrer_policy, &self.referer, &self.url)
        {
            let referer_header = HeaderValue::from_str(&referer_header_value)
                .expect("failed to parse referer value");
            request.headers_mut().insert(
                HeaderName::from_bytes(b"referer").expect("failed to create referer header name"),
                referer_header,
            );
        }

        self.execution = Some(client.execute_custom(request).expect("HTTP request failed"));
    }

    pub fn send_request(&mut self) {
        if let Some(execution) = self.execution.as_mut() {
            execution
                .send_request()
                .expect("Failed to send HTTP request");
        } else {
            panic!("HTTP request has not been initialized for sending");
        }
    }

    pub fn init_request_body(&mut self) -> WrappedRequestBodyWriter {
        if let Some(execution) = self.execution.as_mut() {
            let writer = execution
                .init_request_body()
                .expect("Failed to init HTTP request body");

            WrappedRequestBodyWriter {
                writer: Some(writer),
            }
        } else {
            panic!("HTTP request has not been initialized for sending");
        }
    }

    pub async fn receive_response(&mut self) -> HttpResponse {
        if let Some(execution) = self.execution.take() {
            let response = execution
                .receive_response()
                .await
                .expect("Failed to receive HTTP response");

            HttpResponse::from_response(response)
        } else {
            panic!("HTTP request has not been initialized for sending");
        }
    }

    pub async fn simple_send(&mut self) -> HttpResponse {
        // Validate mode constraints
        if self.mode == "no-cors" {
            let method_str = self.method.to_string().to_uppercase();
            if !matches!(method_str.as_str(), "GET" | "HEAD" | "POST") {
                panic!("no-cors mode only allows GET, HEAD, or POST methods");
            }
        } else if self.mode == "navigate" {
            panic!("navigate mode is not supported in WASM context");
        } else if !matches!(self.mode.as_str(), "cors" | "same-origin") {
            panic!("Unsupported request mode: {}", self.mode);
        }

        let client = golem_wasi_http::ClientBuilder::new()
            .build()
            .expect("Failed to create HTTP client");

        let mut request = Request::new(self.method.clone(), self.url.clone());

        *request.version_mut() = self.version;
        for (name, value) in &self.headers {
            request.headers_mut().insert(name.clone(), value.clone());
        }

        // Apply referrer policy and set Referer header if appropriate
        if let Some(referer_header_value) =
            apply_referrer_policy(&self.referrer_policy, &self.referer, &self.url)
        {
            let referer_header = HeaderValue::from_str(&referer_header_value)
                .expect("failed to parse referer value");
            request.headers_mut().insert(
                HeaderName::from_bytes(b"referer").expect("failed to create referer header name"),
                referer_header,
            );
        }

        *request.body_mut() = self.body.take();

        let response = client.execute(request).await.expect("HTTP request failed");

        let mut http_response = HttpResponse::from_response(response);
        
        // For no-cors mode, make the response opaque
        if self.mode == "no-cors" {
            http_response.make_opaque();
        }

        http_response
    }
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct WrappedRequestBodyWriter {
    #[qjs(skip_trace)]
    writer: Option<CustomRequestBodyWriter>,
}

impl Default for WrappedRequestBodyWriter {
    fn default() -> Self {
        Self::new()
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl WrappedRequestBodyWriter {
    #[qjs(constructor)]
    pub fn new() -> Self {
        WrappedRequestBodyWriter { writer: None }
    }

    pub async fn write_request_body_chunk(&mut self, chunk: TypedArray<'_, u8>) {
        if let Some(writer) = self.writer.as_mut() {
            writer
                .write_body_chunk(
                    chunk
                        .as_bytes()
                        .expect("the UInt8Array passed to the HTTP request is detached"),
                )
                .await
                .expect("Failed to write HTTP request body chunk");
        } else {
            panic!("HTTP request has not been initialized for sending");
        }
    }

    pub fn finish_body(&mut self) {
        if let Some(writer) = self.writer.take() {
            writer
                .finish_body()
                .expect("Failed to init HTTP request body");
        } else {
            panic!("HTTP request has not been initialized for sending");
        }
    }
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct HttpResponse {
    #[qjs(skip_trace)]
    response: Option<golem_wasi_http::Response>,
    headers: Vec<Vec<String>>,
    #[qjs(skip_trace)]
    status: golem_wasi_http::StatusCode,
    is_opaque: bool,
}

impl Default for HttpResponse {
    fn default() -> Self {
        Self::new()
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl HttpResponse {
    #[qjs(constructor)]
    pub fn new() -> Self {
        Self {
            response: None,
            headers: Vec::new(),
            status: golem_wasi_http::StatusCode::OK,
            is_opaque: false,
        }
    }

    #[qjs(skip)]
    pub fn from_response(response: golem_wasi_http::Response) -> Self {
        let headers = response
            .headers()
            .iter()
            .map(|(name, value)| {
                vec![
                    name.to_string(),
                    value.to_str().unwrap_or("Invalid header value").to_string(),
                ]
            })
            .collect();

        let status = response.status();

        HttpResponse {
            response: Some(response),
            headers,
            status,
            is_opaque: false,
        }
    }

    #[qjs(skip)]
    pub fn make_opaque(&mut self) {
        self.is_opaque = true;
        // For opaque responses, clear headers and set status to 0
        self.headers.clear();
        self.status = golem_wasi_http::StatusCode::OK; // Will report as 0 when is_opaque is true
    }

    #[qjs(get)]
    pub fn headers(&self) -> Vec<Vec<String>> {
        self.headers.clone()
    }

    #[qjs(get)]
    pub fn status(&self) -> u16 {
        if self.is_opaque {
            0
        } else {
            self.status.as_u16()
        }
    }

    #[qjs(get, rename = "statusText")]
    pub fn status_text(&self) -> String {
        self.status
            .canonical_reason()
            .unwrap_or("Unknown status")
            .to_string()
    }

    pub async fn array_buffer<'js>(&mut self, ctx: Ctx<'js>) -> ArrayBuffer<'js> {
        let bytes = self
            .response
            .take()
            .expect("The response has already been consumed")
            .bytes()
            .await
            .expect("failed to read response body");

        ArrayBuffer::new(ctx, bytes).expect("failed to create ArrayBuffer from response body")
    }

    pub fn stream(&mut self) -> ResponseBodyStream {
        let mut response = self
            .response
            .take()
            .expect("The response has already been consumed");

        let (stream, body) = response.get_raw_input_stream();

        ResponseBodyStream {
            stream: Some((stream, body, response)),
        }
    }

    pub async fn text(&mut self) -> String {
        self.response
            .take()
            .expect("The response has already been consumed")
            .text()
            .await
            .expect("failed to read response body")
    }
}

/// Implements a source for ReadableStream reading the response body
///
/// See https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/ReadableStream
#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct ResponseBodyStream {
    #[qjs(skip_trace)]
    stream: Option<(
        golem_wasi_http::InputStream,
        golem_wasi_http::IncomingBody,
        golem_wasi_http::Response,
    )>,
}

impl Default for ResponseBodyStream {
    fn default() -> Self {
        Self::new()
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl ResponseBodyStream {
    #[qjs(constructor)]
    pub fn new() -> Self {
        ResponseBodyStream { stream: None }
    }

    #[qjs(get, rename = "type")]
    pub fn get_typ(&self) -> String {
        "bytes".to_string()
    }

    pub async fn pull<'js>(
        &mut self,
        ctx: Ctx<'js>,
    ) -> List<(Option<TypedArray<'js, u8>>, Option<String>)> {
        if let Some((stream, _body, _response)) = &mut self.stream {
            const CHUNK_SIZE: u64 = 4096;
            let pollable = stream.subscribe();
            AsyncPollable::new(pollable).wait_for().await;

            match stream.read(CHUNK_SIZE) {
                Ok(chunk) => {
                    let js_array = TypedArray::new_copy(ctx.clone(), chunk)
                        .expect("Failed to create TypedArray from response body chunk");
                    List((Some(js_array), None))
                }
                Err(StreamError::Closed) => {
                    // No more data to read, close the stream
                    self.stream = None; // Mark the response as consumed
                    List((None, None))
                }
                Err(StreamError::LastOperationFailed(err)) => List((
                    None,
                    Some(format!(
                        "Failed to read response body: {}",
                        err.to_debug_string()
                    )),
                )),
            }
        } else {
            List((
                None,
                Some("Response body stream has already been consumed".to_string()),
            ))
        }
    }
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct BodySink {
    #[qjs(skip_trace)]
    sender: RefCell<UnboundedSender<Vec<u8>>>,
    #[qjs(skip_trace)]
    receiver: Option<UnboundedReceiver<Vec<u8>>>,
}

impl Default for BodySink {
    fn default() -> Self {
        Self::new()
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl BodySink {
    #[qjs(constructor)]
    pub fn new() -> Self {
        let (sender, receiver) = futures::channel::mpsc::unbounded();
        BodySink {
            sender: RefCell::new(sender),
            receiver: Some(receiver),
        }
    }

    #[qjs(skip)]
    pub fn take_receiver(&mut self) -> UnboundedReceiver<Vec<u8>> {
        self.receiver
            .take()
            .expect("BodySink receiver has already been taken")
    }

    #[allow(clippy::await_holding_refcell_ref)]
    pub async fn write(&self, chunk: TypedArray<'_, u8>) {
        let mut sender = self.sender.borrow_mut();
        sender
            .send(
                chunk
                    .as_bytes()
                    .expect("the UInt8Array passed to the BodySink is detached")
                    .to_vec(),
            )
            .await
            .expect("Failed to send chunk to BodySink");
    }

    pub fn close(&self) {
        let sender = self.sender.borrow();
        sender.close_channel();
    }
}

/// Determines the referer value to send based on the policy, origin, and destination
fn apply_referrer_policy(
    policy: &str,
    referer: &str,
    request_url: &Url,
) -> Option<String> {
    // Policy: no-referrer - never send
    if policy == "no-referrer" {
        return None;
    }

    // If referer is empty string (explicitly set to omit), don't send
    if referer.is_empty() {
        return None;
    }

    // If referer is "about:client", don't send the literal value
    if referer == "about:client" {
        return None;
    }

    // Parse the referer URL
    let referer_url = match Url::parse(referer) {
        Ok(url) => url,
        Err(_) => return None, // Invalid referer URL, don't send
    };

    // Extract origins and schemes
    let request_origin = extract_origin(request_url);
    let referer_origin = extract_origin(&referer_url);
    let is_same_origin = request_origin == referer_origin;
    let is_downgrade = is_https_to_http(&referer_url, request_url);

    // Apply policy rules
    match policy {
        // no-referrer-when-downgrade: send full, except HTTPS->HTTP
        "no-referrer-when-downgrade" => {
            if is_downgrade {
                None
            } else {
                Some(referer.to_string())
            }
        }
        // origin: always send origin only
        "origin" => Some(referer_origin),
        // origin-when-cross-origin: full for same-origin, origin for cross-origin
        "origin-when-cross-origin" => {
            if is_same_origin {
                Some(referer.to_string())
            } else {
                Some(referer_origin)
            }
        }
        // same-origin: full for same-origin, none for cross-origin
        "same-origin" => {
            if is_same_origin {
                Some(referer.to_string())
            } else {
                None
            }
        }
        // strict-origin: origin only, none for HTTPS->HTTP
        "strict-origin" => {
            if is_downgrade {
                None
            } else {
                Some(referer_origin)
            }
        }
        // strict-origin-when-cross-origin (default): full for same-origin, origin for cross-origin, none for HTTPS->HTTP
        "strict-origin-when-cross-origin" | "" => {
            if is_downgrade {
                None
            } else if is_same_origin {
                Some(referer.to_string())
            } else {
                Some(referer_origin)
            }
        }
        // unsafe-url: always send full URL
        "unsafe-url" => Some(referer.to_string()),
        // Unknown policy defaults to strict-origin-when-cross-origin
        _ => {
            if is_downgrade {
                None
            } else if is_same_origin {
                Some(referer.to_string())
            } else {
                Some(referer_origin)
            }
        }
    }
}

/// Extracts the origin (scheme + host) from a URL
fn extract_origin(url: &Url) -> String {
    match (url.scheme(), url.host_str()) {
        (scheme, Some(host)) => {
            // Include port if it's not the default for the scheme
            if let Some(port) = url.port() {
                let default_port = match scheme {
                    "http" => 80,
                    "https" => 443,
                    _ => 0,
                };
                if port != default_port {
                    format!("{}://{}:{}", scheme, host, port)
                } else {
                    format!("{}://{}", scheme, host)
                }
            } else {
                format!("{}://{}", scheme, host)
            }
        }
        _ => String::new(),
    }
}

/// Checks if the request is an HTTPS->HTTP downgrade
fn is_https_to_http(from_url: &Url, to_url: &Url) -> bool {
    let from_scheme = from_url.scheme();
    let to_scheme = to_url.scheme();
    from_scheme == "https" && to_scheme == "http"
}

// JS functions for the console implementation
pub const HTTP_JS: &str = include_str!("http.js");
pub const FETCH_BLOB_JS: &str = include_str!("fetch-blob-4.0.0.js");
pub const FORMDATA_JS: &str = include_str!("formdata-polyfill-4.0.10.js");

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_http from '__wasm_rquickjs_builtin/http';
        import * as __wasm_rquickjs_http_blob from '__wasm_rquickjs_builtin/http_blob';
        import * as __wasm_rquickjs_http_form_data from '__wasm_rquickjs_builtin/http_form_data';

        globalThis.fetch = __wasm_rquickjs_http.fetch;
        globalThis.Headers = __wasm_rquickjs_http.Headers;
        globalThis.Request = __wasm_rquickjs_http.Request;
        globalThis.Response = __wasm_rquickjs_http.Response;
        globalThis.Blob = __wasm_rquickjs_http_blob.Blob;
        globalThis.File = __wasm_rquickjs_http_blob.File;
        globalThis.FormData = __wasm_rquickjs_http_form_data.FormData;
    "#;

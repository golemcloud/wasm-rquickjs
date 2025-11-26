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
use rquickjs::{ArrayBuffer, Ctx, Exception, FromJs, IntoJs, JsLifetime, TypedArray, Value};
use std::cell::RefCell;
use std::collections::HashMap;
use wstd::runtime::AsyncPollable;

/// Request mode - defines the cross-origin behavior
#[derive(Debug, Clone, Copy, PartialEq, Eq, rquickjs::class::Trace, rquickjs::JsLifetime)]
pub enum RequestMode {
    /// Standard CORS mode
    Cors,
    /// No CORS restrictions, limited to GET/HEAD/POST
    NoCors,
    /// Same-origin only
    SameOrigin,
    /// Navigation mode (not supported in WASM context)
    Navigate,
}

impl RequestMode {
    fn as_str(&self) -> &'static str {
        match self {
            RequestMode::Cors => "cors",
            RequestMode::NoCors => "no-cors",
            RequestMode::SameOrigin => "same-origin",
            RequestMode::Navigate => "navigate",
        }
    }

    fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "cors" => Ok(RequestMode::Cors),
            "no-cors" => Ok(RequestMode::NoCors),
            "same-origin" => Ok(RequestMode::SameOrigin),
            "navigate" => Ok(RequestMode::Navigate),
            _ => Err(format!("Unknown request mode: {}", s)),
        }
    }
}

impl<'js> FromJs<'js> for RequestMode {
    fn from_js(ctx: &Ctx<'js>, value: Value<'js>) -> rquickjs::Result<Self> {
        let s = String::from_js(ctx, value)?;
        RequestMode::from_str(&s).map_err(|e| Exception::throw_message(ctx, &e))
    }
}

impl<'js> IntoJs<'js> for RequestMode {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.as_str().into_js(ctx)
    }
}

/// Referrer policy - controls how referer header is sent
#[derive(Debug, Clone, Copy, PartialEq, Eq, rquickjs::class::Trace, rquickjs::JsLifetime)]
pub enum ReferrerPolicy {
    NoReferrer,
    NoReferrerWhenDowngrade,
    SameOrigin,
    Origin,
    OriginWhenCrossOrigin,
    StrictOrigin,
    StrictOriginWhenCrossOrigin,
    UnsafeUrl,
}

impl ReferrerPolicy {
    fn as_str(&self) -> &'static str {
        match self {
            ReferrerPolicy::NoReferrer => "no-referrer",
            ReferrerPolicy::NoReferrerWhenDowngrade => "no-referrer-when-downgrade",
            ReferrerPolicy::SameOrigin => "same-origin",
            ReferrerPolicy::Origin => "origin",
            ReferrerPolicy::OriginWhenCrossOrigin => "origin-when-cross-origin",
            ReferrerPolicy::StrictOrigin => "strict-origin",
            ReferrerPolicy::StrictOriginWhenCrossOrigin => "strict-origin-when-cross-origin",
            ReferrerPolicy::UnsafeUrl => "unsafe-url",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "no-referrer" => ReferrerPolicy::NoReferrer,
            "no-referrer-when-downgrade" => ReferrerPolicy::NoReferrerWhenDowngrade,
            "same-origin" => ReferrerPolicy::SameOrigin,
            "origin" => ReferrerPolicy::Origin,
            "origin-when-cross-origin" => ReferrerPolicy::OriginWhenCrossOrigin,
            "strict-origin" => ReferrerPolicy::StrictOrigin,
            "strict-origin-when-cross-origin" | "" => ReferrerPolicy::StrictOriginWhenCrossOrigin,
            "unsafe-url" => ReferrerPolicy::UnsafeUrl,
            _ => ReferrerPolicy::StrictOriginWhenCrossOrigin, // Default
        }
    }
}

impl<'js> FromJs<'js> for ReferrerPolicy {
    fn from_js(ctx: &Ctx<'js>, value: Value<'js>) -> rquickjs::Result<Self> {
        let s = String::from_js(ctx, value)?;
        Ok(ReferrerPolicy::from_str(&s))
    }
}

impl<'js> IntoJs<'js> for ReferrerPolicy {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.as_str().into_js(ctx)
    }
}

/// Credentials mode - controls how cookies and auth headers are handled
#[derive(Debug, Clone, Copy, PartialEq, Eq, rquickjs::class::Trace, rquickjs::JsLifetime)]
pub enum CredentialsMode {
    /// Never send credentials
    Omit,
    /// Send credentials only for same-origin requests
    SameOrigin,
    /// Always send credentials
    Include,
}

impl CredentialsMode {
    fn as_str(&self) -> &'static str {
        match self {
            CredentialsMode::Omit => "omit",
            CredentialsMode::SameOrigin => "same-origin",
            CredentialsMode::Include => "include",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "omit" => CredentialsMode::Omit,
            "same-origin" => CredentialsMode::SameOrigin,
            "include" => CredentialsMode::Include,
            _ => CredentialsMode::Omit, // Default for safety
        }
    }
}

impl<'js> FromJs<'js> for CredentialsMode {
    fn from_js(ctx: &Ctx<'js>, value: Value<'js>) -> rquickjs::Result<Self> {
        let s = String::from_js(ctx, value)?;
        Ok(CredentialsMode::from_str(&s))
    }
}

impl<'js> IntoJs<'js> for CredentialsMode {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.as_str().into_js(ctx)
    }
}

/// Redirect policy - controls how redirects are handled
#[derive(Debug, Clone, Copy, PartialEq, Eq, rquickjs::class::Trace, rquickjs::JsLifetime)]
pub enum RedirectPolicy {
    /// Follow redirects automatically
    Follow,
    /// Throw an error on redirect
    Error,
    /// Return the redirect response manually
    Manual,
}

impl RedirectPolicy {
    fn as_str(&self) -> &'static str {
        match self {
            RedirectPolicy::Follow => "follow",
            RedirectPolicy::Error => "error",
            RedirectPolicy::Manual => "manual",
        }
    }

    fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "follow" => Ok(RedirectPolicy::Follow),
            "error" => Ok(RedirectPolicy::Error),
            "manual" => Ok(RedirectPolicy::Manual),
            _ => Err(format!("Unknown redirect policy: {}", s)),
        }
    }
}

impl<'js> FromJs<'js> for RedirectPolicy {
    fn from_js(ctx: &Ctx<'js>, value: Value<'js>) -> rquickjs::Result<Self> {
        let s = String::from_js(ctx, value)?;
        RedirectPolicy::from_str(&s).map_err(|e| Exception::throw_message(ctx, &e))
    }
}

impl<'js> IntoJs<'js> for RedirectPolicy {
    fn into_js(self, ctx: &Ctx<'js>) -> rquickjs::Result<Value<'js>> {
        self.as_str().into_js(ctx)
    }
}

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
    mode: RequestMode,
    referer: String,
    referrer_policy: ReferrerPolicy,
    credentials: CredentialsMode,
    redirect_policy: RedirectPolicy,
    #[qjs(skip_trace)]
    body: Option<Body>,
    #[qjs(skip_trace)]
    body_bytes: Option<Vec<u8>>,
    #[qjs(skip_trace)]
    execution: Option<CustomRequestExecution>,
    #[qjs(skip_trace)]
    redirect_count: usize,
}

impl Default for HttpRequest {
    fn default() -> Self {
        HttpRequest {
            method: Method::GET,
            url: Url::parse("http://localhost").expect("failed to parse default URL"),
            headers: HashMap::new(),
            version: Version::HTTP_11,
            mode: RequestMode::Cors,
            referer: "about:client".to_string(),
            referrer_policy: ReferrerPolicy::StrictOriginWhenCrossOrigin,
            credentials: CredentialsMode::SameOrigin,
            redirect_policy: RedirectPolicy::Follow,
            body: None,
            body_bytes: None,
            execution: None,
            redirect_count: 0,
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
        mode: RequestMode,
        referer: String,
        referrer_policy: ReferrerPolicy,
        credentials: CredentialsMode,
        redirect_policy: RedirectPolicy,
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
            credentials,
            redirect_policy,
            body: None,
            body_bytes: None,
            execution: None,
            redirect_count: 0,
        }
    }

    pub fn array_buffer_body(&mut self, body: ArrayBuffer<'_>) {
        self.body_bytes = Some(body.as_bytes().map(|b| b.to_vec()).unwrap_or_default());
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
        self.body_bytes = Some(body.into_bytes());
    }

    pub fn uint8_array_body(&mut self, body: rquickjs::TypedArray<'_, u8>) {
        self.body_bytes = Some(body.as_bytes().map(|b| b.to_vec()).unwrap_or_default());
    }

    pub fn add_header(&mut self, name: String, value: String) {
        let header_name =
            HeaderName::from_bytes(name.as_bytes()).expect("failed to parse header name");
        let header_value = HeaderValue::from_str(&value).expect("failed to parse header value");
        self.headers.insert(header_name, header_value);
    }

    #[qjs(get)]
    pub fn mode(&self) -> RequestMode {
        self.mode
    }

    #[qjs(get)]
    pub fn referer(&self) -> String {
        self.referer.clone()
    }

    #[qjs(get, rename = "referrerPolicy")]
    pub fn referrer_policy(&self) -> ReferrerPolicy {
        self.referrer_policy
    }

    #[qjs(get)]
    pub fn credentials(&self) -> CredentialsMode {
        self.credentials
    }

    #[qjs(get)]
    pub fn url(&self) -> String {
        self.url.to_string()
    }

    #[qjs(get)]
    pub fn redirect(&self) -> RedirectPolicy {
        self.redirect_policy
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

        // Apply credentials filtering based on credentials mode
        apply_credentials_filtering(request.headers_mut(), self.credentials, &self.url);

        // Apply referrer policy and set Referer header if appropriate
        if let Some(referer_header_value) =
            apply_referrer_policy(self.referrer_policy, &self.referer, &self.url)
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

    pub async fn simple_send<'js>(&mut self, ctx: Ctx<'js>) -> rquickjs::Result<HttpResponse> {
        // Validate mode constraints
        if self.mode == RequestMode::NoCors {
            let method_str = self.method.to_string().to_uppercase();
            if !matches!(method_str.as_str(), "GET" | "HEAD" | "POST") {
                return Err(Exception::throw_message(
                    &ctx,
                    "no-cors mode only allows GET, HEAD, or POST methods",
                ));
            }
        } else if self.mode == RequestMode::Navigate {
            return Err(Exception::throw_message(
                &ctx,
                "navigate mode is not supported in WASM context",
            ));
        } else if !matches!(self.mode, RequestMode::Cors | RequestMode::SameOrigin) {
            return Err(Exception::throw_message(
                &ctx,
                &format!("Unsupported request mode: {}", self.mode.as_str()),
            ));
        }

        let max_redirects = 20;
        let mut current_redirects = 0;

        loop {
            let client = golem_wasi_http::ClientBuilder::new()
                .build()
                .expect("Failed to create HTTP client");

            let mut request = Request::new(self.method.clone(), self.url.clone());

            *request.version_mut() = self.version;
            for (name, value) in &self.headers {
                request.headers_mut().insert(name.clone(), value.clone());
            }

            // Apply credentials filtering based on credentials mode
            apply_credentials_filtering(request.headers_mut(), self.credentials, &self.url);

            // Apply referrer policy and set Referer header if appropriate
            if let Some(referer_header_value) =
                apply_referrer_policy(self.referrer_policy, &self.referer, &self.url)
            {
                let referer_header = HeaderValue::from_str(&referer_header_value)
                    .expect("failed to parse referer value");
                request.headers_mut().insert(
                    HeaderName::from_bytes(b"referer")
                        .expect("failed to create referer header name"),
                    referer_header,
                );
            }

            if let Some(body_bytes) = &self.body_bytes {
                *request.body_mut() = Some(Body::from(body_bytes.clone()));
            } else if let Some(_) = &self.body {
                // NOTE: if the request body was not buffered, we were only able to use it once
                // not for followed redirects.
                *request.body_mut() = self.body.take();
            }

            let response = client.execute(request).await.expect("HTTP request failed");

            let is_redirection = response.status().is_redirection();
            let status_code = response.status().as_u16();
            let is_supported_redirection =
                is_redirection && status_code != 304 && status_code != 305 && status_code != 306;

            // Check for redirect
            if self.redirect_policy == RedirectPolicy::Follow && is_supported_redirection {
                if current_redirects >= max_redirects {
                    return Err(Exception::throw_message(
                        &ctx,
                        "Maximum number of redirects exceeded",
                    ));
                }

                let location = response
                    .headers()
                    .get(&HeaderName::from_bytes(b"location").unwrap());
                if let Some(location) = location {
                    let location_str = location.to_str().unwrap_or("");
                    match Url::parse(location_str).or_else(|_| self.url.join(location_str)) {
                        Ok(new_url) => {
                            let mut new_method = self.method.clone();
                            let mut drop_body = false;

                            if status_code == 303 {
                                new_method = Method::GET;
                                drop_body = true;
                            } else if (status_code == 301 || status_code == 302)
                                && self.method == Method::POST
                            {
                                new_method = Method::GET;
                                drop_body = true;
                            }

                            self.redirect_count += 1;
                            current_redirects += 1;
                            self.url = new_url;
                            self.method = new_method;
                            if drop_body {
                                self.body = None;
                            }
                            // loop again
                            continue;
                        }
                        Err(_) => {
                            // Failed to parse location, just return the redirect response
                        }
                    }
                }
            } else if self.redirect_policy == RedirectPolicy::Error && is_supported_redirection {
                return Err(Exception::throw_message(&ctx, "Unexpected redirect"));
            }

            let mut http_response = HttpResponse::from_response(response);
            http_response.set_redirected(current_redirects > 0);

            if self.redirect_policy == RedirectPolicy::Manual && is_supported_redirection {
                http_response.make_opaque();
                return Ok(http_response);
            }

            // For no-cors mode, make the response opaque
            if self.mode == RequestMode::NoCors {
                http_response.make_opaque();
            }

            return Ok(http_response);
        }
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
    redirected: bool,
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
            redirected: false,
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
            redirected: false,
        }
    }

    #[qjs(rename = "makeOpaque")]
    pub fn make_opaque(&mut self) {
        self.is_opaque = true;
        // For opaque responses, clear headers and set status to 0
        self.headers.clear();
        self.status = golem_wasi_http::StatusCode::OK; // Will report as 0 when is_opaque is true
    }

    #[qjs(get)]
    pub fn redirected(&self) -> bool {
        self.redirected
    }

    #[qjs(set, rename = "redirected")]
    pub fn set_redirected(&mut self, redirected: bool) {
        self.redirected = redirected;
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

    #[qjs(get)]
    pub fn is_opaque(&self) -> bool {
        self.is_opaque
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
    policy: ReferrerPolicy,
    referer: &str,
    request_url: &Url,
) -> Option<String> {
    // Policy: no-referrer - never send
    if policy == ReferrerPolicy::NoReferrer {
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
        ReferrerPolicy::NoReferrerWhenDowngrade => {
            if is_downgrade {
                None
            } else {
                Some(referer.to_string())
            }
        }
        // origin: always send origin only
        ReferrerPolicy::Origin => Some(referer_origin),
        // origin-when-cross-origin: full for same-origin, origin for cross-origin
        ReferrerPolicy::OriginWhenCrossOrigin => {
            if is_same_origin {
                Some(referer.to_string())
            } else {
                Some(referer_origin)
            }
        }
        // same-origin: full for same-origin, none for cross-origin
        ReferrerPolicy::SameOrigin => {
            if is_same_origin {
                Some(referer.to_string())
            } else {
                None
            }
        }
        // strict-origin: origin only, none for HTTPS->HTTP
        ReferrerPolicy::StrictOrigin => {
            if is_downgrade {
                None
            } else {
                Some(referer_origin)
            }
        }
        // strict-origin-when-cross-origin (default): full for same-origin, origin for cross-origin, none for HTTPS->HTTP
        ReferrerPolicy::StrictOriginWhenCrossOrigin => {
            if is_downgrade {
                None
            } else if is_same_origin {
                Some(referer.to_string())
            } else {
                Some(referer_origin)
            }
        }
        // unsafe-url: always send full URL
        ReferrerPolicy::UnsafeUrl => Some(referer.to_string()),
        // no-referrer should already be handled above
        ReferrerPolicy::NoReferrer => None,
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

/// Applies credentials filtering based on the credentials mode and origin policy
/// According to fetch spec:
/// - Omit: Never send credentials
/// - SameOrigin: Send credentials only for same-origin requests
/// - Include: Always send credentials
fn apply_credentials_filtering(
    headers: &mut golem_wasi_http::header::HeaderMap,
    credentials: CredentialsMode,
    _request_url: &Url,
) {
    match credentials {
        CredentialsMode::Omit => {
            // Remove Authorization and Cookie headers
            headers.remove(&HeaderName::from_bytes(b"authorization").expect("valid header name"));
            headers.remove(&HeaderName::from_bytes(b"cookie").expect("valid header name"));
        }
        CredentialsMode::SameOrigin | CredentialsMode::Include => {
            // Keep all headers as-is for these modes
            // In a full browser context, "same-origin" would only send credentials for same-origin,
            // but in WASM we don't have the referrer context to determine origin properly.
        }
    }
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

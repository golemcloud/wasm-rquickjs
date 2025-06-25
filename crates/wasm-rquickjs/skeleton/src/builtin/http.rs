// Native functions for the timeout implementation
#[rquickjs::module]
pub mod native_module {
    pub use super::HttpRequest;
    pub use super::HttpResponse;
}

use reqwest::header::{HeaderName, HeaderValue};
use reqwest::{Body, Method, Request, Url, Version};
use rquickjs::class::Trace;
use rquickjs::{ArrayBuffer, JsLifetime};
use std::collections::HashMap;

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
    #[qjs(skip_trace)]
    body: Option<Body>,
}

impl Default for HttpRequest {
    fn default() -> Self {
        HttpRequest {
            method: Method::GET,
            url: Url::parse("http://localhost").expect("failed to parse default URL"),
            headers: HashMap::new(),
            version: Version::HTTP_11,
            body: None,
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
    ) -> Self {
        let url: Url = url.parse().expect("failed to parse url");
        let method: Method = method.parse().expect("failed to parse method");
        let version = match version.as_str() {
            "HTTP/0.9" => Version::HTTP_09,
            "HTTP/1.0" => Version::HTTP_10,
            "HTTP/1.1" => Version::HTTP_11,
            "HTTP/2.0" => Version::HTTP_2,
            "HTTP/3.0" => Version::HTTP_3,
            _ => panic!("Unsupported HTTP version: {}", version),
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
            body: None,
        }
    }

    pub fn array_buffer_body(&mut self, body: ArrayBuffer<'_>) {
        self.body = body.as_bytes().map(|b| Body::from(b.to_vec()));
    }

    pub fn uint8_array_body(&mut self, body: rquickjs::TypedArray<'_, u8>) {
        self.body = body.as_bytes().map(|b| Body::from(b.to_vec()));
    }

    pub fn string_body(&mut self, body: String) {
        self.body = Some(Body::from(body));
    }

    pub async fn send(&mut self) -> HttpResponse {
        let client = reqwest::ClientBuilder::new()
            .build()
            .expect("Failed to create HTTP client");

        let mut request = Request::new(self.method.clone(), self.url.clone());

        *request.version_mut() = self.version;
        for (name, value) in &self.headers {
            request.headers_mut().insert(name.clone(), value.clone());
        }

        *request.body_mut() = self.body.take();

        let response = client.execute(request).expect("HTTP request failed");

        HttpResponse {
            response: Some(response),
        }
    }
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct HttpResponse {
    #[qjs(skip_trace)]
    response: Option<reqwest::Response>,
}

#[rquickjs::methods(rename_all = "camelCase")]
impl HttpResponse {
    #[qjs(constructor)]
    pub fn new() -> Self {
        Self { response: None }
    }

    #[qjs(get)]
    pub fn headers(&self) -> Vec<Vec<String>> {
        self.response
            .as_ref()
            .expect("The response has not been set")
            .headers()
            .iter()
            .map(|(name, value)| {
                vec![
                    name.to_string(),
                    value.to_str().unwrap_or("Invalid header value").to_string(),
                ]
            })
            .collect()
    }

    #[qjs(get)]
    pub fn status(&self) -> u16 {
        self.response
            .as_ref()
            .expect("The response has not been set")
            .status()
            .as_u16()
    }

    #[qjs(get, rename = "statusText")]
    pub fn status_text(&self) -> String {
        self.response
            .as_ref()
            .expect("The response has not been set")
            .status()
            .canonical_reason()
            .unwrap_or("Unknown status")
            .to_string()
    }

    pub async fn text(&mut self) -> String {
        self.response
            .take()
            .expect("The response has already been consumed")
            .text()
            .expect("failed to read response body")
    }
}

// JS functions for the console implementation
pub const HTTP_JS: &str = include_str!("http.js");

// JS code wiring the console module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_http from '__wasm_rquickjs_builtin/http';
        globalThis.fetch = __wasm_rquickjs_http.fetch;
        globalThis.Headers = __wasm_rquickjs_http.Headers;
        globalThis.Response = __wasm_rquickjs_http.Response;
    "#;

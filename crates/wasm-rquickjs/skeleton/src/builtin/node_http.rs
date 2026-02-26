use golem_wasi_http::header::{HeaderName, HeaderValue};
use golem_wasi_http::{Body, Method, Request, StreamError, Url};
use rquickjs::class::Trace;
use rquickjs::prelude::List;
use rquickjs::{Ctx, Exception, JsLifetime, TypedArray};
use std::collections::HashMap;
use wstd::runtime::AsyncPollable;

#[rquickjs::module]
pub mod native_module {
    pub use super::NodeHttpClientRequest;
    pub use super::NodeHttpIncomingResponse;
}

enum ResponseBodyState {
    Native(golem_wasi_http::Response),
    Stream {
        stream: golem_wasi_http::InputStream,
        body: golem_wasi_http::IncomingBody,
        response: golem_wasi_http::Response,
    },
    Consumed,
}

enum PendingResponse {
    Ready(golem_wasi_http::Response),
    None,
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct NodeHttpClientRequest {
    method: String,
    url: String,
    #[qjs(skip_trace)]
    headers: HashMap<String, String>,
    #[qjs(skip_trace)]
    body_chunks: Vec<u8>,
    #[qjs(skip_trace)]
    pending: PendingResponse,
    aborted: bool,
    sent: bool,
}

impl Default for NodeHttpClientRequest {
    fn default() -> Self {
        Self::new(
            "GET".to_string(),
            "http://localhost".to_string(),
            HashMap::new(),
        )
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl NodeHttpClientRequest {
    #[qjs(constructor)]
    pub fn new(method: String, url: String, headers: HashMap<String, String>) -> Self {
        NodeHttpClientRequest {
            method,
            url,
            headers,
            body_chunks: Vec::new(),
            pending: PendingResponse::None,
            aborted: false,
            sent: false,
        }
    }

    pub fn write<'js>(&mut self, ctx: Ctx<'js>, chunk: TypedArray<'js, u8>) -> rquickjs::Result<()> {
        if self.aborted {
            return Err(Exception::throw_message(&ctx, "Request has been aborted"));
        }
        if self.sent {
            return Err(Exception::throw_message(&ctx, "Request has already been sent"));
        }
        let bytes = chunk.as_bytes().ok_or_else(|| {
            Exception::throw_message(&ctx, "the Uint8Array passed to write is detached")
        })?;
        self.body_chunks.extend_from_slice(bytes);
        Ok(())
    }

    pub fn write_string<'js>(&mut self, ctx: Ctx<'js>, data: String) -> rquickjs::Result<()> {
        if self.aborted {
            return Err(Exception::throw_message(&ctx, "Request has been aborted"));
        }
        if self.sent {
            return Err(Exception::throw_message(&ctx, "Request has already been sent"));
        }
        self.body_chunks.extend_from_slice(data.as_bytes());
        Ok(())
    }

    pub fn set_header<'js>(
        &mut self,
        ctx: Ctx<'js>,
        name: String,
        value: String,
    ) -> rquickjs::Result<()> {
        if self.sent {
            return Err(Exception::throw_message(
                &ctx,
                "Cannot set headers after request has been sent",
            ));
        }
        self.headers.insert(name, value);
        Ok(())
    }

    pub fn remove_header<'js>(&mut self, ctx: Ctx<'js>, name: String) -> rquickjs::Result<()> {
        if self.sent {
            return Err(Exception::throw_message(
                &ctx,
                "Cannot remove headers after request has been sent",
            ));
        }
        self.headers.remove(&name);
        Ok(())
    }

    pub async fn end<'js>(
        &mut self,
        ctx: Ctx<'js>,
        chunk: Option<TypedArray<'js, u8>>,
    ) -> rquickjs::Result<()> {
        if self.aborted {
            return Err(Exception::throw_message(&ctx, "Request has been aborted"));
        }
        if self.sent {
            return Err(Exception::throw_message(&ctx, "Request has already been sent"));
        }

        if let Some(chunk) = chunk {
            let bytes = chunk.as_bytes().ok_or_else(|| {
                Exception::throw_message(&ctx, "the Uint8Array passed to end is detached")
            })?;
            self.body_chunks.extend_from_slice(bytes);
        }

        self.sent = true;

        let parsed_url: Url = self
            .url
            .parse()
            .map_err(|_| Exception::throw_message(&ctx, "failed to parse url"))?;
        let method: Method = self
            .method
            .parse()
            .map_err(|_| Exception::throw_message(&ctx, "failed to parse method"))?;

        let client = golem_wasi_http::ClientBuilder::new()
            .build()
            .map_err(|_| Exception::throw_message(&ctx, "Failed to create HTTP client"))?;

        let mut request = Request::new(method, parsed_url);

        for (name, value) in &self.headers {
            let header_name = HeaderName::from_bytes(name.as_bytes())
                .map_err(|_| Exception::throw_message(&ctx, "failed to parse header name"))?;
            let header_value = HeaderValue::from_str(value)
                .map_err(|_| Exception::throw_message(&ctx, "failed to parse header value"))?;
            request.headers_mut().insert(header_name, header_value);
        }

        if !self.body_chunks.is_empty() {
            let body_bytes = std::mem::take(&mut self.body_chunks);
            *request.body_mut() = Some(Body::from(body_bytes));
        }

        let response = client
            .execute(request)
            .await
            .map_err(|err| Exception::throw_message(&ctx, &format!("HTTP request failed: {err}")))?;

        self.pending = PendingResponse::Ready(response);

        Ok(())
    }

    pub fn get_response<'js>(
        &mut self,
        _ctx: Ctx<'js>,
    ) -> Option<NodeHttpIncomingResponse> {
        if self.aborted {
            return None;
        }

        match std::mem::replace(&mut self.pending, PendingResponse::None) {
            PendingResponse::Ready(response) => {
                Some(NodeHttpIncomingResponse::from_response(response))
            }
            PendingResponse::None => None,
        }
    }

    pub fn abort(&mut self) {
        self.aborted = true;
        self.pending = PendingResponse::None;
    }
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class(rename_all = "camelCase")]
pub struct NodeHttpIncomingResponse {
    #[qjs(skip_trace)]
    body_state: ResponseBodyState,
    headers: Vec<Vec<String>>,
    status: u16,
}

impl Default for NodeHttpIncomingResponse {
    fn default() -> Self {
        Self::new()
    }
}

#[rquickjs::methods(rename_all = "camelCase")]
impl NodeHttpIncomingResponse {
    #[qjs(constructor)]
    pub fn new() -> Self {
        NodeHttpIncomingResponse {
            body_state: ResponseBodyState::Consumed,
            headers: Vec::new(),
            status: 0,
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

        let status = response.status().as_u16();

        NodeHttpIncomingResponse {
            body_state: ResponseBodyState::Native(response),
            headers,
            status,
        }
    }

    #[qjs(get)]
    pub fn status(&self) -> u16 {
        self.status
    }

    #[qjs(get)]
    pub fn headers(&self) -> Vec<Vec<String>> {
        self.headers.clone()
    }

    pub fn discard_body(&mut self) {
        let state = std::mem::replace(&mut self.body_state, ResponseBodyState::Consumed);
        match state {
            ResponseBodyState::Native(response) => {
                drop(response);
            }
            ResponseBodyState::Stream {
                stream,
                body,
                response,
            } => {
                drop(stream);
                drop(body);
                drop(response);
            }
            ResponseBodyState::Consumed => {}
        }
    }

    pub async fn read_body_chunk<'js>(
        &mut self,
        ctx: Ctx<'js>,
    ) -> rquickjs::Result<List<(Option<TypedArray<'js, u8>>, bool)>> {
        let state = std::mem::replace(&mut self.body_state, ResponseBodyState::Consumed);

        match state {
            ResponseBodyState::Native(mut response) => {
                let (stream, body) = response.get_raw_input_stream();
                self.body_state = ResponseBodyState::Stream {
                    stream,
                    body,
                    response,
                };
                self.read_from_stream(ctx).await
            }
            ResponseBodyState::Stream {
                stream,
                body,
                response,
            } => {
                self.body_state = ResponseBodyState::Stream {
                    stream,
                    body,
                    response,
                };
                self.read_from_stream(ctx).await
            }
            ResponseBodyState::Consumed => Ok(List((None, true))),
        }
    }
}

impl NodeHttpIncomingResponse {
    async fn read_from_stream<'js>(
        &mut self,
        ctx: Ctx<'js>,
    ) -> rquickjs::Result<List<(Option<TypedArray<'js, u8>>, bool)>> {
        let state = std::mem::replace(&mut self.body_state, ResponseBodyState::Consumed);

        if let ResponseBodyState::Stream {
            stream,
            body,
            response,
        } = state
        {
            const CHUNK_SIZE: u64 = 4096;
            let pollable = stream.subscribe();
            AsyncPollable::new(pollable).wait_for().await;

            match stream.read(CHUNK_SIZE) {
                Ok(chunk) => {
                    let js_array = TypedArray::new_copy(ctx.clone(), chunk).map_err(|_| {
                        Exception::throw_message(
                            &ctx,
                            "Failed to create TypedArray from response body chunk",
                        )
                    })?;
                    self.body_state = ResponseBodyState::Stream {
                        stream,
                        body,
                        response,
                    };
                    Ok(List((Some(js_array), false)))
                }
                Err(StreamError::Closed) => {
                    drop(stream);
                    drop(body);
                    drop(response);
                    Ok(List((None, true)))
                }
                Err(StreamError::LastOperationFailed(err)) => Err(Exception::throw_message(
                    &ctx,
                    &format!("Failed to read response body: {}", err.to_debug_string()),
                )),
            }
        } else {
            Ok(List((None, true)))
        }
    }
}

pub const NODE_HTTP_JS: &str = include_str!("node_http.js");
pub const NODE_HTTP_SERVER_JS: &str = include_str!("node_http_server.js");
pub const REEXPORT_JS: &str =
    r#"export * from 'node:http'; export { default } from 'node:http';"#;

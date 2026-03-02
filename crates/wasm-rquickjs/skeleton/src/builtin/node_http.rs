use rquickjs::class::Trace;
use rquickjs::prelude::List;
use rquickjs::{Ctx, Exception, JsLifetime, TypedArray};
use std::collections::HashMap;
use wasi::http::outgoing_handler;
use wasi::http::types as wasi_http;
use wasi::io::streams::{InputStream, OutputStream, StreamError};
use wstd::runtime::AsyncPollable;

#[rquickjs::module]
pub mod native_module {
    pub use super::NodeHttpClientRequest;
    pub use super::NodeHttpIncomingResponse;
}

enum ResponseBodyState {
    WasiNative {
        incoming_response: wasi_http::IncomingResponse,
    },
    Stream {
        stream: InputStream,
        body: wasi_http::IncomingBody,
        incoming_response: wasi_http::IncomingResponse,
    },
    Consumed,
}

pub(crate) struct RawResponse {
    status: u16,
    headers: Vec<Vec<String>>,
    incoming_response: wasi_http::IncomingResponse,
}

enum PendingResponse {
    Ready(RawResponse),
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

        let parsed_url: url::Url = self
            .url
            .parse()
            .map_err(|_| Exception::throw_message(&ctx, "failed to parse url"))?;

        let scheme = match parsed_url.scheme() {
            "http" => wasi_http::Scheme::Http,
            "https" => wasi_http::Scheme::Https,
            other => wasi_http::Scheme::Other(other.to_string()),
        };

        let header_entries: Vec<(String, Vec<u8>)> = self
            .headers
            .iter()
            .map(|(name, value)| (name.clone(), value.as_bytes().to_vec()))
            .collect();

        let fields = wasi_http::Fields::from_list(&header_entries)
            .map_err(|_| Exception::throw_message(&ctx, "failed to create request headers"))?;

        let outgoing_request = wasi_http::OutgoingRequest::new(fields);

        let wasi_method = match self.method.as_str() {
            "GET" => wasi_http::Method::Get,
            "POST" => wasi_http::Method::Post,
            "PUT" => wasi_http::Method::Put,
            "DELETE" => wasi_http::Method::Delete,
            "HEAD" => wasi_http::Method::Head,
            "OPTIONS" => wasi_http::Method::Options,
            "CONNECT" => wasi_http::Method::Connect,
            "PATCH" => wasi_http::Method::Patch,
            "TRACE" => wasi_http::Method::Trace,
            other => wasi_http::Method::Other(other.to_string()),
        };

        outgoing_request
            .set_method(&wasi_method)
            .map_err(|_| Exception::throw_message(&ctx, "failed to set method"))?;

        let path_with_query = match parsed_url.query() {
            Some(query) => format!("{}?{}", parsed_url.path(), query),
            None => parsed_url.path().to_string(),
        };
        outgoing_request
            .set_path_with_query(Some(&path_with_query))
            .map_err(|_| Exception::throw_message(&ctx, "failed to set path"))?;
        outgoing_request
            .set_scheme(Some(&scheme))
            .map_err(|_| Exception::throw_message(&ctx, "failed to set scheme"))?;
        outgoing_request
            .set_authority(Some(parsed_url.authority()))
            .map_err(|_| Exception::throw_message(&ctx, "failed to set authority"))?;

        if !self.body_chunks.is_empty() {
            let body = outgoing_request
                .body()
                .map_err(|_| Exception::throw_message(&ctx, "failed to get request body"))?;
            let stream = body
                .write()
                .map_err(|_| Exception::throw_message(&ctx, "failed to get body stream"))?;

            let body_bytes = std::mem::take(&mut self.body_chunks);
            write_all_to_stream(&ctx, &stream, &body_bytes).await?;
            drop(stream);

            wasi_http::OutgoingBody::finish(body, None)
                .map_err(|_| Exception::throw_message(&ctx, "failed to finish request body"))?;
        }

        let future_response = outgoing_handler::handle(outgoing_request, None)
            .map_err(|err| {
                Exception::throw_message(&ctx, &format!("HTTP request failed: {err:?}"))
            })?;

        let incoming_response = get_incoming_response(&ctx, &future_response).await?;

        let status = incoming_response.status();
        let response_fields = incoming_response.headers();
        let raw_entries = response_fields.entries();
        let headers: Vec<Vec<String>> = raw_entries
            .into_iter()
            .map(|(name, value)| {
                vec![
                    name,
                    String::from_utf8(value)
                        .unwrap_or_else(|_| "Invalid header value".to_string()),
                ]
            })
            .collect();

        self.pending = PendingResponse::Ready(RawResponse {
            status,
            headers,
            incoming_response,
        });

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
            PendingResponse::Ready(raw) => {
                Some(NodeHttpIncomingResponse::from_raw_response(raw))
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
    pub fn from_raw_response(raw: RawResponse) -> Self {
        NodeHttpIncomingResponse {
            body_state: ResponseBodyState::WasiNative {
                incoming_response: raw.incoming_response,
            },
            headers: raw.headers,
            status: raw.status,
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
            ResponseBodyState::WasiNative { incoming_response } => {
                drop(incoming_response);
            }
            ResponseBodyState::Stream {
                stream,
                body,
                incoming_response,
            } => {
                drop(stream);
                drop(body);
                drop(incoming_response);
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
            ResponseBodyState::WasiNative { incoming_response } => {
                let incoming_body = incoming_response
                    .consume()
                    .map_err(|_| Exception::throw_message(&ctx, "failed to consume response body"))?;
                let stream = incoming_body
                    .stream()
                    .map_err(|_| Exception::throw_message(&ctx, "failed to get body stream"))?;
                self.body_state = ResponseBodyState::Stream {
                    stream,
                    body: incoming_body,
                    incoming_response,
                };
                self.read_from_stream(ctx).await
            }
            ResponseBodyState::Stream {
                stream,
                body,
                incoming_response,
            } => {
                self.body_state = ResponseBodyState::Stream {
                    stream,
                    body,
                    incoming_response,
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
            incoming_response,
        } = state
        {
            const CHUNK_SIZE: u64 = 4096;
            loop {
                match stream.read(CHUNK_SIZE) {
                    Ok(chunk) if !chunk.is_empty() => {
                        let js_array = TypedArray::new_copy(ctx.clone(), chunk).map_err(|_| {
                            Exception::throw_message(
                                &ctx,
                                "Failed to create TypedArray from response body chunk",
                            )
                        })?;
                        self.body_state = ResponseBodyState::Stream {
                            stream,
                            body,
                            incoming_response,
                        };
                        return Ok(List((Some(js_array), false)));
                    }
                    Ok(_) => {
                        let pollable = stream.subscribe();
                        AsyncPollable::new(pollable).wait_for().await;
                    }
                    Err(StreamError::Closed) => {
                        drop(stream);
                        drop(body);
                        drop(incoming_response);
                        return Ok(List((None, true)));
                    }
                    Err(StreamError::LastOperationFailed(err)) => {
                        let debug_message = err.to_debug_string();
                        if debug_message.to_ascii_lowercase().contains("would") {
                            let pollable = stream.subscribe();
                            AsyncPollable::new(pollable).wait_for().await;
                            continue;
                        }

                        return Err(Exception::throw_message(
                            &ctx,
                            &format!("Failed to read response body: {debug_message}"),
                        ));
                    }
                }
            }
        } else {
            Ok(List((None, true)))
        }
    }
}

async fn get_incoming_response<'js>(
    ctx: &Ctx<'js>,
    future_response: &wasi_http::FutureIncomingResponse,
) -> rquickjs::Result<wasi_http::IncomingResponse> {
    match future_response.get() {
        Some(Ok(Ok(incoming_response))) => Ok(incoming_response),
        Some(Ok(Err(err))) => Err(Exception::throw_message(
            ctx,
            &format!("HTTP request failed: {err:?}"),
        )),
        Some(Err(())) => Err(Exception::throw_message(ctx, "HTTP request failed")),
        None => {
            let pollable = future_response.subscribe();
            AsyncPollable::new(pollable).wait_for().await;
            match future_response.get() {
                Some(Ok(Ok(incoming_response))) => Ok(incoming_response),
                Some(Ok(Err(err))) => Err(Exception::throw_message(
                    ctx,
                    &format!("HTTP request failed: {err:?}"),
                )),
                _ => Err(Exception::throw_message(ctx, "HTTP request failed")),
            }
        }
    }
}

async fn write_all_to_stream<'js>(
    ctx: &Ctx<'js>,
    stream: &OutputStream,
    data: &[u8],
) -> rquickjs::Result<()> {
    let mut offset = 0;
    while offset < data.len() {
        let remaining = &data[offset..];
        match stream.check_write() {
            Ok(0) => {
                let pollable = stream.subscribe();
                AsyncPollable::new(pollable).wait_for().await;
            }
            Ok(permit) => {
                let to_write = std::cmp::min(permit as usize, remaining.len());
                stream
                    .write(&remaining[..to_write])
                    .map_err(|_| Exception::throw_message(ctx, "failed to write request body"))?;
                offset += to_write;
            }
            Err(_) => {
                return Err(Exception::throw_message(ctx, "failed to write request body"));
            }
        }
    }
    stream
        .flush()
        .map_err(|_| Exception::throw_message(ctx, "failed to flush request body"))?;
    let pollable = stream.subscribe();
    AsyncPollable::new(pollable).wait_for().await;
    Ok(())
}

pub const NODE_HTTP_JS: &str = include_str!("node_http.js");
pub const NODE_HTTP_SERVER_JS: &str = include_str!("node_http_server.js");
pub const HTTP_COMMON_JS: &str = include_str!("node_http_common.js");
pub const REEXPORT_JS: &str =
    r#"export * from 'node:http'; export { default } from 'node:http';"#;

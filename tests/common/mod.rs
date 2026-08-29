pub mod js_subtest_parser;
pub mod test_server;

use crate::common::WasmSource::Precompiled;
use anyhow::anyhow;
use bytes::Buf;
use camino::{Utf8Path, Utf8PathBuf};
use camino_tempfile::{NamedUtf8TempFile, Utf8TempDir};
use futures::FutureExt;
use heck::ToSnakeCase;
use http_body::{Body as HttpBody, Frame, SizeHint};
use http_body_util::BodyExt;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs;
use std::future::Future;
use std::hash::{Hash, Hasher};
use std::io::{Read, Write};
use std::pin::Pin;
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::task::{Context, Poll};
use std::thread;
use std::time::{Duration, Instant, SystemTime};
use tokio::time::timeout;
use wac_graph::types::{Package, SubtypeChecker};
use wac_graph::{CompositionGraph, EncodeOptions, PackageId, PlugError};
use wasm_rquickjs::{
    EmbeddingMode, GenerationTarget, JsModuleSpec, generate_wrapper_crate_with_target,
};
use wasmtime::component::{
    Component, Func, HasSelf, Instance, Linker, Resource, ResourceAny, ResourceTable, ResourceType,
    Val,
};
use wasmtime::{Engine, Store, StoreContextMut, UpdateDeadline};
use wasmtime_wasi::cli::OutputFile;
use wasmtime_wasi::p2::bindings;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtx, WasiCtxView, WasiView};
use wasmtime_wasi_http::WasiHttpCtx;
use wasmtime_wasi_http::p2::{WasiHttpCtxView, WasiHttpView};

pub mod ws_mock_p2 {
    wasmtime::component::bindgen!({
        world: "golem-websocket",
        path: "crates/golem-websocket/wit",
        imports: { default: async | trappable },
        with: {
            "golem:websocket/client.websocket-connection": super::WsMockConnection,
        },
    });
}

pub mod ws_mock_p3 {
    wasmtime::component::bindgen!({
        world: "golem-websocket",
        path: "crates/golem-websocket/wit-p3",
        imports: { default: async | trappable },
        with: {
            "golem:websocket/client.websocket-connection": super::WsMockConnection,
        },
    });
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WsSentMessage {
    Text(String),
    Binary(Vec<u8>),
    Close(Option<u16>, Option<String>),
}

pub struct WsMockConnection;

impl ws_mock_p2::golem::websocket::client::Host for Host {}

impl ws_mock_p2::golem::websocket::client::HostWebsocketConnection for Host {
    async fn connect(
        &mut self,
        _url: String,
        _headers: Option<Vec<(String, String)>>,
    ) -> wasmtime::Result<
        Result<Resource<WsMockConnection>, ws_mock_p2::golem::websocket::client::Error>,
    > {
        Ok(Ok(self.table.lock().unwrap().push(WsMockConnection)?))
    }

    async fn send(
        &mut self,
        _self_: Resource<WsMockConnection>,
        message: ws_mock_p2::golem::websocket::client::Message,
    ) -> wasmtime::Result<Result<(), ws_mock_p2::golem::websocket::client::Error>> {
        let message = match message {
            ws_mock_p2::golem::websocket::client::Message::Text(value) => {
                WsSentMessage::Text(value)
            }
            ws_mock_p2::golem::websocket::client::Message::Binary(value) => {
                WsSentMessage::Binary(value)
            }
        };
        self.ws_sent.lock().unwrap().push(message);
        Ok(Ok(()))
    }

    async fn receive(
        &mut self,
        _self_: Resource<WsMockConnection>,
    ) -> wasmtime::Result<
        Result<
            ws_mock_p2::golem::websocket::client::Message,
            ws_mock_p2::golem::websocket::client::Error,
        >,
    > {
        Ok(Err(ws_mock_p2::golem::websocket::client::Error::Closed(
            None,
        )))
    }

    async fn receive_with_timeout(
        &mut self,
        _self_: Resource<WsMockConnection>,
        _timeout_ms: u64,
    ) -> wasmtime::Result<
        Result<
            Option<ws_mock_p2::golem::websocket::client::Message>,
            ws_mock_p2::golem::websocket::client::Error,
        >,
    > {
        Ok(Err(ws_mock_p2::golem::websocket::client::Error::Closed(
            None,
        )))
    }

    async fn close(
        &mut self,
        _self_: Resource<WsMockConnection>,
        code: Option<u16>,
        reason: Option<String>,
    ) -> wasmtime::Result<Result<(), ws_mock_p2::golem::websocket::client::Error>> {
        self.ws_sent
            .lock()
            .unwrap()
            .push(WsSentMessage::Close(code, reason));
        Ok(Ok(()))
    }

    async fn drop(&mut self, rep: Resource<WsMockConnection>) -> wasmtime::Result<()> {
        self.table.lock().unwrap().delete(rep)?;
        Ok(())
    }
}

impl ws_mock_p3::golem::websocket::client::Host for Host {}

impl ws_mock_p3::golem::websocket::client::HostWebsocketConnection for Host {
    async fn connect(
        &mut self,
        _url: String,
        _headers: Option<Vec<(String, String)>>,
    ) -> wasmtime::Result<
        Result<Resource<WsMockConnection>, ws_mock_p3::golem::websocket::client::Error>,
    > {
        Ok(Ok(self.table.lock().unwrap().push(WsMockConnection)?))
    }

    async fn send(
        &mut self,
        _self_: Resource<WsMockConnection>,
        message: ws_mock_p3::golem::websocket::client::Message,
    ) -> wasmtime::Result<Result<(), ws_mock_p3::golem::websocket::client::Error>> {
        let message = match message {
            ws_mock_p3::golem::websocket::client::Message::Text(value) => {
                WsSentMessage::Text(value)
            }
            ws_mock_p3::golem::websocket::client::Message::Binary(value) => {
                WsSentMessage::Binary(value)
            }
        };
        self.ws_sent.lock().unwrap().push(message);
        Ok(Ok(()))
    }

    async fn close(
        &mut self,
        _self_: Resource<WsMockConnection>,
        code: Option<u16>,
        reason: Option<String>,
    ) -> wasmtime::Result<Result<(), ws_mock_p3::golem::websocket::client::Error>> {
        self.ws_sent
            .lock()
            .unwrap()
            .push(WsSentMessage::Close(code, reason));
        Ok(Ok(()))
    }

    async fn drop(&mut self, rep: Resource<WsMockConnection>) -> wasmtime::Result<()> {
        self.table.lock().unwrap().delete(rep)?;
        Ok(())
    }
}

impl ws_mock_p3::golem::websocket::client::HostWebsocketConnectionWithStore<Host>
    for HasSelf<Host>
{
    async fn receive(
        _store: &wasmtime::component::Accessor<Host, Self>,
        _self_: Resource<WsMockConnection>,
    ) -> wasmtime::Result<
        Result<
            ws_mock_p3::golem::websocket::client::Message,
            ws_mock_p3::golem::websocket::client::Error,
        >,
    > {
        Ok(Err(ws_mock_p3::golem::websocket::client::Error::Closed(
            None,
        )))
    }

    async fn receive_with_timeout(
        _store: &wasmtime::component::Accessor<Host, Self>,
        _self_: Resource<WsMockConnection>,
        _timeout_ms: u64,
    ) -> wasmtime::Result<
        Result<
            Option<ws_mock_p3::golem::websocket::client::Message>,
            ws_mock_p3::golem::websocket::client::Error,
        >,
    > {
        Ok(Err(ws_mock_p3::golem::websocket::client::Error::Closed(
            None,
        )))
    }
}

/// Default timeout for node_compat tests (in seconds).
pub const DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS: u64 = 120;

const TEST_ARTIFACT_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_ARTIFACT_CACHE";
const TEST_DROP_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_DROP_CACHE";
const TEST_LOCKED_BUILDS_ENV: &str = "WASM_RQUICKJS_TEST_LOCKED_BUILDS";
const TEST_PREPARED_COMPONENT_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE";
const TEST_PRECOMPILE_COMPONENT_ENV: &str = "WASM_RQUICKJS_TEST_PRECOMPILE_COMPONENT";
const TEST_UNOPTIMIZED_ENV: &str = "WASM_RQUICKJS_TEST_UNOPTIMIZED";
const TEST_WASMTIME_CACHE_ENV: &str = "WASM_RQUICKJS_TEST_WASMTIME_CACHE";

/// In-memory buffer holding host-side tracing output so it can be attached to test failure
/// messages. On CI only the failure message itself is visible (in the ctrf report and the
/// GitHub annotations); anything the test runner captures — including output written via
/// `with_test_writer` — never appears in the logs. So the tracing output must travel inside
/// the error itself, like the guest stdout/stderr already does.
///
/// The buffer is shared by all tests in the process and capped, keeping the most recent output.
static HOST_TRACE: Mutex<Vec<u8>> = Mutex::new(Vec::new());
const HOST_TRACE_CAP: usize = 256 * 1024;
static NEXT_HTTP_TRACE_INVOCATION: AtomicUsize = AtomicUsize::new(1);
static NEXT_HTTP_TRACE_REQUEST: AtomicUsize = AtomicUsize::new(1);
static NEXT_HTTP_TRACE_CONNECTION: AtomicUsize = AtomicUsize::new(1);
static TEST_SERVER_HTTP_TRACE: OnceLock<HttpLifecycleTrace> = OnceLock::new();
const HTTP_LIFECYCLE_CAP: usize = 256;
const HTTP_LIFECYCLE_SEQUENCE_MASK: u64 = 0x00ff_ffff;
const HTTP_LIFECYCLE_SEQUENCE_HALF: u64 = 0x0080_0000;

#[repr(u8)]
#[derive(Clone, Copy)]
enum HttpLifecyclePhase {
    Submit = 1,
    Target = 2,
    RequestFirstData = 3,
    RequestFirstTrailers = 4,
    RequestEof = 5,
    RequestError = 6,
    RequestDrop = 7,
    ResponseHead = 8,
    ResponseFirstData = 9,
    ResponseFirstTrailers = 10,
    ResponseEof = 11,
    ResponseError = 12,
    ResponseDrop = 13,
    SendError = 14,
    ResponseIoOk = 15,
    ResponseIoError = 16,
    ServerArrival = 17,
    ServerRequestFirstData = 18,
    ServerRequestEof = 19,
    ServerRequestError = 20,
    ServerRequestDrop = 21,
    ServerResponseHead = 22,
    ServerResponseFirstData = 23,
    ServerResponseEof = 24,
    ServerResponseError = 25,
    ServerResponseDrop = 26,
    TargetPath = 27,
    ServerPort = 28,
    ServerConnectionAccept = 29,
    ServerRequestConnection = 30,
    ServerConnectionFirstRead = 31,
    ServerConnectionReadEof = 32,
    ServerConnectionReadError = 33,
    ServerConnectionFirstWrite = 34,
    ServerConnectionWriteError = 35,
    ServerConnectionFlushError = 36,
    ServerConnectionShutdown = 37,
    ServerConnectionShutdownError = 38,
    ServerConnectionDrop = 39,
    ServerResponseWriteAfterFrame = 40,
    ServerResponseWriteError = 41,
    ServerResponsePendingAtDrop = 42,
    ServerResponseCorrelationOverlap = 43,
    ServerResponseBodyExpectedBytes = 44,
    ServerResponseBodyExpectedUnknown = 45,
    ServerResponseBodyPolledBytes = 46,
    ServerResponseWritePartial = 47,
    ServerResponseWriteBoundaryBytes = 48,
    ServerResponseFlushBytes = 49,
    ServerResponseTerminalBytes = 50,
    ServerResponseByteCountOverflow = 51,
    ServerConnectionFlushPending = 52,
    ServerConnectionFlushOk = 53,
    ServerConnectionShutdownPending = 54,
    ServerResponseCorrelationBoundary = 55,
}

impl HttpLifecyclePhase {
    fn label(value: u8) -> &'static str {
        match value {
            1 => "submit",
            2 => "target-port",
            3 => "request-first-data",
            4 => "request-first-trailers",
            5 => "request-eof",
            6 => "request-error",
            7 => "request-drop-before-terminal",
            8 => "response-head",
            9 => "response-first-data",
            10 => "response-first-trailers",
            11 => "response-eof",
            12 => "response-error",
            13 => "response-drop-before-terminal",
            14 => "send-error",
            15 => "response-io-ok",
            16 => "response-io-error",
            17 => "server-arrival",
            18 => "server-request-first-data",
            19 => "server-request-eof",
            20 => "server-request-error",
            21 => "server-request-drop-before-terminal",
            22 => "server-response-head",
            23 => "server-response-first-data",
            24 => "server-response-eof",
            25 => "server-response-error",
            26 => "server-response-drop-before-terminal",
            27 => "target-path-hash",
            28 => "server-port",
            29 => "server-connection-accept",
            30 => "server-request-connection",
            31 => "server-connection-first-read",
            32 => "server-connection-read-eof",
            33 => "server-connection-read-error",
            34 => "server-connection-first-write",
            35 => "server-connection-write-error",
            36 => "server-connection-flush-error",
            37 => "server-connection-shutdown",
            38 => "server-connection-shutdown-error",
            39 => "server-connection-drop",
            40 => "server-response-write-after-frame",
            41 => "server-response-write-error",
            42 => "server-response-pending-at-drop",
            43 => "server-response-correlation-overlap",
            44 => "server-response-body-expected-bytes",
            45 => "server-response-body-expected-unknown",
            46 => "server-response-body-polled-bytes",
            47 => "server-response-write-partial",
            48 => "server-response-write-boundary-bytes",
            49 => "server-response-flush-bytes",
            50 => "server-response-terminal-bytes",
            51 => "server-response-byte-count-overflow",
            52 => "server-connection-flush-pending",
            53 => "server-connection-flush-ok",
            54 => "server-connection-shutdown-pending",
            55 => "server-response-correlation-boundary",
            _ => "unknown",
        }
    }
}

const HTTP_BYTE_COUNT_EXPECTED: u16 = 1;
const HTTP_BYTE_COUNT_POLLED: u16 = 2;
const HTTP_BYTE_COUNT_WRITE: u16 = 3;

fn record_http_byte_count(
    trace: &HttpLifecycleTrace,
    request: usize,
    phase: HttpLifecyclePhase,
    count: u64,
    overflow_kind: u16,
) {
    if count > u64::from(u16::MAX) {
        trace.record(
            request,
            HttpLifecyclePhase::ServerResponseByteCountOverflow,
            overflow_kind,
        );
    }
    trace.record(request, phase, count.min(u64::from(u16::MAX)) as u16);
}

struct HttpLifecycleJournal {
    next_event: AtomicUsize,
    slots: [std::sync::atomic::AtomicU64; HTTP_LIFECYCLE_CAP],
}

impl HttpLifecycleJournal {
    fn new() -> Self {
        Self {
            next_event: AtomicUsize::new(1),
            slots: std::array::from_fn(|_| std::sync::atomic::AtomicU64::new(0)),
        }
    }

    fn record(&self, request: usize, phase: HttpLifecyclePhase, detail: u16) {
        let sequence = self.next_event.fetch_add(1, Ordering::Relaxed);
        self.publish(sequence, request, phase, detail);
    }

    fn publish(&self, sequence: usize, request: usize, phase: HttpLifecyclePhase, detail: u16) {
        let encoded_sequence = sequence as u64 & HTTP_LIFECYCLE_SEQUENCE_MASK;
        let packed = (encoded_sequence << 40)
            | ((request as u64 & 0xffff) << 24)
            | ((phase as u64) << 16)
            | u64::from(detail);
        let slot = &self.slots[sequence % HTTP_LIFECYCLE_CAP];
        let mut current = slot.load(Ordering::Acquire);
        loop {
            let current_sequence = current >> 40;
            if current != 0 {
                let advance =
                    encoded_sequence.wrapping_sub(current_sequence) & HTTP_LIFECYCLE_SEQUENCE_MASK;
                if advance == 0 || advance >= HTTP_LIFECYCLE_SEQUENCE_HALF {
                    return;
                }
            }
            match slot.compare_exchange_weak(current, packed, Ordering::Release, Ordering::Acquire)
            {
                Ok(_) => return,
                Err(observed) => current = observed,
            }
        }
    }

    fn snapshot(&self, invocation: usize) -> String {
        let newest_full_sequence = self.next_event.load(Ordering::Acquire).saturating_sub(1);
        let newest_encoded_sequence = newest_full_sequence as u64 & HTTP_LIFECYCLE_SEQUENCE_MASK;
        let mut events = self
            .slots
            .iter()
            .map(|slot| slot.load(Ordering::Acquire))
            .filter(|event| *event != 0)
            .collect::<Vec<_>>();
        events.retain(|event| {
            let sequence = event >> 40;
            let age = newest_encoded_sequence.wrapping_sub(sequence) & HTTP_LIFECYCLE_SEQUENCE_MASK;
            age < HTTP_LIFECYCLE_SEQUENCE_HALF
        });
        events.sort_unstable_by_key(|event| {
            let sequence = event >> 40;
            std::cmp::Reverse(
                newest_encoded_sequence.wrapping_sub(sequence) & HTTP_LIFECYCLE_SEQUENCE_MASK,
            )
        });
        let mut result = format!("invocation={invocation}\n");
        for event in events {
            let encoded_sequence = event >> 40;
            let age = newest_encoded_sequence.wrapping_sub(encoded_sequence)
                & HTTP_LIFECYCLE_SEQUENCE_MASK;
            let sequence = newest_full_sequence.saturating_sub(age as usize);
            let request = (event >> 24) & 0xffff;
            let phase = ((event >> 16) & 0xff) as u8;
            let detail = event & 0xffff;
            use std::fmt::Write as _;
            let _ = writeln!(
                result,
                "seq={sequence} request={request} phase={} detail={detail}",
                HttpLifecyclePhase::label(phase)
            );
        }
        result
    }
}

/// Per-component correlation state for the test harness' outgoing HTTP lifecycle trace.
///
/// The trace is intentionally implemented in the host rather than the embedded skeleton: it is
/// test-only, covers both P2 and P3, and can observe the Wasmtime transport boundary without
/// changing a generated component. Events use a fixed atomic journal, so the hot path has no
/// locks, allocation, clocks, or output; the journal is formatted only after an invocation fails.
#[derive(Clone)]
struct HttpLifecycleTrace {
    invocation: usize,
    journal: Arc<HttpLifecycleJournal>,
}

impl HttpLifecycleTrace {
    fn new() -> Self {
        Self {
            invocation: NEXT_HTTP_TRACE_INVOCATION.fetch_add(1, Ordering::Relaxed),
            journal: Arc::new(HttpLifecycleJournal::new()),
        }
    }

    fn next_request(&self) -> usize {
        NEXT_HTTP_TRACE_REQUEST.fetch_add(1, Ordering::Relaxed)
    }

    fn record(&self, request: usize, phase: HttpLifecyclePhase, detail: u16) {
        self.journal.record(request, phase, detail);
    }

    fn record_submit(&self, request: usize, method: &http::Method, uri: &http::Uri) {
        let method = if method == http::Method::GET {
            1
        } else if method == http::Method::POST {
            2
        } else if method == http::Method::PUT {
            3
        } else if method == http::Method::DELETE {
            4
        } else if method == http::Method::HEAD {
            5
        } else {
            0
        };
        self.record(request, HttpLifecyclePhase::Submit, method);
        self.record(
            request,
            HttpLifecyclePhase::Target,
            uri.port_u16().unwrap_or_default(),
        );
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        uri.path_and_query().hash(&mut hasher);
        self.record(
            request,
            HttpLifecyclePhase::TargetPath,
            (hasher.finish() & 0xffff) as u16,
        );
    }

    fn snapshot(&self) -> String {
        self.journal.snapshot(self.invocation)
    }
}

fn test_server_http_trace() -> &'static HttpLifecycleTrace {
    TEST_SERVER_HTTP_TRACE.get_or_init(HttpLifecycleTrace::new)
}

fn attach_http_correlation<B>(request: &mut http::Request<B>, request_id: usize) {
    request.headers_mut().insert(
        http::HeaderName::from_static("x-wrq-http-trace-id"),
        http::HeaderValue::try_from(request_id.to_string()).expect("numeric header is valid"),
    );
}

fn test_server_http_correlation(headers: &http::HeaderMap) -> usize {
    headers
        .get("x-wrq-http-trace-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse().ok())
        .unwrap_or_default()
}

fn record_test_server_arrival(request_id: usize, port: u16, uri: &http::Uri) {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    uri.path_and_query().hash(&mut hasher);
    test_server_http_trace().record(
        request_id,
        HttpLifecyclePhase::ServerArrival,
        (hasher.finish() & 0xffff) as u16,
    );
    test_server_http_trace().record(request_id, HttpLifecyclePhase::ServerPort, port);
}

fn record_test_server_response_head(request_id: usize, status: http::StatusCode) {
    test_server_http_trace().record(
        request_id,
        HttpLifecyclePhase::ServerResponseHead,
        status.as_u16(),
    );
}

fn record_test_server_connection(
    request_id: usize,
    connection: Option<&TracedTestServerConnection>,
) {
    if let Some(connection) = connection {
        connection.state.trace.record(
            request_id,
            HttpLifecyclePhase::ServerRequestConnection,
            connection.state.connection,
        );
    }
}

pub(crate) fn traced_test_server_listener(
    listener: tokio::net::TcpListener,
) -> TracedTestServerListener {
    TracedTestServerListener {
        listener,
        trace: test_server_http_trace().clone(),
    }
}

pub(crate) struct TracedTestServerListener {
    listener: tokio::net::TcpListener,
    trace: HttpLifecycleTrace,
}

impl axum::serve::Listener for TracedTestServerListener {
    type Io = TracedTestServerIo<tokio::net::TcpStream>;
    type Addr = std::net::SocketAddr;

    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        let (stream, peer) =
            <tokio::net::TcpListener as axum::serve::Listener>::accept(&mut self.listener).await;
        let connection = (NEXT_HTTP_TRACE_CONNECTION.fetch_add(1, Ordering::Relaxed)
            % usize::from(u16::MAX))
            + 1;
        let state = Arc::new(HttpConnectionState::new(
            self.trace.clone(),
            connection as u16,
        ));
        self.trace.record(
            connection,
            HttpLifecyclePhase::ServerConnectionAccept,
            peer.port(),
        );
        (TracedTestServerIo::new(stream, state), peer)
    }

    fn local_addr(&self) -> std::io::Result<Self::Addr> {
        self.listener.local_addr()
    }
}

#[derive(Clone)]
pub(crate) struct TracedTestServerConnection {
    state: Arc<HttpConnectionState>,
}

impl
    axum::extract::connect_info::Connected<
        axum::serve::IncomingStream<'_, TracedTestServerListener>,
    > for TracedTestServerConnection
{
    fn connect_info(target: axum::serve::IncomingStream<'_, TracedTestServerListener>) -> Self {
        Self {
            state: target.io().state.clone(),
        }
    }
}

struct HttpConnectionState {
    trace: HttpLifecycleTrace,
    connection: u16,
    pending_response: AtomicUsize,
}

impl HttpConnectionState {
    fn new(trace: HttpLifecycleTrace, connection: u16) -> Self {
        Self {
            trace,
            connection,
            pending_response: AtomicUsize::new(0),
        }
    }

    fn arm_response(&self, request_id: usize) {
        if let Err(pending_request) = self.pending_response.compare_exchange(
            0,
            request_id,
            Ordering::AcqRel,
            Ordering::Acquire,
        ) {
            self.trace.record(
                request_id,
                HttpLifecyclePhase::ServerResponseCorrelationOverlap,
                pending_request.min(usize::from(u16::MAX)) as u16,
            );
        }
    }

    fn take_pending_response(&self) -> Option<usize> {
        match self.pending_response.swap(0, Ordering::AcqRel) {
            0 => None,
            request_id => Some(request_id),
        }
    }
}

struct ActiveResponseWrite {
    request_id: usize,
    accepted_bytes: u64,
}

pub(crate) struct TracedTestServerIo<T> {
    inner: T,
    state: Arc<HttpConnectionState>,
    saw_read: bool,
    saw_write: bool,
    read_terminal: bool,
    write_terminal: bool,
    active_response: Option<ActiveResponseWrite>,
    flush_pending: bool,
    shutdown_pending: bool,
}

impl<T> TracedTestServerIo<T> {
    fn new(inner: T, state: Arc<HttpConnectionState>) -> Self {
        Self {
            inner,
            state,
            saw_read: false,
            saw_write: false,
            read_terminal: false,
            write_terminal: false,
            active_response: None,
            flush_pending: false,
            shutdown_pending: false,
        }
    }

    fn record_connection(&self, phase: HttpLifecyclePhase, detail: u16) {
        self.state
            .trace
            .record(usize::from(self.state.connection), phase, detail);
    }

    fn record_response_bytes(&self, request_id: usize, phase: HttpLifecyclePhase, bytes: u64) {
        record_http_byte_count(
            &self.state.trace,
            request_id,
            phase,
            bytes,
            HTTP_BYTE_COUNT_WRITE,
        );
    }

    fn activate_pending_response(&mut self, first_accepted_bytes: Option<usize>) -> Option<usize> {
        let pending = self.state.take_pending_response();
        if let Some(request_id) = pending {
            match self.active_response.take() {
                Some(active) if active.request_id != request_id => {
                    self.record_response_bytes(
                        active.request_id,
                        HttpLifecyclePhase::ServerResponseWriteBoundaryBytes,
                        active.accepted_bytes,
                    );
                    self.state.trace.record(
                        active.request_id,
                        HttpLifecyclePhase::ServerResponseCorrelationBoundary,
                        request_id.min(usize::from(u16::MAX)) as u16,
                    );
                }
                Some(active) => {
                    self.active_response = Some(active);
                    return Some(request_id);
                }
                None => {}
            }
            if let Some(first_accepted_bytes) = first_accepted_bytes {
                self.record_response_bytes(
                    request_id,
                    HttpLifecyclePhase::ServerResponseWriteAfterFrame,
                    first_accepted_bytes as u64,
                );
            }
            self.active_response = Some(ActiveResponseWrite {
                request_id,
                accepted_bytes: 0,
            });
        }
        self.active_response
            .as_ref()
            .map(|active| active.request_id)
    }

    fn snapshot_active_response(&mut self, phase: HttpLifecyclePhase) {
        if let Some(active) = self.active_response.take() {
            self.record_response_bytes(active.request_id, phase, active.accepted_bytes);
        }
    }

    fn record_pending_response(&self, phase: HttpLifecyclePhase) {
        if let Some(request_id) = self.state.take_pending_response() {
            self.state
                .trace
                .record(request_id, phase, self.state.connection);
        }
    }

    fn record_write_success(&mut self, offered: usize, accepted: usize) {
        if !self.saw_write {
            self.saw_write = true;
            self.record_connection(
                HttpLifecyclePhase::ServerConnectionFirstWrite,
                accepted.min(usize::from(u16::MAX)) as u16,
            );
        }
        if let Some(request_id) = self.activate_pending_response(Some(accepted)) {
            if let Some(active) = &mut self.active_response {
                active.accepted_bytes = active.accepted_bytes.saturating_add(accepted as u64);
            }
            if accepted < offered {
                self.record_response_bytes(
                    request_id,
                    HttpLifecyclePhase::ServerResponseWritePartial,
                    offered.saturating_sub(accepted) as u64,
                );
            }
        }
    }

    fn record_write_error(&mut self, error: &std::io::Error) {
        self.write_terminal = true;
        self.activate_pending_response(None);
        if let Some(request_id) = self
            .active_response
            .as_ref()
            .map(|active| active.request_id)
        {
            self.state.trace.record(
                request_id,
                HttpLifecyclePhase::ServerResponseWriteError,
                self.state.connection,
            );
        }
        self.snapshot_active_response(HttpLifecyclePhase::ServerResponseTerminalBytes);
        self.record_connection(
            HttpLifecyclePhase::ServerConnectionWriteError,
            error.raw_os_error().unwrap_or_default() as u16,
        );
    }
}

impl<T: tokio::io::AsyncRead + Unpin> tokio::io::AsyncRead for TracedTestServerIo<T> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buffer: &mut tokio::io::ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        let filled_before = buffer.filled().len();
        match Pin::new(&mut self.inner).poll_read(cx, buffer) {
            Poll::Ready(Ok(())) => {
                let bytes = buffer.filled().len().saturating_sub(filled_before);
                if bytes != 0 && !self.saw_read {
                    self.saw_read = true;
                    self.record_connection(
                        HttpLifecyclePhase::ServerConnectionFirstRead,
                        bytes.min(usize::from(u16::MAX)) as u16,
                    );
                } else if bytes == 0 && !self.read_terminal {
                    self.read_terminal = true;
                    self.record_connection(HttpLifecyclePhase::ServerConnectionReadEof, 0);
                }
                Poll::Ready(Ok(()))
            }
            Poll::Ready(Err(error)) => {
                self.read_terminal = true;
                self.record_connection(
                    HttpLifecyclePhase::ServerConnectionReadError,
                    error.raw_os_error().unwrap_or_default() as u16,
                );
                Poll::Ready(Err(error))
            }
            Poll::Pending => Poll::Pending,
        }
    }
}

impl<T: tokio::io::AsyncWrite + Unpin> tokio::io::AsyncWrite for TracedTestServerIo<T> {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buffer: &[u8],
    ) -> Poll<std::io::Result<usize>> {
        match Pin::new(&mut self.inner).poll_write(cx, buffer) {
            Poll::Ready(Ok(bytes)) => {
                self.record_write_success(buffer.len(), bytes);
                Poll::Ready(Ok(bytes))
            }
            Poll::Ready(Err(error)) => {
                self.record_write_error(&error);
                Poll::Ready(Err(error))
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn poll_write_vectored(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buffers: &[std::io::IoSlice<'_>],
    ) -> Poll<std::io::Result<usize>> {
        match Pin::new(&mut self.inner).poll_write_vectored(cx, buffers) {
            Poll::Ready(Ok(bytes)) => {
                let offered = buffers
                    .iter()
                    .fold(0usize, |total, buffer| total.saturating_add(buffer.len()));
                self.record_write_success(offered, bytes);
                Poll::Ready(Ok(bytes))
            }
            Poll::Ready(Err(error)) => {
                self.record_write_error(&error);
                Poll::Ready(Err(error))
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn is_write_vectored(&self) -> bool {
        self.inner.is_write_vectored()
    }

    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match Pin::new(&mut self.inner).poll_flush(cx) {
            Poll::Ready(Ok(())) => {
                self.flush_pending = false;
                self.snapshot_active_response(HttpLifecyclePhase::ServerResponseFlushBytes);
                self.record_connection(HttpLifecyclePhase::ServerConnectionFlushOk, 0);
                Poll::Ready(Ok(()))
            }
            Poll::Ready(Err(error)) => {
                self.flush_pending = false;
                self.write_terminal = true;
                if let Some(request_id) = self
                    .active_response
                    .as_ref()
                    .map(|active| active.request_id)
                {
                    self.state.trace.record(
                        request_id,
                        HttpLifecyclePhase::ServerResponseWriteError,
                        self.state.connection,
                    );
                }
                self.snapshot_active_response(HttpLifecyclePhase::ServerResponseTerminalBytes);
                self.record_pending_response(HttpLifecyclePhase::ServerResponseWriteError);
                self.record_connection(
                    HttpLifecyclePhase::ServerConnectionFlushError,
                    error.raw_os_error().unwrap_or_default() as u16,
                );
                Poll::Ready(Err(error))
            }
            Poll::Pending => {
                if !self.flush_pending {
                    self.flush_pending = true;
                    self.record_connection(HttpLifecyclePhase::ServerConnectionFlushPending, 0);
                }
                Poll::Pending
            }
        }
    }

    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match Pin::new(&mut self.inner).poll_shutdown(cx) {
            Poll::Ready(Ok(())) => {
                self.shutdown_pending = false;
                if !self.write_terminal {
                    self.write_terminal = true;
                    self.snapshot_active_response(HttpLifecyclePhase::ServerResponseTerminalBytes);
                    self.record_pending_response(HttpLifecyclePhase::ServerResponsePendingAtDrop);
                    self.record_connection(HttpLifecyclePhase::ServerConnectionShutdown, 0);
                }
                Poll::Ready(Ok(()))
            }
            Poll::Ready(Err(error)) => {
                self.shutdown_pending = false;
                self.write_terminal = true;
                if let Some(request_id) = self
                    .active_response
                    .as_ref()
                    .map(|active| active.request_id)
                {
                    self.state.trace.record(
                        request_id,
                        HttpLifecyclePhase::ServerResponseWriteError,
                        self.state.connection,
                    );
                }
                self.snapshot_active_response(HttpLifecyclePhase::ServerResponseTerminalBytes);
                self.record_pending_response(HttpLifecyclePhase::ServerResponseWriteError);
                self.record_connection(
                    HttpLifecyclePhase::ServerConnectionShutdownError,
                    error.raw_os_error().unwrap_or_default() as u16,
                );
                Poll::Ready(Err(error))
            }
            Poll::Pending => {
                if !self.shutdown_pending {
                    self.shutdown_pending = true;
                    self.record_connection(HttpLifecyclePhase::ServerConnectionShutdownPending, 0);
                }
                Poll::Pending
            }
        }
    }
}

impl<T> Drop for TracedTestServerIo<T> {
    fn drop(&mut self) {
        self.snapshot_active_response(HttpLifecyclePhase::ServerResponseTerminalBytes);
        self.record_pending_response(HttpLifecyclePhase::ServerResponsePendingAtDrop);
        let detail = u16::from(self.saw_read)
            | (u16::from(self.saw_write) << 1)
            | (u16::from(self.read_terminal) << 2)
            | (u16::from(self.write_terminal) << 3);
        self.record_connection(HttpLifecyclePhase::ServerConnectionDrop, detail);
    }
}

fn traced_test_server_body<B: HttpBody>(
    body: B,
    request_id: usize,
    side: &'static str,
) -> TracedHttpBody<B> {
    TracedHttpBody::new(
        body,
        test_server_http_trace().clone(),
        request_id,
        side,
        None,
    )
}

fn traced_test_server_response_body<B: HttpBody>(
    body: B,
    request_id: usize,
    connection: Option<TracedTestServerConnection>,
) -> TracedHttpBody<B> {
    TracedHttpBody::new(
        body,
        test_server_http_trace().clone(),
        request_id,
        "server-response",
        connection.map(|connection| connection.state),
    )
}

/// A transparent body observer. It never polls ahead or adds an await: every host poll is
/// delegated exactly once while frame byte totals and the terminal outcome are recorded.
struct TracedHttpBody<B: HttpBody> {
    inner: Pin<Box<B>>,
    trace: HttpLifecycleTrace,
    request: usize,
    side: &'static str,
    server_connection: Option<Arc<HttpConnectionState>>,
    saw_frame: bool,
    terminal: bool,
    expected_body_bytes: Option<u64>,
    polled_body_bytes: u64,
    body_bytes_recorded: bool,
}

impl<B: HttpBody> TracedHttpBody<B> {
    fn new(
        inner: B,
        trace: HttpLifecycleTrace,
        request: usize,
        side: &'static str,
        server_connection: Option<Arc<HttpConnectionState>>,
    ) -> Self {
        let expected_body_bytes = (side == "server-response")
            .then(|| inner.size_hint().exact())
            .flatten();
        let body = Self {
            inner: Box::pin(inner),
            trace,
            request,
            side,
            server_connection,
            saw_frame: false,
            terminal: false,
            expected_body_bytes,
            polled_body_bytes: 0,
            body_bytes_recorded: false,
        };
        if side == "server-response" {
            if let Some(expected) = body.expected_body_bytes {
                record_http_byte_count(
                    &body.trace,
                    request,
                    HttpLifecyclePhase::ServerResponseBodyExpectedBytes,
                    expected,
                    HTTP_BYTE_COUNT_EXPECTED,
                );
            } else {
                body.trace.record(
                    request,
                    HttpLifecyclePhase::ServerResponseBodyExpectedUnknown,
                    0,
                );
            }
        }
        body
    }

    fn event(&self, outcome: &'static str) {
        let phase = match (self.side, outcome) {
            ("request", "first-data") => HttpLifecyclePhase::RequestFirstData,
            ("request", "first-trailers") => HttpLifecyclePhase::RequestFirstTrailers,
            ("request", "eof") => HttpLifecyclePhase::RequestEof,
            ("request", "error") => HttpLifecyclePhase::RequestError,
            ("request", "drop-before-terminal") => HttpLifecyclePhase::RequestDrop,
            ("response", "first-data") => HttpLifecyclePhase::ResponseFirstData,
            ("response", "first-trailers") => HttpLifecyclePhase::ResponseFirstTrailers,
            ("response", "eof") => HttpLifecyclePhase::ResponseEof,
            ("response", "error") => HttpLifecyclePhase::ResponseError,
            ("response", "drop-before-terminal") => HttpLifecyclePhase::ResponseDrop,
            ("server-request", "first-data") => HttpLifecyclePhase::ServerRequestFirstData,
            ("server-request", "eof") => HttpLifecyclePhase::ServerRequestEof,
            ("server-request", "error") => HttpLifecyclePhase::ServerRequestError,
            ("server-request", "drop-before-terminal") => HttpLifecyclePhase::ServerRequestDrop,
            ("server-response", "first-data") => HttpLifecyclePhase::ServerResponseFirstData,
            ("server-response", "eof") => HttpLifecyclePhase::ServerResponseEof,
            ("server-response", "error") => HttpLifecyclePhase::ServerResponseError,
            ("server-response", "drop-before-terminal") => HttpLifecyclePhase::ServerResponseDrop,
            _ => return,
        };
        self.trace.record(self.request, phase, 0);
    }

    fn record_body_bytes(&mut self) {
        if self.side == "server-response" && !self.body_bytes_recorded {
            self.body_bytes_recorded = true;
            record_http_byte_count(
                &self.trace,
                self.request,
                HttpLifecyclePhase::ServerResponseBodyPolledBytes,
                self.polled_body_bytes,
                HTTP_BYTE_COUNT_POLLED,
            );
        }
    }

    fn record_terminal(&mut self, outcome: &'static str) {
        if !self.terminal {
            self.terminal = true;
            self.event(outcome);
        }
        self.record_body_bytes();
    }
}

impl<B: HttpBody> HttpBody for TracedHttpBody<B> {
    type Data = B::Data;
    type Error = B::Error;

    fn poll_frame(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
        let this = self.get_mut();
        match this.inner.as_mut().poll_frame(cx) {
            Poll::Ready(Some(Ok(frame))) => {
                if let Some(data) = frame.data_ref() {
                    this.polled_body_bytes = this
                        .polled_body_bytes
                        .saturating_add(data.remaining() as u64);
                }
                if !this.saw_frame {
                    this.saw_frame = true;
                    let outcome = if frame.is_data() {
                        "first-data"
                    } else {
                        "first-trailers"
                    };
                    this.event(outcome);
                    if outcome == "first-data"
                        && let Some(connection) = &this.server_connection
                    {
                        connection.arm_response(this.request);
                    }
                }
                if this.inner.as_ref().is_end_stream() {
                    this.record_terminal("eof");
                }
                Poll::Ready(Some(Ok(frame)))
            }
            Poll::Ready(Some(Err(error))) => {
                this.record_terminal("error");
                Poll::Ready(Some(Err(error)))
            }
            Poll::Ready(None) => {
                this.record_terminal("eof");
                Poll::Ready(None)
            }
            Poll::Pending => Poll::Pending,
        }
    }

    fn is_end_stream(&self) -> bool {
        self.inner.as_ref().is_end_stream()
    }

    fn size_hint(&self) -> SizeHint {
        self.inner.as_ref().size_hint()
    }
}

impl<B: HttpBody> Drop for TracedHttpBody<B> {
    fn drop(&mut self) {
        if !self.terminal && !self.inner.as_ref().is_end_stream() {
            self.event("drop-before-terminal");
        }
        self.record_body_bytes();
    }
}

#[derive(Clone)]
struct P2HttpTraceHooks(HttpLifecycleTrace);

fn trace_p2_result(
    trace: &HttpLifecycleTrace,
    request_id: usize,
    result: Result<
        wasmtime_wasi_http::p2::types::IncomingResponse,
        wasmtime_wasi_http::p2::bindings::http::types::ErrorCode,
    >,
) -> Result<
    wasmtime_wasi_http::p2::types::IncomingResponse,
    wasmtime_wasi_http::p2::bindings::http::types::ErrorCode,
> {
    match result {
        Ok(mut incoming) => {
            trace.record(
                request_id,
                HttpLifecyclePhase::ResponseHead,
                incoming.resp.status().as_u16(),
            );
            let (parts, body) = incoming.resp.into_parts();
            incoming.resp = http::Response::from_parts(
                parts,
                TracedHttpBody::new(body, trace.clone(), request_id, "response", None)
                    .boxed_unsync(),
            );
            Ok(incoming)
        }
        Err(error) => {
            trace.record(request_id, HttpLifecyclePhase::SendError, 0);
            Err(error)
        }
    }
}

#[cfg(feature = "use-golem-wasmtime")]
fn p2_method_expects_body(method: &http::Method) -> bool {
    method == http::Method::POST || method == http::Method::PUT || method == http::Method::PATCH
}

#[cfg(feature = "use-golem-wasmtime")]
fn p2_body_completion_for_dispatch(
    method: &http::Method,
    body_completion: Option<wasmtime_wasi_http::p2::BodyCompletionReceiver>,
) -> Option<wasmtime_wasi_http::p2::BodyCompletionReceiver> {
    if p2_method_expects_body(method) {
        drop(body_completion);
        None
    } else {
        body_completion
    }
}

impl wasmtime_wasi_http::p2::WasiHttpHooks for P2HttpTraceHooks {
    #[cfg(not(feature = "use-golem-wasmtime"))]
    fn send_request(
        &mut self,
        mut request: http::Request<wasmtime_wasi_http::p2::body::HyperOutgoingBody>,
        config: wasmtime_wasi_http::p2::types::OutgoingRequestConfig,
    ) -> wasmtime_wasi_http::p2::HttpResult<wasmtime_wasi_http::p2::types::HostFutureIncomingResponse>
    {
        let trace = self.0.clone();
        let request_id = trace.next_request();
        attach_http_correlation(&mut request, request_id);
        trace.record_submit(request_id, request.method(), request.uri());

        let (parts, body) = request.into_parts();
        let request = http::Request::from_parts(
            parts,
            TracedHttpBody::new(body, trace.clone(), request_id, "request", None).boxed_unsync(),
        );
        let handle = wasmtime_wasi::runtime::spawn(async move {
            let result =
                wasmtime_wasi_http::p2::default_send_request_handler(request, config).await;
            Ok(trace_p2_result(&trace, request_id, result))
        });
        Ok(wasmtime_wasi_http::p2::types::HostFutureIncomingResponse::pending(handle))
    }

    #[cfg(feature = "use-golem-wasmtime")]
    fn send_request(
        &mut self,
        mut request: http::Request<wasmtime_wasi_http::p2::body::HyperOutgoingBody>,
        config: wasmtime_wasi_http::p2::types::OutgoingRequestConfig,
        body_completion: Option<wasmtime_wasi_http::p2::BodyCompletionReceiver>,
    ) -> wasmtime_wasi_http::p2::HttpResult<wasmtime_wasi_http::p2::types::HostFutureIncomingResponse>
    {
        let trace = self.0.clone();
        let request_id = trace.next_request();
        attach_http_correlation(&mut request, request_id);
        trace.record_submit(request_id, request.method(), request.uri());
        let body_completion = p2_body_completion_for_dispatch(request.method(), body_completion);
        let collect_before_send = body_completion.is_some();
        let (parts, body) = request.into_parts();
        let request = http::Request::from_parts(
            parts,
            TracedHttpBody::new(body, trace.clone(), request_id, "request", None).boxed_unsync(),
        );
        let handle = wasmtime_wasi::runtime::spawn(async move {
            let request = if collect_before_send {
                let body_completion = body_completion.expect("checked above");
                let (parts, body) = request.into_parts();
                let completion = async {
                    match body_completion.await {
                        Ok(Ok(())) => Ok(()),
                        Ok(Err(error)) => Err(error),
                        Err(_) => Err(
                            wasmtime_wasi_http::p2::bindings::http::types::ErrorCode::HttpProtocolError,
                        ),
                    }
                };
                let collect = async {
                    BodyExt::collect(body).await.map(|collected| {
                        collected
                            .map_err(|_: std::convert::Infallible| unreachable!())
                            .boxed_unsync()
                    })
                };
                let (completion, collected) = futures::future::join(completion, collect).await;
                completion?;
                http::Request::from_parts(parts, collected?)
            } else {
                request
            };
            let result =
                wasmtime_wasi_http::p2::default_send_request_handler(request, config).await;
            Ok(trace_p2_result(&trace, request_id, result))
        });
        Ok(wasmtime_wasi_http::p2::types::HostFutureIncomingResponse::pending(handle))
    }
}

#[derive(Clone)]
struct P3HttpTraceHooks(HttpLifecycleTrace);

impl wasmtime_wasi_http::p3::WasiHttpHooks for P3HttpTraceHooks {
    fn send_request(
        &mut self,
        mut request: http::Request<
            http_body_util::combinators::UnsyncBoxBody<
                bytes::Bytes,
                wasmtime_wasi_http::p3::bindings::http::types::ErrorCode,
            >,
        >,
        options: Option<wasmtime_wasi_http::p3::RequestOptions>,
        response_processing: Box<
            dyn Future<
                    Output = Result<(), wasmtime_wasi_http::p3::bindings::http::types::ErrorCode>,
                > + Send,
        >,
    ) -> Box<
        dyn Future<
                Output = Result<
                    (
                        http::Response<
                            http_body_util::combinators::UnsyncBoxBody<
                                bytes::Bytes,
                                wasmtime_wasi_http::p3::bindings::http::types::ErrorCode,
                            >,
                        >,
                        Box<
                            dyn Future<
                                    Output = Result<
                                        (),
                                        wasmtime_wasi_http::p3::bindings::http::types::ErrorCode,
                                    >,
                                > + Send,
                        >,
                    ),
                    wasmtime_wasi::TrappableError<
                        wasmtime_wasi_http::p3::bindings::http::types::ErrorCode,
                    >,
                >,
            > + Send,
    > {
        // Match Wasmtime's default hook: response-processing is currently not wired into the
        // default client. Keep that ownership behavior unchanged while tracing the returned I/O
        // future, which is the transport's actual connection lifetime signal.
        drop(response_processing);

        let trace = self.0.clone();
        let request_id = trace.next_request();
        attach_http_correlation(&mut request, request_id);
        trace.record_submit(request_id, request.method(), request.uri());
        let (parts, body) = request.into_parts();
        let request = http::Request::from_parts(
            parts,
            TracedHttpBody::new(body, trace.clone(), request_id, "request", None).boxed_unsync(),
        );

        Box::new(async move {
            let result = wasmtime_wasi_http::p3::default_send_request(request, options).await;
            let (response, io) = match result {
                Ok(value) => value,
                Err(error) => {
                    trace.record(request_id, HttpLifecyclePhase::SendError, 0);
                    return Err(error.into());
                }
            };
            trace.record(
                request_id,
                HttpLifecyclePhase::ResponseHead,
                response.status().as_u16(),
            );
            let (parts, body) = response.into_parts();
            let response = http::Response::from_parts(
                parts,
                TracedHttpBody::new(body, trace.clone(), request_id, "response", None)
                    .boxed_unsync(),
            );
            let io_trace = trace.clone();
            let io = Box::new(async move {
                let result = io.await;
                io_trace.record(
                    request_id,
                    if result.is_ok() {
                        HttpLifecyclePhase::ResponseIoOk
                    } else {
                        HttpLifecyclePhase::ResponseIoError
                    },
                    0,
                );
                result
            }) as Box<dyn Future<Output = Result<_, _>> + Send>;
            Ok((response, io))
        })
    }
}

#[derive(Clone, Copy)]
struct HostTraceWriter;

impl std::io::Write for HostTraceWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let mut trace = HOST_TRACE.lock().unwrap();
        trace.extend_from_slice(buf);
        let len = trace.len();
        if len > HOST_TRACE_CAP {
            trace.drain(..len - HOST_TRACE_CAP);
        }
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

impl tracing_subscriber::fmt::MakeWriter<'_> for HostTraceWriter {
    type Writer = HostTraceWriter;

    fn make_writer(&self) -> Self::Writer {
        *self
    }
}

/// Returns the host-side tracing output captured so far (see [`init_tracing`]).
pub fn host_trace() -> String {
    String::from_utf8_lossy(&HOST_TRACE.lock().unwrap()).into_owned()
}

/// Installs a global tracing subscriber (once per process) so host-side `tracing` diagnostics
/// are visible in test output. Most importantly, `wasmtime-wasi-http` flattens the underlying
/// hyper error of a failed outgoing request into `ErrorCode::HttpProtocolError` and only reports
/// the real error via `tracing::warn!` — without a subscriber that information is lost, which
/// makes intermittent CI-only fetch failures undiagnosable.
///
/// The output is collected into [`HOST_TRACE`] (not the test runner's capture buffer) so that
/// failing tests can attach it to their error message, which is the only output channel visible
/// in the CI failure reports.
///
/// The filter can be overridden with `RUST_LOG`; by default only `wasmtime-wasi-http` warnings
/// are shown to keep output noise low.
pub fn init_tracing() {
    use std::sync::Once;
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        let filter = tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("wasmtime_wasi_http=warn"));
        let _ = tracing_subscriber::fmt()
            .with_env_filter(filter)
            .with_writer(HostTraceWriter)
            .with_ansi(false)
            .try_init();
    });
}

/// Strip JSONC comments (// and /* */) while respecting string literals.
pub fn strip_jsonc_comments(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '"' {
            result.push(chars[i]);
            i += 1;
            while i < len && chars[i] != '"' {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '/' {
            i += 2;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
        } else if chars[i] == '/' && i + 1 < len && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2;
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    result
}

fn truthy_env(name: &str) -> bool {
    std::env::var(name)
        .map(|value| {
            matches!(
                value.to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

pub(crate) fn test_artifact_cache_enabled() -> bool {
    truthy_env(TEST_ARTIFACT_CACHE_ENV)
}

fn test_drop_cache_enabled() -> bool {
    truthy_env(TEST_DROP_CACHE_ENV)
}

fn test_prepared_component_cache_enabled() -> bool {
    truthy_env(TEST_PREPARED_COMPONENT_CACHE_ENV)
}

fn test_unoptimized_enabled() -> bool {
    truthy_env(TEST_UNOPTIMIZED_ENV)
}

fn test_wasmtime_cache_enabled() -> bool {
    test_wasmtime_cache_enabled_from(
        truthy_env(TEST_WASMTIME_CACHE_ENV),
        test_drop_cache_enabled(),
    )
}

fn test_wasmtime_cache_enabled_from(enabled: bool, drop_cache: bool) -> bool {
    enabled && !drop_cache
}

fn test_cache_stamp_dir() -> Utf8PathBuf {
    Utf8Path::new("tmp").join("test-artifact-cache")
}

fn drop_test_artifact_cache_once() {
    static DROPPED: OnceLock<()> = OnceLock::new();
    DROPPED.get_or_init(|| {
        if test_drop_cache_enabled() {
            let _ = fs::remove_dir_all(test_cache_stamp_dir());
        }
    });
}

fn test_cache_stamp(
    name: &str,
    feature_combination: FeatureCombination,
    kind: &str,
) -> Utf8PathBuf {
    test_cache_stamp_for_target(name, feature_combination, kind, test_target())
}

fn test_cache_stamp_for_target(
    name: &str,
    feature_combination: FeatureCombination,
    kind: &str,
    target: TestTarget,
) -> Utf8PathBuf {
    test_cache_stamp_dir().join(format!(
        "{}-{}{}-{kind}.stamp",
        name.to_snake_case(),
        feature_combination.label(),
        target.dir_suffix(),
    ))
}

fn test_cache_lock(name: &str, feature_combination: FeatureCombination, kind: &str) -> Utf8PathBuf {
    test_cache_stamp_dir().join(format!(
        "{}-{}{}-{kind}.lock",
        name.to_snake_case(),
        feature_combination.label(),
        test_target().dir_suffix(),
    ))
}

fn rustc_version_verbose() -> String {
    Command::new("rustc")
        .arg("-Vv")
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "rustc-version-unavailable".to_string())
}

fn cache_stamp_signature(
    name: &str,
    feature_combination: FeatureCombination,
    kind: &str,
    extra: &[(&str, String)],
) -> String {
    static RUSTC_VERSION_VERBOSE: OnceLock<String> = OnceLock::new();
    let rustc_version = RUSTC_VERSION_VERBOSE.get_or_init(rustc_version_verbose);
    let mut signature = format!(
        "wasm-rquickjs-test-cache-v2\nname={name}\nfeature={}\nkind={kind}\nrustc={rustc_version}\n",
        feature_combination.label(),
    );

    for env_name in [
        "CARGO",
        "CARGO_BUILD_TARGET",
        "CARGO_ENCODED_RUSTFLAGS",
        "CARGO_PROFILE_TEST_OPT_LEVEL",
        "CARGO_TARGET_DIR",
        "RUSTC",
        "RUSTFLAGS",
        "RUSTUP_TOOLCHAIN",
    ] {
        if let Ok(value) = std::env::var(env_name) {
            signature.push_str(env_name);
            signature.push('=');
            signature.push_str(&value);
            signature.push('\n');
        }
    }

    for (key, value) in extra {
        signature.push_str(key);
        signature.push('=');
        signature.push_str(value);
        signature.push('\n');
    }

    signature
}

fn modified_time(path: &Utf8Path) -> anyhow::Result<SystemTime> {
    Ok(fs::metadata(path)?.modified()?)
}

fn newest_modified_time(path: &Utf8Path) -> anyhow::Result<SystemTime> {
    let metadata = fs::metadata(path)?;
    let mut newest = metadata.modified()?;
    if metadata.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let entry_path = Utf8PathBuf::from_path_buf(entry.path())
                .map_err(|_| anyhow!("Non UTF-8 path under {path}"))?;
            newest = newest.max(newest_modified_time(&entry_path)?);
        }
    }
    Ok(newest)
}

fn newest_modified_time_of_existing(paths: &[Utf8PathBuf]) -> anyhow::Result<SystemTime> {
    let mut newest = SystemTime::UNIX_EPOCH;
    for path in paths {
        if path.exists() {
            newest = newest.max(newest_modified_time(path)?);
        }
    }
    Ok(newest)
}

fn output_fresh_for_inputs(
    output: &Utf8Path,
    stamp: &Utf8Path,
    inputs: &[Utf8PathBuf],
    signature: &str,
) -> bool {
    drop_test_artifact_cache_once();

    if !output.exists() || !stamp.exists() || test_drop_cache_enabled() {
        return false;
    }

    let Ok(stamp_contents) = fs::read_to_string(stamp) else {
        return false;
    };
    if stamp_contents != signature {
        return false;
    }

    let Ok(output_mtime) = modified_time(output) else {
        return false;
    };
    let Ok(stamp_mtime) = modified_time(stamp) else {
        return false;
    };
    if stamp_mtime < output_mtime {
        return false;
    }
    let Ok(input_mtime) = newest_modified_time_of_existing(inputs) else {
        return false;
    };

    output_mtime >= input_mtime && stamp_mtime >= input_mtime
}

fn refresh_cache_stamp(stamp: &Utf8Path, signature: &str) -> anyhow::Result<()> {
    if let Some(parent) = stamp.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(stamp, signature)?;
    Ok(())
}

struct TestCacheLock {
    path: Utf8PathBuf,
}

impl TestCacheLock {
    fn acquire(path: Utf8PathBuf) -> anyhow::Result<Self> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let started = Instant::now();
        loop {
            match fs::create_dir(&path) {
                Ok(()) => return Ok(Self { path }),
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                    if fs::metadata(&path)
                        .and_then(|metadata| metadata.modified())
                        .ok()
                        .and_then(|modified| modified.elapsed().ok())
                        .is_some_and(|age| age > Duration::from_secs(10 * 60))
                    {
                        let _ = fs::remove_dir_all(&path);
                        continue;
                    }
                    if started.elapsed() > Duration::from_secs(120) {
                        anyhow::bail!("timed out waiting for test artifact cache lock {path}");
                    }
                    thread::sleep(Duration::from_millis(100));
                }
                Err(error) => return Err(error.into()),
            }
        }
    }
}

impl Drop for TestCacheLock {
    fn drop(&mut self) {
        let _ = fs::remove_dir(&self.path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    use test_r::test;
    use tokio::io::{AsyncRead as _, AsyncReadExt as _, AsyncWrite as _, AsyncWriteExt as _};

    #[derive(Default)]
    struct ScriptedIoCalls {
        reads: AtomicUsize,
        writes: AtomicUsize,
        vectored_writes: AtomicUsize,
        flushes: AtomicUsize,
        shutdowns: AtomicUsize,
    }

    struct ScriptedIo {
        calls: Arc<ScriptedIoCalls>,
        fail_write: bool,
        accepted_writes: VecDeque<usize>,
        flush_pending_once: bool,
        shutdown_pending_once: bool,
    }

    impl tokio::io::AsyncRead for ScriptedIo {
        fn poll_read(
            self: Pin<&mut Self>,
            _cx: &mut Context<'_>,
            buffer: &mut tokio::io::ReadBuf<'_>,
        ) -> Poll<std::io::Result<()>> {
            self.calls.reads.fetch_add(1, Ordering::Relaxed);
            buffer.put_slice(b"r");
            Poll::Ready(Ok(()))
        }
    }

    impl tokio::io::AsyncWrite for ScriptedIo {
        fn poll_write(
            mut self: Pin<&mut Self>,
            _cx: &mut Context<'_>,
            buffer: &[u8],
        ) -> Poll<std::io::Result<usize>> {
            self.calls.writes.fetch_add(1, Ordering::Relaxed);
            if self.fail_write {
                Poll::Ready(Err(std::io::Error::other("scripted write failure")))
            } else {
                Poll::Ready(Ok(self
                    .accepted_writes
                    .pop_front()
                    .unwrap_or(buffer.len())
                    .min(buffer.len())))
            }
        }

        fn poll_write_vectored(
            mut self: Pin<&mut Self>,
            _cx: &mut Context<'_>,
            buffers: &[std::io::IoSlice<'_>],
        ) -> Poll<std::io::Result<usize>> {
            self.calls.vectored_writes.fetch_add(1, Ordering::Relaxed);
            if self.fail_write {
                Poll::Ready(Err(std::io::Error::other("scripted write failure")))
            } else {
                let offered = buffers.iter().map(|buffer| buffer.len()).sum();
                Poll::Ready(Ok(self
                    .accepted_writes
                    .pop_front()
                    .unwrap_or(offered)
                    .min(offered)))
            }
        }

        fn is_write_vectored(&self) -> bool {
            true
        }

        fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
            self.calls.flushes.fetch_add(1, Ordering::Relaxed);
            if std::mem::take(&mut self.flush_pending_once) {
                cx.waker().wake_by_ref();
                return Poll::Pending;
            }
            Poll::Ready(Ok(()))
        }

        fn poll_shutdown(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<std::io::Result<()>> {
            self.calls.shutdowns.fetch_add(1, Ordering::Relaxed);
            if std::mem::take(&mut self.shutdown_pending_once) {
                cx.waker().wake_by_ref();
                return Poll::Pending;
            }
            Poll::Ready(Ok(()))
        }
    }

    fn scripted_connection(
        trace: HttpLifecycleTrace,
        connection: u16,
        fail_write: bool,
    ) -> (TracedTestServerIo<ScriptedIo>, Arc<ScriptedIoCalls>) {
        let calls = Arc::new(ScriptedIoCalls::default());
        let state = Arc::new(HttpConnectionState::new(trace, connection));
        let io = TracedTestServerIo::new(
            ScriptedIo {
                calls: calls.clone(),
                fail_write,
                accepted_writes: VecDeque::new(),
                flush_pending_once: false,
                shutdown_pending_once: false,
            },
            state,
        );
        (io, calls)
    }

    #[test]
    fn http_lifecycle_ring_rejects_delayed_old_generation() {
        let journal = HttpLifecycleJournal::new();
        journal.publish(1, 1, HttpLifecyclePhase::Submit, 0);
        journal.publish(
            1 + HTTP_LIFECYCLE_CAP,
            2,
            HttpLifecyclePhase::ResponseHead,
            200,
        );
        journal.publish(1, 3, HttpLifecyclePhase::SendError, 0);

        let retained = journal.slots[1].load(Ordering::Acquire);
        assert_eq!(retained >> 40, (1 + HTTP_LIFECYCLE_CAP) as u64);
        assert_eq!((retained >> 24) & 0xffff, 2);
    }

    #[test]
    fn http_lifecycle_ring_accepts_encoded_sequence_rollover() {
        let journal = HttpLifecycleJournal::new();
        let before_rollover = HTTP_LIFECYCLE_SEQUENCE_MASK as usize;
        journal.publish(
            before_rollover - (HTTP_LIFECYCLE_CAP - 1),
            1,
            HttpLifecyclePhase::Submit,
            0,
        );
        journal.publish(
            before_rollover + 1,
            2,
            HttpLifecyclePhase::ResponseHead,
            200,
        );

        let retained =
            journal.slots[(before_rollover + 1) % HTTP_LIFECYCLE_CAP].load(Ordering::Acquire);
        assert_eq!(retained >> 40, 0);
        assert_eq!((retained >> 24) & 0xffff, 2);
    }

    #[test]
    fn http_lifecycle_ring_remains_valid_during_concurrent_snapshots() {
        let journal = Arc::new(HttpLifecycleJournal::new());
        let writers = (0..8)
            .map(|request| {
                let journal = journal.clone();
                thread::spawn(move || {
                    for _ in 0..1_000 {
                        journal.record(request, HttpLifecyclePhase::Submit, 0);
                    }
                })
            })
            .collect::<Vec<_>>();

        for _ in 0..100 {
            let snapshot = journal.snapshot(1);
            assert!(snapshot.starts_with("invocation=1\n"));
        }
        for writer in writers {
            writer.join().unwrap();
        }

        let newest = journal.next_event.load(Ordering::Acquire) - 1;
        let retained = journal
            .slots
            .iter()
            .map(|slot| slot.load(Ordering::Acquire) >> 40)
            .collect::<Vec<_>>();
        assert!(retained.contains(&(newest as u64)));
        assert!(
            retained
                .iter()
                .all(|sequence| *sequence > (newest - HTTP_LIFECYCLE_CAP) as u64)
        );
    }

    #[test]
    fn http_lifecycle_empty_body_drop_is_terminal() {
        let trace = HttpLifecycleTrace::new();
        let body = http_body_util::Empty::<bytes::Bytes>::new();
        drop(TracedHttpBody::new(body, trace.clone(), 1, "request", None));

        let snapshot = trace.snapshot();
        assert!(!snapshot.contains("drop-before-terminal"));
    }

    #[test]
    fn http_lifecycle_p2_send_error_is_terminal_boundary() {
        let trace = HttpLifecycleTrace::new();
        let result = trace_p2_result(
            &trace,
            7,
            Err(wasmtime_wasi_http::p2::bindings::http::types::ErrorCode::HttpProtocolError),
        );

        assert!(result.is_err());
        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=7 phase=send-error"));
    }

    #[test]
    fn http_lifecycle_correlation_distinguishes_same_path_requests() {
        let mut first = http::Request::get("http://127.0.0.1:1234/same")
            .body(())
            .unwrap();
        let mut second = http::Request::get("http://127.0.0.1:1234/same")
            .body(())
            .unwrap();
        attach_http_correlation(&mut first, 41);
        attach_http_correlation(&mut second, 42);

        assert_eq!(test_server_http_correlation(first.headers()), 41);
        assert_eq!(test_server_http_correlation(second.headers()), 42);

        let uri = Arc::new(first.uri().clone());
        let arrivals = [41, 42].map(|request_id| {
            let uri = uri.clone();
            thread::spawn(move || record_test_server_arrival(request_id, 1234, &uri))
        });
        for arrival in arrivals {
            arrival.join().unwrap();
        }
        let snapshot = test_server_http_trace().snapshot();
        assert!(snapshot.contains("request=41 phase=server-arrival"));
        assert!(snapshot.contains("request=42 phase=server-arrival"));
    }

    #[test]
    fn http_lifecycle_server_io_delegates_each_poll_once() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, calls) = scripted_connection(trace.clone(), 7, false);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        let mut storage = [0; 4];
        let mut read = tokio::io::ReadBuf::new(&mut storage);
        assert!(Pin::new(&mut io).poll_read(&mut cx, &mut read).is_ready());
        assert_eq!(read.filled(), b"r");
        assert_eq!(calls.reads.load(Ordering::Relaxed), 1);

        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"abc"),
            Poll::Ready(Ok(3))
        ));
        assert_eq!(calls.writes.load(Ordering::Relaxed), 1);

        let buffers = [std::io::IoSlice::new(b"d"), std::io::IoSlice::new(b"ef")];
        assert!(matches!(
            Pin::new(&mut io).poll_write_vectored(&mut cx, &buffers),
            Poll::Ready(Ok(3))
        ));
        assert_eq!(calls.vectored_writes.load(Ordering::Relaxed), 1);
        assert!(io.is_write_vectored());

        assert!(matches!(
            Pin::new(&mut io).poll_flush(&mut cx),
            Poll::Ready(Ok(()))
        ));
        assert_eq!(calls.flushes.load(Ordering::Relaxed), 1);
        assert!(matches!(
            Pin::new(&mut io).poll_shutdown(&mut cx),
            Poll::Ready(Ok(()))
        ));
        assert_eq!(calls.shutdowns.load(Ordering::Relaxed), 1);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=7 phase=server-connection-first-read detail=1"));
        assert!(snapshot.contains("request=7 phase=server-connection-first-write detail=3"));
        assert!(snapshot.contains("request=7 phase=server-connection-shutdown"));
    }

    #[test]
    fn http_lifecycle_server_response_frame_arms_exactly_one_correlated_write() {
        let trace = HttpLifecycleTrace::new();
        let state = Arc::new(HttpConnectionState::new(trace.clone(), 9));
        let body = http_body_util::Full::new(bytes::Bytes::from_static(b"body"));
        let mut body = Box::pin(TracedHttpBody::new(
            body,
            trace.clone(),
            41,
            "server-response",
            Some(state.clone()),
        ));
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);
        assert!(matches!(
            body.as_mut().poll_frame(&mut cx),
            Poll::Ready(Some(Ok(_)))
        ));
        assert_eq!(state.pending_response.load(Ordering::Acquire), 41);

        let calls = Arc::new(ScriptedIoCalls::default());
        let mut io = TracedTestServerIo::new(
            ScriptedIo {
                calls,
                fail_write: false,
                accepted_writes: VecDeque::new(),
                flush_pending_once: false,
                shutdown_pending_once: false,
            },
            state.clone(),
        );
        let buffers = [
            std::io::IoSlice::new(b"head"),
            std::io::IoSlice::new(b"body"),
        ];
        assert!(matches!(
            Pin::new(&mut io).poll_write_vectored(&mut cx, &buffers),
            Poll::Ready(Ok(8))
        ));
        assert_eq!(state.pending_response.load(Ordering::Acquire), 0);
        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"later"),
            Poll::Ready(Ok(5))
        ));

        let snapshot = trace.snapshot();
        assert_eq!(
            snapshot
                .matches("request=41 phase=server-response-write-after-frame detail=8")
                .count(),
            1
        );
        assert!(snapshot.contains("request=41 phase=server-response-body-expected-bytes detail=4"));
        assert!(snapshot.contains("request=41 phase=server-response-body-polled-bytes detail=4"));
    }

    #[test]
    fn http_lifecycle_server_response_counts_partial_and_cumulative_writes() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, calls) = scripted_connection(trace.clone(), 10, false);
        io.inner.accepted_writes = VecDeque::from([4, 6]);
        io.state.arm_response(44);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"0123456789"),
            Poll::Ready(Ok(4))
        ));
        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"456789"),
            Poll::Ready(Ok(6))
        ));
        assert!(matches!(
            Pin::new(&mut io).poll_flush(&mut cx),
            Poll::Ready(Ok(()))
        ));
        assert_eq!(calls.writes.load(Ordering::Relaxed), 2);
        assert_eq!(calls.flushes.load(Ordering::Relaxed), 1);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=44 phase=server-response-write-after-frame detail=4"));
        assert!(snapshot.contains("request=44 phase=server-response-write-partial detail=6"));
        assert!(snapshot.contains("request=44 phase=server-response-flush-bytes detail=10"));
    }

    #[test]
    fn http_lifecycle_server_response_records_full_accepted_write_at_terminal() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, _) = scripted_connection(trace.clone(), 11, false);
        io.state.arm_response(54);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);
        let response = [0; 151];

        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, &response),
            Poll::Ready(Ok(151))
        ));
        drop(io);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=54 phase=server-response-write-after-frame detail=151"));
        assert!(snapshot.contains("request=54 phase=server-response-terminal-bytes detail=151"));
        assert!(!snapshot.contains("request=54 phase=server-response-write-partial"));
    }

    #[test]
    fn http_lifecycle_server_response_counters_are_independent_after_flush() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, _) = scripted_connection(trace.clone(), 12, false);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        for (request, bytes) in [(45, b"first".as_slice()), (46, b"second".as_slice())] {
            io.state.arm_response(request);
            assert!(Pin::new(&mut io).poll_write(&mut cx, bytes).is_ready());
            assert!(Pin::new(&mut io).poll_flush(&mut cx).is_ready());
        }

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=45 phase=server-response-flush-bytes detail=5"));
        assert!(snapshot.contains("request=46 phase=server-response-flush-bytes detail=6"));
        assert!(!snapshot.contains("server-response-correlation-boundary"));
    }

    #[test]
    fn http_lifecycle_server_io_records_pending_flush_and_shutdown_once() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, calls) = scripted_connection(trace.clone(), 14, false);
        io.inner.flush_pending_once = true;
        io.inner.shutdown_pending_once = true;
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        assert!(Pin::new(&mut io).poll_flush(&mut cx).is_pending());
        assert!(Pin::new(&mut io).poll_flush(&mut cx).is_ready());
        assert!(Pin::new(&mut io).poll_shutdown(&mut cx).is_pending());
        assert!(Pin::new(&mut io).poll_shutdown(&mut cx).is_ready());
        assert_eq!(calls.flushes.load(Ordering::Relaxed), 2);
        assert_eq!(calls.shutdowns.load(Ordering::Relaxed), 2);

        let snapshot = trace.snapshot();
        assert_eq!(
            snapshot.matches("server-connection-flush-pending").count(),
            1
        );
        assert_eq!(snapshot.matches("server-connection-flush-ok").count(), 1);
        assert_eq!(
            snapshot
                .matches("server-connection-shutdown-pending")
                .count(),
            1
        );
        assert_eq!(snapshot.matches("server-connection-shutdown").count(), 2);
    }

    #[test]
    fn http_lifecycle_server_response_records_unknown_and_overflow_body_sizes() {
        let trace = HttpLifecycleTrace::new();
        let unknown = http_body_util::StreamBody::new(futures::stream::iter([Ok::<
            _,
            std::convert::Infallible,
        >(
            Frame::data(bytes::Bytes::from_static(b"unknown")),
        )]));
        let mut unknown = Box::pin(TracedHttpBody::new(
            unknown,
            trace.clone(),
            47,
            "server-response",
            None,
        ));
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);
        assert!(unknown.as_mut().poll_frame(&mut cx).is_ready());
        drop(unknown);

        let overflow = http_body_util::Full::new(bytes::Bytes::from(vec![0; 70_000]));
        let mut overflow = Box::pin(TracedHttpBody::new(
            overflow,
            trace.clone(),
            48,
            "server-response",
            None,
        ));
        assert!(overflow.as_mut().poll_frame(&mut cx).is_ready());
        drop(overflow);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=47 phase=server-response-body-expected-unknown"));
        assert!(snapshot.contains("request=47 phase=server-response-body-polled-bytes detail=7"));
        assert!(
            snapshot.contains("request=48 phase=server-response-body-expected-bytes detail=65535")
        );
        assert!(
            snapshot.contains("request=48 phase=server-response-body-polled-bytes detail=65535")
        );
        assert_eq!(
            snapshot
                .matches("request=48 phase=server-response-byte-count-overflow")
                .count(),
            2
        );
    }

    #[test]
    fn http_lifecycle_server_response_write_error_preserves_correlation() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, _) = scripted_connection(trace.clone(), 11, true);
        io.state.arm_response(42);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"response"),
            Poll::Ready(Err(_))
        ));
        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=42 phase=server-response-write-error detail=11"));
        assert!(snapshot.contains("request=11 phase=server-connection-write-error"));
    }

    #[test]
    fn http_lifecycle_server_response_error_and_drop_snapshot_accepted_bytes() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, _) = scripted_connection(trace.clone(), 15, false);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        io.state.arm_response(49);
        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"abc"),
            Poll::Ready(Ok(3))
        ));
        io.inner.fail_write = true;
        assert!(matches!(
            Pin::new(&mut io).poll_write(&mut cx, b"failure"),
            Poll::Ready(Err(_))
        ));

        let (mut dropped, _) = scripted_connection(trace.clone(), 16, false);
        dropped.state.arm_response(50);
        assert!(matches!(
            Pin::new(&mut dropped).poll_write(&mut cx, b"drop"),
            Poll::Ready(Ok(4))
        ));
        drop(dropped);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=49 phase=server-response-terminal-bytes detail=3"));
        assert!(snapshot.contains("request=49 phase=server-response-write-error detail=15"));
        assert!(snapshot.contains("request=50 phase=server-response-terminal-bytes detail=4"));
    }

    #[test]
    fn http_lifecycle_server_connection_drop_reports_armed_response() {
        let trace = HttpLifecycleTrace::new();
        let (io, _) = scripted_connection(trace.clone(), 13, false);
        io.state.arm_response(43);
        drop(io);

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=43 phase=server-response-pending-at-drop detail=13"));
        assert!(snapshot.contains("request=13 phase=server-connection-drop"));
    }

    #[test]
    fn http_lifecycle_server_connection_maps_multiple_requests_to_same_connection() {
        let trace = HttpLifecycleTrace::new();
        let connection = TracedTestServerConnection {
            state: Arc::new(HttpConnectionState::new(trace.clone(), 17)),
        };
        record_test_server_connection(51, Some(&connection));
        record_test_server_connection(52, Some(&connection));

        let snapshot = trace.snapshot();
        assert!(snapshot.contains("request=51 phase=server-request-connection detail=17"));
        assert!(snapshot.contains("request=52 phase=server-request-connection detail=17"));
    }

    #[test]
    fn http_lifecycle_server_response_overlap_is_explicit_and_non_overwriting() {
        let trace = HttpLifecycleTrace::new();
        let state = HttpConnectionState::new(trace.clone(), 19);
        state.arm_response(61);
        state.arm_response(62);

        assert_eq!(state.pending_response.load(Ordering::Acquire), 61);
        let snapshot = trace.snapshot();
        assert!(
            snapshot.contains("request=62 phase=server-response-correlation-overlap detail=61")
        );
    }

    #[test]
    fn http_lifecycle_server_response_boundary_without_flush_is_explicit() {
        let trace = HttpLifecycleTrace::new();
        let (mut io, _) = scripted_connection(trace.clone(), 20, false);
        let waker = futures::task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        io.state.arm_response(63);
        assert!(Pin::new(&mut io).poll_write(&mut cx, b"one").is_ready());
        io.state.arm_response(64);
        assert!(Pin::new(&mut io).poll_write(&mut cx, b"two").is_ready());

        let snapshot = trace.snapshot();
        assert!(
            snapshot.contains("request=63 phase=server-response-write-boundary-bytes detail=3")
        );
        assert!(
            snapshot.contains("request=63 phase=server-response-correlation-boundary detail=64")
        );
        assert!(snapshot.contains("request=64 phase=server-response-write-after-frame detail=3"));
    }

    #[test]
    async fn http_lifecycle_axum_pipeline_preserves_response_correlation() {
        use axum::body::Body;
        use axum::extract::{ConnectInfo, Request};
        use axum::routing::any;
        use bytes::Bytes;
        use http_body_util::Full;

        let trace = HttpLifecycleTrace::new();
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let listener = TracedTestServerListener {
            listener,
            trace: trace.clone(),
        };
        let router = axum::Router::new().route(
            "/",
            any(
                |ConnectInfo(connection): ConnectInfo<TracedTestServerConnection>,
                 request: Request| async move {
                    let request_id = test_server_http_correlation(request.headers());
                    record_test_server_connection(request_id, Some(&connection));
                    axum::response::Response::new(Body::new(TracedHttpBody::new(
                        Full::new(Bytes::from_static(b"ok")),
                        connection.state.trace.clone(),
                        request_id,
                        "server-response",
                        Some(connection.state),
                    )))
                },
            ),
        );
        let server = tokio::spawn(async move {
            axum::serve(
                listener,
                router.into_make_service_with_connect_info::<TracedTestServerConnection>(),
            )
            .await
            .unwrap();
        });

        let mut client = tokio::net::TcpStream::connect(address).await.unwrap();
        client
            .write_all(
                b"GET / HTTP/1.1\r\nHost: localhost\r\nx-wrq-http-trace-id: 71\r\n\r\n\
                  GET / HTTP/1.1\r\nHost: localhost\r\nx-wrq-http-trace-id: 72\r\nConnection: close\r\n\r\n",
            )
            .await
            .unwrap();
        let mut response = Vec::new();
        client.read_to_end(&mut response).await.unwrap();
        server.abort();

        assert_eq!(
            String::from_utf8_lossy(&response)
                .matches("HTTP/1.1 200 OK")
                .count(),
            2
        );
        let snapshot = trace.snapshot();
        for request_id in [71, 72] {
            assert!(snapshot.contains(&format!(
                "request={request_id} phase=server-request-connection"
            )));
            assert!(snapshot.contains(&format!(
                "request={request_id} phase=server-response-write-after-frame"
            )));
            assert!(snapshot.contains(&format!(
                "request={request_id} phase=server-response-body-expected-bytes detail=2"
            )));
            assert!(snapshot.contains(&format!(
                "request={request_id} phase=server-response-body-polled-bytes detail=2"
            )));
        }
        assert!(!snapshot.contains("server-response-correlation-overlap"));
        assert!(!snapshot.contains("server-response-correlation-boundary"));
    }

    #[cfg(feature = "use-golem-wasmtime")]
    #[test]
    fn p2_body_method_drops_unused_completion_before_dispatch() {
        let (sender, receiver) = tokio::sync::oneshot::channel::<
            Result<(), wasmtime_wasi_http::p2::bindings::http::types::ErrorCode>,
        >();
        let retained = p2_body_completion_for_dispatch(&http::Method::POST, Some(receiver));

        assert!(retained.is_none());
        assert!(sender.is_closed());
    }

    #[test]
    fn artifact_cache_stamp_must_not_be_older_than_output() -> anyhow::Result<()> {
        if test_drop_cache_enabled() {
            return Ok(());
        }

        let temp = Utf8TempDir::new()?;
        let input = temp.path().join("input.txt");
        let output = temp.path().join("output.wasm");
        let stamp = temp.path().join("output.stamp");
        let signature = "test-signature";
        fs::write(&input, "input")?;
        fs::write(&output, "output-v1")?;
        refresh_cache_stamp(&stamp, signature)?;

        assert!(output_fresh_for_inputs(
            &output,
            &stamp,
            std::slice::from_ref(&input),
            signature,
        ));

        let stamp_mtime = modified_time(&stamp)?;
        let started = Instant::now();
        loop {
            thread::sleep(Duration::from_millis(10));
            fs::write(&output, format!("output-v2-{:?}", started.elapsed()))?;
            if modified_time(&output)? > stamp_mtime {
                break;
            }
            if started.elapsed() > Duration::from_secs(2) {
                anyhow::bail!("output mtime did not advance beyond cache stamp mtime");
            }
        }

        assert!(
            !output_fresh_for_inputs(&output, &stamp, &[input], signature),
            "a stale stamp must not validate an artifact rewritten after the stamp was produced"
        );

        Ok(())
    }

    #[test]
    fn prepared_component_cache_key_includes_content_hash() -> anyhow::Result<()> {
        let temp = Utf8TempDir::new()?;
        let wasm = temp.path().join("component.wasm");

        fs::write(&wasm, b"aaaa")?;
        let first = prepared_component_cache_key(&wasm)?;

        fs::write(&wasm, b"bbbb")?;
        let second = prepared_component_cache_key(&wasm)?;

        assert_eq!(first.path, second.path);
        assert_eq!(first.len, second.len);
        assert_ne!(
            first.content_hash, second.content_hash,
            "prepared component cache keys must change when same-length component bytes change"
        );

        Ok(())
    }

    #[test]
    fn drop_cache_bypasses_explicit_wasmtime_cache() {
        assert!(test_wasmtime_cache_enabled_from(true, false));
        assert!(!test_wasmtime_cache_enabled_from(false, false));
        assert!(!test_wasmtime_cache_enabled_from(true, true));
        assert!(!test_wasmtime_cache_enabled_from(false, true));
    }

    #[test]
    fn artifact_cache_stamps_are_target_specific() {
        let p2 = test_cache_stamp_for_target(
            "module-resolution",
            FeatureCombination::Normal,
            "compile",
            TestTarget::P2,
        );
        let p3 = test_cache_stamp_for_target(
            "module-resolution",
            FeatureCombination::Normal,
            "compile",
            TestTarget::P3,
        );

        assert_ne!(p2, p3);
    }
}

fn configure_test_wasmtime_cache(config: &mut wasmtime::Config) -> anyhow::Result<()> {
    if test_wasmtime_cache_enabled() {
        config.cache(Some(wasmtime::Cache::new(wasmtime::CacheConfig::new())?));
    }
    Ok(())
}

fn test_wasmtime_config() -> anyhow::Result<wasmtime::Config> {
    let mut config = wasmtime::Config::default();
    config.wasm_component_model(true);
    config.epoch_interruption(true);
    config.async_stack_size(32 * 1024 * 1024); // 32MB async stack (must be >= max_wasm_stack)
    config.max_wasm_stack(16 * 1024 * 1024); // 16MB WASM stack (default is 512KB, QuickJS in WASM needs more for deep recursion)
    configure_test_wasmtime_cache(&mut config)?;
    Ok(config)
}

fn test_p3_wasmtime_config() -> anyhow::Result<wasmtime::Config> {
    let mut config = wasmtime::Config::default();
    config.wasm_component_model(true);
    config.wasm_component_model_async(true);
    config.epoch_interruption(true);
    config.async_stack_size(32 * 1024 * 1024);
    config.max_wasm_stack(16 * 1024 * 1024);
    configure_test_wasmtime_cache(&mut config)?;
    Ok(config)
}

fn precompile_component(wasm_path: &Utf8Path) -> anyhow::Result<bool> {
    if !test_wasmtime_cache_enabled() {
        return Ok(false);
    }

    let stamp = wasm_path.with_extension("component-precompiled.stamp");
    let signature = cache_stamp_signature(
        wasm_path.file_stem().unwrap_or("component"),
        FeatureCombination::Normal,
        "component-precompile",
        &[
            ("component", wasm_path.to_string()),
            ("target", format!("{:?}", test_target())),
        ],
    );
    let inputs = [wasm_path.to_path_buf()];
    if output_fresh_for_inputs(&stamp, &stamp, &inputs, &signature) {
        return Ok(false);
    }

    let _lock = TestCacheLock::acquire(stamp.with_extension("lock"))?;
    if output_fresh_for_inputs(&stamp, &stamp, &inputs, &signature) {
        return Ok(false);
    }

    let config = match test_target() {
        TestTarget::P2 => test_wasmtime_config()?,
        TestTarget::P3 => test_p3_wasmtime_config()?,
    };
    let engine = Engine::new(&config)?;
    drop(Component::from_file(&engine, wasm_path)?);
    refresh_cache_stamp(&stamp, &signature)?;
    Ok(true)
}

fn start_test_epoch_thread(engine: &Engine) {
    let epoch_engine = engine.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(10));
            epoch_engine.increment_epoch();
        }
    });
}

fn test_linker_with_common_hosts(engine: &Engine) -> anyhow::Result<Linker<Host>> {
    let mut linker: Linker<Host> = Linker::new(engine);

    wasmtime_wasi::p2::add_to_linker_with_options_async(
        &mut linker,
        &bindings::LinkOptions::default(),
    )?;
    wasmtime_wasi_http::p2::add_only_http_to_linker_async(&mut linker)?;

    {
        let mut logging = linker.instance("wasi:logging/logging")?;
        logging.func_wrap(
            "log",
            |mut ctx: StoreContextMut<'_, Host>,
             (level, context, message): (LogLevel, String, String)|
             -> Result<(), wasmtime::Error> {
                ctx.data_mut()
                    .log_messages
                    .lock()
                    .unwrap()
                    .push((level, context, message));
                Ok(())
            },
        )?;
    }

    ws_mock_p2::golem::websocket::client::add_to_linker::<Host, HasSelf<Host>>(
        &mut linker,
        |host| host,
    )?;

    Ok(linker)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NodeCompatCategory {
    /// The test exercises supported public API and should pass. Failures count against primary compatibility.
    Runnable,
    /// The tested public API is not implemented yet, but is in scope for this runtime.
    KnownGap,
    /// The test requires capabilities that WASI Preview 2 cannot provide.
    WasmImpossible,
    /// The test depends on V8-specific behavior that QuickJS cannot reasonably mirror.
    EngineDifference,
    /// The test checks Node.js internal implementation details rather than public API.
    NodeInternals,
    /// The test has not been triaged yet and should not affect compatibility percentages.
    Unevaluated,
}

impl NodeCompatCategory {
    pub fn from_config_value(value: &str) -> anyhow::Result<Self> {
        match value {
            "runnable" | "expected-pass" => Ok(Self::Runnable),
            "gap" | "known-gap" | "not-implemented" => Ok(Self::KnownGap),
            "wasi-impossible" | "wasm-impossible" | "impossible" | "unsupported-by-wasi" => {
                Ok(Self::WasmImpossible)
            }
            "engine-difference" | "quickjs-difference" | "v8-specific" => {
                Ok(Self::EngineDifference)
            }
            "node-internals" | "internals" | "implementation-detail" => Ok(Self::NodeInternals),
            "unevaluated" | "untriaged" => Ok(Self::Unevaluated),
            other => anyhow::bail!("unknown node_compat category '{other}'"),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Runnable => "runnable",
            Self::KnownGap => "known gap",
            Self::WasmImpossible => "WASI-impossible",
            Self::EngineDifference => "engine difference",
            Self::NodeInternals => "Node.js internals",
            Self::Unevaluated => "unevaluated",
        }
    }

    pub fn should_ignore_in_runner(self) -> bool {
        !matches!(self, Self::Runnable)
    }

    pub fn is_primary_surface(self) -> bool {
        matches!(self, Self::Runnable | Self::KnownGap)
    }
}

#[derive(Debug, Clone)]
pub struct NodeCompatSubtestEntry {
    pub name: String,
    pub index: usize,
    pub category: NodeCompatCategory,
    pub reason: Option<String>,
    pub flaky: bool,
}

#[derive(Debug, Clone)]
pub struct NodeCompatTestEntry {
    pub path: String,
    pub category: NodeCompatCategory,
    pub reason: Option<String>,
    pub split: bool,
    pub nested_node_test: bool,
    pub isolate_block_subtests: bool,
    pub timeout_secs: u64,
    pub flaky: bool,
    pub subtests: Vec<NodeCompatSubtestEntry>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NodeModulesAppCategory {
    Runnable,
    KnownGap,
    Deferred,
}

impl NodeModulesAppCategory {
    pub fn from_config_value(value: &str) -> anyhow::Result<Self> {
        match value {
            "runnable" => Ok(Self::Runnable),
            "known-gap" | "gap" => Ok(Self::KnownGap),
            "deferred" => Ok(Self::Deferred),
            other => anyhow::bail!("unknown node_modules_apps category '{other}'"),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Runnable => "runnable",
            Self::KnownGap => "known gap",
            Self::Deferred => "deferred",
        }
    }

    pub fn status_label(self) -> &'static str {
        match self {
            Self::Runnable => "Passing",
            Self::KnownGap => "Known gap",
            Self::Deferred => "Deferred",
        }
    }

    pub fn should_ignore_in_runner(self) -> bool {
        !matches!(self, Self::Runnable)
    }
}

#[derive(Debug, Clone)]
pub struct NodeModulesAppTestEntry {
    pub file: String,
    pub category: NodeModulesAppCategory,
    pub coverage: String,
    pub reason: Option<String>,
    pub timeout_secs: u64,
    pub flaky: bool,
}

#[derive(Debug, Clone)]
pub struct NodeModulesAppEntry {
    pub name: String,
    pub category: NodeModulesAppCategory,
    pub reason: Option<String>,
    pub tests: Vec<NodeModulesAppTestEntry>,
}

/// Extract the numeric index from a subtest name like "block_00_foo" or "test_03_bar".
/// Panics if the name doesn't match the expected format (config is authoritative).
pub fn extract_node_compat_subtest_index(name: &str) -> usize {
    let after_prefix = if let Some(rest) = name.strip_prefix("block_") {
        rest
    } else if let Some(rest) = name.strip_prefix("test_") {
        rest
    } else {
        panic!("Subtest name '{name}' must start with 'block_' or 'test_'");
    };
    let digits: String = after_prefix
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect();
    digits
        .parse()
        .unwrap_or_else(|_| panic!("Subtest name '{name}' has no valid numeric index after prefix"))
}

fn is_unevaluated_node_compat_reason(reason: &str) -> bool {
    let r = reason.trim();
    r == "newly discovered, not yet evaluated" || r.starts_with("inherited: newly discovered")
}

fn node_compat_category_from_entry(
    path: &str,
    entry: &serde_json::Value,
    inherited: Option<NodeCompatCategory>,
) -> anyhow::Result<NodeCompatCategory> {
    if let Some(category) = entry.get("category").and_then(|v| v.as_str()) {
        return NodeCompatCategory::from_config_value(category);
    }

    if entry
        .get("impossible")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return Ok(NodeCompatCategory::WasmImpossible);
    }

    if entry.get("skip").and_then(|v| v.as_bool()).unwrap_or(false) {
        let reason = entry.get("reason").and_then(|v| v.as_str()).unwrap_or("");
        return Ok(if is_unevaluated_node_compat_reason(reason) {
            NodeCompatCategory::Unevaluated
        } else if uses_node_internals(path) {
            NodeCompatCategory::NodeInternals
        } else {
            NodeCompatCategory::KnownGap
        });
    }

    if let Some(category) = inherited
        && category.should_ignore_in_runner()
    {
        return Ok(category);
    }

    if uses_node_internals(path) {
        Ok(NodeCompatCategory::NodeInternals)
    } else {
        Ok(NodeCompatCategory::Runnable)
    }
}

pub fn load_node_compat_config(path: &str) -> anyhow::Result<Vec<NodeCompatTestEntry>> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let tests_obj = value
        .get("tests")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("config.jsonc missing 'tests' object"))?;

    let mut tests = Vec::new();
    for (path, opts) in tests_obj {
        let category = node_compat_category_from_entry(path, opts, None)?;
        let reason = opts
            .get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let split = opts.get("split").and_then(|v| v.as_bool()).unwrap_or(false);
        let nested_node_test = opts
            .get("nestedNodeTest")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let isolate_block_subtests = opts
            .get("isolateBlockSubtests")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let timeout_secs = opts
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS);
        let flaky = opts.get("flaky").and_then(|v| v.as_bool()).unwrap_or(false);

        let mut subtests = Vec::new();
        if let Some(subtests_obj) = opts.get("subtests").and_then(|v| v.as_object()) {
            for (subtest_name, subtest_opts) in subtests_obj {
                let sub_category =
                    node_compat_category_from_entry(path, subtest_opts, Some(category))?;
                let sub_reason = subtest_opts
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .or_else(|| reason.clone());
                let sub_flaky = subtest_opts
                    .get("flaky")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(flaky);
                let index = extract_node_compat_subtest_index(subtest_name);
                subtests.push(NodeCompatSubtestEntry {
                    name: subtest_name.clone(),
                    index,
                    category: sub_category,
                    reason: sub_reason,
                    flaky: sub_flaky,
                });
            }
        }

        tests.push(NodeCompatTestEntry {
            path: path.clone(),
            category,
            reason,
            split,
            nested_node_test,
            isolate_block_subtests,
            timeout_secs,
            flaky,
            subtests,
        });
    }

    Ok(tests)
}

pub fn load_node_modules_apps_config(path: &str) -> anyhow::Result<Vec<NodeModulesAppEntry>> {
    let content = fs::read_to_string(path)?;
    let json_str = strip_jsonc_comments(&content);
    let value: serde_json::Value = serde_json::from_str(&json_str)?;

    let apps_obj = value
        .get("apps")
        .and_then(|v| v.as_object())
        .ok_or_else(|| anyhow::anyhow!("node_modules_apps config missing 'apps' object"))?;

    let mut apps = Vec::new();
    for (app_name, opts) in apps_obj {
        let category = node_modules_app_category_from_value(opts, None)?;
        let reason = opts
            .get("reason")
            .and_then(|v| v.as_str())
            .map(str::to_string);
        let default_timeout_secs = opts
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(DEFAULT_NODE_COMPAT_TEST_TIMEOUT_SECS);
        let tests_obj = opts
            .get("tests")
            .and_then(|v| v.as_object())
            .ok_or_else(|| {
                anyhow::anyhow!("node_modules app '{app_name}' missing 'tests' object")
            })?;

        let mut tests = Vec::new();
        for (test_file, test_opts) in tests_obj {
            let test_category = node_modules_app_category_from_value(test_opts, Some(category))?;
            let (coverage, test_reason, timeout_secs, flaky) = match test_opts {
                serde_json::Value::String(coverage) => (
                    coverage.clone(),
                    reason.clone(),
                    default_timeout_secs,
                    false,
                ),
                serde_json::Value::Object(_) => {
                    let coverage = test_opts
                        .get("coverage")
                        .or_else(|| test_opts.get("description"))
                        .and_then(|v| v.as_str())
                        .ok_or_else(|| {
                            anyhow::anyhow!(
                                "node_modules app '{app_name}' test '{test_file}' missing coverage"
                            )
                        })?
                        .to_string();
                    let test_reason = test_opts
                        .get("reason")
                        .and_then(|v| v.as_str())
                        .map(str::to_string)
                        .or_else(|| reason.clone());
                    let timeout_secs = test_opts
                        .get("timeout")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(default_timeout_secs);
                    let flaky = test_opts
                        .get("flaky")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    (coverage, test_reason, timeout_secs, flaky)
                }
                _ => anyhow::bail!(
                    "node_modules app '{app_name}' test '{test_file}' must be a coverage string or object"
                ),
            };

            tests.push(NodeModulesAppTestEntry {
                file: test_file.clone(),
                category: test_category,
                coverage,
                reason: test_reason,
                timeout_secs,
                flaky,
            });
        }
        tests.sort_by(|a, b| a.file.cmp(&b.file));

        apps.push(NodeModulesAppEntry {
            name: app_name.clone(),
            category,
            reason,
            tests,
        });
    }
    apps.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(apps)
}

fn node_modules_app_category_from_value(
    value: &serde_json::Value,
    inherited: Option<NodeModulesAppCategory>,
) -> anyhow::Result<NodeModulesAppCategory> {
    if let Some(category) = value.get("category").and_then(|v| v.as_str()) {
        return NodeModulesAppCategory::from_config_value(category);
    }
    if value.get("skip").and_then(|v| v.as_bool()).unwrap_or(false) {
        return Ok(NodeModulesAppCategory::KnownGap);
    }
    Ok(inherited.unwrap_or(NodeModulesAppCategory::Runnable))
}

/// Recursively copy a directory and all its contents to a destination.
pub fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> anyhow::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Copy a vendored Node.js test file and common shims into a temp directory.
///
/// Sets up the directory layout expected by the node-compat-runner:
/// - `/home/node/test/<suite>/<test_file>` — the test itself
/// - `/home/node/test/common/` — common shims
/// - `/tmp/` — for tmpdir shim
/// - `/home/node/test/fixtures/` — fixture data files (recursively copied)
pub fn setup_node_compat_test_files(temp: &Utf8Path, test_rel_path: &str) -> anyhow::Result<()> {
    // Parse the suite name from the relative path (e.g., "parallel/test-foo.js" → "parallel")
    let suite = test_rel_path.split('/').next().unwrap_or("parallel");

    // Create directory structure: /home/node/test/<suite>/ and /home/node/test/common/
    // The /home/node prefix ensures import.meta.url matches patterns like /.*\/test\//.
    let test_root = temp.join("home").join("node").join("test");
    let suite_dir = test_root.join(suite);
    let common_dir = test_root.join("common");
    fs::create_dir_all(&suite_dir)?;
    fs::create_dir_all(&common_dir)?;

    // Copy the test file
    let test_filename = test_rel_path.rsplit('/').next().unwrap_or(test_rel_path);
    let src_test = format!("tests/node_compat/suite/{test_rel_path}");
    let dst_test = suite_dir.join(test_filename);
    fs::copy(&src_test, &dst_test)?;

    // Some vendored ESM tests import sibling test files with relative specifiers.
    // The split runner still executes one configured test at a time, but those
    // relative imports need the original suite directory shape.
    let src_suite_dir = std::path::Path::new("tests/node_compat/suite").join(suite);
    if suite == "es-module" && src_suite_dir.exists() {
        for entry in fs::read_dir(&src_suite_dir)? {
            let entry = entry?;
            if entry.file_type()?.is_file() {
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy();
                let dst = suite_dir.join(file_name_str.as_ref());
                if !dst.exists() {
                    fs::copy(entry.path(), dst)?;
                }
            }
        }
    }

    // Copy the common shim
    let src_shim = "tests/node_compat/common-shim/index.js";
    let dst_shim = common_dir.join("index.js");
    fs::copy(src_shim, &dst_shim)?;

    // Copy the common ESM shim if it exists
    let src_shim_mjs = "tests/node_compat/common-shim/index.mjs";
    if std::path::Path::new(src_shim_mjs).exists() {
        fs::copy(src_shim_mjs, common_dir.join("index.mjs"))?;
    }

    // Copy all additional common shims from common-shim directory
    let shim_dir = std::path::Path::new("tests/node_compat/common-shim");
    if shim_dir.exists() {
        for entry in fs::read_dir(shim_dir)? {
            let entry = entry?;
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            // Skip index.js and index.mjs (already copied above)
            if file_name_str == "index.js" || file_name_str == "index.mjs" {
                continue;
            }
            if entry.file_type()?.is_file() {
                fs::copy(entry.path(), common_dir.join(file_name_str.as_ref()))?;
            }
        }
    }

    // Copy vendored ESM common helpers that are not replaced by local shims.
    let vendored_common_dir = std::path::Path::new("tests/node_compat/suite/common");
    if vendored_common_dir.exists() {
        for entry in fs::read_dir(vendored_common_dir)? {
            let entry = entry?;
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            if entry.file_type()?.is_file()
                && file_name_str.ends_with(".mjs")
                && !common_dir.join(file_name_str.as_ref()).exists()
            {
                fs::copy(entry.path(), common_dir.join(file_name_str.as_ref()))?;
            }
        }
    }

    // Create /tmp directory for tmpdir shim
    let tmp_dir = temp.join("tmp");
    fs::create_dir_all(&tmp_dir)?;

    // Copy fixture data files for tests that use require('../common/fixtures')
    let fixtures_dst = test_root.join("fixtures");

    // First copy vendored suite fixtures
    let vendored_fixtures_src = std::path::Path::new("tests/node_compat/suite/fixtures");
    if vendored_fixtures_src.exists() {
        copy_dir_recursive(vendored_fixtures_src, fixtures_dst.as_std_path())?;
    }

    // Then overlay with our custom fixtures (take priority over vendored ones)
    let fixtures_src = std::path::Path::new("tests/node_compat/fixtures");
    if fixtures_src.exists() {
        copy_dir_recursive(fixtures_src, fixtures_dst.as_std_path())?;
    }

    if test_rel_path == "sequential/test-module-loading.js" && vendored_fixtures_src.exists() {
        copy_dir_recursive(vendored_fixtures_src, fixtures_dst.as_std_path())?;
    }

    Ok(())
}

pub fn collect_example_paths(dirs: &[&str]) -> anyhow::Result<Vec<Utf8PathBuf>> {
    let mut result = Vec::new();
    for dir in dirs {
        let paths = fs::read_dir(dir)?;
        for example_path in paths {
            let example_path = example_path?;
            let metadata = example_path.metadata()?;
            if metadata.is_dir() {
                let path = Utf8PathBuf::from_path_buf(example_path.path())
                    .map_err(|_| anyhow!("Non UTF-8 example path"))?;
                result.push(path);
            }
        }
    }
    Ok(result)
}

/// The WASI generation target a runtime/node_compat test is exercised against.
///
/// Selected once per process via the `WASM_RQUICKJS_TEST_TARGET` environment variable
/// (`p2` — the default — or `p3`). Preview 2 reproduces the historical behavior; Preview 3
/// generates async component exports and runs them on a Component Model async host.
#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub enum TestTarget {
    P2,
    P3,
}

impl TestTarget {
    /// Suffix appended to generated crate / shared-target directories so that P2 and P3 builds of
    /// the same example never share an output tree (the P3 generator writes a different Cargo.toml
    /// and skeleton set).
    pub fn dir_suffix(self) -> &'static str {
        match self {
            TestTarget::P2 => "",
            TestTarget::P3 => "-p3",
        }
    }

    pub fn generation_target(self) -> GenerationTarget {
        match self {
            TestTarget::P2 => GenerationTarget::WasiP2,
            TestTarget::P3 => GenerationTarget::WasiP3,
        }
    }
}

/// Reads the active test target once from `WASM_RQUICKJS_TEST_TARGET` (default: `p2`).
pub fn test_target() -> TestTarget {
    static TARGET: OnceLock<TestTarget> = OnceLock::new();
    *TARGET.get_or_init(
        || match std::env::var("WASM_RQUICKJS_TEST_TARGET").ok().as_deref() {
            Some("p3") | Some("P3") => TestTarget::P3,
            Some("p2") | Some("P2") | None => TestTarget::P2,
            Some(other) => {
                panic!("Unknown WASM_RQUICKJS_TEST_TARGET '{other}'; expected 'p2' or 'p3'")
            }
        },
    )
}

/// Copies a WIT directory to `dst`, turning every synchronous freestanding exported function into
/// an `async func`.
///
/// The Preview 3 generation path rejects *synchronous freestanding exports* — both world-level
/// `export …: func(…)` and plain `name: func(…)` declarations inside an exported `interface`. A
/// synchronous *resource instance method* additionally traps at runtime if its JS implementation
/// returns a Promise. Because the JS in these examples freely uses `async` methods, the rewrite
/// async-ifies every `name: func(` declaration — freestanding functions and resource instance
/// methods alike (see [`rewrite_wit_source_exports_async`]). Resource `constructor`s and `static
/// func`s are left synchronous: WIT has no async spelling for them, and their JS returns values
/// directly.
///
/// Only the package's own `.wit` files (those directly in `src_wit_dir`) are rewritten; the
/// `deps/` subtree is copied verbatim. Dependency interfaces are *imported* (e.g. `wasi:random`),
/// and their function signatures must keep matching the host imports, so they must never be
/// async-ified. Examples that *export* an interface defined in a dependency package may therefore
/// still fail to build or run under the P3 lane; every test is run in P3 mode on CI so such gaps
/// surface directly.
pub fn rewrite_wit_exports_async(
    src_wit_dir: &Utf8Path,
    dst_wit_dir: &Utf8Path,
) -> anyhow::Result<()> {
    if dst_wit_dir.exists() {
        fs::remove_dir_all(dst_wit_dir)?;
    }
    fs::create_dir_all(dst_wit_dir)?;

    for entry in fs::read_dir(src_wit_dir)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path =
            Utf8PathBuf::from_path_buf(entry.path()).map_err(|_| anyhow!("Non UTF-8 WIT path"))?;
        let file_name = src_path
            .file_name()
            .ok_or_else(|| anyhow!("WIT entry without file name"))?;
        let dst_path = dst_wit_dir.join(file_name);

        if file_type.is_dir() {
            // A `deps/` subtree holds *imported* interfaces. Imports satisfied by the *host*
            // (`wasi:*`, `golem:*` packages — the host registers synchronous implementations)
            // must keep their sync signatures, so those files are copied verbatim. Imports
            // satisfied by *another example component* via composition (`plug_into`) must be
            // rewritten to async, because the providing component is itself built in P3 mode
            // with its exports rewritten to `async func` — otherwise the plug's async exports
            // would not type-match the socket's sync imports.
            copy_deps_rewriting_non_host_packages(src_path.as_std_path(), dst_path.as_std_path())?;
        } else if src_path.extension() == Some("wit") {
            let rewritten = rewrite_wit_source_exports_async(&fs::read_to_string(&src_path)?);
            fs::write(&dst_path, rewritten)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Recursively copies a `deps/` subtree, rewriting `: func(` to `: async func(` in every WIT
/// file whose package is *not* host-provided. Host-provided packages (`wasi:*`, `golem:*`)
/// are copied verbatim because the test host registers synchronous implementations for them;
/// everything else (e.g. `quickjs:*` interfaces exported by sibling example components) is
/// rewritten so composed components type-match. See [`rewrite_wit_exports_async`].
fn copy_deps_rewriting_non_host_packages(
    src: &std::path::Path,
    dst: &std::path::Path,
) -> anyhow::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_deps_rewriting_non_host_packages(&src_path, &dst_path)?;
        } else if src_path.extension().and_then(|e| e.to_str()) == Some("wit") {
            let source = fs::read_to_string(&src_path)?;
            let is_host_package = source.lines().any(|line| {
                let line = line.trim_start();
                line.starts_with("package wasi:") || line.starts_with("package golem:")
            });
            if is_host_package {
                fs::write(&dst_path, source)?;
            } else {
                fs::write(&dst_path, rewrite_wit_source_exports_async(&source))?;
            }
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Line-oriented rewrite backing [`rewrite_wit_exports_async`]. Kept separate so it is trivially
/// unit-testable and free of any filesystem access.
///
/// Every line declaring a function type as `name: func(` is turned into `name: async func(`. This
/// covers world-level `export foo: func(…)`, freestanding `foo: func(…)` inside an exported
/// interface, and resource *instance* methods `bar: func(…)`. It deliberately does **not** match
/// `constructor(…)` (no `: func(`) or `baz: static func(…)` (spelled `: static func(`, not
/// `: func(`): WIT has no async spelling for those, and their JS returns values directly.
fn rewrite_wit_source_exports_async(source: &str) -> String {
    source
        .lines()
        .map(|line| {
            if line.contains(": func(") && !line.contains(": async func(") {
                line.replacen(": func(", ": async func(", 1)
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
        + if source.ends_with('\n') { "\n" } else { "" }
}

#[derive(Copy, Clone)]
pub enum FeatureCombination {
    None,
    Lite,
    Normal,
    InternalTestExecution,
    TypeScriptRuntime,
    TypeScriptTransformRuntime,
    Full,
    FullNoLogging,
    Golem,
    FullWithGolem,
    FullNoLoggingWithGolem,
    FullNoLoggingWithGolemAndTypeScript,
}

impl FeatureCombination {
    pub fn all() -> Vec<FeatureCombination> {
        vec![Self::Lite, Self::Normal, Self::Full, Self::FullWithGolem]
    }

    pub fn label(&self) -> &str {
        match self {
            Self::None => "none",
            Self::Lite => "lite",
            Self::Normal => "normal",
            Self::InternalTestExecution => "internal-test-execution",
            Self::TypeScriptRuntime => "typescript-runtime",
            Self::TypeScriptTransformRuntime => "typescript-transform-runtime",
            Self::Full => "full",
            Self::FullNoLogging => "full-no-logging",
            Self::Golem => "golem",
            Self::FullWithGolem => "full-golem",
            Self::FullNoLoggingWithGolem => "full-no-logging-golem",
            Self::FullNoLoggingWithGolemAndTypeScript => "full-no-logging-golem-typescript",
        }
    }

    pub fn cargo_args(&self) -> Vec<&'static str> {
        match self {
            // The skeleton now requires exactly one WASI target feature (`p2` or `p3`), so the
            // minimal Preview 2 build must still enable `p2` even with no other features.
            FeatureCombination::None => vec!["--no-default-features", "--features", "p2"],
            FeatureCombination::Lite => {
                vec!["--no-default-features", "--features", "lite"]
            }
            FeatureCombination::Normal => vec![],
            FeatureCombination::InternalTestExecution => {
                vec!["--features", "internal-test-execution"]
            }
            FeatureCombination::TypeScriptRuntime => vec!["--features", "typescript-runtime"],
            FeatureCombination::TypeScriptTransformRuntime => {
                vec!["--features", "typescript-transform-runtime"]
            }
            FeatureCombination::Full => {
                vec!["--no-default-features", "--features", "full"]
            }
            FeatureCombination::FullNoLogging => {
                vec!["--no-default-features", "--features", "full-no-logging"]
            }
            FeatureCombination::Golem => vec!["--features", "golem"],
            FeatureCombination::FullWithGolem => {
                vec!["--no-default-features", "--features", "full,golem"]
            }
            FeatureCombination::FullNoLoggingWithGolem => {
                vec![
                    "--no-default-features",
                    "--features",
                    "full-no-logging,golem",
                ]
            }
            FeatureCombination::FullNoLoggingWithGolemAndTypeScript => {
                vec![
                    "--no-default-features",
                    "--features",
                    "full-no-logging,golem,typescript-runtime",
                ]
            }
        }
    }

    /// Cargo `--features` args for a given [`TestTarget`].
    ///
    /// For Preview 2 this is the historical [`cargo_args`](Self::cargo_args). For Preview 3 each
    /// combination enables exactly the same capabilities as its Preview 2 counterpart: the P3
    /// tiers (`normal-p3`, `full-p3`, `full-no-logging-p3`) mirror the P2 tiers, and `golem` /
    /// `websocket` / `logging` are target-agnostic. The only difference is `fetch`/`node-http`,
    /// which are the Preview 2 HTTP implementations — the `p3` path ships its own `wasi:http@0.3`
    /// based fetch and node:http unconditionally, so `None`/`Lite` collapse onto bare `p3`. The
    /// features are always spelled out explicitly so the P3 build never silently falls back to
    /// the P2 default feature set.
    pub fn cargo_args_for_target(&self, target: TestTarget) -> Vec<&'static str> {
        match target {
            TestTarget::P2 => self.cargo_args(),
            TestTarget::P3 => {
                let features = match self {
                    FeatureCombination::None | FeatureCombination::Lite => "p3",
                    FeatureCombination::Normal => "normal-p3",
                    FeatureCombination::InternalTestExecution => {
                        "normal-p3,internal-test-execution"
                    }
                    FeatureCombination::TypeScriptRuntime => "normal-p3,typescript-runtime",
                    FeatureCombination::TypeScriptTransformRuntime => {
                        "normal-p3,typescript-transform-runtime"
                    }
                    FeatureCombination::Full => "full-p3",
                    FeatureCombination::FullNoLogging => "full-no-logging-p3",
                    FeatureCombination::Golem => "normal-p3,golem",
                    FeatureCombination::FullWithGolem => "full-p3,golem",
                    FeatureCombination::FullNoLoggingWithGolem => "full-no-logging-p3,golem",
                    FeatureCombination::FullNoLoggingWithGolemAndTypeScript => {
                        "full-no-logging-p3,golem,typescript-runtime"
                    }
                };
                vec!["--no-default-features", "--features", features]
            }
        }
    }

    fn includes_crypto_full(self) -> bool {
        matches!(
            self,
            FeatureCombination::Full
                | FeatureCombination::FullNoLogging
                | FeatureCombination::FullWithGolem
                | FeatureCombination::FullNoLoggingWithGolem
                | FeatureCombination::FullNoLoggingWithGolemAndTypeScript
        )
    }
}

pub struct PreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
}

impl PreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        init_tracing();
        match test_target() {
            TestTarget::P2 => Self::new_p2(wasm_path),
            TestTarget::P3 => Self::new_p3(wasm_path),
        }
    }

    /// Preview 3 host: a Component Model async engine, a P2+P3 WASI/HTTP linker, and the same
    /// component. Works on both stock wasmtime and the Golem fork — see [`p3_engine`].
    fn new_p3(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let engine = p3_engine()?;
        let linker = p3_linker(&engine)?;
        let component = Component::from_file(&engine, wasm_path)?;
        Ok(Self {
            engine,
            linker,
            component,
        })
    }

    fn new_p2(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let config = test_wasmtime_config()?;
        let engine = Engine::new(&config)?;

        start_test_epoch_thread(&engine);
        let linker = test_linker_with_common_hosts(&engine)?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
        })
    }
}

/// Mock logging level for wasi:logging/logging
#[derive(Debug, Clone, wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(enum)]
#[repr(u8)]
#[allow(dead_code)]
pub enum LogLevel {
    #[component(name = "trace")]
    Trace,
    #[component(name = "debug")]
    Debug,
    #[component(name = "info")]
    Info,
    #[component(name = "warn")]
    Warn,
    #[component(name = "error")]
    Error,
    #[component(name = "critical")]
    Critical,
}

/// Mock attribute-value variant for golem:api/context
#[derive(wasmtime::component::ComponentType, wasmtime::component::Lift)]
#[component(variant)]
pub enum AttributeValue {
    #[component(name = "string")]
    String(String),
}

/// Mock span for golem:api/context testing
pub struct GolemSpan {
    pub name: String,
    pub attributes: Vec<(String, String)>,
    pub finished: bool,
    resource_rep: Option<u32>,
}

/// A PreparedComponent that includes a mock golem:api/context host implementation.
pub struct GolemPreparedComponent {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
}

impl GolemPreparedComponent {
    pub fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        init_tracing();
        match test_target() {
            TestTarget::P2 => Self::new_p2(wasm_path),
            TestTarget::P3 => Self::new_p3(wasm_path),
        }
    }

    /// Preview 3 host: the P2+P3 WASI/HTTP surface plus the `wasi:logging` and `golem:websocket`
    /// mocks (see [`p3_linker`]) and the same `golem:api/context` span-recording mock as the
    /// Preview 2 host, so Golem-flavored feature combinations behave identically on both targets.
    /// Works on both stock wasmtime and the Golem fork.
    fn new_p3(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let engine = p3_engine()?;
        let mut linker = p3_linker(&engine)?;
        add_golem_context_mock(&mut linker)?;
        let component = Component::from_file(&engine, wasm_path)?;
        Ok(Self {
            engine,
            linker,
            component,
        })
    }

    fn new_p2(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let config = test_wasmtime_config()?;
        let engine = Engine::new(&config)?;

        start_test_epoch_thread(&engine);
        let mut linker = test_linker_with_common_hosts(&engine)?;

        // Mock golem:api/context@1.5.0
        add_golem_context_mock(&mut linker)?;

        let component = Component::from_file(&engine, wasm_path)?;

        Ok(Self {
            engine,
            linker,
            component,
        })
    }
}

#[allow(dead_code)]
pub struct TestInstance {
    engine: Engine,
    linker: Linker<Host>,
    component: Component,
    store: Store<Host>,
    instance: Instance,
    stdout_file: NamedUtf8TempFile,
    stderr_file: NamedUtf8TempFile,
    temp_dir: Utf8TempDir,
    golem_spans: Option<Arc<Mutex<Vec<GolemSpan>>>>,
}

impl TestInstance {
    pub async fn new(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        if test_prepared_component_cache_enabled() {
            let prepared = prepared_component_for_path(wasm_path)?;
            return Self::from_prepared(&prepared).await;
        }

        let prepared = PreparedComponent::new(wasm_path)?;
        Self::from_prepared(&prepared).await
    }

    pub async fn new_with_memory_tracking(wasm_path: &Utf8Path) -> anyhow::Result<Self> {
        let prepared = if test_prepared_component_cache_enabled() {
            prepared_component_for_path(wasm_path)?
        } else {
            Arc::new(PreparedComponent::new(wasm_path)?)
        };
        Self::from_parts(
            &prepared.engine,
            &prepared.linker,
            &prepared.component,
            None,
            true,
        )
        .await
    }

    pub async fn from_prepared(prepared: &PreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(
            &prepared.engine,
            &prepared.linker,
            &prepared.component,
            None,
            false,
        )
        .await
    }

    pub async fn from_golem_prepared(prepared: &GolemPreparedComponent) -> anyhow::Result<Self> {
        Self::from_parts(
            &prepared.engine,
            &prepared.linker,
            &prepared.component,
            Some(Arc::new(Mutex::new(Vec::new()))),
            false,
        )
        .await
    }

    async fn from_parts(
        engine: &Engine,
        linker: &Linker<Host>,
        component: &Component,
        golem_spans: Option<Arc<Mutex<Vec<GolemSpan>>>>,
        track_linear_memory: bool,
    ) -> anyhow::Result<Self> {
        let stdout_file = NamedUtf8TempFile::new()?;
        let stderr_file = NamedUtf8TempFile::new()?;

        let temp_dir = Utf8TempDir::new()?;
        fs::write(temp_dir.path().join("input.txt"), "test file contents")?;
        fs::create_dir(temp_dir.path().join("test"))?;

        let mut ctx_builder = WasiCtx::builder();
        ctx_builder
            .stdout(OutputFile::new(stdout_file.reopen()?))
            .stderr(OutputFile::new(stderr_file.reopen()?))
            .arg("first-arg")
            .arg("second-arg")
            .env("TEST_KEY", "TEST_VALUE")
            .env("TEST_KEY_2", "TEST_VALUE_2")
            .preopened_dir(&temp_dir, "/", DirPerms::all(), FilePerms::all())?
            .inherit_network()
            .allow_ip_name_lookup(true);
        #[cfg(feature = "use-golem-wasmtime")]
        let (ctx, io_ctx) = ctx_builder.build();
        #[cfg(not(feature = "use-golem-wasmtime"))]
        let ctx = ctx_builder.build();
        let http_ctx = WasiHttpCtx::new();
        let http_trace = HttpLifecycleTrace::new();
        let host = Host {
            table: Arc::new(Mutex::new(ResourceTable::new())),
            wasi: Arc::new(Mutex::new(ctx)),
            wasi_http: Arc::new(Mutex::new(http_ctx)),
            p2_http_hooks: P2HttpTraceHooks(http_trace.clone()),
            p3_http_hooks: P3HttpTraceHooks(http_trace),
            started_at: Instant::now(),
            timeout: Duration::from_secs(120),
            log_messages: Arc::new(Mutex::new(Vec::new())),
            ws_sent: Arc::new(Mutex::new(Vec::new())),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: Arc::new(Mutex::new(io_ctx)),
            golem_spans: golem_spans.clone(),
            linear_memory_high_water: track_linear_memory.then(|| Arc::new(AtomicUsize::new(0))),
        };

        let mut store = Store::new(engine, host);
        if track_linear_memory {
            store.limiter(|host| host);
        }
        store.set_epoch_deadline(0);
        store.epoch_deadline_callback(|cx| {
            let data = cx.data();
            if data.started_at.elapsed() >= data.timeout {
                Ok(UpdateDeadline::Interrupt)
            } else {
                Ok(UpdateDeadline::YieldCustom(
                    1,
                    tokio::task::yield_now().boxed(),
                ))
            }
        });

        let instance = linker.instantiate_async(&mut store, component).await?;

        Ok(Self {
            engine: engine.clone(),
            linker: linker.clone(),
            component: component.clone(),
            store,
            instance,
            stdout_file,
            stderr_file,
            temp_dir,
            golem_spans,
        })
    }

    pub async fn invoke_and_capture_output(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String) {
        let (results, stdout, _stderr) = self
            .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
            .await;
        (results, stdout)
    }

    pub async fn invoke(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> anyhow::Result<Option<Val>> {
        self.invoke_and_capture_output_inner(interface_name, function_name, args)
            .await
            .map(|results| results.first().cloned())
    }

    pub async fn invoke_and_capture_output_with_stderr(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> (anyhow::Result<Option<Val>>, String, String) {
        let results = self
            .invoke_and_capture_output_inner(interface_name, function_name, args)
            .await;

        let stdout = fs::read_to_string(&self.stdout_file).expect("failed to read stdout");
        let stderr = fs::read_to_string(&self.stderr_file).expect("failed to read stderr");

        if results.is_err() {
            for line in stdout.lines() {
                println!("[stdout] {line}");
            }
        }

        for line in stderr.lines() {
            println!("[stderr] {line}");
        }

        // Attach the captured guest output and the host-side tracing output to the error
        // itself so they show up in the test failure report (the `println!`s above are
        // captured by the test runner and are not part of the reported failure message
        // on CI).
        let results = results.map_err(|err| {
            let host_trace = host_trace();
            let http_lifecycle = self.store.data().p2_http_hooks.0.snapshot();
            let server_http_lifecycle = test_server_http_trace().snapshot();
            err.context(format!(
                "guest stdout:\n{stdout}\nguest stderr:\n{stderr}\nHTTP lifecycle:\n{http_lifecycle}\ntest-server HTTP lifecycle:\n{server_http_lifecycle}\nhost trace:\n{host_trace}"
            ))
        });

        (
            results.map(|results| results.first().cloned()),
            stdout,
            stderr,
        )
    }

    pub fn set_epoch_deadline(&mut self, timeout_secs: u64) {
        self.store.data_mut().timeout = Duration::from_secs(timeout_secs);
        self.store.data_mut().started_at = Instant::now();
    }

    pub fn temp_dir_path(&self) -> &Utf8Path {
        self.temp_dir.path()
    }

    /// Highest requested Wasm linear-memory size observed by this test instance.
    /// This is test-only instrumentation; it does not change the component API.
    pub fn linear_memory_high_water_bytes(&self) -> usize {
        self.store
            .data()
            .linear_memory_high_water
            .as_ref()
            .map_or(0, |value| value.load(Ordering::Relaxed))
    }

    pub fn golem_spans(&self) -> Option<Arc<Mutex<Vec<GolemSpan>>>> {
        self.golem_spans.clone()
    }

    pub fn read_stdout(&self) -> anyhow::Result<String> {
        Ok(fs::read_to_string(&self.stdout_file)?)
    }

    pub fn read_stderr(&self) -> anyhow::Result<String> {
        Ok(fs::read_to_string(&self.stderr_file)?)
    }

    pub fn read_log_messages(&self) -> Vec<(LogLevel, String, String)> {
        self.store.data().log_messages.lock().unwrap().clone()
    }

    pub fn read_ws_sent(&self) -> Vec<WsSentMessage> {
        self.store.data().ws_sent.lock().unwrap().clone()
    }

    async fn invoke_and_capture_output_inner(
        &mut self,
        interface_name: Option<&str>,
        function_name: &str,
        args: &[Val],
    ) -> anyhow::Result<Vec<Val>> {
        let func = match interface_name {
            Some(interface_name) => {
                let (_, exported_instance_id) = self
                    .instance
                    .get_export(&mut self.store, None, interface_name)
                    .ok_or_else(|| anyhow!("Interface {interface_name} not found"))?;
                let (_, func_id) = self
                    .instance
                    .get_export(&mut self.store, Some(&exported_instance_id), function_name)
                    .ok_or_else(|| {
                        anyhow!("Function {function_name} not found in interface {interface_name}")
                    })?;
                self.instance
                    .get_func(&mut self.store, func_id)
                    .ok_or_else(|| anyhow!("Function {function_name} not found"))?
            }
            None => self
                .instance
                .get_func(&mut self.store, function_name)
                .ok_or_else(|| anyhow!("Function {function_name} not found"))?,
        };

        match timeout(Duration::from_secs(300), self.perform_invoke(func, args)).await {
            Ok(result) => result,
            Err(_) => Err(anyhow!("Function {function_name} timed out")),
        }
    }

    async fn perform_invoke(&mut self, func: Func, args: &[Val]) -> anyhow::Result<Vec<Val>> {
        let mut results = (0..func.ty(&self.store).results().len())
            .map(|_| Val::Bool(false))
            .collect::<Vec<_>>();
        func.call_async(&mut self.store, args, &mut results).await?;
        Ok(results)
    }

    pub async fn drop_resource(&mut self, resource: ResourceAny) -> anyhow::Result<()> {
        resource.resource_drop_async(&mut self.store).await?;
        Ok(())
    }
}

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
struct PreparedComponentCacheKey {
    target: TestTarget,
    path: Utf8PathBuf,
    len: u64,
    modified: Duration,
    content_hash: u64,
}

fn prepared_component_cache_key(wasm_path: &Utf8Path) -> anyhow::Result<PreparedComponentCacheKey> {
    let metadata = fs::metadata(wasm_path)?;
    let path = fs::canonicalize(wasm_path)
        .ok()
        .and_then(|path| Utf8PathBuf::from_path_buf(path).ok())
        .unwrap_or_else(|| wasm_path.to_path_buf());
    let modified = metadata
        .modified()?
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    let mut file = fs::File::open(wasm_path)?;
    let mut buffer = [0; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        buffer[..read].hash(&mut hasher);
    }
    Ok(PreparedComponentCacheKey {
        target: test_target(),
        path,
        len: metadata.len(),
        modified,
        content_hash: hasher.finish(),
    })
}

fn prepared_component_for_path(wasm_path: &Utf8Path) -> anyhow::Result<Arc<PreparedComponent>> {
    static PREPARED_COMPONENTS: OnceLock<
        Mutex<HashMap<PreparedComponentCacheKey, Arc<PreparedComponent>>>,
    > = OnceLock::new();
    static DROPPED: OnceLock<()> = OnceLock::new();

    let key = prepared_component_cache_key(wasm_path)?;
    let mut prepared = PREPARED_COMPONENTS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .unwrap();

    if test_drop_cache_enabled() {
        DROPPED.get_or_init(|| prepared.clear());
    }

    if let Some(component) = prepared.get(&key) {
        return Ok(component.clone());
    }

    let component = Arc::new(PreparedComponent::new(wasm_path)?);
    prepared.insert(key, component.clone());
    Ok(component)
}

pub async fn invoke_and_capture_output(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String) {
    let (results, stdout, _stderr) =
        invoke_and_capture_output_with_stderr(wasm_path, interface_name, function_name, args).await;
    (results, stdout)
}

pub async fn invoke_and_capture_output_with_stderr(
    wasm_path: &Utf8Path,
    interface_name: Option<&str>,
    function_name: &str,
    args: &[Val],
) -> (anyhow::Result<Option<Val>>, String, String) {
    match TestInstance::new(wasm_path).await {
        Ok(mut test_instance) => {
            test_instance
                .invoke_and_capture_output_with_stderr(interface_name, function_name, args)
                .await
        }
        Err(e) => (Err(e), String::new(), String::new()),
    }
}

enum WasmSource {
    Precompiled(Utf8PathBuf),
    OwnedTemporary(NamedUtf8TempFile),
}

pub struct CompiledTest {
    wasm: WasmSource,
}

impl CompiledTest {
    pub async fn new(path: &Utf8Path, use_shared_target: bool) -> anyhow::Result<CompiledTest> {
        Self::new_with_features(path, use_shared_target, FeatureCombination::Normal).await
    }

    pub async fn new_unoptimized_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        Self::compile_with_features(path, use_shared_target, feature_combination).await
    }

    pub async fn new_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        let compiled =
            Self::compile_with_features(path, use_shared_target, feature_combination).await?;
        let compiled = if test_unoptimized_enabled() {
            compiled
        } else {
            compiled.optimize().await?
        };
        if truthy_env(TEST_PRECOMPILE_COMPONENT_ENV) {
            let started = Instant::now();
            if precompile_component(compiled.wasm_path())? {
                println!(
                    "Precompiled changed component once before parallel workers start: {} ({:.3?})",
                    compiled.wasm_path(),
                    started.elapsed()
                );
            }
        }
        Ok(compiled)
    }

    async fn compile_with_features(
        path: &Utf8Path,
        use_shared_target: bool,
        feature_combination: FeatureCombination,
    ) -> anyhow::Result<CompiledTest> {
        drop_test_artifact_cache_once();
        let target = test_target();
        let name = path.file_name().unwrap();
        // P2 and P3 builds of the same example never share an output tree.
        let feature_label = format!("{}{}", feature_combination.label(), target.dir_suffix());
        let wrapper_crate_root = Utf8Path::new("tmp").join(name).join(&feature_label);

        // shared_target is relative to wrapper_crate_root.
        // this is a _different_ shared target than the one used in the compilation tests to make
        // sure different feature combinations do not interfere with these tests. P3 uses its own
        // shared target so P2 and P3 artifacts never collide.
        let shared_target_name = format!("rt-target{}", target.dir_suffix());
        let shared_target = Utf8Path::new("..").join("..").join(&shared_target_name);
        let wasm_file_name = format!("{}.wasm", name.to_snake_case());
        let compiled_wasm_path = if use_shared_target {
            Utf8Path::new("tmp")
                .join(&shared_target_name)
                .join("wasm32-wasip2")
                .join("debug")
                .join(&wasm_file_name)
        } else {
            wrapper_crate_root
                .join("target")
                .join("wasm32-wasip2")
                .join("debug")
                .join(&wasm_file_name)
        };
        let compile_stamp = test_cache_stamp(name, feature_combination, "compile");
        let compile_inputs = vec![
            path.to_path_buf(),
            Utf8Path::new("crates").join("wasm-rquickjs").join("src"),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("skeleton"),
            Utf8Path::new("crates").join("wasi-logging").join("src"),
            Utf8Path::new("Cargo.toml").to_path_buf(),
            Utf8Path::new("Cargo.lock").to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("Cargo.toml"),
            Utf8Path::new("crates")
                .join("wasi-logging")
                .join("Cargo.toml"),
        ];
        let compile_signature = cache_stamp_signature(
            name,
            feature_combination,
            "compile",
            &[
                ("target", "wasm32-wasip2".to_string()),
                ("generation_target", format!("{target:?}")),
                ("use_shared_target", use_shared_target.to_string()),
                (
                    "cargo_args",
                    feature_combination.cargo_args_for_target(target).join("|"),
                ),
                (
                    "crypto_dev_opt_level",
                    if feature_combination.includes_crypto_full() {
                        "3"
                    } else {
                        "default"
                    }
                    .to_string(),
                ),
            ],
        );

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &compiled_wasm_path,
                &compile_stamp,
                &compile_inputs,
                &compile_signature,
            )
        {
            println!("Reusing cached wrapper component {compiled_wasm_path}");
            return Ok(CompiledTest {
                wasm: Precompiled(compiled_wasm_path),
            });
        }

        let _cache_lock = if test_artifact_cache_enabled() {
            Some(TestCacheLock::acquire(test_cache_lock(
                name,
                feature_combination,
                "compile",
            ))?)
        } else {
            None
        };

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &compiled_wasm_path,
                &compile_stamp,
                &compile_inputs,
                &compile_signature,
            )
        {
            println!("Reusing cached wrapper component {compiled_wasm_path}");
            return Ok(CompiledTest {
                wasm: Precompiled(compiled_wasm_path),
            });
        }

        // The Preview 3 generation path rejects synchronous freestanding exports, so for P3 we
        // rewrite the example's WIT so its world-level exported functions become `async func`
        // before generation. The rewritten WIT lives inside the wrapper crate dir so it never
        // touches the committed example sources.
        let wit_dir = match target {
            TestTarget::P2 => path.join("wit"),
            TestTarget::P3 => {
                let rewritten = wrapper_crate_root.join("wit-async");
                rewrite_wit_exports_async(&path.join("wit"), &rewritten)?;
                rewritten
            }
        };

        println!(
            "Generating wrapper create for example '{name}' ({:?}) to {wrapper_crate_root}",
            target
        );
        generate_wrapper_crate_with_target(
            &wit_dir,
            &[JsModuleSpec {
                name: name.to_string(),
                mode: EmbeddingMode::EmbedFile(path.join("src").join(format!("{name}.js"))),
            }],
            &wrapper_crate_root,
            None,
            target.generation_target(),
        )?;

        println!("Compiling wrapper crate in {wrapper_crate_root}");
        let locked_build = truthy_env(TEST_LOCKED_BUILDS_ENV);
        let build_wrapper = |offline: bool| -> std::io::Result<_> {
            let mut command = Command::new("cargo");
            command.arg("build");
            if locked_build {
                command.arg("--locked");
            }
            if offline {
                command.arg("--offline");
            }
            if feature_combination.includes_crypto_full() {
                command
                    .arg("--config")
                    .arg("profile.dev.package.rsa.opt-level=3")
                    .arg("--config")
                    .arg("profile.dev.package.num-bigint-dig.opt-level=3");
            }
            command.arg("--target").arg("wasm32-wasip2");
            if use_shared_target {
                command.arg("--target-dir");
                command.arg(&shared_target);
            }
            command
                .args(feature_combination.cargo_args_for_target(target))
                .current_dir(&wrapper_crate_root)
                .status()
        };
        let mut status = build_wrapper(locked_build)?;
        if locked_build && !status.success() {
            println!("Locked local build failed; retrying with dependency downloads enabled");
            status = build_wrapper(false)?;
        }
        if !status.success() {
            return Err(std::io::Error::other(format!(
                "cargo build failed for {wrapper_crate_root}"
            ))
            .into());
        }

        if test_artifact_cache_enabled() {
            refresh_cache_stamp(&compile_stamp, &compile_signature)?;
        }

        Ok(CompiledTest {
            wasm: Precompiled(compiled_wasm_path),
        })
    }

    /// Run Wizer pre-initialization on the compiled component.
    /// Returns a new `CompiledTest` pointing to the optimized wasm file.
    pub async fn optimize(&self) -> anyhow::Result<CompiledTest> {
        drop_test_artifact_cache_once();

        let input = self.wasm_path();
        let optimized = input.with_extension("optimized.wasm");
        let optimize_stamp = input.with_extension("optimized.stamp");
        let optimize_inputs = vec![
            input.to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("src")
                .join("optimize.rs"),
            Utf8Path::new("Cargo.toml").to_path_buf(),
            Utf8Path::new("Cargo.lock").to_path_buf(),
            Utf8Path::new("crates")
                .join("wasm-rquickjs")
                .join("Cargo.toml"),
        ];
        let optimize_signature = cache_stamp_signature(
            input.file_stem().unwrap_or("component"),
            FeatureCombination::Normal,
            "optimize",
            &[
                ("input", input.to_string()),
                ("init_func", "wizer-initialize".to_string()),
                ("optimizer", "wasm_rquickjs::optimize_component".to_string()),
            ],
        );
        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &optimized,
                &optimize_stamp,
                &optimize_inputs,
                &optimize_signature,
            )
        {
            println!("Reusing cached optimized component {optimized}");
            return Ok(CompiledTest {
                wasm: Precompiled(optimized),
            });
        }

        let _cache_lock = if test_artifact_cache_enabled() {
            let lock_name = input.file_stem().unwrap_or("component");
            Some(TestCacheLock::acquire(test_cache_lock(
                lock_name,
                FeatureCombination::Normal,
                "optimize",
            ))?)
        } else {
            None
        };

        if test_artifact_cache_enabled()
            && output_fresh_for_inputs(
                &optimized,
                &optimize_stamp,
                &optimize_inputs,
                &optimize_signature,
            )
        {
            println!("Reusing cached optimized component {optimized}");
            return Ok(CompiledTest {
                wasm: Precompiled(optimized),
            });
        }

        println!("Optimizing component {input} -> {optimized}");
        wasm_rquickjs::optimize_component(input, &optimized, "wizer-initialize").await?;
        if test_artifact_cache_enabled() {
            refresh_cache_stamp(&optimize_stamp, &optimize_signature)?;
        }
        Ok(CompiledTest {
            wasm: Precompiled(optimized),
        })
    }

    pub fn wasm_path(&self) -> &Utf8Path {
        match &self.wasm {
            WasmSource::Precompiled(path) => path,
            WasmSource::OwnedTemporary(temp_file) => temp_file.path(),
        }
    }
}

/// Opt `CompiledTest` into test-r's `Cloneable` sharing strategy so that
/// worker subprocesses can share the parent's compilation result instead
/// of forcing the suite into single-threaded mode under output capturing.
///
/// The wire format is just the **absolute** wasm path. The parent compiles
/// the wrapper crate once (via the existing `CompiledTest::new*` ctors) into
/// a stable on-disk location under `tmp/<example>/<features>/...` (or the
/// shared `tmp/rt-target/...` tree when `use_shared_target = true`) — these
/// paths outlive both the dep value and the suite. Each worker simply receives
/// the path and reconstructs a `Precompiled(...)` `CompiledTest` that points
/// at the same on-disk artifact.
///
/// `OwnedTemporary` is only ever produced by `plug_into`, which is called
/// inside test bodies (never inside a `#[test_dep]` ctor). Shipping an
/// `OwnedTemporary` over wire would silently delete the temp file as soon as
/// the parent dropped the value after `to_wire`, leaving workers reading a
/// dangling path. We refuse loudly instead.
impl test_r::core::CloneableDep for CompiledTest {
    fn to_wire(&self) -> Vec<u8> {
        match &self.wasm {
            Precompiled(path) => {
                let abs = path.canonicalize_utf8().unwrap_or_else(|e| {
                    panic!(
                        "CompiledTest path '{path}' must exist before \
                         being shipped via Cloneable scope: {e}"
                    )
                });
                abs.as_str().as_bytes().to_vec()
            }
            WasmSource::OwnedTemporary(_) => panic!(
                "OwnedTemporary CompiledTest cannot be shared via Cloneable \
                 scope; plug_into() output must stay inside a single test body"
            ),
        }
    }

    fn from_wire(bytes: &[u8]) -> Self {
        let path_str = std::str::from_utf8(bytes)
            .expect("Cloneable CompiledTest wire bytes must be valid UTF-8 path");
        let path = Utf8PathBuf::from(path_str);
        assert!(
            path.exists(),
            "Cloneable CompiledTest received path that does not exist: {path}. \
             The parent must keep the compiled wasm artifact alive for the suite duration."
        );
        CompiledTest {
            wasm: Precompiled(path),
        }
    }
}

impl CompiledTest {
    pub fn plug_into(&self, other: &CompiledTest) -> anyhow::Result<CompiledTest> {
        let mut graph = CompositionGraph::new();
        let socket_package =
            Package::from_file("socket", None, other.wasm_path(), graph.types_mut())?;
        let socket_id = graph.register_package(socket_package)?;

        let plug_package = Package::from_file("plug", None, self.wasm_path(), graph.types_mut())?;
        let plug_id = graph.register_package(plug_package)?;

        plug(
            &mut graph,
            vec![(self.wasm_path().to_string(), plug_id)],
            socket_id,
        )?;

        let bytes = graph.encode(EncodeOptions::default())?;
        let mut wasm_path = NamedUtf8TempFile::new()?;
        wasm_path.write_all(bytes.as_slice())?;
        wasm_path.flush()?;
        Ok(CompiledTest {
            wasm: WasmSource::OwnedTemporary(wasm_path),
        })
    }
}

#[derive(Clone)]
pub struct Host {
    pub table: Arc<Mutex<ResourceTable>>,
    pub wasi: Arc<Mutex<WasiCtx>>,
    pub wasi_http: Arc<Mutex<WasiHttpCtx>>,
    p2_http_hooks: P2HttpTraceHooks,
    p3_http_hooks: P3HttpTraceHooks,
    pub started_at: Instant,
    pub timeout: Duration,
    pub log_messages: Arc<Mutex<Vec<(LogLevel, String, String)>>>,
    pub ws_sent: Arc<Mutex<Vec<WsSentMessage>>>,
    #[cfg(feature = "use-golem-wasmtime")]
    pub io_ctx: Arc<Mutex<wasmtime_wasi::IoCtx>>,
    pub golem_spans: Option<Arc<Mutex<Vec<GolemSpan>>>>,
    pub linear_memory_high_water: Option<Arc<AtomicUsize>>,
}

impl wasmtime::ResourceLimiter for Host {
    fn memory_growing(
        &mut self,
        current: usize,
        desired: usize,
        _maximum: Option<usize>,
        #[cfg(feature = "use-golem-wasmtime")] kind: wasmtime::MemoryKind,
    ) -> wasmtime::Result<bool> {
        #[cfg(feature = "use-golem-wasmtime")]
        let is_linear_memory = kind == wasmtime::MemoryKind::LinearMemory;
        #[cfg(not(feature = "use-golem-wasmtime"))]
        let is_linear_memory = true;
        if is_linear_memory && let Some(high_water) = &self.linear_memory_high_water {
            high_water.fetch_max(current.max(desired), Ordering::Relaxed);
        }
        Ok(true)
    }

    fn table_growing(
        &mut self,
        _current: usize,
        _desired: usize,
        _maximum: Option<usize>,
    ) -> wasmtime::Result<bool> {
        Ok(true)
    }
}

impl WasiView for Host {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: Arc::get_mut(&mut self.wasi)
                .expect("WasiCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiCtx mutex must never fail"),
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            #[cfg(feature = "use-golem-wasmtime")]
            io_ctx: Arc::get_mut(&mut self.io_ctx)
                .expect("IoCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("IoCtx mutex must never fail"),
        }
    }
}

impl WasiHttpView for Host {
    fn http(&mut self) -> WasiHttpCtxView<'_> {
        WasiHttpCtxView {
            ctx: Arc::get_mut(&mut self.wasi_http)
                .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiHttpCtx mutex must never fail"),
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            hooks: &mut self.p2_http_hooks,
        }
    }
}

// ---------------------------------------------------------------------------------------------
// WASI Preview 3 (Component Model async) host support.
//
// Works on both stock wasmtime and the Golem wasmtime fork (`use-golem-wasmtime`). The shared
// `Host` handles the fork's extra `IoCtx` view field and excludes its GC-heap callbacks from the
// guest linear-memory high-water metric.
// ---------------------------------------------------------------------------------------------

/// Preview 3 engine: same stack/epoch configuration as the P2 host, plus Component Model async
/// support so that async-lifted exports can be driven by the concurrent executor that
/// `Func::call_async` uses internally.
fn p3_engine() -> anyhow::Result<Engine> {
    let config = test_p3_wasmtime_config()?;
    let engine = Engine::new(&config)?;

    start_test_epoch_thread(&engine);
    Ok(engine)
}

/// Preview 3 linker: the P2 WASI surface (P3 components still import residual `wasi:io`/0.2 std
/// interfaces), the P3 WASI surface, and the P3 async HTTP surface used by `fetch`. Also mocks
/// `wasi:logging/logging` and `golem:websocket/client@1.5.0` so P3 builds with the (target-
/// agnostic) `logging` / `websocket` features can instantiate; the definitions are ignored by
/// components that don't import them.
fn p3_linker(engine: &Engine) -> anyhow::Result<Linker<Host>> {
    let mut linker: Linker<Host> = Linker::new(engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;
    wasmtime_wasi::p3::add_to_linker(&mut linker)?;
    wasmtime_wasi_http::p3::add_to_linker(&mut linker)?;
    add_wasi_logging_mock(&mut linker)?;
    add_websocket_client_mock(&mut linker, TestTarget::P3)?;
    Ok(linker)
}

/// Mock `wasi:logging/logging`: records every `log` call in the Host's `log_messages` list.
fn add_wasi_logging_mock(linker: &mut Linker<Host>) -> anyhow::Result<()> {
    let mut logging = linker.instance("wasi:logging/logging")?;
    logging.func_wrap(
        "log",
        |mut ctx: StoreContextMut<'_, Host>,
         (level, context, message): (LogLevel, String, String)|
         -> Result<(), wasmtime::Error> {
            ctx.data_mut()
                .log_messages
                .lock()
                .unwrap()
                .push((level, context, message));
            Ok(())
        },
    )?;
    Ok(())
}

/// Mock `golem:api/context@1.5.0`: implements `start-span`, `span.set-attribute`, and
/// `span.finish`, recording every span in the current store's list so tests can assert on the
/// emitted tracing spans without sharing records between component instances.
fn add_golem_context_mock(linker: &mut Linker<Host>) -> anyhow::Result<()> {
    let mut golem_ctx = linker.instance("golem:api/context@1.5.0")?;

    // Register the span resource type
    let span_resource_type = ResourceType::host::<GolemSpan>();
    golem_ctx.resource("span", span_resource_type, {
        move |mut ctx: StoreContextMut<'_, Host>, rep: u32| {
            // Destructor: mark span as finished if not already
            let table = ctx.data_mut().table.lock().unwrap();
            // Resource already dropped by wasmtime
            let _ = (rep, table);
            Ok(())
        }
    })?;

    // start-span: func(name: string) -> span
    golem_ctx.func_wrap(
        "start-span",
        move |mut ctx: StoreContextMut<'_, Host>,
              (name,): (String,)|
              -> Result<(wasmtime::component::Resource<GolemSpan>,), wasmtime::Error> {
            let spans = ctx
                .data()
                .golem_spans
                .clone()
                .expect("Golem span host requires an instance-local span collection");
            let span = GolemSpan {
                name: name.clone(),
                attributes: Vec::new(),
                finished: false,
                resource_rep: None,
            };
            let mut table = ctx.data_mut().table.lock().unwrap();
            let resource = table.push(span)?;
            let resource_rep = resource.rep();
            if let Ok(span) = table.get_mut(&resource) {
                span.resource_rep = Some(resource_rep);
            }
            spans.lock().unwrap().push(GolemSpan {
                name,
                attributes: Vec::new(),
                finished: false,
                resource_rep: Some(resource_rep),
            });
            Ok((resource,))
        },
    )?;

    // [method]span.set-attribute: func(name: string, value: attribute-value)
    // attribute-value is a variant with one case: string(string)
    golem_ctx.func_wrap(
        "[method]span.set-attribute",
        move |mut ctx: StoreContextMut<'_, Host>,
              (span_res, attr_name, attr_value): (
            wasmtime::component::Resource<GolemSpan>,
            String,
            AttributeValue,
        )|
              -> Result<(), wasmtime::Error> {
            let spans = ctx
                .data()
                .golem_spans
                .clone()
                .expect("Golem span host requires an instance-local span collection");
            let value_str = match &attr_value {
                AttributeValue::String(s) => s.clone(),
            };
            let resource_rep = span_res.rep();
            let mut table = ctx.data_mut().table.lock().unwrap();
            if let Ok(span) = table.get_mut(&span_res) {
                span.attributes.push((attr_name.clone(), value_str.clone()));
            }
            let mut shared = spans.lock().unwrap();
            if let Some(recorded) = shared
                .iter_mut()
                .rev()
                .find(|span| span.resource_rep == Some(resource_rep))
            {
                recorded.attributes.push((attr_name, value_str));
            }
            Ok(())
        },
    )?;

    // [method]span.finish: func()
    golem_ctx.func_wrap(
        "[method]span.finish",
        move |mut ctx: StoreContextMut<'_, Host>,
              (span_res,): (wasmtime::component::Resource<GolemSpan>,)|
              -> Result<(), wasmtime::Error> {
            let spans = ctx
                .data()
                .golem_spans
                .clone()
                .expect("Golem span host requires an instance-local span collection");
            let resource_rep = span_res.rep();
            let mut table = ctx.data_mut().table.lock().unwrap();
            if let Ok(span) = table.get_mut(&span_res) {
                span.finished = true;
                let name = span.name.clone();
                let attributes = span.attributes.clone();
                let mut shared = spans.lock().unwrap();
                if let Some(recorded) = shared
                    .iter_mut()
                    .rev()
                    .find(|span| span.resource_rep == Some(resource_rep))
                {
                    recorded.name = name;
                    recorded.finished = true;
                    recorded.attributes = attributes;
                }
            }
            Ok(())
        },
    )?;

    Ok(())
}

/// Add the target-specific functional `golem:websocket/client@1.5.0` mock.
///
/// Connections close cleanly on receive and sent frames remain instance-local for exact assertions.
fn add_websocket_client_mock(linker: &mut Linker<Host>, target: TestTarget) -> anyhow::Result<()> {
    match target {
        TestTarget::P2 => {
            ws_mock_p2::golem::websocket::client::add_to_linker::<Host, HasSelf<Host>>(
                linker,
                |host| host,
            )?;
        }
        TestTarget::P3 => {
            ws_mock_p3::golem::websocket::client::add_to_linker::<Host, HasSelf<Host>>(
                linker,
                |host| host,
            )?;
        }
    }
    Ok(())
}

impl wasmtime_wasi_http::p3::WasiHttpView for Host {
    fn http(&mut self) -> wasmtime_wasi_http::p3::WasiHttpCtxView<'_> {
        wasmtime_wasi_http::p3::WasiHttpCtxView {
            hooks: &mut self.p3_http_hooks,
            table: Arc::get_mut(&mut self.table)
                .expect("ResourceTable is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("ResourceTable mutex must never fail"),
            ctx: Arc::get_mut(&mut self.wasi_http)
                .expect("WasiHttpCtx is shared and cannot be borrowed mutably")
                .get_mut()
                .expect("WasiHttpCtx mutex must never fail"),
        }
    }
}

// Based on https://github.com/bytecodealliance/wac/blob/release-0.6.0/crates/wac-graph/src/plug.rs#L23
// but instead of returning NoPlugError, it logs skipped instantiations
fn plug(
    graph: &mut CompositionGraph,
    plugs: Vec<(String, PackageId)>,
    socket: PackageId,
) -> Result<(), PlugError> {
    let socket_instantiation = graph.instantiate(socket);

    let mut requested_plugs = BTreeSet::<String>::new();
    let mut plug_exports_to_plug = BTreeMap::<String, String>::new();

    for (plug_name, plug) in plugs {
        requested_plugs.insert(plug_name.clone());

        let mut plug_exports = Vec::new();
        let mut cache = Default::default();
        let mut checker = SubtypeChecker::new(&mut cache);
        for (name, plug_ty) in &graph.types()[graph[plug].ty()].exports {
            if let Some(socket_ty) = graph.types()[graph[socket].ty()].imports.get(name)
                && checker
                    .is_subtype(*plug_ty, graph.types(), *socket_ty, graph.types())
                    .is_ok()
            {
                plug_exports.push(name.clone());
            }
        }

        // Instantiate the plug component
        let mut plug_instantiation = None;
        for plug_export_name in plug_exports {
            plug_exports_to_plug.insert(plug_export_name.clone(), plug_name.clone());

            let plug_instantiation =
                *plug_instantiation.get_or_insert_with(|| graph.instantiate(plug));
            let export = graph
                .alias_instance_export(plug_instantiation, &plug_export_name)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
            graph
                .set_instantiation_argument(socket_instantiation, &plug_export_name, export)
                .map_err(|err| PlugError::GraphError { source: err.into() })?;
        }
    }

    // Export all exports from the socket component.
    for name in graph.types()[graph[socket].ty()]
        .exports
        .keys()
        .cloned()
        .collect::<Vec<_>>()
    {
        let export = graph
            .alias_instance_export(socket_instantiation, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;

        graph
            .export(export, &name)
            .map_err(|err| PlugError::GraphError { source: err.into() })?;
    }

    Ok(())
}

/// Classify a test filename into a module category based on its name prefix.
pub fn classify_test(filename: &str) -> &str {
    // Strip "test-" prefix
    let name = filename
        .strip_prefix("test-")
        .unwrap_or(filename)
        .strip_suffix(".js")
        .unwrap_or(filename);

    if name.starts_with("path") {
        "path"
    } else if name.starts_with("assert") {
        "assert"
    } else if name.starts_with("buffer") {
        "buffer"
    } else if name.starts_with("stream") {
        "stream"
    } else if name.starts_with("string-decoder") || name.starts_with("stringdecoder") {
        "string_decoder"
    } else if name.starts_with("url") {
        "url"
    } else if name.starts_with("util") {
        "util"
    } else if name.starts_with("querystring") {
        "querystring"
    } else if name.starts_with("events") || name.starts_with("event-emitter") {
        "events"
    } else if name.starts_with("fs") || name.starts_with("file") {
        "fs"
    } else if name.starts_with("crypto") {
        "crypto"
    } else if name.starts_with("http") || name.starts_with("http2") || name.starts_with("https") {
        "http"
    } else if name.starts_with("net") {
        "net"
    } else if name.starts_with("dns") {
        "dns"
    } else if name.starts_with("os") {
        "os"
    } else if name.starts_with("process") {
        "process"
    } else if name.starts_with("child-process") || name.starts_with("child_process") {
        "child_process"
    } else if name.starts_with("tls") || name.starts_with("ssl") {
        "tls"
    } else if name.starts_with("zlib") {
        "zlib"
    } else if name.starts_with("console") {
        "console"
    } else if name.starts_with("timers")
        || name.starts_with("settimeout")
        || name.starts_with("setinterval")
        || name.starts_with("setimmediate")
    {
        "timers"
    } else if name.starts_with("worker") || name.starts_with("worker-threads") {
        "worker_threads"
    } else if name.starts_with("cluster") {
        "cluster"
    } else if name.starts_with("readline") {
        "readline"
    } else if name.starts_with("repl") {
        "repl"
    } else if name.starts_with("vm") {
        "vm"
    } else if name.starts_with("dgram") {
        "dgram"
    } else if name.starts_with("tty") {
        "tty"
    } else if name.starts_with("async-hooks")
        || name.starts_with("async-context")
        || name.starts_with("async-local-storage")
    {
        "async_hooks"
    } else if name.starts_with("inspector") || name.starts_with("debugger") {
        "inspector"
    } else if name.starts_with("module")
        || name.starts_with("require")
        || name.starts_with("esm")
        || name.starts_with("cjs")
        || name.starts_with("loaders")
    {
        "module"
    } else if name.starts_with("perf") || name.starts_with("performance") {
        "perf_hooks"
    } else if name.starts_with("diagnostics") {
        "diagnostics_channel"
    } else if name.starts_with("domain") {
        "domain"
    } else if name.starts_with("v8") {
        "v8"
    } else if name.starts_with("trace") {
        "trace_events"
    } else if name.starts_with("runner") || name.starts_with("test-runner") {
        "test_runner"
    } else if name.starts_with("abortcontroller")
        || name.starts_with("abortsignal")
        || name.starts_with("aborted")
    {
        "abort"
    } else if name.starts_with("encoding")
        || name.starts_with("textdecoder")
        || name.starts_with("textencoder")
    {
        "encoding"
    } else if name.starts_with("blob") {
        "blob"
    } else if name.starts_with("fetch")
        || name.starts_with("response")
        || name.starts_with("request")
        || name.starts_with("headers")
    {
        "fetch"
    } else if name.starts_with("readable")
        || name.starts_with("writable")
        || name.starts_with("transform")
        || name.starts_with("duplex")
    {
        "stream"
    } else if name.starts_with("sqlite") {
        "sqlite"
    } else if name.starts_with("whatwg") {
        "whatwg"
    } else if name.starts_with("webcrypto") {
        "webcrypto"
    } else if name.starts_with("permission") {
        "permission"
    } else if name.starts_with("promise") || name.starts_with("promises") {
        "promises"
    } else if name.starts_with("global") {
        "global"
    } else if name.starts_with("compile") {
        "compile"
    } else if name.starts_with("cli") {
        "cli"
    } else if name.starts_with("stdin") || name.starts_with("stdout") || name.starts_with("stdio") {
        "stdio"
    } else if name.starts_with("signal") {
        "signal"
    } else if name.starts_with("errors") || name.starts_with("error") {
        "errors"
    } else if name.starts_with("pipe")
        || name.starts_with("socket")
        || name.starts_with("listen")
        || name.starts_with("tcp")
    {
        "net"
    } else if name.starts_with("webstream") || name.starts_with("webstreams") {
        "webstreams"
    } else if name.starts_with("snapshot") {
        "snapshot"
    } else if name.starts_with("eslint") {
        "eslint"
    } else if name.starts_with("internal") {
        "internal"
    } else if name.starts_with("heap") {
        "heap"
    } else if name.starts_with("node") {
        "node"
    } else if name.starts_with("inspect") {
        "inspector"
    } else if name.starts_with("shadow-realm") {
        "shadow_realm"
    } else if name.starts_with("btoa") || name.starts_with("atob") {
        "encoding"
    } else if name.starts_with("common") {
        "common"
    } else {
        "other"
    }
}

/// Check if a test file relies on Node.js internals (not public API).
///
/// Detects patterns like `// Flags: --expose-internals`, `require('internal/...')`,
/// and `internalBinding(...)` in the test source code.
pub fn uses_node_internals(test_path: &str) -> bool {
    let file_path = format!("tests/node_compat/suite/{test_path}");
    let content = match fs::read_to_string(&file_path) {
        Ok(c) => c,
        Err(_) => return false,
    };
    // Only check the first 50 lines for the Flags comment (it's always near the top)
    let header: String = content.lines().take(50).collect::<Vec<_>>().join("\n");
    if header.contains("--expose-internals") {
        return true;
    }
    // Check the full file for internal requires/bindings
    content.contains("require('internal/")
        || content.contains("require(\"internal/")
        || content.contains("internalBinding(")
}

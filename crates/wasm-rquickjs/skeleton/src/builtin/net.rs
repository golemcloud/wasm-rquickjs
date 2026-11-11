use std::cell::RefCell;
#[cfg(feature = "net-write-profiling")]
use std::time::Instant;

use rquickjs::class::Trace;
use rquickjs::prelude::List;
use rquickjs::{Ctx, Exception, JsLifetime, TypedArray};

// ── Preview 3 imports ───────────────────────────────────────────────────
//
// The P3 `wasi:sockets` TCP model is stream-based rather than pollable-based:
//   * `bind`/`listen` are synchronous, `connect` is `async`.
//   * `receive()` hands back a `stream<u8>` reader (call once); reading it maps
//     to Node's incremental `read`.
//   * `send(stream<u8>)` takes the read-end of a stream we own and returns a
//     completion `future` (call once); we keep the writer end and feed it on
//     each Node `write`. The returned future is retained so the operation is
//     not cancelled.
//   * `listen()` returns a `stream<tcp-socket>` of accepted connections.
use futures::channel::oneshot;
use futures::future::Either;
use std::rc::Rc;
use wasip3::sockets::types::{ErrorCode, IpAddressFamily, TcpSocket as WasiTcpSocket};
use wasip3::wit_bindgen::rt::async_support::{
    FutureReader, StreamReader, StreamResult, StreamWriter,
};

use super::socket_helpers::{
    error_code_to_errno, ip_address_to_string, ip_socket_address, ip_socket_address_family,
    ip_socket_address_port, parse_ip_address, throw_socket_error,
};

#[rquickjs::module]
pub mod native_module {
    pub use super::TcpListener;
    pub use super::TcpSocket;

    #[rquickjs::function]
    pub fn create_tcp_socket(
        ctx: rquickjs::Ctx<'_>,
        family: u32,
    ) -> rquickjs::Result<super::TcpSocket> {
        super::create_tcp_socket_impl(&ctx, family)
    }

    #[rquickjs::function]
    pub fn create_tcp_listener(
        ctx: rquickjs::Ctx<'_>,
        family: u32,
    ) -> rquickjs::Result<super::TcpListener> {
        super::create_tcp_listener_impl(&ctx, family)
    }
}

// ── TcpSocket (client and accepted connections) ─────────────────────────

#[cfg(feature = "net-write-profiling")]
#[derive(Default)]
struct TcpWriteProfile {
    native_calls: u64,
    requested_bytes: u64,
    copied_bytes: u64,
    completed_bytes: u64,
    elapsed_ns: u64,
    p2_check_write_calls: u64,
    p2_capacity_waits: u64,
    p2_capacity_wait_ns: u64,
    p2_write_calls: u64,
    p3_stream_write_ops: u64,
    native_read_calls: u64,
    requested_read_bytes: u64,
    completed_read_bytes: u64,
    read_elapsed_ns: u64,
    p2_read_ops: u64,
    p2_read_waits: u64,
    p2_read_wait_ns: u64,
    p3_read_ops: u64,
}

#[cfg(feature = "net-write-profiling")]
impl TcpWriteProfile {
    fn to_json(&self) -> String {
        serde_json::to_string(&serde_json::json!({
            "nativeCalls": self.native_calls,
            "requestedBytes": self.requested_bytes,
            "copiedBytes": self.copied_bytes,
            "completedBytes": self.completed_bytes,
            "elapsedNs": self.elapsed_ns,
            "p2CheckWriteCalls": self.p2_check_write_calls,
            "p2CapacityWaits": self.p2_capacity_waits,
            "p2CapacityWaitNs": self.p2_capacity_wait_ns,
            "p2WriteCalls": self.p2_write_calls,
            "p3StreamWriteOps": self.p3_stream_write_ops,
            "nativeReadCalls": self.native_read_calls,
            "requestedReadBytes": self.requested_read_bytes,
            "completedReadBytes": self.completed_read_bytes,
            "readElapsedNs": self.read_elapsed_ns,
            "p2ReadOps": self.p2_read_ops,
            "p2ReadWaits": self.p2_read_waits,
            "p2ReadWaitNs": self.p2_read_wait_ns,
            "p3ReadOps": self.p3_read_ops,
        }))
        .expect("TCP write profile is serializable")
    }
}

fn create_tcp_socket_impl(ctx: &Ctx<'_>, family: u32) -> rquickjs::Result<TcpSocket> {
    crate::internal::preinit::check("TCP socket creation", "network socket");
    let ip_family = match family {
        4 => IpAddressFamily::Ipv4,
        6 => IpAddressFamily::Ipv6,
        _ => {
            return Err(throw_socket_error(
                ctx,
                "EINVAL",
                "socket",
                &format!("Invalid address family: {family}"),
            ));
        }
    };

    let socket = WasiTcpSocket::create(ip_family).map_err(|e| {
        throw_socket_error(
            ctx,
            error_code_to_errno(&e),
            "socket",
            &format!("Failed to create TCP socket: {e:?}"),
        )
    })?;

    Ok(TcpSocket {
        inner: RefCell::new(TcpInner {
            socket: Some(Rc::new(socket)),
            reader: None,
            writer: None,
            send_future: None,
            recv_future: None,
            recv_error: None,
            read_cancel: None,
            write_cancel: None,
            family: ip_family,
            connected: false,
            closed: false,
            pending_write_bytes: 0,
            #[cfg(feature = "net-write-profiling")]
            write_profile: TcpWriteProfile::default(),
        }),
    })
}

/// P3 socket state. Unlike P2, there are no pollables: reads/writes borrow the
/// stream reader/writer out of the `RefCell` for the duration of an `await`
/// (sequential per the Node stream state machine), while a cloned `Rc` keeps the
/// underlying socket resource alive even if `close()` races with an in-flight op.
struct TcpInner {
    socket: Option<Rc<WasiTcpSocket>>,
    /// Receive-side stream from `receive()`; `None` once EOF is reached or the
    /// read side is shut down.
    reader: Option<StreamReader<u8>>,
    /// Write-side of the stream handed to `send()`; `None` once the write side is
    /// shut down (SHUT_WR) or the socket is closed.
    writer: Option<StreamWriter<u8>>,
    /// Retained completion futures for the one-shot `send()`/`receive()` calls so
    /// the operations are not cancelled while their streams are in use.
    send_future: Option<FutureReader<Result<(), ErrorCode>>>,
    recv_future: Option<FutureReader<Result<(), ErrorCode>>>,
    /// Receive completion error retained until already-buffered bytes have been
    /// delivered to JavaScript.
    recv_error: Option<ErrorCode>,
    /// Wakes the in-flight `read()` / `write()` (if any) when the socket is
    /// closed or the corresponding side is shut down. Without this, a pending
    /// `StreamReader::read` would pin the socket resource (via its cloned `Rc`)
    /// and the JS event loop alive until the *peer* closes the connection.
    read_cancel: Option<oneshot::Sender<()>>,
    write_cancel: Option<oneshot::Sender<()>>,
    family: IpAddressFamily,
    connected: bool,
    closed: bool,
    /// Bytes not yet accepted by the WASI stream writer for the active write.
    pending_write_bytes: usize,
    #[cfg(feature = "net-write-profiling")]
    write_profile: TcpWriteProfile,
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class]
pub struct TcpSocket {
    #[qjs(skip_trace)]
    inner: RefCell<TcpInner>,
}

#[rquickjs::methods]
impl TcpSocket {
    #[qjs(constructor)]
    pub fn new(ctx: Ctx<'_>) -> rquickjs::Result<Self> {
        Err(Exception::throw_message(
            &ctx,
            "TcpSocket cannot be constructed directly, use create_tcp_socket()",
        ))
    }

    // `bind` is synchronous in P3, but the JS contract awaits it, so this stays
    // an `async fn` with no await points.
    pub async fn bind(&self, ctx: Ctx<'_>, addr: String, port: u32) -> rquickjs::Result<()> {
        let ip = parse_ip_address(&addr).ok_or_else(|| {
            throw_socket_error(&ctx, "EINVAL", "bind", &format!("Invalid address: {addr}"))
        })?;
        let sock_addr = ip_socket_address(ip, port as u16);

        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "bind",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "bind", "Socket was closed or reset")
        })?;
        socket.bind(sock_addr).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "bind",
                &format!("bind failed: {e:?}"),
            )
        })
    }

    pub async fn connect(&self, ctx: Ctx<'_>, addr: String, port: u32) -> rquickjs::Result<()> {
        let ip = parse_ip_address(&addr).ok_or_else(|| {
            throw_socket_error(
                &ctx,
                "EINVAL",
                "connect",
                &format!("Invalid address: {addr}"),
            )
        })?;
        let remote_addr = ip_socket_address(ip, port as u16);

        let socket = {
            let inner = self.inner.borrow();
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "connect",
                    "Socket is closed",
                ));
            }
            if inner.connected {
                return Err(throw_socket_error(
                    &ctx,
                    "EISCONN",
                    "connect",
                    "Socket is already connected",
                ));
            }
            inner.socket.clone().ok_or_else(|| {
                throw_socket_error(&ctx, "EBADF", "connect", "Socket was closed or reset")
            })?
        };

        // `connect` is async in P3; the cloned `Rc` keeps the socket alive across
        // the await even if `close()` runs concurrently.
        if let Err(e) = socket.connect(remote_addr).await {
            let mut inner = self.inner.borrow_mut();
            inner.closed = true;
            inner.connected = false;
            inner.socket = None;
            inner.reader = None;
            inner.writer = None;
            inner.send_future = None;
            inner.recv_future = None;
            inner.recv_error = None;
            return Err(throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "connect",
                &format!("connect failed: {e:?}"),
            ));
        }

        // Wire up the receive stream and the send stream (each may be called only
        // once per socket).
        let (recv_reader, recv_future) = socket.receive();
        let (writer, send_read) = wasip3::wit_stream::new::<u8>();
        let send_future = socket.send(send_read);

        let mut inner = self.inner.borrow_mut();
        if inner.closed {
            // Closed while connecting; drop the freshly created streams.
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "connect",
                "Socket was closed or reset",
            ));
        }
        inner.reader = Some(recv_reader);
        inner.recv_future = Some(recv_future);
        inner.recv_error = None;
        inner.writer = Some(writer);
        inner.send_future = Some(send_future);
        inner.connected = true;
        Ok(())
    }

    pub async fn read(&self, ctx: Ctx<'_>, len: u64) -> rquickjs::Result<Option<Vec<u8>>> {
        #[cfg(feature = "net-write-profiling")]
        let read_started = Instant::now();
        let (_keepalive, mut reader, mut cancel_rx) = {
            let mut inner = self.inner.borrow_mut();
            if let Some(error) = inner.recv_error.take() {
                return Err(throw_socket_error(
                    &ctx,
                    error_code_to_errno(&error),
                    "read",
                    &format!("receive failed: {error:?}"),
                ));
            }
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "read",
                    "Socket is closed",
                ));
            }
            if !inner.connected {
                return Err(throw_socket_error(
                    &ctx,
                    "ENOTCONN",
                    "read",
                    "Socket is not connected",
                ));
            }
            #[cfg(feature = "net-write-profiling")]
            {
                inner.write_profile.native_read_calls += 1;
                inner.write_profile.requested_read_bytes += len;
            }
            match (inner.socket.clone(), inner.reader.take()) {
                (Some(sock), Some(reader)) => {
                    // Register a cancel signal so `close()` / `shutdown(SHUT_RD)`
                    // can wake this read; otherwise the pending stream read would
                    // keep the socket resource and the JS event loop alive until
                    // the peer closes the connection.
                    let (cancel_tx, cancel_rx) = oneshot::channel();
                    inner.read_cancel = Some(cancel_tx);
                    (sock, reader, cancel_rx)
                }
                // No reader means the receive side already reached EOF or was shut
                // down: report end-of-stream.
                _ => return Ok(None),
            }
        };

        let cap = if len == 0 { 16384 } else { len as usize };
        loop {
            #[cfg(feature = "net-write-profiling")]
            {
                self.inner.borrow_mut().write_profile.p3_read_ops += 1;
            }
            let (status, buf) = {
                let read_fut = reader.read(Vec::with_capacity(cap));
                futures::pin_mut!(read_fut);
                match futures::future::select(read_fut, &mut cancel_rx).await {
                    Either::Left((result, _)) => result,
                    Either::Right(_) => {
                        // Cancelled by `close()` or `shutdown(SHUT_RD)`. Dropping
                        // the in-flight read future issues `stream.cancel-read`;
                        // dropping the reader and the keepalive `Rc` releases the
                        // socket.
                        return Ok(None);
                    }
                }
            };
            match status {
                StreamResult::Complete(_) if !buf.is_empty() => {
                    let mut inner = self.inner.borrow_mut();
                    inner.read_cancel = None;
                    #[cfg(feature = "net-write-profiling")]
                    {
                        inner.write_profile.completed_read_bytes += buf.len() as u64;
                        inner.write_profile.read_elapsed_ns +=
                            read_started.elapsed().as_nanos() as u64;
                    }
                    if !inner.closed {
                        inner.reader = Some(reader);
                    }
                    return Ok(Some(buf));
                }
                // A zero-length completion carries no data and no EOF signal; retry.
                StreamResult::Complete(_) => continue,
                StreamResult::Dropped => {
                    // The stream closing does not distinguish a graceful FIN
                    // from a socket error. The receive completion future does.
                    let recv_future = {
                        let mut inner = self.inner.borrow_mut();
                        inner.read_cancel = None;
                        inner.reader = None;
                        inner.recv_future.take()
                    };
                    if let Some(recv_future) = recv_future
                        && let Err(error) = recv_future.await
                    {
                        if !buf.is_empty() {
                            self.inner.borrow_mut().recv_error = Some(error);
                            return Ok(Some(buf));
                        }
                        return Err(throw_socket_error(
                            &ctx,
                            error_code_to_errno(&error),
                            "read",
                            &format!("receive failed: {error:?}"),
                        ));
                    }
                    if buf.is_empty() {
                        return Ok(None);
                    }
                    return Ok(Some(buf));
                }
                StreamResult::Cancelled => {
                    self.inner.borrow_mut().read_cancel = None;
                    return Ok(None);
                }
            }
        }
    }

    pub async fn write<'js>(
        &self,
        ctx: Ctx<'js>,
        data: TypedArray<'js, u8>,
        _timeout_checkpoint: Option<rquickjs::Function<'js>>,
    ) -> rquickjs::Result<u32> {
        #[cfg(feature = "net-write-profiling")]
        let write_started = Instant::now();
        let data = crate::wrappers::copy_typed_array_bytes(&data)
            .ok_or_else(|| Exception::throw_message(&ctx, "write buffer is detached"))?;
        let total = data.len();
        let (_keepalive, mut writer, mut cancel_rx) = {
            let mut inner = self.inner.borrow_mut();
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "write",
                    "Socket is closed",
                ));
            }
            if !inner.connected {
                return Err(throw_socket_error(
                    &ctx,
                    "ENOTCONN",
                    "write",
                    "Socket is not connected",
                ));
            }
            #[cfg(feature = "net-write-profiling")]
            {
                inner.write_profile.native_calls += 1;
                inner.write_profile.requested_bytes += total as u64;
                inner.write_profile.copied_bytes += total as u64;
            }
            match (inner.socket.clone(), inner.writer.take()) {
                (Some(sock), Some(writer)) => {
                    // Rust owns the exact remaining byte count while JS uses
                    // `_writeInFlight` only to select this native observation.
                    inner.pending_write_bytes = total;
                    // Register a cancel signal so `close()` can wake a write that
                    // is blocked on stream capacity (see `read_cancel`).
                    let (cancel_tx, cancel_rx) = oneshot::channel();
                    inner.write_cancel = Some(cancel_tx);
                    (sock, writer, cancel_rx)
                }
                // No writer means the write side was shut down (SHUT_WR).
                _ => {
                    return Err(throw_socket_error(
                        &ctx,
                        "EPIPE",
                        "write",
                        "Write after end",
                    ));
                }
            }
        };

        let leftover = {
            let write_fut = async {
                // Mirror StreamWriter::write_all without copying the input, but
                // expose progress after each actual component-stream write.
                #[cfg(feature = "net-write-profiling")]
                {
                    self.inner.borrow_mut().write_profile.p3_stream_write_ops += 1;
                }
                let (mut status, mut buffer) = writer.write(data).await;
                self.inner.borrow_mut().pending_write_bytes = buffer.remaining();
                loop {
                    match status {
                        StreamResult::Complete(_) if buffer.remaining() > 0 => {
                            #[cfg(feature = "net-write-profiling")]
                            {
                                self.inner.borrow_mut().write_profile.p3_stream_write_ops += 1;
                            }
                            (status, buffer) = writer.write_buf(buffer).await;
                            self.inner.borrow_mut().pending_write_bytes = buffer.remaining();
                            if status == StreamResult::Cancelled {
                                status = StreamResult::Complete(0);
                            }
                        }
                        _ => return buffer.into_vec(),
                    }
                }
            };
            futures::pin_mut!(write_fut);
            match futures::future::select(write_fut, &mut cancel_rx).await {
                Either::Left((leftover, _)) => leftover,
                Either::Right(_) => {
                    // Cancelled by `close()`. Dropping the in-flight write future
                    // cancels the pending stream write; dropping the writer and
                    // the keepalive `Rc` releases the socket.
                    self.inner.borrow_mut().pending_write_bytes = 0;
                    return Err(throw_socket_error(
                        &ctx,
                        "EPIPE",
                        "write",
                        "Socket is closed",
                    ));
                }
            }
        };
        let send_future = {
            let mut inner = self.inner.borrow_mut();
            inner.write_cancel = None;
            inner.pending_write_bytes = 0;
            #[cfg(feature = "net-write-profiling")]
            {
                inner.write_profile.elapsed_ns += write_started.elapsed().as_nanos() as u64;
                inner.write_profile.completed_bytes += (total - leftover.len()) as u64;
            }
            if leftover.is_empty() {
                if !inner.closed {
                    inner.writer = Some(writer);
                }
                return Ok(total as u32);
            }

            // The peer hung up before all bytes were accepted. Take the send
            // completion future out while borrowed, then await after the
            // RefCell guard has left scope.
            inner.writer = None;
            inner.send_future.take()
        };
        if let Some(send_future) = send_future
            && let Err(error) = send_future.await
        {
            return Err(throw_socket_error(
                &ctx,
                error_code_to_errno(&error),
                "write",
                &format!("send failed: {error:?}"),
            ));
        }
        Err(throw_socket_error(&ctx, "EPIPE", "write", "Stream closed"))
    }

    pub fn write_queue_size(&self) -> u64 {
        self.inner.borrow().pending_write_bytes as u64
    }

    pub fn set_write_timeout(&self, _timeout_ms: Option<u32>) {}

    pub fn write_profile(&self) -> Option<String> {
        // rquickjs cannot cfg-remove an individual method from this methods impl.
        // A JSON string therefore means the private profiling feature is enabled.
        #[cfg(feature = "net-write-profiling")]
        {
            Some(self.inner.borrow().write_profile.to_json())
        }
        #[cfg(not(feature = "net-write-profiling"))]
        {
            None
        }
    }

    pub fn shutdown(&self, ctx: Ctx<'_>, how: u32) -> rquickjs::Result<()> {
        let mut inner = self.inner.borrow_mut();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "shutdown",
                "Socket is closed",
            ));
        }
        if !inner.connected {
            return Err(throw_socket_error(
                &ctx,
                "ENOTCONN",
                "shutdown",
                "Socket is not connected",
            ));
        }
        match how {
            // SHUT_RD: drop the receive stream (discards queued data) and cancel
            // an in-flight read (which owns the taken-out reader).
            0 => {
                inner.reader = None;
                if let Some(tx) = inner.read_cancel.take() {
                    let _ = tx.send(());
                }
            }
            // SHUT_WR: drop the send-stream writer, which closes the stream and
            // makes the host emit a FIN. Keep `send_future` so the host can drain
            // any already-written bytes.
            1 => {
                inner.writer = None;
            }
            2 => {
                inner.reader = None;
                inner.writer = None;
                if let Some(tx) = inner.read_cancel.take() {
                    let _ = tx.send(());
                }
                if let Some(tx) = inner.write_cancel.take() {
                    let _ = tx.send(());
                }
            }
            _ => {
                return Err(throw_socket_error(
                    &ctx,
                    "EINVAL",
                    "shutdown",
                    &format!("Invalid shutdown type: {how}"),
                ));
            }
        }
        Ok(())
    }

    pub fn local_address(&self, ctx: Ctx<'_>) -> rquickjs::Result<List<(String, u32, String)>> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "address",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "address", "Socket was closed or reset")
        })?;
        let addr = socket.get_local_address().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "address",
                &format!("local_address failed: {e:?}"),
            )
        })?;
        let addr_str = ip_address_to_string(&addr);
        let port = ip_socket_address_port(&addr) as u32;
        let family = ip_socket_address_family(&addr).to_string();
        Ok(List((addr_str, port, family)))
    }

    pub fn remote_address(&self, ctx: Ctx<'_>) -> rquickjs::Result<List<(String, u32, String)>> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "remoteAddress",
                "Socket is closed",
            ));
        }
        if !inner.connected {
            return Err(throw_socket_error(
                &ctx,
                "ENOTCONN",
                "remoteAddress",
                "Socket is not connected",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "remoteAddress", "Socket was closed or reset")
        })?;
        let addr = socket.get_remote_address().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "remoteAddress",
                &format!("remote_address failed: {e:?}"),
            )
        })?;
        let addr_str = ip_address_to_string(&addr);
        let port = ip_socket_address_port(&addr) as u32;
        let family = ip_socket_address_family(&addr).to_string();
        Ok(List((addr_str, port, family)))
    }

    pub fn set_keep_alive(&self, ctx: Ctx<'_>, enable: bool, idle_ms: u64) -> rquickjs::Result<()> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "setKeepAlive",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "setKeepAlive", "Socket was closed or reset")
        })?;
        socket.set_keep_alive_enabled(enable).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setKeepAlive",
                &format!("set_keep_alive_enabled failed: {e:?}"),
            )
        })?;
        if enable && idle_ms > 0 {
            let nanos = idle_ms * 1_000_000;
            socket.set_keep_alive_idle_time(nanos).map_err(|e| {
                throw_socket_error(
                    &ctx,
                    error_code_to_errno(&e),
                    "setKeepAlive",
                    &format!("set_keep_alive_idle_time failed: {e:?}"),
                )
            })?;
        }
        Ok(())
    }

    pub fn set_no_delay(&self, _ctx: Ctx<'_>, _enable: bool) -> rquickjs::Result<()> {
        // WASI TCP does not expose TCP_NODELAY — silent no-op
        Ok(())
    }

    pub fn set_recv_buffer_size(&self, ctx: Ctx<'_>, size: u64) -> rquickjs::Result<()> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "setRecvBufferSize",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(
                &ctx,
                "EBADF",
                "setRecvBufferSize",
                "Socket was closed or reset",
            )
        })?;
        socket.set_receive_buffer_size(size).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setRecvBufferSize",
                &format!("set_receive_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn set_send_buffer_size(&self, ctx: Ctx<'_>, size: u64) -> rquickjs::Result<()> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "setSendBufferSize",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(
                &ctx,
                "EBADF",
                "setSendBufferSize",
                "Socket was closed or reset",
            )
        })?;
        socket.set_send_buffer_size(size).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setSendBufferSize",
                &format!("set_send_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn address_family(&self) -> u32 {
        let inner = self.inner.borrow();
        match inner.family {
            IpAddressFamily::Ipv4 => 4,
            IpAddressFamily::Ipv6 => 6,
        }
    }

    pub fn close(&self) {
        let mut inner = self.inner.borrow_mut();
        if inner.closed {
            return;
        }
        inner.closed = true;
        inner.connected = false;
        // Drop the writer first so the send stream closes (FIN) before the socket
        // resource is released. In-flight read/write tasks hold their own reader/
        // writer and a cloned `Rc`; cancel them so they release those handles —
        // otherwise a pending read would pin the socket resource (and the JS
        // event loop) alive until the peer closes the connection.
        if let Some(tx) = inner.read_cancel.take() {
            let _ = tx.send(());
        }
        if let Some(tx) = inner.write_cancel.take() {
            let _ = tx.send(());
        }
        inner.writer = None;
        inner.send_future = None;
        inner.reader = None;
        inner.recv_future = None;
        inner.recv_error = None;
        inner.socket = None;
    }

    pub fn force_close(&self) {
        // On P3 `close()` already tears everything down immediately; in-flight
        // tasks own their taken-out stream handles and are cancelled by `close()`.
        self.close();
    }
}

// ── TcpListener (server sockets) ────────────────────────────────────────

fn create_tcp_listener_impl(ctx: &Ctx<'_>, family: u32) -> rquickjs::Result<TcpListener> {
    crate::internal::preinit::check("TCP listener creation", "network listener");
    let ip_family = match family {
        4 => IpAddressFamily::Ipv4,
        6 => IpAddressFamily::Ipv6,
        _ => {
            return Err(throw_socket_error(
                ctx,
                "EINVAL",
                "socket",
                &format!("Invalid address family: {family}"),
            ));
        }
    };

    let socket = WasiTcpSocket::create(ip_family).map_err(|e| {
        throw_socket_error(
            ctx,
            error_code_to_errno(&e),
            "socket",
            &format!("Failed to create TCP socket: {e:?}"),
        )
    })?;

    Ok(TcpListener {
        inner: RefCell::new(ListenerInner {
            socket: Some(Rc::new(socket)),
            accept_stream: None,
            accept_cancel: None,
            listening: false,
            closed: false,
        }),
    })
}

/// P3 listener state. `listen()` yields a `stream<tcp-socket>` that we read one
/// accepted connection at a time; a cloned `Rc` keeps the listener socket alive
/// across the `accept` await even if `close()` races.
struct ListenerInner {
    socket: Option<Rc<WasiTcpSocket>>,
    accept_stream: Option<StreamReader<WasiTcpSocket>>,
    /// Wakes the in-flight `accept()` (if any) when the listener is closed, so
    /// the pending accept-stream read does not pin the listener socket (via its
    /// cloned `Rc`) and the JS event loop alive.
    accept_cancel: Option<oneshot::Sender<()>>,
    listening: bool,
    closed: bool,
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class]
pub struct TcpListener {
    #[qjs(skip_trace)]
    inner: RefCell<ListenerInner>,
}

#[rquickjs::methods]
impl TcpListener {
    #[qjs(constructor)]
    pub fn new(ctx: Ctx<'_>) -> rquickjs::Result<Self> {
        Err(Exception::throw_message(
            &ctx,
            "TcpListener cannot be constructed directly, use create_tcp_listener()",
        ))
    }

    // `bind` is synchronous in P3; kept `async` to match the JS contract.
    pub async fn bind(&self, ctx: Ctx<'_>, addr: String, port: u32) -> rquickjs::Result<()> {
        self.bind_sync(ctx, addr, port)
    }

    pub fn bind_sync(&self, ctx: Ctx<'_>, addr: String, port: u32) -> rquickjs::Result<()> {
        let ip = parse_ip_address(&addr).ok_or_else(|| {
            throw_socket_error(&ctx, "EINVAL", "bind", &format!("Invalid address: {addr}"))
        })?;
        let sock_addr = ip_socket_address(ip, port as u16);

        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "bind",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "bind", "Socket was closed or reset")
        })?;
        socket.bind(sock_addr).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "bind",
                &format!("bind failed: {e:?}"),
            )
        })
    }

    pub fn listen_sync(&self, ctx: Ctx<'_>) -> rquickjs::Result<()> {
        let mut inner = self.inner.borrow_mut();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "listen",
                "Socket is closed",
            ));
        }
        if inner.listening {
            return Err(throw_socket_error(
                &ctx,
                "EINVAL",
                "listen",
                "Socket is already listening",
            ));
        }
        let stream = {
            let socket = inner.socket.as_ref().ok_or_else(|| {
                throw_socket_error(&ctx, "EBADF", "listen", "Socket was closed or reset")
            })?;
            socket.listen().map_err(|e| {
                throw_socket_error(
                    &ctx,
                    error_code_to_errno(&e),
                    "listen",
                    &format!("listen failed: {e:?}"),
                )
            })?
        };
        inner.accept_stream = Some(stream);
        inner.listening = true;
        Ok(())
    }

    // `listen` is synchronous in P3; kept `async` to match the JS contract.
    pub async fn listen(&self, ctx: Ctx<'_>) -> rquickjs::Result<()> {
        self.listen_sync(ctx)
    }

    pub fn set_backlog(&self, ctx: Ctx<'_>, size: u64) -> rquickjs::Result<()> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "setBacklog",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "setBacklog", "Socket was closed or reset")
        })?;
        socket.set_listen_backlog_size(size).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setBacklog",
                &format!("set_listen_backlog_size failed: {e:?}"),
            )
        })
    }

    pub async fn accept(
        &self,
        ctx: Ctx<'_>,
    ) -> rquickjs::Result<List<(TcpSocket, String, u32, String)>> {
        let (_keepalive, mut stream, mut cancel_rx) = {
            let mut inner = self.inner.borrow_mut();
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "accept",
                    "Socket is closed",
                ));
            }
            if !inner.listening {
                return Err(throw_socket_error(
                    &ctx,
                    "EINVAL",
                    "accept",
                    "Socket is not listening",
                ));
            }
            match (inner.socket.clone(), inner.accept_stream.take()) {
                (Some(sock), Some(stream)) => {
                    // Register a cancel signal so `close()` can wake this accept;
                    // otherwise the pending accept-stream read would keep the
                    // listener socket resource and the JS event loop alive.
                    let (cancel_tx, cancel_rx) = oneshot::channel();
                    inner.accept_cancel = Some(cancel_tx);
                    (sock, stream, cancel_rx)
                }
                _ => {
                    return Err(throw_socket_error(
                        &ctx,
                        "EBADF",
                        "accept",
                        "Socket was closed or reset",
                    ));
                }
            }
        };

        let accepted = {
            let accept_fut = stream.next();
            futures::pin_mut!(accept_fut);
            match futures::future::select(accept_fut, &mut cancel_rx).await {
                Either::Left((accepted, _)) => accepted,
                Either::Right(_) => {
                    // Returning drops the in-flight stream read and the keepalive
                    // `Rc`, releasing the listener socket after `close()`.
                    return Err(throw_socket_error(
                        &ctx,
                        "EBADF",
                        "accept",
                        "Socket was closed or reset",
                    ));
                }
            }
        };

        let client = {
            let mut inner = self.inner.borrow_mut();
            inner.accept_cancel = None;
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "accept",
                    "Socket was closed or reset",
                ));
            }
            inner.accept_stream = Some(stream);
            match accepted {
                Some(client) => client,
                // The accept stream only ends on fatal errors or listener drop.
                None => {
                    return Err(throw_socket_error(
                        &ctx,
                        "EBADF",
                        "accept",
                        "Listener stopped accepting connections",
                    ));
                }
            }
        };

        let client = Rc::new(client);

        let (addr_str, port, family) = match client.get_remote_address() {
            Ok(addr) => {
                let a = ip_address_to_string(&addr);
                let p = ip_socket_address_port(&addr) as u32;
                let f = ip_socket_address_family(&addr).to_string();
                (a, p, f)
            }
            Err(_) => ("0.0.0.0".to_string(), 0, "IPv4".to_string()),
        };
        let client_family = client.get_address_family();

        // Wire up receive/send streams for the accepted connection (each may be
        // called only once per socket).
        let (recv_reader, recv_future) = client.receive();
        let (writer, send_read) = wasip3::wit_stream::new::<u8>();
        let send_future = client.send(send_read);

        let wrapped = TcpSocket {
            inner: RefCell::new(TcpInner {
                socket: Some(client),
                reader: Some(recv_reader),
                writer: Some(writer),
                send_future: Some(send_future),
                recv_future: Some(recv_future),
                recv_error: None,
                read_cancel: None,
                write_cancel: None,
                family: client_family,
                connected: true,
                closed: false,
                pending_write_bytes: 0,
                #[cfg(feature = "net-write-profiling")]
                write_profile: TcpWriteProfile::default(),
            }),
        };

        Ok(List((wrapped, addr_str, port, family)))
    }

    pub fn local_address(&self, ctx: Ctx<'_>) -> rquickjs::Result<List<(String, u32, String)>> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                &ctx,
                "EBADF",
                "address",
                "Socket is closed",
            ));
        }
        let socket = inner.socket.as_ref().ok_or_else(|| {
            throw_socket_error(&ctx, "EBADF", "address", "Socket was closed or reset")
        })?;
        let addr = socket.get_local_address().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "address",
                &format!("local_address failed: {e:?}"),
            )
        })?;
        let addr_str = ip_address_to_string(&addr);
        let port = ip_socket_address_port(&addr) as u32;
        let family = ip_socket_address_family(&addr).to_string();
        Ok(List((addr_str, port, family)))
    }

    pub fn close(&self) {
        let mut inner = self.inner.borrow_mut();
        if inner.closed {
            return;
        }
        inner.closed = true;
        inner.listening = false;
        // Wake an in-flight `accept()` so it releases its taken-out stream and
        // its cloned socket `Rc` (see `accept_cancel`).
        if let Some(tx) = inner.accept_cancel.take() {
            let _ = tx.send(());
        }
        inner.accept_stream = None;
        inner.socket = None;
    }
}

pub const NET_JS: &str = include_str!("net.js");
pub const REEXPORT_JS: &str = r#"export * from 'node:net'; export { default } from 'node:net';"#;

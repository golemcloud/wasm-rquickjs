use std::cell::RefCell;

use rquickjs::class::Trace;
use rquickjs::prelude::List;
use rquickjs::{Ctx, Exception, JsLifetime};

use std::rc::Rc;
use wasip3::sockets::types::{IpAddressFamily, IpSocketAddress, UdpSocket};

use super::socket_helpers::{
    error_code_to_errno, ip_address_to_string, ip_socket_address, ip_socket_address_family,
    ip_socket_address_port, parse_ip_address, throw_socket_error,
};

#[rquickjs::module]
pub mod native_module {
    pub use super::DgramSocket;

    #[rquickjs::function]
    pub fn create_socket(ctx: rquickjs::Ctx<'_>, family: u32) -> rquickjs::Result<DgramSocket> {
        super::create_socket_impl(&ctx, family)
    }
}

// The Preview 3 `wasi:sockets/types` UDP API drops the datagram-stream abstraction: a
// `udp-socket` has async `send`/`receive` methods directly, and `bind`/`connect`/`disconnect`
// are synchronous (no `start`/`finish` polling). The socket is stored in an `Rc` so a
// clone can be moved across the `.await` of `send`/`receive` without holding a `RefCell`
// borrow across the suspension point.
fn create_socket_impl(ctx: &Ctx<'_>, family: u32) -> rquickjs::Result<DgramSocket> {
    crate::internal::preinit::check("UDP socket creation", "network socket");
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

    let socket = UdpSocket::create(ip_family).map_err(|e| {
        throw_socket_error(
            ctx,
            error_code_to_errno(&e),
            "socket",
            &format!("Failed to create UDP socket: {e:?}"),
        )
    })?;

    Ok(DgramSocket {
        inner: RefCell::new(DgramInner {
            socket: Some(Rc::new(socket)),
            bound: false,
            connected: false,
            closed: false,
        }),
    })
}

struct DgramInner {
    socket: Option<Rc<UdpSocket>>,
    bound: bool,
    connected: bool,
    closed: bool,
}

#[derive(Trace, JsLifetime)]
#[rquickjs::class]
pub struct DgramSocket {
    #[qjs(skip_trace)]
    inner: RefCell<DgramInner>,
}

// Non-exported helpers for the Preview 3 `DgramSocket`. These must live outside the
// `#[rquickjs::methods]` block because that macro tries to expose every method to JavaScript.
impl DgramSocket {
    fn socket_rc(&self, ctx: &Ctx<'_>, syscall: &str) -> rquickjs::Result<Rc<UdpSocket>> {
        let inner = self.inner.borrow();
        if inner.closed {
            return Err(throw_socket_error(
                ctx,
                "EBADF",
                syscall,
                "Socket is closed",
            ));
        }
        inner
            .socket
            .clone()
            .ok_or_else(|| throw_socket_error(ctx, "EBADF", syscall, "Socket was closed or reset"))
    }

    async fn ensure_bound(&self, ctx: &Ctx<'_>, syscall: &str) -> rquickjs::Result<()> {
        let (needs_bind, family) = {
            let inner = self.inner.borrow();
            if inner.closed {
                return Err(throw_socket_error(
                    ctx,
                    "EBADF",
                    syscall,
                    "Socket is closed",
                ));
            }
            let family = inner.socket.as_ref().map(|s| s.get_address_family());
            (!inner.bound, family)
        };
        if !needs_bind {
            return Ok(());
        }
        let any_addr = match family {
            Some(IpAddressFamily::Ipv6) => "::",
            _ => "0.0.0.0",
        };
        self.bind(ctx.clone(), any_addr.to_string(), 0).await
    }
}

#[rquickjs::methods]
impl DgramSocket {
    #[qjs(constructor)]
    pub fn new(ctx: Ctx<'_>) -> rquickjs::Result<Self> {
        Err(Exception::throw_message(
            &ctx,
            "DgramSocket cannot be constructed directly, use create_socket()",
        ))
    }

    pub async fn bind(&self, ctx: Ctx<'_>, addr: String, port: u32) -> rquickjs::Result<()> {
        let ip = parse_ip_address(&addr).ok_or_else(|| {
            throw_socket_error(&ctx, "EINVAL", "bind", &format!("Invalid address: {addr}"))
        })?;
        let sock_addr = ip_socket_address(ip, port as u16);

        {
            let inner = self.inner.borrow();
            if inner.bound {
                return Err(throw_socket_error(
                    &ctx,
                    "EINVAL",
                    "bind",
                    "Socket is already bound",
                ));
            }
        }

        let socket = self.socket_rc(&ctx, "bind")?;
        socket.bind(sock_addr).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "bind",
                &format!("bind failed: {e:?}"),
            )
        })?;

        self.inner.borrow_mut().bound = true;
        Ok(())
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

        self.ensure_bound(&ctx, "connect").await?;

        let socket = self.socket_rc(&ctx, "connect")?;
        socket.connect(remote_addr).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "connect",
                &format!("connect failed: {e:?}"),
            )
        })?;

        self.inner.borrow_mut().connected = true;
        Ok(())
    }

    pub fn disconnect(&self, ctx: Ctx<'_>) -> rquickjs::Result<()> {
        {
            let inner = self.inner.borrow();
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "disconnect",
                    "Socket is closed",
                ));
            }
            if !inner.connected {
                return Err(throw_socket_error(
                    &ctx,
                    "ENOTCONN",
                    "disconnect",
                    "Socket is not connected",
                ));
            }
        }

        let socket = self.socket_rc(&ctx, "disconnect")?;
        socket.disconnect().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "disconnect",
                &format!("disconnect failed: {e:?}"),
            )
        })?;

        self.inner.borrow_mut().connected = false;
        Ok(())
    }

    pub async fn send(
        &self,
        ctx: Ctx<'_>,
        data: Vec<u8>,
        addr: Option<String>,
        port: Option<u32>,
    ) -> rquickjs::Result<u32> {
        let remote_address = match (addr, port) {
            (Some(a), Some(p)) => {
                let ip = parse_ip_address(&a).ok_or_else(|| {
                    throw_socket_error(&ctx, "EINVAL", "send", &format!("Invalid address: {a}"))
                })?;
                Some(ip_socket_address(ip, p as u16))
            }
            (None, None) => None,
            _ => {
                return Err(throw_socket_error(
                    &ctx,
                    "EINVAL",
                    "send",
                    "Both address and port must be provided, or neither",
                ));
            }
        };

        self.ensure_bound(&ctx, "send").await?;

        let len = data.len() as u32;
        let socket = self.socket_rc(&ctx, "send")?;
        socket.send(data, remote_address).await.map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "send",
                &format!("send failed: {e:?}"),
            )
        })?;

        Ok(len)
    }

    pub async fn receive(
        &self,
        ctx: Ctx<'_>,
    ) -> rquickjs::Result<List<(Vec<u8>, String, u32, u32)>> {
        {
            let inner = self.inner.borrow();
            if inner.closed {
                return Err(throw_socket_error(
                    &ctx,
                    "EBADF",
                    "receive",
                    "Socket is closed",
                ));
            }
            if !inner.bound {
                return Err(throw_socket_error(
                    &ctx,
                    "EINVAL",
                    "receive",
                    "Socket is not bound",
                ));
            }
        }

        let socket = self.socket_rc(&ctx, "receive")?;
        let (data, remote_address) = socket.receive().await.map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "receive",
                &format!("receive failed: {e:?}"),
            )
        })?;

        let addr_str = ip_address_to_string(&remote_address);
        let port = ip_socket_address_port(&remote_address) as u32;
        let family = match &remote_address {
            IpSocketAddress::Ipv4(_) => 4u32,
            IpSocketAddress::Ipv6(_) => 6u32,
        };
        Ok(List((data, addr_str, port, family)))
    }

    pub fn local_address(&self, ctx: Ctx<'_>) -> rquickjs::Result<List<(String, u32, String)>> {
        let socket = self.socket_rc(&ctx, "address")?;
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
        let socket = self.socket_rc(&ctx, "remoteAddress")?;
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

    pub fn set_ttl(&self, ctx: Ctx<'_>, ttl: u32) -> rquickjs::Result<()> {
        let socket = self.socket_rc(&ctx, "setTTL")?;
        socket.set_unicast_hop_limit(ttl as u8).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setTTL",
                &format!("set_unicast_hop_limit failed: {e:?}"),
            )
        })
    }

    pub fn get_ttl(&self, ctx: Ctx<'_>) -> rquickjs::Result<u32> {
        let socket = self.socket_rc(&ctx, "getTTL")?;
        let ttl = socket.get_unicast_hop_limit().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "getTTL",
                &format!("unicast_hop_limit failed: {e:?}"),
            )
        })?;
        Ok(ttl as u32)
    }

    pub fn set_recv_buffer_size(&self, ctx: Ctx<'_>, size: u64) -> rquickjs::Result<()> {
        let socket = self.socket_rc(&ctx, "setRecvBufferSize")?;
        socket.set_receive_buffer_size(size).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setRecvBufferSize",
                &format!("set_receive_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn get_recv_buffer_size(&self, ctx: Ctx<'_>) -> rquickjs::Result<u64> {
        let socket = self.socket_rc(&ctx, "getRecvBufferSize")?;
        socket.get_receive_buffer_size().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "getRecvBufferSize",
                &format!("receive_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn set_send_buffer_size(&self, ctx: Ctx<'_>, size: u64) -> rquickjs::Result<()> {
        let socket = self.socket_rc(&ctx, "setSendBufferSize")?;
        socket.set_send_buffer_size(size).map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "setSendBufferSize",
                &format!("set_send_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn get_send_buffer_size(&self, ctx: Ctx<'_>) -> rquickjs::Result<u64> {
        let socket = self.socket_rc(&ctx, "getSendBufferSize")?;
        socket.get_send_buffer_size().map_err(|e| {
            throw_socket_error(
                &ctx,
                error_code_to_errno(&e),
                "getSendBufferSize",
                &format!("send_buffer_size failed: {e:?}"),
            )
        })
    }

    pub fn address_family(&self) -> u32 {
        let inner = self.inner.borrow();
        match inner.socket.as_ref().map(|s| s.get_address_family()) {
            Some(IpAddressFamily::Ipv4) | None => 4,
            Some(IpAddressFamily::Ipv6) => 6,
        }
    }

    pub fn close(&self) {
        let mut inner = self.inner.borrow_mut();
        inner.socket = None;
        inner.closed = true;
    }
}

pub const DGRAM_JS: &str = include_str!("dgram.js");
pub const REEXPORT_JS: &str =
    r#"export * from 'node:dgram'; export { default } from 'node:dgram';"#;

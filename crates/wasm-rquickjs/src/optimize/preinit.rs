//! Optimizer-only external I/O denial and lossless forwarding of bounded failure diagnostics.

use super::WizerHost;
use std::collections::VecDeque;
use std::io::{self, Write};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use tokio::io::AsyncWrite;
use wasmtime::component::types::ComponentItem;
use wasmtime::component::{Component, Linker, Resource, ResourceType};
use wasmtime_wasi::cli::StdoutStream;
use wasmtime_wasi::p2::{OutputStream, Pollable, StreamError, StreamResult};

const STDERR_LIMIT: usize = 64 * 1024;

#[derive(Clone, Default)]
pub(super) struct Stderr(Arc<Mutex<VecDeque<u8>>>);

impl Stderr {
    fn capture(&self, bytes: &[u8]) {
        let mut tail = self.0.lock().unwrap();
        if bytes.len() >= STDERR_LIMIT {
            tail.clear();
            tail.extend(&bytes[bytes.len() - STDERR_LIMIT..]);
        } else {
            let discard = (tail.len() + bytes.len()).saturating_sub(STDERR_LIMIT);
            tail.drain(..discard);
            tail.extend(bytes);
        }
    }

    pub(super) fn diagnostic(&self) -> Option<String> {
        let tail = self.0.lock().unwrap();
        if tail.is_empty() {
            None
        } else {
            Some(format!(
                "Guest stderr (last {STDERR_LIMIT} bytes):\n{}",
                String::from_utf8_lossy(&tail.iter().copied().collect::<Vec<_>>())
            ))
        }
    }

    fn write_all(&self, bytes: &[u8]) -> io::Result<()> {
        // Capture synchronously before forwarding: a guest trap can immediately
        // follow this host call. Never hold the capture lock over host output.
        self.capture(bytes);
        io::stderr().write_all(bytes)
    }
}

impl wasmtime_wasi::cli::IsTerminal for Stderr {
    fn is_terminal(&self) -> bool {
        std::io::IsTerminal::is_terminal(&io::stderr())
    }
}

impl StdoutStream for Stderr {
    fn p2_stream(&self) -> Box<dyn OutputStream> {
        // The default adapter buffers asynchronously and can lose the last
        // diagnostic when Wizer traps without another poll of its output task.
        Box::new(self.clone())
    }

    fn async_stream(&self) -> Box<dyn AsyncWrite + Send + Sync> {
        Box::new(self.clone())
    }
}

impl OutputStream for Stderr {
    #[cfg(feature = "use-golem-wasmtime")]
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn write(&mut self, bytes: bytes::Bytes) -> StreamResult<()> {
        self.write_all(&bytes)
            .map_err(|error| StreamError::LastOperationFailed(error.into()))
    }

    fn flush(&mut self) -> StreamResult<()> {
        io::stderr()
            .flush()
            .map_err(|error| StreamError::LastOperationFailed(error.into()))
    }

    fn check_write(&mut self) -> StreamResult<usize> {
        Ok(1024 * 1024)
    }
}

#[wasmtime_wasi::async_trait]
impl Pollable for Stderr {
    async fn ready(&mut self) {}
}

impl AsyncWrite for Stderr {
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        bytes: &[u8],
    ) -> Poll<io::Result<usize>> {
        Poll::Ready(self.write_all(bytes).map(|()| bytes.len()))
    }

    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(io::stderr().flush())
    }

    fn poll_shutdown(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }
}

fn denied_interface(name: &str) -> bool {
    let interface = name.split('@').next().unwrap_or(name);
    matches!(
        interface,
        "wasi:filesystem/preopens"
            | "wasi:sockets/tcp-create-socket"
            | "wasi:sockets/udp-create-socket"
            | "wasi:sockets/instance-network"
            | "wasi:http/outgoing-handler"
    ) || (name.starts_with("wasi:sockets/")
        && name.contains("@0.3.")
        && matches!(
            interface,
            "wasi:sockets/types" | "wasi:sockets/ip-name-lookup"
        ))
        || (interface == "wasi:http/client" && name.contains("@0.3."))
}

/// Replace complete interfaces, never individual entries in a resource-bearing
/// provider. Alias resources retain the identity of their preceding owner.
///
/// P3 sockets are deliberately omitted from the real WASI registrations. Their
/// owned types are registered here using the exact native host types; every
/// function traps. P2 DNS cannot acquire a Network because instance-network
/// traps and this optimizer never inherits foreign network capabilities.
pub(super) fn deny_external_io(
    linker: &mut Linker<WizerHost>,
    component: &Component,
) -> wasmtime::Result<()> {
    let engine = linker.engine().clone();
    let mut seen_resources = Vec::new();
    linker.allow_shadowing(true);
    for (interface, item) in component.component_type().imports(&engine) {
        let ComponentItem::ComponentInstance(instance) = item.ty else {
            if let ComponentItem::Resource(resource) = item.ty {
                seen_resources.push(resource);
            }
            continue;
        };
        let denied = denied_interface(interface);
        let mut provider = if denied {
            Some(linker.instance(interface)?)
        } else {
            None
        };
        for (name, export) in instance.exports(&engine) {
            if let ComponentItem::Resource(resource) = export.ty {
                let alias = seen_resources.contains(&resource);
                seen_resources.push(resource);
                if let Some(provider) = provider.as_mut()
                    && !alias
                {
                    match (interface.split('@').next().unwrap(), name) {
                        ("wasi:sockets/types", "tcp-socket") => {
                            provider.resource(
                                name,
                                ResourceType::host::<wasmtime_wasi::sockets::TcpSocket>(),
                                |mut ctx, rep| {
                                    ctx.data_mut().table.delete(Resource::<
                                        wasmtime_wasi::sockets::TcpSocket,
                                    >::new_own(
                                        rep
                                    ))?;
                                    Ok(())
                                },
                            )?;
                        }
                        ("wasi:sockets/types", "udp-socket") => {
                            provider.resource(
                                name,
                                ResourceType::host::<wasmtime_wasi::sockets::UdpSocket>(),
                                |mut ctx, rep| {
                                    ctx.data_mut().table.delete(Resource::<
                                        wasmtime_wasi::sockets::UdpSocket,
                                    >::new_own(
                                        rep
                                    ))?;
                                    Ok(())
                                },
                            )?;
                        }
                        _ => wasmtime::bail!(
                            "Unexpected owned resource `{interface}#{name}` in pre-initialization I/O policy"
                        ),
                    }
                }
            } else if let Some(provider) = provider.as_mut()
                && let ComponentItem::ComponentFunc(function) = export.ty
            {
                let diagnostic = format!(
                    "WRQJS_PREINITIALIZATION_IO: `{interface}#{name}` is unavailable during \
                     Wizer pre-initialization. Move external I/O to an exported function or \
                     lazy initialization after restoration, or build without pre-initialization."
                );
                if function.async_() {
                    provider.func_new_concurrent(name, move |_, _, _, _| {
                        let diagnostic = diagnostic.clone();
                        Box::pin(async move { Err(wasmtime::Error::msg(diagnostic)) })
                    })?;
                } else {
                    provider.func_new(name, move |_, _, _, _| {
                        Err(wasmtime::Error::msg(diagnostic.clone()))
                    })?;
                }
            }
        }
    }
    linker.allow_shadowing(false);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stderr_retains_tail_without_limiting_writes() {
        let stderr = Stderr::default();
        stderr.capture(&vec![b'a'; STDERR_LIMIT + 20]);
        stderr.capture(b"final diagnostic\n");
        let diagnostic = stderr.diagnostic().unwrap();
        assert!(diagnostic.ends_with("final diagnostic\n"));
        assert_eq!(stderr.0.lock().unwrap().len(), STDERR_LIMIT);
        stderr.capture(&vec![b'b'; STDERR_LIMIT * 2]);
        assert_eq!(stderr.0.lock().unwrap().len(), STDERR_LIMIT);
        assert!(stderr.0.lock().unwrap().iter().all(|byte| *byte == b'b'));
    }
}

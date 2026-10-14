//! Rust-owned output acceptance and terminal completion, without JS handles.
use std::cell::{Cell, RefCell};
use std::future::Future;
use std::rc::Rc;

#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize)]
pub enum Phase {
    Accepting,
    Frozen,
    Completing,
    Complete,
    Failed,
    Cancelled,
}

#[derive(Default)]
struct Channel {
    bytes: Vec<u8>,
    truncated: bool,
}

pub struct NativeOutput {
    stdout: RefCell<Channel>,
    stderr: RefCell<Channel>,
    stdout_limit: usize,
    stderr_limit: usize,
    phase: Cell<Phase>,
}

#[derive(Debug, PartialEq, Eq, serde::Serialize)]
pub struct Status {
    pub exit_code: i32,
    pub stdout_truncated: bool,
    pub stderr_truncated: bool,
}

impl NativeOutput {
    pub fn new(stdout_limit: usize, stderr_limit: usize) -> Self {
        Self {
            stdout: RefCell::default(),
            stderr: RefCell::default(),
            stdout_limit,
            stderr_limit,
            phase: Cell::new(Phase::Accepting),
        }
    }

    /// Preserve the accepted byte prefix. Limits are independent of chunking.
    pub fn append(&self, stderr: bool, bytes: &[u8]) -> Result<usize, &'static str> {
        if self.phase.get() != Phase::Accepting {
            return Err("output acceptance has ended");
        }
        let (channel, limit) = if stderr {
            (&self.stderr, self.stderr_limit)
        } else {
            (&self.stdout, self.stdout_limit)
        };
        let mut channel = channel.borrow_mut();
        let accepted = bytes.len().min(limit - channel.bytes.len());
        channel.bytes.extend_from_slice(&bytes[..accepted]);
        channel.truncated |= accepted != bytes.len();
        Ok(accepted)
    }

    pub fn freeze(&self) {
        if self.phase.get() == Phase::Accepting {
            self.phase.set(Phase::Frozen);
        }
    }

    pub(crate) fn reset(&self) -> Result<(), &'static str> {
        if self.phase.get() != Phase::Accepting {
            return Err("output acceptance has ended");
        }
        *self.stdout.borrow_mut() = Channel::default();
        *self.stderr.borrow_mut() = Channel::default();
        Ok(())
    }

    #[cfg(feature = "internal-test-execution")]
    pub fn phase(&self) -> Phase {
        self.phase.get()
    }

    pub(crate) fn overflowed(&self) -> bool {
        self.stdout.borrow().truncated || self.stderr.borrow().truncated
    }

    /// Begin once, after the owner has destroyed its terminal JS runtime.
    pub fn begin(self: &Rc<Self>, exit_code: i32) -> Result<Completion, &'static str> {
        if self.phase.get() != Phase::Frozen {
            return Err("output is not available for completion");
        }
        self.phase.set(Phase::Completing);
        let stdout = self.stdout.replace(Channel::default());
        let stderr = self.stderr.replace(Channel::default());
        Ok(Completion {
            output: self.clone(),
            stdout: stdout.bytes,
            stderr: stderr.bytes,
            status: Status {
                exit_code,
                stdout_truncated: stdout.truncated,
                stderr_truncated: stderr.truncated,
            },
            settled: false,
        })
    }
}

/// The native transport must accept all bytes and finish both attachments, or
/// return an error. A partial transfer is not a successful tool result.
pub trait OutputTransport {
    fn finish(&self, stdout: Vec<u8>, stderr: Vec<u8>) -> impl Future<Output = Result<(), String>>;
}

pub struct Completion {
    output: Rc<NativeOutput>,
    stdout: Vec<u8>,
    stderr: Vec<u8>,
    status: Status,
    settled: bool,
}

impl Completion {
    pub async fn finish(mut self, transport: &impl OutputTransport) -> Result<Status, String> {
        let stdout = std::mem::take(&mut self.stdout);
        let stderr = std::mem::take(&mut self.stderr);
        match transport.finish(stdout, stderr).await {
            Ok(()) => {
                self.output.phase.set(Phase::Complete);
                self.settled = true;
                Ok(Status { ..self.status })
            }
            Err(error) => {
                self.output.phase.set(Phase::Failed);
                self.settled = true;
                Err(error)
            }
        }
    }
}

impl Drop for Completion {
    fn drop(&mut self) {
        if !self.settled {
            self.output.phase.set(Phase::Cancelled);
        }
    }
}

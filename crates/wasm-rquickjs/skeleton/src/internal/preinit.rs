//! Component-wide initialization policy, shared by the main runtime, VM contexts
//! and the execution-job creation boundary.

use std::fmt::{Display, Write};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

static ACTIVE: AtomicBool = AtomicBool::new(false);
static VIOLATED: AtomicBool = AtomicBool::new(false);
static FIRST_VIOLATION: Mutex<Option<String>> = Mutex::new(None);

pub(crate) fn begin() {
    if ACTIVE.swap(true, Ordering::Relaxed) {
        reject("initialization re-entry", "wizer-initialize");
    }
    VIOLATED.store(false, Ordering::Relaxed);
    FIRST_VIOLATION.lock().unwrap().take();
    // The optimizer forwards guest stderr to the build output. A failed
    // initialization panics with the JavaScript diagnostic; print only that
    // message, without the runtime's thread name, source location and
    // backtrace note.
    std::panic::set_hook(Box::new(|info| {
        let mut stderr = std::io::stderr();
        let _ = match info.payload_as_str() {
            Some(message) => std::io::Write::write_fmt(&mut stderr, format_args!("{message}\n")),
            None => std::io::Write::write_fmt(&mut stderr, format_args!("{info}\n")),
        };
    }));
}

pub(crate) fn complete() {
    if VIOLATED.load(Ordering::Relaxed) {
        trap();
    }
    // Restore the default hook so the snapshot and restored agents keep it.
    drop(std::panic::take_hook());
    ACTIVE.store(false, Ordering::Relaxed);
}

#[inline]
pub(crate) fn is_active() -> bool {
    ACTIVE.load(Ordering::Relaxed)
}

#[cold]
pub(crate) fn uncaught_error(error: &str) -> ! {
    if !VIOLATED.swap(true, Ordering::Relaxed) {
        let mut bounded = DiagnosticTarget::default();
        let _ = write!(&mut bounded, "{error}");
        *FIRST_VIOLATION.lock().unwrap() = Some(format!(
            "WRQJS_PREINITIALIZATION_ERROR: uncaught JavaScript error during Wizer \
             pre-initialization: {}",
            bounded.text
        ));
    }
    trap()
}

/// Filesystem absence is catchable, but must be synthesized before libc/preopen
/// discovery or loader caches can observe the optimizer's empty filesystem.
#[inline]
pub(crate) fn filesystem() -> std::io::Result<()> {
    if is_active() {
        Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "ENOENT during Wizer pre-initialization",
        ))
    } else {
        Ok(())
    }
}

/// Check before touching libc caches, host resources or runtime filesystem
/// caches. `target` must contain only native strings/numbers, never JS values.
#[inline]
pub(crate) fn check(operation: &'static str, target: impl Display) {
    if is_active() {
        reject(operation, target);
    }
}

#[cold]
fn reject(operation: &'static str, target: impl Display) -> ! {
    if !VIOLATED.swap(true, Ordering::Relaxed) {
        let mut bounded = DiagnosticTarget::default();
        let _ = write!(&mut bounded, "{target}");
        let target = bounded.text;
        let diagnostic = format!(
            "WRQJS_PREINITIALIZATION_IO: cannot perform {operation} on {target:?} during \
             Wizer pre-initialization. Move this operation to an exported function or lazy \
             initialization after restoration, or build without pre-initialization."
        );
        *FIRST_VIOLATION.lock().unwrap() = Some(diagnostic);
    }
    trap()
}

#[derive(Default)]
struct DiagnosticTarget {
    text: String,
    characters: usize,
}

impl Write for DiagnosticTarget {
    fn write_str(&mut self, text: &str) -> std::fmt::Result {
        for character in text.chars().take(384 - self.characters) {
            self.text.push(if character.is_control() {
                ' '
            } else {
                character
            });
            self.characters += 1;
        }
        Ok(())
    }
}

#[cold]
fn trap() -> ! {
    // Release the native lock before output or any engine/host boundary.
    let diagnostic = FIRST_VIOLATION.lock().unwrap().clone();
    if let Some(diagnostic) = diagnostic {
        // stderr can itself fail. A formatting/output panic is catchable by
        // rquickjs, so diagnostic emission must never prevent the Wasm trap.
        let _ = std::io::Write::write_fmt(&mut std::io::stderr(), format_args!("{diagnostic}\n"));
    }
    // rquickjs catches Rust panics in native callbacks. A WebAssembly trap must
    // leave initialization immediately, even through JS try/catch and promises.
    core::arch::wasm32::unreachable()
}

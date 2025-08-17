#[allow(unsafe_op_in_unsafe_fn)]
mod bindings;

pub use bindings::wasi::logging::logging::{Level, log};

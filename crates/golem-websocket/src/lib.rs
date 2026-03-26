#[allow(unsafe_op_in_unsafe_fn)]
#[rustfmt::skip]
mod bindings;

pub use bindings::golem::websocket::client::{CloseInfo, Error, Message, WebsocketConnection};

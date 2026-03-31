#[allow(unsafe_op_in_unsafe_fn)]
mod bindings {
    wit_bindgen::generate!({
        world: "golem-websocket",
        path: "wit",
        generate_all,
        pub_export_macro: true,
        default_bindings_module: "crate::bindings",
        with: {
            "wasi:io/poll@0.2.3": wasip2::io::poll,
        },
    });
}

pub use bindings::golem::websocket::client::{CloseInfo, Error, Message, WebsocketConnection};

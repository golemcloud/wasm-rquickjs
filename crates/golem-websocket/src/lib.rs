#[allow(unsafe_op_in_unsafe_fn)]
#[cfg(feature = "p2")]
mod bindings {
    wit_bindgen::generate!({
        world: "golem-websocket",
        path: "wit",
        generate_all,
        pub_export_macro: true,
        default_bindings_module: "crate::bindings",
    });
}

#[allow(unsafe_op_in_unsafe_fn)]
#[cfg(feature = "p3")]
mod bindings {
    wit_bindgen::generate!({
        world: "golem-websocket",
        path: "wit-p3",
        generate_all,
        pub_export_macro: true,
        default_bindings_module: "crate::bindings",
    });
}

#[cfg(all(feature = "p2", feature = "p3"))]
compile_error!("golem-websocket features `p2` and `p3` are mutually exclusive");

#[cfg(not(any(feature = "p2", feature = "p3")))]
compile_error!("golem-websocket requires either the `p2` or `p3` feature");

pub use bindings::golem::websocket::client::{CloseInfo, Error, Message, WebsocketConnection};

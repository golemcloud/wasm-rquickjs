#[allow(unsafe_op_in_unsafe_fn)]
mod bindings {
    wit_bindgen::generate!({
        world: "golem-context",
        path: "wit",
        generate_all,
        pub_export_macro: true,
        default_bindings_module: "crate::bindings",
        with: {
            "wasi:clocks/wall-clock@0.2.3": wasip2::clocks::wall_clock,
        },
    });
}

pub use bindings::golem::api::context::{self, AttributeValue, Span};

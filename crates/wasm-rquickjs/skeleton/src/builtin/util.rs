// Native functions for the node:util implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {}

// JS functions for the node:util implementation
pub const UTIL_JS: &str = include_str!("util.js");

// JS code wiring the streams module into the global context
pub const WIRE_JS: &str = r#"
    "#;

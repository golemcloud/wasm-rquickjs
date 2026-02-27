#[rquickjs::module]
pub mod native_module {}

pub const NODE_HTTP_JS: &str = include_str!("node_http_disabled.js");
pub const HTTP_COMMON_JS: &str = include_str!("node_http_common.js");
pub const REEXPORT_JS: &str =
    r#"export * from 'node:http'; export { default } from 'node:http';"#;

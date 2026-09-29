#[rquickjs::module]
pub mod native_module {}

pub const NODE_HTTP_JS: &str = include_str!("node_http_disabled.js");
pub const HTTP_COMMON_JS: &str = include_str!("node_http_common.js");
pub const HTTP_INCOMING_JS: &str = include_str!("node_http_incoming.js");
pub const REEXPORT_JS: &str = r#"export * from 'node:http'; export { default } from 'node:http';"#;

pub const NODE_HTTP_SERVER_JS: &str = r#"
const msg = 'node:http server is not available (node-http feature is not enabled)';
function notAvailable() { throw new Error(msg); }
export const createServer = notAvailable;
export default { createServer };
"#;

pub const HTTP_AGENT_JS: &str = r#"
import { Agent } from 'node:http';
export { Agent };
export default Agent;
"#;

pub const HTTP_COMMON_REEXPORT_JS: &str =
    r#"export * from 'node:_http_common'; export { default } from 'node:_http_common';"#;
pub const HTTP_AGENT_REEXPORT_JS: &str =
    r#"export * from 'node:_http_agent'; export { default } from 'node:_http_agent';"#;

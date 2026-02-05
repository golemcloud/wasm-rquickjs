// JS functions for the node streams implementation
pub const STREAM_JS: &str = include_str!("stream.js");

// JS functions for the node stream/promises implementation
pub const STREAM_PROMISES_JS: &str = include_str!("stream_promises.js");

// Re-exports for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:stream'; export { default } from 'node:stream';"#;
pub const REEXPORT_PROMISES_JS: &str = r#"export * from 'node:stream/promises'; export { default } from 'node:stream/promises';"#;

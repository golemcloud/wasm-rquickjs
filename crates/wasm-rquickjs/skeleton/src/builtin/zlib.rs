// zlib module - JavaScript-only stub (no native functions needed)
pub const ZLIB_JS: &str = include_str!("zlib.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:zlib'; export { default } from 'node:zlib';"#;

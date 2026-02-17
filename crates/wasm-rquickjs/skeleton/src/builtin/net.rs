// net module - JavaScript-only stub (no native functions needed)
pub const NET_JS: &str = include_str!("net.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:net'; export { default } from 'node:net';"#;

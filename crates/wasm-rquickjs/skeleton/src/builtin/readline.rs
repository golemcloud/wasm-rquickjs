// readline module - JavaScript-only stub (no native functions needed)
pub const READLINE_JS: &str = include_str!("readline.js");
pub const READLINE_PROMISES_JS: &str = include_str!("readline_promises.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:readline'; export { default } from 'node:readline';"#;
pub const REEXPORT_PROMISES_JS: &str = r#"export * from 'node:readline/promises'; export { default } from 'node:readline/promises';"#;

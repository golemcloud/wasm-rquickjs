// dgram module - JavaScript-only stub (no native functions needed)
pub const DGRAM_JS: &str = include_str!("dgram.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:dgram'; export { default } from 'node:dgram';"#;

// node:test module - JavaScript-only (no native functions needed)
pub const TEST_JS: &str = include_str!("test.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:test'; export { default } from 'node:test';"#;

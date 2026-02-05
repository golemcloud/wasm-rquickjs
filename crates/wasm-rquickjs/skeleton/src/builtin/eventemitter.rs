// JS functions for the EventEmitter implementation
pub const EVENTEMITTER_JS: &str = include_str!("eventemitter.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:events'; export { default } from 'node:events';"#;

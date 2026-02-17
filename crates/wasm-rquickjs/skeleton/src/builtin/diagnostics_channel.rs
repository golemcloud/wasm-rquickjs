// JS implementation of node:diagnostics_channel
pub const DIAGNOSTICS_CHANNEL_JS: &str = include_str!("diagnostics_channel.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:diagnostics_channel'; export { default } from 'node:diagnostics_channel';"#;

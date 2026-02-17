// dns module - JavaScript-only stub (no native functions needed)
pub const DNS_JS: &str = include_str!("dns.js");
pub const DNS_PROMISES_JS: &str = include_str!("dns_promises.js");

// Re-export for aliases
pub const REEXPORT_JS: &str =
    r#"export * from 'node:dns'; export { default } from 'node:dns';"#;
pub const REEXPORT_PROMISES_JS: &str =
    r#"export * from 'node:dns/promises'; export { default } from 'node:dns/promises';"#;

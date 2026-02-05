// JS implementation of node:string_decoder
pub const STRING_DECODER_JS: &str = include_str!("string_decoder.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:string_decoder';"#;

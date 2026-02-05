pub const MODULE_JS: &str = include_str!("module.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from 'node:module'; export { default } from 'node:module';"#;

pub const WIRE_JS: &str = r#"
        import { require as __wasm_rquickjs_require } from 'node:module';
        globalThis.require = __wasm_rquickjs_require;
    "#;

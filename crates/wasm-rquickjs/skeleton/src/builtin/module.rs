pub const MODULE_JS: &str = include_str!("module.js");

pub const WIRE_JS: &str = r#"
        import { require as __wasm_rquickjs_require } from 'node:module';
        globalThis.require = __wasm_rquickjs_require;
    "#;

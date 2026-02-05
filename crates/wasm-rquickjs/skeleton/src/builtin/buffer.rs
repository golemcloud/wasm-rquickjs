// JS functions for the buffer implementation
pub const BUFFER_JS: &str = include_str!("buffer.js");

pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_buffer from 'node:buffer';

        globalThis.buffer = __wasm_rquickjs_buffer;
        globalThis.Buffer = __wasm_rquickjs_buffer.Buffer;
    "#;

// Native functions for the streams implementation
#[rquickjs::module(rename_vars = "camelCase")]
pub mod native_module {}

// JS functions for the streams implementation
pub const STREAMS_JS: &str = include_str!("web-streams-polyfill-4.1.0.js");

// JS code wiring the streams module into the global context
pub const WIRE_JS: &str = r#"
        import * as __wasm_rquickjs_streams from '__wasm_rquickjs_builtin/streams';
        globalThis.streams = __wasm_rquickjs_streams;
        globalThis.ByteLengthQueuingStrategy = __wasm_rquickjs_streams.ByteLengthQueuingStrategy;
        globalThis.CountQueuingStrategy = __wasm_rquickjs_streams.CountQueuingStrategy;
        globalThis.ReadableByteStreamController = __wasm_rquickjs_streams.ReadableByteStreamController;
        globalThis.ReadableStream = __wasm_rquickjs_streams.ReadableStream;
        globalThis.ReadableStreamBYOBReader = __wasm_rquickjs_streams.ReadableStreamBYOBReader;
        globalThis.ReadableStreamBYOBRequest = __wasm_rquickjs_streams.ReadableStreamBYOBRequest;
        globalThis.ReadableStreamDefaultController = __wasm_rquickjs_streams.ReadableStreamDefaultController;
        globalThis.ReadableStreamDefaultReader = __wasm_rquickjs_streams.ReadableStreamDefaultReader;
        globalThis.TransformStream = __wasm_rquickjs_streams.TransformStream;
        globalThis.TransformStreamDefaultController = __wasm_rquickjs_streams.TransformStreamDefaultController;
        globalThis.WritableStream = __wasm_rquickjs_streams.WritableStream;
        globalThis.WritableStreamDefaultController = __wasm_rquickjs_streams.WritableStreamDefaultController;
        globalThis.WritableStreamDefaultWriter = __wasm_rquickjs_streams.WritableStreamDefaultWriter;
    "#;

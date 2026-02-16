// JS functions for the web streams implementation
pub const WEBSTREAMS_JS: &str = include_str!("web-streams-polyfill-4.1.0.js");

// Re-export for aliases
pub const REEXPORT_JS: &str = r#"export * from '__wasm_rquickjs_builtin/streams';"#;

// JS code wiring the web streams module into the global context
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

        // Patch ReadableStream to throw Node.js-compatible ERR_INVALID_STATE errors
        // when the stream is already locked.
        {
            const RS = globalThis.ReadableStream;
            function errInvalidState(msg) {
                const e = new TypeError(msg);
                e.code = 'ERR_INVALID_STATE';
                return e;
            }

            const origGetReader = RS.prototype.getReader;
            RS.prototype.getReader = function getReader(...args) {
                if (this.locked) {
                    throw errInvalidState('Invalid state: ReadableStream is locked');
                }
                return origGetReader.apply(this, args);
            };

            const origValues = RS.prototype.values;
            if (typeof origValues === 'function') {
                RS.prototype.values = function values(...args) {
                    if (this.locked) {
                        throw errInvalidState('Invalid state: ReadableStream is locked');
                    }
                    return origValues.apply(this, args);
                };
            }

            const symAsyncIterator = Symbol.asyncIterator;
            const origAsyncIterator = RS.prototype[symAsyncIterator];
            if (typeof origAsyncIterator === 'function') {
                RS.prototype[symAsyncIterator] = function(...args) {
                    if (this.locked) {
                        throw errInvalidState('Invalid state: ReadableStream is locked');
                    }
                    return origAsyncIterator.apply(this, args);
                };
            }
        }
    "#;

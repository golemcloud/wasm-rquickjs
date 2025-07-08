import * as encodingNative from '__wasm_rquickjs_builtin/encoding_native'
import * as streams from '__wasm_rquickjs_builtin/streams';

export class TextDecoder {
    constructor(label, options) {
        const safeLabel = label || 'utf-8';
        if (!encodingNative.supports_encoding(safeLabel)) {
            throw new RangeError(safeLabel + ' is not supported');
        }

        this._label = safeLabel;
        this._fatal = !!(options && options.fatal);
        this._ignoreBOM = !!(options && options.ignoreBOM);
    }

    get encoding() {
        return this._label;
    }

    get fatal() {
        return this._fatal;
    }

    get ignoreBOM() {
        return this._ignoreBOM;
    }

    decode(buffer, options) {
        let bytes;
        if (buffer instanceof Uint8Array) {
            bytes = buffer;
        } else if (buffer instanceof ArrayBuffer) {
            bytes = new Uint8Array(buffer);
        } else if (ArrayBuffer.isView(buffer) && buffer.buffer instanceof ArrayBuffer) {
            bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } else if (Array.isArray(buffer)) {
            bytes = new Uint8Array(buffer);
        } else {
            bytes = new Uint8Array(0);
        }
        const stream = !!(options && options.stream);

        let [result, error] = encodingNative.decode(bytes, this._label, stream, this._fatal, this._ignoreBOM);
        if (error !== undefined) {
            throw new TypeError(error);
        } else {
            return result;
        }
    }
}

export class TextEncoder {
    constructor() {
    }

    get encoding() {
        return 'utf-8';
    }

    encode(string) {
        return encodingNative.encode(string);
    }

    encodeInto(string, uint8Array) {
        return encodingNative.encode_into(string);
    }
}

export class TextDecoderStream extends streams.TransformStream {
    constructor(label, options) {
        const safeLabel = label || 'utf-8';
        const fatal = !!(options && options.fatal);
        if (!encodingNative.supports_encoding(safeLabel)) {
            throw new RangeError(safeLabel + ' is not supported');
        }

        let decoder;
        super({
            start(ctl) {
                decoder = new TextDecoder(safeLabel, options);
            },
            transform(chunk, ctl) {
                if (fatal) {
                    try {
                        ctl.enqueue(decoder.decode(chunk));
                    } catch (e) {
                        ctl.error(e);
                    }
                } else {
                    ctl.enqueue(decoder.decode(chunk));
                }
            },
            flush() {
                decoder = null;
            },
        });

        this._label = safeLabel;
        this._fatal = fatal;
        this._ignoreBOM = !!(options && options.ignoreBOM);

    }

    get encoding() {
        return this._label;
    }

    get fatal() {
        return this._fatal;
    }

    get ignoreBOM() {
        return this._ignoreBOM;
    }
}

export class TextEncoderStream extends streams.TransformStream {
    constructor(label, options) {
        let encoder;
        super({
            start(ctl) {
                encoder = new TextEncoder();
            },
            transform(chunk, ctl) {
                ctl.enqueue(encoder.encode(chunk));
            },
            flush() {
                encoder = null;
            },
        });
    }

    get encoding() {
        return 'utf-8';
    }
}
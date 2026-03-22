import {
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
    ReadableByteStreamController,
    ReadableStream,
    ReadableStreamBYOBReader,
    ReadableStreamBYOBRequest,
    ReadableStreamDefaultController,
    ReadableStreamDefaultReader,
    TransformStream,
    TransformStreamDefaultController,
    WritableStream,
    WritableStreamDefaultController,
    WritableStreamDefaultWriter,
} from '__wasm_rquickjs_builtin/streams';

// Patch ReadableStream to throw Node.js-compatible ERR_INVALID_STATE errors
// when the stream is already locked.
function errInvalidState(msg) {
    const e = new TypeError(msg);
    e.code = 'ERR_INVALID_STATE';
    return e;
}

const origGetReader = ReadableStream.prototype.getReader;
ReadableStream.prototype.getReader = function getReader(...args) {
    if (this.locked) {
        throw errInvalidState('Invalid state: ReadableStream is locked');
    }
    return origGetReader.apply(this, args);
};

const origValues = ReadableStream.prototype.values;
if (typeof origValues === 'function') {
    ReadableStream.prototype.values = function values(...args) {
        if (this.locked) {
            throw errInvalidState('Invalid state: ReadableStream is locked');
        }
        return origValues.apply(this, args);
    };
}

const symAsyncIterator = Symbol.asyncIterator;
const origAsyncIterator = ReadableStream.prototype[symAsyncIterator];
if (typeof origAsyncIterator === 'function') {
    ReadableStream.prototype[symAsyncIterator] = function(...args) {
        if (this.locked) {
            throw errInvalidState('Invalid state: ReadableStream is locked');
        }
        return origAsyncIterator.apply(this, args);
    };
}

export {
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
    ReadableByteStreamController,
    ReadableStream,
    ReadableStreamBYOBReader,
    ReadableStreamBYOBRequest,
    ReadableStreamDefaultController,
    ReadableStreamDefaultReader,
    TransformStream,
    TransformStreamDefaultController,
    WritableStream,
    WritableStreamDefaultController,
    WritableStreamDefaultWriter,
};

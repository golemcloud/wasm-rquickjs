// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { addAbortSignal } from "__wasm_rquickjs_builtin/internal/streams/add-abort-signal";
import { destroyer } from "__wasm_rquickjs_builtin/internal/streams/destroy";
import { isDisturbed } from "__wasm_rquickjs_builtin/internal/streams/utils";
import { isUint8Array } from "__wasm_rquickjs_builtin/internal/util/types";
import { pipeline } from "__wasm_rquickjs_builtin/internal/streams/pipeline";
import { promisify } from "__wasm_rquickjs_builtin/internal/util";
import { Stream } from "__wasm_rquickjs_builtin/internal/streams/legacy";
import compose from "__wasm_rquickjs_builtin/internal/streams/compose";
import Duplex from "__wasm_rquickjs_builtin/internal/streams/duplex";
import eos from "__wasm_rquickjs_builtin/internal/streams/end-of-stream";
import PassThrough from "__wasm_rquickjs_builtin/internal/streams/passthrough";
import promises from "node:stream/promises";
import Readable from "__wasm_rquickjs_builtin/internal/streams/readable";
import Transform from "__wasm_rquickjs_builtin/internal/streams/transform";
import Writable from "__wasm_rquickjs_builtin/internal/streams/writable";
import { Buffer } from "buffer";

const { custom: customPromisify } = promisify;

function _uint8ArrayToBuffer(chunk) {
    return Buffer.from(
        chunk.buffer,
        chunk.byteOffset,
        chunk.byteLength,
    );
}

Stream.isDisturbed = isDisturbed;
Stream.Readable = Readable;
Stream.Writable = Writable;
Stream.Duplex = Duplex;
Stream.Transform = Transform;
Stream.PassThrough = PassThrough;
Stream.pipeline = pipeline;
Stream.addAbortSignal = addAbortSignal;
Stream.finished = eos;
Stream.destroy = destroyer;
Stream.compose = compose;

Object.defineProperty(Stream, "promises", {
    configurable: true,
    enumerable: true,
    get() {
        return promises;
    },
});

Object.defineProperty(pipeline, customPromisify, {
    enumerable: true,
    get() {
        return promises.pipeline;
    },
});

Object.defineProperty(eos, customPromisify, {
    enumerable: true,
    get() {
        return promises.finished;
    },
});

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;
Stream._isUint8Array = isUint8Array;
Stream._uint8ArrayToBuffer = _uint8ArrayToBuffer;

export default Stream;
export {
    _uint8ArrayToBuffer,
    addAbortSignal,
    compose,
    destroyer as destroy,
    Duplex,
    eos as finished,
    isDisturbed,
    isUint8Array as _isUint8Array,
    PassThrough,
    pipeline,
    Readable,
    Stream,
    Transform,
    Writable,
};
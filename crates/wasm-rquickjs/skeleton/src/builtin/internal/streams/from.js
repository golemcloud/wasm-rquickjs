// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import { Buffer } from "buffer";
import { aggregateTwoErrors, ERR_INVALID_ARG_TYPE, ERR_STREAM_NULL_VALUES } from "__wasm_rquickjs_builtin/internal/errors";
import { nextTick } from "node:process";

function _from(Readable, iterable, opts) {
    let iterator;
    if (typeof iterable === "string" || iterable instanceof Buffer) {
        return new Readable({
            objectMode: true,
            ...opts,
            read() {
                this.push(iterable);
                this.push(null);
            },
        });
    }

    let isAsync;
    if (iterable && iterable[Symbol.asyncIterator]) {
        isAsync = true;
        iterator = iterable[Symbol.asyncIterator]();
    } else if (iterable && iterable[Symbol.iterator]) {
        isAsync = false;
        iterator = iterable[Symbol.iterator]();
    } else {
        throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
    }

    const readable = new Readable({
        objectMode: true,
        highWaterMark: 1,
        // TODO(ronag): What options should be allowed?
        ...opts,
    });
    const originalDestroy = readable._destroy;

    // Flag to protect against _read
    // being called before last iteration completion.
    let reading = false;

    readable._read = function () {
        if (!reading) {
            reading = true;
            next();
        }
    };

    // Like Node 26, a destroy passed in opts (such as Duplex.from's async-function source)
    // runs before the iterator closes, so a source waiting on it can settle.
    readable._destroy = function (error, cb) {
        originalDestroy.call(this, error, (destroyError) => {
            const combinedError = destroyError || error;
            close(combinedError).then(
                () => nextTick(cb, combinedError), // nextTick is here in case cb throws
                (closeError) => nextTick(cb, aggregateTwoErrors(combinedError, closeError)),
            );
        });
    };

    async function close(error) {
        const hadError = (error !== undefined) && (error !== null);
        const hasThrow = typeof iterator.throw === "function";
        if (hadError && hasThrow) {
            const { value, done } = await iterator.throw(error);
            await value;
            if (done) {
                return;
            }
        }
        if (typeof iterator.return === "function") {
            const { value } = await iterator.return();
            await value;
        }
    }

    async function next() {
        for (; ;) {
            try {
                const { value, done } = isAsync
                    ? await iterator.next()
                    : iterator.next();

                if (done) {
                    readable.push(null);
                } else {
                    const res = (value &&
                        typeof value.then === "function")
                        ? await value
                        : value;
                    if (res === null) {
                        reading = false;
                        throw new ERR_STREAM_NULL_VALUES();
                    } else if (readable.push(res)) {
                        continue;
                    } else {
                        reading = false;
                    }
                }
            } catch (err) {
                readable.destroy(err);
            }
            break;
        }
    }
    return readable;
}

export default _from;
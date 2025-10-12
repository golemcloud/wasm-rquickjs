// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { isIterable, isNodeStream } from "__wasm_rquickjs_builtin/internal/streams/utils";
import { pipelineImpl as pl } from "__wasm_rquickjs_builtin/internal/streams/pipeline";
import eos from "__wasm_rquickjs_builtin/internal/streams/end-of-stream";

function pipeline(...streams) {
    return new Promise((resolve, reject) => {
        let signal;
        let end;
        const lastArg = streams[streams.length - 1];
        if (
            lastArg && typeof lastArg === "object" &&
            !isNodeStream(lastArg) && !isIterable(lastArg)
        ) {
            const options = streams.pop();
            signal = options.signal;
            end = options.end;
        }

        pl(streams, (err, value) => {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        }, { signal, end });
    });
}

function finished(stream, opts) {
    return new Promise((resolve, reject) => {
        eos(stream, opts, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export default {
    finished,
    pipeline,
};
export { finished, pipeline };
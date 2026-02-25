import * as utilBinding from "__wasm_rquickjs_builtin/internal/binding/util";
import { constants as osConstants } from "node:os";
import * as fsModule from "node:fs";

// Node's V8-backed implementation can keep very small typed-array payloads inline
// and only materialize an ArrayBuffer on first `.buffer` access.
//
// QuickJS does not expose this internal state, so this test binding tracks
// `.buffer` access for small typed arrays to emulate Node's observable behavior.
const INLINE_TYPED_ARRAY_LIMIT = 64;
const smallViewsWithMaterializedBuffer = new WeakSet();

let arrayBufferTrackingInstalled = false;

function maybeTrackBufferAccess(view) {
    if (ArrayBuffer.isView(view) && view.byteLength < INLINE_TYPED_ARRAY_LIMIT) {
        smallViewsWithMaterializedBuffer.add(view);
    }
}

function installArrayBufferTracking() {
    if (arrayBufferTrackingInstalled) {
        return;
    }
    arrayBufferTrackingInstalled = true;

    const typedArrayConstructors = [
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
        typeof BigInt64Array === "function" ? BigInt64Array : undefined,
        typeof BigUint64Array === "function" ? BigUint64Array : undefined,
    ];

    for (const ctor of typedArrayConstructors) {
        if (typeof ctor !== "function") {
            continue;
        }

        const prototype = ctor.prototype;
        const parentPrototype = Object.getPrototypeOf(prototype);
        if (!parentPrototype) {
            continue;
        }

        const parentDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "buffer");
        if (!parentDescriptor || typeof parentDescriptor.get !== "function") {
            continue;
        }

        try {
            Object.defineProperty(prototype, "buffer", {
                configurable: true,
                enumerable: false,
                get() {
                    maybeTrackBufferAccess(this);
                    return parentDescriptor.get.call(this);
                },
            });
        } catch (_err) {
            // If a runtime doesn't allow overriding this accessor, we fall back
            // to best-effort behavior based on byteLength.
        }
    }
}

installArrayBufferTracking();

function arrayBufferViewHasBuffer(view) {
    if (!ArrayBuffer.isView(view)) {
        return false;
    }

    if (view.byteLength >= INLINE_TYPED_ARRAY_LIMIT) {
        return true;
    }

    return smallViewsWithMaterializedBuffer.has(view);
}

const utilTestBinding = Object.freeze({
    ...utilBinding,
    arrayBufferViewHasBuffer,
});

const bufferTestBinding = Object.freeze({
    fill(target, value, start, end) {
        return target.fill(value, start, end);
    },
});

const cryptoTestBinding = Object.freeze({
    // Mirrors Node's non-FIPS build semantics for test helpers.
    testFipsCrypto() {
        return 0;
    },
});

const uvErrnoBinding = {};
const osErrno = osConstants && osConstants.errno ? osConstants.errno : {};
for (const [name, value] of Object.entries(osErrno)) {
    if (typeof value === "number") {
        uvErrnoBinding[`UV_${name}`] = -Math.abs(value);
    }
}

const uvTestBinding = Object.freeze(uvErrnoBinding);

const fsTestBinding = globalThis.__wasm_rquickjs_internal_fs_binding || {};

if (typeof fsTestBinding.readdir !== "function") {
    fsTestBinding.readdir = function readdir(path, encoding, withFileTypes, req) {
        const opts = {
            withFileTypes: !!withFileTypes,
            encoding: encoding || "utf8",
        };

        const run = () => {
            if (!opts.withFileTypes) {
                return fsModule.readdirSync(path, opts);
            }

            const dirents = fsModule.readdirSync(path, opts);
            const names = dirents.map((dirent) => dirent.name);
            const types = dirents.map((dirent) => {
                if (dirent.isFile()) return fsModule.constants.UV_DIRENT_FILE;
                if (dirent.isDirectory()) return fsModule.constants.UV_DIRENT_DIR;
                if (dirent.isSymbolicLink()) return fsModule.constants.UV_DIRENT_LINK;
                if (dirent.isFIFO()) return fsModule.constants.UV_DIRENT_FIFO;
                if (dirent.isSocket()) return fsModule.constants.UV_DIRENT_SOCKET;
                if (dirent.isCharacterDevice()) return fsModule.constants.UV_DIRENT_CHAR;
                if (dirent.isBlockDevice()) return fsModule.constants.UV_DIRENT_BLOCK;
                return fsModule.constants.UV_DIRENT_UNKNOWN;
            });

            return [names, types];
        };

        if (req && typeof req === "object") {
            queueMicrotask(() => {
                try {
                    req.oncomplete(null, run());
                } catch (err) {
                    req.oncomplete(err);
                }
            });
            return;
        }

        return run();
    };
}

if (typeof fsTestBinding.openFileHandle !== "function") {
    fsTestBinding.openFileHandle = function openFileHandle(path, flags, mode, _req, ctx) {
        try {
            const fd = fsModule.openSync(path, flags, mode);
            return { fd };
        } catch (err) {
            if (ctx && typeof ctx === "object") {
                ctx.errno = typeof err?.errno === "number" ? err.errno : -1;
                ctx.error = err;
                ctx.syscall = err?.syscall;
                ctx.path = err?.path;
            }
            return { fd: -1 };
        }
    };
}

globalThis.__wasm_rquickjs_internal_fs_binding = fsTestBinding;

export function internalBinding(name) {
    if (name === "util") {
        return utilTestBinding;
    }

    if (name === "buffer") {
        return bufferTestBinding;
    }

    if (name === "crypto") {
        return cryptoTestBinding;
    }

    if (name === "uv") {
        return uvTestBinding;
    }

    if (name === "fs") {
        return fsTestBinding;
    }

    throw new Error(`No such binding: ${name}`);
}

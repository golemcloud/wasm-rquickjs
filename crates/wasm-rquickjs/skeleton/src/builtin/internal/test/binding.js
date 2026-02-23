import * as utilBinding from "__wasm_rquickjs_builtin/internal/binding/util";

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

export function internalBinding(name) {
    if (name === "util") {
        return utilTestBinding;
    }

    throw new Error(`No such binding: ${name}`);
}

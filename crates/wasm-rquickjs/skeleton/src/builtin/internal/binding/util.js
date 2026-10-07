// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/util-inl.h
// - https://github.com/nodejs/node/blob/master/src/util.cc
// - https://github.com/nodejs/node/blob/master/src/util.h

import {
    get_promise_details as getPromiseDetailsNative,
    get_proxy_details as getProxyDetailsNative,
} from "__wasm_rquickjs_builtin/internal/binding/util_native";

// Runtime-private caches must stay weak and avoid the public inspection shim's
// insertion bookkeeping. Capture bound engine operations before installing it.
const nativeWeakMapGet = Function.prototype.call.bind(WeakMap.prototype.get);
export const nativeWeakMapSet = Function.prototype.call.bind(WeakMap.prototype.set);
const nativeWeakMapDelete = Function.prototype.call.bind(WeakMap.prototype.delete);
const nativeWeakSetAdd = Function.prototype.call.bind(WeakSet.prototype.add);
const nativeWeakSetDelete = Function.prototype.call.bind(WeakSet.prototype.delete);
const NativeWeakRef = WeakRef;
const nativeWeakRefDeref = Function.prototype.call.bind(WeakRef.prototype.deref);

const privateSymbolRegistryKey = "__wasm_rquickjs_internal_private_symbols";

function installPrivateSymbolAccessor(privateSymbol, store) {
    if (Object.prototype.hasOwnProperty.call(Object.prototype, privateSymbol)) {
        return;
    }

    Object.defineProperty(Object.prototype, privateSymbol, {
        configurable: true,
        enumerable: false,
        get() {
            if (this === Object.prototype) {
                return undefined;
            }
            return store.get(Object(this));
        },
        set(value) {
            if (this === Object.prototype) {
                return;
            }
            store.set(Object(this), value);
        },
    });
}

function createPrivateSymbol(description) {
    const privateSymbol = Symbol(description);
    const store = new WeakMap();
    installPrivateSymbolAccessor(privateSymbol, store);
    return privateSymbol;
}

export const privateSymbols = (() => {
    const existing = globalThis[privateSymbolRegistryKey];
    if (existing && typeof existing === "object") {
        return existing;
    }

    const symbols = Object.freeze({
        arrow_message_private_symbol: createPrivateSymbol("node:arrowMessage"),
        decorated_private_symbol: createPrivateSymbol("node:decorated"),
    });

    Object.defineProperty(globalThis, privateSymbolRegistryKey, {
        value: symbols,
        writable: false,
        configurable: true,
        enumerable: false,
    });

    return symbols;
})();

/**
 *
 * @param {string} msg
 * @return {never}
 */
export function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}

/**
 * 
 * @param {number} _fd 
 * @return {string}
 */
export function guessHandleType(_fd) {
    notImplemented("util.guessHandleType");
}

export function getProxyDetails(value, fullProxy = true) {
    return getProxyDetailsNative(value, fullProxy);
}

export function getPromiseDetails(value) {
    return getPromiseDetailsNative(value);
}

export const ALL_PROPERTIES = 0;
export const ONLY_WRITABLE = 1;
export const ONLY_ENUMERABLE = 2;
export const ONLY_CONFIGURABLE = 4;
export const ONLY_ENUM_WRITABLE = 6;
export const SKIP_STRINGS = 8;
export const SKIP_SYMBOLS = 16;

const previewEntriesCache = new WeakMap();
const weakMapEntriesCache = new WeakMap();
const weakSetEntriesCache = new WeakMap();

if (typeof WeakMap === "function") {
    WeakMap.prototype.set = function set(key, value) {
        const result = nativeWeakMapSet(this, key, value);
        let entries = nativeWeakMapGet(weakMapEntriesCache, this);
        if (entries === undefined) {
            entries = [];
            nativeWeakMapSet(weakMapEntriesCache, this, entries);
        }

        let found = false;
        let next = 0;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const existingKey = nativeWeakRefDeref(entry);
            if (existingKey === undefined) {
                continue;
            }
            entries[next++] = entry;
            if (existingKey === key) {
                found = true;
            }
        }
        entries.length = next;

        if (!found) {
            entries[next] = new NativeWeakRef(key);
        }
        return result;
    };

    WeakMap.prototype.delete = function del(key) {
        const deleted = nativeWeakMapDelete(this, key);
        if (deleted) {
            const entries = nativeWeakMapGet(weakMapEntriesCache, this);
            if (entries !== undefined) {
                let next = 0;
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    const existingKey = nativeWeakRefDeref(entry);
                    if (existingKey !== undefined && existingKey !== key) {
                        entries[next++] = entry;
                    }
                }
                entries.length = next;
            }
        }
        return deleted;
    };
}

if (typeof WeakSet === "function") {
    WeakSet.prototype.add = function add(value) {
        const result = nativeWeakSetAdd(this, value);
        let entries = nativeWeakMapGet(weakSetEntriesCache, this);
        if (entries === undefined) {
            entries = [];
            nativeWeakMapSet(weakSetEntriesCache, this, entries);
        }

        let found = false;
        let next = 0;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const existingValue = nativeWeakRefDeref(entry);
            if (existingValue === undefined) {
                continue;
            }
            entries[next++] = entry;
            if (existingValue === value) {
                found = true;
            }
        }
        entries.length = next;

        if (!found) {
            entries[next] = new NativeWeakRef(value);
        }
        return result;
    };

    WeakSet.prototype.delete = function del(value) {
        const deleted = nativeWeakSetDelete(this, value);
        if (deleted) {
            const entries = nativeWeakMapGet(weakSetEntriesCache, this);
            if (entries !== undefined) {
                let next = 0;
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    const existingValue = nativeWeakRefDeref(entry);
                    if (existingValue !== undefined && existingValue !== value) {
                        entries[next++] = entry;
                    }
                }
                entries.length = next;
            }
        }
        return deleted;
    };
}

const nullPrototypeConstructorNames = new WeakMap();
const originalObjectSetPrototypeOf = Object.setPrototypeOf;
const originalReflectSetPrototypeOf = Reflect.setPrototypeOf;

export function getWeakMapEntries(value) {
    const refs = nativeWeakMapGet(weakMapEntriesCache, value);
    if (!Array.isArray(refs)) {
        return [];
    }

    const entries = [];
    let next = 0;
    for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        const key = nativeWeakRefDeref(ref);
        if (key === undefined) {
            continue;
        }
        refs[next++] = ref;
        entries.push(key, nativeWeakMapGet(value, key));
    }
    refs.length = next;
    return entries;
}

export function getWeakSetEntries(value) {
    const refs = nativeWeakMapGet(weakSetEntriesCache, value);
    if (!Array.isArray(refs)) {
        return [];
    }

    const entries = [];
    let next = 0;
    for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        const entry = nativeWeakRefDeref(ref);
        if (entry === undefined) {
            continue;
        }
        refs[next++] = ref;
        entries.push(entry);
    }
    refs.length = next;
    return entries;
}

function isObjectLike(value) {
    return (
        (typeof value === "object" && value !== null) ||
        typeof value === "function"
    );
}

function findConstructorName(value) {
    if (!isObjectLike(value)) {
        return "";
    }

    let proto = value;
    while (proto !== null) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, "constructor");
        if (
            descriptor !== undefined &&
            typeof descriptor.value === "function" &&
            descriptor.value.name !== ""
        ) {
            try {
                if (value instanceof descriptor.value) {
                    return descriptor.value.name;
                }
            } catch {
                // Ignore non-callable or cross-realm constructor checks.
            }
        }

        proto = Object.getPrototypeOf(proto);
    }

    return "";
}

function findIntrinsicConstructorName(value) {
    if (Array.isArray(value)) {
        return "Array";
    }

    return "";
}

function findGlobalConstructorNameByPrototype(value) {
    if (!isObjectLike(value)) {
        return "";
    }

    let proto;
    try {
        proto = Object.getPrototypeOf(value);
    } catch {
        return "";
    }

    if (!isObjectLike(proto)) {
        return "";
    }

    let names;
    try {
        names = Object.getOwnPropertyNames(globalThis);
    } catch {
        return "";
    }

    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        let candidate;
        try {
            candidate = globalThis[name];
        } catch {
            continue;
        }

        if (typeof candidate !== "function" || candidate.name === "") {
            continue;
        }

        try {
            if (candidate.prototype === proto) {
                return candidate.name;
            }
        } catch {
            // Ignore host objects and poisoned accessors.
        }
    }

    return "";
}

function trackNullPrototypeConstructor(target, proto) {
    if (!isObjectLike(target)) {
        return;
    }

    const tracksNullProtoChain = proto === null || (
        isObjectLike(proto) && Object.getPrototypeOf(proto) === null
    );

    if (tracksNullProtoChain) {
        const constructorName = findIntrinsicConstructorName(target) || findConstructorName(target);
        if (constructorName !== "") {
            nullPrototypeConstructorNames.set(target, constructorName);
        } else {
            nullPrototypeConstructorNames.delete(target);
        }
        return;
    }

    nullPrototypeConstructorNames.delete(target);
}

Object.setPrototypeOf = function setPrototypeOf(target, proto) {
    trackNullPrototypeConstructor(target, proto);
    try {
        return originalObjectSetPrototypeOf(target, proto);
    } catch (err) {
        if (proto === null && isObjectLike(target)) {
            nullPrototypeConstructorNames.delete(target);
        }
        throw err;
    }
};

Reflect.setPrototypeOf = function setPrototypeOf(target, proto) {
    trackNullPrototypeConstructor(target, proto);
    let success = false;
    try {
        success = originalReflectSetPrototypeOf(target, proto);
        return success;
    } finally {
        if (!success && proto === null && isObjectLike(target)) {
            nullPrototypeConstructorNames.delete(target);
        }
    }
};

export function getConstructorName(value) {
    if (!isObjectLike(value)) {
        return "Object";
    }

    const trackedName = nullPrototypeConstructorNames.get(value);
    if (trackedName !== undefined) {
        return trackedName;
    }

    const constructorName = findConstructorName(value);
    if (constructorName !== "") {
        return constructorName;
    }

    const intrinsicConstructorName = findIntrinsicConstructorName(value);
    if (intrinsicConstructorName !== "") {
        return intrinsicConstructorName;
    }

    const globalConstructorName = findGlobalConstructorNameByPrototype(value);
    if (globalConstructorName !== "") {
        return globalConstructorName;
    }

    return "Object";
}

/**
 * Efficiently determine whether the provided property key is numeric
 * (and thus could be an array indexer) or not.
 *
 * Always returns true for values of type `'number'`.
 *
 * Otherwise, only returns true for strings that consist only of positive integers.
 *
 * Results are cached.
 * 
 * @type {Record<string, boolean>}
 */
const isNumericLookup = {};
const kMaxArrayIndex = 2 ** 32 - 2;

/**
 * 
 * @param {unknown} value 
 * @returns {boolean}
 */
export function isArrayIndex(value) {
    switch (typeof value) {
        case "number":
            return Number.isInteger(value) && value >= 0 && value <= kMaxArrayIndex;
        case "string": {
            const result = isNumericLookup[value];
            if (result !== void 0) {
                return result;
            }
            const length = value.length;
            if (length === 0) {
                return isNumericLookup[value] = false;
            }
            let ch = 0;
            let i = 0;
            for (; i < length; ++i) {
                ch = value.charCodeAt(i);
                if (
                    i === 0 && ch === 0x30 && length > 1 /* must not start with 0 */ ||
                    ch < 0x30 /* 0 */ || ch > 0x39 /* 9 */
                ) {
                    return isNumericLookup[value] = false;
                }
            }

            const numericValue = Number(value);
            return isNumericLookup[value] = Number.isInteger(numericValue) &&
                numericValue >= 0 &&
                numericValue <= kMaxArrayIndex &&
                `${numericValue}` === value;
        }
        default:
            return false;
    }
}

/**
 * 
 * @param {object} obj 
 * @param {number} filter 
 * @returns {(string | symbol)[]}
 */
export function getOwnNonIndexProperties(
    // deno-lint-ignore ban-types
    obj,
    filter,
) {
    let allProperties = [
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj),
    ];

    if (Array.isArray(obj) || (ArrayBuffer.isView(obj) && !(obj instanceof DataView))) {
        allProperties = allProperties.filter((k) => !isArrayIndex(k));
    }

    if (filter === ALL_PROPERTIES) {
        return allProperties;
    }

    /**
     * @type {(string | symbol)[]}
     */
    const result = [];
    for (const key of allProperties) {
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc === undefined) {
            continue;
        }
        if (filter & ONLY_WRITABLE && !desc.writable) {
            continue;
        }
        if (filter & ONLY_ENUMERABLE && !desc.enumerable) {
            continue;
        }
        if (filter & ONLY_CONFIGURABLE && !desc.configurable) {
            continue;
        }
        if (filter & SKIP_STRINGS && typeof key === "string") {
            continue;
        }
        if (filter & SKIP_SYMBOLS && typeof key === "symbol") {
            continue;
        }
        result.push(key);
    }
    return result;
}

export function previewEntries(iterable, isMap, preserveRawEntries = false) {
    let flattenedEntries;
    let rawEntries;
    let isKeyValue = true;
    if (iterable !== null && (typeof iterable === "object" || typeof iterable === "function")) {
        const cached = previewEntriesCache.get(iterable);
        if (cached !== undefined) {
            flattenedEntries = cached.flattenedEntries.slice();
            rawEntries = cached.rawEntries.slice();
            isKeyValue = cached.isKeyValue;
        }
    }

    if (flattenedEntries === undefined || rawEntries === undefined) {
        flattenedEntries = [];
        rawEntries = [];
        for (const value of iterable) {
            rawEntries.push(value);
            if (Array.isArray(value) && value.length >= 2) {
                flattenedEntries.push(value[0], value[1]);
            } else {
                isKeyValue = false;
                flattenedEntries.push(value);
            }
        }

        if (iterable !== null && (typeof iterable === "object" || typeof iterable === "function")) {
            previewEntriesCache.set(iterable, {
                flattenedEntries: flattenedEntries.slice(),
                rawEntries: rawEntries.slice(),
                isKeyValue,
            });
        }
    }

    if (preserveRawEntries) {
        return rawEntries;
    }

    if (isMap === true) {
        return [flattenedEntries, isKeyValue];
    }

    return flattenedEntries;
}

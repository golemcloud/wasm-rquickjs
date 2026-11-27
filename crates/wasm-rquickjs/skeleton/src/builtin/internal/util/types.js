// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
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

const _objectToString = Object.prototype.toString;
// These brand checks read Symbol.toStringTag, which V8's native checks never do,
// so a throwing user getter must not escape them.
const _toString = {
    call(value) {
        try {
            return _objectToString.call(value);
        } catch {
            return "";
        }
    },
};
const _getPrototypeOf = Object.getPrototypeOf;

const _isObjectLike = (value) =>
    value !== null && typeof value === "object";

const _isFunctionLike = (value) =>
    value !== null && typeof value === "function";

const _isPrototypeInChain = (value, prototype) => {
    if (!_isObjectLike(value) || prototype === null) {
        return false;
    }

    let current = _getPrototypeOf(value);
    while (current !== null) {
        if (current === prototype) {
            return true;
        }
        current = _getPrototypeOf(current);
    }

    return false;
};

const _mapIteratorPrototype = (() => {
    if (typeof Map !== "function") {
        return null;
    }
    return _getPrototypeOf(new Map().keys());
})();

const _setIteratorPrototype = (() => {
    if (typeof Set !== "function") {
        return null;
    }
    return _getPrototypeOf(new Set().values());
})();

// V8 checks these types by their internal brand, not Symbol.toStringTag, so
// use intrinsic accessors that only accept real instances.
const _getter = (prototype, key) =>
    Object.getOwnPropertyDescriptor(prototype, key)?.get;

const _hasBrand = (getter, value) => {
    if (!_isObjectLike(value) || getter === undefined) {
        return false;
    }
    try {
        getter.call(value);
        return true;
    } catch {
        return false;
    }
};

const _arrayBufferByteLength = _getter(ArrayBuffer.prototype, "byteLength");
const _sharedArrayBufferByteLength = typeof SharedArrayBuffer === "function"
    ? _getter(SharedArrayBuffer.prototype, "byteLength")
    : undefined;
// A detached DataView still answers .buffer, unlike .byteLength.
const _dataViewBuffer = _getter(DataView.prototype, "buffer");
const _dateGetTime = Date.prototype.getTime;
const _regExpGlobal = _getter(RegExp.prototype, "global");
const _typedArrayToStringTag = _getter(
    Object.getPrototypeOf(Uint8Array.prototype),
    Symbol.toStringTag,
);

const _typedArrayName = (value) =>
    _isObjectLike(value) ? _typedArrayToStringTag.call(value) : undefined;

export function isAnyArrayBuffer(value) {
    return isArrayBuffer(value) || isSharedArrayBuffer(value);
}

export function isArgumentsObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Arguments]";
}

export function isArrayBuffer(value) {
    return _hasBrand(_arrayBufferByteLength, value);
}

export function isAsyncFunction(value) {
    return (
        _isFunctionLike(value) && _toString.call(value) === "[object AsyncFunction]"
    );
}

export function isBooleanObject(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        return typeof Boolean.prototype.valueOf.call(value) === "boolean";
    } catch {
        return false;
    }
}

export function isBoxedPrimitive(value) {
    return (
        isBooleanObject(value) ||
        isStringObject(value) ||
        isNumberObject(value) ||
        isSymbolObject(value) ||
        isBigIntObject(value)
    );
}

export function isDataView(value) {
    return _hasBrand(_dataViewBuffer, value);
}

export function isDate(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        _dateGetTime.call(value);
        return true;
    } catch {
        return false;
    }
}

export function isGeneratorFunction(value) {
    return (
        _isFunctionLike(value) &&
        _toString.call(value) === "[object GeneratorFunction]"
    );
}

export function isGeneratorObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Generator]";
}

export function isMap(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        // `Object.prototype.toString` alone is too permissive for QuickJS and
        // matches objects inheriting from `Map.prototype`.
        Map.prototype.has.call(value, undefined);
        return true;
    } catch {
        return false;
    }
}

export function isMapIterator(value) {
    return (
        _isObjectLike(value) &&
        (
            _isPrototypeInChain(value, _mapIteratorPrototype) ||
            _toString.call(value) === "[object Map Iterator]"
        )
    );
}

export function isModuleNamespaceObject(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Module]";
}

export function isNativeError(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Error]";
}

export function isNumberObject(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        return typeof Number.prototype.valueOf.call(value) === "number";
    } catch {
        return false;
    }
}

export function isBigIntObject(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        return typeof BigInt.prototype.valueOf.call(value) === "bigint";
    } catch {
        return false;
    }
}

export function isPromise(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object Promise]";
}

export function isRegExp(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        // RegExp.prototype itself answers undefined instead of throwing.
        return typeof _regExpGlobal.call(value) === "boolean";
    } catch {
        return false;
    }
}

export function isSet(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        // Mirror `isMap` semantics for Set objects as well.
        Set.prototype.has.call(value, undefined);
        return true;
    } catch {
        return false;
    }
}

export function isSetIterator(value) {
    return (
        _isObjectLike(value) &&
        (
            _isPrototypeInChain(value, _setIteratorPrototype) ||
            _toString.call(value) === "[object Set Iterator]"
        )
    );
}

export function isSharedArrayBuffer(value) {
    return _hasBrand(_sharedArrayBufferByteLength, value);
}

export function isStringObject(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        return typeof String.prototype.valueOf.call(value) === "string";
    } catch {
        return false;
    }
}

export function isSymbolObject(value) {
    if (!_isObjectLike(value)) {
        return false;
    }
    try {
        return typeof Symbol.prototype.valueOf.call(value) === "symbol";
    } catch {
        return false;
    }
}

export function isWeakMap(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object WeakMap]";
}

export function isWeakSet(value) {
    return _isObjectLike(value) && _toString.call(value) === "[object WeakSet]";
}

export function isArrayBufferView(value) {
    return ArrayBuffer.isView(value);
}

export function isBigInt64Array(value) {
    return _typedArrayName(value) === "BigInt64Array";
}

export function isBigUint64Array(value) {
    return _typedArrayName(value) === "BigUint64Array";
}

export function isFloat32Array(value) {
    return _typedArrayName(value) === "Float32Array";
}

export function isFloat64Array(value) {
    return _typedArrayName(value) === "Float64Array";
}

export function isInt8Array(value) {
    return _typedArrayName(value) === "Int8Array";
}

export function isInt16Array(value) {
    return _typedArrayName(value) === "Int16Array";
}

export function isInt32Array(value) {
    return _typedArrayName(value) === "Int32Array";
}

export function isTypedArray(value) {
    return _typedArrayName(value) !== undefined;
}

export function isUint8Array(value) {
    return _typedArrayName(value) === "Uint8Array";
}

export function isUint8ClampedArray(value) {
    return _typedArrayName(value) === "Uint8ClampedArray";
}

export function isUint16Array(value) {
    return _typedArrayName(value) === "Uint16Array";
}

export function isUint32Array(value) {
    return _typedArrayName(value) === "Uint32Array";
}

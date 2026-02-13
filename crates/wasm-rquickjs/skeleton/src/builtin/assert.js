import { inspect } from 'node:util';

class AssertionError extends Error {
    constructor(options) {
        if (typeof options !== 'object' || options === null) {
            options = { message: options };
        }
        var message;
        var actual = options.actual;
        var expected = options.expected;
        var operator = options.operator || 'fail';

        if (options.message != null) {
            message = String(options.message);
        } else {
            var actualStr = inspect(actual, { depth: 2 });
            var expectedStr = inspect(expected, { depth: 2 });
            if (actualStr.length > 128) actualStr = actualStr.slice(0, 125) + '...';
            if (expectedStr.length > 128) expectedStr = expectedStr.slice(0, 125) + '...';

            if (operator === 'deepStrictEqual' || operator === 'strictEqual') {
                message = 'Expected values to be strictly equal:\n\n' + actualStr + ' !== ' + expectedStr + '\n';
            } else if (operator === 'deepEqual') {
                message = 'Expected values to be loosely deep-equal:\n\n' + actualStr + ' != ' + expectedStr + '\n';
            } else if (operator === 'notDeepStrictEqual' || operator === 'notStrictEqual') {
                message = 'Expected values to not be strictly equal:\n\n' + actualStr + '\n';
            } else {
                message = actualStr + ' ' + operator + ' ' + expectedStr;
            }
        }

        super(message);

        this.actual = actual;
        this.expected = expected;
        this.operator = operator;
        this.generatedMessage = !options.message;
        this.code = 'ERR_ASSERTION';
        this.name = 'AssertionError';

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, options.stackStartFn || this.constructor);
        }
    }

    toString() {
        return 'AssertionError [ERR_ASSERTION]: ' + this.message;
    }
}

// Process message argument: supports string, Error, and message factory functions
function processMessage(message, actual, expected) {
    if (message instanceof Error) return message;
    if (typeof message === 'function') {
        var result = message(actual, expected);
        if (typeof result === 'string') return result;
        return undefined;
    }
    return message;
}

function innerFail(obj) {
    var msg = processMessage(obj.message, obj.actual, obj.expected);
    if (msg instanceof Error) throw msg;
    obj.message = msg;
    throw new AssertionError(obj);
}

function fail(actual, expected, message, operator) {
    if (arguments.length === 0) {
        message = 'Failed';
    } else if (arguments.length === 1) {
        message = actual;
        actual = undefined;
        expected = undefined;
        operator = undefined;
    }
    var msg = processMessage(message, actual, expected);
    if (msg instanceof Error) throw msg;
    innerFail({
        actual: actual,
        expected: expected,
        message: msg,
        operator: operator || 'fail',
        stackStartFn: fail
    });
}

function ok(value, message) {
    if (!value) {
        innerFail({
            actual: value,
            expected: true,
            message: message,
            operator: '==',
            stackStartFn: ok
        });
    }
}

function equal(actual, expected, message) {
    if (actual != expected) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: '==',
            stackStartFn: equal
        });
    }
}

function notEqual(actual, expected, message) {
    if (actual == expected) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: '!=',
            stackStartFn: notEqual
        });
    }
}

function strictEqual(actual, expected, message) {
    if (!Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'strictEqual',
            stackStartFn: strictEqual
        });
    }
}

function notStrictEqual(actual, expected, message) {
    if (Object.is(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notStrictEqual',
            stackStartFn: notStrictEqual
        });
    }
}

// --- Deep equality helpers ---

function isArguments(val) {
    return Object.prototype.toString.call(val) === '[object Arguments]';
}

function isView(arrbuf) {
    if (ArrayBuffer.isView) return ArrayBuffer.isView(arrbuf);
    return arrbuf && arrbuf.buffer instanceof ArrayBuffer;
}

function isBoxedPrimitive(val) {
    var tag = Object.prototype.toString.call(val);
    return tag === '[object Number]' ||
           tag === '[object String]' ||
           tag === '[object Boolean]' ||
           tag === '[object BigInt]' ||
           tag === '[object Symbol]';
}

function unboxPrimitive(val) {
    var tag = Object.prototype.toString.call(val);
    if (tag === '[object Number]') return Number.prototype.valueOf.call(val);
    if (tag === '[object String]') return String.prototype.valueOf.call(val);
    if (tag === '[object Boolean]') return Boolean.prototype.valueOf.call(val);
    if (tag === '[object BigInt]') return Object(val).valueOf();
    if (tag === '[object Symbol]') return Symbol.prototype.valueOf.call(val);
    return val;
}

function isWeakCollection(val) {
    var tag = Object.prototype.toString.call(val);
    return tag === '[object WeakMap]' || tag === '[object WeakSet]';
}

function isPromiseLike(val) {
    return Object.prototype.toString.call(val) === '[object Promise]';
}

function isArrayIndex(key, length) {
    var num = Number(key);
    return Number.isInteger(num) && num >= 0 && num < length;
}

function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function getEnumerableSymbols(obj) {
    var symbols = Object.getOwnPropertySymbols(obj);
    var result = [];
    for (var i = 0; i < symbols.length; i++) {
        var desc = Object.getOwnPropertyDescriptor(obj, symbols[i]);
        if (desc && desc.enumerable) {
            result.push(symbols[i]);
        }
    }
    return result;
}

function objEquiv(a, b, strict, memo) {
    if (a === null || a === undefined || b === null || b === undefined)
        return false;

    if (typeof a !== 'object' && typeof b !== 'object') {
        return strict ? Object.is(a, b) : a == b;
    }

    // WeakMap, WeakSet: cannot enumerate, only reference-equal
    if (isWeakCollection(a) || isWeakCollection(b)) return false;

    // Promise: not deeply comparable
    if (isPromiseLike(a) || isPromiseLike(b)) return false;

    // Prototype check in strict mode
    if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;

    // Boxed primitives: compare type tag and unboxed value
    var aBoxed = isBoxedPrimitive(a);
    var bBoxed = isBoxedPrimitive(b);
    if (aBoxed || bBoxed) {
        if (!aBoxed || !bBoxed) return false;
        var aTag = Object.prototype.toString.call(a);
        var bTag = Object.prototype.toString.call(b);
        if (aTag !== bTag) return false;
        var aVal = unboxPrimitive(a);
        var bVal = unboxPrimitive(b);
        if (aTag === '[object Number]') {
            if (!Object.is(aVal, bVal)) return false;
        } else if (aTag === '[object Symbol]') {
            if (aVal !== bVal) return false;
        } else {
            if (aVal !== bVal) return false;
        }
        // Fall through to compare additional properties on the boxed object
    }

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags && a.lastIndex === b.lastIndex;
    }

    if (a instanceof Error && b instanceof Error) {
        if (a.message !== b.message || a.name !== b.name) return false;
        // Compare cause if present on either
        var aHasCause = hasOwn(a, 'cause') || 'cause' in a;
        var bHasCause = hasOwn(b, 'cause') || 'cause' in b;
        if (aHasCause !== bHasCause) return false;
        if (aHasCause && !innerDeepEqual(a.cause, b.cause, strict, memo)) return false;
        // Compare errors property (AggregateError)
        var aHasErrors = hasOwn(a, 'errors');
        var bHasErrors = hasOwn(b, 'errors');
        if (aHasErrors !== bHasErrors) return false;
        if (aHasErrors && !innerDeepEqual(a.errors, b.errors, strict, memo)) return false;
        return true;
    }

    if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
        if (a.byteLength !== b.byteLength) return false;
        var viewA = new Uint8Array(a);
        var viewB = new Uint8Array(b);
        for (var i = 0; i < viewA.length; i++) {
            if (viewA[i] !== viewB[i]) return false;
        }
        return true;
    }

    if (isView(a) && isView(b)) {
        if (a.byteLength !== b.byteLength) return false;
        if (strict && a.constructor !== b.constructor) return false;
        var ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
        var ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
        for (var i = 0; i < ua.length; i++) {
            if (ua[i] !== ub[i]) return false;
        }
        return true;
    }

    // Circular reference detection
    if (!memo) {
        memo = { a: [], b: [] };
    }
    var idxA = memo.a.indexOf(a);
    if (idxA !== -1 && memo.b[idxA] === b) {
        return true;
    }
    memo.a.push(a);
    memo.b.push(b);

    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false;
        // Deep comparison of Map entries - supports object keys
        var aEntries = Array.from(a.entries());
        var bEntries = Array.from(b.entries());
        // First pass: match primitive keys directly
        var unmatchedA = [];
        var matchedB = new Array(bEntries.length);
        for (var i = 0; i < aEntries.length; i++) {
            var aKey = aEntries[i][0];
            if (typeof aKey === 'object' && aKey !== null) {
                unmatchedA.push(i);
                continue;
            }
            // Primitive key: find matching entry in b
            var found = false;
            for (var j = 0; j < bEntries.length; j++) {
                if (matchedB[j]) continue;
                var bKey = bEntries[j][0];
                var keysMatch = strict ? Object.is(aKey, bKey) : aKey == bKey;
                if (keysMatch) {
                    if (!innerDeepEqual(aEntries[i][1], bEntries[j][1], strict, memo)) return false;
                    matchedB[j] = true;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        // Second pass: match object keys with deep equality
        for (var i = 0; i < unmatchedA.length; i++) {
            var ai = unmatchedA[i];
            var aKey = aEntries[ai][0];
            var found = false;
            for (var j = 0; j < bEntries.length; j++) {
                if (matchedB[j]) continue;
                if (innerDeepEqual(aKey, bEntries[j][0], strict, { a: memo.a.slice(), b: memo.b.slice() })) {
                    if (!innerDeepEqual(aEntries[ai][1], bEntries[j][1], strict, memo)) return false;
                    matchedB[j] = true;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }

    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false;
        var arrA = Array.from(a);
        var arrB = Array.from(b);
        // Fast path: try direct membership first for primitives
        var unmatchedA = [];
        var usedB = new Array(arrB.length);
        for (var i = 0; i < arrA.length; i++) {
            if (typeof arrA[i] !== 'object' || arrA[i] === null) {
                if (b.has(arrA[i])) {
                    // Mark corresponding b entry as used
                    for (var j = 0; j < arrB.length; j++) {
                        if (!usedB[j] && (strict ? Object.is(arrA[i], arrB[j]) : arrA[i] == arrB[j])) {
                            usedB[j] = true;
                            break;
                        }
                    }
                    continue;
                }
                if (!strict) {
                    unmatchedA.push(i);
                    continue;
                }
                return false;
            }
            unmatchedA.push(i);
        }
        // Deep compare remaining
        for (var i = 0; i < unmatchedA.length; i++) {
            var found = false;
            for (var j = 0; j < arrB.length; j++) {
                if (usedB[j]) continue;
                if (innerDeepEqual(arrA[unmatchedA[i]], arrB[j], strict, { a: memo.a.slice(), b: memo.b.slice() })) {
                    usedB[j] = true;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }

    var isArrayA = Array.isArray(a);
    var isArrayB = Array.isArray(b);

    if (isArrayA !== isArrayB) return false;

    if (isArrayA && isArrayB) {
        if (a.length !== b.length) return false;
        // In strict mode, check sparse array holes
        for (var i = 0; i < a.length; i++) {
            var aHas = hasOwn(a, i);
            var bHas = hasOwn(b, i);
            if (strict && aHas !== bHas) return false;
            if (!innerDeepEqual(a[i], b[i], strict, memo)) return false;
        }
        // Check non-index string properties
        var keysA = Object.keys(a).filter(function(k) { return !isArrayIndex(k, a.length); });
        var keysB = Object.keys(b).filter(function(k) { return !isArrayIndex(k, b.length); });
        if (keysA.length !== keysB.length) return false;
        for (var i = 0; i < keysA.length; i++) {
            if (!hasOwn(b, keysA[i])) return false;
            if (!innerDeepEqual(a[keysA[i]], b[keysA[i]], strict, memo)) return false;
        }
        // Check Symbol properties in strict mode
        if (strict) {
            var symA = getEnumerableSymbols(a);
            var symB = getEnumerableSymbols(b);
            if (symA.length !== symB.length) return false;
            for (var i = 0; i < symA.length; i++) {
                if (symA[i] !== symB[i]) return false;
                if (!innerDeepEqual(a[symA[i]], b[symA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    // Plain objects
    var ka = Object.keys(a);
    var kb = Object.keys(b);

    if (ka.length !== kb.length) return false;

    ka.sort();
    kb.sort();

    for (var i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return false;
    }

    for (var i = 0; i < ka.length; i++) {
        if (!innerDeepEqual(a[ka[i]], b[ka[i]], strict, memo)) return false;
    }

    // Check Symbol properties in strict mode
    if (strict) {
        var symA = getEnumerableSymbols(a);
        var symB = getEnumerableSymbols(b);
        if (symA.length !== symB.length) return false;
        for (var i = 0; i < symA.length; i++) {
            if (symA[i] !== symB[i]) return false;
            if (!innerDeepEqual(a[symA[i]], b[symA[i]], strict, memo)) return false;
        }
    }

    return true;
}

function innerDeepEqual(a, b, strict, memo) {
    if (strict ? Object.is(a, b) : a == b) return true;

    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
        if (!strict && a == b) return true;
        return false;
    }

    return objEquiv(a, b, strict, memo);
}

function deepEqual(actual, expected, message) {
    if (!innerDeepEqual(actual, expected, false, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'deepEqual',
            stackStartFn: deepEqual
        });
    }
}

function notDeepEqual(actual, expected, message) {
    if (innerDeepEqual(actual, expected, false, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notDeepEqual',
            stackStartFn: notDeepEqual
        });
    }
}

function deepStrictEqual(actual, expected, message) {
    if (!innerDeepEqual(actual, expected, true, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'deepStrictEqual',
            stackStartFn: deepStrictEqual
        });
    }
}

function notDeepStrictEqual(actual, expected, message) {
    if (innerDeepEqual(actual, expected, true, undefined)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'notDeepStrictEqual',
            stackStartFn: notDeepStrictEqual
        });
    }
}

function partialDeepStrictEqual(actual, expected, message) {
    if (!innerPartialDeepEqual(actual, expected)) {
        innerFail({
            actual: actual,
            expected: expected,
            message: message,
            operator: 'partialDeepStrictEqual',
            stackStartFn: partialDeepStrictEqual
        });
    }
}

function innerPartialDeepEqual(actual, expected) {
    if (Object.is(actual, expected)) return true;
    if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object')
        return false;

    if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) return false;
        if (actual.length < expected.length) return false;
        for (var i = 0; i < expected.length; i++) {
            if (!innerPartialDeepEqual(actual[i], expected[i])) return false;
        }
        return true;
    }

    if (expected instanceof Map) {
        if (!(actual instanceof Map)) return false;
        if (actual.size < expected.size) return false;
        var entries = Array.from(expected.entries());
        for (var i = 0; i < entries.length; i++) {
            if (!actual.has(entries[i][0])) return false;
            if (!innerPartialDeepEqual(actual.get(entries[i][0]), entries[i][1])) return false;
        }
        return true;
    }

    if (expected instanceof Set) {
        if (!(actual instanceof Set)) return false;
        if (actual.size < expected.size) return false;
        var arrExp = Array.from(expected);
        for (var i = 0; i < arrExp.length; i++) {
            if (!actual.has(arrExp[i])) {
                var found = false;
                var arrAct = Array.from(actual);
                for (var j = 0; j < arrAct.length; j++) {
                    if (innerPartialDeepEqual(arrAct[j], arrExp[i])) { found = true; break; }
                }
                if (!found) return false;
            }
        }
        return true;
    }

    if (expected instanceof Date && actual instanceof Date)
        return expected.getTime() === actual.getTime();
    if (expected instanceof RegExp && actual instanceof RegExp)
        return expected.source === actual.source && expected.flags === actual.flags;

    var keys = Object.keys(expected);
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn(actual, keys[i])) return false;
        if (!innerPartialDeepEqual(actual[keys[i]], expected[keys[i]])) return false;
    }
    return true;
}

// --- throws / doesNotThrow / rejects / doesNotReject ---

function expectedException(actual, expected, message, fn) {
    if (typeof expected === 'string') {
        if (arguments.length === 4 && fn !== undefined && message !== undefined && typeof message !== 'string') {
            // The 3-arg form where error is string is okay (it becomes message)
        }
        if (typeof actual === 'object' && actual !== null) {
            if (actual.message === expected) {
                throw new TypeError('ERR_AMBIGUOUS_ARGUMENT: The "error" argument is ambiguous. The error message is identical to the expected value.');
            }
        }
        message = expected;
        expected = undefined;
    }

    if (expected === undefined) return { pass: true, message: message };

    if (typeof expected === 'function') {
        if (expected.prototype !== undefined && actual instanceof expected) {
            return { pass: true, message: message };
        }
        if (Error.isPrototypeOf(expected)) {
            return { pass: false, message: message };
        }
        var result = expected.call({}, actual);
        if (result === true) {
            return { pass: true, message: message };
        }
        return { pass: false, message: message };
    }

    if (expected instanceof RegExp) {
        var str = String(actual);
        if (expected.test(str)) {
            return { pass: true, message: message };
        }
        return { pass: false, message: message };
    }

    if (typeof expected === 'object' && expected !== null) {
        var keys = Object.keys(expected);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key === 'message' && expected[key] instanceof RegExp) {
                if (!expected[key].test(actual[key])) return { pass: false, message: message };
            } else if (!innerDeepEqual(actual[key], expected[key], true, undefined)) {
                return { pass: false, message: message };
            }
        }
        return { pass: true, message: message };
    }

    return { pass: false, message: message };
}

function throws(fn, error, message) {
    if (typeof fn !== 'function') {
        throw new TypeError('The "fn" argument must be of type Function');
    }

    if (typeof error === 'string') {
        message = error;
        error = undefined;
    }

    var actual;
    var threw = false;
    try {
        fn();
    } catch (e) {
        threw = true;
        actual = e;
    }

    if (!threw) {
        innerFail({
            actual: undefined,
            expected: error,
            message: message || 'Missing expected exception.',
            operator: 'throws',
            stackStartFn: throws
        });
    }

    if (error !== undefined) {
        var result = expectedException(actual, error, message, throws);
        if (!result.pass) {
            innerFail({
                actual: actual,
                expected: error,
                message: result.message || 'The error did not match the expected value.',
                operator: 'throws',
                stackStartFn: throws
            });
        }
    }
}

function doesNotThrow(fn, error, message) {
    if (typeof fn !== 'function') {
        throw new TypeError('The "fn" argument must be of type Function');
    }

    if (typeof error === 'string') {
        message = error;
        error = undefined;
    }

    try {
        fn();
    } catch (e) {
        if (error !== undefined) {
            var result = expectedException(e, error, message, doesNotThrow);
            if (result.pass) {
                innerFail({
                    actual: e,
                    expected: error,
                    message: result.message || 'Got unwanted exception.',
                    operator: 'doesNotThrow',
                    stackStartFn: doesNotThrow
                });
            }
            // Error was thrown but didn't match the expected type - rethrow
            throw e;
        } else {
            innerFail({
                actual: e,
                expected: error,
                message: message || 'Got unwanted exception.',
                operator: 'doesNotThrow',
                stackStartFn: doesNotThrow
            });
        }
    }
}

async function rejects(asyncFnOrPromise, error, message) {
    if (typeof asyncFnOrPromise === 'function') {
        asyncFnOrPromise = asyncFnOrPromise();
    }

    if (!asyncFnOrPromise || typeof asyncFnOrPromise.then !== 'function') {
        throw new TypeError('The "asyncFnOrPromise" argument must be a Promise or async function');
    }

    if (typeof error === 'string') {
        message = error;
        error = undefined;
    }

    var actual;
    var threw = false;
    try {
        await asyncFnOrPromise;
    } catch (e) {
        threw = true;
        actual = e;
    }

    if (!threw) {
        innerFail({
            actual: undefined,
            expected: error,
            message: message || 'Missing expected rejection.',
            operator: 'rejects',
            stackStartFn: rejects
        });
    }

    if (error !== undefined) {
        var result = expectedException(actual, error, message, rejects);
        if (!result.pass) {
            innerFail({
                actual: actual,
                expected: error,
                message: result.message || 'The rejection did not match the expected value.',
                operator: 'rejects',
                stackStartFn: rejects
            });
        }
    }
}

async function doesNotReject(asyncFnOrPromise, error, message) {
    if (typeof asyncFnOrPromise === 'function') {
        asyncFnOrPromise = asyncFnOrPromise();
    }

    if (!asyncFnOrPromise || typeof asyncFnOrPromise.then !== 'function') {
        throw new TypeError('The "asyncFnOrPromise" argument must be a Promise or async function');
    }

    if (typeof error === 'string') {
        message = error;
        error = undefined;
    }

    try {
        await asyncFnOrPromise;
    } catch (e) {
        if (error !== undefined) {
            var result = expectedException(e, error, message, doesNotReject);
            if (result.pass) {
                innerFail({
                    actual: e,
                    expected: error,
                    message: result.message || 'Got unwanted rejection.',
                    operator: 'doesNotReject',
                    stackStartFn: doesNotReject
                });
            }
            // Didn't match, rethrow
            throw e;
        } else {
            innerFail({
                actual: e,
                expected: error,
                message: message || 'Got unwanted rejection.',
                operator: 'doesNotReject',
                stackStartFn: doesNotReject
            });
        }
    }
}

function ifError(value) {
    if (value !== null && value !== undefined) {
        var newErr = new AssertionError({
            actual: value,
            expected: null,
            message: 'ifError got unwanted exception: ' + (typeof value === 'object' && value.message ? value.message : inspect(value)),
            operator: 'ifError',
            stackStartFn: ifError
        });
        var origStack = value instanceof Error ? value.stack : '';
        if (origStack) {
            newErr.stack = newErr.stack + '\n\nOriginal error:\n' + origStack;
        }
        throw newErr;
    }
}

function match(string, regexp, message) {
    if (typeof string !== 'string') {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The "string" argument must be of type string. Received type ' + typeof string,
            operator: 'match',
            stackStartFn: match
        });
    }
    if (!(regexp instanceof RegExp)) {
        throw new TypeError('The "regexp" argument must be an instance of RegExp');
    }
    if (!regexp.test(string)) {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The input did not match the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string),
            operator: 'match',
            stackStartFn: match
        });
    }
}

function doesNotMatch(string, regexp, message) {
    if (typeof string !== 'string') {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The "string" argument must be of type string. Received type ' + typeof string,
            operator: 'doesNotMatch',
            stackStartFn: doesNotMatch
        });
    }
    if (!(regexp instanceof RegExp)) {
        throw new TypeError('The "regexp" argument must be an instance of RegExp');
    }
    if (regexp.test(string)) {
        innerFail({
            actual: string,
            expected: regexp,
            message: message || 'The input was expected to not match the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string),
            operator: 'doesNotMatch',
            stackStartFn: doesNotMatch
        });
    }
}

// Deprecated CallTracker stub
class CallTracker {
    constructor() {}
    calls(fn, exact) { return fn || function() {}; }
    getCalls() { return []; }
    report() { return []; }
    reset() {}
    verify() {}
}

// --- Wire up the main assert function ---

var assert = function assert(value, message) {
    ok(value, message);
};

assert.ok = ok;
assert.equal = equal;
assert.notEqual = notEqual;
assert.strictEqual = strictEqual;
assert.notStrictEqual = notStrictEqual;
assert.deepEqual = deepEqual;
assert.notDeepEqual = notDeepEqual;
assert.deepStrictEqual = deepStrictEqual;
assert.notDeepStrictEqual = notDeepStrictEqual;
assert.partialDeepStrictEqual = partialDeepStrictEqual;
assert.throws = throws;
assert.doesNotThrow = doesNotThrow;
assert.rejects = rejects;
assert.doesNotReject = doesNotReject;
assert.ifError = ifError;
assert.match = match;
assert.doesNotMatch = doesNotMatch;
assert.fail = fail;
assert.AssertionError = AssertionError;
assert.CallTracker = CallTracker;

var strict = function strict(value, message) {
    ok(value, message);
};

strict.ok = ok;
strict.equal = strictEqual;
strict.notEqual = notStrictEqual;
strict.deepEqual = deepStrictEqual;
strict.notDeepEqual = notDeepStrictEqual;
strict.strictEqual = strictEqual;
strict.notStrictEqual = notStrictEqual;
strict.deepStrictEqual = deepStrictEqual;
strict.notDeepStrictEqual = notDeepStrictEqual;
strict.partialDeepStrictEqual = partialDeepStrictEqual;
strict.throws = throws;
strict.doesNotThrow = doesNotThrow;
strict.rejects = rejects;
strict.doesNotReject = doesNotReject;
strict.ifError = ifError;
strict.match = match;
strict.doesNotMatch = doesNotMatch;
strict.fail = fail;
strict.AssertionError = AssertionError;
strict.CallTracker = CallTracker;
strict.strict = strict;

assert.strict = strict;

export {
    AssertionError,
    CallTracker,
    ok,
    equal,
    notEqual,
    strictEqual,
    notStrictEqual,
    deepEqual,
    notDeepEqual,
    deepStrictEqual,
    notDeepStrictEqual,
    partialDeepStrictEqual,
    throws,
    doesNotThrow,
    rejects,
    doesNotReject,
    ifError,
    match,
    doesNotMatch,
    fail,
    strict
};

export default assert;

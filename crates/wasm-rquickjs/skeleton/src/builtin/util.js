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

// Import Node.js-compatible inspect/format/formatWithOptions from internal implementation
import {
    inspect,
    format,
    formatWithOptions,
    stripVTControlCharacters
} from '__wasm_rquickjs_builtin/internal/util/inspect';
import * as webCryptoNative from '__wasm_rquickjs_builtin/web_crypto_native';
import {
    ERR_INVALID_ARG_TYPE,
    ERR_OUT_OF_RANGE,
    isErrorStackTraceLimitWritable
} from '__wasm_rquickjs_builtin/internal/errors';

import { deprecate as _internalDeprecate } from '__wasm_rquickjs_builtin/internal/util';

var _ObjectKeys = Object.keys;
var _ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
var _ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var _ObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
var _ObjectGetPrototypeOf = Object.getPrototypeOf;
var _ObjectPrototypeToString = Object.prototype.toString;
var _ObjectPrototypeHasOwnProperty = Object.prototype.hasOwnProperty;
var _ObjectDefineProperty = Object.defineProperty;
var _ObjectSetPrototypeOf = Object.setPrototypeOf;
var _ObjectIs = Object.is;
var _ArrayIsArray = Array.isArray;
var _ArrayBufferIsView = ArrayBuffer.isView;
var _JSONStringify = JSON.stringify;
var _RegExpPrototypeToString = RegExp.prototype.toString;
var _DatePrototypeToISOString = Date.prototype.toISOString;
var _DatePrototypeGetTime = Date.prototype.getTime;
var _ErrorPrototypeToString = Error.prototype.toString;
var _NumberIsInteger = Number.isInteger;
var _NumberPrototypeValueOf = Number.prototype.valueOf;
var _StringPrototypeValueOf = String.prototype.valueOf;
var _BooleanPrototypeValueOf = Boolean.prototype.valueOf;

var _TypedArrayToStringTagGetter = (function() {
    try {
        var typedArrayProto = Object.getPrototypeOf(Uint8Array.prototype);
        var desc = Object.getOwnPropertyDescriptor(typedArrayProto, Symbol.toStringTag);
        return desc && typeof desc.get === 'function' ? desc.get : null;
    } catch (_) {
        return null;
    }
})();

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
    function getOwnPropertyDescriptors(obj) {
        var keys = Object.keys(obj);
        var descriptors = {};
        for (var i = 0; i < keys.length; i++) {
            descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
        }
        return descriptors;
    };

var formatRegExp = /%[sdjifoOc%]/g;

var _circularErrorMessage;
try {
    var _circObj = {}; _circObj._c = _circObj; JSON.stringify(_circObj);
} catch(_circErr) {
    _circularErrorMessage = _circErr.message.split('\n', 1)[0];
}

function _addNumericSeparator(intStr) {
    var result = '';
    var i = intStr.length;
    var start = intStr.charAt(0) === '-' ? 1 : 0;
    for (; i >= start + 4; i -= 3) {
        result = '_' + intStr.slice(i - 3, i) + result;
    }
    return (i === intStr.length) ? intStr : intStr.slice(0, i) + result;
}

function _addNumericSeparatorEnd(intStr) {
    var result = '';
    var i = 0;
    for (; i < intStr.length - 3; i += 3) {
        result += intStr.slice(i, i + 3) + '_';
    }
    return (i === 0) ? intStr : result + intStr.slice(i);
}

function _formatNumberWithSep(num, sep) {
    if (Object.is(num, -0)) return '-0';
    var str = String(num);
    if (!sep) return str;
    if (!Number.isFinite(num) || str.indexOf('e') !== -1) return str;
    var integer = Math.trunc(num);
    var intStr = String(integer);
    if (integer === num) {
        return _addNumericSeparator(intStr);
    }
    if (Number.isNaN(num)) return intStr;
    return _addNumericSeparator(intStr) + '.' +
        _addNumericSeparatorEnd(str.slice(intStr.length + 1));
}

function _formatBigIntWithSep(bigint, sep) {
    var str = String(bigint);
    if (!sep) return str + 'n';
    return _addNumericSeparator(str) + 'n';
}

function _tryStringify(arg) {
    try {
        return JSON.stringify(arg);
    } catch(err) {
        if (err.name === 'TypeError' && _circularErrorMessage &&
            err.message.split('\n', 1)[0] === _circularErrorMessage) {
            return '[Circular]';
        }
        throw err;
    }
}

function formatWithInspectOptions(inspectOptions, f) {
    var tempArgs = [];
    for (var a = 2; a < arguments.length; a++) {
        tempArgs.push(arguments[a]);
    }
    var args = tempArgs;
    var len = args.length;

    if (!isString(f)) {
        var objects = [];
        objects.push(typeof f !== 'string' ? inspect(f, inspectOptions) : f);
        for (var i = 0; i < len; i++) {
            objects.push(typeof args[i] !== 'string' ? inspect(args[i], inspectOptions) : args[i]);
        }
        return objects.join(' ');
    }

    var numSep = (inspectOptions && inspectOptions.numericSeparator !== undefined)
        ? inspectOptions.numericSeparator
        : (inspect.defaultOptions && inspect.defaultOptions.numericSeparator) || false;
    var i = 0;
    var str = String(f).replace(formatRegExp, function(x) {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
            case '%s': {
                var val = args[i++];
                if (typeof val === 'number') {
                    return _formatNumberWithSep(val, numSep);
                } else if (typeof val === 'bigint') {
                    return _formatBigIntWithSep(val, numSep);
                } else if (typeof val === 'object' && val !== null || typeof val === 'function') {
                    var hasCustomToString = false;
                    try {
                        hasCustomToString = typeof val.toString === 'function' && val.toString !== Object.prototype.toString;
                    } catch(e) {}
                    if (hasCustomToString) {
                        try {
                            var result = String(val);
                            if (result !== '[object Object]') {
                                return result;
                            }
                        } catch(e) {}
                    }
                    return inspect(val, Object.assign({}, inspectOptions, { compact: 3, colors: false, depth: 0 }));
                } else if (typeof val === 'symbol') {
                    return val.toString();
                }
                return String(val);
            }
            case '%d': {
                var val = args[i++];
                if (typeof val === 'bigint') {
                    return _formatBigIntWithSep(val, numSep);
                } else if (typeof val === 'symbol') {
                    return 'NaN';
                }
                return _formatNumberWithSep(Number(val), numSep);
            }
            case '%i': {
                var val = args[i++];
                if (typeof val === 'bigint') {
                    return _formatBigIntWithSep(val, numSep);
                } else if (typeof val === 'symbol') {
                    return 'NaN';
                }
                return _formatNumberWithSep(parseInt(val), numSep);
            }
            case '%f': {
                var val = args[i++];
                if (typeof val === 'symbol') {
                    return 'NaN';
                }
                if (typeof val === 'bigint') {
                    return String(Number(val));
                }
                var num = parseFloat(val);
                if (Object.is(num, -0)) return '-0';
                return String(num);
            }
            case '%j':
                return _tryStringify(args[i++]);
            case '%o':
                return inspect(args[i++], Object.assign({}, inspectOptions, { showHidden: true, showProxy: true, depth: 4 }));
            case '%O':
                return inspect(args[i++], Object.assign({}, inspectOptions, { depth: 4 }));
            case '%c':
                i++;
                return '';
            default:
                return x;
        }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
        str += ' ' + (typeof x !== 'string' ? inspect(x, inspectOptions) : x);
    }
    return str;
}

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
export const deprecate = _internalDeprecate;


var debugs = {};
var debugEnvRegex = /^$/;

export const debuglog = function(set) {
    set = set.toUpperCase();
    if (!debugs[set]) {
        if (debugEnvRegex.test(set)) {
            debugs[set] = function() {
                var msg = format.apply(null, arguments);
                console.error('%s: %s', set, msg);
            };
        } else {
            debugs[set] = function() {};
        }
    }
    return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
// inspect is now delegated to the internal implementation (see bottom of file)
// This old implementation is kept as _legacyInspect for internal use by debuglog etc.
function _legacyInspect(obj, opts) {
    // default options
    var ctx = {
        seen: [],
        stylize: stylizeNoColor,
        circular: new Map(),
        circularCounter: { value: 0 }
    };
    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];
    if (isBoolean(opts)) {
        // legacy...
        ctx.showHidden = opts;
    } else if (opts) {
        // got an "options" object
        _extend(ctx, opts);
    }
    // set default options
    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    ctx.compact = opts && opts.compact !== undefined ? opts.compact : 3;
    ctx.sorted = opts && opts.sorted || false;
    return formatValue(ctx, obj, ctx.depth);
}

// inspect.colors, inspect.styles, and inspect.defaultOptions are provided by the
// internal inspect implementation imported at the top of this file.

function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
        return '\u001b[' + inspect.colors[style][0] + 'm' + str +
            '\u001b[' + inspect.colors[style][1] + 'm';
    } else {
        return str;
    }
}


function stylizeNoColor(str, styleType) {
    return str;
}


function arrayToHash(array) {
    var hash = {};

    array.forEach(function(val, idx) {
        hash[val] = true;
    });

    return hash;
}


function getCircularRef(ctx, value) {
    if (!ctx.circular.has(value)) {
        ctx.circularCounter.value++;
        ctx.circular.set(value, ctx.circularCounter.value);
    }
    return ctx.circular.get(value);
}

function formatValue(ctx, value, recurseTimes) {
    // Detect revoked proxies early: any property access on a revoked proxy
    // throws TypeError. We catch this and return a safe representation.
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        try {
            Object.getPrototypeOf(value);
        } catch (err) {
            if (err instanceof TypeError && typeof err.message === 'string' &&
                /revoked/i.test(err.message) && /proxy/i.test(err.message)) {
                return ctx.stylize('<Revoked Proxy>', 'special');
            }
            throw err;
        }
    }

    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    // Skip custom inspect for TypedArrays/Buffers — use built-in formatting
    var skipCustomInspect = value && _ArrayBufferIsView(value) && !(value instanceof DataView);
    if (!skipCustomInspect &&
        ctx.customInspect &&
        value &&
        isFunction(value.inspect) &&
        // Filter out the util module, it's inspect function is special
        value.inspect !== inspect &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
            ret = formatValue(ctx, ret, recurseTimes);
        }
        return ret;
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
        return primitive;
    }

    // Look up the keys of the object.
    var keys = _ObjectKeys(value);

    // For TypedArrays, filter out numeric index keys (handled separately)
    var isTypedArrKeys = _ArrayBufferIsView(value) && !(value instanceof DataView);
    if (isTypedArrKeys) {
        keys = keys.filter(function(key) { return !key.match(/^\d+$/); });
    }

    var visibleKeys = arrayToHash(keys);

    if (ctx.sorted) {
        keys.sort();
    }

    if (ctx.showHidden) {
        keys = _ObjectGetOwnPropertyNames(value);
        // Also include getter/setter properties from prototype chain
        if (ctx.getters) {
            var proto = Object.getPrototypeOf(value);
            while (proto && proto !== Object.prototype) {
                var protoNames = Object.getOwnPropertyNames(proto);
                for (var pi = 0; pi < protoNames.length; pi++) {
                    var pn = protoNames[pi];
                    if (pn !== 'constructor' && keys.indexOf(pn) === -1) {
                        var pd = Object.getOwnPropertyDescriptor(proto, pn);
                        if (pd && (pd.get || pd.set)) {
                            keys.push(pn);
                        }
                    }
                }
                proto = Object.getPrototypeOf(proto);
            }
        }
    }

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value)
        && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
        keys = keys.filter(function(key) {
            return key !== 'message' && key !== 'description';
        });
        if (hasOwnProperty(value, 'cause') && keys.indexOf('cause') === -1) {
            keys.push('cause');
        }
        visibleKeys = arrayToHash(keys);
        if (keys.length === 0) {
            return formatError(value);
        }
    }

    // For errors, ensure 'cause' is included in keys if present and formatted with brackets
    if (isError(value) && hasOwnProperty(value, 'cause')) {
        if (keys.indexOf('cause') === -1) {
            keys.push('cause');
        }
        delete visibleKeys['cause'];
    }

    // Some type of object without properties can be shortcutted.
    // But Maps, Sets, WeakMaps, WeakSets need special handling since they don't have enumerable properties
    if (keys.length === 0 && !isMap(value) && !isSet(value) && !isWeakMap(value) && !isWeakSet(value) && !isTypedArrKeys) {
        if (isFunction(value)) {
            var name = value.name ? ': ' + value.name : ' (anonymous)';
            return ctx.stylize('[Function' + name + ']', 'special');
        }
        if (isRegExp(value)) {
            return ctx.stylize(_RegExpPrototypeToString.call(value), 'regexp');
        }
        if (isDate(value)) {
            return ctx.stylize(_DatePrototypeToISOString.call(value), 'date');
        }
        if (isError(value)) {
            return formatError(value);
        }
    }
    
    // Handle empty Maps
    if (isMap(value) && value.size === 0) {
        return ctx.stylize('Map(0) {}', 'special');
    }
    
    // Handle empty Sets
    if (isSet(value) && value.size === 0) {
        return ctx.stylize('Set(0) {}', 'special');
    }
    
    // Handle WeakSets
    if (isWeakSet(value)) {
        return ctx.stylize('WeakSet { <items unknown> }', 'special');
    }
    
    // Handle WeakMaps
    if (isWeakMap(value)) {
        return ctx.stylize('WeakMap { <items unknown> }', 'special');
    }

    var base = '', array = false, typedArray = false, braces = ['{', '}'];

    // Detect TypedArray/Buffer before generic object handling
    var isTypedArr = _ArrayBufferIsView(value) && !(value instanceof DataView);
    var isBuf = typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value);

    // Make Array say that they are Array
    if (isArray(value) && !isTypedArr) {
        array = true;
        braces = ['[', ']'];
    }

    // TypedArray / Buffer formatting
    if (isTypedArr) {
        typedArray = true;
        var typedName = value.constructor ? value.constructor.name : 'TypedArray';
        if (isBuf) {
            braces = ['Buffer(' + value.length + ') [Uint8Array] [', ']'];
        } else {
            braces = [typedName + '(' + value.length + ') [', ']'];
        }
    }

    // Make functions say that they are functions
    if (isFunction(value)) {
        var n = value.name ? ': ' + value.name : ' (anonymous)';
        base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
        var regStr = _RegExpPrototypeToString.call(value);
        var regCtor = value.constructor;
        if (regCtor && regCtor.name && regCtor.name !== 'RegExp') {
            base = ' ' + regCtor.name + ' ' + regStr;
        } else {
            base = ' ' + regStr;
        }
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
        var dateStr = _DatePrototypeToISOString.call(value);
        var dateCtor = value.constructor;
        if (dateCtor && dateCtor.name && dateCtor.name !== 'Date') {
            base = ' ' + dateCtor.name + ' ' + dateStr;
        } else {
            base = ' ' + dateStr;
        }
    }

    // Make maps with properties first say the map size
    if (isMap(value)) {
        base = 'Map(' + value.size + ')';
        braces = [' { ', ' }'];
    }

    // Make sets with properties first say the set size
    if (isSet(value)) {
        base = 'Set(' + value.size + ')';
        braces = [' { ', ' }'];
    }

    // Make error with message first say the error
    if (isError(value)) {
        braces = [formatError(value) + ' {', '}'];
        base = '';
    }

    // Show constructor name for non-plain objects (like fake Date, custom classes)
    if (base === '' && !array && !typedArray && !isError(value)) {
        var proto = _ObjectGetPrototypeOf(value);
        var ctor = value.constructor;
        if (proto === null) {
            var ctorName = ctor && ctor.name ? ctor.name : '';
            var tag = value[Symbol.toStringTag];
            if (!ctorName && tag) ctorName = tag;
            if (ctorName) {
                braces = ['[' + ctorName + ': null prototype] {', '}'];
            } else {
                braces = ['[Object: null prototype] {', '}'];
            }
        } else if (ctor && ctor.name && ctor.name !== 'Object') {
            braces = [ctor.name + ' {', '}'];
        }
    }

    if (keys.length === 0 && (!array || value.length == 0) && !isMap(value) && !isSet(value) && !typedArray) {
        return braces[0] + base + braces[1];
    }

    if (typedArray && value.length === 0 && keys.length === 0) {
        return braces[0] + braces[1];
    }

    if (recurseTimes < 0 || ctx.seen.length > 50) {
        if (isRegExp(value)) {
            return ctx.stylize(_RegExpPrototypeToString.call(value), 'regexp');
        } else if (_ArrayIsArray(value)) {
            return ctx.stylize('[Array]', 'special');
        } else {
            return ctx.stylize('[Object]', 'special');
        }
    }

    ctx.seen.push(value);

    var output;
    if (typedArray) {
        output = formatTypedArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else if (isMap(value)) {
        output = formatMap(ctx, value, recurseTimes);
    } else if (isSet(value)) {
        output = formatSet(ctx, value, recurseTimes);
    } else {
        output = keys.map(function(key) {
            return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
    }

    ctx.seen.pop();

    var result = reduceToSingleString(output, base, braces, ctx);
    if (ctx.circular.has(value)) {
        result = '<ref *' + ctx.circular.get(value) + '> ' + result;
    }
    return result;
}


function formatPrimitive(ctx, value) {
    if (isUndefined(value))
        return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
        var strEsc = function(s) {
            return '\'' + _JSONStringify(s).replace(/^"|"$/g, '')
                .replace(/'/g, "\\'")
                .replace(/\\"/g, '"') + '\'';
        };
        if (ctx.compact !== true &&
            value.length > 5 &&
            value.indexOf('\n') !== -1 &&
            value.length > (ctx.breakLength || 80) - 4) {
            var parts = value.split(/(?<=\n)/);
            var joined = parts.map(function(part) {
                return ctx.stylize(strEsc(part), 'string');
            }).join(' +\n    ');
            return joined;
        }
        return ctx.stylize(strEsc(value), 'string');
    }
    if (isNumber(value)) {
        if (Object.is(value, -0)) return ctx.stylize('-0', 'number');
        return ctx.stylize('' + value, 'number');
    }
    if (isBoolean(value))
        return ctx.stylize('' + value, 'boolean');
    if (typeof value === 'bigint')
        return ctx.stylize(value + 'n', 'number');
    if (typeof value === 'symbol')
        return ctx.stylize(value.toString(), 'symbol');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value))
        return ctx.stylize('null', 'null');
}


function formatError(value) {
    return '[' + _ErrorPrototypeToString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
     var output = [];
     for (var i = 0, l = value.length; i < l; ++i) {
         if (hasOwnProperty(value, String(i))) {
             output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                 String(i), true));
         } else {
             output.push('');
         }
     }
     keys.forEach(function(key) {
         if (!key.match(/^\d+$/)) {
             output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                 key, true));
         }
     });
     return output;
 }


 function formatTypedArray(ctx, value, recurseTimes, visibleKeys, keys) {
     var output = [];
     for (var i = 0; i < value.length; i++) {
         output.push(ctx.stylize(String(value[i]), 'number'));
     }
     // Add non-index own properties
     keys.forEach(function(key) {
         if (!key.match(/^\d+$/)) {
             output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
         }
     });
     return output;
 }

 function formatMap(ctx, value, recurseTimes) {
     var output = [];
     var entries = value.entries();
     var entry;
     while (!(entry = entries.next()).done) {
         var key = entry.value[0];
         var val = entry.value[1];
         var keyStr, valStr;
         
         if (ctx.seen.indexOf(key) < 0) {
             if (isNull(recurseTimes)) {
                 keyStr = formatValue(ctx, key, null);
             } else {
                 keyStr = formatValue(ctx, key, recurseTimes - 1);
             }
         } else {
             keyStr = ctx.stylize('[Circular *' + getCircularRef(ctx, key) + ']', 'special');
         }
         
         if (ctx.seen.indexOf(val) < 0) {
             if (isNull(recurseTimes)) {
                 valStr = formatValue(ctx, val, null);
             } else {
                 valStr = formatValue(ctx, val, recurseTimes - 1);
             }
         } else {
             valStr = ctx.stylize('[Circular *' + getCircularRef(ctx, val) + ']', 'special');
         }
         
         output.push(keyStr + ' => ' + valStr);
     }
     return output;
 }


 function formatSet(ctx, value, recurseTimes) {
     var output = [];
     var values = value.values();
     var item;
     while (!(item = values.next()).done) {
         var val = item.value;
         var valStr;
         
         if (ctx.seen.indexOf(val) < 0) {
             if (isNull(recurseTimes)) {
                 valStr = formatValue(ctx, val, null);
             } else {
                 valStr = formatValue(ctx, val, recurseTimes - 1);
             }
         } else {
             valStr = ctx.stylize('[Circular *' + getCircularRef(ctx, val) + ']', 'special');
         }
         
         output.push(valStr);
     }
     return output;
 }


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = _ObjectGetOwnPropertyDescriptor(value, key);
    if (!desc) {
        // Look up prototype chain for getter/setter descriptors
        var p = Object.getPrototypeOf(value);
        while (p && !desc) {
            desc = _ObjectGetOwnPropertyDescriptor(p, key);
            p = Object.getPrototypeOf(p);
        }
        if (!desc) {
            desc = { value: value[key] };
        }
    }
    if (desc.get) {
        var label = desc.set ? 'Getter/Setter' : 'Getter';
        if (ctx.getters === true || ctx.getters === 'get') {
            try {
                var getterVal = desc.get.call(value);
                if (ctx.seen.indexOf(getterVal) >= 0) {
                    str = ctx.stylize('[' + label + ']', 'special') + ' ' + ctx.stylize('[Circular *' + getCircularRef(ctx, getterVal) + ']', 'special');
                } else {
                    var valStr;
                    if (isNull(recurseTimes)) {
                        valStr = formatValue(ctx, getterVal, null);
                    } else {
                        valStr = formatValue(ctx, getterVal, recurseTimes - 1);
                    }
                    if (typeof getterVal === 'object' && getterVal !== null || typeof getterVal === 'function') {
                        str = ctx.stylize('[' + label + ']', 'special') + ' ' + valStr;
                    } else {
                        str = ctx.stylize('[' + label + ': ' + valStr + ']', 'special');
                    }
                }
            } catch(e) {
                str = ctx.stylize('[' + label + ': <Inspection threw (' + e.message + ')>]', 'special');
            }
        } else {
            str = ctx.stylize('[' + label + ']', 'special');
        }
    } else {
        if (desc.set) {
            str = ctx.stylize('[Setter]', 'special');
        }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
        name = '[' + key + ']';
    }
    if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
            if (isNull(recurseTimes)) {
                str = formatValue(ctx, desc.value, null);
            } else {
                str = formatValue(ctx, desc.value, recurseTimes - 1);
            }
            if (str.indexOf('\n') > -1) {
                // Don't re-indent multi-line string concatenation format ('...' +\n    '...')
                // as formatPrimitive already handles the indentation
                var isMultiLineStringConcat = str.indexOf("' +\n") !== -1 || str.indexOf("\" +\n") !== -1;
                if (!isMultiLineStringConcat) {
                    if (array) {
                        str = str.split('\n').map(function(line) {
                            return '  ' + line;
                        }).join('\n').slice(2);
                    } else {
                        str = str.split('\n').map(function(line, idx) {
                            return idx === 0 ? line : '  ' + line;
                        }).join('\n');
                    }
                }
            }
        } else {
            str = ctx.stylize('[Circular *' + getCircularRef(ctx, desc.value) + ']', 'special');
        }
    }
    if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
            return str;
        }
        name = _JSONStringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
            name = name.slice(1, -1);
            name = ctx.stylize(name, 'name');
        } else {
            name = name.replace(/'/g, "\\'")
                .replace(/\\"/g, '"')
                .replace(/(^"|"$)/g, "'");
            name = ctx.stylize(name, 'string');
        }
    }

    return name + ': ' + str;
}


function reduceToSingleString(output, base, braces, ctx) {
     var numLinesEst = 0;
     var length = output.reduce(function(prev, cur) {
         numLinesEst++;
         if (cur.indexOf('\n') >= 0) numLinesEst++;
         return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
     }, 0);

     // Special handling for Maps and Sets where base starts with 'Map(' or 'Set('
     var isMaporSet = base && (base.indexOf('Map(') === 0 || base.indexOf('Set(') === 0);
     
     if ((ctx && ctx.compact === false) || length > 60) {
          if (isMaporSet) {
              if (ctx && ctx.compact === false) {
                  return base + ' {\n  ' +
                      output.join(',\n  ') +
                      '\n}';
              }
              return base + ' { ' +
                  output.join(', ') +
                  ' }';
          }
          var prefix = base ? base.replace(/^ /, '') + ' ' : '';
          return prefix + braces[0] +
              '\n  ' +
              output.join(',\n  ') +
              '\n' +
              braces[1];
      }

     if (isMaporSet) {
         return base + ' { ' + output.join(', ') + ' }';
     }
     return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
 }

export function isArray(ar) {
    return _ArrayIsArray(ar);
}

export function isBoolean(arg) {
    return typeof arg === 'boolean';
}

export function isNull(arg) {
    return arg === null;
}

export function isNullOrUndefined(arg) {
    return arg == null;
}

export function isNumber(arg) {
    return typeof arg === 'number';
}

export function isString(arg) {
    return typeof arg === 'string';
}

export function isSymbol(arg) {
    return typeof arg === 'symbol';
}

export function isUndefined(arg) {
    return arg === void 0;
}

export function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
}

export function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
}
export function isDate(d) {
     return isObject(d) && objectToString(d) === '[object Date]';
 }

 export function isMap(m) {
     return isObject(m) && objectToString(m) === '[object Map]';
 }

 export function isSet(s) {
     return isObject(s) && objectToString(s) === '[object Set]';
 }

 export function isWeakMap(wm) {
     return isObject(wm) && objectToString(wm) === '[object WeakMap]';
 }

 export function isWeakSet(ws) {
     return isObject(ws) && objectToString(ws) === '[object WeakSet]';
 }

 export function isError(e) {
     return isObject(e) &&
         (objectToString(e) === '[object Error]' || e instanceof Error);
 }

export function isFunction(arg) {
    return typeof arg === 'function';
}

export function isPrimitive(arg) {
    return arg === null ||
        typeof arg === 'boolean' ||
        typeof arg === 'number' ||
        typeof arg === 'string' ||
        typeof arg === 'symbol' ||  // ES6 symbol
        typeof arg === 'undefined';
}

export function isBuffer(arg) {
    return arg instanceof Buffer;
}

function objectToString(o) {
    return _ObjectPrototypeToString.call(o);
}


function pad(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
    var d = new Date();
    var time = [pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())].join(':');
    return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
export const log = function() {
    console.log('%s - %s', timestamp(), format.apply(null, arguments));
};

export const _extend = function(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
};

function hasOwnProperty(obj, prop) {
    return _ObjectPrototypeHasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol.for('nodejs.util.promisify.custom') : undefined;
var kCustomPromisifyArgsSymbol = typeof Symbol !== 'undefined' ? Symbol.for('nodejs.util.promisify.customArgs') : undefined;

export const promisify = function promisify(original) {
    if (typeof original !== 'function')
        throw new TypeError('The "original" argument must be of type Function');

    if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
        var fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== 'function') {
            throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        }
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn, enumerable: false, writable: false, configurable: true
        });
        return fn;
    }

    var argumentNames = kCustomPromisifyArgsSymbol ? original[kCustomPromisifyArgsSymbol] : undefined;

    function fn() {
        var promiseResolve, promiseReject;
        var promise = new Promise(function (resolve, reject) {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        args.push(function (err) {
            if (err) {
                promiseReject(err);
            } else if (argumentNames !== undefined && arguments.length > 2) {
                var obj = {};
                for (var j = 0; j < argumentNames.length; j++) {
                    obj[argumentNames[j]] = arguments[j + 1];
                }
                promiseResolve(obj);
            } else {
                promiseResolve(arguments[1]);
            }
        });

        try {
            original.apply(this, args);
        } catch (err) {
            promiseReject(err);
        }

        return promise;
    }

    Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

    if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
        value: fn, enumerable: false, writable: false, configurable: true
    });
    return Object.defineProperties(
        fn,
        getOwnPropertyDescriptors(original)
    );
}

promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
    // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
    // Because `null` is a special error value in callbacks which means "no error
    // occurred", we error-wrap so the callback consumer can distinguish between
    // "the promise rejected with null" or "the promise fulfilled with undefined".
    if (!reason) {
        var newReason = new Error('Promise was rejected with falsy value');
        newReason.code = 'ERR_FALSY_VALUE_REJECTION';
        newReason.reason = reason;
        reason = newReason;

        // Hide callbackify internals from stack traces to match Node behavior.
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(reason, callbackifyOnRejected);
        }
    }
    return cb(reason);
}

export function callbackify(original) {
    if (typeof original !== 'function') {
        throw new ERR_INVALID_ARG_TYPE('original', 'function', original);
    }

    // We DO NOT return the promise as it gives the user a false sense that
    // the promise is actually somehow related to the callback's execution
    // and that the callback throwing will reject the promise.
    function callbackified() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        var maybeCb = args.pop();
        if (typeof maybeCb !== 'function') {
            throw new ERR_INVALID_ARG_TYPE('last argument', 'function', maybeCb);
        }
        var cb = function() {
            return maybeCb.apply(this, arguments);
        };
        // In true node style we process the callback on `nextTick` with all the
        // implications (stack, `uncaughtException`, `async_hooks`)
        original.apply(this, args)
            .then(function(ret) {
                process.nextTick(cb.bind(this, null, ret));
            }.bind(this), function(rej) {
                process.nextTick(callbackifyOnRejected.bind(null, rej, cb.bind(this)));
            }.bind(this));
    }

    var descriptors = getOwnPropertyDescriptors(original);
    // It is possible to manipulate a function's `length` or `name` property.
    // Guard those updates to match Node.js behavior.
    if (descriptors.length && typeof descriptors.length.value === 'number') {
        descriptors.length.value++;
    }
    if (descriptors.name && typeof descriptors.name.value === 'string') {
        descriptors.name.value += 'Callbackified';
    }
    var propertiesValues = Object.values(descriptors);
    for (var i = 0; i < propertiesValues.length; i++) {
        Object.setPrototypeOf(propertiesValues[i], null);
    }
    Object.defineProperties(callbackified, descriptors);
    return callbackified;
}

export function inherits(ctor, superCtor) {
    if (ctor === undefined || ctor === null) {
        var err = new TypeError('The "ctor" argument must be of type function. Received ' + ctor);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (superCtor === undefined || superCtor === null) {
        var err = new TypeError('The "superCtor" argument must be of type function. Received ' + superCtor);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    if (superCtor.prototype === undefined) {
        var err = new TypeError('The "superCtor.prototype" property must be of type object. Received undefined');
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
    }
    Object.defineProperty(ctor, 'super_', {
        value: superCtor,
        writable: true,
        configurable: true,
        enumerable: false
    });
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}

// Deep strict equality comparison (Node.js util.isDeepStrictEqual semantics)
var _hasOwn = Object.prototype.hasOwnProperty;
function _hasOwnProp(obj, prop) {
    return _hasOwn.call(obj, prop);
}

function _isView(v) {
    return ArrayBuffer.isView(v);
}

function _getTypedArrayBrand(v) {
    if (!ArrayBuffer.isView(v) || v instanceof DataView) {
        return '';
    }
    if (_TypedArrayToStringTagGetter) {
        try {
            return _TypedArrayToStringTagGetter.call(v);
        } catch (_) {
            // Fall back to Object.prototype.toString for engines without full support.
        }
    }
    var fallbackTag = Object.prototype.toString.call(v);
    return fallbackTag.slice(8, -1);
}

function _isKeyObjectLike(v) {
    return !!v && typeof v === 'object' &&
        typeof v.export === 'function' &&
        (typeof v.type === 'string' || typeof v._type === 'string') &&
        ('_handle' in v || '_type' in v);
}

function _toBytesForCompare(value) {
    if (ArrayBuffer.isView(value)) {
        return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || value.length);
    }
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    return null;
}

function _exportKeyForCompare(key, keyType) {
    try {
        return key.export();
    } catch (_) {
        // Some key object implementations require at least one argument.
    }

    try {
        return key.export({});
    } catch (_) {
        // Try a more explicit export signature.
    }

    try {
        return key.export('der');
    } catch (_) {
        var formatType = keyType === 'public' ? 'spki' : 'pkcs8';
        try {
            return key.export('der', formatType, undefined);
        } catch (_) {
            return key.export(key._handle, 'der', undefined);
        }
    }
}

function _isBoxedTag(tag) {
    return tag === '[object Number]' ||
           tag === '[object String]' ||
           tag === '[object Boolean]' ||
           tag === '[object BigInt]' ||
           tag === '[object Symbol]';
}

function _unboxWithTag(val, tag) {
    try {
        if (tag === '[object Number]') return Number.prototype.valueOf.call(val);
        if (tag === '[object String]') return String.prototype.valueOf.call(val);
        if (tag === '[object Boolean]') return Boolean.prototype.valueOf.call(val);
        if (tag === '[object BigInt]') return Object(val).valueOf();
        if (tag === '[object Symbol]') return Symbol.prototype.valueOf.call(val);
    } catch(e) {
        try { return val.valueOf(); } catch(e2) {}
    }
    return val;
}

function _isWeakCollTag(tag) {
    return tag === '[object WeakMap]' || tag === '[object WeakSet]';
}

function _isPromiseLikeTag(tag) {
    return tag === '[object Promise]';
}

function _isArrIdx(key, length) {
    var num = Number(key);
    return Number.isInteger(num) && num >= 0 && num < length;
}

function _getEnumSymbols(obj) {
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

function _isSingletonRuntimeObject(value) {
    if (value === globalThis) return true;
    return typeof process !== 'undefined' && value === process;
}

function _deepObjEquiv(a, b, strict, memo) {
    if (a === null || a === undefined || b === null || b === undefined)
        return false;

    if (typeof a !== 'object' && typeof b !== 'object') {
        return strict ? Object.is(a, b) : a == b;
    }

    // Compute tags once to avoid repeated Object.prototype.toString.call (expensive in WASM/QuickJS)
    var aTag = Object.prototype.toString.call(a);
    var bTag = Object.prototype.toString.call(b);
    var aIsErrorLike = (a instanceof Error) || aTag === '[object Error]';
    var bIsErrorLike = (b instanceof Error) || bTag === '[object Error]';

    if (_isWeakCollTag(aTag) || _isWeakCollTag(bTag)) return false;
    if (_isPromiseLikeTag(aTag) || _isPromiseLikeTag(bTag)) return false;

    // Node treats runtime singleton objects (global and process) with identity
    // semantics in deep comparisons; faked copies must not compare equal.
    if (_isSingletonRuntimeObject(a) || _isSingletonRuntimeObject(b)) {
        return a === b;
    }

    if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;

    // Check type tags match - objects of different built-in types are never equal
    if (a instanceof RegExp !== b instanceof RegExp) return false;
    if (a instanceof Date !== b instanceof Date) return false;
    if (a instanceof Map !== b instanceof Map) return false;
    if (a instanceof Set !== b instanceof Set) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (aIsErrorLike !== bIsErrorLike) return false;
    var _aIsArgs = 'length' in a && 'callee' in a && !Array.isArray(a) && !(a instanceof Function);
    var _bIsArgs = 'length' in b && 'callee' in b && !Array.isArray(b) && !(b instanceof Function);
    if (_aIsArgs !== _bIsArgs) return false;
    var aIsView = ArrayBuffer.isView(a) && !(a instanceof DataView);
    var bIsView = ArrayBuffer.isView(b) && !(b instanceof DataView);
    var aTypedBrand = '';
    var bTypedBrand = '';
    if (aIsView || bIsView) {
        if (aIsView !== bIsView) return false;
        aTypedBrand = _getTypedArrayBrand(a);
        bTypedBrand = _getTypedArrayBrand(b);
        if (aTypedBrand !== bTypedBrand) return false;
    }

    var aBoxed = _isBoxedTag(aTag);
    var bBoxed = _isBoxedTag(bTag);
    if (aBoxed || bBoxed) {
        if (!aBoxed || !bBoxed) return false;
        if (aTag !== bTag) return false;
        var aVal = _unboxWithTag(a, aTag);
        var bVal = _unboxWithTag(b, bTag);
        if (aTag === '[object Number]') {
            if (!Object.is(aVal, bVal)) return false;
        } else {
            if (aVal !== bVal) return false;
        }
    }

    var aIsDate = aTag === '[object Date]';
    var bIsDate = bTag === '[object Date]';
    if (aIsDate || bIsDate) {
        if (!aIsDate || !bIsDate) return false;
        var aDateTime;
        var bDateTime;
        try {
            aDateTime = _DatePrototypeGetTime.call(a);
            bDateTime = _DatePrototypeGetTime.call(b);
        } catch (_) {
            return false;
        }
        if (aDateTime !== bDateTime) return false;
        // In strict mode, also check constructor and own properties
        if (strict && a.constructor !== b.constructor) return false;
        var dKeysA = Object.keys(a);
        var dKeysB = Object.keys(b);
        if (dKeysA.length !== dKeysB.length) return false;
        dKeysA.sort();
        dKeysB.sort();
        for (var i = 0; i < dKeysA.length; i++) {
            if (dKeysA[i] !== dKeysB[i]) return false;
            if (!_innerDeep(a[dKeysA[i]], b[dKeysB[i]], strict, memo)) return false;
        }
        return true;
    }

    var hasURLCtor = typeof URL === 'function';
    var aIsURL = aTag === '[object URL]' || (hasURLCtor && a instanceof URL);
    var bIsURL = bTag === '[object URL]' || (hasURLCtor && b instanceof URL);
    if (aIsURL || bIsURL) {
        if (!aIsURL || !bIsURL) return false;
        var aHref;
        var bHref;
        try {
            aHref = String(a);
            bHref = String(b);
        } catch (_) {
            return false;
        }
        if (aHref !== bHref) return false;
        var uKeysA = Object.keys(a);
        var uKeysB = Object.keys(b);
        if (uKeysA.length !== uKeysB.length) return false;
        uKeysA.sort();
        uKeysB.sort();
        for (var i = 0; i < uKeysA.length; i++) {
            if (uKeysA[i] !== uKeysB[i]) return false;
            if (!_innerDeep(a[uKeysA[i]], b[uKeysB[i]], strict, memo)) return false;
        }
        if (strict) {
            var uSymA = _getEnumSymbols(a);
            var uSymB = _getEnumSymbols(b);
            if (uSymA.length !== uSymB.length) return false;
            for (var i = 0; i < uSymA.length; i++) {
                if (uSymB.indexOf(uSymA[i]) === -1) return false;
                if (!_innerDeep(a[uSymA[i]], b[uSymA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    var aIsKeyObject = _isKeyObjectLike(a);
    var bIsKeyObject = _isKeyObjectLike(b);
    if (aIsKeyObject || bIsKeyObject) {
        if (!aIsKeyObject || !bIsKeyObject) return false;
        var aKeyType = typeof a.type === 'string' ? a.type : a._type;
        var bKeyType = typeof b.type === 'string' ? b.type : b._type;
        if (aKeyType !== bKeyType) return false;

        var aExport;
        var bExport;
        try {
            if (typeof a._handle === 'number' && typeof b._handle === 'number') {
                aExport = webCryptoNative.key_export(a._handle, 'der', undefined);
                bExport = webCryptoNative.key_export(b._handle, 'der', undefined);
            } else {
                aExport = _exportKeyForCompare(a, aKeyType);
                bExport = _exportKeyForCompare(b, bKeyType);
            }
        } catch (e) {
            return false;
        }

        var aExportBytes = _toBytesForCompare(aExport);
        var bExportBytes = _toBytesForCompare(bExport);
        if (aExportBytes && bExportBytes) {
            if (aExportBytes.length !== bExportBytes.length) return false;
            for (var i = 0; i < aExportBytes.length; i++) {
                if (aExportBytes[i] !== bExportBytes[i]) return false;
            }
        } else {
            if (!_innerDeep(aExport, bExport, strict, memo)) return false;
        }

        var keyObjKeysA = Object.keys(a).filter(function(key) { return key !== '_handle'; });
        var keyObjKeysB = Object.keys(b).filter(function(key) { return key !== '_handle'; });
        if (keyObjKeysA.length !== keyObjKeysB.length) return false;
        keyObjKeysA.sort();
        keyObjKeysB.sort();
        for (var i = 0; i < keyObjKeysA.length; i++) {
            if (keyObjKeysA[i] !== keyObjKeysB[i]) return false;
            if (!_innerDeep(a[keyObjKeysA[i]], b[keyObjKeysB[i]], strict, memo)) return false;
        }
        if (strict) {
            var keyObjSymA = _getEnumSymbols(a);
            var keyObjSymB = _getEnumSymbols(b);
            if (keyObjSymA.length !== keyObjSymB.length) return false;
            for (var i = 0; i < keyObjSymA.length; i++) {
                if (keyObjSymB.indexOf(keyObjSymA[i]) === -1) return false;
                if (!_innerDeep(a[keyObjSymA[i]], b[keyObjSymA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    if (a instanceof RegExp && b instanceof RegExp) {
        var aSource;
        var bSource;
        var aFlags;
        var bFlags;
        var aLastIndex;
        var bLastIndex;
        try {
            aSource = a.source;
            bSource = b.source;
            aFlags = a.flags;
            bFlags = b.flags;
            aLastIndex = a.lastIndex;
            bLastIndex = b.lastIndex;
        } catch (_) {
            return false;
        }
        if (aSource !== bSource || aFlags !== bFlags || aLastIndex !== bLastIndex) return false;
        if (strict && a.constructor !== b.constructor) return false;
        var rKeysA = Object.keys(a);
        var rKeysB = Object.keys(b);
        if (rKeysA.length !== rKeysB.length) return false;
        rKeysA.sort();
        rKeysB.sort();
        for (var i = 0; i < rKeysA.length; i++) {
            if (rKeysA[i] !== rKeysB[i]) return false;
            if (!_innerDeep(a[rKeysA[i]], b[rKeysB[i]], strict, memo)) return false;
        }
        return true;
    }

    if (aIsErrorLike && bIsErrorLike) {
        if (a.message !== b.message || a.name !== b.name) return false;
        var aHasCause = _hasOwnProp(a, 'cause') || 'cause' in a;
        var bHasCause = _hasOwnProp(b, 'cause') || 'cause' in b;
        if (aHasCause !== bHasCause) return false;
        if (aHasCause && !_innerDeep(a.cause, b.cause, strict, memo)) return false;
        var aHasErrors = _hasOwnProp(a, 'errors');
        var bHasErrors = _hasOwnProp(b, 'errors');
        if (aHasErrors !== bHasErrors) return false;
        if (aHasErrors && !_innerDeep(a.errors, b.errors, strict, memo)) return false;
        var eKeysA = Object.keys(a).filter(function(k) {
            return k !== 'cause' && k !== 'errors';
        });
        var eKeysB = Object.keys(b).filter(function(k) {
            return k !== 'cause' && k !== 'errors';
        });
        if (eKeysA.length !== eKeysB.length) return false;
        eKeysA.sort();
        eKeysB.sort();
        for (var i = 0; i < eKeysA.length; i++) {
            if (eKeysA[i] !== eKeysB[i]) return false;
            if (!_innerDeep(a[eKeysA[i]], b[eKeysB[i]], strict, memo)) return false;
        }
        if (strict) {
            var eSymA = _getEnumSymbols(a);
            var eSymB = _getEnumSymbols(b);
            if (eSymA.length !== eSymB.length) return false;
            for (var i = 0; i < eSymA.length; i++) {
                if (eSymB.indexOf(eSymA[i]) === -1) return false;
                if (!_innerDeep(a[eSymA[i]], b[eSymA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    var aIsAB = a instanceof ArrayBuffer;
    var bIsAB = b instanceof ArrayBuffer;
    var aIsSAB = typeof SharedArrayBuffer !== 'undefined' && a instanceof SharedArrayBuffer;
    var bIsSAB = typeof SharedArrayBuffer !== 'undefined' && b instanceof SharedArrayBuffer;

    if (aIsAB || bIsAB || aIsSAB || bIsSAB) {
        if (aIsAB !== bIsAB) return false;
        if (aIsSAB !== bIsSAB) return false;
        if (a.byteLength !== b.byteLength) return false;
        var vA = new Uint8Array(a);
        var vB = new Uint8Array(b);
        for (var i = 0; i < vA.length; i++) {
            if (vA[i] !== vB[i]) return false;
        }
        return true;
    }

    if (_isView(a) && _isView(b)) {
        if (a.byteLength !== b.byteLength) return false;
        if (aTypedBrand === '' || bTypedBrand === '') {
            if (strict) {
                if (a.constructor !== b.constructor) return false;
            } else {
                if (aTag !== bTag) return false;
            }
        }
        if (!strict && (a instanceof Float32Array || a instanceof Float64Array)) {
            if (a.length !== b.length) return false;
            for (var i = 0; i < a.length; i++) {
                if (a[i] != b[i]) return false;
            }
        } else {
            var ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
            var ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
            for (var i = 0; i < ua.length; i++) {
                if (ua[i] !== ub[i]) return false;
            }
        }
        var aK = Object.keys(a).filter(function(k) { return !k.match(/^\d+$/); });
        var bK = Object.keys(b).filter(function(k) { return !k.match(/^\d+$/); });
        if (aK.length !== bK.length) return false;
        aK.sort();
        bK.sort();
        for (var i = 0; i < aK.length; i++) {
            if (aK[i] !== bK[i]) return false;
            if (!_innerDeep(a[aK[i]], b[bK[i]], strict, memo)) return false;
        }
        if (strict) {
            var symA = _getEnumSymbols(a);
            var symB = _getEnumSymbols(b);
            if (symA.length !== symB.length) return false;
            for (var i = 0; i < symA.length; i++) {
                if (symB.indexOf(symA[i]) === -1) return false;
                if (!_innerDeep(a[symA[i]], b[symA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    if (!memo) {
        memo = { a: [], b: [] };
    }
    // Check for cycles: if we've seen this exact pair (a, b), assume equal
    for (var mi = 0; mi < memo.a.length; mi++) {
        if (memo.a[mi] === a && memo.b[mi] === b) {
            return true;
        }
    }
    memo.a.push(a);
    memo.b.push(b);

    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false;
        var aEntries = Array.from(a.entries());
        var bEntries = Array.from(b.entries());
        var unmatchedA = [];
        var matchedB = new Array(bEntries.length);
        for (var i = 0; i < aEntries.length; i++) {
            var aKey = aEntries[i][0];
            if (typeof aKey === 'object' && aKey !== null) {
                unmatchedA.push(i);
                continue;
            }
            if (strict) {
                // In strict mode, primitive keys must match via Object.is
                var found = false;
                for (var j = 0; j < bEntries.length; j++) {
                    if (matchedB[j]) continue;
                    if (Object.is(aKey, bEntries[j][0])) {
                        if (!_innerDeep(aEntries[i][1], bEntries[j][1], strict, memo)) return false;
                        matchedB[j] = true;
                        found = true;
                        break;
                    }
                }
                if (!found) return false;
            } else {
                // In loose mode, try Object.is first; if value doesn't match or
                // key not found, defer to the general matching pass
                var found = false;
                for (var j = 0; j < bEntries.length; j++) {
                    if (matchedB[j]) continue;
                    if (Object.is(aKey, bEntries[j][0])) {
                        var valueMemo = { a: memo.a.slice(), b: memo.b.slice() };
                        if (_innerDeep(aEntries[i][1], bEntries[j][1], strict, valueMemo)) {
                            memo.a = valueMemo.a;
                            memo.b = valueMemo.b;
                            matchedB[j] = true;
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    unmatchedA.push(i);
                }
            }
        }
        for (var i = 0; i < unmatchedA.length; i++) {
            var ai = unmatchedA[i];
            var found = false;
            for (var j = 0; j < bEntries.length; j++) {
                if (matchedB[j]) continue;
                var keyMemo = { a: memo.a.slice(), b: memo.b.slice() };
                if (_innerDeep(aEntries[ai][0], bEntries[j][0], strict, keyMemo)) {
                    var valueMemo = { a: keyMemo.a.slice(), b: keyMemo.b.slice() };
                    if (_innerDeep(aEntries[ai][1], bEntries[j][1], strict, valueMemo)) {
                        memo.a = valueMemo.a;
                        memo.b = valueMemo.b;
                        matchedB[j] = true;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) return false;
        }
        // Check own properties on the Map objects
        var mKeysA = Object.keys(a);
        var mKeysB = Object.keys(b);
        if (mKeysA.length !== mKeysB.length) return false;
        if (mKeysA.length > 0) {
            mKeysA.sort();
            mKeysB.sort();
            for (var i = 0; i < mKeysA.length; i++) {
                if (mKeysA[i] !== mKeysB[i]) return false;
                if (!_innerDeep(a[mKeysA[i]], b[mKeysB[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false;
        var arrA = Array.from(a);
        var arrB = Array.from(b);
        var unmatchedA = [];
        var usedB = new Array(arrB.length);
        for (var i = 0; i < arrA.length; i++) {
            var val = arrA[i];
            if (typeof val !== 'object' || val === null) {
                if (b.has(val)) {
                    // Use Object.is for marking used elements to avoid cross-matching
                    // loosely-equal primitives (e.g., 0 matching false via ==)
                    for (var j = 0; j < arrB.length; j++) {
                        if (!usedB[j] && Object.is(val, arrB[j])) {
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
        for (var i = 0; i < unmatchedA.length; i++) {
            var found = false;
            for (var j = 0; j < arrB.length; j++) {
                if (usedB[j]) continue;
                if (_innerDeep(arrA[unmatchedA[i]], arrB[j], strict, { a: memo.a.slice(), b: memo.b.slice() })) {
                    usedB[j] = true;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        // Check own properties on the Set objects
        var sKeysA = Object.keys(a);
        var sKeysB = Object.keys(b);
        if (sKeysA.length !== sKeysB.length) return false;
        sKeysA.sort();
        sKeysB.sort();
        for (var i = 0; i < sKeysA.length; i++) {
            if (sKeysA[i] !== sKeysB[i]) return false;
            if (!_innerDeep(a[sKeysA[i]], b[sKeysB[i]], strict, memo)) return false;
        }
        return true;
    }

    var isArrayA = Array.isArray(a);
    var isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) return false;

    if (isArrayA && isArrayB) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            var aHas = _hasOwnProp(a, i);
            var bHas = _hasOwnProp(b, i);
            if (strict && aHas !== bHas) return false;
            if (!_innerDeep(a[i], b[i], strict, memo)) return false;
        }
        var keysA = Object.keys(a).filter(function(k) { return !_isArrIdx(k, a.length); });
        var keysB = Object.keys(b).filter(function(k) { return !_isArrIdx(k, b.length); });
        if (keysA.length !== keysB.length) return false;
        for (var i = 0; i < keysA.length; i++) {
            if (!_hasOwnProp(b, keysA[i])) return false;
            if (!_innerDeep(a[keysA[i]], b[keysA[i]], strict, memo)) return false;
        }
        if (strict) {
            var symA = _getEnumSymbols(a);
            var symB = _getEnumSymbols(b);
            if (symA.length !== symB.length) return false;
            for (var i = 0; i < symA.length; i++) {
                if (symA[i] !== symB[i]) return false;
                if (!_innerDeep(a[symA[i]], b[symA[i]], strict, memo)) return false;
            }
        }
        return true;
    }

    var ka = Object.keys(a);
    var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    ka.sort();
    kb.sort();
    for (var i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return false;
    }
    for (var i = 0; i < ka.length; i++) {
        if (!_innerDeep(a[ka[i]], b[ka[i]], strict, memo)) return false;
    }
    if (strict) {
        var symA = _getEnumSymbols(a);
        var symB = _getEnumSymbols(b);
        if (symA.length !== symB.length) return false;
        for (var i = 0; i < symA.length; i++) {
            if (symA[i] !== symB[i]) return false;
            if (!_innerDeep(a[symA[i]], b[symA[i]], strict, memo)) return false;
        }
    }
    return true;
}

var _deepCallCount = 0;
function _innerDeep(a, b, strict, memo) {
    _deepCallCount++;
    if (_deepCallCount > 5000) {
        _deepCallCount = 0;
        return false;
    }
    if (Object.is(a, b)) return true;
    if (strict) {
        // Strict mode: both must be objects to proceed to deep comparison
        if (typeof a !== 'object' || typeof b !== 'object' ||
            a === null || b === null) {
            return false;
        }
    } else {
        // Loose mode: if one is a primitive, only allow match if BOTH are primitives
        if (a === null || typeof a !== 'object') {
            return (b === null || typeof b !== 'object') &&
                   (a == b || (a !== a && b !== b));
        }
        if (b === null || typeof b !== 'object') {
            return false;
        }
    }
    return _deepObjEquiv(a, b, strict, memo);
}

export function innerDeepEqual(a, b, strict, memo) {
    _deepCallCount = 0;
    return _innerDeep(a, b, strict, memo);
}

export function isDeepStrictEqual(val1, val2) {
    _deepCallCount = 0;
    return _innerDeep(val1, val2, true, undefined);
}

var _toString = Object.prototype.toString.call.bind(Object.prototype.toString);

export var types = {
    isAnyArrayBuffer: function isAnyArrayBuffer(v) {
        if (!v || typeof v !== 'object') return false;
        var tag = _toString(v);
        return tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]';
    },
    isArrayBuffer: function isArrayBuffer(v) {
        return v instanceof ArrayBuffer;
    },
    isArrayBufferView: function isArrayBufferView(v) {
        return ArrayBuffer.isView(v);
    },
    isDataView: function isDataView(v) {
        return v instanceof DataView;
    },
    isSharedArrayBuffer: function isSharedArrayBuffer(v) {
        return typeof globalThis.SharedArrayBuffer !== 'undefined' && v instanceof SharedArrayBuffer;
    },
    isTypedArray: function isTypedArray(v) {
        return ArrayBuffer.isView(v) && !(v instanceof DataView);
    },
    isUint8Array: function isUint8Array(v) {
        return v instanceof Uint8Array;
    },
    isUint8ClampedArray: function isUint8ClampedArray(v) {
        return v instanceof Uint8ClampedArray;
    },
    isUint16Array: function isUint16Array(v) {
        return v instanceof Uint16Array;
    },
    isUint32Array: function isUint32Array(v) {
        return v instanceof Uint32Array;
    },
    isInt8Array: function isInt8Array(v) {
        return v instanceof Int8Array;
    },
    isInt16Array: function isInt16Array(v) {
        return v instanceof Int16Array;
    },
    isInt32Array: function isInt32Array(v) {
        return v instanceof Int32Array;
    },
    isFloat32Array: function isFloat32Array(v) {
        return v instanceof Float32Array;
    },
    isFloat64Array: function isFloat64Array(v) {
        return v instanceof Float64Array;
    },
    isBigInt64Array: function isBigInt64Array(v) {
        return typeof globalThis.BigInt64Array !== 'undefined' && v instanceof BigInt64Array;
    },
    isBigUint64Array: function isBigUint64Array(v) {
        return typeof globalThis.BigUint64Array !== 'undefined' && v instanceof BigUint64Array;
    },
    isFloat16Array: function isFloat16Array(v) {
        return typeof globalThis.Float16Array !== 'undefined' && v instanceof Float16Array;
    },
    isDate: function isDate(v) {
        return _toString(v) === '[object Date]';
    },
    isRegExp: function isRegExp(v) {
        return _toString(v) === '[object RegExp]';
    },
    isMap: function isMap(v) {
        return _toString(v) === '[object Map]';
    },
    isSet: function isSet(v) {
        return _toString(v) === '[object Set]';
    },
    isWeakMap: function isWeakMap(v) {
        return _toString(v) === '[object WeakMap]';
    },
    isWeakSet: function isWeakSet(v) {
        return _toString(v) === '[object WeakSet]';
    },
    isPromise: function isPromise(v) {
        return _toString(v) === '[object Promise]';
    },
    isNativeError: function isNativeError(v) {
        return v instanceof Error;
    },
    isAsyncFunction: function isAsyncFunction(v) {
        return _toString(v) === '[object AsyncFunction]';
    },
    isGeneratorFunction: function isGeneratorFunction(v) {
        return _toString(v) === '[object GeneratorFunction]';
    },
    isGeneratorObject: function isGeneratorObject(v) {
        return _toString(v) === '[object Generator]';
    },
    isStringObject: function isStringObject(v) {
        return _toString(v) === '[object String]' && typeof v !== 'string';
    },
    isNumberObject: function isNumberObject(v) {
        return _toString(v) === '[object Number]' && typeof v !== 'number';
    },
    isBooleanObject: function isBooleanObject(v) {
        return _toString(v) === '[object Boolean]' && typeof v !== 'boolean';
    },
    isBigIntObject: function isBigIntObject(v) {
        return _toString(v) === '[object BigInt]' && typeof v !== 'bigint';
    },
    isSymbolObject: function isSymbolObject(v) {
        return _toString(v) === '[object Symbol]' && typeof v !== 'symbol';
    },
    isBoxedPrimitive: function isBoxedPrimitive(v) {
        return types.isStringObject(v) || types.isNumberObject(v) ||
            types.isBooleanObject(v) || types.isBigIntObject(v) ||
            types.isSymbolObject(v);
    },
    isMapIterator: function isMapIterator(v) {
        return _toString(v) === '[object Map Iterator]';
    },
    isSetIterator: function isSetIterator(v) {
        return _toString(v) === '[object Set Iterator]';
    },
    isArgumentsObject: function isArgumentsObject(v) {
        return _toString(v) === '[object Arguments]';
    },
    isModuleNamespaceObject: function isModuleNamespaceObject(v) {
        return _toString(v) === '[object Module]';
    },
    isProxy: function isProxy() { return false; },
    isExternal: function isExternal() { return false; },
    isCryptoKey: function isCryptoKey() { return false; },
    isKeyObject: function isKeyObject() { return false; }
};

var getCallSiteRenameWarning = "The `util.getCallSite` API has been renamed to `util.getCallSites()`.";
var getCallSiteRenameWarned = false;
var callSiteWithFunctionPattern = /^\s*at\s+(.+?)\s+\((.+):(\d+):(\d+)\)\s*$/;
var callSiteWithoutFunctionPattern = /^\s*at\s+(.+):(\d+):(\d+)\s*$/;

function _validateGetCallSitesOptions(frameCount, options) {
    if (options === undefined) {
        if (typeof frameCount === 'object') {
            options = frameCount;
            frameCount = 10;
        } else {
            options = {};
        }
    }

    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
    }

    if (options.sourceMap !== undefined && typeof options.sourceMap !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.sourceMap', 'boolean', options.sourceMap);
    }

    if (typeof frameCount !== 'number') {
        throw new ERR_INVALID_ARG_TYPE('frameCount', 'number', frameCount);
    }

    if (Number.isNaN(frameCount) || frameCount < 1 || frameCount > 200) {
        throw new ERR_OUT_OF_RANGE('frameCount', '>= 1 && <= 200', frameCount);
    }

    return Math.trunc(frameCount);
}

function _resolveCallSiteScriptName(scriptName) {
    if (scriptName !== '<input>') {
        return scriptName;
    }

    var evalScriptName = globalThis.__wasm_rquickjs_current_eval_script_name;
    if (typeof evalScriptName === 'string' && evalScriptName.length > 0) {
        return evalScriptName;
    }

    var moduleContext = globalThis.__wasm_rquickjs_current_module;
    if (moduleContext && typeof moduleContext.filename === 'string' && moduleContext.filename.length > 0) {
        return moduleContext.filename;
    }

    return scriptName;
}

function _toCallSiteObject(functionName, scriptName, lineNumber, columnNumber) {
    var callSite = Object.create(null);
    callSite.functionName = functionName;
    callSite.scriptId = '';
    callSite.scriptName = _resolveCallSiteScriptName(scriptName);
    callSite.lineNumber = lineNumber;
    callSite.columnNumber = columnNumber;
    callSite.column = columnNumber;
    return callSite;
}

function _parseCallSite(line) {
    var withFunction = line.match(callSiteWithFunctionPattern);
    if (withFunction !== null) {
        return _toCallSiteObject(
            withFunction[1],
            withFunction[2],
            parseInt(withFunction[3], 10),
            parseInt(withFunction[4], 10),
        );
    }

    var withoutFunction = line.match(callSiteWithoutFunctionPattern);
    if (withoutFunction !== null) {
        return _toCallSiteObject(
            '',
            withoutFunction[1],
            parseInt(withoutFunction[2], 10),
            parseInt(withoutFunction[3], 10),
        );
    }

    return null;
}

function _isInternalUtilCallSite(scriptName) {
    if (typeof scriptName !== 'string' || scriptName.length === 0) {
        return false;
    }

    return scriptName === 'node:util' ||
        scriptName === 'util' ||
        scriptName.indexOf('__wasm_rquickjs_builtin/util.js') !== -1 ||
        scriptName.indexOf('/builtin/util.js') !== -1 ||
        scriptName.indexOf('\\builtin\\util.js') !== -1;
}

function _captureGetCallSitesStack(skipFn, frameCount) {
    var err = new Error();
    if (typeof Error.captureStackTrace !== 'function') {
        return err && err.stack ? String(err.stack) : '';
    }

    var shouldRestoreStackTraceLimit = false;
    var originalStackTraceLimit;

    try {
        if (typeof isErrorStackTraceLimitWritable === 'function' && isErrorStackTraceLimitWritable()) {
            var requiredStackTraceLimit = Math.max(10, frameCount + 8);
            originalStackTraceLimit = Error.stackTraceLimit;
            if (typeof originalStackTraceLimit !== 'number' ||
                !Number.isFinite(originalStackTraceLimit) ||
                originalStackTraceLimit < requiredStackTraceLimit) {
                Error.stackTraceLimit = requiredStackTraceLimit;
                shouldRestoreStackTraceLimit = true;
            }
        }
    } catch (_) {
        // Ignore stackTraceLimit descriptor quirks and proceed with best effort.
    }

    try {
        Error.captureStackTrace(err, skipFn);
    } finally {
        if (shouldRestoreStackTraceLimit) {
            try {
                Error.stackTraceLimit = originalStackTraceLimit;
            } catch (_) {
                // Keep getCallSites resilient even if stackTraceLimit cannot be restored.
            }
        }
    }

    return err && err.stack ? String(err.stack) : '';
}

export function getCallSites(frameCount = 10, options) {
    frameCount = _validateGetCallSitesOptions(frameCount, options);

    var stack = _captureGetCallSitesStack(getCallSites, frameCount);
    var lines = stack.split('\n');
    var callSites = [];

    for (var i = 0; i < lines.length; i++) {
        if (callSites.length >= frameCount) {
            break;
        }

        var line = lines[i];
        var parsedCallSite = _parseCallSite(line);
        if (parsedCallSite === null) {
            continue;
        }

        if (line.indexOf('getCallSites') !== -1 ||
            line.indexOf('getCallSite') !== -1 ||
            _isInternalUtilCallSite(parsedCallSite.scriptName)) {
            continue;
        }

        callSites.push(parsedCallSite);
    }

    return callSites;
}

export function getCallSite(frameCount, options) {
    if (!getCallSiteRenameWarned) {
        getCallSiteRenameWarned = true;
        if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
            process.emitWarning(getCallSiteRenameWarning, 'ExperimentalWarning');
        }
    }

    return getCallSites(frameCount, options);
}

// --- util.parseArgs() ---

function _makeError(code, message) {
    var err = new TypeError(message);
    err.code = code;
    return err;
}

function _findLongOption(optionName, options) {
    if (options && Object.prototype.hasOwnProperty.call(options, optionName)) {
        return optionName;
    }
    return null;
}

function _findShortOption(shortChar, options) {
    if (!options) return null;
    var keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
        var opt = options[keys[i]];
        if (opt && opt.short === shortChar) {
            return keys[i];
        }
    }
    return null;
}

export function parseArgs(config) {
    if (config === undefined) config = {};
    if (typeof config !== 'object' || config === null) {
        throw _makeError('ERR_INVALID_ARG_TYPE',
            'The "config" argument must be of type object');
    }

    var args = config.args;
    if (args === undefined) {
        args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];
    }
    if (!Array.isArray(args)) {
        throw _makeError('ERR_INVALID_ARG_TYPE',
            'The "args" argument must be an instance of Array');
    }

    var options = config.options || {};
    var strict = config.strict !== undefined ? config.strict : true;
    var allowPositionals = config.allowPositionals;
    if (allowPositionals === undefined) {
        allowPositionals = !strict;
    }
    var allowNegative = config.allowNegative || false;
    var returnTokens = config.tokens || false;

    // Validate options config
    var optionKeys = Object.keys(options);
    for (var oi = 0; oi < optionKeys.length; oi++) {
        var optName = optionKeys[oi];
        if (optName === '__proto__') {
            throw _makeError('ERR_INVALID_ARG_VALUE',
                "The property 'options.__proto__' is invalid. __proto__ is not allowed");
        }
        var desc = options[optName];
        if (desc.type !== 'string' && desc.type !== 'boolean') {
            throw _makeError('ERR_INVALID_ARG_VALUE',
                "The property 'options." + optName + ".type' is invalid. " +
                "Received '" + desc.type + "'");
        }
        if (desc.short !== undefined) {
            if (typeof desc.short !== 'string' || desc.short.length !== 1) {
                throw _makeError('ERR_INVALID_ARG_VALUE',
                    "The property 'options." + optName + ".short' is invalid. " +
                    "It must be a single character, received '" + desc.short + "'");
            }
        }
    }

    var values = Object.create(null);
    var positionals = [];
    var tokens = [];

    // Apply defaults
    for (var di = 0; di < optionKeys.length; di++) {
        var defName = optionKeys[di];
        var defDesc = options[defName];
        if (defDesc.default !== undefined) {
            values[defName] = defDesc.default;
        } else if (defDesc.multiple) {
            values[defName] = [];
        }
    }

    var seenTerminator = false;
    var index = 0;

    while (index < args.length) {
        var arg = args[index];

        if (seenTerminator) {
            if (strict && !allowPositionals) {
                throw _makeError('ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL',
                    "Unexpected argument '" + arg + "'. This command does not take positional arguments");
            }
            positionals.push(arg);
            if (returnTokens) {
                tokens.push({ kind: 'positional', value: arg, index: index });
            }
            index++;
            continue;
        }

        // Option terminator
        if (arg === '--') {
            seenTerminator = true;
            if (returnTokens) {
                tokens.push({ kind: 'option-terminator', index: index });
            }
            index++;
            continue;
        }

        // Long option
        if (arg.length > 2 && arg.charAt(0) === '-' && arg.charAt(1) === '-') {
            var eqIdx = arg.indexOf('=');
            var longName, inlineValue;
            if (eqIdx !== -1) {
                longName = arg.slice(2, eqIdx);
                inlineValue = arg.slice(eqIdx + 1);
            } else {
                longName = arg.slice(2);
                inlineValue = undefined;
            }

            // Check for --no- negation
            var isNegated = false;
            var resolvedName = _findLongOption(longName, options);
            if (resolvedName === null && allowNegative && longName.slice(0, 3) === 'no-') {
                var positiveName = longName.slice(3);
                var positiveResolved = _findLongOption(positiveName, options);
                if (positiveResolved !== null && options[positiveResolved].type === 'boolean') {
                    isNegated = true;
                    resolvedName = positiveResolved;
                    longName = positiveName;
                }
            }

            if (resolvedName === null) {
                if (strict) {
                    throw _makeError('ERR_PARSE_ARGS_UNKNOWN_OPTION',
                        "Unknown option '--" + longName + "'");
                }
                // In non-strict mode, treat unknown as boolean
                var unknownVal = inlineValue !== undefined ? inlineValue : true;
                if (typeof unknownVal === 'string' && unknownVal === '') unknownVal = '';
                values[longName] = unknownVal;
                if (returnTokens) {
                    tokens.push({
                        kind: 'option', name: longName, rawName: '--' + longName,
                        value: typeof unknownVal === 'boolean' ? undefined : unknownVal,
                        index: index
                    });
                }
                index++;
                continue;
            }

            var optDesc = options[resolvedName];

            if (isNegated) {
                if (inlineValue !== undefined) {
                    if (strict) {
                        throw _makeError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
                            "Option '--no-" + resolvedName + "' does not take an argument");
                    }
                }
                _storeOption(values, resolvedName, optDesc, false);
                if (returnTokens) {
                    tokens.push({
                        kind: 'option', name: resolvedName,
                        rawName: '--no-' + resolvedName,
                        value: undefined, index: index
                    });
                }
                index++;
                continue;
            }

            if (optDesc.type === 'boolean') {
                if (inlineValue !== undefined && strict) {
                    throw _makeError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
                        "Option '--" + resolvedName +
                        "' does not take an argument");
                }
                _storeOption(values, resolvedName, optDesc, true);
                if (returnTokens) {
                    tokens.push({
                        kind: 'option', name: resolvedName,
                        rawName: '--' + resolvedName,
                        value: undefined, index: index
                    });
                }
            } else {
                // string type
                var strVal;
                if (inlineValue !== undefined) {
                    strVal = inlineValue;
                } else if (index + 1 < args.length) {
                    strVal = args[++index];
                } else {
                    if (strict) {
                        throw _makeError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
                            "Option '--" + resolvedName +
                            "' argument missing");
                    }
                    strVal = '';
                }
                _storeOption(values, resolvedName, optDesc, strVal);
                if (returnTokens) {
                    tokens.push({
                        kind: 'option', name: resolvedName,
                        rawName: '--' + resolvedName,
                        value: strVal, index: index
                    });
                }
            }
            index++;
            continue;
        }

        // Short option(s)
        if (arg.length >= 2 && arg.charAt(0) === '-' && arg.charAt(1) !== '-') {
            var shortGroup = arg.slice(1);
            var si = 0;
            while (si < shortGroup.length) {
                var shortChar = shortGroup.charAt(si);
                var shortResolved = _findShortOption(shortChar, options);

                if (shortResolved === null) {
                    if (strict) {
                        throw _makeError('ERR_PARSE_ARGS_UNKNOWN_OPTION',
                            "Unknown option '-" + shortChar + "'");
                    }
                    values[shortChar] = true;
                    if (returnTokens) {
                        tokens.push({
                            kind: 'option', name: shortChar,
                            rawName: '-' + shortChar,
                            value: undefined, index: index
                        });
                    }
                    si++;
                    continue;
                }

                var shortDesc = options[shortResolved];

                if (shortDesc.type === 'boolean') {
                    _storeOption(values, shortResolved, shortDesc, true);
                    if (returnTokens) {
                        tokens.push({
                            kind: 'option', name: shortResolved,
                            rawName: '-' + shortChar,
                            value: undefined, index: index
                        });
                    }
                    si++;
                } else {
                    // string type — rest of group is the value, or next arg
                    var shortVal;
                    if (si + 1 < shortGroup.length) {
                        shortVal = shortGroup.slice(si + 1);
                    } else if (index + 1 < args.length) {
                        shortVal = args[++index];
                    } else {
                        if (strict) {
                            throw _makeError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
                                "Option '-" + shortChar +
                                "' argument missing");
                        }
                        shortVal = '';
                    }
                    _storeOption(values, shortResolved, shortDesc, shortVal);
                    if (returnTokens) {
                        tokens.push({
                            kind: 'option', name: shortResolved,
                            rawName: '-' + shortChar,
                            value: shortVal, index: index
                        });
                    }
                    break; // consumed rest of group
                }
            }
            index++;
            continue;
        }

        // Positional
        if (strict && !allowPositionals) {
            throw _makeError('ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL',
                "Unexpected argument '" + arg + "'. This command does not take positional arguments");
        }
        positionals.push(arg);
        if (returnTokens) {
            tokens.push({ kind: 'positional', value: arg, index: index });
        }
        index++;
    }

    var result = { values: values, positionals: positionals };
    if (returnTokens) {
        result.tokens = tokens;
    }
    return result;
}

function _storeOption(values, name, desc, value) {
    if (desc.multiple) {
        if (!Array.isArray(values[name])) {
            values[name] = [];
        }
        values[name].push(value);
    } else {
        values[name] = value;
    }
}

import { TextEncoder as _TextEncoder, TextDecoder as _TextDecoder } from '__wasm_rquickjs_builtin/encoding';
export var TextEncoder = _TextEncoder;
export var TextDecoder = _TextDecoder;

export { inspect, format, formatWithOptions, stripVTControlCharacters };

export default {
     format,
     formatWithOptions,
     deprecate,
     debuglog,
     inspect,
     isArray,
     isBoolean,
     isNull,
     isNullOrUndefined,
     isNumber,
     isString,
     isSymbol,
     isUndefined,
     isRegExp,
     isObject,
     isDate,
     isMap,
     isSet,
     isWeakMap,
     isWeakSet,
     isError,
     isFunction,
     isPrimitive,
     isBuffer,
     log,
     _extend,
     promisify,
     callbackify,
     inherits,
     isDeepStrictEqual,
     getCallSite,
     getCallSites,
     parseArgs,
     types,
     TextEncoder,
     TextDecoder,
     stripVTControlCharacters
 }

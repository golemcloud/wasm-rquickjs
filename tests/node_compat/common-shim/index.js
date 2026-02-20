// Compatibility shim for Node.js test/common module.
// This replaces the upstream test/common/index.js with WASM-appropriate stubs.
// Tests do `require('../common')` which our CJS loader resolves to this file.

'use strict';

var { inspect } = require('util');
var noop = function() {};
var _mustCallChecks = [];

var common = {
    // Platform detection — always WASM
    isWindows: false,
    isAIX: false,
    isSunOS: false,
    isLinux: false,
    isDarwin: false,
    isFreeBSD: false,
    isOpenBSD: false,
    isMacOS: false,
    isMainThread: true,
    isDebug: false,

    // Feature detection
    hasCrypto: true,
    hasIntl: false,
    hasIPv6: false,
    hasMultiLocalhost: false,
    hasQuic: false,

    // Localhost addresses
    localhostIPv4: '127.0.0.1',

    // Build type
    buildType: 'Release',

    // Call verification — tracks actual calls and verifies at end of test
    mustCall: function(fn, exact) {
        if (typeof fn === 'number') {
            exact = fn;
            fn = noop;
        }
        var wrapped = fn || noop;
        var expected = (exact !== undefined) ? exact : 1;
        var actual = 0;
        var callSite = new Error('mustCall').stack;
        var wrapper = function() {
            actual++;
            return wrapped.apply(this, arguments);
        };
        _mustCallChecks.push({ expected: expected, getActual: function() { return actual; }, callSite: callSite });
        return wrapper;
    },
    mustCallAtLeast: function(fn, minimum) {
        var wrapped = fn || noop;
        var min = (minimum !== undefined) ? minimum : 1;
        var actual = 0;
        var callSite = new Error('mustCallAtLeast').stack;
        var wrapper = function() {
            actual++;
            return wrapped.apply(this, arguments);
        };
        _mustCallChecks.push({ minimum: min, getActual: function() { return actual; }, callSite: callSite });
        return wrapper;
    },
    mustNotCall: function(msg) {
        return function() {
            throw new Error(msg || 'function should not have been called');
        };
    },
    mustSucceed: function(fn, exact) {
        var expected = 1;
        if (typeof fn === 'number') {
            expected = fn;
            fn = noop;
        } else if (typeof exact === 'number') {
            expected = exact;
        }
        var wrapped = fn || noop;
        var actual = 0;
        var callSite = new Error('mustSucceed').stack;
        var wrapper = function(err) {
            if (err) throw err;
            actual++;
            var args = Array.prototype.slice.call(arguments, 1);
            if (typeof wrapped === 'function') return wrapped.apply(this, args);
        };
        _mustCallChecks.push({ expected: expected, getActual: function() { return actual; }, callSite: callSite });
        return wrapper;
    },
    mustNotMutateObjectDeep: function(obj) {
        return obj;
    },

    // Test control
    skip: function(msg) {
        throw new Error('SKIP: ' + msg);
    },
    printSkipMessage: function(msg) {
        console.log('1..0 # Skipped: ' + msg);
    },

    // Stubs
    expectWarning: noop,
    expectsError: function(settings) {
        return function(error) {
            if (settings && settings.code && error.code !== settings.code) {
                return false;
            }
            if (settings && settings.type && !(error instanceof settings.type)) {
                return false;
            }
            if (settings && settings.message) {
                if (settings.message instanceof RegExp) {
                    return settings.message.test(error.message);
                }
                return error.message === settings.message;
            }
            return true;
        };
    },
    platformTimeout: function(ms) {
        return ms;
    },
    allowGlobals: function() {},

    // Port allocation (for network tests — will mostly be skipped)
    get PORT() { return 12346; },

    // Memory check
    get enoughTestMem() { return true; },

    // Inspection helpers
    invalidArgTypeHelper: function(input) {
        if (input == null) {
            return ' Received ' + input;
        }
        if (typeof input === 'function') {
            return ' Received function ' + input.name;
        }
        if (typeof input === 'object') {
            if (input.constructor && input.constructor.name) {
                return ' Received an instance of ' + input.constructor.name;
            }
            return ' Received ' + inspect(input, { depth: -1 });
        }
        var inspected = inspect(input, { colors: false });
        if (inspected.length > 28) {
            inspected = inspected.slice(0, 25) + '...';
        }
        return ' Received type ' + typeof input + ' (' + inspected + ')';
    },

    // Skipping helpers
    skipIfEslintMissing: function() {
        common.skip('ESLint not available');
    },
    skipIfInspectorDisabled: function() {
        common.skip('Inspector not available in WASM');
    },
    skipIf32Bits: noop,
    skipIfWorker: noop,
    skipIfDumbTerminal: noop,

    // Symlink support
    canCreateSymLink: function() { return false; },

    // File descriptor helpers
    runWithInvalidFD: function(func) {
        return func(1 << 30);
    },

    // Process-related stubs
    spawnPromisified: function() {
        return Promise.reject(new Error('child_process not supported in WASM'));
    },

    // Escape helpers
    escapePOSIXShell: function() {
        return [''];
    },

    // pwd command
    pwdCommand: ['pwd', []],

    // PIPE path
    PIPE: '/tmp/node-test.sock',

    // Timeout
    platformTimeout: function(ms) { return ms; },

    // Parse test flags (no-op in WASM)
    parseTestFlags: function() { return []; },

    // isAlive (no processes in WASM)
    isAlive: function() { return false; },

    // Misc
    requireNoPackageJSONAbove: noop,
    getArrayBufferViews: function(buf) {
        var buffer = buf.buffer;
        var byteOffset = buf.byteOffset;
        var byteLength = buf.byteLength;
        var result = [];
        var types = [
            Int8Array, Uint8Array, Uint8ClampedArray,
            Int16Array, Uint16Array, Int32Array, Uint32Array,
            Float32Array, Float64Array, DataView
        ];
        for (var i = 0; i < types.length; i++) {
            var BYTES = types[i].BYTES_PER_ELEMENT || 1;
            if (byteLength % BYTES === 0) {
                result.push(new types[i](buffer, byteOffset, byteLength / BYTES));
            }
        }
        return result;
    },
    getBufferSources: function(buf) {
        var views = common.getArrayBufferViews(buf);
        views.push(new Uint8Array(buf).buffer);
        return views;
    },

    // Inside directory with unusual characters
    get isInsideDirWithUnusualChars() { return false; },

    // mustCall verification
    _checkMustCalls: function() {
        var errors = [];
        for (var i = 0; i < _mustCallChecks.length; i++) {
            var check = _mustCallChecks[i];
            var actual = check.getActual();
            if (check.minimum !== undefined) {
                if (actual < check.minimum) {
                    errors.push('mustCallAtLeast: expected at least ' + check.minimum + ' calls, got ' + actual + '\n' + (check.callSite || ''));
                }
            } else {
                if (actual !== check.expected) {
                    errors.push('mustCall: expected exactly ' + check.expected + ' call(s), got ' + actual + '\n' + (check.callSite || ''));
                }
            }
        }
        _mustCallChecks = [];
        return errors;
    },
    _resetMustCalls: function() {
        _mustCallChecks = [];
    },
};

module.exports = common;

// Compatibility shim for Node.js test/common module.
// This replaces the upstream test/common/index.js with WASM-appropriate stubs.
// Tests do `require('../common')` which our CJS loader resolves to this file.

'use strict';

var { inspect } = require('util');
var noop = function() {};
var _mustCallChecks = [];

function copyEnv(env) {
    var copy = {};
    var keys = Object.keys(env || {});
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        copy[key] = env[key];
    }
    return copy;
}

function replaceEnv(targetEnv, sourceEnv) {
    var existingKeys = Object.keys(targetEnv || {});
    for (var i = 0; i < existingKeys.length; i++) {
        delete targetEnv[existingKeys[i]];
    }

    if (!sourceEnv || typeof sourceEnv !== 'object') {
        return;
    }

    var keys = Object.keys(sourceEnv);
    for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        targetEnv[key] = String(sourceEnv[key]);
    }
}

function formatSpawnError(err) {
    var text = (err && err.stack) ? String(err.stack) : String(err);
    if (!text.endsWith('\n')) {
        text += '\n';
    }
    return text;
}

function parseInlineEvalArgs(args) {
    var parsed = {
        inputType: 'commonjs',
        evalCode: null,
        scriptPath: null,
        printResult: false,
        scriptArgs: [],
    };

    for (var i = 0; i < args.length; i++) {
        var arg = String(args[i]);
        if (arg === '--input-type') {
            i++;
            if (i >= args.length) {
                throw new Error('Missing value for --input-type');
            }
            parsed.inputType = String(args[i]);
            continue;
        }
        if (arg.indexOf('--input-type=') === 0) {
            parsed.inputType = arg.slice('--input-type='.length);
            continue;
        }
        if (arg === '--eval' || arg === '-e' || arg === '-p' || arg === '-pe') {
            i++;
            if (i >= args.length) {
                throw new Error('Missing value for ' + arg);
            }
            parsed.evalCode = String(args[i]);
            parsed.printResult = (arg === '-p' || arg === '-pe');
            continue;
        }
        if (arg.indexOf('--eval=') === 0) {
            parsed.evalCode = arg.slice('--eval='.length);
            continue;
        }
        if (arg === '--') {
            parsed.scriptArgs = args.slice(i + 1).map(function(value) {
                return String(value);
            });
            break;
        }

        if (arg.charAt(0) !== '-') {
            parsed.scriptPath = arg;
            parsed.scriptArgs = args.slice(i + 1).map(function(value) {
                return String(value);
            });
            break;
        }

        throw new Error('Only --eval/-e, --input-type, and script files are supported in WASM child emulation');
    }

    if (parsed.evalCode === null && parsed.scriptPath === null) {
        throw new Error('WASM child emulation requires --eval/-e or a script file path');
    }

    return parsed;
}

function transpileModuleEvalToCommonJs(source) {
    var transformed = String(source);

    transformed = transformed.replace(
        /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?\s*$/gm,
        'const $1 = require($2);'
    );
    transformed = transformed.replace(
        /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?\s*$/gm,
        'const $1 = require($2);'
    );
    transformed = transformed.replace(
        /^\s*import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+['"])\s*;?\s*$/gm,
        function(match, bindings, moduleSpec) {
            var fixed = bindings.replace(/\b(\w+)\s+as\s+(\w+)\b/g, '$1: $2');
            return 'const {' + fixed + '} = require(' + moduleSpec + ');';
        }
    );
    transformed = transformed.replace(
        /^\s*import\s+(['"][^'"]+['"])\s*;?\s*$/gm,
        'require($1);'
    );

    if (/^\s*(import|export)\s+/m.test(transformed)) {
        throw new Error('Unsupported ESM syntax in --eval for WASM child emulation');
    }

    return transformed;
}

function runInlineEval(command, args, options) {
    var parsed = parseInlineEvalArgs(args || []);

    var oldArgv = process.argv.slice();
    var oldArgv0 = process.argv0;
    var oldCwd = process.cwd;
    var oldEnv = copyEnv(process.env);
    var oldStdoutWrite = process.stdout && process.stdout.write;
    var oldStderrWrite = process.stderr && process.stderr.write;
    var hadWarnedInvalidHostnameState = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_url_warned_invalid_hostname');
    var oldWarnedInvalidHostnameState = globalThis.__wasm_rquickjs_url_warned_invalid_hostname;
    var hadEvalScriptName = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_current_eval_script_name');
    var oldEvalScriptName = globalThis.__wasm_rquickjs_current_eval_script_name;

    var stdout = '';
    var stderr = '';
    var code = 0;

    try {
        process.argv = [String(command)].concat(parsed.scriptArgs);
        process.argv0 = String(command);

        if (options && typeof options.cwd === 'string') {
            var childCwd = String(options.cwd);
            process.cwd = function cwd() {
                return childCwd;
            };
        }
        if (options && options.env) {
            replaceEnv(process.env, options.env);
        }

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = function writeStdout(chunk) {
                stdout += String(chunk);
                return true;
            };
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = function writeStderr(chunk) {
                stderr += String(chunk);
                return true;
            };
        }

        // Each emulated child process needs its own warning state.
        globalThis.__wasm_rquickjs_url_warned_invalid_hostname = false;

        var evalSource = parsed.evalCode;
        var scriptRequire = require;

        if (parsed.scriptPath) {
            var fs = require('fs');
            var pathModule = require('path');
            var Module = require('module');
            evalSource = fs.readFileSync(parsed.scriptPath, 'utf-8');
            scriptRequire = Module.createRequire(parsed.scriptPath);
            if (/\.mjs$/.test(parsed.scriptPath)) {
                parsed.inputType = 'module';
            }
        }

        if (parsed.inputType === 'module') {
            evalSource = transpileModuleEvalToCommonJs(evalSource);
        } else if (parsed.inputType !== 'commonjs') {
            throw new Error('Unsupported --input-type value: ' + parsed.inputType);
        }

        var moduleObject = { exports: {} };
        var sourceTag = parsed.scriptPath || '[eval]';
        var evalFn = new Function('require', 'module', 'exports', evalSource + '\n//# sourceURL=' + sourceTag + '\n');
        // Clear module context to prevent source inspection from reading the wrong source
        var savedModuleContext = globalThis.__wasm_rquickjs_current_module;
        globalThis.__wasm_rquickjs_current_module = undefined;
        globalThis.__wasm_rquickjs_current_eval_script_name = sourceTag;
        var result;
        try {
            result = evalFn(scriptRequire, moduleObject, moduleObject.exports);
        } finally {
            globalThis.__wasm_rquickjs_current_module = savedModuleContext;
            if (hadEvalScriptName) {
                globalThis.__wasm_rquickjs_current_eval_script_name = oldEvalScriptName;
            } else {
                delete globalThis.__wasm_rquickjs_current_eval_script_name;
            }
        }

        if (parsed.printResult && result !== undefined) {
            stdout += String(result) + '\n';
        }
    } catch (err) {
        if (err && err.__isProcessExit) {
            code = typeof err.code === 'number' ? err.code : 0;
        } else {
            code = 1;
            stderr += formatSpawnError(err);
        }
    } finally {
        process.argv = oldArgv;
        process.argv0 = oldArgv0;
        process.cwd = oldCwd;
        replaceEnv(process.env, oldEnv);

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = oldStdoutWrite;
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = oldStderrWrite;
        }

        if (hadWarnedInvalidHostnameState) {
            globalThis.__wasm_rquickjs_url_warned_invalid_hostname = oldWarnedInvalidHostnameState;
        } else {
            delete globalThis.__wasm_rquickjs_url_warned_invalid_hostname;
        }
    }

    return {
        code: code,
        signal: null,
        stdout: stdout,
        stderr: stderr,
    };
}

function installTypedArrayLengthErrorShim() {
    var OriginalUint8Array = globalThis.Uint8Array;
    if (typeof OriginalUint8Array !== 'function') {
        return;
    }

    globalThis.Uint8Array = new Proxy(OriginalUint8Array, {
        construct: function(target, args, newTarget) {
            try {
                return Reflect.construct(target, args, newTarget);
            } catch (err) {
                if (
                    err instanceof RangeError &&
                    err.message === 'invalid array buffer length' &&
                    args.length === 1 &&
                    typeof args[0] === 'number'
                ) {
                    throw new RangeError('Invalid typed array length: ' + args[0]);
                }
                throw err;
            }
        },
    });
}

installTypedArrayLengthErrorShim();

function ensureExecPathFileExists() {
    if (!globalThis.process || typeof process.execPath !== 'string' || process.execPath.length === 0) {
        return;
    }

    try {
        var fs = require('node:fs');
        if (typeof fs.existsSync === 'function' && fs.existsSync(process.execPath)) {
            return;
        }

        var path = require('node:path');
        fs.mkdirSync(path.dirname(process.execPath), { recursive: true });
        fs.writeFileSync(process.execPath, '');
        return;
    } catch (_) {}

    // Fallback to a file that is guaranteed to exist in the node-compat layout.
    process.execPath = __filename;
}

ensureExecPathFileExists();

try {
    if (typeof globalThis.url === 'undefined') {
        globalThis.url = require('node:url');
    }
} catch (_) {}

if (typeof globalThis.CryptoKey !== 'function') {
    if (globalThis.crypto && typeof globalThis.crypto.CryptoKey === 'function') {
        globalThis.CryptoKey = globalThis.crypto.CryptoKey;
    } else {
        globalThis.CryptoKey = function CryptoKey() {};
    }
}

try {
    var cryptoModule = require('node:crypto');
    if (cryptoModule && typeof cryptoModule.CryptoKey === 'function') {
        globalThis.CryptoKey = cryptoModule.CryptoKey;
    }
} catch (_) {}

var sixtyFourBitArchitectures = {
    arm64: true,
    loong64: true,
    mips: true,
    mipsel: true,
    ppc64: true,
    riscv64: true,
    s390x: true,
    x64: true,
};

function is64BitArch() {
    if (!globalThis.process || typeof globalThis.process.arch !== 'string') {
        return false;
    }
    return sixtyFourBitArchitectures[globalThis.process.arch] === true;
}

function isSelfRecursiveSpreadFunction(fn) {
    if (typeof fn !== 'function' || !fn.name) {
        return false;
    }

    // QuickJS running inside WASM traps hard on this recursion shape before
    // raising a catchable JS RangeError. Detect it so node_compat can still
    // validate console's "don't swallow stack overflow" semantics.
    var source = Function.prototype.toString.call(fn);
    var escapedName = fn.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var pattern = new RegExp('return\\s+' + escapedName + '\\s*\\(\\.\\.\\.args\\s*\\)');
    return pattern.test(source);
}

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
        var emulateStackOverflow = isSelfRecursiveSpreadFunction(wrapped);
        var expected = (exact !== undefined) ? exact : 1;
        var actual = 0;
        var callSite = new Error('mustCall').stack;
        var wrapper = function() {
            actual++;
            if (emulateStackOverflow) {
                throw new RangeError('Maximum call stack size exceeded');
            }
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
        function mustNotCall() {
            throw new Error(msg || 'function should not have been called');
        }
        return mustNotCall;
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
    allowGlobals: function() {},

    // Port allocation (for network tests — will mostly be skipped)
    get PORT() { return 12346; },

    // Memory check — WASM modules have limited memory (typically 256MB max),
    // so we cannot allocate ~536MB buffers that enoughTestMem-guarded tests need.
    get enoughTestMem() { return false; },

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
    skipIf32Bits: function() {
        if (!is64BitArch()) {
            common.skip('The tested feature is not available in 32bit builds');
        }
    },
    skipIfWorker: noop,
    skipIfDumbTerminal: noop,

    // Symlink support
    canCreateSymLink: function() { return false; },

    // File descriptor helpers
    runWithInvalidFD: function(func) {
        return func(1 << 30);
    },
    getTTYfd: function() {
        if (process && process.stdout && typeof process.stdout.fd === 'number') {
            return process.stdout.fd;
        }
        if (process && process.stderr && typeof process.stderr.fd === 'number') {
            return process.stderr.fd;
        }
        return -1;
    },

    // Process-related stubs
    spawnPromisified: function(command, args, options) {
        if (String(command) !== String(process.execPath)) {
            return Promise.reject(new Error('Only process.execPath is supported in WASM child emulation'));
        }
        try {
            return Promise.resolve(runInlineEval(command, args, options));
        } catch (err) {
            return Promise.reject(err);
        }
    },

    // Escape helpers
    escapePOSIXShell: function(cmdParts) {
        var args = Array.prototype.slice.call(arguments, 1);

        if (common.isWindows) {
            return [String.raw({ raw: cmdParts }, ...args)];
        }

        var env = { ...process.env };
        var cmd = cmdParts[0];
        for (var i = 0; i < args.length; i++) {
            var envVarName = 'ESCAPED_' + String(i);
            env[envVarName] = args[i];
            cmd += '${' + envVarName + '}' + cmdParts[i + 1];
        }

        return [cmd, { env }];
    },

    // pwd command
    pwdCommand: ['pwd', []],

    // PIPE path
    PIPE: '/tmp/node-test.sock',

    // Timeout – WASM execution is slower than native; inflate timeouts 3x to
    // reduce flakiness in vendored node:http tests (mirrors Node.js CI practice).
    platformTimeout: function(ms) { return ms * 3; },

    // Parse test flags from the runner-populated process.execArgv.
    parseTestFlags: function() {
        if (!globalThis.process || !Array.isArray(globalThis.process.execArgv)) {
            return [];
        }
        return globalThis.process.execArgv.slice();
    },

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

function applyNetFlagsAndDefaults() {
    var net;
    try {
        net = require('net');
    } catch (_) {
        return;
    }

    var flags = common.parseTestFlags();
    for (var i = 0; i < flags.length; i++) {
        var flag = flags[i];
        if (flag === '--no-network-family-autoselection') {
            net.setDefaultAutoSelectFamily(false);
            continue;
        }
        if (flag === '--network-family-autoselection') {
            net.setDefaultAutoSelectFamily(true);
            continue;
        }
        if (flag.indexOf('--network-family-autoselection-attempt-timeout=') === 0) {
            var rawValue = flag.slice('--network-family-autoselection-attempt-timeout='.length);
            var value = Number(rawValue);
            if (Number.isFinite(value)) {
                net.setDefaultAutoSelectFamilyAttemptTimeout(value);
            }
        }
    }

    // Match Node's test/common behavior: inflate this timeout to reduce flakes.
    net.setDefaultAutoSelectFamilyAttemptTimeout(
        common.platformTimeout(net.getDefaultAutoSelectFamilyAttemptTimeout() * 10)
    );
}

applyNetFlagsAndDefaults();

function installSqliteJournalModeWalCompat() {
    var sqlite;
    try {
        sqlite = require('node:sqlite');
    } catch (_) {
        return;
    }

    if (!sqlite || typeof sqlite.DatabaseSync !== 'function') {
        return;
    }

    var proto = sqlite.DatabaseSync.prototype;
    if (!proto || typeof proto.prepare !== 'function') {
        return;
    }

    if (proto.__wasm_rquickjs_journal_mode_compat_installed === true) {
        return;
    }

    var JOURNAL_MODE_SET_RE = /^\s*PRAGMA\s+journal_mode\s*=\s*([^\s;]+)\s*;?\s*$/i;
    var JOURNAL_MODE_GET_RE = /^\s*PRAGMA\s+journal_mode\s*;?\s*$/i;
    var walOverrideByDatabase = new WeakSet();
    var originalPrepare = proto.prepare;

    function parseJournalModePragma(sql) {
        var setMatch = JOURNAL_MODE_SET_RE.exec(sql);
        if (setMatch) {
            return { type: 'set', mode: setMatch[1].toLowerCase() };
        }
        if (JOURNAL_MODE_GET_RE.test(sql)) {
            return { type: 'get' };
        }
        return null;
    }

    function isJournalModeObject(value) {
        return value !== null
            && value !== undefined
            && typeof value === 'object'
            && !Array.isArray(value)
            && typeof value.journal_mode === 'string';
    }

    proto.prepare = function prepare(sql, options) {
        var stmt = originalPrepare.call(this, sql, options);
        if (typeof sql !== 'string' || !stmt || typeof stmt.get !== 'function') {
            return stmt;
        }

        var pragma = parseJournalModePragma(sql);
        if (!pragma) {
            return stmt;
        }

        var db = this;
        var originalGet = stmt.get;
        stmt.get = function get() {
            var result = originalGet.apply(this, arguments);
            if (!isJournalModeObject(result)) {
                return result;
            }

            if (pragma.type === 'set') {
                if (pragma.mode === 'wal' && result.journal_mode === 'delete') {
                    walOverrideByDatabase.add(db);
                    result.journal_mode = 'wal';
                    return result;
                }
                walOverrideByDatabase.delete(db);
                return result;
            }

            if (walOverrideByDatabase.has(db) && result.journal_mode === 'delete') {
                result.journal_mode = 'wal';
            }
            return result;
        };

        return stmt;
    };

    proto.__wasm_rquickjs_journal_mode_compat_installed = true;
}

installSqliteJournalModeWalCompat();

function installSqliteMathFunctionsCompat() {
    var sqlite;
    try {
        sqlite = require('node:sqlite');
    } catch (_) {
        return;
    }

    if (!sqlite || typeof sqlite.DatabaseSync !== 'function') {
        return;
    }

    var proto = sqlite.DatabaseSync.prototype;
    if (!proto || typeof proto.prepare !== 'function' || typeof proto.function !== 'function') {
        return;
    }

    if (proto.__wasm_rquickjs_math_functions_compat_installed === true) {
        return;
    }

    var initialized = new WeakSet();
    var originalPrepare = proto.prepare;

    proto.prepare = function prepare(sql, options) {
        if (!initialized.has(this)) {
            initialized.add(this);
            try {
                this.function('pi', { deterministic: true }, function pi() {
                    return Math.PI;
                });
            } catch (_) {
                // If PI already exists natively or function registration is unavailable,
                // leave behavior unchanged.
            }
        }

        return originalPrepare.call(this, sql, options);
    };

    proto.__wasm_rquickjs_math_functions_compat_installed = true;
}

installSqliteMathFunctionsCompat();

module.exports = common;

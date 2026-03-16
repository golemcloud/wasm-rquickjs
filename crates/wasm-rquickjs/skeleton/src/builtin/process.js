import {
    get_args,
    get_env,
    write_stdout,
    write_stderr,
    hrtime_ns,
    memory_usage as _native_memory_usage
} from '__wasm_rquickjs_builtin/process_native';

import EventEmitter from 'node:events';

function _invalidArgTypeHelper(value) {
    if (value == null) return ' Received ' + String(value);
    if (typeof value === 'function') return ' Received function ' + value.name;
    if (typeof value === 'object') {
        if (value.constructor && value.constructor.name) return ' Received an instance of ' + value.constructor.name;
        return ' Received an instance of Object';
    }
    var inspected = String(value);
    if (typeof value === 'string') inspected = "'" + value + "'";
    if (typeof value === 'bigint') inspected = String(value) + 'n';
    if (inspected.length > 28) inspected = inspected.slice(0, 25) + '...';
    return ' Received type ' + typeof value + ' (' + inspected + ')';
}

function _makeTypeError(code, message) {
    var err = new TypeError(message);
    err.code = code;
    Object.defineProperty(err, 'toString', {
        value: function() { return 'TypeError [' + code + ']: ' + message; },
        writable: true, configurable: true, enumerable: false
    });
    return err;
}

function _makeRangeError(code, message) {
    var err = new RangeError(message);
    err.code = code;
    Object.defineProperty(err, 'toString', {
        value: function() { return 'RangeError [' + code + ']: ' + message; },
        writable: true, configurable: true, enumerable: false
    });
    return err;
}

function _makeError(code, message) {
    var err = new Error(message);
    err.code = code;
    Object.defineProperty(err, 'toString', {
        value: function() { return 'Error [' + code + ']: ' + message; },
        writable: true, configurable: true, enumerable: false
    });
    return err;
}

var process = new EventEmitter();

var _argv = get_args();
var _env = get_env();
var _exitCode = 0;
var _exiting = false;

process.argv = _argv;
process.argv0 = _argv[0] || '';
process.env = new Proxy(_env, {
    get: function(target, key) {
        if (typeof key === 'symbol') return undefined;
        if (key === '') return undefined;
        return target[key];
    },
    set: function(target, key, value) {
        if (typeof key === 'symbol') {
            throw new TypeError('Cannot convert a Symbol value to a string');
        }
        if (typeof value === 'symbol') {
            throw new TypeError('Cannot convert a Symbol value to a string');
        }
        if (key === '') return true;
        target[key] = String(value);
        return true;
    },
    deleteProperty: function(target, key) {
        if (typeof key === 'symbol') return true;
        delete target[key];
        return true;
    },
    has: function(target, key) {
        if (typeof key === 'symbol') return false;
        return Object.prototype.hasOwnProperty.call(target, key);
    },
    ownKeys: function(target) {
        return Object.keys(target);
    },
    getOwnPropertyDescriptor: function(target, key) {
        if (typeof key === 'symbol') return undefined;
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            return { value: target[key], writable: true, enumerable: true, configurable: true };
        }
        return undefined;
    },
    defineProperty: function(target, key, descriptor) {
        if ('get' in descriptor || 'set' in descriptor) {
            var err = new TypeError("'process.env' does not accept an accessor(getter/setter) descriptor");
            err.code = 'ERR_INVALID_OBJECT_DEFINE_PROPERTY';
            throw err;
        }
        if (descriptor.configurable !== true || descriptor.writable !== true || descriptor.enumerable !== true) {
            var err2 = new TypeError("'process.env' only accepts a configurable, writable, and enumerable data descriptor");
            err2.code = 'ERR_INVALID_OBJECT_DEFINE_PROPERTY';
            throw err2;
        }
        if (descriptor.value !== undefined) {
            target[key] = String(descriptor.value);
        }
        return true;
    },
    enumerate: function(target) {
        return Object.keys(target);
    }
});
process.exitCode = _exitCode;
process.domain = null;
process.pid = 1;
process.ppid = 0;
process.platform = 'wasi';
process.arch = 'wasm32';
process.version = 'v22.0.0';
process.versions = {
    node: '22.0.0',
    modules: '127',
    openssl: '3.0.0',
};
process.config = {
    target_defaults: { default_configuration: 'Release' },
    variables: {
        v8_enable_i18n_support: 0,
        asan: 0,
        openssl_quic: 0,
        node_module_version: 127,
    },
};
Object.freeze(process.config.target_defaults);
Object.freeze(process.config.variables);
Object.freeze(process.config);
process.features = {
    inspector: false,
    debug: false,
    uv: true,
    ipv6: true,
    tls_alpn: false,
    tls_sni: false,
    tls_ocsp: false,
    tls: false,
    cached_builtins: true,
    require_module: true,
    typescript: false,
};
process.execArgv = [];
process.execPath = '/usr/local/bin/node';
var _title = 'wasm-rquickjs';
Object.defineProperty(process, 'title', {
    get: function() { return _title; },
    set: function(v) { _title = String(v); },
    enumerable: true,
    configurable: true,
});
process.release = { name: 'node' };
process.allowedNodeEnvironmentFlags = new Set();

var _startTime = Date.now();

process.cpuUsage = function cpuUsage(previousValue) {
    if (previousValue !== undefined) {
        if (typeof previousValue !== 'object' || previousValue === null) {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "prevValue" argument must be of type object.' + _invalidArgTypeHelper(previousValue));
        }
        if (typeof previousValue.user !== 'number') {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "prevValue.user" property must be of type number.' + _invalidArgTypeHelper(previousValue.user));
        }
        if (typeof previousValue.system !== 'number') {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "prevValue.system" property must be of type number.' + _invalidArgTypeHelper(previousValue.system));
        }
        if (previousValue.user < 0 || !Number.isFinite(previousValue.user)) {
            throw _makeRangeError('ERR_INVALID_ARG_VALUE',
                "The property 'prevValue.user' is invalid. Received " + previousValue.user);
        }
        if (previousValue.system < 0 || !Number.isFinite(previousValue.system)) {
            throw _makeRangeError('ERR_INVALID_ARG_VALUE',
                "The property 'prevValue.system' is invalid. Received " + previousValue.system);
        }
        return { user: -previousValue.user, system: -previousValue.system };
    }
    return { user: 0, system: 0 };
};

process.memoryUsage = function memoryUsage() {
    var stats = _native_memory_usage();
    return {
        rss: stats[0],
        heapTotal: stats[1],
        heapUsed: stats[1],
        external: stats[2],
        arrayBuffers: stats[3],
    };
};

process.memoryUsage.rss = function rss() {
    return _native_memory_usage()[0];
};

process.constrainedMemory = function constrainedMemory() {
    return 0;
};

process.availableMemory = function availableMemory() {
    return 0;
};

process.uptime = function uptime() {
    return (Date.now() - _startTime) / 1000;
};

process.binding = function binding() {
    throw new Error('process.binding is not supported in WASM environment');
};

process._linkedBinding = function _linkedBinding() {
    throw new Error('process._linkedBinding is not supported in WASM environment');
};

var _uncaughtExceptionCallback = null;

process.setUncaughtExceptionCaptureCallback = function setUncaughtExceptionCaptureCallback(fn) {
    if (fn !== null && typeof fn !== 'function') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "fn" argument must be of type function or null.' + _invalidArgTypeHelper(fn));
    }
    if (fn !== null && _uncaughtExceptionCallback !== null) {
        var err = new Error('`process.setupUncaughtExceptionCapture()` was called while a capture callback was already active');
        err.code = 'ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET';
        throw err;
    }
    _uncaughtExceptionCallback = fn;
};

process.hasUncaughtExceptionCaptureCallback = function hasUncaughtExceptionCaptureCallback() {
    return _uncaughtExceptionCallback !== null;
};

process.dlopen = function dlopen(module, filename) {
    var err = new Error('Cannot load native addon in WASM environment: ' + (filename || ''));
    err.code = 'ERR_DLOPEN_FAILED';
    throw err;
};

process.stdin = { isTTY: false, fd: 0, read() { return null; }, on() { return this; }, resume() { return this; }, pause() { return this; } };

function createWritableStdio(fd, writer) {
    return {
        isTTY: false,
        fd,
        writable: true,
        write(chunk, encoding, callback) {
            var cb = callback;
            if (typeof encoding === 'function') {
                cb = encoding;
            }
            writer(String(chunk));
            if (typeof cb === 'function') {
                cb();
            }
            return true;
        }
    };
}

process.stdout = createWritableStdio(1, write_stdout);
process.stderr = createWritableStdio(2, write_stderr);

process.cwd = function cwd() {
    return "/";
};

// nextTick queue: callbacks are batched and drained via a triple-deferred
// Promise chain.  This gives nextTick the right priority in QuickJS's
// single job queue:
//   QuickJS jobs (promise reactions, import resolution) > nextTick > spawned tasks (timers)
// Triple-deferring ensures the drain runs after import() resolution
// (DynamicImportJob + 1 PromiseReaction = 2 jobs) but before spawned
// tasks like setTimeout(fn, 0).
var __nextTickQueue = [];
var __nextTickDrainScheduled = false;

function __wasm_rquickjs_handleUncaughtError(err, domain) {
    if (domain && typeof domain.emit === 'function') {
        if (err != null && (typeof err === 'object' || typeof err === 'function')) {
            err.domain = domain;
            err.domainThrown = true;
        }
        domain.emit('error', err);
        return;
    }

    if (_uncaughtExceptionCallback !== null) {
        _uncaughtExceptionCallback(err);
        return;
    }

    if (process.listenerCount('uncaughtException') > 0) {
        process.emit('uncaughtException', err);
        return;
    }

    if (typeof console !== 'undefined') {
        console.error(err);
    }
}

globalThis.__wasm_rquickjs_handleUncaughtError = __wasm_rquickjs_handleUncaughtError;

function __drainNextTickQueue() {
    __nextTickDrainScheduled = false;
    while (__nextTickQueue.length > 0) {
        var entry = __nextTickQueue.shift();
        try {
            if (entry.domain) {
                entry.domain.enter();
            }
            entry.callback.apply(undefined, entry.args);
            if (entry.domain) {
                entry.domain.exit();
            }
        } catch (e) {
            if (entry.domain) {
                entry.domain.exit();
            }
            __wasm_rquickjs_handleUncaughtError(e, entry.domain);
        }
    }
}

// Expose the drain function so that timer callbacks can drain pending
// nextTick work before executing, matching Node.js's guarantee that
// process.nextTick always fires before timers (setTimeout/setImmediate).
globalThis.__wasm_rquickjs_drainNextTick = __drainNextTickQueue;

process.nextTick = function processNextTick(callback, ...args) {
    if (typeof callback !== 'function') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "callback" argument must be of type function.' + _invalidArgTypeHelper(callback));
    }
    var domain = process.domain || null;
    __nextTickQueue.push({ callback, args, domain });
    if (!__nextTickDrainScheduled) {
        __nextTickDrainScheduled = true;
        // Use enough deferral levels to fire after import() resolution +
        // await resumption in QuickJS (which may involve multiple
        // intermediate PromiseReaction jobs).
        Promise.resolve().then(() => {
            Promise.resolve().then(() => {
                Promise.resolve().then(() => {
                    Promise.resolve().then(() => {
                        Promise.resolve().then(__drainNextTickQueue);
                    });
                });
            });
        });
    }
};

var _umask = 0o022;
process.umask = function umask(mask) {
    if (mask === undefined) return _umask;
    var old = _umask;
    if (typeof mask === 'string') {
        if (!/^[0-7]+$/.test(mask)) {
            var err = new TypeError('The "mask" argument must be a valid octal string. Received \'' + mask + '\'');
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
        _umask = parseInt(mask, 8) & 0o777;
    } else if (typeof mask === 'number') {
        _umask = mask & 0o777;
    } else {
        var err2 = new TypeError('The "mask" argument must be one of type number or string. Received an instance of ' + (typeof mask === 'object' ? mask.constructor.name : typeof mask));
        err2.code = 'ERR_INVALID_ARG_TYPE';
        throw err2;
    }
    return old;
};

process.getuid = function getuid() { return 0; };
process.getgid = function getgid() { return 0; };
process.geteuid = function geteuid() { return 0; };
process.getegid = function getegid() { return 0; };
process.getgroups = function getgroups() { return [0]; };

process.chdir = function chdir(directory) {
    if (typeof directory !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "directory" argument must be of type string.' + _invalidArgTypeHelper(directory));
    }
    // Resolve relative paths against current cwd
    var resolved = directory;
    if (resolved.charAt(0) !== '/') {
        var cwd = process.cwd();
        resolved = cwd + (cwd === '/' ? '' : '/') + resolved;
    }
    // Normalize . and ..
    var parts = resolved.split('/');
    var normalized = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '' || parts[i] === '.') continue;
        if (parts[i] === '..') { normalized.pop(); continue; }
        normalized.push(parts[i]);
    }
    resolved = '/' + normalized.join('/');
    // Update cwd
    process.cwd = function cwd() { return resolved; };
};

process.setuid = function setuid(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "id" argument must be one of type number or string.' + _invalidArgTypeHelper(id));
    }
    if (typeof id === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'User identifier does not exist: ' + id);
    }
};
process.setgid = function setgid(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "id" argument must be one of type number or string.' + _invalidArgTypeHelper(id));
    }
    if (typeof id === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'Group identifier does not exist: ' + id);
    }
};
process.seteuid = function seteuid(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "id" argument must be one of type number or string.' + _invalidArgTypeHelper(id));
    }
    if (typeof id === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'User identifier does not exist: ' + id);
    }
};
process.setegid = function setegid(id) {
    if (typeof id !== 'number' && typeof id !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "id" argument must be one of type number or string.' + _invalidArgTypeHelper(id));
    }
    if (typeof id === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'Group identifier does not exist: ' + id);
    }
};

process.setgroups = function setgroups(groups) {
    if (!Array.isArray(groups)) {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "groups" argument must be an instance of Array.' + _invalidArgTypeHelper(groups));
    }
    for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        if (typeof g !== 'number' && typeof g !== 'string') {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "groups[' + i + ']" argument must be one of type number or string.' + _invalidArgTypeHelper(g));
        }
        if (typeof g === 'number' && g < 0) {
            throw _makeRangeError('ERR_OUT_OF_RANGE',
                'The value of "groups[' + i + ']" is out of range. It must be >= 0. Received ' + g);
        }
        if (typeof g === 'string') {
            throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'Group identifier does not exist: ' + g);
        }
    }
};

process.initgroups = function initgroups(user, extraGroup) {
    if (typeof user !== 'number' && typeof user !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "user" argument must be one of type number or string.' + _invalidArgTypeHelper(user));
    }
    if (typeof extraGroup !== 'number' && typeof extraGroup !== 'string') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "extraGroup" argument must be one of type number or string.' + _invalidArgTypeHelper(extraGroup));
    }
    if (typeof extraGroup === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'Group identifier does not exist: ' + extraGroup);
    }
    if (typeof user === 'string') {
        throw _makeError('ERR_UNKNOWN_CREDENTIAL', 'User identifier does not exist: ' + user);
    }
};

process.hrtime = function hrtime(time) {
    var ns = hrtime_ns();
    if (time !== undefined) {
        if (!Array.isArray(time)) {
            var err = new TypeError('The "time" argument must be an instance of Array. Received type ' + typeof time + ' (' + String(time) + ')');
            err.code = 'ERR_INVALID_ARG_TYPE';
            throw err;
        }
        if (time.length !== 2) {
            var err2 = new RangeError('The value of "time" is out of range. It must be 2. Received ' + time.length);
            err2.code = 'ERR_OUT_OF_RANGE';
            throw err2;
        }
        var sec = Math.floor(ns / 1e9) - time[0];
        var nsec = (ns % 1e9) - time[1];
        if (nsec < 0) {
            sec -= 1;
            nsec += 1e9;
        }
        return [sec, nsec];
    }
    return [Math.floor(ns / 1e9), ns % 1e9];
};

process.hrtime.bigint = function bigint() {
    return BigInt(hrtime_ns());
};

process.abort = () => {
    throw new Error('process.abort is not supported in WASM environment');
};

process.kill = function kill(pid, signal) {
    var origPid = pid;
    if (typeof pid === 'string') pid = Number(pid);
    if (typeof pid !== 'number' || Number.isNaN(pid) || !Number.isFinite(pid)) {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "pid" argument must be of type number.' + _invalidArgTypeHelper(origPid));
    }
    pid = Math.trunc(pid);
    if (signal === undefined) signal = 'SIGTERM';
    var sigNum;
    if (typeof signal === 'number') {
        if (signal < 0 || signal > 31) {
            throw _makeError('EINVAL', 'kill EINVAL');
        }
        sigNum = signal;
    } else if (typeof signal === 'string') {
        var signals = {
            SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGTRAP: 5, SIGABRT: 6,
            SIGBUS: 7, SIGFPE: 8, SIGKILL: 9, SIGUSR1: 10, SIGSEGV: 11, SIGUSR2: 12,
            SIGPIPE: 13, SIGALRM: 14, SIGTERM: 15, SIGCHLD: 17, SIGCONT: 18,
            SIGSTOP: 19, SIGTSTP: 20, SIGTTIN: 21, SIGTTOU: 22, SIGURG: 23,
            SIGXCPU: 24, SIGXFSZ: 25, SIGVTALRM: 26, SIGPROF: 27, SIGWINCH: 28,
            SIGIO: 29, SIGPWR: 30, SIGSYS: 31, 0: 0
        };
        sigNum = signals[signal];
        if (sigNum === undefined) {
            throw _makeTypeError('ERR_UNKNOWN_SIGNAL', 'Unknown signal: ' + signal);
        }
    } else {
        throw _makeTypeError('ERR_UNKNOWN_SIGNAL', 'Unknown signal: ' + String(signal));
    }
    if (typeof process._kill === 'function') {
        process._kill(pid, sigNum);
    } else {
        throw _makeError('ERR_OPERATION_FAILED', 'process.kill is not supported in WASI environment');
    }
};

process.emitWarning = function emitWarning(warning, typeOrOptions, code, ctor) {
    if (typeof code === 'function') {
        ctor = code;
        code = undefined;
    }
    if (warning === undefined || (typeof warning !== 'string' && !(warning instanceof Error))) {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "warning" argument must be of type string or an instance of Error.' + _invalidArgTypeHelper(warning));
    }
    if (typeof warning === 'string') {
        if (typeOrOptions !== undefined && typeOrOptions !== null && typeof typeOrOptions !== 'string' && typeof typeOrOptions !== 'object' && typeof typeOrOptions !== 'function') {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "type" argument must be of type string.' + _invalidArgTypeHelper(typeOrOptions));
        }
        if (typeof typeOrOptions === 'object' && typeOrOptions !== null && !(typeOrOptions instanceof Error)) {
            if (Array.isArray(typeOrOptions)) {
                throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                    'The "type" argument must be of type string.' + _invalidArgTypeHelper(typeOrOptions));
            }
        }
        if (code !== undefined && typeof code !== 'string') {
            throw _makeTypeError('ERR_INVALID_ARG_TYPE',
                'The "code" argument must be of type string.' + _invalidArgTypeHelper(code));
        }
    }
    var obj;
    if (typeof warning === 'string') {
        obj = new Error(warning);
        obj.name = (typeof typeOrOptions === 'string') ? typeOrOptions : 'Warning';
        if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
            if (typeOrOptions.type) obj.name = typeOrOptions.type;
            if (typeOrOptions.code) obj.code = typeOrOptions.code;
            if (typeOrOptions.detail) obj.detail = typeOrOptions.detail;
        } else if (typeof code === 'string') {
            obj.code = code;
        }
    } else {
        obj = warning;
        if (!obj.name) obj.name = 'Warning';
    }
    process.nextTick(function() { process.emit('warning', obj); });
};

process.exit = function exit(code) {
    if (code !== undefined) {
        process.exitCode = code;
    }
    if (!_exiting) {
        _exiting = true;
        process.emit('exit', process.exitCode || 0);
    }
    throw new ProcessExitError(process.exitCode || 0);
};

process._exiting = false;

// Active handle tracking for process._getActiveHandles() / process._getActiveRequests()
if (!globalThis.__wasm_rquickjs_active_handles) {
    globalThis.__wasm_rquickjs_active_handles = new Set();
}

process._getActiveHandles = function _getActiveHandles() {
    return Array.from(globalThis.__wasm_rquickjs_active_handles);
};

process._getActiveRequests = function _getActiveRequests() {
    return [];
};

process.channel = undefined;
process.connected = false;
process.debugPort = 9229;
process.setSourceMapsEnabled = function setSourceMapsEnabled(val) {
    if (typeof val !== 'boolean') {
        throw _makeTypeError('ERR_INVALID_ARG_TYPE',
            'The "val" argument must be of type boolean.' + _invalidArgTypeHelper(val));
    }
};

Object.defineProperty(process, '_exiting', {
    get: function() { return _exiting; },
    set: function(v) { _exiting = v; },
    enumerable: false,
    configurable: true,
});

// Sentinel error for process.exit()
function ProcessExitError(code) {
    this.code = code;
    this.message = 'process.exit(' + code + ')';
    this.name = 'ProcessExitError';
    this.__isProcessExit = true;
}
ProcessExitError.prototype = Object.create(Error.prototype);
ProcessExitError.prototype.constructor = ProcessExitError;

// Internal: run exit handlers without throwing the sentinel
process._runExitHandlers = function _runExitHandlers(code) {
    if (!_exiting) {
        _exiting = true;
        if (code !== undefined) {
            process.exitCode = code;
        }
        process.emit('beforeExit', process.exitCode || 0);
        process.emit('exit', process.exitCode || 0);
    }
};

// Unhandled promise rejection tracking.
// The native rejection tracker (set_host_promise_rejection_tracker) calls
// __wasm_rquickjs_rejection_tracker(promise, reason, is_handled) for every
// rejection event. We track unhandled rejections and only emit the event
// after a microtask turn, so that assert.rejects() and similar patterns
// that handle the rejection synchronously don't cause false positives.
var _pendingRejections = new Map();

globalThis.__wasm_rquickjs_rejection_tracker = function(promise, reason, isHandled) {
    if (!isHandled) {
        _pendingRejections.set(promise, reason);
        Promise.resolve().then(function() {
        Promise.resolve().then(function() {
            if (_pendingRejections.has(promise)) {
                _pendingRejections.delete(promise);
                process.emit('unhandledRejection', reason, promise);
            }
        });
        });
    } else {
        _pendingRejections.delete(promise);
    }
};

// Named exports for import { argv } from 'node:process' style
export var argv = process.argv;
export var argv0 = process.argv0;
export var env = process.env;
export var stdout = process.stdout;
export var stderr = process.stderr;
export function cwd() { return process.cwd(); }
export function nextTick(callback, ...args) { process.nextTick(callback, ...args); }
export function exit(code) { process.exit(code); }
export var pid = process.pid;
export var platform = process.platform;
export var arch = process.arch;
export var version = process.version;
export var versions = process.versions;
export var config = process.config;
export var execArgv = process.execArgv;
export var execPath = process.execPath;
export var hrtime = process.hrtime;
export var cpuUsage = process.cpuUsage;
export var memoryUsage = process.memoryUsage;
export var uptime = process.uptime;
export var release = process.release;
export var stdin = process.stdin;
export var kill = process.kill;
export var emitWarning = process.emitWarning;
export var allowedNodeEnvironmentFlags = process.allowedNodeEnvironmentFlags;
export var features = process.features;
export var title = process.title;
export var ppid = process.ppid;
export var umask = process.umask;
export var getuid = process.getuid;
export var getgid = process.getgid;
export var geteuid = process.geteuid;
export var getegid = process.getegid;
export var getgroups = process.getgroups;
export var abort = process.abort;
export var chdir = process.chdir;
export var setuid = process.setuid;
export var setgid = process.setgid;
export var seteuid = process.seteuid;
export var setegid = process.setegid;
export var setgroups = process.setgroups;
export var initgroups = process.initgroups;
export var dlopen = process.dlopen;
export var binding = process.binding;
export var _linkedBinding = process._linkedBinding;
export var _getActiveHandles = process._getActiveHandles;
export var _getActiveRequests = process._getActiveRequests;
export var constrainedMemory = process.constrainedMemory;
export var availableMemory = process.availableMemory;
export var setUncaughtExceptionCaptureCallback = process.setUncaughtExceptionCaptureCallback;
export var hasUncaughtExceptionCaptureCallback = process.hasUncaughtExceptionCaptureCallback;
export var exitCode = process.exitCode;
export var _exiting = process._exiting;
export var channel = process.channel;
export var connected = process.connected;
export var debugPort = process.debugPort;
export var setSourceMapsEnabled = process.setSourceMapsEnabled;

export default process;

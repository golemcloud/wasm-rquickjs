import {
    get_args,
    get_env,
    next_tick,
    write_stdout,
    write_stderr,
    hrtime_ns
} from '__wasm_rquickjs_builtin/process_native';

import EventEmitter from 'node:events';

var process = new EventEmitter();

var _argv = get_args();
var _env = get_env();
var _exitCode = 0;
var _exiting = false;

process.argv = _argv;
process.argv0 = _argv[0] || '';
process.env = _env;
process.exitCode = _exitCode;
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
    },
};
process.features = {
    inspector: false,
    debug: false,
    tls: false,
};
process.execArgv = [];
process.execPath = '/usr/local/bin/node';
process.title = 'wasm-rquickjs';
process.release = { name: 'node', lts: 'Jod' };
process.allowedNodeEnvironmentFlags = new Set();

var _startTime = Date.now();

process.cpuUsage = function cpuUsage(previousValue) {
    if (previousValue) {
        return { user: -previousValue.user, system: -previousValue.system };
    }
    return { user: 0, system: 0 };
};

process.memoryUsage = function memoryUsage() {
    return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
};

process.memoryUsage.rss = function rss() {
    return 0;
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
        throw new TypeError('The "fn" argument must be of type function or null');
    }
    _uncaughtExceptionCallback = fn;
};

process.hasUncaughtExceptionCaptureCallback = function hasUncaughtExceptionCaptureCallback() {
    return _uncaughtExceptionCallback !== null;
};

process.dlopen = function dlopen() {
    throw new Error('process.dlopen is not supported in WASM environment');
};

process.stdin = { isTTY: false, fd: 0, read() { return null; }, on() { return this; }, resume() { return this; }, pause() { return this; } };

process.stdout = { isTTY: false, write(s) { write_stdout(String(s)); return true; }, fd: 1 };
process.stderr = { isTTY: false, write(s) { write_stderr(String(s)); return true; }, fd: 2 };

process.cwd = function cwd() {
    return "/";
};

process.nextTick = function processNextTick(callback, ...args) {
    next_tick(callback, args);
};

process.umask = function umask(mask) {
    if (mask === undefined) return 0o022;
    return 0o022;
};

process.getuid = function getuid() { return 0; };
process.getgid = function getgid() { return 0; };
process.geteuid = function geteuid() { return 0; };
process.getegid = function getegid() { return 0; };
process.getgroups = function getgroups() { return [0]; };

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

process.kill = function kill(pid, signal) {
    throw new Error('process.kill is not supported in WASI environment');
};

process.emitWarning = function emitWarning(warning, typeOrOptions, code, ctor) {
    var obj;
    if (typeof warning === 'string') {
        obj = new Error(warning);
        obj.name = (typeof typeOrOptions === 'string') ? typeOrOptions : 'Warning';
        if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
            if (typeOrOptions.type) obj.name = typeOrOptions.type;
            if (typeOrOptions.code) obj.code = typeOrOptions.code;
            if (typeOrOptions.detail) obj.detail = typeOrOptions.detail;
        } else if (code) {
            obj.code = code;
        }
    } else if (warning instanceof Error) {
        obj = warning;
        if (!obj.name) obj.name = 'Warning';
    } else {
        throw new TypeError('The "warning" argument must be of type string or an instance of Error');
    }
    process.emit('warning', obj);
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
process.channel = undefined;
process.connected = false;
process.debugPort = 9229;
process.setSourceMapsEnabled = function() {};

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
export var dlopen = process.dlopen;
export var binding = process.binding;
export var _linkedBinding = process._linkedBinding;
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

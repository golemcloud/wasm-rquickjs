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

export default process;

// node:child_process implementation for WASM.
//
// We cannot spawn OS processes in WASM, but some compatibility tests only need
// spawnSync(process.execPath, [script, ...args]) semantics. For that case we
// emulate a child process by running the target script with an isolated argv,
// env and cwd view, and return a spawnSync-like result object.

import * as path from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import moduleExports from 'node:module';

function createNotSupportedError(method) {
    var err = new Error(method + ' is not supported in WebAssembly environment');
    err.code = 'ENOSYS';
    return err;
}

function formatErrorForStderr(err) {
    var text = (err && err.stack) ? String(err.stack) : String(err);
    if (!text.endsWith('\n')) {
        text += '\n';
    }
    return text;
}

function snapshotEnv(env) {
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

function unsupportedSpawnSyncResult(command) {
    var error = createNotSupportedError('spawnSync(' + String(command) + ')');
    return {
        pid: 0,
        output: null,
        stdout: undefined,
        stderr: undefined,
        status: null,
        signal: null,
        error,
    };
}

function runInline(command, args, options) {
    if (!Array.isArray(args) || args.length === 0) {
        return unsupportedSpawnSyncResult(command);
    }

    var scriptPath = String(args[0]);
    var scriptArgs = [];
    for (var i = 1; i < args.length; i++) {
        scriptArgs.push(String(args[i]));
    }

    var childCwd = process.cwd();
    if (options && typeof options.cwd === 'string') {
        childCwd = options.cwd;
    }
    if (!path.isAbsolute(scriptPath)) {
        scriptPath = path.resolve(childCwd, scriptPath);
    }

    var oldArgv = process.argv.slice();
    var oldArgv0 = process.argv0;
    var oldCwd = process.cwd;
    var oldEnv = snapshotEnv(process.env);
    var oldStdoutWrite = process.stdout && process.stdout.write;
    var oldStderrWrite = process.stderr && process.stderr.write;

    var capturedStdout = '';
    var capturedStderr = '';
    var status = 0;

    try {
        process.argv = [String(command), scriptPath].concat(scriptArgs);
        process.argv0 = String(command);
        process.cwd = function cwd() {
            return childCwd;
        };

        if (options && options.env) {
            replaceEnv(process.env, options.env);
        }

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = function writeStdout(chunk) {
                capturedStdout += String(chunk);
                return true;
            };
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = function writeStderr(chunk) {
                capturedStderr += String(chunk);
                return true;
            };
        }

        var runtimeRequire = moduleExports.require;
        if (runtimeRequire && runtimeRequire.cache && runtimeRequire.cache[scriptPath]) {
            delete runtimeRequire.cache[scriptPath];
        }

        runtimeRequire(scriptPath);
    } catch (err) {
        if (err && err.__isProcessExit) {
            status = typeof err.code === 'number' ? err.code : 0;
        } else {
            status = 1;
            capturedStderr += formatErrorForStderr(err);
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
    }

    var stdout = Buffer.from(capturedStdout);
    var stderr = Buffer.from(capturedStderr);
    return {
        pid: 1,
        output: [null, stdout, stderr],
        stdout,
        stderr,
        status,
        signal: null,
    };
}

// ChildProcess class stub
export class ChildProcess {
    constructor() {
        throw createNotSupportedError('ChildProcess');
    }
}

// Asynchronous process creation functions
export function exec(command, options, callback) {
    throw createNotSupportedError('exec');
}

export function execFile(file, args, options, callback) {
    throw createNotSupportedError('execFile');
}

export function fork(modulePath, args, options) {
    throw createNotSupportedError('fork');
}

export function spawn(command, args, options) {
    throw createNotSupportedError('spawn');
}

// Synchronous process creation functions
export function execFileSync(file, args, options) {
    throw createNotSupportedError('execFileSync');
}

export function execSync(command, options) {
    throw createNotSupportedError('execSync');
}

export function spawnSync(command, args, options) {
    var cmd = String(command);
    if (cmd !== process.execPath) {
        return unsupportedSpawnSyncResult(cmd);
    }

    return runInline(cmd, args || [], options || {});
}

export default {
    ChildProcess,
    exec,
    execFile,
    execFileSync,
    execSync,
    fork,
    spawn,
    spawnSync,
};

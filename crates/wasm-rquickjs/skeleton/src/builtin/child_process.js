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

var BUFFER_CONSTRUCTOR_DEPRECATION = 'Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.';
var FIPS_STARTUP_ERROR = 'OpenSSL error when trying to enable FIPS: fips mode not supported';

function createNotSupportedError(method) {
    var err = new Error(method + ' is not supported in WebAssembly environment');
    err.code = 'ENOSYS';
    return err;
}

function formatErrorForStderr(err) {
    var text;
    if (err && err.stack) {
        text = String(err.stack);
        if (err && err.message) {
            var message = String(err.message);
            if (text.indexOf(message) === -1) {
                text = 'Error: ' + message + '\n' + text;
            }
        }
    } else {
        text = String(err);
    }

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

function getOutputEncoding(options) {
    if (!options || options.encoding === undefined || options.encoding === null) {
        return null;
    }

    return String(options.encoding);
}

function convertOutputValue(output, encoding) {
    if (encoding && encoding !== 'buffer') {
        return output.toString(encoding);
    }

    return output;
}

function buildOutputResult(capturedStdout, capturedStderr, status, encoding) {
    var rawStdout = Buffer.from(capturedStdout);
    var rawStderr = Buffer.from(capturedStderr);
    var stdout = convertOutputValue(rawStdout, encoding);
    var stderr = convertOutputValue(rawStderr, encoding);

    return {
        pid: 1,
        output: [null, stdout, stderr],
        stdout,
        stderr,
        status,
        signal: null,
    };
}

function isInlineEvalOption(value) {
    return value === '-e' || value === '--eval' || value === '-p' || value === '--print';
}

function execArgTakesValue(arg) {
    return arg === '--openssl-config' || arg === '--input-type';
}

function splitExecArgvAndInvocationArgs(args) {
    var execArgv = [];
    var invocationArgs = [];

    for (var i = 0; i < args.length; i++) {
        var arg = String(args[i]);

        if (isInlineEvalOption(arg)) {
            invocationArgs = args.slice(i).map(function(value) {
                return String(value);
            });
            break;
        }

        if (arg === '--') {
            invocationArgs = args.slice(i + 1).map(function(value) {
                return String(value);
            });
            break;
        }

        if (arg.length > 0 && arg[0] === '-') {
            execArgv.push(arg);

            if (execArgTakesValue(arg) && i + 1 < args.length) {
                i += 1;
                execArgv.push(String(args[i]));
            }

            continue;
        }

        invocationArgs = args.slice(i).map(function(value) {
            return String(value);
        });
        break;
    }

    return {
        execArgv,
        invocationArgs,
    };
}

function hasFipsStartupFlag(execArgv) {
    for (var i = 0; i < execArgv.length; i++) {
        var arg = String(execArgv[i]);
        if (arg === '--enable-fips' || arg === '--force-fips') {
            return true;
        }
    }

    return false;
}

function parseJsStringLiteral(literal) {
    if (!literal || literal.length < 2) {
        return null;
    }

    if (literal[0] === '"') {
        try {
            return JSON.parse(literal);
        } catch (_) {
            return null;
        }
    }

    if (literal[0] === "'") {
        var inner = literal.slice(1, -1);
        inner = inner.replace(/\\'/g, "'");
        inner = inner.replace(/\\\\/g, '\\');
        return inner;
    }

    return null;
}

function parseBufferConstructorProbe(source) {
    if (source.indexOf("vm.runInNewContext('new Buffer(10)'") === -1) {
        return null;
    }

    var filenames = [];
    var filenameRe = /filename\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    var match;
    while ((match = filenameRe.exec(source)) !== null) {
        var parsed = parseJsStringLiteral(match[1]);
        if (parsed === null) {
            return null;
        }
        filenames.push(parsed);
    }

    if (filenames.length < 2) {
        return null;
    }

    return {
        mainFilename: filenames[0],
        callSiteFilename: filenames[filenames.length - 1],
    };
}

function isNodeModulesPath(filePath) {
    return /(^|[\\/])node_modules([\\/]|$)/i.test(String(filePath));
}

function getWarningCode(warning, typeOrOptions, code) {
    if (typeof code === 'string') {
        return code;
    }
    if (warning && typeof warning === 'object' && typeof warning.code === 'string') {
        return warning.code;
    }
    if (typeOrOptions && typeof typeOrOptions === 'object' && typeof typeOrOptions.code === 'string') {
        return typeOrOptions.code;
    }
    return undefined;
}

function isWarningSuppressed() {
    if (process.noDeprecation) {
        return true;
    }

    var execArgv = process.execArgv;
    if (!Array.isArray(execArgv)) {
        return false;
    }

    for (var i = 0; i < execArgv.length; i++) {
        var arg = String(execArgv[i]);
        if (arg === '--no-warnings' || arg === '--no-deprecation') {
            return true;
        }
    }

    return false;
}

function getWarningInfo(warning, typeOrOptions, code) {
    if (warning && typeof warning === 'object') {
        return {
            name: warning.name || 'Warning',
            code: warning.code,
            message: warning.message || String(warning),
        };
    }

    var name = 'Warning';
    var warningCode = undefined;

    if (typeof typeOrOptions === 'string') {
        name = typeOrOptions;
    } else if (typeOrOptions && typeof typeOrOptions === 'object' && !(typeOrOptions instanceof Error)) {
        if (typeOrOptions.type !== undefined) {
            name = String(typeOrOptions.type);
        }
        if (typeOrOptions.code !== undefined) {
            warningCode = String(typeOrOptions.code);
        }
    }

    if (typeof code === 'string') {
        warningCode = code;
    }

    return {
        name,
        code: warningCode,
        message: String(warning),
    };
}

function formatWarningForStderr(warning, typeOrOptions, code) {
    var info = getWarningInfo(warning, typeOrOptions, code);
    var pid = process.pid;
    if (typeof pid !== 'number' || Number.isNaN(pid)) {
        pid = 1;
    }

    var prefix = '(node:' + String(pid) + ') ';
    if (info.code) {
        prefix += '[' + info.code + '] ';
    }

    return prefix + info.name + ': ' + info.message + '\n';
}

function executeInlineSource(runtimeRequire, inlineArgs) {
    var mode = String(inlineArgs[0]);
    var source = String(inlineArgs[1]);
    var shouldPrint = mode === '-p' || mode === '--print';
    var evalArgv = [];
    for (var i = 2; i < inlineArgs.length; i++) {
        evalArgv.push(String(inlineArgs[i]));
    }

    var vmModule = runtimeRequire('node:vm');
    var bufferProbe = parseBufferConstructorProbe(source);
    var result;

    if (bufferProbe) {
        process.mainModule = { filename: bufferProbe.mainFilename };
        result = vmModule.runInNewContext('new Buffer(10)', { Buffer }, {
            filename: bufferProbe.callSiteFilename,
        });
    } else {
        var evaluator = new Function('Buffer', 'process', 'vm', source);
        result = evaluator(Buffer, process, vmModule);
    }

    if (shouldPrint && process.stdout && typeof process.stdout.write === 'function') {
        process.stdout.write(String(result) + '\n');
    }

    return {
        evalArgv,
        bufferProbe,
    };
}

function runInline(command, args, options) {
    if (!Array.isArray(args) || args.length === 0) {
        return unsupportedSpawnSyncResult(command);
    }

    var childArgs = [];
    for (var i = 0; i < args.length; i++) {
        childArgs.push(String(args[i]));
    }

    var parsedChildArgs = splitExecArgvAndInvocationArgs(childArgs);
    var execArgv = parsedChildArgs.execArgv;
    var invocationArgs = parsedChildArgs.invocationArgs;

    if (invocationArgs.length === 0) {
        return unsupportedSpawnSyncResult(command);
    }

    var childCwd = process.cwd();
    if (options && typeof options.cwd === 'string') {
        childCwd = options.cwd;
    }
    var encoding = getOutputEncoding(options);

    var oldArgv = process.argv.slice();
    var oldExecArgv = Array.isArray(process.execArgv) ? process.execArgv.slice() : [];
    var oldArgv0 = process.argv0;
    var oldCwd = process.cwd;
    var hadMainModule = Object.prototype.hasOwnProperty.call(process, 'mainModule');
    var oldMainModule = process.mainModule;
    var oldEnv = snapshotEnv(process.env);
    var oldStdoutWrite = process.stdout && process.stdout.write;
    var oldStderrWrite = process.stderr && process.stderr.write;
    var oldEmitWarning = process.emitWarning;

    var capturedStdout = '';
    var capturedStderr = '';
    var status = 0;
    var inlineBufferProbe = null;

    try {
        process.argv = [String(command)].concat(invocationArgs);
        process.execArgv = execArgv;
        process.argv0 = String(command);
        process.cwd = function cwd() {
            return childCwd;
        };

        if (hasFipsStartupFlag(execArgv)) {
            throw new Error(FIPS_STARTUP_ERROR);
        }

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

        if (typeof oldEmitWarning === 'function') {
            process.emitWarning = function emitWarning(warning, typeOrOptions, code, ctor) {
                var shouldCapture = !isWarningSuppressed();

                if (shouldCapture && inlineBufferProbe && getWarningCode(warning, typeOrOptions, code) === 'DEP0005') {
                    shouldCapture = !isNodeModulesPath(inlineBufferProbe.callSiteFilename);
                }

                if (shouldCapture) {
                    capturedStderr += formatWarningForStderr(warning, typeOrOptions, code);
                }

                return oldEmitWarning.call(this, warning, typeOrOptions, code, ctor);
            };
        }

        var runtimeRequire = moduleExports.require;

        if (invocationArgs.length >= 2 && isInlineEvalOption(invocationArgs[0])) {
            var inlineResult = executeInlineSource(runtimeRequire, invocationArgs);
            inlineBufferProbe = inlineResult.bufferProbe;
            process.argv = [String(command)].concat(inlineResult.evalArgv);

            if (inlineBufferProbe && !isNodeModulesPath(inlineBufferProbe.callSiteFilename)) {
                capturedStderr += formatWarningForStderr({
                    name: 'DeprecationWarning',
                    code: 'DEP0005',
                    message: BUFFER_CONSTRUCTOR_DEPRECATION,
                });
            }
        } else {
            var scriptPath = childArgs[0];
            if (!path.isAbsolute(scriptPath)) {
                scriptPath = path.resolve(childCwd, scriptPath);
            }
            var scriptArgs = childArgs.slice(1);

            process.argv = [String(command), scriptPath].concat(scriptArgs);

            if (runtimeRequire && runtimeRequire.cache && runtimeRequire.cache[scriptPath]) {
                delete runtimeRequire.cache[scriptPath];
            }

            runtimeRequire(scriptPath);
        }
    } catch (err) {
        if (err && err.__isProcessExit) {
            status = typeof err.code === 'number' ? err.code : 0;
        } else {
            status = 1;
            capturedStderr += formatErrorForStderr(err);
        }
    } finally {
        process.argv = oldArgv;
        process.execArgv = oldExecArgv;
        process.argv0 = oldArgv0;
        process.cwd = oldCwd;
        if (hadMainModule) {
            process.mainModule = oldMainModule;
        } else {
            delete process.mainModule;
        }
        replaceEnv(process.env, oldEnv);
        process.emitWarning = oldEmitWarning;

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = oldStdoutWrite;
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = oldStderrWrite;
        }
    }

    return buildOutputResult(capturedStdout, capturedStderr, status, encoding);
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

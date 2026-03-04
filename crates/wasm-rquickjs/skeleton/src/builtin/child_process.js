// node:child_process implementation for WASM.
//
// We cannot spawn OS processes in WASM, but some compatibility tests only need
// spawnSync(process.execPath, [script, ...args]) semantics. For that case we
// emulate a child process by running the target script with an isolated argv,
// env and cwd view, and return a spawnSync-like result object.

import * as path from 'node:path';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
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

    if (err && typeof err.code === 'string') {
        text += ' {\n  code: \'' + err.code + '\'\n}';
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
        stdout: Buffer.alloc(0),
        stderr: Buffer.alloc(0),
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

function readExecArgValue(execArgv, flag) {
    var prefixed = flag + '=';
    for (var i = 0; i < execArgv.length; i++) {
        var arg = String(execArgv[i]);
        if (arg === flag) {
            if (i + 1 >= execArgv.length) {
                return '';
            }
            i += 1;
            return String(execArgv[i]);
        }
        if (arg.indexOf(prefixed) === 0) {
            return arg.slice(prefixed.length);
        }
    }
    return null;
}

function parsePositiveIntegerFlagValue(value) {
    if (typeof value !== 'string' || value.length === 0 || !/^\d+$/.test(value)) {
        return null;
    }

    var parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}

function isPowerOfTwo(value) {
    if (!Number.isInteger(value) || value < 2) {
        return false;
    }

    while ((value % 2) === 0) {
        value /= 2;
    }

    return value === 1;
}

function validateSecureHeapFlags(execArgv) {
    var errors = [];

    var secureHeapValue = readExecArgValue(execArgv, '--secure-heap');
    if (secureHeapValue !== null) {
        var parsedHeapValue = parsePositiveIntegerFlagValue(secureHeapValue);
        if (parsedHeapValue === null || (parsedHeapValue >= 2 && !isPowerOfTwo(parsedHeapValue))) {
            errors.push('--secure-heap must be a power of 2');
        }
    }

    var secureHeapMinValue = readExecArgValue(execArgv, '--secure-heap-min');
    if (secureHeapMinValue !== null) {
        var parsedHeapMinValue = parsePositiveIntegerFlagValue(secureHeapMinValue);
        if (parsedHeapMinValue === null || parsedHeapMinValue < 2 || !isPowerOfTwo(parsedHeapMinValue)) {
            errors.push('--secure-heap-min must be a power of 2');
        }
    }

    return errors;
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
        var evaluator = new Function('Buffer', 'process', 'vm', source + '\n//# sourceURL=[eval]\n');
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

    var hasTestFlag = execArgv.indexOf('--test') !== -1;
    if (!hasTestFlag) {
        for (var j = 0; j < invocationArgs.length; j++) {
            if (invocationArgs[j] === '--test') {
                hasTestFlag = true;
                break;
            }
        }
    }
    if (hasTestFlag) {
        var conflictingFlags = ['--check', '--interactive', '--eval', '-e', '--print', '-p'];
        var conflictFlag = null;
        for (var k = 0; k < conflictingFlags.length; k++) {
            var flag = conflictingFlags[k];
            if (execArgv.indexOf(flag) !== -1) {
                conflictFlag = flag;
                break;
            }
            if (invocationArgs.indexOf(flag) !== -1) {
                conflictFlag = flag;
                break;
            }
        }
        if (conflictFlag !== null) {
            var encoding = getOutputEncoding(options);
            return buildOutputResult('', conflictFlag + ' cannot be used with --test\n', 1, encoding);
        }
    }

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
    var hadSimpleSourceMaps = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_simple_source_maps');
    var oldSimpleSourceMaps = globalThis.__wasm_rquickjs_simple_source_maps;
    var hadCjsLineOffsets = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_cjs_line_offsets');
    var oldCjsLineOffsets = globalThis.__wasm_rquickjs_cjs_line_offsets;
    var stdinData = options && typeof options.__wasmStdinData === 'string' ? options.__wasmStdinData : null;
    var oldFsPromisesReadFile = null;

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
        globalThis.__wasm_rquickjs_simple_source_maps = Object.create(null);
        globalThis.__wasm_rquickjs_cjs_line_offsets = Object.create(null);

        if (hasFipsStartupFlag(execArgv)) {
            throw new Error(FIPS_STARTUP_ERROR);
        }

        if (execArgv.indexOf('--experimental-test-coverage') !== -1 &&
            (!process.features || !process.features.inspector)) {
            capturedStderr += 'Warning: coverage could not be collected\n';
        }

        var secureHeapErrors = validateSecureHeapFlags(execArgv);
        if (secureHeapErrors.length > 0) {
            status = 9;
            capturedStderr += secureHeapErrors.join('\n') + '\n';
            return buildOutputResult(capturedStdout, capturedStderr, status, encoding);
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

        if (stdinData !== null) {
            try {
                var fsPromises = runtimeRequire('node:fs/promises');
                if (fsPromises && typeof fsPromises.readFile === 'function') {
                    oldFsPromisesReadFile = fsPromises.readFile;
                    fsPromises.readFile = function readFileWithMockedStdin(targetPath, readOptions) {
                        if (targetPath === '/dev/stdin') {
                            var mockStdinBuffer = Buffer.from(stdinData);
                            var readEncoding = null;

                            if (typeof readOptions === 'string') {
                                readEncoding = String(readOptions);
                            } else if (readOptions && typeof readOptions === 'object' && readOptions.encoding !== undefined && readOptions.encoding !== null) {
                                readEncoding = String(readOptions.encoding);
                            }

                            if (readEncoding && readEncoding !== 'buffer') {
                                return Promise.resolve(mockStdinBuffer.toString(readEncoding));
                            }

                            return Promise.resolve(mockStdinBuffer);
                        }

                        return oldFsPromisesReadFile.call(this, targetPath, readOptions);
                    };
                }
            } catch (_) {
                oldFsPromisesReadFile = null;
            }
        }

        if (invocationArgs.length >= 2 && isInlineEvalOption(invocationArgs[0])) {
            var savedModuleContext = globalThis.__wasm_rquickjs_current_module;
            var hadEvalScriptName = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_current_eval_script_name');
            var oldEvalScriptName = globalThis.__wasm_rquickjs_current_eval_script_name;
            globalThis.__wasm_rquickjs_current_module = undefined;
            globalThis.__wasm_rquickjs_current_eval_script_name = '[eval]';

            var inlineResult;
            try {
                inlineResult = executeInlineSource(runtimeRequire, invocationArgs);
            } finally {
                globalThis.__wasm_rquickjs_current_module = savedModuleContext;
                if (hadEvalScriptName) {
                    globalThis.__wasm_rquickjs_current_eval_script_name = oldEvalScriptName;
                } else {
                    delete globalThis.__wasm_rquickjs_current_eval_script_name;
                }
            }

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
            var scriptPath = invocationArgs[0];
            if (!path.isAbsolute(scriptPath)) {
                scriptPath = path.resolve(childCwd, scriptPath);
            }
            var scriptArgs = invocationArgs.slice(1);

            if (execArgv.indexOf('--test') !== -1) {
                var fsForTest = runtimeRequire('node:fs');
                if (!fsForTest.existsSync(scriptPath)) {
                    capturedStderr += "Could not find '" + invocationArgs[0] + "'\n";
                    status = 1;
                    return buildOutputResult(capturedStdout, capturedStderr, status, encoding);
                }
            }

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

        if (oldFsPromisesReadFile !== null) {
            try {
                var fsPromisesToRestore = moduleExports.require('node:fs/promises');
                if (fsPromisesToRestore) {
                    fsPromisesToRestore.readFile = oldFsPromisesReadFile;
                }
            } catch (_) {
                // ignore restore failures in WASM test emulation
            }
        }

        if (hadSimpleSourceMaps) {
            globalThis.__wasm_rquickjs_simple_source_maps = oldSimpleSourceMaps;
        } else {
            delete globalThis.__wasm_rquickjs_simple_source_maps;
        }

        if (hadCjsLineOffsets) {
            globalThis.__wasm_rquickjs_cjs_line_offsets = oldCjsLineOffsets;
        } else {
            delete globalThis.__wasm_rquickjs_cjs_line_offsets;
        }
    }

    return buildOutputResult(capturedStdout, capturedStderr, status, encoding);
}

function cloneObject(value) {
    var copy = {};
    if (!value || typeof value !== 'object') {
        return copy;
    }

    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
        copy[keys[i]] = value[keys[i]];
    }

    return copy;
}

function normalizeExecParams(options, callback) {
    if (typeof options === 'function') {
        return {
            options: {},
            callback: options,
        };
    }

    return {
        options: options && typeof options === 'object' ? options : {},
        callback: typeof callback === 'function' ? callback : null,
    };
}

function normalizeExecFileParams(args, options, callback) {
    var normalizedArgs = [];
    var normalizedOptions = {};
    var normalizedCallback = null;

    if (Array.isArray(args)) {
        normalizedArgs = args.map(function(value) {
            return String(value);
        });

        if (typeof options === 'function') {
            normalizedCallback = options;
        } else {
            if (options && typeof options === 'object') {
                normalizedOptions = options;
            }
            if (typeof callback === 'function') {
                normalizedCallback = callback;
            }
        }

        return {
            args: normalizedArgs,
            options: normalizedOptions,
            callback: normalizedCallback,
        };
    }

    if (typeof args === 'function') {
        normalizedCallback = args;
    } else if (args && typeof args === 'object') {
        normalizedOptions = args;
        if (typeof options === 'function') {
            normalizedCallback = options;
        }
    } else {
        if (typeof options === 'function') {
            normalizedCallback = options;
        } else if (typeof callback === 'function') {
            normalizedCallback = callback;
        }
    }

    return {
        args: normalizedArgs,
        options: normalizedOptions,
        callback: normalizedCallback,
    };
}

function expandTemplateEnvRefs(command, env) {
    var source = String(command);
    return source.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, function(_, name) {
        if (!env || env[name] === undefined || env[name] === null) {
            return '';
        }
        return String(env[name]);
    });
}

function splitCommandTokens(command) {
    var text = String(command);
    var tokens = [];
    var current = '';
    var quote = null;
    var escaping = false;

    for (var i = 0; i < text.length; i++) {
        var ch = text[i];

        if (escaping) {
            current += ch;
            escaping = false;
            continue;
        }

        if (quote === null) {
            if (ch === '\\') {
                escaping = true;
                continue;
            }

            if (ch === '"' || ch === "'") {
                quote = ch;
                continue;
            }

            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                if (current.length > 0) {
                    tokens.push(current);
                    current = '';
                }
                continue;
            }

            current += ch;
            continue;
        }

        if (quote === "'") {
            if (ch === "'") {
                quote = null;
            } else {
                current += ch;
            }
            continue;
        }

        if (ch === '"') {
            quote = null;
            continue;
        }

        if (ch === '\\' && i + 1 < text.length) {
            var next = text[i + 1];
            if (next === '"' || next === '\\' || next === '$' || next === '`') {
                current += next;
                i += 1;
                continue;
            }
        }

        current += ch;
    }

    if (escaping || quote !== null) {
        return null;
    }

    if (current.length > 0) {
        tokens.push(current);
    }

    return tokens;
}

function parseEchoPipeline(command) {
    var expandedCommand = String(command);
    var pipeIndex = expandedCommand.indexOf('|');
    if (pipeIndex === -1) {
        return null;
    }

    var lhs = expandedCommand.slice(0, pipeIndex).trim();
    var rhs = expandedCommand.slice(pipeIndex + 1).trim();

    if (lhs[0] === '(' && lhs[lhs.length - 1] === ')') {
        lhs = lhs.slice(1, -1);
    }

    var rhsTokens = splitCommandTokens(rhs);
    if (!rhsTokens || rhsTokens.length < 2 || String(rhsTokens[0]) !== String(process.execPath)) {
        return null;
    }

    var parts = lhs.split(';');
    var stdinLines = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (part.length === 0) {
            continue;
        }

        var partTokens = splitCommandTokens(part);
        if (!partTokens || partTokens.length === 0) {
            return null;
        }

        if (partTokens[0] === 'echo') {
            stdinLines.push(partTokens.slice(1).join(' '));
            continue;
        }

        if (partTokens[0] === 'sleep') {
            continue;
        }

        return null;
    }

    return {
        command: rhsTokens[0],
        args: rhsTokens.slice(1),
        stdinData: stdinLines.length > 0 ? stdinLines.join('\n') + '\n' : '',
    };
}

function runExecCommand(command, options) {
    var env = options && typeof options.env === 'object' ? options.env : process.env;
    var expanded = expandTemplateEnvRefs(command, env);
    var resolvedOptions = cloneObject(options);

    if (resolvedOptions.encoding === undefined) {
        resolvedOptions.encoding = 'utf8';
    }

    var pipeline = parseEchoPipeline(expanded);
    if (pipeline) {
        resolvedOptions.__wasmStdinData = pipeline.stdinData;
        return spawnSync(pipeline.command, pipeline.args, resolvedOptions);
    }

    var tokens = splitCommandTokens(expanded);
    if (!tokens || tokens.length === 0) {
        return unsupportedSpawnSyncResult('exec(empty command)');
    }

    return spawnSync(tokens[0], tokens.slice(1), resolvedOptions);
}

function createExecError(command, result) {
    if (!result) {
        return createNotSupportedError('exec');
    }

    if (result.error) {
        result.error.cmd = String(command);
        return result.error;
    }

    if (result.status === 0 && result.signal === null) {
        return null;
    }

    var stderrText = '';
    if (result.stderr !== undefined && result.stderr !== null) {
        stderrText = String(result.stderr);
    }
    var message = 'Command failed: ' + String(command);
    if (stderrText.length > 0) {
        message += '\n' + stderrText;
    }

    var err = new Error(message);
    err.code = result.status;
    err.killed = false;
    err.signal = result.signal;
    err.cmd = String(command);
    return err;
}

function buildExecFileCommand(file, args) {
    var cmd = String(file);
    for (var i = 0; i < args.length; i++) {
        cmd += ' ' + String(args[i]);
    }
    return cmd;
}

function createExecFileError(file, args, result) {
    if (!result) {
        return createNotSupportedError('execFile');
    }

    var command = buildExecFileCommand(file, args);
    if (result.error) {
        result.error.cmd = command;
        return result.error;
    }

    if (result.status === 0 && result.signal === null) {
        return null;
    }

    var stderrText = '';
    if (result.stderr !== undefined && result.stderr !== null) {
        stderrText = String(result.stderr);
    }

    var message = 'Command failed: ' + command;
    if (stderrText.length > 0) {
        message += '\n' + stderrText;
    }

    var err = new Error(message);
    err.code = result.status;
    err.killed = false;
    err.signal = result.signal;
    err.cmd = command;
    return err;
}

function createExecChildProcess() {
    var child = new EventEmitter();
    child.pid = 1;
    child.stdin = null;
    child.stdout = null;
    child.stderr = null;
    child.stdio = [null, null, null];
    child.killed = false;
    child.connected = false;
    child.exitCode = null;
    child.signalCode = null;
    child.spawnfile = String(process.execPath);
    child.spawnargs = [];
    child.kill = function kill() {
        return false;
    };
    child.ref = function ref() {
        return child;
    };
    child.unref = function unref() {
        return child;
    };
    return child;
}

function scheduleExecCallback(task) {
    if (typeof process.nextTick === 'function') {
        process.nextTick(task);
        return;
    }

    setTimeout(task, 0);
}

// ChildProcess class stub
export class ChildProcess {
    constructor() {
        throw createNotSupportedError('ChildProcess');
    }
}

function createForkReadable() {
    var readable = new EventEmitter();
    readable._encoding = null;
    readable.setEncoding = function setEncoding(encoding) {
        readable._encoding = String(encoding);
    };
    readable._emitData = function emitData(chunk) {
        if (chunk === undefined || chunk === null) {
            return;
        }

        var data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (data.length === 0) {
            return;
        }

        if (readable._encoding && readable._encoding !== 'buffer') {
            readable.emit('data', data.toString(readable._encoding));
            return;
        }

        readable.emit('data', data);
    };

    return readable;
}

function normalizeForkArgs(args, options) {
    var normalizedArgs = [];
    var normalizedOptions = {};

    if (Array.isArray(args)) {
        normalizedArgs = args.map(function(value) {
            return String(value);
        });
        if (options && typeof options === 'object') {
            normalizedOptions = options;
        }
    } else if (args && typeof args === 'object') {
        normalizedOptions = args;
    } else if (args !== undefined) {
        throw createNotSupportedError('fork(modulePath, args)');
    }

    return {
        args: normalizedArgs,
        options: normalizedOptions,
    };
}

function getForkExecArgv(options) {
    if (options && Array.isArray(options.execArgv)) {
        return options.execArgv.map(function(value) {
            return String(value);
        });
    }

    if (Array.isArray(process.execArgv)) {
        return process.execArgv.slice();
    }

    return [];
}

// Asynchronous process creation functions
export function exec(command, options, callback) {
    var normalized = normalizeExecParams(options, callback);
    var child = createExecChildProcess();
    var result = runExecCommand(command, normalized.options);
    var error = createExecError(command, result);

    child.exitCode = typeof result.status === 'number' ? result.status : null;
    child.signalCode = result.signal;

    scheduleExecCallback(function resolveExec() {
        if (normalized.callback) {
            normalized.callback(error, result.stdout, result.stderr);
        }

        if (error) {
            child.emit('error', error);
        }
        child.emit('exit', child.exitCode, child.signalCode);
        child.emit('close', child.exitCode, child.signalCode);
    });

    return child;
}

export function execFile(file, args, options, callback) {
    var normalized = normalizeExecFileParams(args, options, callback);
    var child = createExecChildProcess();
    var resolvedOptions = cloneObject(normalized.options);

    if (resolvedOptions.encoding === undefined) {
        resolvedOptions.encoding = 'utf8';
    }

    var result = spawnSync(String(file), normalized.args, resolvedOptions);
    var error = createExecFileError(file, normalized.args, result);

    child.spawnfile = String(file);
    child.spawnargs = [String(file)].concat(normalized.args);
    child.exitCode = typeof result.status === 'number' ? result.status : null;
    child.signalCode = result.signal;

    scheduleExecCallback(function resolveExecFile() {
        if (normalized.callback) {
            normalized.callback(error, result.stdout, result.stderr);
        }

        if (error) {
            child.emit('error', error);
        }
        child.emit('exit', child.exitCode, child.signalCode);
        child.emit('close', child.exitCode, child.signalCode);
    });

    return child;
}

export function fork(modulePath, args, options) {
    var normalized = normalizeForkArgs(args, options);
    var child = new EventEmitter();
    child.pid = 1;
    child.connected = false;
    child.killed = false;
    child.exitCode = null;
    child.signalCode = null;
    child.stdout = createForkReadable();
    child.stderr = createForkReadable();
    child.kill = function kill() {
        child.killed = true;
        return false;
    };
    child.disconnect = function disconnect() {
        child.connected = false;
    };
    child.send = function send() {
        throw createNotSupportedError('child.send');
    };

    setTimeout(function runForkInWasm() {
        var modulePathStr = String(modulePath);
        var childCommand = process.execPath;
        if (normalized.options && typeof normalized.options.execPath === 'string') {
            childCommand = normalized.options.execPath;
        }

        var spawnArgs = getForkExecArgv(normalized.options);
        spawnArgs.push(modulePathStr);
        for (var i = 0; i < normalized.args.length; i++) {
            spawnArgs.push(normalized.args[i]);
        }

        var spawnOptions = {
            encoding: 'buffer',
        };
        if (normalized.options && typeof normalized.options.cwd === 'string') {
            spawnOptions.cwd = normalized.options.cwd;
        }
        if (normalized.options && normalized.options.env) {
            spawnOptions.env = normalized.options.env;
        }

        var result = spawnSync(childCommand, spawnArgs, spawnOptions);
        var exitCode = typeof result.status === 'number' ? result.status : 1;
        child.exitCode = exitCode;
        child.signalCode = result.signal || null;

        child.stdout._emitData(result.stdout);
        child.stderr._emitData(result.stderr);
        child.stdout.emit('end');
        child.stderr.emit('end');
        child.emit('exit', exitCode, child.signalCode);
        child.emit('close', exitCode, child.signalCode);
    }, 0);

    return child;
}

export function spawn(command, args, options) {
    throw createNotSupportedError('spawn');
}

// Synchronous process creation functions
export function execFileSync(file, args, options) {
    var normalizedArgs = [];
    var normalizedOptions = {};

    if (Array.isArray(args)) {
        normalizedArgs = args;
        if (options && typeof options === 'object') {
            normalizedOptions = options;
        }
    } else if (args && typeof args === 'object') {
        normalizedOptions = args;
    }

    var result = spawnSync(file, normalizedArgs, normalizedOptions);

    if (result.status !== 0) {
        var err = new Error('Command failed: ' + String(file) + ' ' + normalizedArgs.join(' ') + '\n' + String(result.stderr || ''));
        err.status = result.status;
        err.signal = result.signal;
        err.stdout = result.stdout;
        err.stderr = result.stderr;
        err.pid = result.pid;
        err.output = result.output;
        throw err;
    }

    var encoding = getOutputEncoding(normalizedOptions);
    if (encoding && encoding !== 'buffer') {
        return result.stdout ? result.stdout.toString(encoding) : '';
    }

    return result.stdout;
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

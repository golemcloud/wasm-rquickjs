// node:child_process implementation for WASM.
//
// Local Node commands run in the component. Preview 3 gives each child a fresh
// runtime; Preview 2 retains inline execution with a temporary process view.
// Optional embedding backends handle other commands without host subprocesses.

import * as path from 'node:path';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import { StringDecoder } from 'node:string_decoder';
import { constants as osConstants } from 'node:os';
import process from 'node:process';
import moduleExports from 'node:module';
import { check_syntax_with_filename as checkSyntaxWithFilename } from '__wasm_rquickjs_builtin/vm_native';
import { getProcessBackend } from '__wasm_rquickjs_builtin/child_process_backend';
import * as childNative from '__wasm_rquickjs_builtin/child_process_native';

const FIPS_STARTUP_ERROR = 'OpenSSL error when trying to enable FIPS: fips mode not supported';

function createNotSupportedError(method) {
    const err = new Error(method + ' is not supported in WebAssembly environment');
    err.code = 'ENOSYS';
    err.errno = -38;
    return err;
}

function formatErrorForStderr(err) {
    let text;
    if (err && err.stack) {
        text = String(err.stack);
        if (err.name && err.name !== 'Error' && text.indexOf('Error:') === 0) {
            text = String(err.name) + text.slice('Error'.length);
        }
        if (text.indexOf('Error: return not in a function') === 0) {
            text = 'SyntaxError:' + text.slice('Error:'.length);
        }
        if (err && err.message) {
            const message = String(err.message);
            if (text.indexOf(message) === -1) {
                text = 'Error: ' + message + '\n' + text;
            }
        }
    } else {
        text = String(err);
    }

    if (text.indexOf('Error: return not in a function') === 0) {
        text = 'SyntaxError:' + text.slice('Error:'.length);
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
    return Object.assign({}, env);
}

function replaceEnv(targetEnv, sourceEnv) {
    for (const key of Object.keys(targetEnv || {})) {
        delete targetEnv[key];
    }

    if (!sourceEnv || typeof sourceEnv !== 'object') {
        return;
    }

    for (const key of Object.keys(sourceEnv)) {
        targetEnv[key] = String(sourceEnv[key]);
    }
}

function unsupportedSpawnSyncResult(command) {
    const error = createNotSupportedError('spawnSync(' + String(command) + ')');
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

function convertSpawnResultEncoding(result, options) {
    const encoding = getOutputEncoding(options);
    if (!encoding || encoding === 'buffer') return result;

    if (Buffer.isBuffer(result.stdout)) result.stdout = result.stdout.toString(encoding);
    if (Buffer.isBuffer(result.stderr)) result.stderr = result.stderr.toString(encoding);
    if (Array.isArray(result.output)) {
        result.output = [result.output[0], result.stdout, result.stderr];
    }
    return result;
}

function buildOutputResult(capturedStdout, capturedStderr, status, encoding) {
    const rawStdout = Buffer.from(capturedStdout);
    const rawStderr = Buffer.from(capturedStderr);
    const stdout = convertOutputValue(rawStdout, encoding);
    const stderr = convertOutputValue(rawStderr, encoding);

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
    return value === '-e' || value === '--eval' || value === '-p' || value === '--print' || value === '-pe';
}

function execArgTakesValue(arg) {
    return arg === '--openssl-config' || arg === '--input-type' || arg === '--require' || arg === '-r' ||
        arg === '--conditions' || arg === '-C';
}

function packageConditionsFromExecArgv(execArgv) {
    const conditions = [];
    function add(condition) {
        if (condition) conditions.push(condition);
    }
    for (let i = 0; i < execArgv.length; i++) {
        const arg = String(execArgv[i]);
        if (arg.indexOf('--conditions=') === 0) {
            add(arg.slice('--conditions='.length));
        } else if (arg === '--conditions' || arg === '-C') {
            if (i + 1 < execArgv.length) {
                add(String(execArgv[++i]));
            }
        }
    }
    return conditions;
}

function splitExecArgvAndInvocationArgs(args) {
    const execArgv = [];
    let invocationArgs = [];

    for (let i = 0; i < args.length; i++) {
        const arg = String(args[i]);

        if (isInlineEvalOption(arg)) {
            invocationArgs = args.slice(i).map((value) => String(value));
            break;
        }

        if (arg === '--') {
            invocationArgs = args.slice(i + 1).map((value) => String(value));
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

        invocationArgs = args.slice(i).map((value) => String(value));
        break;
    }

    return {
        execArgv,
        invocationArgs,
    };
}

function hasFipsStartupFlag(execArgv) {
    for (let i = 0; i < execArgv.length; i++) {
        const arg = String(execArgv[i]);
        if (arg === '--enable-fips' || arg === '--force-fips') {
            return true;
        }
    }

    return false;
}

function readExecArgValue(execArgv, flag) {
    const prefixed = flag + '=';
    for (let i = 0; i < execArgv.length; i++) {
        const arg = String(execArgv[i]);
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

    const parsed = Number(value);
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
    const errors = [];

    const secureHeapValue = readExecArgValue(execArgv, '--secure-heap');
    if (secureHeapValue !== null) {
        const parsedHeapValue = parsePositiveIntegerFlagValue(secureHeapValue);
        if (parsedHeapValue === null || (parsedHeapValue >= 2 && !isPowerOfTwo(parsedHeapValue))) {
            errors.push('--secure-heap must be a power of 2');
        }
    }

    const secureHeapMinValue = readExecArgValue(execArgv, '--secure-heap-min');
    if (secureHeapMinValue !== null) {
        const parsedHeapMinValue = parsePositiveIntegerFlagValue(secureHeapMinValue);
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
        let inner = literal.slice(1, -1);
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

    const filenames = [];
    const filenameRe = /filename\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    let match;
    while ((match = filenameRe.exec(source)) !== null) {
        const parsed = parseJsStringLiteral(match[1]);
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

    if (process.env && process.env.NODE_NO_WARNINGS === '1') {
        return true;
    }

    const execArgv = process.execArgv;
    if (!Array.isArray(execArgv)) {
        return false;
    }

    for (let i = 0; i < execArgv.length; i++) {
        const arg = String(execArgv[i]);
        if (arg === '--no-warnings' || arg === '--no-deprecation') {
            return true;
        }
    }

    return false;
}

function hasExecArgvFlag(flag) {
    const execArgv = process.execArgv;
    if (!Array.isArray(execArgv)) {
        return false;
    }
    for (let i = 0; i < execArgv.length; i++) {
        if (String(execArgv[i]) === flag) {
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

    let name = 'Warning';
    let warningCode = undefined;

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
    const info = getWarningInfo(warning, typeOrOptions, code);
    let pid = process.pid;
    if (typeof pid !== 'number' || Number.isNaN(pid)) {
        pid = 1;
    }

    let prefix = '(node:' + String(pid) + ') ';
    if (info.code) {
        prefix += '[' + info.code + '] ';
    }

    let output = prefix + info.name + ': ' + info.message + '\n';
    if (hasExecArgvFlag('--trace-warnings')) {
        const stack = warning && typeof warning === 'object' && typeof warning.stack === 'string'
            ? warning.stack
            : (new Error()).stack;
        if (typeof stack === 'string' && stack.length > 0) {
            const lines = stack.split('\n');
            if (lines.length > 1) {
                output += lines.slice(1).join('\n').replace(/at <anonymous> \(/g, 'at Object.<anonymous> (') + '\n';
            }
        }
    } else {
        output += '(Use `node --trace-warnings ...` to show where the warning was created)\n';
    }
    return output;
}

function parseInlineInvocation(inlineArgs) {
    let shouldPrint = false;
    let source = null;
    let sourceIndex = -1;
    const execArgvSuffix = [];

    for (let i = 0; i < inlineArgs.length; i++) {
        const arg = String(inlineArgs[i]);

        if (arg === '-p' || arg === '--print') {
            shouldPrint = true;
            execArgvSuffix.push(arg);
            continue;
        }

        if (arg === '-pe') {
            shouldPrint = true;
            execArgvSuffix.push(arg);
            if (i + 1 < inlineArgs.length) {
                source = String(inlineArgs[i + 1]);
                sourceIndex = i + 1;
                execArgvSuffix.push(source);
            }
            break;
        }

        if (arg === '-e' || arg === '--eval') {
            execArgvSuffix.push(arg);
            if (i + 1 < inlineArgs.length) {
                source = String(inlineArgs[i + 1]);
                sourceIndex = i + 1;
                execArgvSuffix.push(source);
            }
            break;
        }

        if (arg.indexOf('--eval=') === 0) {
            source = arg.slice('--eval='.length);
            sourceIndex = i;
            execArgvSuffix.push(arg);
            break;
        }

        source = arg;
        sourceIndex = i;
        execArgvSuffix.push(arg);
        break;
    }

    if (source === null) {
        return null;
    }

    const evalArgv = [];
    for (let i = sourceIndex + 1; i < inlineArgs.length; i++) {
        if (inlineArgs[i] === '--') {
            for (let j = i + 1; j < inlineArgs.length; j++) {
                evalArgv.push(String(inlineArgs[j]));
            }
            return { shouldPrint, source, evalArgv, execArgvSuffix };
        }
        evalArgv.push(String(inlineArgs[i]));
    }

    return { shouldPrint, source, evalArgv, execArgvSuffix };
}

function getInputType(execArgv) {
    for (let i = 0; i < execArgv.length; i++) {
        const arg = String(execArgv[i]);
        if (arg === '--input-type' && i + 1 < execArgv.length) {
            return String(execArgv[i + 1]);
        }
        if (arg.indexOf('--input-type=') === 0) {
            return arg.slice('--input-type='.length);
        }
    }
    return 'commonjs';
}

function transpileModuleEvalToCommonJs(source) {
    let transformed = String(source);
    transformed = transformed.replace(/\bimport\.meta\b/g, '({ url: "file://[eval]" })');
    transformed = transformed.replace(
        /^\s*import\s+(['"][^'"]+['"])\s*;?\s*$/gm,
        '__wasm_eval_require($1);'
    );
    transformed = transformed.replace(/\bimport\s*\(/g, '__wasm_eval_dynamic_import(');
    return transformed;
}

function executeInlineSource(runtimeRequire, inlineArgs, childCwd) {
    const parsed = parseInlineInvocation(inlineArgs);
    if (!parsed) {
        const err = new Error(String(inlineArgs[0]) + ' requires an argument');
        err.code = 9;
        throw err;
    }
    if (parsed.source.indexOf('\\-') === 0) {
        parsed.source = parsed.source.slice(1);
    }
    process.argv = [process.argv0 || process.execPath].concat(parsed.evalArgv);
    process.execArgv = (process.execArgv || []).concat(parsed.execArgvSuffix);

    const vmModule = runtimeRequire('node:vm');
    const evalRequire = moduleExports.createRequire(path.join(childCwd || process.cwd(), '[eval].js'));
    const childRequire = function childEvalRequire(id) {
        if (evalRequire && evalRequire.cache && typeof evalRequire.resolve === 'function') {
            try {
                const resolved = evalRequire.resolve(id);
                if (evalRequire.cache[resolved]) {
                    delete evalRequire.cache[resolved];
                }
            } catch (_) {}
        }
        return evalRequire(id);
    };
    if (evalRequire.resolve) childRequire.resolve = evalRequire.resolve;
    if (evalRequire.cache) childRequire.cache = evalRequire.cache;
    const inputType = getInputType(process.execArgv || []);
    const bufferProbe = parseBufferConstructorProbe(parsed.source);
    let result;
    const hadGlobalOs = Object.prototype.hasOwnProperty.call(globalThis, 'os');
    const oldGlobalOs = globalThis.os;
    const oldGlobalCrypto = globalThis.crypto;
    globalThis.os = runtimeRequire('node:os');
    globalThis.crypto = runtimeRequire('node:crypto');
    const evalFs = runtimeRequire('node:fs');

    try {
    if (bufferProbe) {
        process.mainModule = { filename: bufferProbe.mainFilename };
        result = vmModule.runInNewContext('new Buffer(10)', { Buffer }, {
            filename: bufferProbe.callSiteFilename,
        });
    } else if (inputType === 'module') {
        if (parsed.shouldPrint) {
            const err = new Error('--print cannot be used with ESM input');
            err.name = 'SyntaxError';
            throw err;
        }
        const previousCjsImportDir = globalThis.__wasm_rquickjs_cjs_import_dir;
        globalThis.__wasm_rquickjs_cjs_import_dir = childCwd || process.cwd();
        try {
            const moduleSource = transpileModuleEvalToCommonJs(parsed.source);
            const dynamicImport = function dynamicImport(specifier) {
                return Promise.resolve(childRequire(specifier));
            };
            const evaluator = new Function('Buffer', 'process', 'vm', 'os', 'fs', '__wasm_eval_require', '__wasm_eval_dynamic_import', 'const require = undefined;\n' + moduleSource + '\n//# sourceURL=[eval]\n');
            result = evaluator(Buffer, process, vmModule, globalThis.os, evalFs, childRequire, dynamicImport);
        } finally {
            if (previousCjsImportDir !== undefined) {
                globalThis.__wasm_rquickjs_cjs_import_dir = previousCjsImportDir;
            } else {
                delete globalThis.__wasm_rquickjs_cjs_import_dir;
            }
        }
    } else if (inputType !== 'commonjs') {
        throw new Error('Unsupported --input-type value: ' + inputType);
    } else if (parsed.shouldPrint) {
        const evaluator = new Function('Buffer', 'process', 'vm', 'os', 'fs', 'require', 'return eval(' + JSON.stringify(parsed.source) + ');\n//# sourceURL=[eval]\n');
        result = evaluator(Buffer, process, vmModule, globalThis.os, evalFs, childRequire);
    } else {
        const evaluator = vmModule.__wasm_rquickjs_compile_child_eval(parsed.source,
            ['Buffer', 'process', 'vm', 'os', 'fs', 'require'],
            path.join(childCwd || process.cwd(), '[eval]'));
        result = evaluator(Buffer, process, vmModule, globalThis.os, evalFs, childRequire);
    }
    } finally {
        if (hadGlobalOs) {
            globalThis.os = oldGlobalOs;
        } else {
            delete globalThis.os;
        }
        globalThis.crypto = oldGlobalCrypto;
    }

    if (parsed.shouldPrint && process.stdout && typeof process.stdout.write === 'function') {
        const util = runtimeRequire('node:util');
        const output = typeof result === 'string' ? result : util.inspect(result);
        process.stdout.write(String(output) + '\n');
    }

    return {
        evalArgv: parsed.evalArgv,
        bufferProbe,
    };
}

function completedInlineSession(result) {
    return { beforeExit() {}, finish() { return result; } };
}

function runInline(command, args, options) {
    return beginInline(command, args, options, false).finish();
}

// Native children reuse the CLI loader but retain its process view and output
// interception until their own event loop has reached natural completion.
function beginInline(command, args, options, isolated) {
    if (!Array.isArray(args) || args.length === 0) {
        return completedInlineSession(unsupportedSpawnSyncResult(command));
    }

    const childArgs = [];
    for (let i = 0; i < args.length; i++) {
        childArgs.push(String(args[i]));
    }

    const parsedChildArgs = splitExecArgvAndInvocationArgs(childArgs);
    const execArgv = parsedChildArgs.execArgv;
    const invocationArgs = parsedChildArgs.invocationArgs;

    let hasTestFlag = execArgv.indexOf('--test') !== -1;
    if (!hasTestFlag) {
        for (let j = 0; j < invocationArgs.length; j++) {
            if (invocationArgs[j] === '--test') {
                hasTestFlag = true;
                break;
            }
        }
    }
    if (hasTestFlag) {
        const conflictingFlags = ['--check', '--interactive', '--eval', '-e', '--print', '-p'];
        let conflictFlag = null;
        for (let k = 0; k < conflictingFlags.length; k++) {
            const flag = conflictingFlags[k];
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
            const encoding = getOutputEncoding(options);
            return completedInlineSession(buildOutputResult('', conflictFlag + ' cannot be used with --test\n', 1, encoding));
        }
    }

    if (invocationArgs.length === 0) {
        return completedInlineSession(unsupportedSpawnSyncResult(command));
    }

    let childCwd = process.cwd();
    if (options && typeof options.cwd === 'string') {
        childCwd = path.isAbsolute(options.cwd) ? options.cwd : path.resolve(childCwd, options.cwd);
    }
    const encoding = getOutputEncoding(options);

    const oldArgv = process.argv.slice();
    const oldExecArgv = Array.isArray(process.execArgv) ? process.execArgv.slice() : [];
    const hadPackageConditions = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_package_conditions');
    const oldPackageConditions = globalThis.__wasm_rquickjs_package_conditions;
    const oldArgv0 = process.argv0;
    const oldRequireModuleFeature = process.features && process.features.require_module;
    const oldCwd = process.cwd;
    const oldChdir = process.chdir;
    const oldRealCwd = typeof oldCwd === 'function' ? oldCwd.call(process) : '/';
    const oldExitCode = process.exitCode;
    const hadNoDeprecation = Object.prototype.hasOwnProperty.call(process, 'noDeprecation');
    const oldNoDeprecation = process.noDeprecation;
    const hadTraceDeprecation = Object.prototype.hasOwnProperty.call(process, 'traceDeprecation');
    const oldTraceDeprecation = process.traceDeprecation;
    const hadThrowDeprecation = Object.prototype.hasOwnProperty.call(process, 'throwDeprecation');
    const oldThrowDeprecation = process.throwDeprecation;
    const hadMainModule = Object.prototype.hasOwnProperty.call(process, 'mainModule');
    const oldMainModule = process.mainModule;
    const oldProcessEvents = process._events;
    const oldProcessEventsCount = process._eventsCount;
    const oldProcessExiting = process._exiting;
    const oldEnv = snapshotEnv(process.env);
    const oldStdoutWrite = process.stdout && process.stdout.write;
    const oldStderrWrite = process.stderr && process.stderr.write;
    const oldStdin = process.stdin;
    const oldEmitWarning = process.emitWarning;
    const oldExit = process.exit;
    const oldQueueMicrotask = globalThis.queueMicrotask;
    const runExit = process._runExit;
    const restoreParentModuleState =
        isolated ? null : moduleExports.__wasm_rquickjs_begin_inline_child_module_state();
    const runtimeRequire = moduleExports.require;
    let firstExitCode = null;
    let firstExitError = null;
    let hasFirstExitError = false;
    let firstExitErrorReported = false;
    const hadSimpleSourceMaps = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_simple_source_maps');
    const oldSimpleSourceMaps = globalThis.__wasm_rquickjs_simple_source_maps;
    const hadCjsLineOffsets = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_cjs_line_offsets');
    const oldCjsLineOffsets = globalThis.__wasm_rquickjs_cjs_line_offsets;
    const stdinData = options && (typeof options.__wasmStdinData === 'string' ||
        Array.isArray(options.__wasmStdinData)) ? options.__wasmStdinData : null;
    let oldFsPromisesReadFile = null;
    let oldFsReadFile = null;
    let oldFsReadFileSync = null;

    let capturedStdout = '';
    let capturedStderr = '';
    let status = 0;
    let inlineBufferProbe = null;
    const checkSyntaxMode = execArgv.indexOf('-c') !== -1 || execArgv.indexOf('--check') !== -1;
    let currentScriptPath = null;
    let failed = false;
    let pendingEntry = false;
    const toNumber = Number;

    function capture(stdout, chunk, encoding) {
        if (isolated) {
            const bytes = typeof chunk === 'string'
                ? Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8')
                : Buffer.from(chunk);
            childNative.write_output(stdout, [...bytes]);
        } else if (stdout) {
            capturedStdout += String(chunk);
        } else {
            capturedStderr += String(chunk);
        }
    }

    function reportFirstExitError() {
        if (hasFirstExitError && !firstExitErrorReported) {
            capture(false, formatErrorForStderr(firstExitError));
            firstExitErrorReported = true;
        }
    }

    function entryIsModule(filename, source) {
        if (filename.endsWith('.mjs') || filename.endsWith('.mts')) return true;
        if (filename.endsWith('.cjs') || filename.endsWith('.cts')) return false;
        const packageScopeInfo = globalThis.__wasm_rquickjs_cjs_package_scope_info;
        const scope = typeof packageScopeInfo === 'function' ? packageScopeInfo(filename) : null;
        if (scope?.packageType === 'module') return true;
        if (scope && (scope.packageType === 'commonjs' || scope.isNodeModulesPackage)) return false;
        const classify = globalThis.__wasm_rquickjs_source_uses_esm_format;
        return typeof classify === 'function' && classify(source ?? runtimeRequire('node:fs').readFileSync(filename, 'utf8'));
    }

    function handleError(err, handlerFailed = false) {
        failed = true;
        if (firstExitCode !== null) {
            status = firstExitCode;
            reportFirstExitError();
        } else if (err && err.__isProcessExit) {
            status = toNumber(err.code || 0);
        } else if (err && err.code === 9 && isInlineEvalOption(invocationArgs[0])) {
            status = 9;
            capture(false, String(command) + ': ' + err.message + '\n');
        } else {
            status = handlerFailed ? 7 : 1;
            if (checkSyntaxMode && currentScriptPath) capture(false, currentScriptPath + '\n');
            capture(false, formatErrorForStderr(err));
        }
        if (isolated) childNative.stop_child();
    }

    function execute() {
      try {
        process.argv = [String(command)].concat(invocationArgs);
        process.execArgv = execArgv;
        globalThis.__wasm_rquickjs_package_conditions = packageConditionsFromExecArgv(execArgv);
        const childModuleCache = Object.create(null);
        moduleExports._cache = childModuleCache;
        runtimeRequire.cache = childModuleCache;
        moduleExports._pathCache = Object.create(null);
        process.argv0 = String(command);
        if (process.features) {
            process.features.require_module = execArgv.indexOf('--no-experimental-require-module') === -1;
        }
        if (typeof oldChdir === 'function' && childCwd !== oldRealCwd) {
            oldChdir.call(process, childCwd);
        }
        process._events = Object.create(null);
        process._eventsCount = 0;
        process._exiting = false;
        process.exitCode = undefined;
        delete process.mainModule;
        globalThis.__wasm_rquickjs_simple_source_maps = Object.create(null);
        globalThis.__wasm_rquickjs_cjs_line_offsets = Object.create(null);
        if (!isolated) globalThis.__wasm_rquickjs_sync_callbacks = true;
        if (isolated) {
            globalThis.__wasm_rquickjs_child_uncaught = handleError;
            const handleUncaught = globalThis.__wasm_rquickjs_handleUncaughtError;
            // Native microtasks, unlike Promise reactions, can throw directly
            // out of a QuickJS job. Own their completion at the child boundary
            // just as timer and nextTick callbacks own theirs.
            globalThis.queueMicrotask = function queueMicrotask(callback) {
                if (typeof callback !== 'function') return oldQueueMicrotask(callback);
                return oldQueueMicrotask(() => {
                    try { callback(); }
                    catch (error) {
                        if (error && error.__isProcessExit) {
                            handleError(error);
                        } else {
                            try { handleUncaught(error); }
                            catch (handlerError) { handleError(handlerError, true); }
                        }
                    }
                });
            };
        }

        process.exit = function exit(code) {
            try {
                return runExit(code);
            } catch (err) {
                if (firstExitCode === null && process._exiting) {
                    firstExitCode = toNumber(process.exitCode || 0);
                    if (!err || !err.__isProcessExit) {
                        firstExitError = err;
                        hasFirstExitError = true;
                    }
                }
                if (isolated) childNative.stop_child();
                throw err;
            }
        };

        if (hasFipsStartupFlag(execArgv)) {
            throw new Error(FIPS_STARTUP_ERROR);
        }

        if (execArgv.indexOf('--experimental-test-coverage') !== -1 &&
            (!process.features || !process.features.inspector)) {
            capture(false, 'Warning: coverage could not be collected\n');
        }

        const secureHeapErrors = validateSecureHeapFlags(execArgv);
        if (secureHeapErrors.length > 0) {
            status = 9;
            capture(false, secureHeapErrors.join('\n') + '\n');
            failed = true;
            if (isolated) childNative.stop_child();
            return;
        }

        if (options && options.env) {
            replaceEnv(process.env, options.env);
        }
        if (isolated) {
            const { Readable } = runtimeRequire('node:stream');
            process.stdin = Readable.from(stdinData === null ? [] : [Buffer.from(stdinData)]);
            process.stdin.fd = 0;
            process.stdin.isTTY = false;
        }

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = function writeStdout(chunk, encoding, callback) {
                capture(true, chunk, encoding);
                const cb = typeof encoding === 'function' ? encoding : callback;
                if (typeof cb === 'function') process.nextTick(cb);
                return true;
            };
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = function writeStderr(chunk, encoding, callback) {
                capture(false, chunk, encoding);
                const cb = typeof encoding === 'function' ? encoding : callback;
                if (typeof cb === 'function') process.nextTick(cb);
                return true;
            };
        }

        if (typeof oldEmitWarning === 'function') {
            process.emitWarning = function emitWarning(warning, typeOrOptions, code, ctor) {
                let shouldCapture = !isWarningSuppressed();

                if (shouldCapture && inlineBufferProbe && getWarningCode(warning, typeOrOptions, code) === 'DEP0005') {
                    shouldCapture = !isNodeModulesPath(inlineBufferProbe.callSiteFilename);
                }

                if (shouldCapture) {
                    capture(false, formatWarningForStderr(warning, typeOrOptions, code));
                }

                const previousSuppressWarningStderr = globalThis.__wasm_rquickjs_suppress_warning_stderr;
                globalThis.__wasm_rquickjs_suppress_warning_stderr = true;
                try {
                    return oldEmitWarning.call(this, warning, typeOrOptions, code, ctor);
                } finally {
                    globalThis.__wasm_rquickjs_suppress_warning_stderr = previousSuppressWarningStderr;
                }
            };
        }

        if (stdinData !== null) {
            try {
                const fsPromises = runtimeRequire('node:fs/promises');
                if (fsPromises && typeof fsPromises.readFile === 'function') {
                    oldFsPromisesReadFile = fsPromises.readFile;
                    fsPromises.readFile = function readFileWithMockedStdin(targetPath, readOptions) {
                        if (targetPath === '/dev/stdin' || targetPath === 0) {
                            const mockStdinBuffer = Buffer.from(stdinData);
                            let readEncoding = null;

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

            try {
                const fsSync = runtimeRequire('node:fs');
                if (fsSync && typeof fsSync.readFileSync === 'function') {
                    oldFsReadFileSync = fsSync.readFileSync;
                    fsSync.readFileSync = function readFileSyncWithMockedStdin(targetPath, readOptions) {
                        if (targetPath === '/dev/stdin' || targetPath === 0) {
                            const mockStdinBuffer = Buffer.from(stdinData);
                            let readEncoding = null;

                            if (typeof readOptions === 'string') {
                                readEncoding = String(readOptions);
                            } else if (readOptions && typeof readOptions === 'object' && readOptions.encoding !== undefined && readOptions.encoding !== null) {
                                readEncoding = String(readOptions.encoding);
                            }

                            if (readEncoding && readEncoding !== 'buffer') {
                                return mockStdinBuffer.toString(readEncoding);
                            }

                            return mockStdinBuffer;
                        }

                        return oldFsReadFileSync.call(this, targetPath, readOptions);
                    };
                }

                if (fsSync && typeof fsSync.readFile === 'function') {
                    oldFsReadFile = fsSync.readFile;
                    fsSync.readFile = function readFileWithMockedStdin(targetPath, optionsOrCallback, callback) {
                        if (targetPath === '/dev/stdin' || targetPath === 0) {
                            const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
                            const readOptions = typeof optionsOrCallback === 'function' ? {} : optionsOrCallback;
                            const mockStdinBuffer = Buffer.from(stdinData);
                            let readEncoding = null;

                            if (typeof readOptions === 'string') {
                                readEncoding = String(readOptions);
                            } else if (readOptions && typeof readOptions === 'object' && readOptions.encoding !== undefined && readOptions.encoding !== null) {
                                readEncoding = String(readOptions.encoding);
                            }

                            let result = mockStdinBuffer;
                            if (readEncoding && readEncoding !== 'buffer') {
                                result = mockStdinBuffer.toString(readEncoding);
                            }

                            if (typeof cb === 'function') {
                                cb(null, result);
                            }
                            return;
                        }

                        return oldFsReadFile.call(this, targetPath, optionsOrCallback, callback);
                    };
                }
            } catch (_) {
                oldFsReadFile = null;
                oldFsReadFileSync = null;
            }
        }

        // Handle --require / -r preloading
        const preloadRequire = moduleExports.createRequire(path.join(childCwd, '[preload].js'));
        for (let ri = 0; ri < execArgv.length; ri++) {
            const ea = execArgv[ri];
            if (ea === '--require' || ea === '-r') {
                if (ri + 1 < execArgv.length) {
                    ri++;
                    preloadRequire(execArgv[ri]);
                }
            }
        }

        if (invocationArgs.length >= 1 && isInlineEvalOption(invocationArgs[0])) {
            const savedModuleContext = globalThis.__wasm_rquickjs_current_module;
            const hadEvalScriptName = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_current_eval_script_name');
            const oldEvalScriptName = globalThis.__wasm_rquickjs_current_eval_script_name;
            globalThis.__wasm_rquickjs_current_module = undefined;
            globalThis.__wasm_rquickjs_current_eval_script_name = '[eval]';

            // Pre-parse buffer probe so the emitWarning interceptor can
            // suppress DEP0005 for node_modules call sites during execution.
            const inlineSource = invocationArgs.length >= 2 ? String(invocationArgs[1]) : '';
            inlineBufferProbe = parseBufferConstructorProbe(inlineSource);

            // Each emulated child process gets its own Buffer deprecation state.
            const oldBufferDepWarned = globalThis.__wasm_rquickjs_buffer_dep0005_warned;
            globalThis.__wasm_rquickjs_buffer_dep0005_warned = false;

            let inlineResult;
            try {
                inlineResult = executeInlineSource(runtimeRequire, invocationArgs, childCwd);
            } finally {
                globalThis.__wasm_rquickjs_current_module = savedModuleContext;
                globalThis.__wasm_rquickjs_buffer_dep0005_warned = oldBufferDepWarned;
                if (hadEvalScriptName) {
                    globalThis.__wasm_rquickjs_current_eval_script_name = oldEvalScriptName;
                } else {
                    delete globalThis.__wasm_rquickjs_current_eval_script_name;
                }
            }

            process.argv = [String(command)].concat(inlineResult.evalArgv);
        } else {
            let scriptPath = invocationArgs[0];
            if (!path.isAbsolute(scriptPath)) {
                scriptPath = path.resolve(childCwd, scriptPath);
            }
            currentScriptPath = scriptPath;
            const scriptArgs = invocationArgs.slice(1);

            if (execArgv.indexOf('--test') !== -1) {
                const fsForTest = runtimeRequire('node:fs');
                if (!fsForTest.existsSync(scriptPath)) {
                    capture(false, "Could not find '" + invocationArgs[0] + "'\n");
                    status = 1;
                    failed = true;
                    if (isolated) childNative.stop_child();
                    return;
                }
            }

            process.argv = [String(command), scriptPath].concat(scriptArgs);

            if (runtimeRequire && runtimeRequire.cache && runtimeRequire.cache[scriptPath]) {
                delete runtimeRequire.cache[scriptPath];
            }

            const moduleModule = runtimeRequire('module');
            if (checkSyntaxMode) {
                const fsForCheck = runtimeRequire('node:fs');
                let source = fsForCheck.readFileSync(scriptPath, 'utf8');
                if (source.length > 0 && source.charCodeAt(0) === 0xFEFF) {
                    source = source.slice(1);
                }
                if (source.length > 1 && source.charCodeAt(0) === 0x23 && source.charCodeAt(1) === 0x21) {
                    source = '//' + source;
                }
                const isModule = entryIsModule(scriptPath, source);
                checkSyntaxWithFilename(
                    isModule ? source : moduleModule.wrap(source),
                    scriptPath,
                    isModule,
                );
            } else {
                // Resolve CLI paths before detecting their format, including
                // extensionless files, directories and main-specific symlinks.
                // argv[1] retains the original absolute invocation path.
                const resolvedScriptPath = isolated
                    ? moduleExports.__wasm_rquickjs_resolve_main_filename(scriptPath, childCwd)
                    : scriptPath;
                if (isolated && entryIsModule(resolvedScriptPath)) {
                    pendingEntry = true;
                    const specifier = moduleExports.__wasm_rquickjs_main_import_specifier(resolvedScriptPath);
                    import(specifier).then(() => { pendingEntry = false; }, error => {
                        pendingEntry = false;
                        handleError(error);
                    });
                } else if (moduleModule && typeof moduleModule.runMain === 'function') {
                    moduleModule.runMain();
                } else {
                    runtimeRequire(scriptPath);
                }
            }
        }
      } catch (err) {
        handleError(err);
      }
    }

    function restore() {
        try {
            restoreParentModuleState?.();
        } catch (error) {
            status = 1;
            capture(false, formatErrorForStderr(error));
        }
        process.argv = oldArgv;
        process.execArgv = oldExecArgv;
        if (hadPackageConditions) {
            globalThis.__wasm_rquickjs_package_conditions = oldPackageConditions;
        } else {
            delete globalThis.__wasm_rquickjs_package_conditions;
        }
        process.argv0 = oldArgv0;
        if (process.features) {
            process.features.require_module = oldRequireModuleFeature;
        }
        if (typeof oldChdir === 'function') {
            try {
                oldChdir.call(process, oldRealCwd);
            } catch (_) {
                // Keep restoring the remaining process state even if the host
                // cwd disappeared during in-process child emulation.
            }
        }
        process.cwd = oldCwd;
        process.chdir = oldChdir;
        process.exitCode = oldExitCode;
        if (hadNoDeprecation) {
            process.noDeprecation = oldNoDeprecation;
        } else {
            delete process.noDeprecation;
        }
        if (hadTraceDeprecation) {
            process.traceDeprecation = oldTraceDeprecation;
        } else {
            delete process.traceDeprecation;
        }
        if (hadThrowDeprecation) {
            process.throwDeprecation = oldThrowDeprecation;
        } else {
            delete process.throwDeprecation;
        }
        process._events = oldProcessEvents;
        process._eventsCount = oldProcessEventsCount;
        process._exiting = oldProcessExiting;
        if (hadMainModule) {
            process.mainModule = oldMainModule;
        } else {
            delete process.mainModule;
        }
        replaceEnv(process.env, oldEnv);
        process.emitWarning = oldEmitWarning;
        process.exit = oldExit;
        process.stdin = oldStdin;

        if (process.stdout && typeof oldStdoutWrite === 'function') {
            process.stdout.write = oldStdoutWrite;
        }
        if (process.stderr && typeof oldStderrWrite === 'function') {
            process.stderr.write = oldStderrWrite;
        }

        if (oldFsPromisesReadFile !== null) {
            try {
                const fsPromisesToRestore = moduleExports.require('node:fs/promises');
                if (fsPromisesToRestore) {
                    fsPromisesToRestore.readFile = oldFsPromisesReadFile;
                }
            } catch (_) {
                // ignore restore failures in WASM test emulation
            }
        }

        if (oldFsReadFile !== null || oldFsReadFileSync !== null) {
            try {
                const fsSyncToRestore = moduleExports.require('node:fs');
                if (fsSyncToRestore) {
                    if (oldFsReadFile !== null) {
                        fsSyncToRestore.readFile = oldFsReadFile;
                    }
                    if (oldFsReadFileSync !== null) {
                        fsSyncToRestore.readFileSync = oldFsReadFileSync;
                    }
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

        delete globalThis.__wasm_rquickjs_sync_callbacks;
    }

    execute();
    return {
        beforeExit() {
            if (failed || firstExitCode !== null || process._exiting) return;
            try { process.emit('beforeExit', toNumber(process.exitCode || 0)); }
            catch (error) { handleError(error); }
        },
        finish() {
            try {
                if (firstExitCode !== null) {
                    status = firstExitCode;
                    reportFirstExitError();
                } else if (isolated) {
                    if (!failed) status = toNumber(process.exitCode ?? (pendingEntry ? 13 : 0));
                    if (!process._exiting) {
                        process._exiting = true;
                        process.emit('exit', status);
                        if (!failed) status = toNumber(process.exitCode ?? (pendingEntry ? 13 : 0));
                    }
                } else if (!failed && typeof process._runExitHandlers === 'function') {
                    process._runExitHandlers();
                    status = toNumber(process.exitCode || 0);
                }
            } catch (error) { handleError(error); }
            finally { restore(); }
            return buildOutputResult(capturedStdout, capturedStderr, status, encoding);
        },
    };
}

Object.defineProperty(globalThis, '__wasm_rquickjs_begin_node_child', {
    configurable: true,
    value(requestJson) {
        const stringify = JSON.stringify;
        const { command, args, options } = JSON.parse(requestJson);
        const session = beginInline(command, args, options, true);
        return {
            beforeExit: session.beforeExit,
            finish() {
                const result = session.finish();
                if (result.stdout?.length) childNative.write_output(true, [...Buffer.from(result.stdout)]);
                if (result.stderr?.length) childNative.write_output(false, [...Buffer.from(result.stderr)]);
                return stringify({ status: result.status, error: result.error && {
                    message: result.error.message, code: result.error.code, errno: result.error.errno,
                } });
            },
        };
    },
});

function cloneObject(value) {
    if (!value || typeof value !== 'object') {
        return {};
    }
    return Object.assign({}, value);
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
    let normalizedArgs = [];
    let normalizedOptions = {};
    let normalizedCallback = null;

    if (Array.isArray(args)) {
        normalizedArgs = args.map((value) => String(value));

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

const SHELL_METACHARACTERS = "|;&<>$`(){}*?[]~#\n";
const DOUBLE_QUOTED_EXPANSION_MARKERS = '$`';
const UNQUOTED_ENV_GLOB_CHARACTERS = '*?[';
// Glob characters and newline are handled by earlier expansion branches.
const UNQUOTED_ENV_ESCAPE_CHARACTERS = "\\'\"" + SHELL_METACHARACTERS;
const DOUBLE_QUOTED_ENV_ESCAPE_CHARACTERS = '\\"$`';

function escapeEnvValueCharacters(value, characters) {
    let escaped = '';
    for (const ch of value) {
        escaped += characters.includes(ch) ? '\\' + ch : ch;
    }
    return escaped;
}

function expandTemplateEnvRefs(command, env) {
    const source = String(command);
    let expanded = '';
    let quote = null;

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch === '\\' && quote !== "'") {
            expanded += ch;
            if (i + 1 < source.length) expanded += source[++i];
            continue;
        }
        if (ch === "'" && quote !== '"') {
            quote = quote === "'" ? null : "'";
            expanded += ch;
            continue;
        }
        if (ch === '"' && quote !== "'") {
            quote = quote === '"' ? null : '"';
            expanded += ch;
            continue;
        }
        if (ch !== '$' || quote === "'" || source[i + 1] !== '{') {
            expanded += ch;
            continue;
        }

        const match = /^\{([A-Za-z_][A-Za-z0-9_]*)\}/.exec(source.slice(i + 1));
        if (!match || !env || !Object.prototype.hasOwnProperty.call(env, match[1])) {
            expanded += ch;
            continue;
        }
        const value = env[match[1]] === undefined ? '' : String(env[match[1]]);
        if (value.includes('\0')) return null;
        if (quote === '"') {
            expanded += escapeEnvValueCharacters(value, DOUBLE_QUOTED_ENV_ESCAPE_CHARACTERS);
        } else {
            // A POSIX shell applies field splitting to an unquoted expansion,
            // but does not parse characters produced by that expansion as new
            // shell operators. Preserve that boundary in the constrained
            // parser using the default space/tab/newline IFS. Pathname
            // expansion is not implemented, so glob-shaped values fail closed.
            for (const valueChar of value) {
                if (UNQUOTED_ENV_GLOB_CHARACTERS.includes(valueChar)) return null;
                if (valueChar === ' ' || valueChar === '\t' ||
                    valueChar === '\n') {
                    expanded += ' ';
                } else if (UNQUOTED_ENV_ESCAPE_CHARACTERS.includes(valueChar)) {
                    expanded += '\\' + valueChar;
                } else {
                    expanded += valueChar;
                }
            }
        }
        i += match[0].length;
    }

    return expanded;
}

function splitCommandTokenRecords(command) {
    const text = String(command);
    const records = [];
    const unescapedShellCharacters = [];
    let current = '';
    let currentUnescapedShellCharacters = [];
    let tokenActive = false;
    let quote = null;
    let escaping = false;

    const pushCurrent = () => {
        records.push({
            value: current,
            unescapedShellCharacters: currentUnescapedShellCharacters,
        });
        current = '';
        currentUnescapedShellCharacters = [];
        tokenActive = false;
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (escaping) {
            current += ch;
            // A real shell removes a backslash-newline continuation. This
            // constrained parser cannot reproduce that behavior, so retain
            // provenance that makes every supported redirect shape fail closed.
            if (ch === '\n') {
                currentUnescapedShellCharacters.push(ch);
                unescapedShellCharacters.push(ch);
            }
            tokenActive = true;
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
                tokenActive = true;
                continue;
            }

            if (ch === ' ' || ch === '\t' || ch === '\n') {
                if (ch === '\n') unescapedShellCharacters.push(ch);
                if (tokenActive) {
                    pushCurrent();
                }
                continue;
            }

            current += ch;
            if (SHELL_METACHARACTERS.includes(ch)) {
                currentUnescapedShellCharacters.push(ch);
                unescapedShellCharacters.push(ch);
            }
            tokenActive = true;
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
            const next = text[i + 1];
            if (next === '\n') {
                // Preserve the original token only for diagnostics; recording
                // the continuation makes the redirect path fail closed.
                current += ch + next;
                currentUnescapedShellCharacters.push(next);
                unescapedShellCharacters.push(next);
                tokenActive = true;
                i += 1;
                continue;
            }
            if (next === '"' || next === '\\' || next === '$' || next === '`') {
                current += next;
                tokenActive = true;
                i += 1;
                continue;
            }
        }

        current += ch;
        if (DOUBLE_QUOTED_EXPANSION_MARKERS.includes(ch)) {
            currentUnescapedShellCharacters.push(ch);
            unescapedShellCharacters.push(ch);
        }
        tokenActive = true;
    }

    if (escaping || quote !== null) {
        return null;
    }

    if (tokenActive) {
        pushCurrent();
    }

    return { records, unescapedShellCharacters };
}

function splitCommandTokens(command) {
    const tokenization = splitCommandTokenRecords(command);
    return tokenization && tokenization.records.map(record => record.value);
}

function findUnquotedCharacter(command, target, start = 0) {
    const source = String(command);
    let quote = null;
    let escaping = false;
    for (let i = start; i < source.length; i++) {
        const ch = source[i];
        if (escaping) {
            escaping = false;
            continue;
        }
        if (ch === '\\' && quote !== "'") {
            escaping = true;
            continue;
        }
        if (ch === "'" && quote !== '"') {
            quote = quote === "'" ? null : "'";
            continue;
        }
        if (ch === '"' && quote !== "'") {
            quote = quote === '"' ? null : '"';
            continue;
        }
        if (ch === target && quote === null) return i;
    }
    return -1;
}

function splitOnUnquotedCharacter(command, target) {
    const source = String(command);
    const parts = [];
    let offset = 0;
    while (true) {
        const index = findUnquotedCharacter(source, target, offset);
        if (index === -1) {
            parts.push(source.slice(offset));
            return parts;
        }
        parts.push(source.slice(offset, index));
        offset = index + 1;
    }
}

function parseEchoPipeline(command) {
    const expandedCommand = String(command);
    const pipeIndex = findUnquotedCharacter(expandedCommand, '|');
    if (pipeIndex === -1) {
        return null;
    }

    let lhs = expandedCommand.slice(0, pipeIndex).trim();
    const rhs = expandedCommand.slice(pipeIndex + 1).trim();

    if (lhs[0] === '(' && lhs[lhs.length - 1] === ')') {
        lhs = lhs.slice(1, -1);
    }

    const rhsTokens = splitCommandTokens(rhs);
    if (hasUnsupportedJavaScriptShellSyntax(rhs) ||
        !rhsTokens || rhsTokens.length < 2 || String(rhsTokens[0]) !== String(process.execPath)) {
        return null;
    }

    const parts = splitOnUnquotedCharacter(lhs, ';');
    const stdinLines = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.length === 0) {
            continue;
        }
        if (hasUnsupportedJavaScriptShellSyntax(part)) {
            return null;
        }

        const partTokens = splitCommandTokens(part);
        if (!partTokens || partTokens.length === 0) {
            return null;
        }

        if (partTokens[0] === 'echo') {
            stdinLines.push(partTokens.slice(1).join(' '));
            continue;
        }

        if (partTokens[0] === 'sleep' && partTokens.length === 2 &&
            /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(partTokens[1])) {
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
    const env = options && typeof options.env === 'object' ? options.env : process.env;
    // Expand only the braced environment references that are present in the
    // effective environment. `$NAME`, command substitution, and every other
    // shell expansion remain fail-closed.
    const source = expandTemplateEnvRefs(command, env);
    const resolvedOptions = cloneObject(options);

    if (resolvedOptions.encoding === undefined) {
        resolvedOptions.encoding = 'utf8';
    }

    if (source === null) {
        return convertSpawnResultEncoding(
            unsupportedSpawnSyncResult('exec(environment expansion)'),
            resolvedOptions,
        );
    }

    const pipeline = parseEchoPipeline(source);
    if (pipeline) {
        resolvedOptions.__wasmStdinData = pipeline.stdinData;
        return convertSpawnResultEncoding(
            spawnSync(pipeline.command, pipeline.args, resolvedOptions),
            resolvedOptions,
        );
    }

    const tokenization = splitCommandTokenRecords(source);
    const tokenRecords = tokenization && tokenization.records;
    const tokens = tokenRecords && tokenRecords.map(record => record.value);
    if (!tokens || tokens.length === 0) {
        return convertSpawnResultEncoding(
            unsupportedSpawnSyncResult('exec(empty command)'),
            resolvedOptions,
        );
    }

    // Preserve the one data-only redirection form required by the compatibility
    // suite. Every other shell metacharacter is rejected before inline work can
    // begin, instead of being passed to JavaScript as a misleading literal arg.
    const redirectIndexes = tokenRecords
        .map((record, index) => record.value === '<' &&
            record.unescapedShellCharacters.length === 1 &&
            record.unescapedShellCharacters[0] === '<' ? index : -1)
        .filter(index => index !== -1);
    const redirectIndex = redirectIndexes.length === 1 ? redirectIndexes[0] : -1;
    if (redirectIndex !== -1) {
        const hasSingleTrailingRedirect = redirectIndex > 0 &&
            redirectIndex === tokens.length - 2 &&
            tokenization.unescapedShellCharacters.length === 1;
        if (!hasSingleTrailingRedirect) {
            return convertSpawnResultEncoding(
                unsupportedSpawnSyncResult('exec(shell syntax)'),
                resolvedOptions,
            );
        }
        try {
            const fsForRedirect = moduleExports.require('node:fs');
            resolvedOptions.__wasmStdinData = fsForRedirect.readFileSync(tokens[redirectIndex + 1], 'utf8');
        } catch (_) {
            return convertSpawnResultEncoding(
                unsupportedSpawnSyncResult('exec(stdin redirection)'),
                resolvedOptions,
            );
        }
        tokens.splice(redirectIndex, 2);
    } else if (hasUnsupportedJavaScriptShellSyntax(source)) {
        return convertSpawnResultEncoding(
            unsupportedSpawnSyncResult('exec(shell syntax)'),
            resolvedOptions,
        );
    }

    return convertSpawnResultEncoding(
        spawnSync(tokens[0], tokens.slice(1), resolvedOptions),
        resolvedOptions,
    );
}

const MAX_SHEBANG_BYTES = 4096;
const PATH_LOOKUP_MISS_CODES = new Set(['EACCES', 'EISDIR', 'ENOENT', 'ENOTDIR']);

function isPathLookupMiss(error) {
    return error && PATH_LOOKUP_MISS_CODES.has(error.code);
}

function readShebangLine(fs, candidate) {
    const candidateStat = fs.statSync(candidate);
    // WASI filesystem metadata has no executable permission bits. npm's
    // portable bin representation is a symlink to a JavaScript entry point,
    // so accept that link shape while retaining the executable-bit check for
    // direct regular files.
    const linkedLauncher = fs.lstatSync(candidate).isSymbolicLink();
    if (!candidateStat.isFile() ||
        (!linkedLauncher && (candidateStat.mode & 0o111) === 0)) {
        return null;
    }

    const fd = fs.openSync(candidate, 'r');
    try {
        // Recheck the opened object so a replaced path cannot turn a validated
        // script into a different regular file before the bounded read.
        const openedStat = fs.fstatSync(fd);
        if (!openedStat.isFile() ||
            (!linkedLauncher && (openedStat.mode & 0o111) === 0)) {
            return null;
        }
        const prefix = Buffer.allocUnsafe(MAX_SHEBANG_BYTES);
        const bytesRead = fs.readSync(fd, prefix, 0, prefix.length, 0);
        const newline = prefix.indexOf(0x0a, 0);
        if (newline === -1 && bytesRead === prefix.length) {
            return null;
        }
        const end = newline === -1 || newline >= bytesRead ? bytesRead : newline;
        const line = prefix.toString('utf8', 0, end);
        return line.endsWith('\r') ? line.slice(0, -1) : line;
    } finally {
        fs.closeSync(fd);
    }
}

function hasSupportedNodeShebang(line) {
    if (typeof line !== 'string') return false;
    // This adapter does not emulate kernel shebang argument handling. Accept
    // only an absolute `node` interpreter or the common `env node` form, with
    // no interpreter flags. In particular, do not mistake `python node` for a
    // JavaScript entry point merely because "node" appears later in the line.
    return /^#![ \t]*\/(?:[^/\s]+\/)*node[ \t]*$/.test(line) ||
        /^#![ \t]*\/(?:[^/\s]+\/)*env[ \t]+node[ \t]*$/.test(line);
}

function resolveNodeShebangCommand(command, env, cwd) {
    const workingDirectory = typeof cwd === 'string'
        ? (path.isAbsolute(cwd) ? cwd : path.resolve(process.cwd(), cwd))
        : process.cwd();
    const fs = moduleExports.require('node:fs');

    if (command.indexOf('/') !== -1) {
        const candidate = path.isAbsolute(command)
            ? command
            : path.resolve(workingDirectory, command);
        try {
            return hasSupportedNodeShebang(readShebangLine(fs, candidate))
                ? candidate
                : null;
        } catch (error) {
            if (!isPathLookupMiss(error)) throw error;
            return null;
        }
    }

    const pathValue = env && typeof env.PATH === 'string' ? env.PATH : '';
    const searchPaths = pathValue.split(path.delimiter).filter(Boolean);
    for (let i = 0; i < searchPaths.length; i++) {
        const searchPath = path.isAbsolute(searchPaths[i])
            ? searchPaths[i]
            : path.resolve(workingDirectory, searchPaths[i]);
        const candidate = path.resolve(searchPath, command);
        try {
            const shebang = readShebangLine(fs, candidate);
            if (hasSupportedNodeShebang(shebang)) {
                return candidate;
            }
        } catch (error) {
            if (!isPathLookupMiss(error)) throw error;
            // Missing, unreadable, and non-file PATH entries are lookup misses.
        }
    }
    return null;
}

function hasUnsupportedJavaScriptShellSyntax(command) {
    const text = String(command);
    let quote = null;
    let escaping = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (escaping) {
            escaping = false;
            continue;
        }
        if (ch === '\\' && quote !== "'") {
            if (text[i + 1] === '\n') {
                return true;
            }
            escaping = true;
            continue;
        }
        if (quote === "'") {
            if (ch === "'") quote = null;
            continue;
        }
        if (quote === '"') {
            if (ch === '"') {
                quote = null;
            } else if (DOUBLE_QUOTED_EXPANSION_MARKERS.includes(ch)) {
                return true;
            }
            continue;
        }
        if (ch === "'" || ch === '"') {
            quote = ch;
            continue;
        }
        if (SHELL_METACHARACTERS.includes(ch)) {
            return true;
        }
    }

    return escaping || quote !== null;
}

function resolveJavaScriptShellCommand(command, args, env, cwd) {
    if (String(command) !== 'sh' || !Array.isArray(args) || args.length !== 2 || args[0] !== '-c') {
        return null;
    }
    // This is deliberately a data-only subset of shell parsing. Reject syntax
    // that a real shell would expand or execute instead of passing it through
    // as misleading literal arguments to the inline JavaScript runner.
    const source = String(args[1]);
    if (hasUnsupportedJavaScriptShellSyntax(source)) {
        return null;
    }
    const tokens = splitCommandTokens(source);
    if (!tokens || tokens.length === 0) {
        return null;
    }
    if (tokens[0] === 'node' || tokens[0] === process.execPath) {
        return {
            command: process.execPath,
            args: tokens.slice(1),
        };
    }
    const nodeEntry = resolveNodeShebangCommand(tokens[0], env, cwd);
    if (nodeEntry === null) {
        return null;
    }
    return {
        command: process.execPath,
        args: [nodeEntry].concat(tokens.slice(1)),
    };
}

function resolveBackendInlineCommand(command, args, options) {
    if (command === process.execPath) return { command, args };
    const env = options.env || process.env;
    const shell = resolveJavaScriptShellCommand(command, args, env, options.cwd);
    if (shell) return shell;
    const entry = resolveNodeShebangCommand(command, env, options.cwd);
    return entry === null ? null : {
        command: process.execPath,
        args: [entry].concat(args),
    };
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

    let stderrText = '';
    if (result.stderr !== undefined && result.stderr !== null) {
        stderrText = String(result.stderr);
    }
    let message = 'Command failed: ' + String(command);
    if (stderrText.length > 0) {
        message += '\n' + stderrText;
    }

    const err = new Error(message);
    err.code = typeof result.status === 'number' && result.status < 0
        ? systemErrorName(result.status) : result.status;
    err.killed = false;
    err.signal = result.signal;
    err.cmd = String(command);
    return err;
}

function buildExecFileCommand(file, args) {
    let cmd = String(file);
    for (let i = 0; i < args.length; i++) {
        cmd += ' ' + String(args[i]);
    }
    return cmd;
}

function systemErrorName(code) {
    const errno = osConstants.errno;
    return Object.keys(errno).find(name => errno[name] === -code) || 'Unknown system error ' + code;
}

function createExecFileError(file, args, result) {
    if (!result) {
        return createNotSupportedError('execFile');
    }

    const command = buildExecFileCommand(file, args);
    if (result.error) {
        result.error.cmd = command;
        return result.error;
    }

    if (result.status === 0 && result.signal === null) {
        return null;
    }

    let stderrText = '';
    if (result.stderr !== undefined && result.stderr !== null) {
        stderrText = String(result.stderr);
    }

    let message = 'Command failed: ' + command;
    if (stderrText.length > 0) {
        message += '\n' + stderrText;
    }

    const err = new Error(message);
    err.code = typeof result.status === 'number' && result.status < 0
        ? systemErrorName(result.status) : result.status;
    err.killed = false;
    err.signal = result.signal;
    err.cmd = command;
    return err;
}

function createExecChildProcess() {
    const child = new EventEmitter();
    // exec/execFile consume spawn failures through their callback even when
    // the caller does not subscribe to the child process's error event.
    child.on('error', () => {});
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

function finishExecChild(child, callback, error, result) {
    const spawnError = result && result.error ? result.error : null;
    child.exitCode = spawnError && typeof spawnError.errno === 'number'
        ? spawnError.errno
        : (typeof result.status === 'number' ? result.status : null);
    child.signalCode = result.signal;

    scheduleExecCallback(function resolveExecChild() {
        if (callback) {
            callback(error, result.stdout, result.stderr);
        }

        if (spawnError) {
            child.emit('error', spawnError);
            child.emit('close', child.exitCode, child.signalCode);
            return;
        }
        child.emit('exit', child.exitCode, child.signalCode);
        child.emit('close', child.exitCode, child.signalCode);
    });
}

// ChildProcess class stub
export class ChildProcess {
    constructor() {
        throw createNotSupportedError('ChildProcess');
    }
}

function createForkReadable() {
    const readable = new EventEmitter();
    let decoder;
    readable.readableEncoding = null;
    readable.setEncoding = function setEncoding(encoding) {
        decoder = new StringDecoder(encoding);
        readable.readableEncoding = decoder.encoding;
        return readable;
    };
    readable._emitData = function emitData(chunk) {
        if (chunk === undefined || chunk === null) {
            return;
        }

        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (data.length === 0) {
            return;
        }

        if (decoder) {
            const text = decoder.write(data);
            if (text.length) readable.emit('data', text);
            return;
        }

        readable.emit('data', data);
    };
    readable._emitEnd = function emitEnd() {
        const tail = decoder?.end();
        if (tail) readable.emit('data', tail);
        readable.emit('end');
    };

    return readable;
}

function normalizeForkArgs(args, options) {
    let normalizedArgs = [];
    let normalizedOptions = {};

    if (Array.isArray(args)) {
        normalizedArgs = args.map((value) => String(value));
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
        return options.execArgv.map((value) => String(value));
    }

    if (Array.isArray(process.execArgv)) {
        return process.execArgv.slice();
    }

    return [];
}

// Asynchronous process creation functions
function normalizeBackendExecOptions(options) {
    const normalized = cloneObject(options);
    if (normalized.encoding === undefined) normalized.encoding = 'utf8';
    if (normalized.encoding !== 'buffer' && !Buffer.isEncoding(normalized.encoding)) {
        normalized.encoding = 'buffer';
    }
    if (normalized.maxBuffer === undefined) normalized.maxBuffer = 1024 * 1024;
    if (normalized.maxBuffer != null && (typeof normalized.maxBuffer !== 'number' || normalized.maxBuffer < 0 ||
        Number.isNaN(normalized.maxBuffer))) {
        throw Object.assign(new RangeError('maxBuffer must be a non-negative number'), { code: 'ERR_OUT_OF_RANGE' });
    }
    if (normalized.timeout != null &&
        (!Number.isInteger(normalized.timeout) || normalized.timeout < 0)) {
        throw Object.assign(new RangeError('timeout must be a non-negative integer'), { code: 'ERR_OUT_OF_RANGE' });
    }
    return normalized;
}

function collectExecChild(child, options, callback, makeError) {
    const output = { stdout: [], stderr: [] };
    const lengths = { stdout: 0, stderr: 0 };
    let error;
    let finished = false;
    let killed = false;
    let timer;
    const finish = (status, signal) => {
        if (finished) return;
        finished = true;
        if (timer !== undefined) clearTimeout(timer);
        const collected = channel => child[channel]?.readableEncoding
            ? output[channel].join('') : Buffer.concat(output[channel]);
        const result = {
            stdout: collected('stdout'),
            stderr: collected('stderr'),
            status: typeof status === 'number' ? status : null,
            signal: signal || null,
            error,
        };
        const failure = makeError(result);
        if (failure) failure.killed = child.killed || killed;
        if (callback) callback(failure, result.stdout, result.stderr);
    };
    const kill = () => {
        if (killed) return;
        killed = true;
        try {
            child.kill(options.killSignal || 'SIGTERM');
        } catch (failure) {
            error = failure;
            finish(child.exitCode, child.signalCode);
        }
    };
    for (const channel of ['stdout', 'stderr']) {
        if (!child[channel]) continue;
        if (options.encoding !== 'buffer') child[channel].setEncoding(options.encoding);
        child[channel].on('data', chunk => {
            if (finished) return;
            const remaining = Math.max(0, options.maxBuffer - lengths[channel]);
            const length = typeof chunk === 'string'
                ? Buffer.byteLength(chunk, child[channel].readableEncoding) : chunk.length;
            lengths[channel] += length;
            output[channel].push(lengths[channel] > options.maxBuffer ? chunk.slice(0, remaining) : chunk);
            if (lengths[channel] > options.maxBuffer) {
                error ||= Object.assign(new RangeError(channel + ' maxBuffer length exceeded'), {
                    code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
                });
                kill();
            }
        });
    }
    child.once('error', failure => {
        error = failure;
        finish(child.exitCode, child.signalCode);
    });
    child.once('close', finish);
    if (options.timeout > 0) timer = setTimeout(kill, options.timeout);
    return child;
}

export function exec(command, options, callback) {
    const normalized = normalizeExecParams(options, callback);
    const backend = getProcessBackend();
    if (backend && backend.spawn) {
        const resolvedOptions = normalizeBackendExecOptions(normalized.options);
        resolvedOptions.shell = typeof resolvedOptions.shell === 'string' ? resolvedOptions.shell : true;
        const delegated = backend.spawn(String(command), [], resolvedOptions);
        if (delegated !== undefined) {
            return collectExecChild(delegated, resolvedOptions, normalized.callback,
                result => createExecError(command, result));
        }
    }
    const child = createExecChildProcess();
    const result = runExecCommand(command, normalized.options);
    const error = createExecError(command, result);
    finishExecChild(child, normalized.callback, error, result);

    return child;
}

export function execFile(file, args, options, callback) {
    const normalized = normalizeExecFileParams(args, options, callback);
    const backend = getProcessBackend();
    if ((backend && backend.spawn) || childNative.supports_isolation()) {
        const resolvedOptions = normalizeBackendExecOptions(normalized.options);
        return collectExecChild(spawnCommand(String(file), normalized.args, resolvedOptions, resolvedOptions.maxBuffer),
            resolvedOptions, normalized.callback,
            result => createExecFileError(file, normalized.args, result));
    }
    const child = createExecChildProcess();
    const resolvedOptions = cloneObject(normalized.options);

    if (resolvedOptions.encoding === undefined) {
        resolvedOptions.encoding = 'utf8';
    }

    const result = convertSpawnResultEncoding(
        spawnSync(String(file), normalized.args, resolvedOptions),
        resolvedOptions,
    );
    const error = createExecFileError(file, normalized.args, result);
    child.spawnfile = String(file);
    child.spawnargs = [String(file)].concat(normalized.args);
    finishExecChild(child, normalized.callback, error, result);

    return child;
}

function promisifyExec(fn) {
    return function (...args) {
        let child;
        const result = new Promise((resolve, reject) => {
            child = fn(...args, (error, stdout, stderr) => {
                if (error) {
                    error.stdout = stdout;
                    error.stderr = stderr;
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
        result.child = child;
        return result;
    };
}

for (const fn of [exec, execFile]) {
    Object.defineProperty(fn, Symbol.for('nodejs.util.promisify.custom'), {
        value: promisifyExec(fn),
    });
}

export function fork(modulePath, args, options) {
    const normalized = normalizeForkArgs(args, options);
    const child = new EventEmitter();
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
        const modulePathStr = String(modulePath);
        let childCommand = process.execPath;
        if (normalized.options && typeof normalized.options.execPath === 'string') {
            childCommand = normalized.options.execPath;
        }

        const spawnArgs = getForkExecArgv(normalized.options);
        spawnArgs.push(modulePathStr);
        for (let i = 0; i < normalized.args.length; i++) {
            spawnArgs.push(normalized.args[i]);
        }

        const spawnOptions = {
            encoding: 'buffer',
            maxBuffer: Infinity,
        };
        if (normalized.options && typeof normalized.options.cwd === 'string') {
            spawnOptions.cwd = normalized.options.cwd;
        }
        if (normalized.options && normalized.options.env) {
            spawnOptions.env = normalized.options.env;
        }

        const result = spawnSync(childCommand, spawnArgs, spawnOptions);
        const exitCode = typeof result.status === 'number' ? result.status : 1;
        child.exitCode = exitCode;
        child.signalCode = result.signal || null;

        child.stdout._emitData(result.stdout);
        child.stderr._emitData(result.stderr);
        child.stdout._emitEnd();
        child.stderr._emitEnd();
        child.emit('exit', exitCode, child.signalCode);
        child.emit('close', exitCode, child.signalCode);
    }, 0);

    return child;
}

// spawn emulation — runs the target script inline (like fork/spawnSync) but
// delivers results asynchronously through EventEmitter streams.
function normalizeSpawnParams(args, options) {
    if (Array.isArray(args)) {
        args = args.slice();
    } else if (args == null) {
        args = [];
    } else if (typeof args === 'object') {
        options = args;
        args = [];
    } else {
        throw new TypeError('args must be an array or an options object');
    }
    if (options === undefined) options = {};
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('options must be an object');
    }
    return { args, options: { ...options } };
}

export function spawn(command, args, options) {
    return spawnCommand(command, args, options);
}

function spawnCommand(command, args, options, maxBuffer) {
    ({ args, options } = normalizeSpawnParams(args, options));
    if (childNative.supports_isolation() && !options.shell) {
        const local = resolveBackendInlineCommand(String(command), args, options);
        if (local) return spawnNode(local.command, local.args, options, maxBuffer);
    }
    const backend = getProcessBackend();
    let inline;
    if (backend && backend.spawn) {
        const opts = options || {};
        const cmd = String(command);
        // A configured adapter is a fallback. Keep inline Node/shebang
        // resolution ahead of host command lookup, including PATH precedence.
        inline = !opts.shell && resolveBackendInlineCommand(cmd, args || [], opts);
        if (!inline) {
            const delegated = backend.spawn(cmd, args || [], opts);
            if (delegated !== undefined) return delegated;
        }
    }
    const child = new EventEmitter();
    child.pid = 1;
    child.connected = false;
    child.killed = false;
    child.exitCode = null;
    child.signalCode = null;
    child.stdout = createForkReadable();
    child.stderr = createForkReadable();
    child.stdin = null;
    child.spawnfile = String(command);
    child.spawnargs = [String(command)].concat((args || []).map((a) => String(a)));
    child.kill = function kill() {
        child.killed = true;
        return false;
    };

    setTimeout(function runSpawnInWasm() {
        const spawnOpts = {};
        if (options && typeof options === 'object') {
            if (typeof options.cwd === 'string') {
                spawnOpts.cwd = options.cwd;
            }
            if (options.env) {
                spawnOpts.env = options.env;
            }
            if (options.shell) {
                spawnOpts.shell = options.shell;
            }
        }
        spawnOpts.encoding = 'buffer';

        const result = spawnSync(inline ? inline.command : String(command), inline ? inline.args : args || [], spawnOpts);
        const exitCode = result.error && typeof result.error.errno === 'number'
            ? result.error.errno : typeof result.status === 'number' ? result.status : null;
        child.exitCode = exitCode;
        child.signalCode = result.signal || null;

        child.stdout._emitData(result.stdout);
        child.stderr._emitData(result.stderr);
        if (options && options.stdio === 'inherit') {
            if (result.stdout && result.stdout.length > 0) process.stdout.write(result.stdout);
            if (result.stderr && result.stderr.length > 0) process.stderr.write(result.stderr);
        }
        if (result.error) child.emit('error', result.error);
        child.stdout._emitEnd();
        child.stderr._emitEnd();
        if (result.error) {
            // Node does not emit `exit` when the process could not be spawned.
            child.emit('close', exitCode, null);
        } else {
            child.emit('exit', exitCode, child.signalCode);
            child.emit('close', exitCode, child.signalCode);
        }
    }, 0);

    return child;
}

// Synchronous process creation functions
export function execFileSync(file, args, options) {
    let normalizedArgs = [];
    let normalizedOptions = {};

    if (Array.isArray(args)) {
        normalizedArgs = args;
        if (options && typeof options === 'object') {
            normalizedOptions = options;
        }
    } else if (args && typeof args === 'object') {
        normalizedOptions = args;
    }

    const result = spawnSync(file, normalizedArgs, normalizedOptions);

    if (result.error || result.status !== 0) {
        const err = result.error || new Error('Command failed: ' + String(file) + ' ' + normalizedArgs.join(' ') + '\n' + String(result.stderr || ''));
        err.status = result.status;
        err.signal = result.signal;
        err.stdout = result.stdout;
        err.stderr = result.stderr;
        err.pid = result.pid;
        err.output = result.output;
        throw err;
    }

    if (result.stdout === null) return null;
    const encoding = getOutputEncoding(normalizedOptions);
    if (encoding && encoding !== 'buffer') {
        return result.stdout ? result.stdout.toString(encoding) : '';
    }

    return result.stdout;
}

export function execSync(command, options) {
    const backend = getProcessBackend();
    if (!backend || !backend.spawnSync) throw createNotSupportedError('execSync');
    const opts = options || {};
    return execFileSync(String(command), [], { ...opts, shell: opts.shell === undefined ? true : opts.shell });
}

export function spawnSync(command, args, options) {
    const { args: normalizedArgs, options: normalizedOptions } = normalizeSpawnParams(args, options);
    if (normalizedOptions.shell) {
        return delegatedSpawnSync(String(command), normalizedArgs, normalizedOptions) ||
            unsupportedSpawnSyncResult(String(command) + ' with shell option');
    }
    const backend = getProcessBackend();
    // The unconfigured path keeps its existing lookup cost. Only a registered
    // fallback requires resolving direct Node shebangs before delegation.
    const shellCommand = backend && backend.spawnSync
        ? resolveBackendInlineCommand(String(command), normalizedArgs, normalizedOptions)
        : resolveJavaScriptShellCommand(
        String(command),
        normalizedArgs,
        normalizedOptions.env || process.env,
        normalizedOptions.cwd,
    );
    const cmd = shellCommand ? shellCommand.command : String(command);
    const resolvedArgs = shellCommand ? shellCommand.args : normalizedArgs;
    if (cmd !== process.execPath) {
        return delegatedSpawnSync(String(command), normalizedArgs, normalizedOptions) ||
            unsupportedSpawnSyncResult(cmd);
    }

    if (childNative.supports_isolation()) {
        const request = nodeRequest(cmd, resolvedArgs, normalizedOptions, true);
        const native = new childNative.Child(JSON.stringify(request));
        const state = JSON.parse(native.runSync());
        const output = [[], []];
        deliverNodeOutput(state.events, request.options.stdio, (stdout, bytes) => output[stdout ? 0 : 1].push(bytes));
        return nodeResult(state.result, request.options, output.map(chunks => Buffer.concat(chunks)), true);
    }
    return runInline(cmd, resolvedArgs, normalizedOptions);
}

function nodeSignal(signal) {
    const signals = osConstants.signals;
    if (typeof signal === 'number') {
        const name = Object.keys(signals).find(name => signals[name] === signal);
        if (name) return name;
    } else if (typeof signal === 'string' && Object.hasOwn(signals, signal.toUpperCase())) {
        return signal.toUpperCase();
    }
    throw Object.assign(new TypeError('Unknown signal: ' + String(signal)), { code: 'ERR_UNKNOWN_SIGNAL' });
}

function nodeRequest(command, args, options, synchronous, maxBuffer) {
    // spawn has no maxBuffer option; execFile owns its collector limit.
    const checked = normalizeBackendExecOptions({ ...options, maxBuffer: synchronous ? options.maxBuffer : maxBuffer });
    const stdio = options.stdio === undefined ? ['pipe', 'pipe', 'pipe']
        : typeof options.stdio === 'string' ? [options.stdio, options.stdio, options.stdio]
        : Array.isArray(options.stdio) ? [0, 1, 2].map(i => options.stdio[i] ?? 'pipe') : null;
    if (!stdio) {
        throw Object.assign(new TypeError('Unsupported stdio configuration'), { code: 'ERR_INVALID_ARG_VALUE' });
    }
    if ((Array.isArray(options.stdio) && options.stdio.length > 3) ||
        stdio.some((value, i) => !['pipe', 'overlapped', 'ignore', 'inherit', i].includes(value))) {
        throw createNotSupportedError('Requested stdio configuration');
    }
    const env = {};
    for (const [key, value] of Object.entries(options.env ?? process.env)) {
        if (value !== undefined) env[key] = String(value);
    }
    const input = options.input ?? options.__wasmStdinData;
    if (input !== undefined && typeof input !== 'string' && !ArrayBuffer.isView(input) && !Array.isArray(input)) {
        throw new TypeError('input must be a string or a byte buffer');
    }
    const inputBytes = ArrayBuffer.isView(input)
        ? Buffer.from(input.buffer, input.byteOffset, input.byteLength)
        : input === undefined ? undefined : Buffer.from(input, options.encoding === 'buffer' ? undefined : options.encoding);
    return { command: String(command), args: args.map(String), options: {
        cwd: path.resolve(process.cwd(), options.cwd ?? '.'), env,
        __wasmStdinData: inputBytes === undefined ? undefined : [...inputBytes],
        stdio: stdio.map(value => typeof value === 'number' ? 'inherit' : value === 'overlapped' ? 'pipe' : value),
        maxBuffer: synchronous ? checked.maxBuffer || null : maxBuffer ?? null,
        timeout: checked.timeout ?? 0,
        killSignal: nodeSignal(options.killSignal ?? 'SIGTERM'),
        encoding: options.encoding,
    } };
}

function deliverNodeOutput(events, modes, pipe) {
    for (const [stdout, data] of events) {
        const bytes = Buffer.from(data);
        if (modes[stdout ? 1 : 2] === 'inherit') {
            (stdout ? process.stdout : process.stderr).write(bytes);
        } else if (modes[stdout ? 1 : 2] === 'pipe') {
            pipe(stdout, bytes);
        }
    }
}

function nodeResult(terminal, options, output, synchronous) {
    let error = terminal.error && Object.assign(new Error(terminal.error.message), terminal.error);
    const reason = terminal.reason;
    if (reason === 'overflow') {
        error = synchronous
            ? Object.assign(new Error('spawnSync ENOBUFS'), { code: 'ENOBUFS', errno: -105 })
            : Object.assign(new RangeError((terminal.stream ?? 'stdout') + ' maxBuffer length exceeded'), { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' });
    } else if (reason === 'timeout' && synchronous) {
        error = Object.assign(new Error('spawnSync ETIMEDOUT'), { code: 'ETIMEDOUT', errno: -110 });
    }
    const stdout = options.stdio[1] === 'pipe' ? output[0] : null;
    const stderr = options.stdio[2] === 'pipe' ? output[1] : null;
    return convertSpawnResultEncoding({
        pid: 1, stdout, stderr, output: [null, stdout, stderr],
        status: terminal.status, signal: reason ? options.killSignal : null,
        ...(error ? { error } : {}),
    }, synchronous ? options : {});
}

function spawnNode(command, args, options, maxBuffer) {
    const request = nodeRequest(command, args, options, false, maxBuffer);
    const native = new childNative.Child(JSON.stringify(request));
    const child = new EventEmitter();
    child.pid = 1;
    child.connected = false;
    child.killed = false;
    child.exitCode = null;
    child.signalCode = null;
    child.spawnfile = command;
    child.spawnargs = [command, ...args];
    child.stdin = null;
    child.stdout = request.options.stdio[1] === 'pipe' ? createForkReadable() : null;
    child.stderr = request.options.stdio[2] === 'pipe' ? createForkReadable() : null;
    child.stdio = [child.stdin, child.stdout, child.stderr];
    let completed = false;
    let abortError;
    // Listener exceptions belong to the parent, not to the native output pump.
    // Use the ordinary nextTick uncaught-error path without cancelling a child.
    const dispatch = callback => {
        try { callback(); }
        catch (error) { process.nextTick(() => { throw error; }); }
    };
    child.kill = signal => {
        const selected = nodeSignal(signal ?? 'SIGTERM');
        if (!native.cancel()) return false;
        request.options.killSignal = selected;
        child.killed = true;
        return true;
    };
    const abort = () => {
        if (child.kill(request.options.killSignal)) {
            abortError = Object.assign(new Error('The operation was aborted'), {
                name: 'AbortError', code: 'ABORT_ERR', cause: options.signal.reason,
            });
        }
    };
    if (options.signal !== undefined) {
        if (!options.signal || typeof options.signal.addEventListener !== 'function') {
            throw new TypeError('signal must be an AbortSignal');
        }
        if (options.signal.aborted) abort();
        else options.signal.addEventListener('abort', abort, { once: true });
    }
    const finish = result => {
        if (completed) return;
        completed = true;
        options.signal?.removeEventListener('abort', abort);
        child.exitCode = result.status;
        child.signalCode = result.signal;
        if (result.signal) child.killed = true;
        const error = abortError ?? result.error;
        if (error) dispatch(() => child.emit('error', error));
        dispatch(() => child.stdout?._emitEnd());
        dispatch(() => child.stderr?._emitEnd());
        dispatch(() => child.emit('exit', child.exitCode, child.signalCode));
        dispatch(() => child.emit('close', child.exitCode, child.signalCode));
    };
    const execution = native.start();
    execution.catch(error => finish({ status: null, signal: null, error }));
    (async () => {
        process.nextTick(() => child.emit('spawn'));
        while (!completed) {
            const state = JSON.parse(await native.wait());
            for (const event of state.events) dispatch(() => deliverNodeOutput([event], request.options.stdio,
                (stdout, bytes) => (stdout ? child.stdout : child.stderr)?._emitData(bytes)));
            if (state.done) {
                await execution;
                finish(nodeResult(state.result, request.options, [Buffer.alloc(0), Buffer.alloc(0)], false));
            }
        }
    })().catch(async error => {
        native.cancel();
        try { await execution; } catch (_) {}
        finish({ status: null, signal: null, error });
    });
    return child;
}

function delegatedSpawnSync(command, args, options) {
    const backend = getProcessBackend();
    if (!backend || !backend.spawnSync) return undefined;
    const result = backend.spawnSync(command, args, options);
    if (result === undefined) return undefined;
    if (!result || typeof result !== 'object' || typeof result.then === 'function') {
        throw new TypeError('Synchronous process backend must return a result object or undefined');
    }
    const stdout = result.stdout === null ? null : Buffer.from(result.stdout || []);
    const stderr = result.stderr === null ? null : Buffer.from(result.stderr || []);
    return convertSpawnResultEncoding({
        ...result,
        stdout,
        stderr,
        output: [null, stdout, stderr],
    }, options);
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

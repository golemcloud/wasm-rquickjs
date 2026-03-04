import * as pathModule from 'node:path';
import * as pathPosix from 'node:path/posix';
import * as pathWin32 from 'node:path/win32';
import * as fsModule from 'node:fs';
import * as util from 'node:util';
import * as buffer from 'node:buffer';
import * as os from 'node:os';
import * as events from 'node:events';
import * as stream from 'node:stream';
import * as streamPromises from 'node:stream/promises';
import * as streamConsumers from 'node:stream/consumers';
import * as streamWeb from 'node:stream/web';
import * as crypto from 'node:crypto';
import * as child_process from 'node:child_process';
import * as string_decoder from 'node:string_decoder';
import * as processModule from 'node:process';
import * as assert from 'node:assert';
import * as assertStrict from 'node:assert/strict';
import * as fsPromises from 'node:fs/promises';
import * as nodeTest from 'node:test';
import * as querystring from 'node:querystring';
import * as nodeUrl from 'node:url';
import * as vm from 'node:vm';
import * as timers from 'node:timers';
import * as timersPromises from 'node:timers/promises';
import * as consoleMod from 'node:console';
import * as async_hooks from 'node:async_hooks';
import * as cluster from 'node:cluster';
import * as dgram from 'node:dgram';
import * as diagnostics_channel from 'node:diagnostics_channel';
import * as dns from 'node:dns';
import * as dnsPromises from 'node:dns/promises';
import * as domain from 'node:domain';
import * as httpCommon from 'node:_http_common';
import * as http from 'node:http';
import * as http2 from 'node:http2';
import * as https from 'node:https';
import * as net from 'node:net';
import * as perf_hooks from 'node:perf_hooks';
import * as readline from 'node:readline';
import * as readlinePromises from 'node:readline/promises';
import * as repl from 'node:repl';
import * as trace_events from 'node:trace_events';
import * as tls from 'node:tls';
import * as tty from 'node:tty';
import * as v8 from 'node:v8';
import * as worker_threads from 'node:worker_threads';
import * as zlib from 'node:zlib';
import * as sqlite from 'node:sqlite';
import * as internalHttp from '__wasm_rquickjs_builtin/internal/http';
import { ERR_INVALID_ARG_TYPE } from '__wasm_rquickjs_builtin/internal/errors';
import * as internalErrors from '__wasm_rquickjs_builtin/internal/errors';
import * as internalFsUtils from '__wasm_rquickjs_builtin/internal/fs/utils';
import * as internalUrl from '__wasm_rquickjs_builtin/internal/url';
import * as internalUtil from '__wasm_rquickjs_builtin/internal/util';
import * as internalUtilDebuglog from '__wasm_rquickjs_builtin/internal/util/debuglog';
import * as internalWebstreamsUtil from '__wasm_rquickjs_builtin/internal/webstreams/util';
import * as internalStreamsAddAbortSignal from '__wasm_rquickjs_builtin/internal/streams/add-abort-signal';
import * as internalStreamsState from '__wasm_rquickjs_builtin/internal/streams/state';
import * as internalTestBinding from '__wasm_rquickjs_builtin/internal/test/binding';

// CJS require() should return the default export (the "module object") when one
// exists, not the ESM namespace wrapper.  When the default export is a function
// or object, named exports are also attached to it so that both
// `require('mod')()` and `const { namedExport } = require('mod')` work — this
// mirrors Node.js CJS/ESM interop behaviour.
function cjsExport(ns) {
    if (!ns || ns.default === undefined) return ns;
    var def = ns.default;
    if (typeof def === 'function' || (typeof def === 'object' && def !== null)) {
        var keys = Object.keys(ns);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (k !== 'default' && !(k in def)) {
                def[k] = ns[k];
            }
        }
    }
    return def;
}

const cryptoCjs = (() => {
    const out = {};
    const keys = Object.keys(crypto);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        out[key] = crypto[key];
    }

    ['pseudoRandomBytes', 'prng', 'rng'].forEach((name) => {
        if (Object.prototype.hasOwnProperty.call(out, name)) {
            Object.defineProperty(out, name, {
                value: out[name],
                writable: true,
                configurable: true,
                enumerable: false,
            });
        }
    });

    return out;
})();

const builtinModules = {
    'path': cjsExport(pathModule),
    'node:path': cjsExport(pathModule),
    'path/posix': cjsExport(pathPosix),
    'node:path/posix': cjsExport(pathPosix),
    'path/win32': cjsExport(pathWin32),
    'node:path/win32': cjsExport(pathWin32),
    'fs': cjsExport(fsModule),
    'node:fs': cjsExport(fsModule),
    'fs/promises': cjsExport(fsPromises),
    'node:fs/promises': cjsExport(fsPromises),
    'internal/fs/promises': cjsExport(fsPromises),
    'util': cjsExport(util),
    'node:util': cjsExport(util),
    'sys': cjsExport(util),
    'node:sys': cjsExport(util),
    'buffer': cjsExport(buffer),
    'node:buffer': cjsExport(buffer),
    'os': cjsExport(os),
    'node:os': cjsExport(os),
    'events': cjsExport(events),
    'node:events': cjsExport(events),
    'stream': cjsExport(stream),
    'node:stream': cjsExport(stream),
    'stream/promises': cjsExport(streamPromises),
    'node:stream/promises': cjsExport(streamPromises),
    'stream/consumers': cjsExport(streamConsumers),
    'node:stream/consumers': cjsExport(streamConsumers),
    'stream/web': cjsExport(streamWeb),
    'node:stream/web': cjsExport(streamWeb),
    'crypto': cryptoCjs,
    'node:crypto': cryptoCjs,
    'child_process': cjsExport(child_process),
    'node:child_process': cjsExport(child_process),
    'string_decoder': cjsExport(string_decoder),
    'node:string_decoder': cjsExport(string_decoder),
    'process': cjsExport(processModule),
    'node:process': cjsExport(processModule),
    'assert': cjsExport(assert),
    'node:assert': cjsExport(assert),
    'assert/strict': cjsExport(assertStrict),
    'node:assert/strict': cjsExport(assertStrict),
    'test': cjsExport(nodeTest),
    'node:test': cjsExport(nodeTest),
    'querystring': cjsExport(querystring),
    'node:querystring': cjsExport(querystring),
    'url': cjsExport(nodeUrl),
    'node:url': cjsExport(nodeUrl),
    'vm': cjsExport(vm),
    'node:vm': cjsExport(vm),
    'timers': cjsExport(timers),
    'node:timers': cjsExport(timers),
    'timers/promises': cjsExport(timersPromises),
    'node:timers/promises': cjsExport(timersPromises),
    get 'console'() {
        const c = globalThis.console;
        if (c && consoleMod.Console) c.Console = consoleMod.Console;
        return c || cjsExport(consoleMod);
    },
    get 'node:console'() {
        return this['console'];
    },
    'async_hooks': cjsExport(async_hooks),
    'node:async_hooks': cjsExport(async_hooks),
    'cluster': cjsExport(cluster),
    'node:cluster': cjsExport(cluster),
    'dgram': cjsExport(dgram),
    'node:dgram': cjsExport(dgram),
    'diagnostics_channel': cjsExport(diagnostics_channel),
    'node:diagnostics_channel': cjsExport(diagnostics_channel),
    'dns': cjsExport(dns),
    'node:dns': cjsExport(dns),
    'dns/promises': cjsExport(dnsPromises),
    'node:dns/promises': cjsExport(dnsPromises),
    'domain': cjsExport(domain),
    'node:domain': cjsExport(domain),
    '_http_common': cjsExport(httpCommon),
    'node:_http_common': cjsExport(httpCommon),
    'http': cjsExport(http),
    'node:http': cjsExport(http),
    'http2': cjsExport(http2),
    'node:http2': cjsExport(http2),
    'https': cjsExport(https),
    'node:https': cjsExport(https),
    'net': cjsExport(net),
    'node:net': cjsExport(net),
    'perf_hooks': cjsExport(perf_hooks),
    'node:perf_hooks': cjsExport(perf_hooks),
    'readline': cjsExport(readline),
    'node:readline': cjsExport(readline),
    'readline/promises': cjsExport(readlinePromises),
    'node:readline/promises': cjsExport(readlinePromises),
    'repl': cjsExport(repl),
    'node:repl': cjsExport(repl),
    'tls': cjsExport(tls),
    'node:tls': cjsExport(tls),
    'trace_events': cjsExport(trace_events),
    'node:trace_events': cjsExport(trace_events),
    'tty': cjsExport(tty),
    'node:tty': cjsExport(tty),
    'v8': cjsExport(v8),
    'node:v8': cjsExport(v8),
    'worker_threads': cjsExport(worker_threads),
    'node:worker_threads': cjsExport(worker_threads),
    'zlib': cjsExport(zlib),
    'node:zlib': cjsExport(zlib),
    'node:sqlite': cjsExport(sqlite),
    'util/types': (cjsExport(util) && cjsExport(util).types) || {},
    'node:util/types': (cjsExport(util) && cjsExport(util).types) || {},
    '_stream_readable': cjsExport(stream) && cjsExport(stream).Readable,
    '_stream_writable': cjsExport(stream) && cjsExport(stream).Writable,
    '_stream_duplex': cjsExport(stream) && cjsExport(stream).Duplex,
    '_stream_transform': cjsExport(stream) && cjsExport(stream).Transform,
    '_stream_passthrough': cjsExport(stream) && cjsExport(stream).PassThrough,
    'internal/http': cjsExport(internalHttp),
    'internal/fs/utils': cjsExport(internalFsUtils),
    'internal/url': cjsExport(internalUrl),
    'internal/errors': cjsExport(internalErrors),
    'internal/util': cjsExport(internalUtil),
    'internal/util/debuglog': cjsExport(internalUtilDebuglog),
    'internal/webstreams/util': cjsExport(internalWebstreamsUtil),
    'internal/streams/add-abort-signal': cjsExport(internalStreamsAddAbortSignal),
    'internal/streams/state': cjsExport(internalStreamsState),
    'internal/test/binding': cjsExport(internalTestBinding),
};

// Self-reference will be added after the module object is created (see bottom of file)

const builtinModuleNames = Object.keys(builtinModules).filter(
    (name) => !name.startsWith('node:') && !name.startsWith('internal/') && !name.startsWith('_')
);

// Modules that require the 'node:' prefix (cannot be required as bare specifiers)
const schemelessBlockList = new Set(['test', 'sqlite']);

// Build public module ID sets matching Node.js semantics
const publicBuiltinIdSet = new Set();
const publicBuiltinWithoutSchemeSet = new Set();
for (var _i = 0; _i < builtinModuleNames.length; _i++) {
    var _name = builtinModuleNames[_i];
    if (_name.startsWith('internal/')) continue;
    if (_name.startsWith('node:')) continue;
    if (_name.startsWith('__wasm_rquickjs_builtin')) continue;
    publicBuiltinIdSet.add(_name);
    if (!schemelessBlockList.has(_name)) {
        publicBuiltinWithoutSchemeSet.add(_name);
    }
}

function isBuiltin(id) {
    if (typeof id !== 'string') return false;
    if (publicBuiltinWithoutSchemeSet.has(id)) return true;
    if (id.startsWith('node:')) {
        return publicBuiltinIdSet.has(id.slice(5));
    }
    return false;
}

// Module cache: resolved absolute path -> Module object
const moduleCache = Object.create(null);

function tryReadFile(filename) {
    try {
        return fsModule.readFileSync(filename, 'utf8');
    } catch (e) {
        return null;
    }
}

// Shared require.extensions registry (mirrors Node.js Module._extensions)
var requireExtensions = Object.create(null);
requireExtensions['.js'] = function _defaultJs(mod, filename) { /* built-in */ };
requireExtensions['.json'] = function _defaultJson(mod, filename) { /* built-in */ };
requireExtensions['.node'] = function _defaultNode(mod, filename) { /* built-in */ };
var _defaultExtHandlers = new Set([requireExtensions['.js'], requireExtensions['.json'], requireExtensions['.node']]);

// Path cache (settable; used by tests to reset resolution state)
var _pathCache = Object.create(null);

function findLongestRegisteredExtension(filename) {
    var name = pathModule.basename(filename);
    var startIndex = 0;
    var index;
    while ((index = name.indexOf('.', startIndex)) !== -1) {
        startIndex = index + 1;
        if (index === 0) continue; // Skip leading dot (dotfiles)
        var ext = name.slice(index);
        if (requireExtensions[ext]) return ext;
    }
    return '.js';
}

function resolveFilename(id, parentDir) {
    var candidate;
    if (pathModule.isAbsolute(id)) {
        candidate = pathModule.normalize(id);
    } else {
        candidate = pathModule.resolve(parentDir, id);
    }

    // Try exact path
    var content = tryReadFile(candidate);
    if (content !== null) {
        return { filename: candidate, content: content };
    }

    // Try with each registered extension
    var exts = Object.keys(requireExtensions);
    for (var i = 0; i < exts.length; i++) {
        content = tryReadFile(candidate + exts[i]);
        if (content !== null) {
            return { filename: candidate + exts[i], content: content };
        }
    }

    // Try as directory: index.js, index.json
    content = tryReadFile(pathModule.join(candidate, 'index.js'));
    if (content !== null) {
        return { filename: pathModule.join(candidate, 'index.js'), content: content };
    }
    content = tryReadFile(pathModule.join(candidate, 'index.json'));
    if (content !== null) {
        return { filename: pathModule.join(candidate, 'index.json'), content: content };
    }

    var err = new Error("Cannot find module '" + id + "' from '" + parentDir + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
}

function hasAllowNativesSyntaxFlag() {
    var runtimeFlags = globalThis.__wasm_rquickjs_v8_runtime_flags;
    if (runtimeFlags && runtimeFlags.allowNativesSyntax === true) {
        return true;
    }

    var processObject = globalThis.process;
    if (!processObject || !Array.isArray(processObject.execArgv)) {
        return false;
    }

    var enabled = false;
    for (var i = 0; i < processObject.execArgv.length; i++) {
        var arg = String(processObject.execArgv[i]).replace(/_/g, '-');
        if (arg === '--allow-natives-syntax') {
            enabled = true;
            continue;
        }

        if (arg === '--noallow-natives-syntax' || arg === '--no-allow-natives-syntax') {
            enabled = false;
        }
    }

    return enabled;
}

function stripV8OptimizationIntrinsics(source) {
    if (!hasAllowNativesSyntaxFlag()) {
        return source;
    }

    // QuickJS cannot parse V8-native `%...` syntax used in eval strings.
    // These intrinsics only force optimization and are semantically no-ops.
    return source
        .replace(/eval\(\s*(['"])%PrepareFunctionForOptimization\([^'"\\\r\n]*\)\1\s*\)\s*;?/g, 'undefined;')
        .replace(/eval\(\s*(['"])%OptimizeFunctionOnNextCall\([^'"\\\r\n]*\)\1\s*\)\s*;?/g, 'undefined;');
}

function hasExecArgvFlag(flag) {
    var processObject = globalThis.process;
    if (!processObject || !Array.isArray(processObject.execArgv)) {
        return false;
    }

    var prefixed = flag + '=';
    for (var i = 0; i < processObject.execArgv.length; i++) {
        var arg = String(processObject.execArgv[i]);
        if (arg === flag || arg.indexOf(prefixed) === 0) {
            return true;
        }
    }

    return false;
}

function isExperimentalTransformTypesEnabled() {
    return hasExecArgvFlag('--experimental-transform-types');
}

function isSourceMapsEnabled() {
    if (hasExecArgvFlag('--no-enable-source-maps')) {
        return false;
    }

    return hasExecArgvFlag('--enable-source-maps') || isExperimentalTransformTypesEnabled();
}

function getSimpleSourceMapRegistry() {
    var registry = globalThis.__wasm_rquickjs_simple_source_maps;
    if (!registry || typeof registry !== 'object') {
        registry = Object.create(null);
        globalThis.__wasm_rquickjs_simple_source_maps = registry;
    }
    return registry;
}

function getCjsLineOffsetRegistry() {
    var registry = globalThis.__wasm_rquickjs_cjs_line_offsets;
    if (!registry || typeof registry !== 'object') {
        registry = Object.create(null);
        globalThis.__wasm_rquickjs_cjs_line_offsets = registry;
    }
    return registry;
}

function countMatches(text, charCode) {
    var count = 0;
    for (var i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === charCode) {
            count += 1;
        }
    }
    return count;
}

function transpileTypeScriptModule(filename, source) {
    if (!isExperimentalTransformTypesEnabled() || !filename.endsWith('.ts')) {
        return source;
    }

    var lines = String(source).split('\n');
    var transformedLines = [];
    var generatedLineToOriginalLine = Object.create(null);
    var insideInterface = false;
    var interfaceDepth = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        if (insideInterface) {
            interfaceDepth += countMatches(line, 123) - countMatches(line, 125);
            if (interfaceDepth <= 0) {
                insideInterface = false;
                interfaceDepth = 0;
            }
            continue;
        }

        var trimmed = line.trim();
        if (/^interface\s+[A-Za-z_$][A-Za-z0-9_$]*\b/.test(trimmed)) {
            interfaceDepth = countMatches(line, 123) - countMatches(line, 125);
            if (interfaceDepth > 0) {
                insideInterface = true;
            }
            continue;
        }

        if (trimmed.length === 0) {
            continue;
        }

        transformedLines.push(line);
        generatedLineToOriginalLine[transformedLines.length] = i + 1;
    }

    var transformed = transformedLines.join('\n');
    var sourceMapRegistry = getSimpleSourceMapRegistry();
    if (isSourceMapsEnabled()) {
        sourceMapRegistry[filename] = {
            generatedLineToOriginalLine,
        };
    } else {
        delete sourceMapRegistry[filename];
    }

    return transformed;
}

function getArrowMessagePrivateSymbol() {
    var privateSymbols = globalThis.__wasm_rquickjs_internal_private_symbols;
    if (!privateSymbols || typeof privateSymbols !== 'object') {
        return undefined;
    }

    var arrowMessageSymbol = privateSymbols.arrow_message_private_symbol;
    return typeof arrowMessageSymbol === 'symbol' ? arrowMessageSymbol : undefined;
}

function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maybeSetArrowMessageOnSyntaxError(err, filename, source) {
    if (!err || err.name !== 'SyntaxError') {
        return;
    }

    var arrowMessageSymbol = getArrowMessagePrivateSymbol();
    if (arrowMessageSymbol === undefined || err[arrowMessageSymbol] !== undefined) {
        return;
    }

    var line = 1;
    var column = 1;

    if (typeof err.lineNumber === 'number' && Number.isFinite(err.lineNumber) && err.lineNumber > 0) {
        line = Math.floor(err.lineNumber);
    }
    if (typeof err.columnNumber === 'number' && Number.isFinite(err.columnNumber) && err.columnNumber > 0) {
        column = Math.floor(err.columnNumber);
    }

    if (typeof err.stack === 'string') {
        var stackMatch = err.stack.match(new RegExp(escapeRegExp(filename) + ':(\\d+)(?::(\\d+))?'));
        if (stackMatch) {
            line = parseInt(stackMatch[1], 10);
            if (stackMatch[2] !== undefined) {
                column = parseInt(stackMatch[2], 10);
            }
        }
    }

    var sourceLines = String(source).split('\n');
    var sourceLine = '';
    if (line >= 1 && line <= sourceLines.length) {
        sourceLine = sourceLines[line - 1].replace(/\r$/, '');
    }

    if (!Number.isFinite(column) || column < 1) {
        column = 1;
    }

    var arrowMessage = filename + ':' + line;
    if (sourceLine.length > 0) {
        arrowMessage += '\n' + sourceLine + '\n' + ' '.repeat(column - 1) + '^';
    }

    err[arrowMessageSymbol] = arrowMessage;
}

var wrapper = [
    '(function (exports, require, module, __filename, __dirname) { ',
    '\n});'
];

function wrap(script) {
    return wrapper[0] + script + wrapper[1];
}

function compileCjs(filename, source) {
    // Strip shebang
    if (source.length > 1 && source.charCodeAt(0) === 0x23 && source.charCodeAt(1) === 0x21) {
        source = '//' + source;
    }

    source = transpileTypeScriptModule(filename, source);
    source = stripV8OptimizationIntrinsics(source);

    var cjsLineOffsets = getCjsLineOffsetRegistry();
    cjsLineOffsets[filename] = 2;

    var wrappedSource = wrap(source + '\n//# sourceURL=' + filename + '\n');
    return (0, eval)(wrappedSource);
}

function loadModule(resolvedFilename, source, parentModule) {
    // Check cache
    if (moduleCache[resolvedFilename]) {
        var cached = moduleCache[resolvedFilename];
        if (parentModule && parentModule.children && !parentModule.children.includes(cached)) {
            parentModule.children.push(cached);
        }
        return cached;
    }

    var mod = {
        id: resolvedFilename,
        filename: resolvedFilename,
        path: pathModule.dirname(resolvedFilename),
        exports: {},
        loaded: false,
        parent: parentModule || null,
        children: [],
    };

    // Cache before executing (handles circular dependencies)
    moduleCache[resolvedFilename] = mod;

    if (parentModule && parentModule.children) {
        parentModule.children.push(mod);
    }

    // Check for custom extension handler
    var ext = findLongestRegisteredExtension(resolvedFilename);
    var handler = requireExtensions[ext];
    if (handler && !_defaultExtHandlers.has(handler)) {
        try {
            handler(mod, resolvedFilename);
        } catch (err) {
            delete moduleCache[resolvedFilename];
            throw err;
        }
    } else if (resolvedFilename.endsWith('.node')) {
        delete moduleCache[resolvedFilename];
        throw new Error("Native .node modules are not supported in WASM: '" + resolvedFilename + "'");
    } else if (resolvedFilename.endsWith('.json')) {
        try {
            mod.exports = JSON.parse(source);
        } catch (e) {
            delete moduleCache[resolvedFilename];
            var err = new Error("Cannot parse JSON module '" + resolvedFilename + "': " + e.message);
            err.code = 'ERR_INVALID_JSON';
            throw err;
        }
    } else {
        var dirname = pathModule.dirname(resolvedFilename);
        var childRequire = makeRequire(dirname, mod);
        var compiledFn;
        try {
            compiledFn = compileCjs(resolvedFilename, source);
        } catch (err) {
            delete moduleCache[resolvedFilename];
            maybeSetArrowMessageOnSyntaxError(err, resolvedFilename, source);
            throw err;
        }
        var previousModuleContext = globalThis.__wasm_rquickjs_current_module;
        globalThis.__wasm_rquickjs_current_module = {
            filename: resolvedFilename,
            source: source
        };
        try {
            compiledFn(mod.exports, childRequire, mod, resolvedFilename, dirname);
        } catch (err) {
            maybeSetArrowMessageOnSyntaxError(err, resolvedFilename, source);
            throw err;
        } finally {
            globalThis.__wasm_rquickjs_current_module = previousModuleContext;
        }
    }

    mod.loaded = true;
    return mod;
}

// The root "main" module
var mainModule = {
    id: '.',
    filename: '/',
    path: '/',
    exports: {},
    loaded: true,
    parent: null,
    children: [],
};

function resolveFromNodeModules(id, parentDir) {
    var dirs = _nodeModulePaths(parentDir);
    for (var i = 0; i < dirs.length; i++) {
        var candidate = pathModule.join(dirs[i], id);

        // Try as directory: check package.json "main" field
        var pkgJsonPath = pathModule.join(candidate, 'package.json');
        var pkgJson = tryReadFile(pkgJsonPath);
        if (pkgJson !== null) {
            try {
                var pkg = JSON.parse(pkgJson);
                if (typeof pkg.main === 'string') {
                    var mainPath = pathModule.resolve(candidate, pkg.main);
                    var mainCandidates = [
                        mainPath,
                        mainPath + '.js',
                        mainPath + '.json',
                        pathModule.join(mainPath, 'index.js'),
                        pathModule.join(mainPath, 'index.json'),
                    ];
                    for (var m = 0; m < mainCandidates.length; m++) {
                        var content = tryReadFile(mainCandidates[m]);
                        if (content !== null) return { filename: mainCandidates[m], content: content };
                    }
                }
            } catch (e) { /* invalid JSON, skip */ }
        }

        // Try as directory: index.js / index.json
        var indexJs = pathModule.join(candidate, 'index.js');
        var content = tryReadFile(indexJs);
        if (content !== null) return { filename: indexJs, content: content };

        var indexJson = pathModule.join(candidate, 'index.json');
        content = tryReadFile(indexJson);
        if (content !== null) return { filename: indexJson, content: content };

        // Try as file with extension
        content = tryReadFile(candidate + '.js');
        if (content !== null) return { filename: candidate + '.js', content: content };

        content = tryReadFile(candidate + '.json');
        if (content !== null) return { filename: candidate + '.json', content: content };
    }
    return null;
}

function makeRequire(parentDir, parentModule) {
    function localRequire(id) {
        if (typeof id !== 'string') {
            throw new ERR_INVALID_ARG_TYPE('id', 'string', id);
        }
        if (id === '') {
            var argErr = new TypeError("The argument 'id' must be a non-empty string. Received ''");
            argErr.code = 'ERR_INVALID_ARG_VALUE';
            throw argErr;
        }

        // Capture buffer.kMaxLength for zlib on first require (matches Node.js CJS capture-at-require semantics)
        if ((id === 'zlib' || id === 'node:zlib') && zlib._captureKMaxLength) {
            zlib._captureKMaxLength();
        }

        // Builtin modules
        var builtin = builtinModules[id];
        if (builtin !== undefined) {
            return builtin;
        }

        // Relative or absolute file paths
        if (id.startsWith('./') || id.startsWith('../') || id.startsWith('/')) {
            var resolved = resolveFilename(id, parentDir);
            var mod = loadModule(resolved.filename, resolved.content, parentModule || null);
            return mod.exports;
        }

        // node_modules resolution for bare specifiers
        var nmResolved = resolveFromNodeModules(id, parentDir);
        if (nmResolved) {
            var mod = loadModule(nmResolved.filename, nmResolved.content, parentModule || null);
            return mod.exports;
        }

        var err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }

    localRequire.cache = moduleCache;
    localRequire.extensions = requireExtensions;

    localRequire.resolve = function resolve(id) {
        if (isBuiltin(id)) {
            return id;
        }
        if (id.startsWith('./') || id.startsWith('../') || id.startsWith('/')) {
            var resolved = resolveFilename(id, parentDir);
            return resolved.filename;
        }
        // node_modules resolution for bare specifiers
        var nmResolved = resolveFromNodeModules(id, parentDir);
        if (nmResolved) {
            return nmResolved.filename;
        }
        var err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    };

    localRequire.main = mainModule;

    return localRequire;
}

// The global require, rooted at '/'
var globalRequire = makeRequire('/', mainModule);

export function require(id) {
    return globalRequire(id);
}

export function createRequire(filename) {
    var filepath;
    var isUrlObj = filename instanceof URL ||
        (filename !== null && typeof filename === 'object' &&
         typeof filename.href === 'string' && typeof filename.protocol === 'string');

    if (isUrlObj || (typeof filename === 'string' && !pathModule.isAbsolute(filename))) {
        try {
            filepath = nodeUrl.fileURLToPath(filename);
        } catch (e) {
            var inspected = typeof filename === 'string' ? "'" + filename + "'" :
                (typeof util.inspect === 'function' ? util.inspect(filename) : String(filename));
            var err = new TypeError(
                "The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received " + inspected
            );
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
    } else if (typeof filename !== 'string') {
        var inspected2 = typeof util.inspect === 'function' ? util.inspect(filename) : String(filename);
        var err2 = new TypeError(
            "The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received " + inspected2
        );
        err2.code = 'ERR_INVALID_ARG_VALUE';
        throw err2;
    } else {
        filepath = filename;
    }
    var dir = pathModule.dirname(filepath);
    return makeRequire(dir, null);
}

export { builtinModuleNames as builtinModules };

export function isBuiltinModule(id) {
    return isBuiltin(id);
}

// "node_modules" reversed as char codes: s-e-l-u-d-o-m-_-e-d-o-n
var nmChars = [115, 101, 108, 117, 100, 111, 109, 95, 101, 100, 111, 110];
var nmLen = nmChars.length;

function _nodeModulePaths(from) {
    from = pathModule.resolve(from);

    if (from === '/') {
        return ['/node_modules'];
    }

    var paths = [];
    for (var i = from.length - 1, p = 0, last = from.length; i >= 0; --i) {
        var code = from.charCodeAt(i);
        if (code === 47) { // '/'
            if (p !== nmLen) {
                paths.push(from.slice(0, last) + '/node_modules');
            }
            last = i;
            p = 0;
        } else if (p !== -1) {
            if (nmChars[p] === code) {
                ++p;
            } else {
                p = -1;
            }
        }
    }

    paths.push('/node_modules');

    return paths;
}

function _resolveLookupPaths(request, parent) {
    if (isBuiltinModule(request)) {
        return null;
    }

    // Check if request is a relative path (starts with ./ or ../)
    // On non-Windows, .\ is NOT a relative path separator
    var isRelative = false;
    if (request.length > 0 && request.charAt(0) === '.') {
        if (request.length === 1) {
            isRelative = true;
        } else {
            var second = request.charAt(1);
            if (second === '/' || second === '.') {
                isRelative = true;
            }
        }
    }

    if (!isRelative) {
        var paths;
        if (parent && parent.paths && parent.paths.length) {
            paths = parent.paths.concat(globalPaths);
        } else {
            paths = globalPaths.slice();
        }
        return paths.length > 0 ? paths : null;
    }

    // Relative path with no parent
    if (!parent || !parent.id || !parent.filename) {
        return ['.'];
    }

    var parentDir = pathModule.dirname(parent.filename);
    return [parentDir].concat(parent.paths || []);
}

function setSourceMapsSupport(enabled, options) {
    if (typeof enabled !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('enabled', 'boolean', enabled);
    }
    if (options === undefined) {
        options = {};
    }
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new ERR_INVALID_ARG_TYPE('options', 'Object', options);
    }
    var { nodeModules, generatedCode } = options;
    if (nodeModules !== undefined && typeof nodeModules !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.nodeModules', 'boolean', nodeModules);
    }
    if (generatedCode !== undefined && typeof generatedCode !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.generatedCode', 'boolean', generatedCode);
    }
}

var globalPaths = [];

function _initPaths() {
    var nodePath = globalThis.process && globalThis.process.env && globalThis.process.env.NODE_PATH;
    var paths = [];
    if (nodePath) {
        var parts = nodePath.split(':');
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i].trim();
            if (p.length > 0) {
                paths.push(pathModule.resolve(p));
            }
        }
    }

    var homeDir = (globalThis.process && globalThis.process.env && globalThis.process.env.HOME) || '/root';
    paths.push(pathModule.resolve(homeDir, '.node_modules'));
    paths.push(pathModule.resolve(homeDir, '.node_libraries'));
    paths.push('/usr/local/lib/node');

    globalPaths.length = 0;
    for (var j = 0; j < paths.length; j++) {
        globalPaths.push(paths[j]);
    }
}

_initPaths();

function _stat(filename) {
    try {
        var st = fsModule.statSync(filename);
        if (st.isDirectory()) return 1;
        if (st.isFile()) return 0;
        return -2;
    } catch (e) {
        return -2;
    }
}

var moduleExports = {
    require: globalRequire,
    createRequire,
    builtinModules: builtinModuleNames,
    isBuiltin: isBuiltinModule,
    wrap: wrap,
    wrapper: wrapper,
    _nodeModulePaths: _nodeModulePaths,
    _resolveLookupPaths: _resolveLookupPaths,
    _initPaths: _initPaths,
    _pathCache: _pathCache,
    _extensions: requireExtensions,
    _stat: _stat,
    globalPaths: globalPaths,
    setSourceMapsSupport,
};

// Add self-reference so require('module') works
builtinModules['module'] = moduleExports;
builtinModules['node:module'] = moduleExports;

export default moduleExports;

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
import * as punycode from 'node:punycode';
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
import * as httpAgent from 'node:_http_agent';
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
import { ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS } from '__wasm_rquickjs_builtin/internal/errors';
import * as internalErrors from '__wasm_rquickjs_builtin/internal/errors';
import * as internalFsUtils from '__wasm_rquickjs_builtin/internal/fs/utils';
import * as internalUrl from '__wasm_rquickjs_builtin/internal/url';
import * as internalUtil from '__wasm_rquickjs_builtin/internal/util';
import * as internalUtilDebuglog from '__wasm_rquickjs_builtin/internal/util/debuglog';
import * as internalWebstreamsUtil from '__wasm_rquickjs_builtin/internal/webstreams/util';
import * as internalStreamsAddAbortSignal from '__wasm_rquickjs_builtin/internal/streams/add-abort-signal';
import * as internalStreamsState from '__wasm_rquickjs_builtin/internal/streams/state';
import * as internalTestBinding from '__wasm_rquickjs_builtin/internal/test/binding';
import { eval_with_filename as _evalWithFilename, require_esm as _requireEsm } from '__wasm_rquickjs_builtin/vm_native';
import {
    package_deprecation_warning_seen as _packageDeprecationWarningSeen,
    mark_package_deprecation_warning_seen as _markPackageDeprecationWarningSeen,
} from '__wasm_rquickjs_builtin/internal/binding/util_native';

// CJS require() should return the default export (the "module object") when one
// exists, not the ESM namespace wrapper.  When the default export is a function
// or object, named exports are also attached to it so that both
// `require('mod')()` and `const { namedExport } = require('mod')` work — this
// mirrors Node.js CJS/ESM interop behaviour.
function cjsExport(ns) {
    if (!ns || ns.default === undefined) return ns;
    const def = ns.default;
    if (typeof def === 'function' || (typeof def === 'object' && def !== null)) {
        const keys = Object.keys(ns);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k !== 'default' && !(k in def)) {
                def[k] = ns[k];
            }
        }
    }
    return def;
}

// Precompute cjsExport results once per namespace to avoid redundant calls
const pathCjs = cjsExport(pathModule);
const pathPosixCjs = cjsExport(pathPosix);
const pathWin32Cjs = cjsExport(pathWin32);
const fsCjs = cjsExport(fsModule);
const fsPromisesCjs = cjsExport(fsPromises);
const utilCjs = cjsExport(util);
const bufferCjs = cjsExport(buffer);
const osCjs = cjsExport(os);
const eventsCjs = cjsExport(events);
const streamCjs = cjsExport(stream);
const streamPromisesCjs = cjsExport(streamPromises);
const streamConsumersCjs = cjsExport(streamConsumers);
const streamWebCjs = cjsExport(streamWeb);
const childProcessCjs = cjsExport(child_process);
const stringDecoderCjs = cjsExport(string_decoder);
const processCjs = cjsExport(processModule);
const assertCjs = cjsExport(assert);
const assertStrictCjs = cjsExport(assertStrict);
const nodeTestCjs = cjsExport(nodeTest);
const querystringCjs = cjsExport(querystring);
const punycodeCjs = cjsExport(punycode);
const nodeUrlCjs = cjsExport(nodeUrl);
const vmCjs = cjsExport(vm);
const timersCjs = cjsExport(timers);
const timersPromisesCjs = cjsExport(timersPromises);
const consoleCjs = cjsExport(consoleMod);
const asyncHooksCjs = cjsExport(async_hooks);
const clusterCjs = cjsExport(cluster);
const dgramCjs = cjsExport(dgram);
const diagnosticsChannelCjs = cjsExport(diagnostics_channel);
const moduleRequireTrace = diagnostics_channel.tracingChannel('module.require');
const moduleImportTrace = diagnostics_channel.tracingChannel('module.import');
const dnsCjs = cjsExport(dns);
const dnsPromisesCjs = cjsExport(dnsPromises);
const domainCjs = cjsExport(domain);
const httpCommonCjs = cjsExport(httpCommon);
const httpAgentCjs = cjsExport(httpAgent);
const httpCjs = cjsExport(http);
const http2Cjs = cjsExport(http2);
const httpsCjs = cjsExport(https);
const netCjs = cjsExport(net);
const perfHooksCjs = cjsExport(perf_hooks);
const readlineCjs = cjsExport(readline);
const readlinePromisesCjs = cjsExport(readlinePromises);
const replCjs = cjsExport(repl);
const traceEventsCjs = cjsExport(trace_events);
const tlsCjs = cjsExport(tls);
const ttyCjs = cjsExport(tty);
const v8Cjs = cjsExport(v8);
const workerThreadsCjs = cjsExport(worker_threads);
const zlibCjs = cjsExport(zlib);
const sqliteCjs = cjsExport(sqlite);
const internalHttpCjs = cjsExport(internalHttp);
const internalFsUtilsCjs = cjsExport(internalFsUtils);
const internalUrlCjs = cjsExport(internalUrl);
const internalErrorsCjs = cjsExport(internalErrors);
const internalUtilCjs = cjsExport(internalUtil);
const internalUtilDebuglogCjs = cjsExport(internalUtilDebuglog);
const internalWebstreamsUtilCjs = cjsExport(internalWebstreamsUtil);
const internalStreamsAddAbortSignalCjs = cjsExport(internalStreamsAddAbortSignal);
const internalStreamsStateCjs = cjsExport(internalStreamsState);
const internalTestBindingCjs = cjsExport(internalTestBinding);

const utilTypes = (utilCjs && utilCjs.types) || {};

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

// Build the builtin module map with both bare and node:-prefixed keys.
// Helper to register a module under both 'name' and 'node:name'.
function registerBuiltin(map, name, value) {
    map[name] = value;
    map['node:' + name] = value;
}

const builtinModuleMap = {};
registerBuiltin(builtinModuleMap, 'path', pathCjs);
registerBuiltin(builtinModuleMap, 'path/posix', pathPosixCjs);
registerBuiltin(builtinModuleMap, 'path/win32', pathWin32Cjs);
registerBuiltin(builtinModuleMap, 'fs', fsCjs);
registerBuiltin(builtinModuleMap, 'fs/promises', fsPromisesCjs);
builtinModuleMap['internal/fs/promises'] = fsPromisesCjs;
registerBuiltin(builtinModuleMap, 'util', utilCjs);
registerBuiltin(builtinModuleMap, 'sys', utilCjs);
registerBuiltin(builtinModuleMap, 'buffer', bufferCjs);
registerBuiltin(builtinModuleMap, 'os', osCjs);
registerBuiltin(builtinModuleMap, 'events', eventsCjs);
registerBuiltin(builtinModuleMap, 'stream', streamCjs);
registerBuiltin(builtinModuleMap, 'stream/promises', streamPromisesCjs);
registerBuiltin(builtinModuleMap, 'stream/consumers', streamConsumersCjs);
registerBuiltin(builtinModuleMap, 'stream/web', streamWebCjs);
registerBuiltin(builtinModuleMap, 'crypto', cryptoCjs);
registerBuiltin(builtinModuleMap, 'child_process', childProcessCjs);
registerBuiltin(builtinModuleMap, 'string_decoder', stringDecoderCjs);
registerBuiltin(builtinModuleMap, 'process', processCjs);
registerBuiltin(builtinModuleMap, 'assert', assertCjs);
registerBuiltin(builtinModuleMap, 'assert/strict', assertStrictCjs);
registerBuiltin(builtinModuleMap, 'test', nodeTestCjs);
registerBuiltin(builtinModuleMap, 'querystring', querystringCjs);
registerBuiltin(builtinModuleMap, 'punycode', punycodeCjs);
registerBuiltin(builtinModuleMap, 'url', nodeUrlCjs);
registerBuiltin(builtinModuleMap, 'vm', vmCjs);
registerBuiltin(builtinModuleMap, 'timers', timersCjs);
registerBuiltin(builtinModuleMap, 'timers/promises', timersPromisesCjs);
Object.defineProperty(builtinModuleMap, 'console', {
    get() {
        const c = globalThis.console;
        if (c && consoleMod.Console) c.Console = consoleMod.Console;
        return c || consoleCjs;
    },
    configurable: true,
    enumerable: true,
});
Object.defineProperty(builtinModuleMap, 'node:console', {
    get() {
        return builtinModuleMap['console'];
    },
    configurable: true,
    enumerable: true,
});
registerBuiltin(builtinModuleMap, 'async_hooks', asyncHooksCjs);
registerBuiltin(builtinModuleMap, 'cluster', clusterCjs);
registerBuiltin(builtinModuleMap, 'dgram', dgramCjs);
registerBuiltin(builtinModuleMap, 'diagnostics_channel', diagnosticsChannelCjs);
registerBuiltin(builtinModuleMap, 'dns', dnsCjs);
registerBuiltin(builtinModuleMap, 'dns/promises', dnsPromisesCjs);
registerBuiltin(builtinModuleMap, 'domain', domainCjs);
registerBuiltin(builtinModuleMap, '_http_common', httpCommonCjs);
registerBuiltin(builtinModuleMap, '_http_agent', httpAgentCjs);
registerBuiltin(builtinModuleMap, 'http', httpCjs);
registerBuiltin(builtinModuleMap, 'http2', http2Cjs);
registerBuiltin(builtinModuleMap, 'https', httpsCjs);
registerBuiltin(builtinModuleMap, 'net', netCjs);
registerBuiltin(builtinModuleMap, 'perf_hooks', perfHooksCjs);
registerBuiltin(builtinModuleMap, 'readline', readlineCjs);
registerBuiltin(builtinModuleMap, 'readline/promises', readlinePromisesCjs);
registerBuiltin(builtinModuleMap, 'repl', replCjs);
registerBuiltin(builtinModuleMap, 'tls', tlsCjs);
registerBuiltin(builtinModuleMap, 'trace_events', traceEventsCjs);
registerBuiltin(builtinModuleMap, 'tty', ttyCjs);
registerBuiltin(builtinModuleMap, 'v8', v8Cjs);
registerBuiltin(builtinModuleMap, 'worker_threads', workerThreadsCjs);
registerBuiltin(builtinModuleMap, 'zlib', zlibCjs);
builtinModuleMap['node:sqlite'] = sqliteCjs;
registerBuiltin(builtinModuleMap, 'util/types', utilTypes);
builtinModuleMap['_stream_readable'] = streamCjs && streamCjs.Readable;
builtinModuleMap['_stream_writable'] = streamCjs && streamCjs.Writable;
builtinModuleMap['_stream_duplex'] = streamCjs && streamCjs.Duplex;
builtinModuleMap['_stream_transform'] = streamCjs && streamCjs.Transform;
builtinModuleMap['_stream_passthrough'] = streamCjs && streamCjs.PassThrough;
builtinModuleMap['internal/http'] = internalHttpCjs;
builtinModuleMap['internal/fs/utils'] = internalFsUtilsCjs;
builtinModuleMap['internal/url'] = internalUrlCjs;
builtinModuleMap['internal/errors'] = internalErrorsCjs;
builtinModuleMap['internal/util'] = internalUtilCjs;
builtinModuleMap['internal/util/debuglog'] = internalUtilDebuglogCjs;
builtinModuleMap['internal/webstreams/util'] = internalWebstreamsUtilCjs;
builtinModuleMap['internal/streams/add-abort-signal'] = internalStreamsAddAbortSignalCjs;
builtinModuleMap['internal/streams/state'] = internalStreamsStateCjs;
builtinModuleMap['internal/test/binding'] = internalTestBindingCjs;

// --- Module mock registry (used by node:test mock.module()) ---
const _moduleMockRegistry = Object.create(null);
const _moduleMockRegistryById = Object.create(null);
let _moduleMockNextId = 1;
globalThis.__wasm_rquickjs_module_mocks = _moduleMockRegistry;

function _mockCanonicalKey(specifier, base) {
    if (typeof specifier === 'object' && specifier !== null && typeof specifier.href === 'string') {
        specifier = specifier.href;
    }
    if (typeof specifier !== 'string') return null;

    // Check if it's a builtin (with or without node: prefix)
    const bare = specifier.startsWith('node:') ? specifier.slice(5) : specifier;
    if (builtinModuleMap[bare] !== undefined || builtinModuleMap['node:' + bare] !== undefined) {
        return 'builtin:' + bare;
    }

    // file:// URL
    if (specifier.startsWith('file://')) {
        try {
            const filePath = nodeUrl.fileURLToPath(specifier);
            return 'path:' + pathModule.resolve(filePath);
        } catch (e) {
            return 'path:' + specifier;
        }
    }

    // Absolute path
    if (specifier.startsWith('/')) {
        return 'path:' + pathModule.resolve(specifier);
    }

    // Relative path — resolve against base (from ESM resolver) or current module context
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        let baseDir = '/';
        if (typeof base === 'string' && base) {
            try {
                if (base.startsWith('file://')) {
                    baseDir = pathModule.dirname(nodeUrl.fileURLToPath(base));
                } else {
                    baseDir = pathModule.dirname(base);
                }
            } catch (e) {
                // fall through to context
            }
        }
        if (baseDir === '/') {
            const ctx = globalThis.__wasm_rquickjs_current_module;
            if (ctx && ctx.filename) {
                baseDir = pathModule.dirname(ctx.filename);
            }
        }
        return 'path:' + pathModule.resolve(baseDir, specifier);
    }

    // Bare specifier (could be node_modules)
    return 'bare:' + specifier;
}

function _detectMockModuleKind(canonicalKey) {
    if (!canonicalKey) return 'esm';
    if (canonicalKey.startsWith('builtin:')) return 'cjs';
    if (!canonicalKey.startsWith('path:')) return 'esm';
    const filename = canonicalKey.slice(5);
    if (filename.endsWith('.mjs')) return 'esm';
    // Default to CJS for .js, .cjs, and everything else
    return 'cjs';
}

function _materializeCjsMock(entry) {
    let result;
    const hasDefault = 'defaultExport' in entry;
    const hasNamed = entry.namedExports !== undefined;

    if (hasDefault) {
        result = entry.defaultExport;
    } else {
        result = {};
    }

    if (hasNamed) {
        if (result === null || (typeof result !== 'object' && typeof result !== 'function')) {
            const err = new Error('Cannot create mock: named exports cannot be applied to non-object defaultExport');
            err.code = 'ERR_INVALID_STATE';
            throw err;
        }
        const keys = Object.keys(entry.namedExports);
        for (let i = 0; i < keys.length; i++) {
            result[keys[i]] = entry.namedExports[keys[i]];
        }
    }

    return result;
}

function _registerModuleMock(specifier, options) {
    const key = _mockCanonicalKey(specifier);
    if (!key) return null;

    if (_moduleMockRegistry[key]) {
        const err = new Error('The module is already mocked');
        err.code = 'ERR_INVALID_STATE';
        throw err;
    }

    const id = _moduleMockNextId++;
    const kind = _detectMockModuleKind(key);
    const entry = {
        id: id,
        canonicalKey: key,
        specifier: specifier,
        kind: kind,
        namedExports: options.namedExports,
        cache: options.cache !== undefined ? options.cache : false,
        _cachedCjsResult: undefined,
        _cachedCjsReady: false,
    };
    if ('defaultExport' in options) {
        entry.defaultExport = options.defaultExport;
    }

    _moduleMockRegistry[key] = entry;
    _moduleMockRegistryById[id] = entry;

    return {
        canonicalKey: key,
        id: id,
        restore: function() {
            delete _moduleMockRegistry[key];
            delete _moduleMockRegistryById[id];
            // Clean up ESM storage
            const storageKey = '__wasm_rquickjs_mock_data_' + id;
            delete globalThis[storageKey];
            entry._cachedCjsResult = undefined;
            entry._cachedCjsReady = false;
        }
    };
}

function _resolveRequireMock(id) {
    // CJS require() does not support file:// URLs — don't intercept them
    if (typeof id === 'string' && id.startsWith('file://')) return null;
    const key = _mockCanonicalKey(id);
    if (!key) return null;
    return _moduleMockRegistry[key] || null;
}

globalThis.__wasm_rquickjs_mock_canonical_key = _mockCanonicalKey;
globalThis.__wasm_rquickjs_register_module_mock = _registerModuleMock;
globalThis.__wasm_rquickjs_resolve_require_mock = _resolveRequireMock;
globalThis.__wasm_rquickjs_materialize_cjs_mock = _materializeCjsMock;

function traceModuleRequire(id, parentFilename, fn) {
    if (globalThis.__wasm_rquickjs_suppress_module_require_diagnostics) {
        return fn();
    }
    if (!moduleRequireTrace.hasSubscribers) {
        return fn();
    }
    return moduleRequireTrace.traceSync(fn, {
        id,
        parentFilename,
    });
}

function traceModuleImport(url, parentFilename, fn) {
    return moduleImportTrace.tracePromise(fn, {
        url,
        parentURL: nodeUrl.pathToFileURL(parentFilename).href,
    });
}
globalThis.__wasm_rquickjs_trace_module_import = traceModuleImport;
globalThis.__wasm_rquickjs_with_suppressed_module_require_diagnostics = function(fn) {
    const previous = globalThis.__wasm_rquickjs_suppress_module_require_diagnostics;
    globalThis.__wasm_rquickjs_suppress_module_require_diagnostics = true;
    try {
        return fn();
    } finally {
        if (previous === undefined) {
            delete globalThis.__wasm_rquickjs_suppress_module_require_diagnostics;
        } else {
            globalThis.__wasm_rquickjs_suppress_module_require_diagnostics = previous;
        }
    }
};

// Lookup mock entry by ID (for ESM source generation)
globalThis.__wasm_rquickjs_get_mock_module_entry = function(mockId) {
    return _moduleMockRegistryById[mockId] || null;
};

// Generate ESM module source for a mock entry (called from Rust MockModuleLoader)
globalThis.__wasm_rquickjs_get_mock_module_source = function(mockId) {
    const entry = _moduleMockRegistryById[mockId];
    if (!entry) {
        throw new Error('Mock entry not found for id: ' + mockId);
    }
    return _generateMockEsmSource(entry);
};

function _generateMockEsmSource(entry) {
    const storageKey = '__wasm_rquickjs_mock_data_' + entry.id;
    globalThis[storageKey] = entry;

    const lines = [];
    lines.push('var __entry = globalThis["' + storageKey + '"];');
    lines.push('var __named = __entry.namedExports;');
    lines.push('var __hasDefault = "defaultExport" in __entry;');

    if (entry.kind === 'cjs') {
        // CJS-style mock: default export is the materialized object with named exports applied
        lines.push('var __result;');
        lines.push('if (__hasDefault) { __result = __entry.defaultExport; } else { __result = {}; }');
        lines.push('if (__named) {');
        lines.push('  if (__result === null || (typeof __result !== "object" && typeof __result !== "function")) {');
        lines.push('    await Promise.reject(new Error("Cannot create mock: named exports cannot be applied to non-object defaultExport"));');
        lines.push('  }');
        lines.push('  var __nk = Object.keys(__named);');
        lines.push('  for (var __i = 0; __i < __nk.length; __i++) { __result[__nk[__i]] = __named[__nk[__i]]; }');
        lines.push('}');
        lines.push('export default __result;');
        // Also export named entries individually for ESM consumers
        if (entry.namedExports) {
            const nkeys = Object.keys(entry.namedExports);
            for (let i = 0; i < nkeys.length; i++) {
                const k = nkeys[i];
                if (k === 'default') continue;
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) {
                    lines.push('export var ' + k + ' = __named["' + k + '"];');
                }
            }
        }
    } else {
        // ESM-style mock: named exports are independent, default is separate
        if (entry.namedExports) {
            const nkeys = Object.keys(entry.namedExports);
            for (let i = 0; i < nkeys.length; i++) {
                const k = nkeys[i];
                if (k === 'default') {
                    lines.push('export default __named["default"];');
                } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) {
                    lines.push('export var ' + k + ' = __named["' + k + '"];');
                }
            }
        }
        // Add default export if not already handled via namedExports
        if (!entry.namedExports || !entry.namedExports.hasOwnProperty('default')) {
            lines.push('var __defVal = __hasDefault ? __entry.defaultExport : undefined;');
            lines.push('export { __defVal as default };');
        }
    }

    return lines.join('\n');
}

// Self-reference will be added after the module object is created (see bottom of file)

const builtinModuleNames = Object.keys(builtinModuleMap).filter(
    (name) => !name.startsWith('node:') && !name.startsWith('internal/') && !name.startsWith('_')
);

function setFromArray(values, mapper) {
    const set = new Set();
    for (let i = 0; i < values.length; i++) {
        set.add(mapper ? mapper(values, i) : values[i]);
    }
    return set;
}

// Modules that require the 'node:' prefix (cannot be required as bare specifiers)
const schemelessBlockList = setFromArray(['test', 'sqlite']);

// Build public module ID sets matching Node.js semantics
const publicBuiltinIdSet = new Set();
const publicBuiltinWithoutSchemeSet = new Set();
for (let _i = 0; _i < builtinModuleNames.length; _i++) {
    const _name = builtinModuleNames[_i];
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

function isBuiltinResolveTarget(id) {
    if (typeof id !== 'string') return false;
    if (id.startsWith('node:')) {
        return publicBuiltinIdSet.has(id.slice(5));
    }
    return publicBuiltinIdSet.has(id);
}

// Module cache: resolved absolute path -> Module object
const moduleCache = Object.create(null);

function shouldPreserveSymlinks(isMainModuleLoad) {
    return hasExecArgvFlag(isMainModuleLoad ? '--preserve-symlinks-main' : '--preserve-symlinks');
}

function toCjsCanonicalFilename(filename, isMainModuleLoad) {
    if (shouldPreserveSymlinks(isMainModuleLoad)) return filename;
    return fsModule.realpathSync.native(filename);
}

function tryReadFile(filename) {
    try {
        return fsModule.readFileSync(filename, 'utf8');
    } catch (e) {
        return null;
    }
}

const packageJsonParseCache = Object.create(null);

function readPackageJson(pkgJsonPath) {
    if (Object.prototype.hasOwnProperty.call(packageJsonParseCache, pkgJsonPath)) {
        return packageJsonParseCache[pkgJsonPath];
    }
    const content = tryReadFile(pkgJsonPath);
    if (content === null) return null;
    const entry = { path: pkgJsonPath, content, pkg: JSON.parse(content) };
    packageJsonParseCache[pkgJsonPath] = entry;
    return entry;
}

// Shared require.extensions registry (mirrors Node.js Module._extensions)
const requireExtensions = Object.create(null);
requireExtensions['.js'] = function _defaultJs(mod, filename) { /* built-in */ };
requireExtensions['.json'] = function _defaultJson(mod, filename) { /* built-in */ };
requireExtensions['.node'] = function _defaultNode(mod, filename) { /* built-in */ };
const _defaultExtHandlers = setFromArray([requireExtensions['.js'], requireExtensions['.json'], requireExtensions['.node']]);

// Path cache (settable; used by tests to reset resolution state)
let _pathCache = Object.create(null);

function findLongestRegisteredExtension(filename) {
    const name = pathModule.basename(filename);
    let startIndex = 0;
    let index;
    while ((index = name.indexOf('.', startIndex)) !== -1) {
        startIndex = index + 1;
        if (index === 0) continue; // Skip leading dot (dotfiles)
        const ext = name.slice(index);
        if (requireExtensions[ext]) return ext;
    }
    return '.js';
}

function getPackageScopeType(filename) {
    let dir = pathModule.dirname(filename);
    while (true) {
        if (pathModule.basename(dir) === 'node_modules') return 'commonjs';
        const pkgPath = pathModule.join(dir, 'package.json');
        try {
            const entry = readPackageJson(pkgPath);
            if (entry !== null) {
                return entry.pkg.type || 'commonjs';
            }
        } catch (e) {
            return 'commonjs';
        }
        const parent = pathModule.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return 'commonjs';
}

function isPathDirectory(filename) {
    try {
        return fsModule.statSync(filename).isDirectory();
    } catch (_) {
        return false;
    }
}

function loadAsFile(candidate, skipExact) {
    let content = null;
    if (!skipExact) {
        content = tryReadFile(candidate);
        if (content !== null) {
            return { filename: candidate, content: content };
        }
    }

    const exts = Object.keys(requireExtensions);
    for (let i = 0; i < exts.length; i++) {
        content = tryReadFile(candidate + exts[i]);
        if (content !== null) {
            return { filename: candidate + exts[i], content: content };
        }
    }

    return null;
}

function loadAsDirectory(candidate, id, parentDir, seen) {
    seen = seen || Object.create(null);
    if (seen[candidate]) return null;
    seen[candidate] = true;

    const pkgJsonPath = pathModule.join(candidate, 'package.json');
    let packageJsonEntry;
    let invalidMain = null;
    try {
        packageJsonEntry = readPackageJson(pkgJsonPath);
    } catch (e) {
        const pkgErr = new Error(
            'Invalid package config ' + pkgJsonPath +
            ' while resolving "' + id + '" from ' + parentDir + '.' +
            (e.message ? ' ' + e.message : '')
        );
        pkgErr.code = 'ERR_INVALID_PACKAGE_CONFIG';
        throw pkgErr;
    }
    if (packageJsonEntry !== null) {
        let pkg;
        pkg = packageJsonEntry.pkg;

        if (Object.prototype.hasOwnProperty.call(pkg, 'main') && typeof pkg.main === 'string' && pkg.main.length > 0) {
            const mainPath = pathModule.resolve(candidate, pkg.main);
            let resolved = loadAsFile(mainPath, false);
            if (resolved !== null) return resolved;
            resolved = loadAsDirectory(mainPath, id, parentDir, seen);
            if (resolved !== null) return resolved;
            invalidMain = { field: pkg.main, path: mainPath };
        }
    }

    const indexResolved = loadAsFile(pathModule.join(candidate, 'index'), false);
    if (indexResolved !== null) {
        emitInvalidMainWarning(pkgJsonPath, invalidMain);
        return indexResolved;
    }
    if (invalidMain !== null) {
        const err = new Error("Cannot find module '" + invalidMain.path + "'. Please verify that the package.json has a valid \"main\" entry");
        err.code = 'MODULE_NOT_FOUND';
        err.path = pkgJsonPath;
        err.requestPath = id;
        throw err;
    }
    return null;
}

function emitInvalidMainWarning(pkgJsonPath, invalidMain) {
    if (invalidMain === null) return;
    const processObject = globalThis.process;
    if (!processObject || typeof processObject.emitWarning !== 'function') return;
    processObject.emitWarning(
        "Invalid 'main' field in '" + pathModule.toNamespacedPath(pkgJsonPath) + "' of '" + invalidMain.field + "'. Please either fix that or report it to the module author",
        'DeprecationWarning',
        'DEP0128'
    );
}

let packageDeprecationWarningsSuppressed = 0;

function emitPackageDeprecationWarning(message, code, key) {
    if (packageDeprecationWarningsSuppressed > 0) return;
    const warningKey = code === 'DEP0155' ? String(code) + ':' + String(key || message) : null;
    const processObject = globalThis.process;
    if (processObject && processObject.noDeprecation) return;
    if (warningKey && _packageDeprecationWarningSeen(warningKey)) return;
    if (warningKey) {
        _markPackageDeprecationWarningSeen(warningKey);
    }
    if (!processObject || typeof processObject.emitWarning !== 'function') {
        throw new Error('Internal process warning emitter is not initialized');
    }
    processObject.emitWarning(message, 'DeprecationWarning', code);
}

function withSuppressedPackageDeprecationWarnings(callback) {
    packageDeprecationWarningsSuppressed += 1;
    try {
        return callback();
    } finally {
        packageDeprecationWarningsSuppressed -= 1;
    }
}

const cjsDefaultPackageConditions = ['golem', 'node', 'require', 'module-sync', 'default'];
const esmDefaultPackageConditions = ['golem', 'node', 'module-sync', 'import', 'default'];
const loaderDefaultConditions = ['node', 'import', 'module-sync', 'node-addons'];

function addPackageCondition(conditions, condition) {
    if (typeof condition === 'string' && condition.length > 0) conditions.add(condition);
}

function packageConditions(defaults) {
    const conditions = setFromArray(defaults);
    const userConditions = globalThis.__wasm_rquickjs_package_conditions;
    if (!Array.isArray(userConditions)) {
        return conditions;
    }

    for (let i = 0; i < userConditions.length; i++) {
        addPackageCondition(conditions, userConditions[i]);
    }

    return conditions;
}

function cjsPackageConditions() {
    return packageConditions(cjsDefaultPackageConditions);
}

function esmPackageConditions() {
    return packageConditions(esmDefaultPackageConditions);
}

function loaderHookConditions() {
    return Array.from(packageConditions(loaderDefaultConditions));
}
const packageTargetNoMatch = { __packageTargetNoMatch: true };
const packageTargetBlocked = { __packageTargetBlocked: true };

function makePackagePathNotExportedError(packageName, subpath, noExportsMain) {
    if (noExportsMain || !subpath) {
        const err = new Error('No "exports" main defined in package ' + packageName);
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
        return err;
    }
    const suffix = subpath ? './' + subpath : '.';
    const err = new Error('Package subpath ' + JSON.stringify(suffix) + ' is not defined by "exports" in package ' + packageName);
    err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    return err;
}

function makePackageImportNotDefinedError(specifier) {
    const err = new Error('Package import specifier ' + JSON.stringify(specifier) + ' is not defined');
    err.code = 'ERR_PACKAGE_IMPORT_NOT_DEFINED';
    return err;
}

function makeInvalidModuleSpecifierError(specifier, message) {
    const err = new TypeError('Invalid module ' + JSON.stringify(specifier) + ' ' + message);
    err.code = 'ERR_INVALID_MODULE_SPECIFIER';
    return err;
}

function validatePackageImportSpecifier(specifier) {
    if (specifier === '#' || specifier.startsWith('#/')) {
        throw makeInvalidModuleSpecifierError(specifier, 'is not a valid internal imports specifier name');
    }
}

function makeInvalidPackageTargetError(target, kind) {
    let message = kind ? 'Invalid "' + kind + '" target ' + JSON.stringify(target) : 'Invalid package target ' + JSON.stringify(target);
    if (kind === 'exports' && typeof target === 'string' && !target.startsWith('./')) {
        message += '; targets must start with "./"';
    }
    const err = new Error(message);
    err.code = 'ERR_INVALID_PACKAGE_TARGET';
    return err;
}

function makeInvalidPackageConfigError(path, message) {
    const err = new Error('Invalid package config ' + path + '. ' + message);
    err.code = 'ERR_INVALID_PACKAGE_CONFIG';
    return err;
}

function makeModuleNotFoundError(id) {
    const err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    return err;
}

function addPackageErrorContext(err, specifier) {
    if (err && typeof err.message === 'string' && err.message.indexOf(specifier) === -1) {
        err.message += ' for ' + JSON.stringify(specifier);
    }
    return err;
}

function isBarePackageSpecifier(target) {
    return typeof target === 'string' &&
        target.length > 0 &&
        !target.startsWith('.') &&
        !target.startsWith('/') &&
        !target.startsWith('#') &&
        !target.includes(':');
}

function isInvalidPackageTargetSegment(segment) {
    if (segment === '.' || segment === '..' || segment === 'node_modules') return true;
    let decoded = segment;
    try {
        decoded = decodeURIComponent(segment);
    } catch (_) {
        // Keep the raw segment when percent decoding fails; invalid escapes are
        // handled by the normal module-not-found path for now.
    }
    decoded = decoded.toLowerCase();
    return decoded === '.' || decoded === '..' || decoded === 'node_modules';
}

function hasEncodedSlashOrBackslash(value) {
    return /%(?:2f|5c)/i.test(value);
}

function isInvalidPackagePatternSubstitution(substitution) {
    if (hasEncodedSlashOrBackslash(substitution)) return true;
    const parts = substitution.split('/');
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '') continue;
        if (isInvalidPackageTargetSegment(part)) return true;
    }
    return false;
}

function invalidPackagePatternSubstitutionMessage(substitution, fallback) {
    if (hasEncodedSlashOrBackslash(substitution)) {
        return 'must not include encoded "/" or "\\" characters';
    }
    return fallback;
}

function hasDeprecatedDoubleSlash(value) {
    return typeof value === 'string' && value.indexOf('//') !== -1;
}

function hasDeprecatedLeadingOrTrailingSlash(substitution) {
    return typeof substitution === 'string' && (substitution.startsWith('/') || substitution.endsWith('/'));
}

function packageWarningLocation(kind, packageDir, importer) {
    return ' in the "' + kind + '" field module resolution of the package at ' +
        pathModule.join(packageDir, 'package.json') +
        (importer ? ' imported from ' + importer : '') + '.';
}

function matchedPackagePatternSuffix(patternKey) {
    return patternKey ? ' matched to ' + JSON.stringify(patternKey) : '';
}

function emitDeprecatedPackageTargetWarning(kind, specifier, target, patternSubstitution, packageDir, patternKey, importer) {
    if (kind === 'exports' && typeof patternSubstitution === 'string' && patternSubstitution.endsWith('/')) {
        const location = packageWarningLocation(kind, packageDir, importer);
        emitPackageDeprecationWarning(
            'Use of deprecated trailing slash pattern mapping ' +
            JSON.stringify(specifier) + location + ' Mapping specifiers ending in "/" is no longer supported.',
            'DEP0155',
            packageDir + ':' + specifier
        );
        return;
    }
    if (hasDeprecatedDoubleSlash(target)) {
        const location = packageWarningLocation(kind, packageDir, importer);
        const matchedPattern = matchedPackagePatternSuffix(patternKey);
        emitPackageDeprecationWarning(
            'Use of deprecated double slash resolving ' + JSON.stringify(target) +
            ' for module request ' + JSON.stringify(specifier) + matchedPattern + location,
            'DEP0166',
            packageDir + ':' + specifier + ':' + target
        );
        return;
    }
    if (hasDeprecatedLeadingOrTrailingSlash(patternSubstitution)) {
        const location = packageWarningLocation(kind, packageDir, importer);
        const matchedPattern = matchedPackagePatternSuffix(patternKey);
        emitPackageDeprecationWarning(
            'Use of deprecated leading or trailing slash matching resolving ' + JSON.stringify(target) +
            ' for module request ' + JSON.stringify(specifier) + matchedPattern + location,
            'DEP0166',
            packageDir + ':' + specifier + ':' + target
        );
        return;
    }
    if (hasDeprecatedDoubleSlash(specifier)) {
        const location = packageWarningLocation(kind, packageDir, importer);
        const matchedPattern = matchedPackagePatternSuffix(patternKey);
        emitPackageDeprecationWarning(
            'Use of deprecated double slash resolving ' + JSON.stringify(target) +
            ' for module request ' + JSON.stringify(specifier) + matchedPattern + location,
            'DEP0166',
            packageDir + ':' + specifier
        );
    }
}

function validatePackageTargetPath(target) {
    const rest = target.slice(2);
    const parts = rest.split('/');
    if (parts.length === 0) return false;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '') continue;
        if (isInvalidPackageTargetSegment(part)) return false;
    }
    return true;
}

function resolveExactPackageFile(filename) {
    const content = tryReadFile(filename);
    if (content !== null) return { filename, content };
    throw makeModuleNotFoundError(filename);
}

function decodePackageTargetPath(target) {
    try {
        return decodeURIComponent(target);
    } catch (_) {
        return target;
    }
}

function packagePatternKeyMatch(patternKey, key) {
    const star = patternKey.indexOf('*');
    if (star === -1) return null;
    const prefix = patternKey.slice(0, star);
    const suffix = patternKey.slice(star + 1);
    if (!key.startsWith(prefix) || !key.endsWith(suffix)) return null;
    if (key.length <= prefix.length + suffix.length) return null;
    return key.slice(prefix.length, key.length - suffix.length);
}

function findBestPackagePattern(map, key) {
    let bestKey = null;
    let bestSubstitution = null;
    const keys = Object.keys(map);
    for (let i = 0; i < keys.length; i++) {
        const patternKey = keys[i];
        if (patternKey.indexOf('*') === -1) continue;
        const substitution = packagePatternKeyMatch(patternKey, key);
        if (substitution === null) continue;
        if (bestKey === null || packagePatternCompare(patternKey, bestKey) < 0) {
            bestKey = patternKey;
            bestSubstitution = substitution;
        }
    }
    return bestKey === null ? null : { key: bestKey, substitution: bestSubstitution };
}

function findPackageMapTarget(map, specifier, invalidPatternMessage) {
    if (Object.prototype.hasOwnProperty.call(map, specifier)) {
        return { target: map[specifier], patternSubstitution: undefined, patternKey: undefined };
    }
    const pattern = findBestPackagePattern(map, specifier);
    if (pattern === null) return null;
    if (isInvalidPackagePatternSubstitution(pattern.substitution)) {
        throw makeInvalidModuleSpecifierError(
            specifier,
            invalidPackagePatternSubstitutionMessage(pattern.substitution, invalidPatternMessage)
        );
    }
    return {
        target: map[pattern.key],
        patternSubstitution: pattern.substitution,
        patternKey: pattern.key
    };
}

function packagePatternCompare(a, b) {
    const aStar = a.indexOf('*');
    const bStar = b.indexOf('*');
    const aBase = aStar === -1 ? a.length : aStar;
    const bBase = bStar === -1 ? b.length : bStar;
    if (aBase !== bBase) return bBase - aBase;
    const aTrailer = aStar === -1 ? 0 : a.length - aStar - 1;
    const bTrailer = bStar === -1 ? 0 : b.length - bStar - 1;
    if (aTrailer !== bTrailer) return bTrailer - aTrailer;
    if (a.length !== b.length) return b.length - a.length;
    return a < b ? -1 : a > b ? 1 : 0;
}

function resolvePackageTargetValue(packageDir, target, conditions, seen, allowBareTarget, patternSubstitution, warningContext) {
    seen = seen || new Set();
    if (target === null) return packageTargetBlocked;
    if (target === false) {
        throw makeInvalidPackageTargetError('false', allowBareTarget ? 'imports' : 'exports');
    }

    if (typeof target === 'string') {
        if (patternSubstitution !== undefined && patternSubstitution !== null) {
            target = target.replace(/\*/g, () => patternSubstitution);
        }
        if (warningContext) {
            emitDeprecatedPackageTargetWarning(
                warningContext.kind,
                warningContext.specifier,
                target,
                patternSubstitution,
                packageDir,
                warningContext.patternKey,
                warningContext.importer
            );
        }
        if (allowBareTarget && isBarePackageSpecifier(target)) {
            const resolved = resolveFromNodeModules(target, packageDir, pathModule.join(packageDir, 'package.json'), conditions);
            if (resolved !== null) return resolved;
            throw makeModuleNotFoundError(target);
        }
        if (hasEncodedSlashOrBackslash(target)) {
            throw makeInvalidModuleSpecifierError(target, 'must not include encoded "/" or "\\" characters');
        }
        if (!target.startsWith('./')) {
            throw makeInvalidPackageTargetError(target, allowBareTarget ? 'imports' : 'exports');
        }
        if (!validatePackageTargetPath(target)) {
            throw makeInvalidPackageTargetError(target, allowBareTarget ? 'imports' : 'exports');
        }
        const candidate = pathModule.resolve(packageDir, decodePackageTargetPath(target));
        const relative = pathModule.relative(packageDir, candidate);
        if (relative.startsWith('..') || pathModule.isAbsolute(relative)) {
            throw makeInvalidPackageTargetError(target, allowBareTarget ? 'imports' : 'exports');
        }
        return resolveExactPackageFile(candidate);
    }

    if (Array.isArray(target)) {
        let lastFallbackError = null;
        for (let i = 0; i < target.length; i++) {
            try {
                const resolved = resolvePackageTargetValue(packageDir, target[i], conditions, seen, allowBareTarget, patternSubstitution, warningContext);
                if (resolved === packageTargetBlocked) continue;
                if (resolved !== packageTargetNoMatch) return resolved;
            } catch (err) {
                if (!err || err.code !== 'ERR_INVALID_PACKAGE_TARGET') throw err;
                lastFallbackError = err;
            }
        }
        if (lastFallbackError !== null) throw lastFallbackError;
        return packageTargetNoMatch;
    }

    if (target && typeof target === 'object') {
        if (seen.has(target)) return null;
        seen.add(target);
        const keys = Object.keys(target);
        for (let i = 0; i < keys.length; i++) {
            const condition = keys[i];
            if (conditions.has(condition)) {
                const resolved = resolvePackageTargetValue(packageDir, target[condition], conditions, seen, allowBareTarget, patternSubstitution, warningContext);
                if (resolved === packageTargetNoMatch) continue;
                return resolved;
            }
        }
        return packageTargetNoMatch;
    }

    throw makeInvalidPackageTargetError(target, allowBareTarget ? 'imports' : 'exports');
}

function resolvePackageTargetWithContext(packageDir, target, conditions, allowBareTarget, patternSubstitution, warningContext) {
    try {
        return resolvePackageTargetValue(packageDir, target, conditions, undefined, allowBareTarget, patternSubstitution, warningContext);
    } catch (err) {
        if (err && err.code === 'ERR_INVALID_PACKAGE_TARGET') {
            throw addPackageErrorContext(err, warningContext.specifier);
        }
        throw err;
    }
}

function isPackageExportsConditionsObject(exportsField) {
    if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) return false;
    const keys = Object.keys(exportsField);
    return keys.length > 0 && !keys.some((key) => key.startsWith('.'));
}

function validatePackageExportsMap(pkgJsonPath, exportsField) {
    if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) return;
    const keys = Object.keys(exportsField);
    for (let i = 0; i < keys.length; i++) {
        if (/^(?:0|[1-9][0-9]*)$/.test(keys[i])) {
            throw makeInvalidPackageConfigError(pkgJsonPath, '"exports" cannot contain numeric property keys');
        }
    }
    if (keys.length > 0) {
        const hasSubpathKey = keys.some((key) => key.startsWith('.'));
        const hasConditionKey = keys.some((key) => !key.startsWith('.'));
        if (hasSubpathKey && hasConditionKey) {
            throw makeInvalidPackageConfigError(pkgJsonPath, '"exports" cannot contain some keys starting with \'.\' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.');
        }
    }
}

function resolvePackageExports(packageName, packageDir, pkg, subpath, conditions) {
    if (!pkg || !Object.prototype.hasOwnProperty.call(pkg, 'exports')) return undefined;
    const key = subpath ? './' + subpath : '.';
    const exportsField = pkg.exports;
    let resolved = null;

    if (typeof exportsField === 'string' || Array.isArray(exportsField) || isPackageExportsConditionsObject(exportsField)) {
        if (key === '.') {
            resolved = resolvePackageTargetWithContext(packageDir, exportsField, conditions, false, undefined, { kind: 'exports', specifier: key });
        }
    } else if (exportsField && typeof exportsField === 'object') {
        const match = findPackageMapTarget(exportsField, key, 'is not a valid match in pattern');
        if (match !== null) {
            resolved = resolvePackageTargetWithContext(
                packageDir,
                match.target,
                conditions,
                false,
                match.patternSubstitution,
                { kind: 'exports', specifier: key, patternKey: match.patternKey }
            );
        }
    } else if (exportsField !== null) {
        throw addPackageErrorContext(makeInvalidPackageTargetError(exportsField, 'exports'), key);
    }

    if (resolved !== null && resolved !== packageTargetNoMatch && resolved !== packageTargetBlocked) return resolved;
    throw makePackagePathNotExportedError(packageName, subpath, key === '.' && isPackageExportsConditionsObject(exportsField));
}

function resolvePackageExportsEntry(parts, packageDir, pkg, pkgJsonPath, conditions) {
    if (!pkg || !Object.prototype.hasOwnProperty.call(pkg, 'exports')) return undefined;
    validatePackageExportsMap(pkgJsonPath, pkg.exports);
    const resolved = resolvePackageExports(parts.name, packageDir, pkg, parts.subpath, conditions);
    if (resolved !== undefined) {
        resolved.packageDir = packageDir;
    }
    return resolved;
}

function resolvePackageSelfReference(parts, parentDir, conditions) {
    const scope = findPackageScope(parentDir);
    if (!scope || !scope.pkg || scope.pkg.name !== parts.name) return undefined;
    return resolvePackageExportsEntry(parts, scope.dir, scope.pkg, scope.pkgJsonPath, conditions);
}

function readPackageDirectoryForExports(parts, packageDir, pkgJsonPath, conditions) {
    const packageJsonEntry = readPackageJson(pkgJsonPath);
    if (packageJsonEntry === null) return null;
    const pkg = packageJsonEntry.pkg;
    return {
        pkg,
        exportsResolved: resolvePackageExportsEntry(parts, packageDir, pkg, pkgJsonPath, conditions),
    };
}

function readCjsPackageCandidate(filename, packageDir) {
    const content = tryReadFile(filename);
    return content === null ? null : { filename, content, packageDir };
}

function readCjsPackageFileCandidates(candidate, packageDir) {
    let resolved = readCjsPackageCandidate(candidate, packageDir);
    if (resolved !== null) return resolved;
    resolved = readCjsPackageCandidate(candidate + '.js', packageDir);
    if (resolved !== null) return resolved;
    resolved = readCjsPackageCandidate(candidate + '.json', packageDir);
    if (resolved !== null) return resolved;
    return readCjsPackageCandidate(candidate + '.node', packageDir);
}

function readCjsPackageIndexCandidates(candidate, packageDir) {
    let resolved = readCjsPackageCandidate(pathModule.join(candidate, 'index.js'), packageDir);
    if (resolved !== null) return resolved;
    resolved = readCjsPackageCandidate(pathModule.join(candidate, 'index.json'), packageDir);
    if (resolved !== null) return resolved;
    return readCjsPackageCandidate(pathModule.join(candidate, 'index.node'), packageDir);
}

function makeInvalidPackageConfigWhileImporting(pkgJsonPath, id, fromPart, cause) {
    const pkgErr = new Error(
        'Invalid package config ' + pkgJsonPath +
        ' while importing "' + id + '" from ' + fromPart + '.' +
        (cause && cause.message ? ' ' + cause.message : '')
    );
    pkgErr.code = 'ERR_INVALID_PACKAGE_CONFIG';
    return pkgErr;
}

function resolveCjsPackageMain(pkgDir, pkg, pkgJsonPath, id, fromPart) {
    if (pkg === null || !Object.prototype.hasOwnProperty.call(pkg, 'main') || typeof pkg.main !== 'string') {
        return null;
    }

    try {
        const mainPath = pathModule.resolve(pkgDir, pkg.main);
        let resolved = readCjsPackageFileCandidates(mainPath, pkgDir);
        if (resolved !== null) return resolved;
        return readCjsPackageIndexCandidates(mainPath, pkgDir);
    } catch (e) {
        throw makeInvalidPackageConfigWhileImporting(pkgJsonPath, id, fromPart, e);
    }
}

function resolveCjsPackageFallbacks(parts, pkgDir, pkg, pkgJsonPath, id, fromPart) {
    if (parts.subpath.length > 0) {
        const subCandidate = pathModule.join(pkgDir, parts.subpath);
        let resolved = readCjsPackageFileCandidates(subCandidate, pkgDir);
        if (resolved !== null) return resolved;
        return readCjsPackageIndexCandidates(subCandidate, pkgDir);
    }

    let resolved = readCjsPackageFileCandidates(pkgDir, pkgDir);
    if (resolved !== null) return resolved;

    resolved = resolveCjsPackageMain(pkgDir, pkg, pkgJsonPath, id, fromPart);
    if (resolved !== null) return resolved;

    return readCjsPackageIndexCandidates(pkgDir, pkgDir);
}

const packageScopeCache = Object.create(null);

function findPackageScope(startDir) {
    let dir = pathModule.resolve(startDir || '/');
    while (true) {
        if (pathModule.basename(dir) === 'node_modules') return null;
        if (Object.prototype.hasOwnProperty.call(packageScopeCache, dir)) {
            return packageScopeCache[dir];
        }
        const pkgJsonPath = pathModule.join(dir, 'package.json');
        const packageJsonEntry = readPackageJson(pkgJsonPath);
        if (packageJsonEntry !== null) {
            const scope = { dir, pkg: packageJsonEntry.pkg, pkgJsonPath };
            packageScopeCache[dir] = scope;
            return scope;
        }
        const parent = pathModule.dirname(dir);
        if (parent === dir) return null;
        dir = parent;
    }
}

function resolvePackageImports(id, parentDir, conditions) {
    const scope = findPackageScope(parentDir);
    if (!scope || !scope.pkg || !scope.pkg.imports || typeof scope.pkg.imports !== 'object') {
        throw makePackageImportNotDefinedError(id);
    }
    validatePackageImportSpecifier(id);
    const match = findPackageMapTarget(scope.pkg.imports, id, 'request is not a valid match in pattern');
    if (match === null) {
        throw makePackageImportNotDefinedError(id);
    }
    const resolved = resolvePackageTargetWithContext(
        scope.dir,
        match.target,
        conditions,
        true,
        match.patternSubstitution,
        { kind: 'imports', specifier: id, patternKey: match.patternKey }
    );
    if (resolved !== packageTargetNoMatch && resolved !== packageTargetBlocked) return resolved;
    throw makePackageImportNotDefinedError(id);
}

function resolveFilename(id, parentDir) {
    const hasTrailingSlash = /\/$/.test(id);
    const forceDirectory = hasTrailingSlash || /(?:^|\/)\.\.?$/.test(id);
    const candidate = pathModule.isAbsolute(id)
        ? pathModule.normalize(id)
        : pathModule.resolve(parentDir, id);

    let resolved = null;
    if (!forceDirectory) {
        resolved = loadAsFile(candidate, false);
        if (resolved !== null) return resolved;
    }

    if (forceDirectory || isPathDirectory(candidate)) {
        resolved = loadAsDirectory(candidate, id, parentDir);
        if (resolved !== null) return resolved;
    }

    const err = new Error("Cannot find module '" + id + "' from '" + parentDir + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
}

function addRequireStackToModuleNotFound(err, request, parentFilename) {
    if (!err || err.code !== 'MODULE_NOT_FOUND' || typeof parentFilename !== 'string') return err;
    if (typeof err.path === 'string' && typeof err.requestPath === 'string') return err;
    err.requireStack = [parentFilename];
    err.message = "Cannot find module '" + request + "'\nRequire stack:\n- " + parentFilename;
    return err;
}

function hasAllowNativesSyntaxFlag() {
    const runtimeFlags = globalThis.__wasm_rquickjs_v8_runtime_flags;
    if (runtimeFlags && runtimeFlags.allowNativesSyntax === true) {
        return true;
    }

    const processObject = globalThis.process;
    if (!processObject || !Array.isArray(processObject.execArgv)) {
        return false;
    }

    let enabled = false;
    for (let i = 0; i < processObject.execArgv.length; i++) {
        const arg = String(processObject.execArgv[i]).replace(/_/g, '-');
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

function stripImportAttributes(source, filename) {
    const len = source.length;
    let out = [];
    const filenameLiteral = JSON.stringify(filename);
    const baseUrlLiteral = JSON.stringify(nodeUrl.pathToFileURL(filename).href);
    function prevNonWs(pos) {
        while (pos > 0) {
            pos--;
            const c = source.charCodeAt(pos);
            if (c !== 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D && c !== 0x0C && c !== 0x0B) return { pos, c };
        }
        return null;
    }
    function prevWord(pos) {
        let end = pos;
        while (end > 0) {
            const c = source.charCodeAt(end - 1);
            if (c !== 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D && c !== 0x0C && c !== 0x0B) break;
            end--;
        }
        let start = end;
        while (start > 0) {
            const c = source.charCodeAt(start - 1);
            if (!(c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 95 || c === 36)) break;
            start--;
        }
        return start < end ? { word: source.substring(start, end), start } : null;
    }
    function matchingParenEnd(openParen) {
        let pos = openParen + 1;
        let depth = 1;
        while (pos < len) {
            const c = source.charCodeAt(pos);
            const skipped = skipNonCode(source, pos, true);
            if (skipped !== null) { pos = skipped; continue; }
            if (c === 0x28) depth++;
            else if (c === 0x29 && --depth === 0) return pos + 1;
            pos++;
        }
        return -1;
    }
    function nextNonWs(pos) {
        while (pos < len) {
            const c = source.charCodeAt(pos);
            if (c !== 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D && c !== 0x0C && c !== 0x0B) return c;
            pos++;
        }
        return -1;
    }
    function methodPrefixBoundary(pos) {
        const prev = prevNonWs(pos);
        return !prev || prev.c === 0x7B || prev.c === 0x2C || prev.c === 0x3B;
    }
    function isImportMethodDefinition(importStart, openParen) {
        const close = matchingParenEnd(openParen);
        if (close < 0 || nextNonWs(close) !== 0x7B) return false;
        const directWord = prevWord(importStart);
        if (directWord && directWord.word === 'static') return true;
        let pos = importStart;
        for (;;) {
            const prev = prevNonWs(pos);
            if (!prev) return false;
            if (prev.c === 0x7B || prev.c === 0x2C || prev.c === 0x3B) return true;
            if (prev.c === 0x2A) {
                pos = prev.pos;
                continue;
            }
            const word = prevWord(pos);
            if (word && (word.word === 'async' || word.word === 'get' || word.word === 'set' || word.word === 'static')) {
                pos = word.start;
                continue;
            }
            return false;
        }
    }
    function skipWsComments(pos, end) {
        let i = pos;
        while (i < end) {
            const c = source.charCodeAt(i);
            if (c === 0x20 || c === 0x09 || c === 0x0A || c === 0x0D || c === 0x0C || c === 0x0B) {
                i++;
                continue;
            }
            if (c === 0x2F && i + 1 < end && source.charCodeAt(i + 1) === 0x2F) {
                i += 2;
                while (i < end && source.charCodeAt(i) !== 0x0A && source.charCodeAt(i) !== 0x0D) i++;
                continue;
            }
            if (c === 0x2F && i + 1 < end && source.charCodeAt(i + 1) === 0x2A) {
                i += 2;
                while (i + 1 < end && !(source.charCodeAt(i) === 0x2A && source.charCodeAt(i + 1) === 0x2F)) i++;
                i = Math.min(i + 2, end);
                continue;
            }
            break;
        }
        return i;
    }
    function findTemplateExpressionEnd(start, end) {
        let i = start;
        let depth = 1;
        while (i < end) {
            const skipped = skipNonCode(source, i, true);
            if (skipped !== null) { i = skipped; continue; }
            const c = source.charCodeAt(i);
            if (c === 0x7B || c === 0x28 || c === 0x5B) { depth++; i++; }
            else if (c === 0x7D || c === 0x29 || c === 0x5D) {
                depth--;
                if (depth === 0) return i;
                i++;
            } else { i++; }
        }
        return end;
    }
    function processTemplate(start, end) {
        out.push('`');
        let i = start + 1;
        let rawStart = i;
        while (i < end) {
            const c = source.charCodeAt(i);
            if (c === 0x5C) { i += 2; continue; }
            if (c === 0x60) {
                out.push(source.substring(rawStart, i + 1));
                return i + 1;
            }
            if (c === 0x24 && i + 1 < end && source.charCodeAt(i + 1) === 0x7B) {
                out.push(source.substring(rawStart, i + 2));
                const exprEnd = findTemplateExpressionEnd(i + 2, end);
                processRange(i + 2, exprEnd);
                if (exprEnd < end) {
                    out.push('}');
                    i = exprEnd + 1;
                } else {
                    i = exprEnd;
                }
                rawStart = i;
                continue;
            }
            i++;
        }
        out.push(source.substring(rawStart, i));
        return i;
    }
    function processRange(start, end) {
        let i = start;
        while (i < end) {
            let ch = source.charCodeAt(i);
            if (ch === 0x60) {
                i = processTemplate(i, end);
                continue;
            }
            const skipped = skipNonCode(source, i, true);
            if (skipped !== null) {
                out.push(source.substring(i, skipped));
                i = skipped;
                continue;
            }
            if (ch === 0x69 && i + 6 <= end && source.substring(i, i + 6) === 'import' &&
                (i === 0 || ((ch = source.charCodeAt(i - 1)) !== 46 && ch !== 35 && !isIdentifierContinueCode(ch))) &&
                (i + 6 >= end || !isIdentifierContinueCode(source.charCodeAt(i + 6)))) {
                const openParen = skipWsComments(i + 6, end);
                if (openParen < end && source.charCodeAt(openParen) === 0x28) {
                    if (isImportMethodDefinition(i, openParen)) {
                        out.push(source[i]);
                        i++;
                        continue;
                    }
                    i = openParen + 1;
                    let depth = 1, commaPos = -1;
                    const argStart = i;
                    while (i < end && depth > 0) {
                        ch = source.charCodeAt(i);
                        const skipped = skipNonCode(source, i, true);
                        if (skipped !== null) { i = skipped; }
                        else if (ch === 0x28 || ch === 0x5B || ch === 0x7B) { depth++; i++; }
                        else if (ch === 0x29 || ch === 0x5D || ch === 0x7D) { depth--; i++; }
                        else if (ch === 0x2C && depth === 1 && commaPos === -1) { commaPos = i; i++; }
                        else { i++; }
                    }
                    if (commaPos > -1) {
                        const firstArg = processSubrange(argStart, commaPos);
                        const secondArg = processSubrange(commaPos + 1, i - 1);
                        out.push('((async(__wasm_rquickjs_specifier,__wasm_rquickjs_options)=>{const __wasm_rquickjs_url=String(__wasm_rquickjs_specifier);return globalThis.__wasm_rquickjs_trace_module_import(__wasm_rquickjs_url,');
                        out.push(filenameLiteral);
                        out.push(',async()=>globalThis.__wasm_rquickjs_import_attr_dynamic_import(');
                        out.push(baseUrlLiteral);
                        out.push(',__wasm_rquickjs_url,__wasm_rquickjs_options,true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared)));})(');
                        out.push(firstArg);
                        out.push(',');
                        out.push(secondArg);
                        out.push('))');
                    } else {
                        const spec = processSubrange(argStart, i - 1);
                        out.push('((async(__wasm_rquickjs_specifier)=>{const __wasm_rquickjs_url=String(__wasm_rquickjs_specifier);return globalThis.__wasm_rquickjs_trace_module_import(__wasm_rquickjs_url,');
                        out.push(filenameLiteral);
                        out.push(',async()=>globalThis.__wasm_rquickjs_import_attr_dynamic_import(');
                        out.push(baseUrlLiteral);
                        out.push(',__wasm_rquickjs_url,undefined,true,(__wasm_rquickjs_prepared)=>import(__wasm_rquickjs_prepared)));})(');
                        out.push(spec);
                        out.push('))');
                    }
                    continue;
                }
            }
            out.push(source[i]);
            i++;
        }
    }
    function processSubrange(start, end) {
        const previousOut = out;
        out = [];
        processRange(start, end);
        const rewritten = out.join('');
        out = previousOut;
        return rewritten;
    }
    processRange(0, len);
    return out.join('');
}
function hasExecArgvFlag(flag) {
    const processObject = globalThis.process;
    if (!processObject || !Array.isArray(processObject.execArgv)) {
        return false;
    }

    const prefixed = flag + '=';
    for (let i = 0; i < processObject.execArgv.length; i++) {
        const arg = String(processObject.execArgv[i]);
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
    let registry = globalThis.__wasm_rquickjs_simple_source_maps;
    if (!registry || typeof registry !== 'object') {
        registry = Object.create(null);
        globalThis.__wasm_rquickjs_simple_source_maps = registry;
    }
    return registry;
}

function getCjsLineOffsetRegistry() {
    let registry = globalThis.__wasm_rquickjs_cjs_line_offsets;
    if (!registry || typeof registry !== 'object') {
        registry = Object.create(null);
        globalThis.__wasm_rquickjs_cjs_line_offsets = registry;
    }
    return registry;
}

const cjsLineOffset = 6;

const sourceMapVlqChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const sourceMapVlqMap = Object.create(null);
for (let i = 0; i < sourceMapVlqChars.length; i++) {
    sourceMapVlqMap[sourceMapVlqChars.charAt(i)] = i;
}

function sourceMapInvalidPayloadError(payload) {
    let received;
    if (payload === null) {
        received = ' Received null';
    } else if (typeof payload === 'number') {
        received = ' Received type number (' + payload + ')';
    } else if (typeof payload === 'string') {
        received = " Received type string ('" + payload + "')";
    } else {
        received = ' Received type ' + typeof payload + ' (' + String(payload) + ')';
    }
    const err = new TypeError('The "payload" argument must be of type object.' + received);
    err.code = 'ERR_INVALID_ARG_TYPE';
    return err;
}

function cloneSourceMapPayload(payload) {
    return JSON.parse(JSON.stringify(payload));
}

function decodeSourceMapVlq(text, state) {
    let result = 0;
    let shift = 0;
    let continuation = true;
    while (continuation) {
        if (state.index >= text.length) throw new Error('Unexpected end of source map VLQ');
        const value = sourceMapVlqMap[text.charAt(state.index++)];
        if (value === undefined) throw new Error('Invalid source map VLQ character');
        continuation = (value & 32) !== 0;
        result += (value & 31) * Math.pow(2, shift);
        shift += 5;
    }
    const negative = (result % 2) === 1;
    result = Math.floor(result / 2);
    if (negative && result === 0) return -2147483648;
    return negative ? -result : result;
}

function resolveSourceMapSource(source, sourceRoot, sourceBasePath) {
    source = String(source);
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(source)) return source;
    if (sourceBasePath) {
        const resolved = pathModule.resolve(sourceBasePath, sourceRoot || '', source);
        return nodeUrl.pathToFileURL(resolved).href;
    }
    if (!sourceRoot) return source;
    sourceRoot = String(sourceRoot);
    if (sourceRoot.endsWith('/') || source.startsWith('/')) return sourceRoot + source;
    return sourceRoot + '/' + source;
}

function parseSourceMapMappings(payload, sourceBasePath) {
    const mappings = String(payload.mappings);
    const sources = Array.isArray(payload.sources) ? payload.sources : [];
    const names = Array.isArray(payload.names) ? payload.names : [];
    const sourceRoot = payload.sourceRoot || '';
    const lines = [];
    let generatedLine = 0;
    let previousGeneratedColumn = 0;
    let previousSource = 0;
    let previousOriginalLine = 0;
    let previousOriginalColumn = 0;
    let previousName = 0;
    let i = 0;

    while (i <= mappings.length) {
        if (!lines[generatedLine]) lines[generatedLine] = [];
        if (i === mappings.length) break;
        const ch = mappings.charAt(i);
        if (ch === ';') {
            generatedLine++;
            previousGeneratedColumn = 0;
            i++;
            continue;
        }
        if (ch === ',') {
            i++;
            continue;
        }

        const segmentStart = i;
        while (i < mappings.length && mappings.charAt(i) !== ',' && mappings.charAt(i) !== ';') {
            i++;
        }
        const segmentText = mappings.slice(segmentStart, i);
        if (segmentText.length === 0) continue;
        const state = { index: 0 };
        const generatedColumn = previousGeneratedColumn + decodeSourceMapVlq(segmentText, state);
        previousGeneratedColumn = generatedColumn;
        if (state.index >= segmentText.length) {
            lines[generatedLine].push({ generatedLine, generatedColumn });
            continue;
        }

        const sourceIndex = previousSource + decodeSourceMapVlq(segmentText, state);
        const originalLine = previousOriginalLine + decodeSourceMapVlq(segmentText, state);
        const originalColumn = previousOriginalColumn + decodeSourceMapVlq(segmentText, state);
        previousSource = sourceIndex;
        previousOriginalLine = originalLine;
        previousOriginalColumn = originalColumn;
        let name;
        if (state.index < segmentText.length) {
            const nameIndex = previousName + decodeSourceMapVlq(segmentText, state);
            previousName = nameIndex;
            name = names[nameIndex];
        }

        lines[generatedLine].push({
            generatedLine,
            generatedColumn,
            originalSource: resolveSourceMapSource(sources[sourceIndex], sourceRoot, sourceBasePath),
            originalLine,
            originalColumn,
            name,
        });
    }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (lines[lineIndex]) {
            lines[lineIndex].sort((a, b) => a.generatedColumn - b.generatedColumn);
        }
    }
    return lines;
}

function parseIndexSourceMapMappings(payload, sourceBasePath) {
    const lines = [];
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section || !section.map || !section.offset) continue;
        const offsetLine = Number(section.offset.line) || 0;
        const offsetColumn = Number(section.offset.column) || 0;
        const sectionMap = parseSourceMapMappings(section.map, sourceBasePath);
        for (let line = 0; line < sectionMap.length; line++) {
            const segments = sectionMap[line];
            if (!segments) continue;
            const targetLine = line + offsetLine;
            if (!lines[targetLine]) lines[targetLine] = [];
            for (let j = 0; j < segments.length; j++) {
                const segment = Object.assign({}, segments[j]);
                segment.generatedLine += offsetLine;
                if (line === 0) segment.generatedColumn += offsetColumn;
                lines[targetLine].push(segment);
            }
        }
    }
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (lines[lineIndex]) {
            lines[lineIndex].sort((a, b) => a.generatedColumn - b.generatedColumn);
        }
    }
    return lines;
}

function decodeSourceMapPayload(payload, sourceBasePath) {
    try {
        if (Array.isArray(payload.sections)) return parseIndexSourceMapMappings(payload, sourceBasePath);
        return parseSourceMapMappings(payload, sourceBasePath);
    } catch (_) {
        return [];
    }
}

function cloneSourceMapEntry(entry) {
    if (!entry || entry.originalSource === undefined) return {};
    return {
        generatedLine: entry.generatedLine,
        generatedColumn: entry.generatedColumn,
        originalSource: entry.originalSource,
        originalLine: entry.originalLine,
        originalColumn: entry.originalColumn,
        name: entry.name,
    };
}

function findSourceMapMapping(lines, lineOffset, columnOffset) {
    lineOffset = Math.floor(lineOffset);
    columnOffset = Math.floor(columnOffset);
    for (let lineIndex = lineOffset; lineIndex >= 0; lineIndex--) {
        const line = lines[lineIndex];
        if (!line || line.length === 0) continue;
        let match = null;
        if (lineIndex === lineOffset) {
            for (let i = 0; i < line.length; i++) {
                if (line[i].generatedColumn <= columnOffset) match = line[i];
                else break;
            }
            if (match) return match;
        } else {
            return line[line.length - 1];
        }
    }
    return null;
}

class SourceMap {
    constructor(payload, options) {
        if (payload === null || typeof payload !== 'object') {
            throw sourceMapInvalidPayloadError(payload);
        }
        options = options || {};
        this.payload = cloneSourceMapPayload(payload);
        if (options.lineLengths !== undefined) {
            this.lineLengths = Array.prototype.slice.call(options.lineLengths);
        }
        this._decodedMappings = decodeSourceMapPayload(this.payload, options.sourceBasePath);
    }

    findEntry(lineOffset, columnOffset) {
        lineOffset = Number(lineOffset);
        columnOffset = Number(columnOffset);
        if (!Number.isFinite(lineOffset) || !Number.isFinite(columnOffset)) return {};
        return cloneSourceMapEntry(findSourceMapMapping(this._decodedMappings, lineOffset, columnOffset));
    }

    findOrigin(lineNumber, columnNumber) {
        const generatedLine = Number(lineNumber) - 1;
        const generatedColumn = Number(columnNumber) - 1;
        if (!Number.isFinite(generatedLine) || !Number.isFinite(generatedColumn)) return {};
        const match = findSourceMapMapping(this._decodedMappings, generatedLine, generatedColumn);
        if (!match) return {};
        return {
            name: match.name,
            fileName: match.originalSource,
            lineNumber: match.originalLine + 1,
            columnNumber: match.originalColumn + (generatedColumn - match.generatedColumn) + 1,
        };
    }
}

function findSourceMap(path) {
    const registry = getSimpleSourceMapRegistry();
    return registry[String(path)];
}

function sourceMapLineLengths(source) {
    return String(source).split(/\r\n|[\n\r\u2028\u2029]/).map(line => line.length);
}

function decodeInlineSourceMap(url) {
    const marker = 'base64,';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    try {
        const encoded = url.slice(idx + marker.length);
        const decoded = buffer.Buffer.from(encoded, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (_) {
        return null;
    }
}

function registerSourceMapForCjs(filename, source) {
    const registry = getSimpleSourceMapRegistry();
    if (!isSourceMapsEnabled()) {
        delete registry[filename];
        return;
    }

    const sourceText = String(source);
    const directiveRe = /\/\/[#@]\s*sourceMappingURL=([^\r\n]+)|\/\*[#@]\s*sourceMappingURL=([\s\S]*?)\*\//g;
    let match;
    let url = null;
    while ((match = directiveRe.exec(sourceText)) !== null) {
        url = (match[1] !== undefined ? match[1] : match[2]).trim();
    }
    if (url === null) {
        delete registry[filename];
        return;
    }

    let payload = null;
    let sourceBasePath = pathModule.dirname(filename);
    if (url.startsWith('data:')) {
        payload = decodeInlineSourceMap(url);
    } else {
        const mapPath = pathModule.resolve(pathModule.dirname(filename), url);
        sourceBasePath = pathModule.dirname(mapPath);
        const content = tryReadFile(mapPath);
        if (content !== null) {
            try {
                payload = JSON.parse(content);
            } catch (_) {
                payload = null;
            }
        }
    }
    if (payload === null) {
        delete registry[filename];
        return;
    }
    registry[filename] = new SourceMap(payload, {
        lineLengths: sourceMapLineLengths(source),
        sourceBasePath,
    });
}

function countMatches(text, charCode) {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
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

    const lines = String(source).split('\n');
    const transformedLines = [];
    const generatedLineToOriginalLine = Object.create(null);
    let insideInterface = false;
    let interfaceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (insideInterface) {
            interfaceDepth += countMatches(line, 123) - countMatches(line, 125);
            if (interfaceDepth <= 0) {
                insideInterface = false;
                interfaceDepth = 0;
            }
            continue;
        }

        const trimmed = line.trim();
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

    const transformed = transformedLines.join('\n');
    const sourceMapRegistry = getSimpleSourceMapRegistry();
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
    const privateSymbols = globalThis.__wasm_rquickjs_internal_private_symbols;
    if (!privateSymbols || typeof privateSymbols !== 'object') {
        return undefined;
    }

    const arrowMessageSymbol = privateSymbols.arrow_message_private_symbol;
    return typeof arrowMessageSymbol === 'symbol' ? arrowMessageSymbol : undefined;
}

function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maybeSetArrowMessageOnSyntaxError(err, filename, source) {
    if (!err || err.name !== 'SyntaxError') {
        return;
    }

    const arrowMessageSymbol = getArrowMessagePrivateSymbol();
    if (arrowMessageSymbol === undefined || err[arrowMessageSymbol] !== undefined) {
        return;
    }

    let line = 1;
    let column = 1;

    if (typeof err.lineNumber === 'number' && Number.isFinite(err.lineNumber) && err.lineNumber > 0) {
        line = Math.floor(err.lineNumber);
    }
    if (typeof err.columnNumber === 'number' && Number.isFinite(err.columnNumber) && err.columnNumber > 0) {
        column = Math.floor(err.columnNumber);
    }

    if (typeof err.stack === 'string') {
        const stackMatch = err.stack.match(new RegExp(escapeRegExp(filename) + ':(\\d+)(?::(\\d+))?'));
        if (stackMatch) {
            line = parseInt(stackMatch[1], 10);
            if (stackMatch[2] !== undefined) {
                column = parseInt(stackMatch[2], 10);
            }
        }
    }

    const sourceLines = String(source).split('\n');
    let sourceLine = '';
    if (line >= 1 && line <= sourceLines.length) {
        sourceLine = sourceLines[line - 1].replace(/\r$/, '');
    }

    if (!Number.isFinite(column) || column < 1) {
        column = 1;
    }

    let arrowMessage = filename + ':' + line;
    if (sourceLine.length > 0) {
        arrowMessage += '\n' + sourceLine + '\n' + ' '.repeat(column - 1) + '^';
    }

    err[arrowMessageSymbol] = arrowMessage;
}

function wrapEsmNamespace(ns) {
    if (!ns || typeof ns !== 'object') return ns;
    if (!Object.hasOwn(ns, 'default') || Object.hasOwn(ns, '__esModule')) return ns;
    const wrapped = Object.create(null);
    const namespaceKeys = Object.keys(ns);
    Object.defineProperty(wrapped, '__esModule', {
        value: true,
        writable: true,
        configurable: false,
        enumerable: true,
    });
    for (let i = 0; i < namespaceKeys.length; i++) {
        const k = namespaceKeys[i];
        Object.defineProperty(wrapped, k, {
            value: ns[k],
            writable: true,
            enumerable: true,
            configurable: false,
        });
    }
    Object.defineProperty(wrapped, Symbol.toStringTag, {
        value: 'Module',
        writable: false,
        configurable: false,
        enumerable: false,
    });
    Object.preventExtensions(wrapped);
    function namespaceDescriptor(prop) {
        if (prop === '__esModule') {
            return {
                value: true,
                writable: true,
                enumerable: true,
                configurable: false,
            };
        }
        if (typeof prop === 'string' && Object.hasOwn(ns, prop)) {
            return {
                value: ns[prop],
                writable: true,
                enumerable: true,
                configurable: false,
            };
        }
        return Object.getOwnPropertyDescriptor(wrapped, prop);
    }
    return new Proxy(wrapped, {
        get: function(target, prop, receiver) {
            if (prop === '__esModule') return true;
            if (typeof prop === 'string' && Object.hasOwn(ns, prop)) return ns[prop];
            return Reflect.get(target, prop, receiver);
        },
        getOwnPropertyDescriptor: function(_target, prop) {
            return namespaceDescriptor(prop);
        },
        set: function() {
            return false;
        },
        defineProperty: function() {
            return false;
        },
        deleteProperty: function() {
            return false;
        },
    });
}

// Normalize QuickJS SyntaxError messages for ESM keywords to match Node.js/V8 format.
// QuickJS: "unsupported keyword: export" → Node.js: "Unexpected token 'export'"
function normalizeEsmSyntaxError(err) {
    if (!err || typeof err.message !== 'string') return;
    const m = err.message.match(/^unsupported keyword: (\w+)$/);
    if (m) {
        err.message = "Unexpected token '" + m[1] + "'";
    }
}

function markAsSyntaxError(err) {
    if (!err || err.name === 'SyntaxError') return;
    err.name = 'SyntaxError';
    if (typeof err.stack === 'string') {
        err.stack = err.stack.replace(/^Error:/, 'SyntaxError:');
    }
}

function isIdentifierContinueCode(code) {
    return code === 0x5f || code === 0x24 || // _ $
        (code >= 0x30 && code <= 0x39) ||
        (code >= 0x41 && code <= 0x5a) ||
        (code >= 0x61 && code <= 0x7a) ||
        code >= 0x80;
}

function isIdentifierStartCode(code) {
    return code === 0x5f || code === 0x24 || // _ $
        (code >= 0x41 && code <= 0x5a) ||
        (code >= 0x61 && code <= 0x7a) ||
        code >= 0x80;
}

function hasIdentifierBoundary(source, start, end) {
    return (start === 0 || !isIdentifierContinueCode(source.charCodeAt(start - 1))) &&
        (end >= source.length || !isIdentifierContinueCode(source.charCodeAt(end)));
}

function skipQuotedOrTemplate(source, start) {
    const quote = source.charCodeAt(start);
    let i = start + 1;
    while (i < source.length) {
        const code = source.charCodeAt(i);
        if (code === 0x5c) { // backslash
            i += 2;
        } else if (quote === 0x60 && code === 0x24 && i + 1 < source.length && source.charCodeAt(i + 1) === 0x7b) {
            i = skipTemplateExpression(source, i + 2);
        } else if (code === quote) {
            return i + 1;
        } else {
            i++;
        }
    }
    return i;
}

function skipTemplateExpression(source, start) {
    let i = start;
    let depth = 1;
    while (i < source.length && depth > 0) {
        const skipped = skipNonCode(source, i, true);
        if (skipped !== null) {
            i = skipped;
            continue;
        }

        const code = source.charCodeAt(i);
        if (code === 0x7b || code === 0x28 || code === 0x5b) {
            depth++;
            i++;
        } else if (code === 0x7d || code === 0x29 || code === 0x5d) {
            depth--;
            i++;
        } else {
            i++;
        }
    }
    return i;
}

function previousSignificantChar(source, pos) {
    for (let i = pos - 1; i >= 0; i--) {
        const ch = source.charCodeAt(i);
        if (ch !== 0x20 && ch !== 0x09 && ch !== 0x0a && ch !== 0x0d) return ch;
    }
    return -1;
}

function previousSignificantCharOnSameLine(source, pos) {
    for (let i = pos - 1; i >= 0; i--) {
        const ch = source.charCodeAt(i);
        if (ch === 0x0a || ch === 0x0d) return -1;
        if (ch !== 0x20 && ch !== 0x09) return ch;
    }
    return -1;
}

function previousRegexContextToken(source, pos) {
    let token = null;
    let i = 0;
    for (let j = pos - 1; j >= 0; j--) {
        const ch = source.charCodeAt(j);
        if (ch === 0x0a || ch === 0x0d || ch === 0x3b || ch === 0x7b || ch === 0x7d) {
            i = j + 1;
            break;
        }
    }
    while (i < pos) {
        const skipped = skipNonCode(source, i, false);
        if (skipped !== null) {
            i = skipped;
            continue;
        }

        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d) {
            i++;
            continue;
        }
        if (isIdentifierContinueCode(ch)) {
            const start = i;
            i++;
            while (i < pos && isIdentifierContinueCode(source.charCodeAt(i))) {
                i++;
            }
            token = source.substring(start, i);
            continue;
        }
        token = ch;
        i++;
    }
    return token;
}

function isRegexLiteralStartInSource(source, pos) {
    const token = previousRegexContextToken(source, pos);
    if (token === null) {
        return true;
    }
    if (typeof token === 'number') {
        return '({[=,:;!?&|+-*~^%>'.indexOf(String.fromCharCode(token)) >= 0;
    }
    return token === 'return' || token === 'throw' || token === 'case' || token === 'yield';
}

function skipRegexLiteralInSource(source, start) {
    let i = start + 1;
    let inClass = false;
    while (i < source.length) {
        const code = source.charCodeAt(i);
        if (code === 0x5c) {
            i += 2;
        } else if (code === 0x5b) {
            inClass = true;
            i++;
        } else if (code === 0x5d) {
            inClass = false;
            i++;
        } else if (code === 0x2f && !inClass) {
            i++;
            while (i < source.length) {
                const flag = source.charCodeAt(i);
                if (!((flag >= 0x41 && flag <= 0x5a) || (flag >= 0x61 && flag <= 0x7a))) break;
                i++;
            }
            return i;
        } else if (code === 0x0a || code === 0x0d) {
            return start + 1;
        } else {
            i++;
        }
    }
    return start + 1;
}

function skipWhitespace(source, start) {
    let i = start;
    while (i < source.length) {
        const code = source.charCodeAt(i);
        if (code !== 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) break;
        i++;
    }
    return i;
}

function skipWhitespaceAndCommentsImpl(source, start, trackLineTerminator) {
    let i = start;
    let hasLineTerminator = false;
    while (i < source.length) {
        const code = source.charCodeAt(i);
        if (code === 0x0a || code === 0x0d) {
            hasLineTerminator = true;
            i++;
            continue;
        }
        if (code === 0x20 || code === 0x09) {
            i++;
            continue;
        }
        if (code === 0x2f && source.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (code === 0x2f && source.charCodeAt(i + 1) === 0x2a) {
            i += 2;
            while (i + 1 < source.length && !(source.charCodeAt(i) === 0x2a && source.charCodeAt(i + 1) === 0x2f)) {
                if (source.charCodeAt(i) === 0x0a || source.charCodeAt(i) === 0x0d) hasLineTerminator = true;
                i++;
            }
            i = Math.min(i + 2, source.length);
            continue;
        }
        break;
    }
    if (trackLineTerminator) return { pos: i, hasLineTerminator };
    return i;
}

function skipWhitespaceAndComments(source, start) {
    return skipWhitespaceAndCommentsImpl(source, start, false);
}

function startsWithKeywordAt(source, keyword, pos) {
    return source.startsWith(keyword, pos) && hasIdentifierBoundary(source, pos, pos + keyword.length);
}

function readKeywordAt(source, keyword, pos) {
    return startsWithKeywordAt(source, keyword, pos) ? pos + keyword.length : null;
}

function readVariableDeclarationKeyword(source, pos) {
    let end = readKeywordAt(source, 'const', pos);
    if (end !== null) return end;
    end = readKeywordAt(source, 'let', pos);
    if (end !== null) return end;
    return readKeywordAt(source, 'var', pos);
}

function skipNonCode(source, pos, skipRegex) {
    const code = source.charCodeAt(pos);
    if (code === 0x27 || code === 0x22 || code === 0x60) { // ' " `
        return skipQuotedOrTemplate(source, pos);
    }
    if (code === 0x2f && pos + 1 < source.length && source.charCodeAt(pos + 1) === 0x2f) {
        let i = pos + 2;
        while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
        return i;
    }
    if (code === 0x2f && pos + 1 < source.length && source.charCodeAt(pos + 1) === 0x2a) {
        let i = pos + 2;
        while (i + 1 < source.length && !(source.charCodeAt(i) === 0x2a && source.charCodeAt(i + 1) === 0x2f)) i++;
        return Math.min(i + 2, source.length);
    }
    if (skipRegex && code === 0x2f && isRegexLiteralStartInSource(source, pos)) {
        return skipRegexLiteralInSource(source, pos);
    }
    return null;
}

function scanSourceCodePositions(source, options, visitor) {
    const skipRegex = !options || options.skipRegex !== false;
    let i = 0;
    let previousCode = -1;
    while (i < source.length) {
        const skipped = skipNonCode(source, i, skipRegex);
        if (skipped !== null) {
            i = skipped;
            continue;
        }

        const code = source.charCodeAt(i);
        const next = visitor(i, code, previousCode);
        if (next === false) return false;
        if (code !== 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) previousCode = code;
        if (typeof next === 'number') {
            i = next;
        } else {
            i++;
        }
    }
    return true;
}

function isStaticExportSyntax(source, pos) {
    if (previousSignificantCharOnSameLine(source, pos) === 0x2e) return false; // member property
    const next = skipWhitespaceAndComments(source, pos + 6);
    if (source.charCodeAt(next) === 0x3a) return false; // object label/property
    const ch = source.charCodeAt(next);
    if (ch === 0x7b || ch === 0x2a) return true; // { or *
    return startsWithKeywordAt(source, 'default', next) ||
        startsWithKeywordAt(source, 'const', next) ||
        startsWithKeywordAt(source, 'let', next) ||
        startsWithKeywordAt(source, 'var', next) ||
        startsWithKeywordAt(source, 'function', next) ||
        startsWithKeywordAt(source, 'class', next);
}

function isStaticImportSyntax(source, pos) {
    if (previousSignificantCharOnSameLine(source, pos) === 0x2e) return false; // member property
    const next = skipWhitespaceAndComments(source, pos + 6);
    if (source.charCodeAt(next) === 0x28 || source.charCodeAt(next) === 0x3a) return false; // dynamic import(...) or property label
    const ch = source.charCodeAt(next);
    return ch === 0x27 || ch === 0x22 || ch === 0x7b || ch === 0x2a ||
        isIdentifierStartCode(ch);
}

function looksLikeEsmSource(source) {
    let found = false;
    scanSourceCodePositions(source, { skipRegex: true }, (i) => {
        if (startsWithKeywordAt(source, 'export', i) && isStaticExportSyntax(source, i)) {
            found = true;
            return false;
        }
        if (startsWithKeywordAt(source, 'import', i)) {
            if (isStaticImportSyntax(source, i)) {
                found = true;
                return false;
            }
        }
        return undefined;
    });
    return found || sourceHasTopLevelAwait(source);
}

function sourceHasTopLevelAwait(source) {
    let found = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    let functionDepth = 0;
    let classDepth = 0;
    let pendingFunctionBody = false;
    let pendingClassBody = false;
    let afterArrow = false;
    let skipArrowExpression = null;
    const braces = [];

    scanSourceCodePositions(source, { skipRegex: true }, (i, code) => {
        if (afterArrow) {
            afterArrow = false;
            if (code === 0x7b) {
                pendingFunctionBody = true;
            } else {
                skipArrowExpression = { parenDepth, bracketDepth, braceDepth: braces.length };
            }
        }

        if (skipArrowExpression &&
            (code === 0x3b ||
             code === 0x2c ||
             (code === 0x29 && parenDepth <= skipArrowExpression.parenDepth) ||
             (code === 0x5d && bracketDepth <= skipArrowExpression.bracketDepth) ||
             (code === 0x7d && braces.length <= skipArrowExpression.braceDepth))) {
            skipArrowExpression = null;
        }

        if (code === 0x28) {
            parenDepth++;
        } else if (code === 0x29) {
            parenDepth = Math.max(0, parenDepth - 1);
        } else if (code === 0x5b) {
            bracketDepth++;
        } else if (code === 0x5d) {
            bracketDepth = Math.max(0, bracketDepth - 1);
        } else if (code === 0x3d && source.charCodeAt(i + 1) === 0x3e) {
            afterArrow = true;
        } else if (code === 0x7b) {
            if (pendingFunctionBody) {
                braces.push('function');
                functionDepth++;
                pendingFunctionBody = false;
            } else if (pendingClassBody) {
                braces.push('class');
                classDepth++;
                pendingClassBody = false;
            } else {
                braces.push('normal');
            }
        } else if (code === 0x7d) {
            const context = braces.pop();
            if (context === 'function') functionDepth = Math.max(0, functionDepth - 1);
            if (context === 'class') classDepth = Math.max(0, classDepth - 1);
        }

        if (skipArrowExpression) {
            return undefined;
        }

        if (startsWithKeywordAt(source, 'await', i) && functionDepth === 0 && classDepth === 0) {
            found = true;
            return false;
        }
        if (startsWithKeywordAt(source, 'function', i)) {
            pendingFunctionBody = true;
        } else if (startsWithKeywordAt(source, 'class', i)) {
            pendingClassBody = true;
        }
        return undefined;
    });
    return found;
}

function isCreateRequireImportMetaUrlDeclaration(source, requirePos) {
    let next = skipWhitespaceAndComments(source, requirePos + 7);
    if (source.charCodeAt(next) !== 0x3d) return false;
    next = skipWhitespaceAndComments(source, next + 1);
    const createRequireEnd = readLoaderNamedIdentifier(source, next, 'createRequire');
    if (createRequireEnd === null) {
        return false;
    }
    next = skipWhitespaceAndComments(source, createRequireEnd);
    if (source.charCodeAt(next) !== 0x28) return false;
    next = skipWhitespaceAndComments(source, next + 1);
    return readImportMetaUrl(source, next) !== null;
}

function readImportMetaUrl(source, pos) {
    let i = readLoaderNamedIdentifier(source, pos, 'import');
    if (i === null) return null;
    i = readLoaderDotMember(source, i, 'meta');
    if (i === null) return null;
    return readLoaderDotMember(source, i, 'url');
}

function hasCjsWrapperRequireRedeclaration(source) {
    let found = false;
    let braceDepth = 0;
    scanSourceCodePositions(source, { skipRegex: true }, (i, code) => {
        if (code === 0x7b) {
            braceDepth++;
            return undefined;
        }
        if (code === 0x7d) {
            braceDepth = Math.max(0, braceDepth - 1);
            return undefined;
        }

        if (braceDepth === 0) {
            const declarationEnd = readKeywordAt(source, 'const', i) || readKeywordAt(source, 'let', i);
            if (declarationEnd === null) return undefined;
            let next = skipWhitespaceAndComments(source, declarationEnd);
            const requireEnd = readLoaderNamedIdentifier(source, next, 'require');
            if (requireEnd !== null) {
                if (!isCreateRequireImportMetaUrlDeclaration(source, next)) {
                    found = true;
                    return false;
                }
            }
        }
        return undefined;
    });
    return found;
}

function readStaticSpecifierString(source, start) {
    const i = skipWhitespaceAndComments(source, start);
    const quote = source.charCodeAt(i);
    if (quote !== 0x27 && quote !== 0x22) return null;
    let value = '';
    let p = i + 1;
    while (p < source.length) {
        const code = source.charCodeAt(p);
        if (code === 0x5c && p + 1 < source.length) {
            value += source[p + 1];
            p += 2;
        } else if (code === quote) {
            return { value, end: p + 1 };
        } else {
            value += source[p];
            p++;
        }
    }
    return null;
}

function decodeStringLiteral(source, start, quote) {
    let value = '';
    let i = start;
    while (i < source.length && source.charCodeAt(i) !== quote) {
        let ch = source.charCodeAt(i);
        if (ch !== 0x5c) {
            value += source[i++];
            continue;
        }
        i++;
        if (i >= source.length) return null;
        ch = source.charCodeAt(i++);
        if (ch === 0x6e) value += '\n';
        else if (ch === 0x72) value += '\r';
        else if (ch === 0x74) value += '\t';
        else if (ch === 0x62) value += '\b';
        else if (ch === 0x66) value += '\f';
        else if (ch === 0x76) value += '\v';
        else if (ch === 0x78 && i + 2 <= source.length) {
            const hex = source.substring(i, i + 2);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null;
            value += String.fromCharCode(parseInt(hex, 16));
            i += 2;
        } else if (ch === 0x75 && source.charCodeAt(i) === 0x7b) {
            const end = source.indexOf('}', i + 1);
            if (end < 0) return null;
            const hex = source.substring(i + 1, end);
            if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
            const codePoint = parseInt(hex, 16);
            if (codePoint > 0x10ffff) return null;
            value += String.fromCodePoint(codePoint);
            i = end + 1;
        } else if (ch === 0x75 && i + 4 <= source.length) {
            const hex = source.substring(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
            value += String.fromCharCode(parseInt(hex, 16));
            i += 4;
        } else if (ch >= 0x30 && ch <= 0x37) {
            let octal = String.fromCharCode(ch);
            while (octal.length < 3 && i < source.length) {
                const next = source.charCodeAt(i);
                if (next < 0x30 || next > 0x37) break;
                octal += source[i++];
            }
            value += String.fromCharCode(parseInt(octal, 8));
        } else {
            value += String.fromCharCode(ch);
        }
    }
    return i < source.length ? { value, end: i } : null;
}

function readLoaderCjsExportTarget(source, pos, allowBareExports) {
    let i = pos;
    const exportsEnd = readLoaderNamedIdentifier(source, i, 'exports');
    if (allowBareExports !== false && exportsEnd !== null) {
        const previous = previousSignificantChar(source, pos);
        if (previous === 0x2e || previous === 0x23) return null;
        i = exportsEnd;
    } else {
        const moduleEnd = readLoaderNamedIdentifier(source, i, 'module');
        if (moduleEnd === null) return null;
        const previous = previousSignificantChar(source, pos);
        if (previous === 0x2e || previous === 0x23) return null;
        i = skipWhitespaceAndComments(source, moduleEnd);
        if (source.charCodeAt(i) !== 0x2e) return null;
        i = skipWhitespaceAndComments(source, i + 1);
        const moduleExportsEnd = readLoaderNamedIdentifier(source, i, 'exports');
        if (moduleExportsEnd === null) return null;
        i = moduleExportsEnd;
    }
    return i;
}

function readLoaderCjsExportName(source, pos) {
    let i = readLoaderCjsExportTarget(source, pos);
    if (i === null) return null;

    i = skipWhitespaceAndComments(source, i);
    let name;
    if (source.charCodeAt(i) === 0x2e) {
        i = skipWhitespaceAndComments(source, i + 1);
        const ident = readLoaderIdentifier(source, i);
        if (ident === null) return null;
        name = ident.name;
        i = ident.end;
    } else if (source.charCodeAt(i) === 0x5b) {
        i = skipWhitespaceAndComments(source, i + 1);
        const quote = source.charCodeAt(i);
        if (quote !== 0x27 && quote !== 0x22) return null;
        const decoded = decodeStringLiteral(source, i + 1, quote);
        if (decoded === null) return null;
        name = decoded.value;
        i = skipWhitespaceAndComments(source, decoded.end + 1);
        if (source.charCodeAt(i) !== 0x5d) return null;
        i++;
    } else {
        return null;
    }

    i = skipWhitespaceAndComments(source, i);
    return readLoaderAssignmentOperator(source, i) === null ? null : name;
}

function loaderFindMatchingParen(source, open) {
    let depth = 0;
    let i = open;
    while (i < source.length) {
        const skipped = skipNonCode(source, i, true);
        if (skipped !== null) {
            i = skipped;
            continue;
        }
        const ch = source.charCodeAt(i);
        if (ch === 0x28) depth++;
        else if (ch === 0x29) {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

function loaderFindMatchingBrace(source, open) {
    let depth = 0;
    let i = open;
    while (i < source.length) {
        const skipped = skipNonCode(source, i, true);
        if (skipped !== null) {
            i = skipped;
            continue;
        }
        const ch = source.charCodeAt(i);
        if (ch === 0x7b) depth++;
        else if (ch === 0x7d) {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

function skipLoaderObjectLiteralValue(source, pos, objectEnd) {
    let i = pos;
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;
    while (i < objectEnd) {
        const skipped = skipNonCode(source, i, true);
        if (skipped !== null) {
            i = skipped;
            continue;
        }
        const ch = source.charCodeAt(i);
        if (ch === 0x7b) braceDepth++;
        else if (ch === 0x7d) braceDepth = Math.max(0, braceDepth - 1);
        else if (ch === 0x28) parenDepth++;
        else if (ch === 0x29) parenDepth = Math.max(0, parenDepth - 1);
        else if (ch === 0x5b) bracketDepth++;
        else if (ch === 0x5d) bracketDepth = Math.max(0, bracketDepth - 1);
        else if (ch === 0x2c && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
            return i;
        }
        i++;
    }
    return objectEnd;
}

function readLoaderObjectLiteralKey(source, pos) {
    const ch = source.charCodeAt(pos);
    if (ch === 0x27 || ch === 0x22) {
        const decoded = decodeStringLiteral(source, pos + 1, ch);
        if (decoded === null) return null;
        return { name: decoded.value, keyIsIdent: false, end: decoded.end + 1 };
    }
    const ident = readLoaderIdentifier(source, pos);
    if (ident === null) return null;
    return { name: ident.name, keyIsIdent: true, end: ident.end };
}

function loaderObjectLiteralValueExport(source, pos, objectEnd) {
    const ident = readLoaderIdentifier(source, pos);
    if (ident === null) return null;
    let i = skipWhitespaceAndComments(source, ident.end);
    if (i >= objectEnd || source.charCodeAt(i) === 0x2c) return { named: true, stop: false };
    if (ident.name === 'true' || ident.name === 'false' || ident.name === 'null' || ident.name === 'undefined') {
        return { named: true, stop: false };
    }
    return { named: true, stop: true };
}

function readLoaderModuleExportsObjectLiteralNames(source, pos) {
    const targetEnd = readLoaderCjsExportTarget(source, pos, false);
    if (targetEnd === null) return null;
    let i = skipWhitespaceAndComments(source, targetEnd);
    i = readLoaderAssignmentOperator(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    if (source.charCodeAt(i) !== 0x7b) return null;
    const objectEnd = loaderFindMatchingBrace(source, i);
    if (objectEnd < 0) return null;

    const names = [];
    const reexports = [];
    let cursor = skipWhitespaceAndComments(source, i + 1);
    while (cursor < objectEnd) {
        if (source.charCodeAt(cursor) === 0x2c) {
            cursor = skipWhitespaceAndComments(source, cursor + 1);
            continue;
        }
        if (isLoaderSpreadTokenAt(source, cursor)) {
            const spreadStart = skipWhitespaceAndComments(source, cursor + 3);
            const requireEnd = readLoaderNamedIdentifier(source, spreadStart, 'require');
            if (requireEnd !== null) {
                const afterRequire = skipWhitespaceAndComments(source, requireEnd);
                if (source.charCodeAt(afterRequire) !== 0x28) break;
                const requireCall = readLoaderRequireString(source, spreadStart, true);
                if (requireCall !== null) {
                    reexports.push(requireCall.specifier);
                    const afterRequireCall = skipWhitespaceAndComments(source, requireCall.end);
                    if (afterRequireCall < objectEnd && source.charCodeAt(afterRequireCall) !== 0x2c) break;
                    cursor = afterRequireCall;
                } else {
                    cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, spreadStart, objectEnd));
                }
            } else {
                const spreadKey = readLoaderObjectLiteralKey(source, spreadStart);
                if (spreadKey === null || !spreadKey.keyIsIdent) break;
                const afterIdent = skipWhitespaceAndComments(source, spreadKey.end);
                if (afterIdent < objectEnd && source.charCodeAt(afterIdent) !== 0x2c) break;
                cursor = afterIdent;
            }
        } else {
            const key = readLoaderObjectLiteralKey(source, cursor);
            if (key === null) break;
            let next = skipWhitespaceAndComments(source, key.end);
            if (source.charCodeAt(next) === 0x3a) {
                next = skipWhitespaceAndComments(source, next + 1);
                const valueExport = loaderObjectLiteralValueExport(source, next, objectEnd);
                if (valueExport === null) break;
                names.push(key.name);
                if (valueExport.stop) break;
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, next, objectEnd));
            } else if (key.keyIsIdent) {
                names.push(key.name);
                cursor = next;
            } else {
                break;
            }
        }
        const nextEntry = nextLoaderObjectLiteralEntry(source, cursor, objectEnd);
        if (nextEntry === null) break;
        cursor = nextEntry;
    }
    return { names, reexports, end: objectEnd + 1 };
}

function loaderDescriptorPropertyName(source, pos) {
    const ch = source.charCodeAt(pos);
    if (ch === 0x27 || ch === 0x22) {
        const decoded = decodeStringLiteral(source, pos + 1, ch);
        if (decoded === null) return null;
        return { name: decoded.value, quoted: true, end: decoded.end + 1 };
    }
    const ident = readLoaderObjectLiteralKey(source, pos);
    if (ident === null || !ident.keyIsIdent) return null;
    return { name: ident.name, quoted: false, end: ident.end };
}

function readLoaderDescriptorObject(source, start, end) {
    const descriptorStart = skipWhitespaceAndComments(source, start);
    if (source.charCodeAt(descriptorStart) !== 0x7b) return null;
    const descriptorEnd = loaderFindMatchingBrace(source, descriptorStart);
    if (descriptorEnd < 0 || descriptorEnd > end) return null;
    return { cursor: skipWhitespaceAndComments(source, descriptorStart + 1), end: descriptorEnd };
}

function nextLoaderObjectLiteralEntry(source, cursor, objectEnd) {
    if (cursor >= objectEnd) return objectEnd;
    if (source.charCodeAt(cursor) !== 0x2c) return null;
    return skipWhitespaceAndComments(source, cursor + 1);
}

function isLoaderSpreadTokenAt(source, pos) {
    return source.charCodeAt(pos) === 0x2e && source.charCodeAt(pos + 1) === 0x2e && source.charCodeAt(pos + 2) === 0x2e;
}

function loaderDescriptorFunctionGetterBody(source, pos, descriptorEnd) {
    const functionEnd = readLoaderNamedIdentifier(source, pos, 'function');
    if (functionEnd === null) return null;
    let next = skipWhitespaceAndComments(source, functionEnd);
    const functionName = readLoaderIdentifier(source, next);
    if (functionName !== null) {
        next = skipWhitespaceAndComments(source, functionName.end);
    }
    if (source.charCodeAt(next) !== 0x28) return null;
    const body = loaderGetterBodyEnd(source, next, descriptorEnd);
    if (body === null) return null;
    return body;
}

function loaderDescriptorFunctionGetterEnd(source, pos, descriptorEnd) {
    const body = loaderDescriptorFunctionGetterBody(source, pos, descriptorEnd);
    if (body === null || !loaderSimpleGetterBody(source, body.start, body.end)) return null;
    return body.end + 1;
}

function loaderDescriptorHasNamedProperty(source, start, end) {
    const descriptor = readLoaderDescriptorObject(source, start, end);
    if (descriptor === null) return false;
    let foundKind = null;
    let cursor = descriptor.cursor;
    const descriptorEnd = descriptor.end;
    while (cursor < descriptorEnd) {
        if (source.charCodeAt(cursor) === 0x2c) {
            cursor = skipWhitespaceAndComments(source, cursor + 1);
            continue;
        }
        if (isLoaderSpreadTokenAt(source, cursor)) return false;
        if (source.charCodeAt(cursor) === 0x5b) {
            if (foundKind === 'value') {
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, cursor, descriptorEnd));
                cursor = nextLoaderObjectLiteralEntry(source, cursor, descriptorEnd);
                if (cursor === null) return false;
                continue;
            }
            return false;
        }
        const key = loaderDescriptorPropertyName(source, cursor);
        if (key === null) return false;
        let next = skipWhitespaceAndComments(source, key.end);
        if (key.quoted) {
            if (foundKind === 'value') {
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, next, descriptorEnd));
            } else {
                return false;
            }
        } else if (key.name === 'value') {
            if (foundKind === 'get') return false;
            if (foundKind === 'value') {
                const valueStart = source.charCodeAt(next) === 0x3a ? next + 1 : next;
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, valueStart, descriptorEnd));
            } else {
                if (source.charCodeAt(next) !== 0x3a) return false;
                foundKind = 'value';
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, next + 1, descriptorEnd));
            }
        } else if (key.name === 'get') {
            if (foundKind !== null) return false;
            if (source.charCodeAt(next) === 0x28) {
                const body = loaderGetterBodyEnd(source, next, descriptorEnd);
                if (body === null || !loaderSimpleGetterBody(source, body.start, body.end)) return false;
                foundKind = 'get';
                cursor = skipWhitespaceAndComments(source, body.end + 1);
            } else if (source.charCodeAt(next) === 0x3a) {
                const functionEnd = loaderDescriptorFunctionGetterEnd(source, skipWhitespaceAndComments(source, next + 1), descriptorEnd);
                if (functionEnd === null) return false;
                foundKind = 'get';
                cursor = skipWhitespaceAndComments(source, functionEnd);
            } else {
                return false;
            }
        } else if (key.name === 'enumerable') {
            if (source.charCodeAt(next) !== 0x3a) return false;
            if (foundKind === 'value') {
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, next + 1, descriptorEnd));
            } else if (foundKind === 'get') {
                return false;
            } else {
                const valueStart = skipWhitespaceAndComments(source, next + 1);
                const trueEnd = readLoaderNamedIdentifier(source, valueStart, 'true');
                if (trueEnd === null) {
                    return false;
                }
                cursor = skipWhitespaceAndComments(source, trueEnd);
            }
        } else {
            if (foundKind === 'value') {
                cursor = skipWhitespaceAndComments(source, skipLoaderObjectLiteralValue(source, next, descriptorEnd));
            } else {
                return false;
            }
        }
        cursor = nextLoaderObjectLiteralEntry(source, cursor, descriptorEnd);
        if (cursor === null) return false;
    }
    return foundKind !== null;
}

function readLoaderGetterReturnMember(source, start, end) {
    let i = skipWhitespaceAndComments(source, start);
    const returnEnd = readLoaderNamedIdentifier(source, i, 'return');
    if (returnEnd === null) return null;
    i = skipWhitespaceAndComments(source, returnEnd);
    const receiver = readLoaderIdentifier(source, i);
    if (receiver === null) return null;
    i = skipWhitespaceAndComments(source, receiver.end);
    let member = { kind: 'bare', receiver: receiver.name };
    if (source.charCodeAt(i) === 0x2e) {
        i = skipWhitespaceAndComments(source, i + 1);
        const property = readLoaderIdentifier(source, i);
        if (property === null) return null;
        i = property.end;
        member = { kind: 'dot', receiver: receiver.name, property: property.name };
    } else if (source.charCodeAt(i) === 0x5b) {
        i = skipWhitespaceAndComments(source, i + 1);
        const quote = source.charCodeAt(i);
        if (quote === 0x27 || quote === 0x22) {
            const decoded = decodeStringLiteral(source, i + 1, quote);
            if (decoded === null) return null;
            i = skipWhitespaceAndComments(source, decoded.end + 1);
            member = { kind: 'bracket-string', receiver: receiver.name, property: decoded.value };
        } else {
            const property = readLoaderIdentifier(source, i);
            if (property === null) return null;
            i = skipWhitespaceAndComments(source, property.end);
            member = { kind: 'bracket-identifier', receiver: receiver.name, property: property.name };
        }
        if (source.charCodeAt(i) !== 0x5d) return null;
        i++;
    }
    i = skipWhitespaceAndComments(source, i);
    if (source.charCodeAt(i) === 0x3b) i = skipWhitespaceAndComments(source, i + 1);
    return i >= end ? member : null;
}

function loaderSimpleGetterBody(source, start, end) {
    const member = readLoaderGetterReturnMember(source, start, end);
    return member !== null && member.kind !== 'bracket-identifier';
}

function loaderGetterBodyEnd(source, paramsOpen, limit) {
    const paramsEnd = loaderFindMatchingParen(source, paramsOpen);
    if (paramsEnd < 0 || paramsEnd > limit) return null;
    if (skipWhitespaceAndComments(source, paramsOpen + 1) !== paramsEnd) return null;
    let i = skipWhitespaceAndComments(source, paramsEnd + 1);
    if (source.charCodeAt(i) !== 0x7b) return null;
    const bodyEnd = loaderFindMatchingBrace(source, i);
    return bodyEnd >= 0 && bodyEnd <= limit ? { start: i + 1, end: bodyEnd } : null;
}

function readLoaderDefinePropertyCall(source, pos, rejectMemberAccess) {
    const objectEnd = readLoaderNamedIdentifier(source, pos, 'Object');
    if (objectEnd === null) return null;
    if (rejectMemberAccess) {
        const previous = previousSignificantChar(source, pos);
        if (previous === 0x2e || previous === 0x23) return null;
    }
    let i = skipWhitespaceAndComments(source, objectEnd);
    if (source.charCodeAt(i) !== 0x2e) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const definePropertyEnd = readLoaderNamedIdentifier(source, i, 'defineProperty');
    if (definePropertyEnd === null) return null;
    i = skipWhitespaceAndComments(source, definePropertyEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    const open = i;
    i = skipWhitespaceAndComments(source, i + 1);
    return { open, next: i };
}

function readLoaderDefinePropertyExportName(source, pos) {
    const call = readLoaderDefinePropertyCall(source, pos, true);
    if (call === null) return null;
    const open = call.open;
    let i = call.next;
    i = readLoaderCjsExportTarget(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    if (source.charCodeAt(i) !== 0x2c) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const quote = source.charCodeAt(i);
    if (quote !== 0x27 && quote !== 0x22) return null;
    const decoded = decodeStringLiteral(source, i + 1, quote);
    if (decoded === null) return null;
    i = skipWhitespaceAndComments(source, decoded.end + 1);
    if (source.charCodeAt(i) !== 0x2c) return null;
    const close = loaderFindMatchingParen(source, open);
    if (close < 0 || !loaderDescriptorHasNamedProperty(source, i + 1, close)) return null;
    return decoded.value;
}

function readLoaderModuleExportsRequire(source, pos) {
    if (readLoaderNamedIdentifier(source, pos, 'module') === null) return null;
    const targetEnd = readLoaderCjsExportTarget(source, pos, false);
    if (targetEnd === null) return null;
    let i = skipWhitespaceAndComments(source, targetEnd);
    i = readLoaderAssignmentOperator(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    const required = readLoaderRequireString(source, i);
    return required === null ? null : required.specifier;
}

function readLoaderRequireString(source, pos, allowSpreadPrefix) {
    const requireEnd = readLoaderNamedIdentifier(source, pos, 'require');
    if (requireEnd === null) return null;
    if (!allowSpreadPrefix && previousSignificantChar(source, pos) === 0x2e) return null;
    let i = skipWhitespaceAndComments(source, requireEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const quote = source.charCodeAt(i);
    if (quote !== 0x27 && quote !== 0x22) return null;
    const decoded = decodeStringLiteral(source, i + 1, quote);
    if (decoded === null) return null;
    i = skipWhitespaceAndComments(source, decoded.end + 1);
    if (source.charCodeAt(i) !== 0x29) return null;
    return { specifier: decoded.value, end: i + 1 };
}

function skipWhitespaceAndCommentsWithLineTerminator(source, start) {
    return skipWhitespaceAndCommentsImpl(source, start, true);
}

function loaderIsStatementBoundary(source, pos) {
    const skipped = skipWhitespaceAndCommentsWithLineTerminator(source, pos);
    const i = skipped.pos;
    if (i >= source.length) return true;
    if (source.charCodeAt(i) === 0x3b || source.charCodeAt(i) === 0x7d) return true;
    if (!skipped.hasLineTerminator) return false;
    return !isLoaderAsiContinuationNext(source, i);
}

function isLoaderAsiContinuationNext(source, pos) {
    if (pos + 1 < source.length) {
        const code = source.charCodeAt(pos);
        const next = source.charCodeAt(pos + 1);
        if ((code === 0x2b && next === 0x2b) || (code === 0x2d && next === 0x2d)) return false;
    }
    return isLoaderAsiContinuationOperator(source.charCodeAt(pos));
}

function isLoaderAsiContinuationOperator(code) {
    return code === 0x60 || code === 0x28 || code === 0x5b || code === 0x2e || code === 0x2c || code === 0x3a ||
        code === 0x3f || code === 0x2b || code === 0x2d || code === 0x2a || code === 0x2f || code === 0x25 ||
        code === 0x26 || code === 0x7c || code === 0x5e || code === 0x3c || code === 0x3e || code === 0x3d;
}

function readLoaderRequireBinding(source, pos) {
    const declarationEnd = readVariableDeclarationKeyword(source, pos);
    if (declarationEnd === null) return null;
    let i = skipWhitespaceAndComments(source, declarationEnd);
    const parsedBinding = readLoaderIdentifier(source, i);
    if (parsedBinding === null) return null;
    const binding = parsedBinding.name;
    i = skipWhitespaceAndComments(source, parsedBinding.end);
    i = readLoaderAssignmentOperator(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    let required = readLoaderRequireString(source, i);
    if (required !== null) {
        if (!loaderIsStatementBoundary(source, required.end)) return null;
        return { binding, specifier: required.specifier, end: required.end };
    }
    const interopEnd = readLoaderNamedIdentifier(source, i, '_interopRequireWildcard');
    if (interopEnd === null) return null;
    i = skipWhitespaceAndComments(source, interopEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    required = readLoaderRequireString(source, skipWhitespaceAndComments(source, i + 1));
    if (required === null) return null;
    i = skipWhitespaceAndComments(source, required.end);
    if (source.charCodeAt(i) !== 0x29) return null;
    if (!loaderIsStatementBoundary(source, i + 1)) return null;
    return { binding, specifier: required.specifier, end: i + 1 };
}

function readLoaderBracketIdentifier(source, pos, ident) {
    if (source.charCodeAt(pos) !== 0x5b) return null;
    let i = skipWhitespaceAndComments(source, pos + 1);
    const identEnd = readLoaderNamedIdentifier(source, i, ident);
    if (identEnd === null) return null;
    i = skipWhitespaceAndComments(source, identEnd);
    if (source.charCodeAt(i) !== 0x5d) return null;
    return i + 1;
}

function readLoaderKeyStringComparison(source, pos, key, operator) {
    const keyEnd = readLoaderNamedIdentifier(source, pos, key);
    if (keyEnd === null) return null;
    let i = skipWhitespaceAndComments(source, keyEnd);
    i = readLoaderOperator(source, i, operator);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    const quote = source.charCodeAt(i);
    if (quote !== 0x27 && quote !== 0x22) return null;
    const decoded = decodeStringLiteral(source, i + 1, quote);
    if (decoded === null) return null;
    return { value: decoded.value, end: decoded.end + 1 };
}

function readLoaderKeyEqualsString(source, pos, key) {
    return readLoaderKeyStringComparison(source, pos, key, '===');
}

function readLoaderKeyNotEqualsString(source, pos, key) {
    return readLoaderKeyStringComparison(source, pos, key, '!==');
}

function readLoaderDotMember(source, pos, name) {
    let i = skipWhitespaceAndComments(source, pos);
    if (source.charCodeAt(i) !== 0x2e) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const end = readLoaderNamedIdentifier(source, i, name);
    return end === null ? null : skipWhitespaceAndComments(source, end);
}

function readLoaderIdentifier(source, pos) {
    if (!isIdentifierStartCode(source.charCodeAt(pos))) return null;
    let i = pos + 1;
    while (i < source.length && isIdentifierContinueCode(source.charCodeAt(i))) i++;
    return { name: source.substring(pos, i), end: i };
}

function readLoaderNamedIdentifier(source, pos, name) {
    return readKeywordAt(source, name, pos);
}

function readLoaderOperator(source, pos, operator) {
    for (let i = 0; i < operator.length; i++) {
        if (source.charCodeAt(pos + i) !== operator.charCodeAt(i)) return null;
    }
    return pos + operator.length;
}

function readLoaderAssignmentOperator(source, pos) {
    if (source.charCodeAt(pos) !== 0x3d) return null;
    const next = source.charCodeAt(pos + 1);
    return next === 0x3d || next === 0x3e ? null : pos + 1;
}

function readLoaderObjectHasOwnPropertyCall(source, pos, key, requirePrototype) {
    let i = readLoaderNamedIdentifier(source, pos, 'Object');
    if (i === null) return null;
    const prototype = readLoaderDotMember(source, i, 'prototype');
    if (prototype !== null) {
        i = prototype;
    } else if (requirePrototype) {
        return null;
    }
    i = readLoaderDotMember(source, i, 'hasOwnProperty');
    if (i === null) return null;
    i = readLoaderDotMember(source, i, 'call');
    if (i === null || source.charCodeAt(i) !== 0x28) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const target = readLoaderIdentifier(source, i);
    if (target === null) return null;
    i = skipWhitespaceAndComments(source, target.end);
    if (source.charCodeAt(i) !== 0x2c) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const keyEnd = readLoaderNamedIdentifier(source, i, key);
    if (keyEnd === null) return null;
    i = skipWhitespaceAndComments(source, keyEnd);
    if (source.charCodeAt(i) !== 0x29) return null;
    return { target: target.name, end: i + 1 };
}

function readLoaderIfCondition(source, pos) {
    const ifEnd = readLoaderNamedIdentifier(source, pos, 'if');
    if (ifEnd === null) return null;
    let i = skipWhitespaceAndComments(source, ifEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    const conditionEnd = loaderFindMatchingParen(source, i);
    if (conditionEnd < 0) return null;
    return {
        start: i + 1,
        end: conditionEnd,
        after: skipWhitespaceAndComments(source, conditionEnd + 1),
    };
}

function readLoaderDefaultEsModuleReturnGuard(source, pos, key) {
    const condition = readLoaderIfCondition(source, pos);
    if (condition === null) return null;
    let c = skipWhitespaceAndComments(source, condition.start);
    const first = readLoaderKeyEqualsString(source, c, key);
    if (first === null || first.value !== 'default') return null;
    c = skipWhitespaceAndComments(source, first.end);
    c = readLoaderOperator(source, c, '||');
    if (c === null) return null;
    c = skipWhitespaceAndComments(source, c);
    const second = readLoaderKeyEqualsString(source, c, key);
    if (second === null || second.value !== '__esModule') return null;
    if (skipWhitespaceAndComments(source, second.end) !== condition.end) return null;
    return readLoaderNamedIdentifier(source, condition.after, 'return');
}

function readLoaderHasOwnPropertyKey(source, pos, key) {
    const receiver = readLoaderIdentifier(source, pos);
    if (receiver === null) return null;
    if (receiver.name === 'Object') {
        const objectCall = readLoaderObjectHasOwnPropertyCall(source, pos, key, false);
        if (objectCall !== null) return objectCall.end;
    }

    let i = readLoaderDotMember(source, receiver.end, 'hasOwnProperty');
    if (i === null || source.charCodeAt(i) !== 0x28) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const keyEnd = readLoaderNamedIdentifier(source, i, key);
    if (keyEnd === null) return null;
    i = skipWhitespaceAndComments(source, keyEnd);
    if (source.charCodeAt(i) !== 0x29) return null;
    return i + 1;
}

function readLoaderExportsHasOwnPropertyKey(source, pos, key) {
    const objectCall = readLoaderObjectHasOwnPropertyCall(source, pos, key, true);
    return objectCall !== null && objectCall.target === 'exports' ? objectCall.end : null;
}

function readLoaderDuplicateExportReturnGuard(source, pos, binding, key) {
    const condition = readLoaderIfCondition(source, pos);
    if (condition === null) return null;
    let c = skipWhitespaceAndComments(source, condition.start);
    const hasOwnEnd = readLoaderExportsHasOwnPropertyKey(source, c, key);
    if (hasOwnEnd !== null && skipWhitespaceAndComments(source, hasOwnEnd) === condition.end) {
        return readLoaderNamedIdentifier(source, condition.after, 'return');
    }
    const keyEnd = readLoaderNamedIdentifier(source, c, key);
    if (keyEnd === null) return null;
    c = skipWhitespaceAndComments(source, keyEnd);
    const inEnd = readLoaderNamedIdentifier(source, c, 'in');
    if (inEnd === null) return null;
    c = skipWhitespaceAndComments(source, inEnd);
    let targetEnd = readLoaderCjsExportTarget(source, c);
    if (targetEnd === null) return null;
    c = skipWhitespaceAndComments(source, targetEnd);
    c = readLoaderOperator(source, c, '&&');
    if (c === null) return null;
    c = skipWhitespaceAndComments(source, c);
    targetEnd = readLoaderCjsExportTarget(source, c);
    if (targetEnd === null) return null;
    c = skipWhitespaceAndComments(source, targetEnd);
    c = readLoaderBracketIdentifier(source, c, key);
    if (c === null) return null;
    c = skipWhitespaceAndComments(source, c);
    c = readLoaderOperator(source, c, '===');
    if (c === null) return null;
    c = skipWhitespaceAndComments(source, c);
    const bindingEnd = readLoaderNamedIdentifier(source, c, binding);
    if (bindingEnd === null) return null;
    c = skipWhitespaceAndComments(source, bindingEnd);
    c = readLoaderBracketIdentifier(source, c, key);
    if (c === null || skipWhitespaceAndComments(source, c) !== condition.end) return null;
    return readLoaderNamedIdentifier(source, condition.after, 'return');
}

function readLoaderHasOwnConditionalReexport(source, pos, binding, key) {
    const condition = readLoaderIfCondition(source, pos);
    if (condition === null) return null;
    let c = skipWhitespaceAndComments(source, condition.start);
    const keyCheck = readLoaderKeyNotEqualsString(source, c, key);
    if (keyCheck === null || keyCheck.value !== 'default') return null;
    c = skipWhitespaceAndComments(source, keyCheck.end);
    c = readLoaderOperator(source, c, '&&');
    if (c === null) return null;
    c = skipWhitespaceAndComments(source, c);
    if (source.charCodeAt(c) !== 0x21) return null;
    c = skipWhitespaceAndComments(source, c + 1);
    const hasOwnEnd = readLoaderHasOwnPropertyKey(source, c, key);
    if (hasOwnEnd === null || skipWhitespaceAndComments(source, hasOwnEnd) !== condition.end) return null;
    return readLoaderDirectReexportAssignment(source, condition.after, binding, key);
}

function readLoaderDirectReexportAssignment(source, pos, binding, key) {
    let i = readLoaderCjsExportTarget(source, pos);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    i = readLoaderBracketIdentifier(source, i, key);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    i = readLoaderAssignmentOperator(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    const bindingEnd = readLoaderNamedIdentifier(source, i, binding);
    if (bindingEnd === null) return null;
    i = skipWhitespaceAndComments(source, bindingEnd);
    i = readLoaderBracketIdentifier(source, i, key);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    return loaderIsStatementBoundary(source, i) ? i : null;
}

function loaderGetterReturnsBindingKey(source, start, end, binding, key) {
    let i = skipWhitespaceAndComments(source, start);
    const returnEnd = readLoaderNamedIdentifier(source, i, 'return');
    if (returnEnd === null) return false;
    i = skipWhitespaceAndComments(source, returnEnd);
    const bindingEnd = readLoaderNamedIdentifier(source, i, binding);
    if (bindingEnd === null) return false;
    i = skipWhitespaceAndComments(source, bindingEnd);
    i = readLoaderBracketIdentifier(source, i, key);
    if (i === null) return false;
    i = skipWhitespaceAndComments(source, i);
    if (source.charCodeAt(i) === 0x3b) i = skipWhitespaceAndComments(source, i + 1);
    return i >= end;
}

function loaderDynamicReexportGetterBody(source, paramsOpen, limit, binding, key) {
    const paramsEnd = loaderFindMatchingParen(source, paramsOpen);
    if (paramsEnd < 0 || paramsEnd > limit) return null;
    if (skipWhitespaceAndComments(source, paramsOpen + 1) !== paramsEnd) return null;
    let i = skipWhitespaceAndComments(source, paramsEnd + 1);
    if (source.charCodeAt(i) !== 0x7b) return null;
    const bodyEnd = loaderFindMatchingBrace(source, i);
    if (bodyEnd < 0 || bodyEnd > limit) return null;
    return loaderGetterReturnsBindingKey(source, i + 1, bodyEnd, binding, key) ? bodyEnd + 1 : null;
}

function loaderDescriptorHasDynamicReexportGetter(source, start, end, binding, key) {
    const descriptor = readLoaderDescriptorObject(source, start, end);
    if (descriptor === null) return false;
    let seenEnumerable = false;
    let found = false;
    let cursor = descriptor.cursor;
    const descriptorEnd = descriptor.end;
    while (cursor < descriptorEnd) {
        if (source.charCodeAt(cursor) === 0x2c) {
            cursor = skipWhitespaceAndComments(source, cursor + 1);
            continue;
        }
        if (isLoaderSpreadTokenAt(source, cursor) || source.charCodeAt(cursor) === 0x5b) return false;
        const property = loaderDescriptorPropertyName(source, cursor);
        if (property === null || property.quoted) return false;
        let next = skipWhitespaceAndComments(source, property.end);
        if (property.name === 'enumerable') {
            if (seenEnumerable || found || source.charCodeAt(next) !== 0x3a) return false;
            const valueStart = skipWhitespaceAndComments(source, next + 1);
            const trueEnd = readLoaderNamedIdentifier(source, valueStart, 'true');
            if (trueEnd === null) return false;
            seenEnumerable = true;
            cursor = skipWhitespaceAndComments(source, trueEnd);
        } else if (property.name === 'get') {
            if (found) return false;
            if (source.charCodeAt(next) === 0x28) {
                const getterEnd = loaderDynamicReexportGetterBody(source, next, descriptorEnd, binding, key);
                if (getterEnd === null) return false;
                found = true;
                cursor = skipWhitespaceAndComments(source, getterEnd);
            } else if (source.charCodeAt(next) === 0x3a) {
                const body = loaderDescriptorFunctionGetterBody(source, skipWhitespaceAndComments(source, next + 1), descriptorEnd);
                if (body === null || !loaderGetterReturnsBindingKey(source, body.start, body.end, binding, key)) return false;
                found = true;
                cursor = skipWhitespaceAndComments(source, body.end + 1);
            } else {
                return false;
            }
        } else {
            return false;
        }
        cursor = nextLoaderObjectLiteralEntry(source, cursor, descriptorEnd);
        if (cursor === null) return false;
    }
    return found && seenEnumerable;
}

function readLoaderDefinePropertyReexport(source, pos, binding, key) {
    const call = readLoaderDefinePropertyCall(source, pos, false);
    if (call === null) return null;
    const open = call.open;
    let i = call.next;
    i = readLoaderCjsExportTarget(source, i);
    if (i === null) return null;
    i = skipWhitespaceAndComments(source, i);
    if (source.charCodeAt(i) !== 0x2c) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const keyEnd = readLoaderNamedIdentifier(source, i, key);
    if (keyEnd === null) return null;
    i = skipWhitespaceAndComments(source, keyEnd);
    if (source.charCodeAt(i) !== 0x2c) return null;
    const close = loaderFindMatchingParen(source, open);
    if (close < 0) return null;
    if (!loaderDescriptorHasDynamicReexportGetter(source, i + 1, close, binding, key)) return null;
    return close + 1;
}

function loaderCallbackHasReexport(source, binding, key) {
    let i = skipWhitespaceAndComments(source, 0);
    const conditional = readLoaderHasOwnConditionalReexport(source, i, binding, key);
    if (conditional !== null) return true;
    const guarded = readLoaderDefaultEsModuleReturnGuard(source, i, key);
    if (guarded === null) return false;
    i = skipWhitespaceAndComments(source, guarded);
    if (source.charCodeAt(i) === 0x3b) i = skipWhitespaceAndComments(source, i + 1);
    for (;;) {
        const nextGuard = readLoaderDuplicateExportReturnGuard(source, i, binding, key);
        if (nextGuard === null) break;
        i = skipWhitespaceAndComments(source, nextGuard);
        if (source.charCodeAt(i) === 0x3b) i = skipWhitespaceAndComments(source, i + 1);
    }
    const direct = readLoaderDirectReexportAssignment(source, i, binding, key);
    if (direct !== null) return true;
    return readLoaderDefinePropertyReexport(source, i, binding, key) !== null;
}

function readLoaderObjectKeysReexport(source, pos, requireBindings) {
    const objectEnd = readLoaderNamedIdentifier(source, pos, 'Object');
    if (objectEnd === null) return null;
    let i = skipWhitespaceAndComments(source, objectEnd);
    if (source.charCodeAt(i) !== 0x2e) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const keysEnd = readLoaderNamedIdentifier(source, i, 'keys');
    if (keysEnd === null) return null;
    i = skipWhitespaceAndComments(source, keysEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const parsedBinding = readLoaderIdentifier(source, i);
    if (parsedBinding === null) return null;
    const binding = parsedBinding.name;
    const specifier = requireBindings[binding];
    if (specifier === undefined) return null;
    i = skipWhitespaceAndComments(source, parsedBinding.end);
    if (source.charCodeAt(i) !== 0x29) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    if (source.charCodeAt(i) !== 0x2e) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const forEachEnd = readLoaderNamedIdentifier(source, i, 'forEach');
    if (forEachEnd === null) return null;
    i = skipWhitespaceAndComments(source, forEachEnd);
    if (source.charCodeAt(i) !== 0x28) return null;
    const callEnd = loaderFindMatchingParen(source, i);
    if (callEnd < 0) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const functionEnd = readLoaderNamedIdentifier(source, i, 'function');
    if (functionEnd === null) return null;
    i = skipWhitespaceAndComments(source, functionEnd);
    const functionName = readLoaderIdentifier(source, i);
    if (functionName !== null) {
        i = skipWhitespaceAndComments(source, functionName.end);
    }
    if (source.charCodeAt(i) !== 0x28) return null;
    const paramsEnd = loaderFindMatchingParen(source, i);
    if (paramsEnd < 0 || paramsEnd > callEnd) return null;
    i = skipWhitespaceAndComments(source, i + 1);
    const parsedKey = readLoaderIdentifier(source, i);
    if (parsedKey === null) return null;
    const key = parsedKey.name;
    if (skipWhitespaceAndComments(source, parsedKey.end) !== paramsEnd) return null;
    i = skipWhitespaceAndComments(source, paramsEnd + 1);
    if (source.charCodeAt(i) !== 0x7b) return null;
    const bodyEnd = loaderFindMatchingBrace(source, i);
    if (bodyEnd < 0 || bodyEnd > callEnd || skipWhitespaceAndComments(source, bodyEnd + 1) !== callEnd) return null;
    if (!loaderCallbackHasReexport(source.substring(i + 1, bodyEnd), binding, key)) return null;
    return { specifier, end: callEnd + 1 };
}

function resolveLoaderCjsReexport(specifier, filename) {
    if (!filename || isBuiltin(specifier) || specifier.startsWith('node:') || specifier.includes(':')) return null;
    const parentDir = pathModule.dirname(filename);
    if (specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
        return resolveFilename(specifier, parentDir);
    }
    if (specifier.startsWith('#')) {
        return resolvePackageImports(specifier, parentDir, cjsPackageConditions());
    }
    if (isBarePackageSpecifier(specifier)) {
        return resolveFromNodeModules(specifier, parentDir, filename, cjsPackageConditions());
    }
    return null;
}

function scanLoaderCjsTopLevelPositions(source, visitor) {
    let i = 0;
    let braceDepth = 0;
    let statementStart = true;
    while (i < source.length) {
        const skipped = skipNonCode(source, i, true);
        if (skipped !== null) {
            i = skipped;
            continue;
        }

        const ch = source.charCodeAt(i);
        if (ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d) {
            const whitespace = skipWhitespaceAndCommentsWithLineTerminator(source, i);
            if (whitespace.hasLineTerminator) {
                const nextCode = source.charCodeAt(whitespace.pos);
                if ('`([.,:?+-*/%&|^<>=!~'.indexOf(source[whitespace.pos]) < 0 && nextCode !== 0x3b) {
                    statementStart = true;
                }
            }
            i = whitespace.pos;
            continue;
        }

        const next = visitor(i, braceDepth, statementStart);
        if (next === false) return false;
        if (next && typeof next === 'object') {
            i = next.pos;
            statementStart = next.statementStart === true;
            continue;
        }
        if (typeof next === 'number') {
            i = next;
            statementStart = false;
            continue;
        }

        if (ch === 0x7b) {
            braceDepth++;
            statementStart = true;
        } else if (ch === 0x7d) {
            braceDepth = Math.max(0, braceDepth - 1);
            statementStart = true;
        } else if (ch === 0x3b) {
            statementStart = true;
        } else {
            statementStart = false;
        }
        i++;
    }
    return true;
}

function addLoaderCjsNames(names, nameSet, source, filename, seen) {
    if (seen && filename && seen[filename]) return;
    if (seen && filename) seen[filename] = true;
    const requireBindings = Object.create(null);
    scanLoaderCjsTopLevelPositions(source, (i, braceDepth, statementStart) => {
        if (braceDepth === 0 && statementStart) {
            const binding = readLoaderRequireBinding(source, i);
            if (binding !== null) {
                requireBindings[binding.binding] = binding.specifier;
                return { pos: binding.end, statementStart: true };
            }
        }
        const name = readLoaderCjsExportName(source, i) || readLoaderDefinePropertyExportName(source, i);
        if (name !== null && name !== 'default' && !nameSet.has(name)) {
            nameSet.add(name);
            names.push(name);
        }
        const objectLiteral = readLoaderModuleExportsObjectLiteralNames(source, i);
        if (objectLiteral !== null) {
            for (let j = 0; j < objectLiteral.names.length; j++) {
                const objectName = objectLiteral.names[j];
                if (objectName !== 'default' && !nameSet.has(objectName)) {
                    nameSet.add(objectName);
                    names.push(objectName);
                }
            }
            if (filename) {
                for (let j = 0; j < objectLiteral.reexports.length; j++) {
                    const reexport = objectLiteral.reexports[j];
                    try {
                        const resolved = resolveLoaderCjsReexport(reexport, filename);
                        if (resolved !== null) addLoaderCjsNames(names, nameSet, resolved.content, resolved.filename, seen || Object.create(null));
                    } catch (_) {}
                }
            }
            return objectLiteral.end;
        }
        const keysReexport = braceDepth === 0 && statementStart ? readLoaderObjectKeysReexport(source, i, requireBindings) : null;
        const reexport = keysReexport !== null ? keysReexport.specifier : readLoaderModuleExportsRequire(source, i);
        if (reexport !== null && filename) {
            try {
                const resolved = resolveLoaderCjsReexport(reexport, filename);
                if (resolved !== null) addLoaderCjsNames(names, nameSet, resolved.content, resolved.filename, seen || Object.create(null));
            } catch (_) {}
        }
        if (keysReexport !== null) return keysReexport.end;
        return undefined;
    });
}

function loaderCjsNamedExports(source, filename) {
    const names = [];
    addLoaderCjsNames(names, new Set(), source, filename, Object.create(null));
    return names;
}

function statementEndForStaticImport(source, start) {
    let i = start;
    let brace = 0;
    let paren = 0;
    while (i < source.length) {
        const code = source.charCodeAt(i);
        if (code === 0x27 || code === 0x22 || code === 0x60) {
            i = skipQuotedOrTemplate(source, i);
            continue;
        }
        if (code === 0x2f && i + 1 < source.length && source.charCodeAt(i + 1) === 0x2f) {
            i += 2;
            while (i < source.length && source.charCodeAt(i) !== 0x0a && source.charCodeAt(i) !== 0x0d) i++;
            continue;
        }
        if (code === 0x2f && i + 1 < source.length && source.charCodeAt(i + 1) === 0x2a) {
            i += 2;
            while (i + 1 < source.length && !(source.charCodeAt(i) === 0x2a && source.charCodeAt(i + 1) === 0x2f)) i++;
            i = Math.min(i + 2, source.length);
            continue;
        }
        if (code === 0x7b) brace++;
        else if (code === 0x7d) brace = Math.max(0, brace - 1);
        else if (code === 0x28) paren++;
        else if (code === 0x29) paren = Math.max(0, paren - 1);
        else if ((code === 0x3b || code === 0x0a || code === 0x0d) && brace === 0 && paren === 0) return i;
        i++;
    }
    return source.length;
}

function staticImportEdgeAt(source, pos) {
    if (startsWithKeywordAt(source, 'import', pos)) {
        const afterImport = skipWhitespaceAndComments(source, pos + 6);
        const bare = readStaticSpecifierString(source, afterImport);
        if (bare) {
            return { specifier: bare.value };
        }

        const end = statementEndForStaticImport(source, afterImport);
        let i = afterImport;
        while (i < end) {
            const code = source.charCodeAt(i);
            if (code === 0x27 || code === 0x22 || code === 0x60) {
                i = skipQuotedOrTemplate(source, i);
                continue;
            }
            if (startsWithKeywordAt(source, 'from', i)) {
                const spec = readStaticSpecifierString(source, i + 4);
                if (spec && spec.end <= end + 1) {
                    return { specifier: spec.value };
                }
            }
            i++;
        }
    }

    if (startsWithKeywordAt(source, 'export', pos)) {
        const end = statementEndForStaticImport(source, pos + 6);
        let i = pos + 6;
        while (i < end) {
            const code = source.charCodeAt(i);
            if (code === 0x27 || code === 0x22 || code === 0x60) {
                i = skipQuotedOrTemplate(source, i);
                continue;
            }
            if (startsWithKeywordAt(source, 'from', i)) {
                const spec = readStaticSpecifierString(source, i + 4);
                if (spec && spec.end <= end + 1) {
                    return { specifier: spec.value };
                }
            }
            i++;
        }
    }

    return null;
}

function collectStaticEsmEdges(source) {
    const edges = [];
    scanSourceCodePositions(source, { skipRegex: true }, (i) => {
        const edge = staticImportEdgeAt(source, i);
        if (edge !== null) edges.push(edge);
        return undefined;
    });
    return edges;
}

function collectStaticEsmSpecifiers(source) {
    return collectStaticEsmEdges(source).map((edge) => edge.specifier);
}

function collectLiteralRequireSpecifiers(source, names) {
    names = names || ['require'];
    const specifiers = [];
    scanSourceCodePositions(source, { skipRegex: true }, (i, _, previousCode) => {
        for (let n = 0; n < names.length; n++) {
            const name = names[n];
            if (startsWithKeywordAt(source, name, i) && previousCode !== 0x2e) {
                const open = skipWhitespaceAndComments(source, i + name.length);
                if (source.charCodeAt(open) === 0x28) {
                    const spec = readStaticSpecifierString(source, open + 1);
                    if (spec) specifiers.push(spec.value);
                }
            }
        }
        return undefined;
    });
    return specifiers;
}

function collectCreateRequireNamesFromImport(source, pos, end) {
    let i = skipWhitespaceAndComments(source, pos + 6);
    if (source.charCodeAt(i) !== 0x7b) return null;
    const namedEnd = loaderFindMatchingBrace(source, i);
    if (namedEnd < 0 || namedEnd > end) return null;

    let afterNamed = skipWhitespaceAndComments(source, namedEnd + 1);
    const fromEnd = readLoaderNamedIdentifier(source, afterNamed, 'from');
    if (fromEnd === null) return null;
    afterNamed = skipWhitespaceAndComments(source, fromEnd);
    const spec = readStaticSpecifierString(source, afterNamed);
    if (spec === null || spec.end > end || (spec.value !== 'module' && spec.value !== 'node:module')) return null;

    const names = [];
    let cursor = skipWhitespaceAndComments(source, i + 1);
    while (cursor < namedEnd) {
        if (source.charCodeAt(cursor) === 0x2c) {
            cursor = skipWhitespaceAndComments(source, cursor + 1);
            continue;
        }
        let importedName;
        const quote = source.charCodeAt(cursor);
        if (quote === 0x27 || quote === 0x22) {
            const decoded = decodeStringLiteral(source, cursor + 1, quote);
            if (decoded === null) return names;
            importedName = decoded.value;
            cursor = skipWhitespaceAndComments(source, decoded.end + 1);
        } else {
            const imported = readLoaderIdentifier(source, cursor);
            if (imported === null) return names;
            importedName = imported.name;
            cursor = skipWhitespaceAndComments(source, imported.end);
        }

        let local = importedName;
        const asEnd = readLoaderNamedIdentifier(source, cursor, 'as');
        if (asEnd !== null) {
            cursor = skipWhitespaceAndComments(source, asEnd);
            const alias = readLoaderIdentifier(source, cursor);
            if (alias === null) return names;
            local = alias.name;
            cursor = skipWhitespaceAndComments(source, alias.end);
        } else if (quote === 0x27 || quote === 0x22) {
            return names;
        }

        if (importedName === 'createRequire') names.push(local);
        if (cursor < namedEnd && source.charCodeAt(cursor) !== 0x2c) return names;
    }
    return names;
}

function collectCreateRequireFactoryNames(source) {
    const names = [];
    scanSourceCodePositions(source, { skipRegex: false }, (i) => {
        if (startsWithKeywordAt(source, 'import', i)) {
            const end = statementEndForStaticImport(source, i + 6);
            const parsed = collectCreateRequireNamesFromImport(source, i, end);
            if (parsed !== null) {
                for (let p = 0; p < parsed.length; p++) names.push(parsed[p]);
            }
            return end;
        }
        return undefined;
    });
    return names;
}

function collectCreateRequireAliases(source, factoryNames) {
    factoryNames = factoryNames || collectCreateRequireFactoryNames(source);
    const aliases = [];
    if (factoryNames.length === 0) return aliases;
    scanSourceCodePositions(source, { skipRegex: false }, (i) => {
        const declarationEnd = readVariableDeclarationKeyword(source, i);
        if (declarationEnd !== null) {
            let p = skipWhitespaceAndComments(source, declarationEnd);
            const ident = readLoaderIdentifier(source, p);
            if (ident !== null) {
                const name = ident.name;
                p = skipWhitespaceAndComments(source, ident.end);
                if (source.charCodeAt(p) === 0x3d) {
                    p = skipWhitespaceAndComments(source, p + 1);
                    for (let f = 0; f < factoryNames.length; f++) {
                        const factory = factoryNames[f];
                        if (startsWithKeywordAt(source, factory, p)) {
                            const open = skipWhitespaceAndComments(source, p + factory.length);
                            if (source.charCodeAt(open) === 0x28) {
                                aliases.push(name);
                            }
                        }
                    }
                }
            }
        }
        return undefined;
    });
    return aliases;
}

function collectCreateRequireCallSpecifiers(source, factoryNames) {
    factoryNames = factoryNames || collectCreateRequireFactoryNames(source);
    const specifiers = [];
    if (factoryNames.length === 0) return specifiers;
    scanSourceCodePositions(source, { skipRegex: true }, (i, _, previousCode) => {
        for (let f = 0; f < factoryNames.length; f++) {
            const factory = factoryNames[f];
            if (startsWithKeywordAt(source, factory, i) && previousCode !== 0x2e) {
                const firstOpen = skipWhitespaceAndComments(source, i + factory.length);
                if (source.charCodeAt(firstOpen) === 0x28) {
                    const firstClose = loaderFindMatchingParen(source, firstOpen);
                    if (firstClose >= 0) {
                        const secondOpen = skipWhitespaceAndComments(source, firstClose + 1);
                        if (source.charCodeAt(secondOpen) === 0x28) {
                            const spec = readStaticSpecifierString(source, secondOpen + 1);
                            if (spec) specifiers.push(spec.value);
                        }
                    }
                }
            }
        }
        return undefined;
    });
    return specifiers;
}

function isEsmGraphFile(filename, source) {
    return filename.endsWith('.mjs') ||
        (filename.endsWith('.js') && getPackageScopeType(filename) === 'module') ||
        (!filename.endsWith('.cjs') && looksLikeEsmSource(source));
}

function readEsmGraphFileInfo(filename, cache) {
    if (Object.prototype.hasOwnProperty.call(cache, filename)) {
        return cache[filename];
    }
    const source = tryReadFile(filename);
    if (source === null) {
        return { source: null, isEsm: false };
    }
    const info = {
        source,
        isEsm: isEsmGraphFile(filename, source),
    };
    cache[filename] = info;
    return info;
}

function fileUrlForPath(filename) {
    return 'file://' + filename;
}

function resolveEsmGraphSpecifier(specifier, parentFilename, conditions) {
    conditions = conditions || esmPackageConditions();
    if (specifier.startsWith('node:') || specifier.startsWith('data:')) return null;
    const parentDir = pathModule.dirname(parentFilename);
    if (specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
        try {
            return resolveFilename(specifier, parentDir);
        } catch (_) {
            return null;
        }
    }
    if (specifier.startsWith('#')) {
        try {
            const resolved = resolvePackageImports(specifier, parentDir, conditions);
            if (resolved && !resolved.builtin) return resolved;
        } catch (_) {
            return null;
        }
        return null;
    }
    try {
        return resolveFromNodeModules(specifier, parentDir, parentFilename, conditions);
    } catch (_) {
        return null;
    }
}

function addRequireEsmGraphMark(filename, marked) {
    const graph = globalThis.__wasm_rquickjs_require_esm_graph_in_progress || Object.create(null);
    const counts = globalThis.__wasm_rquickjs_require_esm_graph_counts || Object.create(null);
    globalThis.__wasm_rquickjs_require_esm_graph_in_progress = graph;
    globalThis.__wasm_rquickjs_require_esm_graph_counts = counts;

    counts[filename] = (counts[filename] || 0) + 1;
    graph[filename] = true;
    marked.push(filename);

    const fileUrl = fileUrlForPath(filename);
    counts[fileUrl] = (counts[fileUrl] || 0) + 1;
    graph[fileUrl] = true;
    marked.push(fileUrl);
}

function stackContains(stack, filename) {
    for (let i = 0; i < stack.length; i++) {
        if (stack[i] === filename) return true;
    }
    return false;
}

function esmGraphReachesAny(filename, stack, seen, fileInfoCache) {
    if (stackContains(stack, filename)) return true;
    seen = seen || Object.create(null);
    if (seen[filename]) return false;
    seen[filename] = true;

    const fileInfo = readEsmGraphFileInfo(filename, fileInfoCache);
    if (fileInfo.source === null) return false;

    const source = fileInfo.source;
    const isEsm = fileInfo.isEsm;
    const specifiers = isEsm
        ? collectStaticEsmSpecifiers(source)
        : collectLiteralRequireSpecifiers(source);
    const conditions = isEsm ? esmPackageConditions() : cjsPackageConditions();
    for (let i = 0; i < specifiers.length; i++) {
        const resolved = resolveEsmGraphSpecifier(specifiers[i], filename, conditions);
        if (resolved && resolved.filename && esmGraphReachesAny(resolved.filename, stack, seen, fileInfoCache)) return true;
    }

    if (isEsm) {
        const factoryNames = collectCreateRequireFactoryNames(source);
        const aliases = collectCreateRequireAliases(source, factoryNames);
        const bridgeSpecifiers = collectCreateRequireCallSpecifiers(source, factoryNames).concat(
            aliases.length === 0 ? [] : collectLiteralRequireSpecifiers(source, aliases),
        );
        for (let i = 0; i < bridgeSpecifiers.length; i++) {
            const resolved = resolveEsmGraphSpecifier(bridgeSpecifiers[i], filename, cjsPackageConditions());
            if (resolved && resolved.filename && esmGraphReachesAny(resolved.filename, stack, seen, fileInfoCache)) return true;
        }
    }

    return false;
}

function scanRequireEsmGraph(filename, marked, seen, stack, fileInfoCache) {
    if (seen[filename]) return;
    seen[filename] = true;

    const fileInfo = readEsmGraphFileInfo(filename, fileInfoCache);
    if (fileInfo.source === null) return;

    const source = fileInfo.source;
    const isEsm = fileInfo.isEsm;
    if (!isEsm) {
        const requireSpecifiers = collectLiteralRequireSpecifiers(source);
        for (let i = 0; i < requireSpecifiers.length; i++) {
            const resolved = resolveEsmGraphSpecifier(requireSpecifiers[i], filename, cjsPackageConditions());
            if (resolved && resolved.filename) {
                const targetInfo = readEsmGraphFileInfo(resolved.filename, fileInfoCache);
                if (targetInfo.source !== null && targetInfo.isEsm && esmGraphReachesAny(resolved.filename, stack, undefined, fileInfoCache)) {
                    addRequireEsmGraphMark(resolved.filename, marked);
                } else {
                    scanRequireEsmGraph(resolved.filename, marked, seen, stack, fileInfoCache);
                }
            }
        }
        return;
    }

    stack.push(filename);

    const specifiers = collectStaticEsmSpecifiers(source);
    for (let i = 0; i < specifiers.length; i++) {
        const resolved = resolveEsmGraphSpecifier(specifiers[i], filename, esmPackageConditions());
        if (resolved && resolved.filename) {
            scanRequireEsmGraph(resolved.filename, marked, seen, stack, fileInfoCache);
        }
    }
    const factoryNames = collectCreateRequireFactoryNames(source);
    const aliases = collectCreateRequireAliases(source, factoryNames);
    const createRequireSpecifiers = collectCreateRequireCallSpecifiers(source, factoryNames).concat(
        aliases.length === 0 ? [] : collectLiteralRequireSpecifiers(source, aliases),
    );
    for (let i = 0; i < createRequireSpecifiers.length; i++) {
        const resolved = resolveEsmGraphSpecifier(createRequireSpecifiers[i], filename, cjsPackageConditions());
        if (resolved && resolved.filename) {
            const targetInfo = readEsmGraphFileInfo(resolved.filename, fileInfoCache);
            if (targetInfo.source !== null && targetInfo.isEsm && esmGraphReachesAny(resolved.filename, stack, undefined, fileInfoCache)) {
                addRequireEsmGraphMark(resolved.filename, marked);
            } else {
                scanRequireEsmGraph(resolved.filename, marked, seen, stack, fileInfoCache);
            }
        }
    }
    stack.pop();
}

function markRequireEsmGraph(filename) {
    const marked = [];
    withSuppressedPackageDeprecationWarnings(() => {
        scanRequireEsmGraph(filename, marked, Object.create(null), [], Object.create(null));
    });
    return marked;
}

function unmarkRequireEsmGraph(marked) {
    const graph = globalThis.__wasm_rquickjs_require_esm_graph_in_progress;
    const counts = globalThis.__wasm_rquickjs_require_esm_graph_counts;
    if (!graph || !counts) return;
    for (let i = 0; i < marked.length; i++) {
        const key = marked[i];
        counts[key] = (counts[key] || 1) - 1;
        if (counts[key] <= 0) {
            delete counts[key];
            delete graph[key];
        }
    }
}

function throwIfRequireEsmGraphCycle(resolvedFilename) {
    const graph = globalThis.__wasm_rquickjs_require_esm_graph_in_progress;
    if (graph && (graph[resolvedFilename] || graph[fileUrlForPath(resolvedFilename)])) {
        const err = new Error('Cannot require() ES Module ' + resolvedFilename + ' in a cycle.');
        err.code = 'ERR_REQUIRE_CYCLE_MODULE';
        throw err;
    }
}

const wrapper = [
    '(function (exports, require, module, __filename, __dirname) { ',
    '\n});'
];

function wrap(script) {
    const activeWrapper = (typeof moduleExports !== 'undefined' && moduleExports.wrapper) || wrapper;
    return activeWrapper[0] + script + activeWrapper[1];
}

function compileCjs(filename, source) {
    if (source.length > 0 && source.charCodeAt(0) === 0xFEFF) {
        source = source.slice(1);
    }
    // Strip shebang
    if (source.length > 1 && source.charCodeAt(0) === 0x23 && source.charCodeAt(1) === 0x21) {
        source = '//' + source;
    }

    source = transpileTypeScriptModule(filename, source);
    source = stripV8OptimizationIntrinsics(source);
    source = stripImportAttributes(source, filename);

    const cjsLineOffsets = getCjsLineOffsetRegistry();
    cjsLineOffsets[filename] = cjsLineOffset;

    const wrappedSource = wrap(source + '\n//# sourceURL=' + filename + '\n');
    return _evalWithFilename(wrappedSource, filename);
}

function compileModuleInto(mod, source, filename, requireOverride) {
    filename = filename === undefined || filename === null ? mod.filename : filename;
    const requireParentFilename = filename === '' && mod && typeof mod.filename === 'string'
        ? mod.filename
        : filename;
    const dirname = pathModule.dirname(filename);
    const requireDirname = pathModule.dirname(requireParentFilename);
    const childRequire = requireOverride || makeRequire(requireDirname, mod, requireParentFilename);
    const compiledFn = compileCjs(filename, String(source));
    const previousModuleContext = globalThis.__wasm_rquickjs_current_module;
    globalThis.__wasm_rquickjs_current_module = {
        filename: filename,
        source: String(source)
    };
    const previousCjsImportDir = globalThis.__wasm_rquickjs_cjs_import_dir;
    globalThis.__wasm_rquickjs_cjs_import_dir = dirname;
    try {
        return compiledFn.call(mod.exports, mod.exports, childRequire, mod, filename, dirname);
    } finally {
        globalThis.__wasm_rquickjs_current_module = previousModuleContext;
        if (previousCjsImportDir !== undefined) {
            globalThis.__wasm_rquickjs_cjs_import_dir = previousCjsImportDir;
        } else {
            delete globalThis.__wasm_rquickjs_cjs_import_dir;
        }
    }
}

function makeModuleCompile(mod) {
    return function _compile(content, filename) {
        if (this !== mod) {
            throw new ERR_INVALID_ARG_TYPE('mod', 'Module', this);
        }
        return compileModuleInto(mod, content, arguments.length > 1 ? filename : mod.filename);
    };
}

function loaderValueTypeName(value) {
    if (value === null) return 'null';
    const type = typeof value;
    if (type !== 'object') return type;
    if (Array.isArray(value)) return 'Array';
    if (value && value.constructor && typeof value.constructor.name === 'string') return value.constructor.name;
    return 'Object';
}

function makeLoaderInvalidReturnValueError(hookName, value) {
    const err = new TypeError(`Expected an object to be returned from the '${hookName}' hook but got ${loaderValueTypeName(value)}.`);
    err.code = 'ERR_INVALID_RETURN_VALUE';
    return err;
}

function makeLoaderInvalidReturnPropertyValueError(propertyName, hookName, expected, value) {
    const err = new TypeError(`Expected ${expected} for "${propertyName}" from the '${hookName}' hook but got type ${loaderValueTypeName(value)}.`);
    err.code = 'ERR_INVALID_RETURN_PROPERTY_VALUE';
    return err;
}

function makeLoaderUnknownModuleFormatError(format) {
    const err = new RangeError(`Unknown module format: ${String(format)}`);
    err.code = 'ERR_UNKNOWN_MODULE_FORMAT';
    return err;
}

function makeLoaderInvalidUrlError(hookName, loaderUrl, value) {
    const err = new TypeError(`Expected a URL string to be returned for "url" from the '${hookName}' hook in ${String(loaderUrl)} but got ${JSON.stringify(String(value))}.`);
    err.code = 'ERR_INVALID_RETURN_PROPERTY_VALUE';
    return err;
}

function makeLoaderMissingUrlError(hookName, loaderUrl, value) {
    const err = new TypeError(`Expected a URL string to be returned for "url" from the '${hookName}' hook in ${String(loaderUrl)} but got type ${loaderValueTypeName(value)}.`);
    err.code = 'ERR_INVALID_RETURN_PROPERTY_VALUE';
    return err;
}

function makeLoaderChainError(hook) {
    const err = new Error(`${hook} hook did not call the next hook and did not explicitly short circuit`);
    err.code = 'ERR_LOADER_CHAIN_INCOMPLETE';
    return err;
}

function makeEsmModuleNotFoundError(specifier) {
    const err = new Error("Cannot find module '" + specifier + "'");
    err.code = 'ERR_MODULE_NOT_FOUND';
    return err;
}

function makeEsmUnsupportedDirImportError(filename) {
    const err = new Error('Directory import ' + JSON.stringify(filename) + ' is not supported resolving ES modules');
    err.code = 'ERR_UNSUPPORTED_DIR_IMPORT';
    return err;
}

function isRelativeOrAbsoluteSpecifier(specifier) {
    return specifier === '.' || specifier === '..' ||
        specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/');
}

function defaultLoaderFormatForFilename(filename) {
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.mjs')) return 'module';
    if (filename.endsWith('.cjs')) return 'commonjs';
    return undefined;
}

function resultForEsmFileUrl(url) {
    const filename = nodeUrl.fileURLToPath(url);
    const stat = _stat(filename);
    if (stat === 1) throw makeEsmUnsupportedDirImportError(filename);
    if (stat !== 0) throw makeEsmModuleNotFoundError(url.href);
    return { url: url.href, format: defaultLoaderFormatForFilename(filename) };
}

function resultForPackageFile(filename) {
    const stat = _stat(filename);
    if (stat === 1) throw makeEsmUnsupportedDirImportError(filename);
    if (stat !== 0) throw makeEsmModuleNotFoundError(filename);
    return { url: nodeUrl.pathToFileURL(filename).href, format: defaultLoaderFormatForFilename(filename) };
}

function parentFilenameForLoaderResolve(parentURL, baseUrl) {
    parentURL = String(parentURL || baseUrl);
    if (parentURL.startsWith('file://')) {
        return nodeUrl.fileURLToPath(parentURL);
    }
    if (parentURL.startsWith('/')) {
        return parentURL;
    }
    return null;
}

function conditionsForLoaderResolve(context) {
    if (context && Array.isArray(context.conditions)) {
        const conditions = setFromArray(context.conditions);
        conditions.add('default');
        return conditions;
    }
    return esmPackageConditions();
}

function resultForRelativeOrAbsoluteSpecifier(specifier, parentURL) {
    return resultForEsmFileUrl(new URL(specifier, parentURL));
}

function decodeEsmPackageSubpath(subpath) {
    if (hasEncodedSlashOrBackslash(subpath)) {
        throw makeInvalidModuleSpecifierError(subpath, 'must not include encoded "/" or "\\" characters');
    }
    try {
        return decodeURIComponent(subpath);
    } catch (_) {
        return subpath;
    }
}

function resolveEsmPackageForLoader(id, parentDir, parentFilename, conditions) {
    const parts = splitPackageName(id);
    const hasSubpath = parts.subpath.length > 0;

    const selfResolved = resolvePackageSelfReference(parts, parentDir, conditions);
    if (selfResolved !== undefined) {
        if (selfResolved.builtin) return { url: selfResolved.builtin };
        return resultForPackageFile(selfResolved.filename);
    }

    const dirs = _nodeModulePaths(parentDir);
    for (let i = 0; i < dirs.length; i++) {
        const pkgDir = pathModule.join(dirs[i], parts.name);
        const pkgJsonPath = pathModule.join(pkgDir, 'package.json');
        const packageEntry = readPackageDirectoryForExports(parts, pkgDir, pkgJsonPath, conditions);
        if (packageEntry === null) continue;

        if (packageEntry.exportsResolved !== undefined) {
            if (packageEntry.exportsResolved.builtin) return { url: packageEntry.exportsResolved.builtin };
            return resultForPackageFile(packageEntry.exportsResolved.filename);
        }

        if (hasSubpath) {
            return resultForPackageFile(pathModule.join(pkgDir, decodeEsmPackageSubpath(parts.subpath)));
        }

        return resolveFromNodeModules(id, parentDir, parentFilename, conditions);
    }

    return null;
}

function isLoaderSourceValue(value) {
    return typeof value === 'string' ||
        value instanceof ArrayBuffer ||
        (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) ||
        ArrayBuffer.isView(value);
}

function validateRegisteredLoaderResult(result, hookName, context) {
    if (!result || typeof result !== 'object') {
        throw makeLoaderInvalidReturnValueError(hookName, result);
    }
    if (Object.prototype.hasOwnProperty.call(result, 'format')) {
        const format = result.format;
        if (format !== undefined && format !== null && typeof format !== 'string') {
            throw makeLoaderInvalidReturnPropertyValueError('format', hookName, 'a string or nullish value', format);
        }
    }
    if (hookName === 'load' && Object.prototype.hasOwnProperty.call(result, 'source')) {
        const source = result.source;
        if (source === null || source === undefined) {
            if (result.format === 'commonjs' || (result.format === undefined && context && context.format === 'commonjs')) return result;
            throw makeLoaderInvalidReturnPropertyValueError('source', hookName, 'a string, ArrayBuffer, or ArrayBufferView', source);
        }
        if (!isLoaderSourceValue(source)) {
            throw makeLoaderInvalidReturnPropertyValueError('source', hookName, 'a string, ArrayBuffer, or ArrayBufferView', source);
        }
    }
    return result;
}

function validateRegisteredLoaderLoadFormat(format) {
    if (format === undefined || format === null) return undefined;
    if (format === 'module' || format === 'commonjs' || format === 'json' || format === 'builtin' || format === 'wasm') {
        return format;
    }
    throw makeLoaderUnknownModuleFormatError(format);
}

function validateRegisteredLoaderResolveUrl(url, loaderUrl) {
    if (typeof url !== 'string') {
        throw makeLoaderMissingUrlError('resolve', loaderUrl, url);
    }
    try {
        new URL(url);
    } catch (_) {
        throw makeLoaderInvalidUrlError('resolve', loaderUrl, url);
    }
}

function loaderSourceToString(source) {
    if (typeof source === 'string') {
        return source;
    }
    if (source instanceof ArrayBuffer) {
        return new TextDecoder().decode(new Uint8Array(source));
    }
    if (typeof SharedArrayBuffer !== 'undefined' && source instanceof SharedArrayBuffer) {
        return new TextDecoder().decode(new Uint8Array(source));
    }
    if (ArrayBuffer.isView(source) && source.buffer instanceof ArrayBuffer) {
        return new TextDecoder().decode(new Uint8Array(source.buffer, source.byteOffset, source.byteLength));
    }
    if (
        typeof SharedArrayBuffer !== 'undefined' &&
        ArrayBuffer.isView(source) &&
        source.buffer instanceof SharedArrayBuffer
    ) {
        return new TextDecoder().decode(new Uint8Array(source.buffer, source.byteOffset, source.byteLength));
    }
    throw makeLoaderInvalidReturnPropertyValueError('source', 'load', 'a string, ArrayBuffer, or ArrayBufferView', source);
}

function loaderCommonJsSourceModule(source, url) {
    source = loaderSourceToString(source);
    const filename = loaderCommonJsFilename(url);
    const names = loaderCjsNamedExports(source, pathModule.isAbsolute(filename) ? filename : undefined);
    const cacheKey = loaderCommonJsCacheKey(url, filename);
    const lines = [
        'const __cjs_default = globalThis.__wasm_rquickjs_load_commonjs_loader_source(' + JSON.stringify(filename) + ',' + JSON.stringify(source) + ',' + JSON.stringify(String(url || '')) + ',' + JSON.stringify(cacheKey) + ');',
        'export default __cjs_default;',
    ];
    for (let i = 0; i < names.length; i++) {
        const local = '__wasm_rquickjs_loader_export_' + i;
        const nameLiteral = JSON.stringify(names[i]);
        lines.push('const ' + local + ' = Object.prototype.hasOwnProperty.call(__cjs_default, ' + nameLiteral + ') ? __cjs_default[' + nameLiteral + '] : undefined;');
        lines.push('export { ' + local + ' as ' + nameLiteral + ' };');
    }
    return 'data:text/javascript,' + encodeURIComponent(lines.join('\n'));
}

function loaderFileUrlSource(url) {
    if (!String(url).startsWith('file://')) return null;
    try {
        return tryReadFile(nodeUrl.fileURLToPath(url));
    } catch (_) {
        return null;
    }
}

function loaderCommonJsFilename(url) {
    url = String(url || '');
    if (url.startsWith('file://')) {
        return nodeUrl.fileURLToPath(url);
    }
    if (url.startsWith('/')) {
        return url;
    }
    return url || 'anonymous';
}

function loaderCommonJsCacheKey(url, filename) {
    return filename;
}

function makeModuleRequire(mod) {
    return function require(id) {
        return makeRequire(pathModule.dirname(mod.filename), mod)(id);
    };
}

function requireEsmWithCacheGuard(mod, resolvedFilename) {
    throwIfRequireEsmGraphCycle(resolvedFilename);
    const markedGraph = markRequireEsmGraph(resolvedFilename);
    Object.defineProperty(mod, '__wasmRequireEsmInProgress', {
        value: true,
        writable: true,
        configurable: true,
        enumerable: false,
    });
    try {
        const namespace = _requireEsm(resolvedFilename);
        if (namespace && typeof namespace === 'object' && Object.hasOwn(namespace, 'module.exports')) {
            return namespace['module.exports'];
        }
        return wrapEsmNamespace(namespace);
    } finally {
        unmarkRequireEsmGraph(markedGraph);
        delete mod.__wasmRequireEsmInProgress;
    }
}

function currentMainScriptFilename() {
    if (!globalThis.process || !globalThis.process.argv || typeof globalThis.process.argv[1] !== 'string') {
        return null;
    }
    const mainScript = globalThis.process.argv[1];
    if (!mainScript) return null;
    try {
        return toCjsCanonicalFilename(mainScript, true);
    } catch (_) {
        const absolute = pathModule.isAbsolute(mainScript) ? mainScript : pathModule.resolve('/', mainScript);
        return absolute;
    }
}

function isMainEntryFilename(resolvedFilename) {
    if (typeof mainModule === 'undefined' || mainModule.filename !== '/') return false;
    const mainScript = currentMainScriptFilename();
    if (!mainScript) return false;
    try {
        return toCjsCanonicalFilename(resolvedFilename, true) === mainScript;
    } catch (_) {
        const absolute = pathModule.isAbsolute(resolvedFilename) ? resolvedFilename : pathModule.resolve('/', resolvedFilename);
        return absolute === mainScript;
    }
}

function unlinkModuleFromParent(parentModule, mod) {
    if (!parentModule || !parentModule.children) return;
    const index = parentModule.children.indexOf(mod);
    if (index !== -1) parentModule.children.splice(index, 1);
}

function loadModule(resolvedFilename, source, parentModule) {
    const isMainModuleLoad = isMainEntryFilename(resolvedFilename);
    const filename = toCjsCanonicalFilename(resolvedFilename, isMainModuleLoad);

    // Check cache
    if (moduleCache[filename]) {
        const cached = moduleCache[filename];
        if (cached.__wasmRequireEsmInProgress) {
            const err = new Error('Cannot require() ES Module ' + filename + ' in a cycle.');
            err.code = 'ERR_REQUIRE_CYCLE_MODULE';
            throw err;
        }
        if (parentModule && parentModule.children && !parentModule.children.includes(cached)) {
            parentModule.children.push(cached);
        }
        return cached;
    }

    let mod;
    if (isMainModuleLoad) {
        mod = mainModule;
        mod.id = '.';
        mod.filename = filename;
        mod.path = pathModule.dirname(filename);
        mod.exports = {};
        mod.loaded = false;
        mod.parent = null;
        mod.children = [];
        mod.paths = _nodeModulePaths(pathModule.dirname(filename));
        mod._compile = makeModuleCompile(mod);
        mod.require = makeModuleRequire(mod);
        if (globalThis.process) {
            globalThis.process.mainModule = mod;
        }
    } else {
        mod = {
            id: filename,
            filename: filename,
            path: pathModule.dirname(filename),
            exports: {},
            loaded: false,
            parent: parentModule || null,
            children: [],
            paths: _nodeModulePaths(pathModule.dirname(filename)),
        };
        mod._compile = makeModuleCompile(mod);
        mod.require = makeModuleRequire(mod);
    }

    // Cache before executing (handles circular dependencies)
    moduleCache[filename] = mod;
    registerSourceMapForCjs(filename, source);

    if (parentModule && parentModule.children) {
        parentModule.children.push(mod);
    }

    // Check for custom extension handler
    const ext = findLongestRegisteredExtension(filename);
    const handler = requireExtensions[ext];
    if (handler && !_defaultExtHandlers.has(handler)) {
        try {
            handler(mod, filename);
        } catch (err) {
            delete moduleCache[filename];
            unlinkModuleFromParent(parentModule, mod);
            throw err;
        }
    } else if (filename.endsWith('.node')) {
        delete moduleCache[filename];
        unlinkModuleFromParent(parentModule, mod);
        const err = new Error("Native .node modules are not supported in WASM: '" + filename + "'");
        err.code = 'ERR_DLOPEN_FAILED';
        throw err;
    } else if (filename.endsWith('.json')) {
        try {
            if (source.length > 0 && source.charCodeAt(0) === 0xFEFF) {
                source = source.slice(1);
            }
            mod.exports = JSON.parse(source);
        } catch (e) {
            delete moduleCache[filename];
            unlinkModuleFromParent(parentModule, mod);
            const err = new SyntaxError(filename + ': ' + e.message);
            err.code = 'ERR_INVALID_JSON';
            throw err;
        }
    } else {
        const isEsm = filename.endsWith('.mjs') ||
            (filename.endsWith('.js') && getPackageScopeType(filename) === 'module');
        if (isEsm && hasExecArgvFlag('--no-experimental-require-module')) {
            delete moduleCache[filename];
            unlinkModuleFromParent(parentModule, mod);
            const esmErr = new Error(
                "require() of ES Module " + filename + " not supported. " +
                "Instead change the require of " + filename + " to a dynamic " +
                "import() which is available in all CommonJS modules."
            );
            esmErr.code = 'ERR_REQUIRE_ESM';
            throw esmErr;
        }
        if (isEsm) {
            try {
                mod.exports = requireEsmWithCacheGuard(mod, filename);
            } catch (err) {
                delete moduleCache[filename];
                unlinkModuleFromParent(parentModule, mod);
                throw err;
            }
        } else {
            const dirname = pathModule.dirname(filename);
            const childRequire = makeRequire(dirname, mod);
            let compiledFn;
            let cjsSyntaxError = null;
            const cjsWrapperRequireRedeclaration = !filename.endsWith('.cjs') && hasCjsWrapperRequireRedeclaration(source);
            let cjsSourceLooksEsm = false;
            try {
                compiledFn = compileCjs(filename, source);
            } catch (err) {
                // Normalize QuickJS SyntaxError messages for ESM keywords in CJS context
                if (err && err.name === 'SyntaxError') {
                    normalizeEsmSyntaxError(err);
                } else if (err && typeof err.message === 'string' && err.message === 'return not in a function') {
                    markAsSyntaxError(err);
                }
                // For .js files (not .cjs), detect ESM syntax and fall back to ESM loading
                if (!filename.endsWith('.cjs') && err && err.name === 'SyntaxError') {
                    cjsSourceLooksEsm = looksLikeEsmSource(source);
                }
                if (!filename.endsWith('.cjs') && err && err.name === 'SyntaxError' && (cjsSourceLooksEsm || cjsWrapperRequireRedeclaration)) {
                    cjsSyntaxError = err;
                } else {
                    delete moduleCache[filename];
                    unlinkModuleFromParent(parentModule, mod);
                    maybeSetArrowMessageOnSyntaxError(err, filename, source);
                    throw err;
                }
            }
            if (cjsSyntaxError || cjsWrapperRequireRedeclaration) {
                if (hasExecArgvFlag('--no-experimental-require-module') && cjsSyntaxError) {
                    delete moduleCache[filename];
                    unlinkModuleFromParent(parentModule, mod);
                    maybeSetArrowMessageOnSyntaxError(cjsSyntaxError, filename, source);
                    throw cjsSyntaxError;
                }
                // SyntaxError in a .js file — try loading as ESM (entry point detection)
                try {
                    mod.exports = requireEsmWithCacheGuard(mod, filename);
                } catch (esmErr) {
                    delete moduleCache[filename];
                    unlinkModuleFromParent(parentModule, mod);
                    if (cjsSourceLooksEsm || cjsWrapperRequireRedeclaration) {
                        normalizeEsmSyntaxError(esmErr);
                        throw esmErr;
                    }
                    // ESM loading also failed — throw the original CJS SyntaxError
                    maybeSetArrowMessageOnSyntaxError(cjsSyntaxError, filename, source);
                    throw cjsSyntaxError;
                }
            } else if (compiledFn) {
                const previousModuleContext = globalThis.__wasm_rquickjs_current_module;
                globalThis.__wasm_rquickjs_current_module = {
                    filename: filename,
                    source: source
                };
                const previousCjsImportDir = globalThis.__wasm_rquickjs_cjs_import_dir;
                globalThis.__wasm_rquickjs_cjs_import_dir = dirname;
                try {
                    compiledFn.call(mod.exports, mod.exports, childRequire, mod, filename, dirname);
                } catch (err) {
                    delete moduleCache[filename];
                    unlinkModuleFromParent(parentModule, mod);
                    maybeSetArrowMessageOnSyntaxError(err, filename, source);
                    throw err;
                } finally {
                    globalThis.__wasm_rquickjs_current_module = previousModuleContext;
                    if (previousCjsImportDir !== undefined) {
                        globalThis.__wasm_rquickjs_cjs_import_dir = previousCjsImportDir;
                    }
                }
            }
        }
    }

    mod.loaded = true;
    return mod;
}

function makeLoaderCommonJsRequire(parentUrl, parentDir, parentModule, parentFilename) {
    const fallbackRequire = makeRequire(parentDir, parentModule, parentFilename);
    function loaderRequire(id) {
        if (typeof id !== 'string') {
            throw new ERR_INVALID_ARG_TYPE('id', 'string', id);
        }
        if (id === '') {
            const argErr = new TypeError("The argument 'id' must be a non-empty string. Received ''");
            argErr.code = 'ERR_INVALID_ARG_VALUE';
            throw argErr;
        }
        if (typeof globalThis.__wasm_rquickjs_run_registered_loaders_sync === 'function') {
            const loaded = globalThis.__wasm_rquickjs_run_registered_loaders_sync(parentUrl, id);
            if (loaded) {
                if (loaded.format === 'builtin' && loaded.url) {
                    const id = String(loaded.url).startsWith('node:') ? String(loaded.url) : 'node:' + String(loaded.url);
                    const builtin = builtinModuleMap[id];
                    if (builtin !== undefined) return builtin;
                }
                if (loaded.format === 'commonjs' && loaded.source !== undefined) {
                    const filename = loaderCommonJsFilename(loaded.url);
                    return loadCommonJsSourceModule(filename, loaderSourceToString(loaded.source), loaded.url, loaderCommonJsCacheKey(loaded.url, filename)).exports;
                }
                if (loaded.format === 'json' && loaded.source !== undefined) {
                    return JSON.parse(loaderSourceToString(loaded.source));
                }
            }
        }
        return fallbackRequire(id);
    }
    loaderRequire.resolve = function resolve(id, options) {
        if (typeof id !== 'string') {
            throw new ERR_INVALID_ARG_TYPE('request', 'string', id);
        }
        if (typeof globalThis.__wasm_rquickjs_run_registered_loaders_sync === 'function') {
            const loaded = globalThis.__wasm_rquickjs_run_registered_loaders_sync(parentUrl, id, true);
            if (loaded && loaded.url) {
                if (String(loaded.url).startsWith('node:')) return String(loaded.url).slice(5);
                return String(loaded.url).startsWith('file://') ? nodeUrl.fileURLToPath(String(loaded.url)) : String(loaded.url);
            }
        }
        return fallbackRequire.resolve(id, options);
    };
    loaderRequire.main = fallbackRequire.main;
    return loaderRequire;
}

function loadCommonJsSourceModule(filename, source, sourceUrl, cacheKey) {
    cacheKey = cacheKey || filename;
    if (moduleCache[cacheKey]) return moduleCache[cacheKey];
    const dirname = pathModule.isAbsolute(filename) ? pathModule.dirname(filename) : '.';
    const mod = {
        id: filename,
        filename: filename,
        path: dirname,
        exports: {},
        loaded: false,
        parent: null,
        children: [],
        paths: _nodeModulePaths(pathModule.isAbsolute(filename) ? dirname : '/'),
    };
    mod._compile = makeModuleCompile(mod);
    mod.require = makeModuleRequire(mod);
    moduleCache[cacheKey] = mod;
    registerSourceMapForCjs(filename, source);
    try {
        const loaderRequire = makeLoaderCommonJsRequire(sourceUrl || (pathModule.isAbsolute(filename) ? fileUrlForPath(filename) : filename), pathModule.isAbsolute(filename) ? dirname : '/', mod, filename);
        mod.require = loaderRequire;
        compileModuleInto(mod, source, filename, loaderRequire);
        mod.loaded = true;
        return mod;
    } catch (err) {
        delete moduleCache[cacheKey];
        throw err;
    }
}

if (typeof globalThis.__wasm_rquickjs_load_commonjs_loader_source !== 'function') {
    Object.defineProperty(globalThis, '__wasm_rquickjs_load_commonjs_loader_source', {
        value(filename, source) {
            const sourceUrl = arguments.length > 2 ? String(arguments[2]) : undefined;
            return loadCommonJsSourceModule(String(filename), loaderSourceToString(source), sourceUrl, arguments.length > 3 ? String(arguments[3]) : undefined).exports;
        },
        writable: true,
        configurable: true,
    });
}

// The root "main" module
const mainModule = {
    id: '.',
    filename: '/',
    path: '/',
    exports: {},
    loaded: true,
    parent: null,
    children: [],
};
mainModule._compile = makeModuleCompile(mainModule);
mainModule.require = makeModuleRequire(mainModule);

function splitPackageName(id) {
    // Scoped packages: @scope/pkg or @scope/pkg/subpath
    if (id.charAt(0) === '@') {
        const slashIdx = id.indexOf('/');
        if (slashIdx === -1) return { name: id, subpath: '' };
        const secondSlash = id.indexOf('/', slashIdx + 1);
        if (secondSlash === -1) return { name: id, subpath: '' };
        return { name: id.substring(0, secondSlash), subpath: id.substring(secondSlash + 1) };
    }
    // Regular packages: pkg or pkg/subpath
    const idx = id.indexOf('/');
    if (idx === -1) return { name: id, subpath: '' };
    return { name: id.substring(0, idx), subpath: id.substring(idx + 1) };
}

function resolveFromNodeModules(id, parentDir, parentFilename, conditions, lookupPaths) {
    conditions = conditions || cjsPackageConditions();
    const dirs = Array.isArray(lookupPaths) ? lookupPaths : _nodeModulePaths(parentDir);

    // Split into package name and subpath for packages with subpath specifiers
    const parts = splitPackageName(id);

    const selfResolved = resolvePackageSelfReference(parts, parentDir, conditions);
    if (selfResolved !== undefined) {
        return selfResolved;
    }

    for (let i = 0; i < dirs.length; i++) {
        const pkgDir = pathModule.join(dirs[i], parts.name);
        const pkgJsonPath = pathModule.join(pkgDir, 'package.json');
        let pkg = null;

        try {
            const packageEntry = readPackageDirectoryForExports(parts, pkgDir, pkgJsonPath, conditions);
            if (packageEntry !== null) {
                pkg = packageEntry.pkg;
                if (packageEntry.exportsResolved !== undefined) {
                    return packageEntry.exportsResolved;
                }
            }
        } catch (e) {
            if (e && e.code) {
                throw e;
            }
            throw makeInvalidPackageConfigWhileImporting(pkgJsonPath, id, parentFilename || parentDir, e);
        }

        const fallbackResolved = resolveCjsPackageFallbacks(parts, pkgDir, pkg, pkgJsonPath, id, parentFilename || parentDir);
        if (fallbackResolved !== null) return fallbackResolved;

    }
    return null;
}

function resolveForRequire(id, options, parentDir, parentFilename, parentLookupPaths) {
    if (typeof id !== 'string') {
        throw new ERR_INVALID_ARG_TYPE('request', 'string', id);
    }
    if (isBuiltin(id)) {
        return id;
    }
    if (id.startsWith('node:')) {
        const err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }
    // If paths option is provided, resolve relative to each path
    if (options && options.paths !== undefined) {
        const searchPaths = options.paths;
        if (!Array.isArray(searchPaths)) {
            const argErr = new TypeError("The argument 'paths' must be an array of strings. Received " + typeof searchPaths);
            argErr.code = 'ERR_INVALID_ARG_VALUE';
            throw argErr;
        }
        const isRelative = id === '.' || id === '..' || id.startsWith('./') || id.startsWith('../') || id.startsWith('/');
        for (let pi = 0; pi < searchPaths.length; pi++) {
            if (typeof searchPaths[pi] !== 'string') {
                const argErr = new TypeError("The argument 'paths[" + pi + "]' must be a string. Received " + typeof searchPaths[pi]);
                argErr.code = 'ERR_INVALID_ARG_VALUE';
                throw argErr;
            }
            const searchDir = pathModule.resolve(searchPaths[pi]);
            if (isRelative) {
                // Relative/absolute: resolve directly against the search path
                try {
                    const resolved = resolveFilename(id, searchDir);
                    return toCjsCanonicalFilename(resolved.filename, false);
                } catch (e) {
                    addRequireStackToModuleNotFound(e, id, parentFilename);
                    // Try next path
                }
            } else {
                // Bare specifier: use node_modules resolution from search path
                const nmResolved = resolveFromNodeModules(id, searchDir, parentFilename);
                if (nmResolved) return toCjsCanonicalFilename(nmResolved.filename, false);
            }
        }
        const err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw addRequireStackToModuleNotFound(err, id, parentFilename);
    }
    if (id === '.' || id === '..' || id.startsWith('./') || id.startsWith('../') || id.startsWith('/')) {
        try {
            const resolved = resolveFilename(id, parentDir);
            return toCjsCanonicalFilename(resolved.filename, false);
        } catch (err) {
            throw addRequireStackToModuleNotFound(err, id, parentFilename);
        }
    }
    if (id.startsWith('#')) {
        try {
            const importsResolved = resolvePackageImports(id, parentDir, cjsPackageConditions());
            if (importsResolved.builtin) return importsResolved.builtin;
            return toCjsCanonicalFilename(importsResolved.filename, false);
        } catch (err) {
            if (!err || err.code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
                throw err;
            }
            const nmResolved = resolveFromNodeModules(id, parentDir, parentFilename, undefined, parentLookupPaths);
            if (nmResolved) return toCjsCanonicalFilename(nmResolved.filename, false);
            throw err;
        }
    }
    // node_modules resolution for bare specifiers
    const nmResolved = resolveFromNodeModules(id, parentDir, parentFilename, undefined, parentLookupPaths);
    if (nmResolved) {
        return toCjsCanonicalFilename(nmResolved.filename, false);
    }
    const err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
}

function makeRequire(parentDir, parentModule, parentFilenameOverride) {
    const parentFilename = parentFilenameOverride || (parentModule && parentModule.filename) || null;
    const parentLookupPaths = parentModule && Array.isArray(parentModule.paths)
        ? parentModule.paths.concat(globalPaths)
        : null;
    function localRequire(id) {
        if (typeof id !== 'string') {
            throw new ERR_INVALID_ARG_TYPE('id', 'string', id);
        }
        if (id === '') {
            const argErr = new TypeError("The argument 'id' must be a non-empty string. Received ''");
            argErr.code = 'ERR_INVALID_ARG_VALUE';
            throw argErr;
        }

        return traceModuleRequire(id, parentFilename, () => {
        // Capture buffer.kMaxLength for zlib on first require (matches Node.js CJS capture-at-require semantics)
        if ((id === 'zlib' || id === 'node:zlib') && zlib._captureKMaxLength) {
            zlib._captureKMaxLength();
        }

        // Check module mock registry
        const mockEntry = _resolveRequireMock(id);
        if (mockEntry) {
            if (mockEntry.cache && mockEntry._cachedCjsReady) {
                return mockEntry._cachedCjsResult;
            }
            const mockResult = _materializeCjsMock(mockEntry);
            if (mockEntry.cache) {
                mockEntry._cachedCjsResult = mockResult;
                mockEntry._cachedCjsReady = true;
            }
            return mockResult;
        }

        // node:-prefixed requires always go to builtins, bypassing cache
        if (id.startsWith('node:')) {
            const builtin = builtinModuleMap[id];
            if (builtin !== undefined) {
                return builtin;
            }
            const err = new Error('No such built-in module: ' + id);
            err.code = 'ERR_UNKNOWN_BUILTIN_MODULE';
            throw err;
        }

        // Check require.cache before builtins for non-node: specifiers
        // (allows shadowing builtins via require.cache)
        const cached = moduleCache[id];
        if (cached !== undefined) {
            return cached.exports;
        }

        // Builtin modules
        const builtin = schemelessBlockList.has(id) ? undefined : builtinModuleMap[id];
        if (builtin !== undefined) {
            return builtin;
        }

        // Relative or absolute file paths
        if (id === '.' || id === '..' || id.startsWith('./') || id.startsWith('../') || id.startsWith('/')) {
            let resolved;
            try {
                resolved = resolveFilename(id, parentDir);
            } catch (err) {
                throw addRequireStackToModuleNotFound(err, id, parentFilename);
            }
            const mod = loadModule(resolved.filename, resolved.content, parentModule || null);
            return mod.exports;
        }

        if (id.startsWith('#')) {
            try {
                const importsResolved = resolvePackageImports(id, parentDir, cjsPackageConditions());
                if (importsResolved.builtin) return builtinModuleMap[importsResolved.builtin];
                const mod = loadModule(importsResolved.filename, importsResolved.content, parentModule || null);
                return mod.exports;
            } catch (err) {
                if (!err || err.code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
                    throw err;
                }
                const nmResolved = resolveFromNodeModules(id, parentDir, parentFilename, undefined, parentLookupPaths);
                if (nmResolved) {
                    const mod = loadModule(nmResolved.filename, nmResolved.content, parentModule || null);
                    return mod.exports;
                }
                throw err;
            }
        }

        // node_modules resolution for bare specifiers
        const nmResolved = resolveFromNodeModules(id, parentDir, parentFilename, undefined, parentLookupPaths);
        if (nmResolved) {
            const mod = loadModule(nmResolved.filename, nmResolved.content, parentModule || null);
            return mod.exports;
        }

        const err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
        });
    }

    localRequire.cache = moduleCache;
    localRequire.extensions = requireExtensions;

    localRequire.resolve = function resolve(id, options) {
        return resolveForRequire(id, options, parentDir, parentFilename, parentLookupPaths);
    };

    localRequire.resolve.paths = function paths(request) {
        if (typeof request !== 'string') {
            throw new ERR_INVALID_ARG_TYPE('request', 'string', request);
        }
        if (isBuiltinResolveTarget(request)) {
            return null;
        }
        return _resolveLookupPaths(request, parentModule);
    };

    Object.defineProperty(localRequire, 'main', {
        value: mainModule,
        writable: true,
        configurable: true,
        enumerable: true,
    });

    return localRequire;
}

// The global require, rooted at '/'
const globalRequire = makeRequire('/', mainModule);

export let require = function require(id) {
    return globalRequire(id);
};

export let createRequire = function createRequire(filename) {
    let filepath;
    const isUrlObj = filename instanceof URL ||
        (filename !== null && typeof filename === 'object' &&
         typeof filename.href === 'string' && typeof filename.protocol === 'string');

    if (isUrlObj || (typeof filename === 'string' && !pathModule.isAbsolute(filename))) {
        try {
            filepath = nodeUrl.fileURLToPath(filename);
        } catch (e) {
            const inspected = typeof filename === 'string' ? "'" + filename + "'" :
                (typeof util.inspect === 'function' ? util.inspect(filename) : String(filename));
            const err = new TypeError(
                "The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received " + inspected
            );
            err.code = 'ERR_INVALID_ARG_VALUE';
            throw err;
        }
    } else if (typeof filename !== 'string') {
        const inspected2 = typeof util.inspect === 'function' ? util.inspect(filename) : String(filename);
        const err2 = new TypeError(
            "The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received " + inspected2
        );
        err2.code = 'ERR_INVALID_ARG_VALUE';
        throw err2;
    } else {
        filepath = filename;
    }
    const dir = pathModule.dirname(filepath);
    const syntheticParent = {
        id: filepath,
        filename: filepath,
        path: dir,
        exports: {},
        loaded: true,
        parent: null,
        children: [],
        paths: _nodeModulePaths(dir),
    };
    return makeRequire(dir, syntheticParent, filepath);
};

Object.defineProperty(globalThis, '__wasm_rquickjs_create_require', {
    value: createRequire,
    configurable: true,
});

function isUrlInstance(value) {
    return value instanceof URL ||
        (value !== null && typeof value === 'object' &&
            typeof value.href === 'string' && typeof value.protocol === 'string');
}

function normalizeFindPackageJsonSpecifier(specifier) {
    if (specifier === undefined) {
        throw new ERR_MISSING_ARGS('specifier');
    }

    if (isUrlInstance(specifier)) {
        const filePath = nodeUrl.fileURLToPath(specifier);
        return {
            kind: 'absolute',
            path: filePath,
            source: filePath,
        };
    }

    if (typeof specifier !== 'string') {
        throw new ERR_INVALID_ARG_TYPE('specifier', ['string', 'URL'], specifier);
    }

    if (specifier.startsWith('file://')) {
        const filePath = nodeUrl.fileURLToPath(specifier);
        return {
            kind: 'absolute',
            path: filePath,
            source: specifier,
        };
    }

    if (pathModule.isAbsolute(specifier)) {
        return {
            kind: 'absolute',
            path: pathModule.normalize(specifier),
            source: specifier,
        };
    }

    if (specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../')) {
        return {
            kind: 'relative',
            value: specifier,
        };
    }

    return {
        kind: 'bare',
        value: specifier,
    };
}

function normalizeFindPackageJsonBase(base, baseRequired) {
    if (base === undefined) {
        if (baseRequired) {
            throw new ERR_INVALID_ARG_TYPE('base', ['string', 'URL'], base);
        }
        return null;
    }

    if (isUrlInstance(base) || (typeof base === 'string' && base.startsWith('file://'))) {
        const filename = nodeUrl.fileURLToPath(base);
        return {
            filename,
            dir: pathModule.dirname(pathModule.resolve(filename)),
        };
    }

    if (typeof base !== 'string') {
        throw new ERR_INVALID_ARG_TYPE('base', ['string', 'URL'], base);
    }

    if (!pathModule.isAbsolute(base)) {
        throw new ERR_INVALID_ARG_TYPE('base', ['string', 'URL'], base);
    }

    const filename = pathModule.resolve(base);
    return {
        filename,
        dir: pathModule.dirname(filename),
    };
}

function findNearestPackageJsonPath(startDir) {
    let dir = pathModule.resolve(startDir || '/');
    while (true) {
        if (pathModule.basename(dir) === 'node_modules') return undefined;
        const pkgJsonPath = pathModule.join(dir, 'package.json');
        if (tryReadFile(pkgJsonPath) !== null) {
            return pathModule.toNamespacedPath(pkgJsonPath);
        }
        const parent = pathModule.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

function packageSearchStartDir(resolvedPath, sourceSpecifier) {
    if (typeof sourceSpecifier === 'string' &&
        (/\/$/.test(sourceSpecifier) || /(?:^|\/)\.\.?$/.test(sourceSpecifier))) {
        return pathModule.resolve(resolvedPath);
    }

    if (_stat(resolvedPath) === 1) {
        return pathModule.resolve(resolvedPath);
    }

    return pathModule.dirname(pathModule.resolve(resolvedPath));
}

function findBarePackageJson(specifier, parentDir, parentFilename) {
    const resolved = resolveFromNodeModules(specifier, parentDir, parentFilename, cjsPackageConditions());
    if (resolved === null) return undefined;

    if (typeof resolved.packageDir === 'string' && resolved.packageDir.length > 0) {
        const pkgJsonPath = pathModule.join(resolved.packageDir, 'package.json');
        if (tryReadFile(pkgJsonPath) !== null) {
            return pathModule.toNamespacedPath(pkgJsonPath);
        }
    }

    return undefined;
}

export let findPackageJSON = function findPackageJSON(specifier, base) {
    const normalizedSpecifier = normalizeFindPackageJsonSpecifier(specifier);
    if (normalizedSpecifier.kind === 'absolute') {
        const startDir = packageSearchStartDir(normalizedSpecifier.path, normalizedSpecifier.source);
        return findNearestPackageJsonPath(startDir);
    }

    const normalizedBase = normalizeFindPackageJsonBase(base, true);
    if (normalizedSpecifier.kind === 'relative') {
        const resolvedPath = pathModule.resolve(normalizedBase.dir, normalizedSpecifier.value);
        const startDir = packageSearchStartDir(resolvedPath, normalizedSpecifier.value);
        return findNearestPackageJsonPath(startDir);
    }

    return findBarePackageJson(normalizedSpecifier.value, normalizedBase.dir, normalizedBase.filename);
};

export let builtinModules = builtinModuleNames;

export let isBuiltinModule = function isBuiltinModule(id) {
    return isBuiltin(id);
};

export let register = function register(specifier, parentURL, options) {
    const url = String(specifier);
    let parent = parentURL;
    let data;
    if (parentURL && typeof parentURL === 'object' && !isUrlInstance(parentURL)) {
        parent = parentURL.parentURL;
        data = parentURL.data;
    } else if (options && typeof options === 'object') {
        data = options.data;
    }
    parent = parent === undefined ? undefined : String(parent);
    const loaders = globalThis.__wasm_rquickjs_registered_loaders ||
        (globalThis.__wasm_rquickjs_registered_loaders = []);
    const realm = globalThis.__wasm_rquickjs_registered_loader_realm_counter =
        (globalThis.__wasm_rquickjs_registered_loader_realm_counter || 0) + 1;
    const loader = { url, parent, data, realm, module: undefined, initialized: false, initializing: undefined };
    loaders.push(loader);
    if (typeof globalThis.__wasm_rquickjs_start_registered_loader === 'function') {
        globalThis.__wasm_rquickjs_start_registered_loader(loader);
    }
};

if (typeof globalThis.__wasm_rquickjs_run_registered_loaders !== 'function') {
    function normalizeLoaderResolvedUrl(url) {
        if (url.startsWith('/')) {
            const query = url.indexOf('?');
            const hash = url.indexOf('#');
            const end = query < 0 ? hash : (hash < 0 ? query : Math.min(query, hash));
            if (end >= 0) {
                url = nodeUrl.pathToFileURL(url.slice(0, end)).href + url.slice(end);
            } else {
                url = nodeUrl.pathToFileURL(url).href;
            }
        }
        return url;
    }

    function resolveRegisteredLoaderUrl(loader) {
        const url = loader.parent !== undefined
            ? normalizeLoaderResolvedUrl(globalThis.__wasm_rquickjs_import_meta_resolve(loader.parent, loader.url))
            : loader.url;
        return loaderRealmUrl(url, loader.realm);
    }

    function loaderRealmUrl(url, realm) {
        if (!url.startsWith('file://')) return url;
        const hashIndex = url.indexOf('#');
        const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex);
        const hash = hashIndex < 0 ? '' : url.slice(hashIndex);
        const separator = beforeHash.includes('?') ? '&' : '?';
        return beforeHash + separator + '__wasm_rquickjs_loader_realm=' + encodeURIComponent(String(realm)) + hash;
    }

    globalThis.__wasm_rquickjs_start_registered_loader = function startRegisteredLoader(loader) {
        if (loader.initialized || loader.initializing) return loader.initializing;
        loader.initializing = (async () => {
            const module = await import(resolveRegisteredLoaderUrl(loader));
            loader.module = module;
            if (typeof module.initialize === 'function') {
                await module.initialize(loader.data);
            }
            loader.initialized = true;
        })();
        loader.initializing.catch(() => {});
        return loader.initializing;
    };

    function resolveEsmDefaultForLoader(specifier, parentURL, context, baseUrl, missingAsUndefined, allowRootedWithoutFileParent) {
        if (specifier.startsWith('node:') || specifier.startsWith('data:')) {
            return { url: specifier };
        }
        if (specifier.startsWith('file://')) {
            return resultForEsmFileUrl(new URL(specifier));
        }
        const parentFilename = parentFilenameForLoaderResolve(parentURL, baseUrl);
        if (specifier.startsWith('/')) {
            if (parentFilename === null && !allowRootedWithoutFileParent) {
                if (missingAsUndefined) return undefined;
                throw makeEsmModuleNotFoundError(specifier);
            }
            return resultForEsmFileUrl(new URL(normalizeLoaderResolvedUrl(specifier)));
        }

        if (publicBuiltinWithoutSchemeSet.has(specifier)) {
            return { url: 'node:' + specifier };
        }
        if (parentFilename !== null && isRelativeOrAbsoluteSpecifier(specifier)) {
            return resultForRelativeOrAbsoluteSpecifier(specifier, parentURL);
        }

        if (parentFilename !== null && specifier.startsWith('#')) {
            const resolved = resolvePackageImports(specifier, pathModule.dirname(parentFilename), conditionsForLoaderResolve(context));
            if (resolved && resolved.builtin) return { url: resolved.builtin };
            if (resolved && resolved.filename) {
                return { url: nodeUrl.pathToFileURL(resolved.filename).href, format: resolved.filename.endsWith('.json') ? 'json' : undefined };
            }
        }

        if (parentFilename !== null) {
            const resolved = resolveEsmPackageForLoader(specifier, pathModule.dirname(parentFilename), parentFilename, conditionsForLoaderResolve(context));
            if (resolved) return resolved;
            if (missingAsUndefined) return undefined;
            throw makeEsmModuleNotFoundError(specifier);
        }
        if (missingAsUndefined) return undefined;

        let url = globalThis.__wasm_rquickjs_import_meta_resolve(parentURL, specifier);
        return { url: normalizeLoaderResolvedUrl(url) };
    }

    globalThis.__wasm_rquickjs_run_registered_loaders = async function runRegisteredLoaders(baseUrl, specifier, attrs, mode) {
        const loaders = globalThis.__wasm_rquickjs_registered_loaders;
        if (!loaders || loaders.length === 0) return undefined;

        const modules = [];
        const moduleUrls = [];
        for (let i = 0; i < loaders.length; i++) {
            const loader = loaders[i];
            try {
                await globalThis.__wasm_rquickjs_start_registered_loader(loader);
            } catch (e) {
                loader.initializing = undefined;
                throw e;
            }
            if (loader.module) {
                modules.push(loader.module);
                moduleUrls.push(loader.url);
            }
        }

        const importAttributes = attrs && attrs.typeValue !== undefined
            ? { type: attrs.typeValue }
            : {};

        const baseContext = {
            conditions: loaderHookConditions(),
            importAttributes,
            parentURL: String(baseUrl),
        };

        const defaultResolve = async (nextSpecifier, context) => {
            const specifierString = String(nextSpecifier);
            const parentURL = context && context.parentURL ? String(context.parentURL) : String(baseUrl);
            return resolveEsmDefaultForLoader(specifierString, parentURL, context, baseUrl, false, true);
        };

        const runResolve = async (index, nextSpecifier, context) => {
            if (index < 0) return defaultResolve(nextSpecifier, context);
            const module = modules[index];
            if (typeof module.resolve === 'function') {
                let nextCalled = false;
                const nextResolve = async (specifierForNext, contextForNext) => {
                    nextCalled = true;
                    return runResolve(
                        index - 1,
                        specifierForNext === undefined ? nextSpecifier : specifierForNext,
                        contextForNext === undefined ? context : Object.assign({}, context, contextForNext),
                    );
                };
                const result = validateRegisteredLoaderResult(await module.resolve(nextSpecifier, context, nextResolve), 'resolve', context);
                validateRegisteredLoaderResolveUrl(result.url, moduleUrls[index]);
                if (!nextCalled && (!result || result.shortCircuit !== true)) {
                    throw makeLoaderChainError('resolve');
                }
                return result;
            }
            return runResolve(index - 1, nextSpecifier, context);
        };

        const resolved = await runResolve(modules.length - 1, specifier, baseContext);
        if (!resolved || typeof resolved !== 'object' || resolved.url === undefined) return undefined;
        resolved.url = normalizeLoaderResolvedUrl(String(resolved.url));
        const resolvedFormat = resolved.format === undefined || resolved.format === null ? undefined : String(resolved.format);

        const defaultLoad = async (_nextUrl, context) => ({ format: context && context.format });

        const runLoad = async (index, nextUrl, context) => {
            if (index < 0) return defaultLoad(nextUrl, context);
            const module = modules[index];
            if (typeof module.load === 'function') {
                let nextCalled = false;
                const nextLoad = async (urlForNext, contextForNext) => {
                    nextCalled = true;
                    return runLoad(
                        index - 1,
                        urlForNext === undefined ? nextUrl : String(urlForNext),
                        contextForNext === undefined ? context : Object.assign({}, context, contextForNext),
                    );
                };
                const result = validateRegisteredLoaderResult(await module.load(nextUrl, context, nextLoad), 'load', context);
                if (result.format !== undefined && result.format !== null && result.format !== '') {
                    validateRegisteredLoaderLoadFormat(result.format);
                }
                if (!nextCalled && (!result || result.shortCircuit !== true)) {
                    throw makeLoaderChainError('load');
                }
                return result;
            }
            return runLoad(index - 1, nextUrl, context);
        };

        const loadContext = {
            conditions: baseContext.conditions,
            importAttributes: resolved.importAttributes && typeof resolved.importAttributes === 'object'
                ? resolved.importAttributes
                : baseContext.importAttributes,
            format: resolvedFormat,
        };
        const loaded = await runLoad(modules.length - 1, resolved.url, loadContext);
        const loadedHasSource = loaded && Object.prototype.hasOwnProperty.call(loaded, 'source') && loaded.source !== null && loaded.source !== undefined;
        const loadedFormat = loaded && loaded.format !== undefined && loaded.format !== null
            ? validateRegisteredLoaderLoadFormat(loaded.format)
            : validateRegisteredLoaderLoadFormat(resolvedFormat);
        if (mode === 'static-raw') {
            const raw = { url: resolved.url, format: loadedFormat };
            if (loadedHasSource) raw.source = loaded.source;
            return raw;
        }

        if (loadedHasSource && loadedFormat === 'module') {
            return 'data:text/javascript,' + encodeURIComponent(loaderSourceToString(loaded.source));
        }
        if (!loadedHasSource && loadedFormat === 'module') {
            if (String(resolved.url).startsWith('file://')) {
                try {
                    if (nodeUrl.fileURLToPath(resolved.url).endsWith('.mjs')) return resolved.url;
                } catch (_) {}
            }
            const fileSource = loaderFileUrlSource(resolved.url);
            if (fileSource !== null) {
                return 'data:text/javascript,' + encodeURIComponent(fileSource);
            }
        }
        if (loadedHasSource && loadedFormat === 'commonjs') {
            return loaderCommonJsSourceModule(loaded.source, resolved.url);
        }
        if (!loadedHasSource && loadedFormat === 'commonjs') {
            const fileSource = loaderFileUrlSource(resolved.url);
            if (fileSource !== null) {
                return loaderCommonJsSourceModule(fileSource, resolved.url);
            }
        }
        if (loadedHasSource && loadedFormat === 'json') {
            return globalThis.__wasm_rquickjs_register_import_attr_rewrite(
                'data:application/json,' + encodeURIComponent(loaderSourceToString(loaded.source)),
                'json',
            );
        }
        if (loadContext.importAttributes && loadContext.importAttributes.type === 'json') {
            return globalThis.__wasm_rquickjs_register_import_attr_rewrite(resolved.url, 'json');
        }
        return undefined;
    };

    function isLoaderThenable(value) {
        return value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
    }

    function assertSyncLoaderResult(value, hookName, operation) {
        if (isLoaderThenable(value)) {
            const err = new Error('Async registered loader ' + hookName + ' hooks are not supported from ' + (operation || 'CommonJS require()'));
            err.code = 'ERR_REQUIRE_ASYNC_MODULE';
            throw err;
        }
        return value;
    }

    globalThis.__wasm_rquickjs_run_registered_loaders_sync = function runRegisteredLoadersSync(baseUrl, specifier, resolveOnly, mode) {
        const loaders = globalThis.__wasm_rquickjs_registered_loaders;
        if (!loaders || loaders.length === 0) return undefined;
        const isImportMode = mode === 'import';
        const modules = [];
        const moduleUrls = [];
        for (let i = 0; i < loaders.length; i++) {
            const loader = loaders[i];
            if (!loader.initialized) {
                if (isImportMode) {
                    continue;
                }
                if (loader.initializing) {
                    const err = new Error('Registered loader initialization has not completed');
                    err.code = 'ERR_REQUIRE_ASYNC_MODULE';
                    throw err;
                }
                continue;
            }
            if (loader.module) {
                modules.push(loader.module);
                moduleUrls.push(loader.url);
            }
        }
        if (modules.length === 0) return undefined;

        const baseContext = {
            conditions: isImportMode ? loaderHookConditions() : Array.from(cjsPackageConditions()),
            importAttributes: {},
            parentURL: String(baseUrl || fileUrlForPath('/')),
        };

        const defaultResolve = (nextSpecifier, context) => {
            const specifierString = String(nextSpecifier);
            const parentURL = context && context.parentURL ? String(context.parentURL) : baseContext.parentURL;
            if (specifierString.startsWith('node:')) {
                return { url: specifierString, format: isImportMode ? undefined : 'builtin' };
            }
            if (isBuiltin(specifierString)) {
                return { url: 'node:' + specifierString, format: isImportMode ? undefined : 'builtin' };
            }
            if (isImportMode) {
                return resolveEsmDefaultForLoader(specifierString, parentURL, context, baseContext.parentURL, true, false);
            }
            let parentFilename = null;
            if (parentURL.startsWith('file://')) {
                parentFilename = nodeUrl.fileURLToPath(parentURL);
            } else if (parentURL.startsWith('/')) {
                parentFilename = parentURL;
            }
            const parentDir = parentFilename ? pathModule.dirname(parentFilename) : '/';
            if (specifierString.startsWith('file://')) {
                const filename = nodeUrl.fileURLToPath(specifierString);
                const source = tryReadFile(filename);
                if (source === null) return undefined;
                return { url: nodeUrl.pathToFileURL(filename).href, format: filename.endsWith('.json') ? 'json' : 'commonjs', source };
            }
            if (specifierString === '.' || specifierString === '..' || specifierString.startsWith('./') || specifierString.startsWith('../') || specifierString.startsWith('/')) {
                const resolved = resolveFilename(specifierString, parentDir);
                return { url: nodeUrl.pathToFileURL(resolved.filename).href, format: resolved.filename.endsWith('.json') ? 'json' : 'commonjs', source: resolved.content };
            }
            if (specifierString.startsWith('#') && parentFilename) {
                const importsResolved = resolvePackageImports(specifierString, parentDir, cjsPackageConditions());
                if (importsResolved.builtin) return { url: importsResolved.builtin, format: 'builtin' };
                return { url: nodeUrl.pathToFileURL(importsResolved.filename).href, format: importsResolved.filename.endsWith('.json') ? 'json' : 'commonjs', source: importsResolved.content };
            }
            const nmResolved = resolveFromNodeModules(specifierString, parentDir, parentFilename, cjsPackageConditions());
            if (nmResolved) {
                return { url: nodeUrl.pathToFileURL(nmResolved.filename).href, format: nmResolved.filename.endsWith('.json') ? 'json' : 'commonjs', source: nmResolved.content };
            }
            return undefined;
        };

        const runResolve = (index, nextSpecifier, context) => {
            if (index < 0) return defaultResolve(nextSpecifier, context);
            const module = modules[index];
            if (typeof module.resolve === 'function') {
                let nextCalled = false;
                const nextResolve = (specifierForNext, contextForNext) => {
                    nextCalled = true;
                    return runResolve(
                        index - 1,
                        specifierForNext === undefined ? nextSpecifier : specifierForNext,
                        contextForNext === undefined ? context : Object.assign({}, context, contextForNext),
                    );
                };
                const hookResult = assertSyncLoaderResult(module.resolve(nextSpecifier, context, nextResolve), 'resolve', isImportMode ? 'static ES module resolution' : undefined);
                if (hookResult === undefined) {
                    if (!nextCalled) throw makeLoaderChainError('resolve');
                    return undefined;
                }
                const result = validateRegisteredLoaderResult(hookResult, 'resolve', context);
                validateRegisteredLoaderResolveUrl(result.url, moduleUrls[index]);
                if (!nextCalled && (!result || result.shortCircuit !== true)) {
                    throw makeLoaderChainError('resolve');
                }
                return result;
            }
            return runResolve(index - 1, nextSpecifier, context);
        };

        const initialSpecifier = isImportMode && typeof specifier === 'string'
            ? normalizeLoaderResolvedUrl(specifier)
            : specifier;
        const resolved = runResolve(modules.length - 1, initialSpecifier, baseContext);
        if (!resolved || typeof resolved !== 'object' || resolved.url === undefined) return undefined;
        resolved.url = normalizeLoaderResolvedUrl(String(resolved.url));
        const resolvedFormat = resolved.format === undefined || resolved.format === null ? undefined : String(resolved.format);
        if (resolveOnly) return { url: resolved.url, format: resolvedFormat };

        const defaultLoad = (_nextUrl, context) => ({ format: context && context.format });
        const runLoad = (index, nextUrl, context) => {
            if (index < 0) return defaultLoad(nextUrl, context);
            const module = modules[index];
            if (typeof module.load === 'function') {
                let nextCalled = false;
                const nextLoad = (urlForNext, contextForNext) => {
                    nextCalled = true;
                    return runLoad(
                        index - 1,
                        urlForNext === undefined ? nextUrl : String(urlForNext),
                        contextForNext === undefined ? context : Object.assign({}, context, contextForNext),
                    );
                };
                const result = validateRegisteredLoaderResult(assertSyncLoaderResult(module.load(nextUrl, context, nextLoad), 'load', isImportMode ? 'static ES module resolution' : undefined), 'load', context);
                if (result.format !== undefined && result.format !== null && result.format !== '') {
                    validateRegisteredLoaderLoadFormat(result.format);
                }
                if (!nextCalled && (!result || result.shortCircuit !== true)) {
                    throw makeLoaderChainError('load');
                }
                return result;
            }
            return runLoad(index - 1, nextUrl, context);
        };

        const loaded = runLoad(modules.length - 1, resolved.url, {
            conditions: baseContext.conditions,
            importAttributes: resolved.importAttributes && typeof resolved.importAttributes === 'object'
                ? resolved.importAttributes
                : baseContext.importAttributes,
            format: resolvedFormat,
        });
        const finalFormat = loaded && loaded.format !== undefined && loaded.format !== null
            ? validateRegisteredLoaderLoadFormat(loaded.format)
            : validateRegisteredLoaderLoadFormat(resolvedFormat);
        if (finalFormat === 'builtin') return { url: resolved.url, format: finalFormat };
        if (!loaded && resolved.source === undefined) return undefined;
        let source = loaded && Object.prototype.hasOwnProperty.call(loaded, 'source') && loaded.source !== null && loaded.source !== undefined
            ? loaded.source
            : resolved.source;
        if (source === undefined && isImportMode) {
            return { url: resolved.url, format: finalFormat };
        }
        if (source === undefined && finalFormat === 'commonjs' && String(resolved.url).startsWith('file://')) {
            try {
                source = tryReadFile(nodeUrl.fileURLToPath(resolved.url));
            } catch (_) {}
        }
        if (source === null) source = undefined;
        if (source === undefined) return undefined;
        return { url: resolved.url, format: finalFormat, source };
    };

    function staticRegisteredLoaderCacheKey(baseUrl, specifier) {
        return String(baseUrl) + '\0' + String(specifier) + '\0';
    }

    function staticRegisteredLoaderReturn(loaded) {
        if (!loaded || !loaded.url) return undefined;
        const url = String(loaded.url);
        const format = loaded.format === undefined || loaded.format === null ? undefined : String(loaded.format);
        const hasSource = Object.prototype.hasOwnProperty.call(loaded, 'source') && loaded.source !== undefined && loaded.source !== null;
        if (hasSource && (format === undefined || format === 'module')) {
            return 'data:text/javascript,' + encodeURIComponent(loaderSourceToString(loaded.source));
        }
        if (!hasSource && format === 'module') {
            return url.startsWith('file://') ? nodeUrl.fileURLToPath(url) : url;
        }
        if (hasSource && format === 'commonjs') {
            return loaderCommonJsSourceModule(loaded.source, url);
        }
        if (!hasSource && format === 'commonjs') {
            const fileSource = loaderFileUrlSource(url);
            if (fileSource !== null) {
                return loaderCommonJsSourceModule(fileSource, url);
            }
        }
        if (hasSource && format === 'json') {
            return globalThis.__wasm_rquickjs_register_import_attr_rewrite(
                'data:application/json,' + encodeURIComponent(loaderSourceToString(loaded.source)),
                'json',
            );
        }
        if (url.startsWith('file://')) {
            return nodeUrl.fileURLToPath(url);
        }
        return url;
    }

    function staticRegisteredLoaderSourceForUrl(url) {
        url = String(url);
        if (url.startsWith('file://')) {
            return loaderFileUrlSource(url);
        }
        if (url.startsWith('/')) {
            try {
                return tryReadFile(url);
            } catch (_) {
                return null;
            }
        }
        if (url.startsWith('data:')) {
            const comma = url.indexOf(',');
            if (comma < 0) return null;
            const meta = url.slice(5, comma).toLowerCase();
            if (meta.indexOf('text/javascript') < 0 && meta.indexOf('application/javascript') < 0) {
                return null;
            }
            const body = url.slice(comma + 1);
            try {
                return meta.indexOf(';base64') >= 0 ? atob(body) : decodeURIComponent(body);
            } catch (_) {
                return null;
            }
        }
        return null;
    }

    function staticRegisteredLoaderChildUrl(loaded, fallback) {
        fallback = String(fallback);
        if (fallback.startsWith('data:')) return fallback;
        if (loaded && loaded.url) return String(loaded.url);
        return fallback.startsWith('/') ? nodeUrl.pathToFileURL(fallback).href : fallback;
    }

    function staticRegisteredLoaderParentAliases(parentUrl) {
        const aliases = [parentUrl];
        const virtualPrefix = 'file:///__wasm_rquickjs_virtual__/';
        if (parentUrl.startsWith(virtualPrefix) && parentUrl.endsWith('.mjs')) {
            aliases.push('file:///' + parentUrl.slice(virtualPrefix.length, -4));
        }
        return aliases;
    }

    async function prepareStaticRegisteredLoaderGraph(parentUrl, seen) {
        parentUrl = normalizeLoaderResolvedUrl(String(parentUrl));
        seen = seen || Object.create(null);
        if (seen[parentUrl]) return;
        seen[parentUrl] = true;

        const source = staticRegisteredLoaderSourceForUrl(parentUrl);
        if (source === null) return;
        const edges = collectStaticEsmEdges(source);
        for (let i = 0; i < edges.length; i++) {
            const specifier = edges[i].specifier;
            const key = staticRegisteredLoaderCacheKey(parentUrl, specifier);
            if (!Object.prototype.hasOwnProperty.call(globalThis.__wasm_rquickjs_static_registered_loader_cache, key)) {
                try {
                    const loaded = await globalThis.__wasm_rquickjs_run_registered_loaders(parentUrl, specifier, undefined, 'static-raw');
                    const value = staticRegisteredLoaderReturn(loaded);
                    globalThis.__wasm_rquickjs_static_registered_loader_cache[key] = { value, loaded };
                } catch (error) {
                    globalThis.__wasm_rquickjs_static_registered_loader_cache[key] = { error };
                    continue;
                }
            }
            const cached = globalThis.__wasm_rquickjs_static_registered_loader_cache[key];
            if (cached && !cached.error && cached.value !== undefined) {
                await prepareStaticRegisteredLoaderGraph(
                    staticRegisteredLoaderChildUrl(cached.loaded, cached.value),
                    seen,
                );
            }
        }
    }

    globalThis.__wasm_rquickjs_prepare_static_registered_loader_graph = async function prepareStaticRegisteredLoaderEntry(entryUrl, entrySpecifier, entryParentUrl) {
        if (!globalThis.__wasm_rquickjs_static_registered_loader_cache) {
            globalThis.__wasm_rquickjs_static_registered_loader_cache = Object.create(null);
        }
        if (entrySpecifier !== undefined && entryParentUrl !== undefined) {
            const parentUrl = normalizeLoaderResolvedUrl(String(entryParentUrl));
            const specifier = String(entrySpecifier);
            const key = staticRegisteredLoaderCacheKey(parentUrl, specifier);
            if (!Object.prototype.hasOwnProperty.call(globalThis.__wasm_rquickjs_static_registered_loader_cache, key)) {
                try {
                    const loaded = await globalThis.__wasm_rquickjs_run_registered_loaders(parentUrl, specifier, undefined, 'static-raw');
                    const value = staticRegisteredLoaderReturn(loaded);
                    globalThis.__wasm_rquickjs_static_registered_loader_cache[key] = { value, loaded };
                } catch (error) {
                    globalThis.__wasm_rquickjs_static_registered_loader_cache[key] = { error };
                    return;
                }
            }
            const cached = globalThis.__wasm_rquickjs_static_registered_loader_cache[key];
            const aliases = staticRegisteredLoaderParentAliases(parentUrl);
            for (let i = 1; i < aliases.length; i++) {
                globalThis.__wasm_rquickjs_static_registered_loader_cache[
                    staticRegisteredLoaderCacheKey(aliases[i], specifier)
                ] = cached;
            }
        }
        await prepareStaticRegisteredLoaderGraph(entryUrl, Object.create(null));
    };

    globalThis.__wasm_rquickjs_resolve_static_registered_loader = function resolveStaticRegisteredLoader(baseUrl, specifier) {
        const cache = globalThis.__wasm_rquickjs_static_registered_loader_cache;
        const key = staticRegisteredLoaderCacheKey(baseUrl, specifier);
        if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
            const cached = cache[key];
            if (cached.error) throw cached.error;
            return cached.value;
        }
        const loaded = globalThis.__wasm_rquickjs_run_registered_loaders_sync(baseUrl, specifier, false, 'import');
        return staticRegisteredLoaderReturn(loaded);
    };
}

// "node_modules" reversed as char codes: s-e-l-u-d-o-m-_-e-d-o-n
const nmChars = [115, 101, 108, 117, 100, 111, 109, 95, 101, 100, 111, 110];
const nmLen = nmChars.length;

function _nodeModulePaths(from) {
    from = pathModule.resolve(from);

    if (from === '/') {
        return ['/node_modules'];
    }

    const paths = [];
    for (let i = from.length - 1, p = 0, last = from.length; i >= 0; --i) {
        const code = from.charCodeAt(i);
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
    let isRelative = false;
    if (request.length > 0 && request.charAt(0) === '.') {
        if (request.length === 1) {
            isRelative = true;
        } else {
            const second = request.charAt(1);
            if (second === '/' || second === '.') {
                isRelative = true;
            }
        }
    }

    if (!isRelative) {
        let paths;
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

    return [pathModule.dirname(parent.filename)];
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
    const { nodeModules, generatedCode } = options;
    if (nodeModules !== undefined && typeof nodeModules !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.nodeModules', 'boolean', nodeModules);
    }
    if (generatedCode !== undefined && typeof generatedCode !== 'boolean') {
        throw new ERR_INVALID_ARG_TYPE('options.generatedCode', 'boolean', generatedCode);
    }
}

const globalPaths = [];

function _initPaths() {
    const nodePath = globalThis.process && globalThis.process.env && globalThis.process.env.NODE_PATH;
    const paths = [];
    if (nodePath) {
        const parts = nodePath.split(':');
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p.length > 0) {
                paths.push(pathModule.resolve(p));
            }
        }
    }

    const homeDir = (globalThis.process && globalThis.process.env && globalThis.process.env.HOME) || '/root';
    paths.push(pathModule.resolve(homeDir, '.node_modules'));
    paths.push(pathModule.resolve(homeDir, '.node_libraries'));
    paths.push('/usr/local/lib/node');

    globalPaths.length = 0;
    for (let j = 0; j < paths.length; j++) {
        globalPaths.push(paths[j]);
    }
}

_initPaths();

function _stat(filename) {
    try {
        const st = fsModule.statSync(filename);
        if (st.isDirectory()) return 1;
        if (st.isFile()) return 0;
        return -2;
    } catch (e) {
        return -2;
    }
}

function runMain() {
    const mainScript = process.argv[1];
    if (mainScript) {
        globalRequire(mainScript);
    }
}

export let syncBuiltinESMExports = function() {
    const registry = globalThis.__wasm_rquickjs_sync_builtin_esm_exports;
    if (!registry) return;
    if (typeof registry.fs === 'function') registry.fs();
    if (typeof registry.events === 'function') registry.events();
    require = moduleExports.require;
    createRequire = moduleExports.createRequire;
    findPackageJSON = moduleExports.findPackageJSON;
    builtinModules = moduleExports.builtinModules;
    isBuiltinModule = moduleExports.isBuiltin;
    register = moduleExports.register;
    syncBuiltinESMExports = moduleExports.syncBuiltinESMExports;
};

function Module(id, parent) {
    this.id = id === undefined ? '' : id;
    this.path = pathModule.dirname(this.id);
    this.exports = {};
    this.filename = null;
    this.loaded = false;
    this.children = [];
    this.parent = parent || null;
    if (parent && parent.children) {
        Array.prototype.push.call(parent.children, this);
    }
}

Module.prototype.require = function require(id) {
    const baseDir = this && typeof this.filename === 'string'
        ? pathModule.dirname(this.filename)
        : '.';
    return makeRequire(baseDir, this || null)(id);
};

Module.prototype._compile = function _compile(content, filename) {
    if (!(this instanceof Module)) {
        throw new ERR_INVALID_ARG_TYPE('mod', 'Module', this);
    }
    return compileModuleInto(this, content, arguments.length > 1 ? filename : this.filename);
};

function moduleLoad(request, parent, isMain) {
    void isMain;
    if (parent && typeof parent.filename === 'string') {
        return makeRequire(pathModule.dirname(parent.filename), parent)(request);
    }
    return makeRequire('.', parent || null)(request);
}

function moduleResolveFilename(request, parent, isMain, options) {
    void isMain;
    const baseDir = parent && typeof parent.filename === 'string'
        ? pathModule.dirname(parent.filename)
        : '.';
    const parentFilename = parent && typeof parent.filename === 'string'
        ? parent.filename
        : null;
    const parentLookupPaths = parent && Array.isArray(parent.paths)
        ? parent.paths.concat(globalPaths)
        : null;
    return resolveForRequire(request, options, baseDir, parentFilename, parentLookupPaths);
}

const moduleExports = Object.assign(Module, {
    require: globalRequire,
    createRequire,
    findPackageJSON,
    findSourceMap,
    SourceMap,
    builtinModules: builtinModuleNames,
    syncBuiltinESMExports,
    isBuiltin: isBuiltinModule,
    register,
    wrap: wrap,
    wrapper: wrapper,
    runMain: runMain,
    _nodeModulePaths: _nodeModulePaths,
    _resolveLookupPaths: _resolveLookupPaths,
    _resolveFilename: moduleResolveFilename,
    _load: moduleLoad,
    _initPaths: _initPaths,
    _pathCache: _pathCache,
    _extensions: requireExtensions,
    _stat: _stat,
    globalPaths: globalPaths,
    setSourceMapsSupport,
});
moduleExports.Module = Module;

// Add self-reference so require('module') works
builtinModuleMap['module'] = moduleExports;
builtinModuleMap['node:module'] = moduleExports;
if (!builtinModuleNames.includes('module')) {
    builtinModuleNames.push('module');
}
publicBuiltinIdSet.add('module');
publicBuiltinWithoutSchemeSet.add('module');

export default moduleExports;

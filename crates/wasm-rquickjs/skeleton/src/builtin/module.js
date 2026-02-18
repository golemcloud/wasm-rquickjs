import * as pathModule from 'node:path';
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
import * as http2 from 'node:http2';
import * as https from 'node:https';
import * as net from 'node:net';
import * as perf_hooks from 'node:perf_hooks';
import * as readline from 'node:readline';
import * as readlinePromises from 'node:readline/promises';
import * as repl from 'node:repl';
import * as tls from 'node:tls';
import * as tty from 'node:tty';
import * as v8 from 'node:v8';
import * as worker_threads from 'node:worker_threads';
import * as zlib from 'node:zlib';
import * as internalWebstreamsUtil from '__wasm_rquickjs_builtin/internal/webstreams/util';

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

const builtinModules = {
    'path': cjsExport(pathModule),
    'node:path': cjsExport(pathModule),
    'fs': cjsExport(fsModule),
    'node:fs': cjsExport(fsModule),
    'fs/promises': cjsExport(fsPromises),
    'node:fs/promises': cjsExport(fsPromises),
    'util': cjsExport(util),
    'node:util': cjsExport(util),
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
    'crypto': cjsExport(crypto),
    'node:crypto': cjsExport(crypto),
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
    'console': cjsExport(consoleMod),
    'node:console': cjsExport(consoleMod),
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
    'http': cjsExport(https),
    'node:http': cjsExport(https),
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
    'tty': cjsExport(tty),
    'node:tty': cjsExport(tty),
    'v8': cjsExport(v8),
    'node:v8': cjsExport(v8),
    'worker_threads': cjsExport(worker_threads),
    'node:worker_threads': cjsExport(worker_threads),
    'zlib': cjsExport(zlib),
    'node:zlib': cjsExport(zlib),
    'util/types': (cjsExport(util) && cjsExport(util).types) || {},
    'node:util/types': (cjsExport(util) && cjsExport(util).types) || {},
    '_stream_readable': cjsExport(stream) && cjsExport(stream).Readable,
    '_stream_writable': cjsExport(stream) && cjsExport(stream).Writable,
    '_stream_duplex': cjsExport(stream) && cjsExport(stream).Duplex,
    '_stream_transform': cjsExport(stream) && cjsExport(stream).Transform,
    '_stream_passthrough': cjsExport(stream) && cjsExport(stream).PassThrough,
    'internal/webstreams/util': cjsExport(internalWebstreamsUtil),
};

// Self-reference will be added after the module object is created (see bottom of file)

const builtinModuleNames = Object.keys(builtinModules);

function isBuiltin(id) {
    return builtinModules[id] !== undefined;
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

function resolveFilename(id, parentDir) {
    var candidate;
    if (pathModule.isAbsolute(id)) {
        candidate = pathModule.normalize(id);
    } else {
        candidate = pathModule.resolve(parentDir, id);
    }

    // Try: exact path, .js, .json, /index.js, /index.json
    var candidates = [
        candidate,
        candidate + '.js',
        candidate + '.json',
        pathModule.join(candidate, 'index.js'),
        pathModule.join(candidate, 'index.json'),
    ];

    for (var i = 0; i < candidates.length; i++) {
        var content = tryReadFile(candidates[i]);
        if (content !== null) {
            return { filename: candidates[i], content: content };
        }
    }

    var err = new Error("Cannot find module '" + id + "' from '" + parentDir + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
}

function compileCjs(filename, source) {
    // Strip shebang
    if (source.length > 1 && source.charCodeAt(0) === 0x23 && source.charCodeAt(1) === 0x21) {
        source = '//' + source;
    }

    return new Function('exports', 'require', 'module', '__filename', '__dirname',
        source + '\n//# sourceURL=' + filename + '\n');
}

function loadModule(resolvedFilename, source, parentModule) {
    // Check cache
    if (moduleCache[resolvedFilename]) {
        return moduleCache[resolvedFilename];
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

    if (resolvedFilename.endsWith('.json')) {
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
        var compiledFn = compileCjs(resolvedFilename, source);
        compiledFn(mod.exports, childRequire, mod, resolvedFilename, dirname);
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

function makeRequire(parentDir, parentModule) {
    function localRequire(id) {
        if (typeof id !== 'string') {
            throw new TypeError("The 'id' argument must be of type string. Received " + typeof id);
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

        var err = new Error("Cannot find module '" + id + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }

    localRequire.cache = moduleCache;

    localRequire.resolve = function resolve(id) {
        if (isBuiltin(id)) {
            return id;
        }
        if (id.startsWith('./') || id.startsWith('../') || id.startsWith('/')) {
            var resolved = resolveFilename(id, parentDir);
            return resolved.filename;
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
    if (typeof filename === 'string' && filename.startsWith('file://')) {
        filepath = filename.slice(7);
    } else {
        filepath = String(filename);
    }
    var dir = pathModule.dirname(filepath);
    return makeRequire(dir, null);
}

export { builtinModuleNames as builtinModules };

export function isBuiltinModule(id) {
    return isBuiltin(id);
}

var moduleExports = {
    require: globalRequire,
    createRequire,
    builtinModules: builtinModuleNames,
    isBuiltin: isBuiltinModule,
};

// Add self-reference so require('module') works
builtinModules['module'] = moduleExports;
builtinModules['node:module'] = moduleExports;

export default moduleExports;

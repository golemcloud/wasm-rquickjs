// Node.js compatibility test runner.
// Executes a vendored Node.js test file via the CJS loader.
// The test file and common shim must be pre-populated in the WASI filesystem
// by the Rust test harness before invoking this function.
//
// Expected filesystem layout:
//   /home/node/test/<suite>/<test-file>.js — the vendored Node.js test (suite: parallel, sequential, es-module)
//   /home/node/test/common/index.js       — our common shim
//
// The test does require('../common') which resolves naturally to /home/node/test/common/index.js.

const require = globalThis.require;
// Tests may replace process or delete global timer functions.
const awaitRuntimeIdle = globalThis.process._awaitRuntimeIdle;
const reportUnexpectedRejection = globalThis.console.error.bind(globalThis.console);

// Track unhandled rejections from test top-level promise chains.
//
// Node.js tests typically follow this pattern:
//   (async () => { ... })().then(common.mustCall());
//
// If the async IIFE rejects, the .then() has no rejection handler, so the
// rejection is unhandled. The runtime's native promise rejection tracker
// (set via rquickjs's set_host_promise_rejection_tracker) emits
// process.emit('unhandledRejection', reason) which we listen for here.
var _firstUnhandledRejection = null;
var _firstUnhandledRejectionHadTestListener = false;

function installRejectionTracking() {
    _firstUnhandledRejection = null;
    _firstUnhandledRejectionHadTestListener = false;

    function onUnhandledRejection(reason) {
        if (!_firstUnhandledRejection) {
            _firstUnhandledRejection = reason;
            _firstUnhandledRejectionHadTestListener =
                globalThis.process &&
                typeof globalThis.process.listenerCount === 'function' &&
                globalThis.process.listenerCount('unhandledRejection') > 1;
            if (!_firstUnhandledRejectionHadTestListener) {
                // A failed operation can leave a server listening, so the idle
                // wait may never finish. Preserve its first rejection in the
                // timeout's captured stderr as well as the final failure result.
                var diagnostic = '<unprintable rejection>';
                try {
                    var stack = reason && reason.stack;
                    diagnostic = stack ? String(stack) : String(reason);
                } catch (_) {}
                try {
                    reportUnexpectedRejection(
                        'Unhandled promise rejection before runtime idle:',
                        diagnostic
                    );
                } catch (_) {}
            }
        }
    }

    if (globalThis.process && typeof globalThis.process.on === 'function') {
        globalThis.process.on('unhandledRejection', onUnhandledRejection);
    }

    return function restore() {
        if (globalThis.process && typeof globalThis.process.removeListener === 'function') {
            globalThis.process.removeListener('unhandledRejection', onUnhandledRejection);
        }
        var rejection = _firstUnhandledRejection;
        var hadTestListener = _firstUnhandledRejectionHadTestListener;
        _firstUnhandledRejection = null;
        _firstUnhandledRejectionHadTestListener = false;
        return hadTestListener ? null : rejection;
    };
}

function parseTestFlags(testPath) {
    var source;
    try {
        source = require('node:fs').readFileSync(testPath, 'utf8');
    } catch (_) {
        return [];
    }

    var flags = [];
    var re = /^\/\/\s*Flags:\s*(.+)$/gm;
    var match;
    while ((match = re.exec(source)) !== null) {
        var line = match[1] || '';
        var parts = line.trim().split(/\s+/).filter(Boolean);
        for (var i = 0; i < parts.length; i++) {
            flags.push(parts[i]);
        }
    }

    return flags;
}

function packageConditionsFromFlags(flags) {
    var conditions = [];
    function add(condition) {
        if (condition) conditions.push(condition);
    }
    for (var i = 0; i < flags.length; i++) {
        var flag = String(flags[i]);
        if (flag.indexOf('--conditions=') === 0) {
            add(flag.slice('--conditions='.length));
        } else if (flag === '--conditions' || flag === '-C') {
            if (i + 1 < flags.length) {
                add(String(flags[++i]));
            }
        }
    }
    return conditions;
}

function experimentalLoadersFromFlags(flags) {
    var loaders = [];
    for (var i = 0; i < flags.length; i++) {
        var flag = String(flags[i]);
        if (flag.indexOf('--experimental-loader=') === 0) {
            loaders.push(flag.slice('--experimental-loader='.length));
        } else if (flag.indexOf('--loader=') === 0) {
            loaders.push(flag.slice('--loader='.length));
        } else if (flag === '--experimental-loader' || flag === '--loader') {
            if (i + 1 < flags.length) {
                loaders.push(String(flags[++i]));
            }
        }
    }
    return loaders;
}

function preloadImportsFromFlags(flags) {
    var imports = [];
    for (var i = 0; i < flags.length; i++) {
        var flag = String(flags[i]);
        if (flag.indexOf('--import=') === 0) {
            imports.push(flag.slice('--import='.length));
        } else if (flag === '--import') {
            if (i + 1 < flags.length) {
                imports.push(String(flags[++i]));
            }
        }
    }
    return imports;
}

function applyTestFlagsToProcess(testPath) {
    if (!globalThis.process) return;

    var flags = parseTestFlags(testPath);
    if (!Array.isArray(globalThis.process.execArgv)) {
        globalThis.process.execArgv = [];
    }

    // Keep the same array reference because other modules may hold it.
    globalThis.process.execArgv.length = 0;
    for (var i = 0; i < flags.length; i++) {
        globalThis.process.execArgv.push(flags[i]);
    }
    if (typeof globalThis.__wasm_rquickjs_configure_source_maps_from_startup_args === 'function') {
        globalThis.__wasm_rquickjs_configure_source_maps_from_startup_args(flags);
    }
    globalThis.__wasm_rquickjs_package_conditions = packageConditionsFromFlags(flags);
    return flags;
}

async function awaitRegisteredLoadersFrom(startIndex) {
    if (typeof globalThis.__wasm_rquickjs_start_registered_loader !== 'function') return;
    var registeredLoaders = globalThis.__wasm_rquickjs_registered_loaders || [];
    for (var i = startIndex; i < registeredLoaders.length; i++) {
        await globalThis.__wasm_rquickjs_start_registered_loader(registeredLoaders[i]);
    }
}

function resolvePreloadImport(specifier, cwd, cwdUrl) {
    var value = String(specifier);
    if (/^(?:data|file|node):/.test(value)) return value;
    if (value[0] === '/' || value.indexOf('./') === 0 || value.indexOf('../') === 0) {
        var pathBuiltin = require('node:path');
        var urlBuiltin = require('node:url');
        return urlBuiltin.pathToFileURL(pathBuiltin.resolve(cwd, value)).href;
    }
    if (typeof globalThis.__wasm_rquickjs_import_meta_resolve === 'function') {
        return globalThis.__wasm_rquickjs_import_meta_resolve(cwdUrl, value);
    }
    return value;
}

async function installPreloadImportsFromFlags(flags) {
    var imports = preloadImportsFromFlags(flags || []);
    if (imports.length === 0) return;

    var urlBuiltin = require('node:url');
    var cwd = globalThis.process && typeof globalThis.process.cwd === 'function'
        ? globalThis.process.cwd()
        : '/home/node';
    var cwdUrl = urlBuiltin.pathToFileURL(cwd.endsWith('/') ? cwd : cwd + '/').href;

    for (var i = 0; i < imports.length; i++) {
        var loaderStartIndex = Array.isArray(globalThis.__wasm_rquickjs_registered_loaders)
            ? globalThis.__wasm_rquickjs_registered_loaders.length
            : 0;
        await import(resolvePreloadImport(imports[i], cwd, cwdUrl));
        await awaitRegisteredLoadersFrom(loaderStartIndex);
    }
}

async function installExperimentalLoadersFromFlags(flags) {
    var loaders = experimentalLoadersFromFlags(flags || []);
    if (loaders.length === 0) return null;

    var previousLoaders = globalThis.__wasm_rquickjs_registered_loaders;
    var previousLoaderSnapshot = Array.isArray(previousLoaders) ? previousLoaders.slice() : null;
    var moduleBuiltin = await import('node:module');
    var urlBuiltin = require('node:url');
    var cwd = globalThis.process && typeof globalThis.process.cwd === 'function'
        ? globalThis.process.cwd()
        : '/home/node';
    var cwdUrl = urlBuiltin.pathToFileURL(cwd.endsWith('/') ? cwd : cwd + '/').href;
    var loaderStartIndex = Array.isArray(globalThis.__wasm_rquickjs_registered_loaders)
        ? globalThis.__wasm_rquickjs_registered_loaders.length
        : 0;

    for (var i = 0; i < loaders.length; i++) {
        moduleBuiltin.register(loaders[i], { parentURL: cwdUrl });
    }
    await awaitRegisteredLoadersFrom(loaderStartIndex);

    return function restoreExperimentalLoaders() {
        if (previousLoaders === undefined) {
            delete globalThis.__wasm_rquickjs_registered_loaders;
        } else if (previousLoaderSnapshot) {
            previousLoaders.length = 0;
            for (var i = 0; i < previousLoaderSnapshot.length; i++) {
                previousLoaders.push(previousLoaderSnapshot[i]);
            }
            globalThis.__wasm_rquickjs_registered_loaders = previousLoaders;
        } else {
            globalThis.__wasm_rquickjs_registered_loaders = previousLoaders;
        }
    };
}

function withSuppressedModuleRequireDiagnostics(fn) {
    if (typeof globalThis.__wasm_rquickjs_with_suppressed_module_require_diagnostics === 'function') {
        return globalThis.__wasm_rquickjs_with_suppressed_module_require_diagnostics(fn);
    }
    return fn();
}

function registeredLoaderEntrySpecifier(testPath) {
    if (
        !Array.isArray(globalThis.__wasm_rquickjs_registered_loaders) ||
        globalThis.__wasm_rquickjs_registered_loaders.length === 0
    ) {
        return testPath;
    }
    globalThis.__wasm_rquickjs_static_registered_loader_cache = Object.create(null);
    var urlBuiltin = require('node:url');
    // Node converts the CLI entry path to a file URL before loader hooks see it.
    // The rewritten import() owns resolve/load and static graph preparation.
    return urlBuiltin.pathToFileURL(testPath).href;
}

export const runTest = async (testPath) => {
    var restorePromise = null;
    var restoreArgv = null;
    var restoreCwd = null;
    var restoreLoaders = null;
    var hadPackageConditions = Object.prototype.hasOwnProperty.call(globalThis, '__wasm_rquickjs_package_conditions');
    var previousPackageConditions = globalThis.__wasm_rquickjs_package_conditions;

    if (globalThis.process) {
        var originalArgv = Array.isArray(globalThis.process.argv) ? globalThis.process.argv.slice() : null;
        var originalArgv0 = globalThis.process.argv0;
        var execPath = (typeof globalThis.process.execPath === 'string' && globalThis.process.execPath.length > 0)
            ? globalThis.process.execPath
            : 'node';
        var originalCwd = typeof globalThis.process.cwd === 'function' ? globalThis.process.cwd() : null;

        globalThis.process.argv = [execPath, testPath];
        globalThis.process.argv0 = execPath;
        if (typeof globalThis.process.chdir === 'function') {
            globalThis.process.chdir('/home/node');
        }

        restoreArgv = function restoreArgv() {
            if (originalArgv) {
                globalThis.process.argv = originalArgv;
            }
            globalThis.process.argv0 = originalArgv0;
        };
        restoreCwd = function restoreCwd() {
            if (originalCwd !== null && typeof globalThis.process.chdir === 'function') {
                try {
                    globalThis.process.chdir(originalCwd);
                } catch (_) {}
            }
        };
    }

    try {
        var flags = applyTestFlagsToProcess(testPath) || [];
        restoreLoaders = await installExperimentalLoadersFromFlags(flags);
        await installPreloadImportsFromFlags(flags);

        // Reset mustCall tracking for this test
        var commonMod;
        try {
            commonMod = withSuppressedModuleRequireDiagnostics(function() {
                return require('node:module')
                    .createRequire('/home/node/test/common/index.js')('/home/node/test/common/index.js');
            });
        } catch(e) {}
        if (commonMod && typeof commonMod._resetMustCalls === 'function') {
            commonMod._resetMustCalls();
        }

        restorePromise = installRejectionTracking();

        if (testPath.endsWith('.mjs')) {
            var testSpecifier = registeredLoaderEntrySpecifier(testPath);
            await import(testSpecifier);
        } else {
            // Use createRequire('/') so the test module gets parent: null,
            // simulating Node.js's behavior when running a script directly
            // (i.e., `node test.js` where module.parent is null).
            var testRequire = require('node:module').createRequire('/');
            testRequire(testPath);
        }
        // Await any pending async tests from node:test
        var testModule = withSuppressedModuleRequireDiagnostics(function() {
            return require('node:test');
        });
        if (testModule && typeof testModule._awaitPendingTests === 'function') {
            await testModule._awaitPendingTests();
        }
        // Drain pending async operations (streams, timers, etc.)
        // Check exit handlers and callback counts only after referenced work
        // finishes, using the same completion boundary as component exports.
        await awaitRuntimeIdle();
        // Run exit handlers after test completes normally
        if (globalThis.process && typeof globalThis.process._runExitHandlers === 'function') {
            globalThis.process._runExitHandlers(0);
        }

        var rejection = restorePromise();
        restorePromise = null;

        // Verify mustCall expectations first
        var common;
        try {
            common = withSuppressedModuleRequireDiagnostics(function() {
                return require('node:module')
                    .createRequire('/home/node/test/common/index.js')('/home/node/test/common/index.js');
            });
        } catch(e) {}
        var mustCallErrors = [];
        if (common && typeof common._checkMustCalls === 'function') {
            mustCallErrors = common._checkMustCalls();
        }

        // If we have both mustCall failures and an unhandled rejection,
        // show the rejection as it's likely the root cause
        if (rejection) {
            var errMsg = (rejection && rejection.stack) ? rejection.stack : String(rejection);
            if (mustCallErrors.length > 0) {
                return "FAIL: Unhandled promise rejection (likely cause of mustCall failure): " + errMsg;
            }
            return "FAIL: Unhandled promise rejection: " + errMsg;
        }

        if (mustCallErrors.length > 0) {
            return "FAIL: mustCall verification failed:\n" + mustCallErrors.join("\n");
        }
        return "PASS";
    } catch (e) {
        if (restorePromise) restorePromise();

        // Check for process.exit() sentinel
        if (e && e.__isProcessExit) {
            return "PASS";
        }

        var msg = (e && e.stack) ? e.stack : String(e);
        var errorMsg = (e && e.message) ? e.message : String(e);

        if (errorMsg.startsWith("SKIP:")) {
            return "SKIP: " + errorMsg.slice("SKIP:".length).trim();
        }

        var fullMsg = (e && e.message) ? (e.message + "\n" + msg) : msg;
        return "FAIL: " + fullMsg;
    } finally {
        if (restoreLoaders) {
            restoreLoaders();
        }
        if (hadPackageConditions) {
            globalThis.__wasm_rquickjs_package_conditions = previousPackageConditions;
        } else {
            delete globalThis.__wasm_rquickjs_package_conditions;
        }
        if (restoreCwd) {
            restoreCwd();
        }
        if (restoreArgv) {
            restoreArgv();
        }
    }
};

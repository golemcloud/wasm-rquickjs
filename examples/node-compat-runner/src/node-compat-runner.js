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

// Drain pending microtasks/timers by yielding multiple times.
// Many stream tests need several event loop turns to complete.
// Uses increasing delays to handle both quick microtask chains and slower timers.
function drainAsync() {
    var p = Promise.resolve();
    // First: 50 quick ticks for microtask chains
    for (var i = 0; i < 50; i++) {
        p = p.then(function() { return new Promise(function(r) { setTimeout(r, 0); }); });
    }
    // Then: 10 longer ticks for setTimeout-based tests (e.g., 100ms timers)
    for (var j = 0; j < 10; j++) {
        p = p.then(function() { return new Promise(function(r) { setTimeout(r, 50); }); });
    }
    // Final: 20 quick ticks for any remaining activity after timers
    for (var k = 0; k < 20; k++) {
        p = p.then(function() { return new Promise(function(r) { setTimeout(r, 0); }); });
    }
    return p;
}

// Track unhandled rejections from test top-level promise chains.
//
// Node.js tests typically follow this pattern:
//   (async () => { ... })().then(common.mustCall());
//
// If the async IIFE rejects, the .then() has no rejection handler, so the
// rejection is unhandled. The runtime's native promise rejection tracker
// (set via rquickjs 0.10's set_host_promise_rejection_tracker) emits
// process.emit('unhandledRejection', reason) which we listen for here.
var _firstUnhandledRejection = null;

function installRejectionTracking() {
    _firstUnhandledRejection = null;

    function onUnhandledRejection(reason) {
        if (!_firstUnhandledRejection) {
            _firstUnhandledRejection = reason;
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
        _firstUnhandledRejection = null;
        return rejection;
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
}

export const runTest = async (testPath) => {
    var restorePromise = null;
    var restoreArgv = null;

    if (globalThis.process) {
        var originalArgv = Array.isArray(globalThis.process.argv) ? globalThis.process.argv.slice() : null;
        var originalArgv0 = globalThis.process.argv0;
        var execPath = (typeof globalThis.process.execPath === 'string' && globalThis.process.execPath.length > 0)
            ? globalThis.process.execPath
            : 'node';

        globalThis.process.argv = [execPath, testPath];
        globalThis.process.argv0 = execPath;

        restoreArgv = function restoreArgv() {
            if (originalArgv) {
                globalThis.process.argv = originalArgv;
            }
            globalThis.process.argv0 = originalArgv0;
        };
    }

    try {
        applyTestFlagsToProcess(testPath);

        // Reset mustCall tracking for this test
        var commonMod;
        try {
            commonMod = require('/home/node/test/common/index.js');
        } catch(e) {}
        if (commonMod && typeof commonMod._resetMustCalls === 'function') {
            commonMod._resetMustCalls();
        }

        restorePromise = installRejectionTracking();

        if (testPath.endsWith('.mjs')) {
            await import(testPath);
        } else {
            // Use createRequire('/') so the test module gets parent: null,
            // simulating Node.js's behavior when running a script directly
            // (i.e., `node test.js` where module.parent is null).
            var testRequire = require('node:module').createRequire('/');
            testRequire(testPath);
        }
        // Await any pending async tests from node:test
        var testModule = require('node:test');
        if (testModule && typeof testModule._awaitPendingTests === 'function') {
            await testModule._awaitPendingTests();
        }
        // Drain pending async operations (streams, timers, etc.)
        await drainAsync();
        // Run exit handlers after test completes normally
        if (globalThis.process && typeof globalThis.process._runExitHandlers === 'function') {
            globalThis.process._runExitHandlers(0);
        }

        var rejection = restorePromise();
        restorePromise = null;

        // Verify mustCall expectations first
        var common;
        try {
            common = require('/home/node/test/common/index.js');
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
        if (restoreArgv) {
            restoreArgv();
        }
    }
};

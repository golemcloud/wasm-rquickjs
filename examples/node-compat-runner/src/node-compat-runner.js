// Node.js compatibility test runner.
// Executes a vendored Node.js test file via the CJS loader.
// The test file and common shim must be pre-populated in the WASI filesystem
// by the Rust test harness before invoking this function.
//
// Expected filesystem layout:
//   /tests/parallel/<test-file>.js   — the vendored Node.js test
//   /tests/common/index.js           — our common shim
//
// The test does require('../common') which resolves naturally to /tests/common/index.js.

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

export const runTest = async (testPath) => {
    try {
        // Reset mustCall tracking for this test
        var commonMod;
        try {
            commonMod = require('/tests/common/index.js');
        } catch(e) {}
        if (commonMod && typeof commonMod._resetMustCalls === 'function') {
            commonMod._resetMustCalls();
        }

        require(testPath);
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
        // Verify mustCall expectations
        var common;
        try {
            common = require('/tests/common/index.js');
        } catch(e) {}
        if (common && typeof common._checkMustCalls === 'function') {
            var mustCallErrors = common._checkMustCalls();
            if (mustCallErrors.length > 0) {
                return "FAIL: mustCall verification failed:\n" + mustCallErrors.join("\n");
            }
        }
        return "PASS";
    } catch (e) {
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
    }
};

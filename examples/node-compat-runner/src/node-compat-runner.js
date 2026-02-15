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

export const runTest = async (testPath) => {
    try {
        require(testPath);
        // Await any pending async tests from node:test
        var testModule = require('node:test');
        if (testModule && typeof testModule._awaitPendingTests === 'function') {
            await testModule._awaitPendingTests();
        }
        // Run exit handlers after test completes normally
        if (globalThis.process && typeof globalThis.process._runExitHandlers === 'function') {
            globalThis.process._runExitHandlers(0);
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

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

export const runTest = (testPath) => {
    try {
        require(testPath);
        return "PASS";
    } catch (e) {
        var msg = (e && e.stack) ? e.stack : String(e);
        var errorMsg = (e && e.message) ? e.message : String(e);

        if (errorMsg.startsWith("SKIP:")) {
            return "SKIP: " + errorMsg.slice("SKIP:".length).trim();
        }

        return "FAIL: " + msg;
    }
};

# Sinon Compatibility Test Results

**Package:** `sinon`
**Version:** `21.0.2`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — spy tracks function calls and return values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `cannot wstd::runtime::block_on inside an existing block_on!`
  - `Error: failed to run main module 'tmp/lib-test-sinon-01/target/wasm32-wasip1/debug/lib_sinon.wasm'`
  - `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** Runtime panic during module initialization (before test logic executes). Stack trace shows re-entrant blocking in timeout scheduling (`lib_sinon::builtin::timeout::native_module::schedule`).

### test-02-validation.js — stub behavior with withArgs and restore works
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `cannot wstd::runtime::block_on inside an existing block_on!`
  - `Error: failed to run main module 'tmp/lib-test-sinon-02/target/wasm32-wasip1/debug/lib_sinon.wasm'`
  - `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** Same runtime panic during module initialization; test body never runs.

### test-03-advanced.js — fake timers control timeout execution and Date.now
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `cannot wstd::runtime::block_on inside an existing block_on!`
  - `Error: failed to run main module 'tmp/lib-test-sinon-03/target/wasm32-wasip1/debug/lib_sinon.wasm'`
  - `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** Same runtime panic during module initialization; test body never runs.

### test-04-sandbox.js — sandbox replace and restore work correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `cannot wstd::runtime::block_on inside an existing block_on!`
  - `Error: failed to run main module 'tmp/lib-test-sinon-04/target/wasm32-wasip1/debug/lib_sinon.wasm'`
  - `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** Same runtime panic during module initialization; test body never runs.

### test-05-mocks.js — mock expectations verify exact call contracts
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `cannot wstd::runtime::block_on inside an existing block_on!`
  - `Error: failed to run main module 'tmp/lib-test-sinon-05/target/wasm32-wasip1/debug/lib_sinon.wasm'`
  - `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** Same runtime panic during module initialization; test body never runs.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None identified (failure occurs before API-level execution)
- Behavioral differences: Runtime aborts during initialization with nested `block_on` panic
- Blockers:
  - `wstd::runtime::block_on` re-entry panic prevents loading bundled Sinon modules
  - No Sinon API path can be validated in wasm-rquickjs until this runtime initialization issue is resolved

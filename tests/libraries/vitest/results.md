# Vitest Compatibility Test Results

**Package:** `vitest`
**Version:** `4.0.18`
**Tested on:** 2026-03-09

## Bundling

Rollup bundling succeeded for all 5 test files.

## Test Results

### test-01-basic.js — `vi.fn` call tracking and one-time return values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `cannot wstd::runtime::block_on inside an existing block_on!`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-vitest-01/target/wasm32-wasip1/debug/lib_vitest.wasm'`
- **Root cause:** Vitest module initialization triggers timer/runtime setup that causes nested `block_on` in the current wasm runtime.

### test-02-spy-restore.js — `vi.spyOn` override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `cannot wstd::runtime::block_on inside an existing block_on!`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-vitest-02/target/wasm32-wasip1/debug/lib_vitest.wasm'`
- **Root cause:** Same module-init panic before test logic executes.

### test-03-stub-global.js — `vi.stubGlobal` and `vi.unstubAllGlobals`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `cannot wstd::runtime::block_on inside an existing block_on!`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-vitest-03/target/wasm32-wasip1/debug/lib_vitest.wasm'`
- **Root cause:** Same module-init panic before test logic executes.

### test-04-wait-utils.js — `vi.waitFor` / `vi.waitUntil` standalone behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `cannot wstd::runtime::block_on inside an existing block_on!`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-vitest-04/target/wasm32-wasip1/debug/lib_vitest.wasm'`
- **Root cause:** Same module-init panic before test logic executes.

### test-05-runner-context.js — mock lifecycle helpers (`clearAllMocks`, `restoreAllMocks`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `cannot wstd::runtime::block_on inside an existing block_on!`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-vitest-05/target/wasm32-wasip1/debug/lib_vitest.wasm'`
- **Root cause:** Same module-init panic before test logic executes.

## Golem Compatibility

Vitest is primarily a Node/Vite-driven test runner intended to execute under the `vitest` CLI with worker/runtime context. In Golem applications, components export functions and are not executed through Vitest's runner model, so the package is not a practical fit for standard Golem usage.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing/unsupported behavior:
  - Vitest import path cannot initialize in wasm-rquickjs due to nested runtime `block_on` panic.
- Blockers:
  - All bundled test modules abort during wasm module initialization, so no Vitest API call can execute.

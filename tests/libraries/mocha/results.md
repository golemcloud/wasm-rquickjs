# Mocha Compatibility Test Results

**Package:** `mocha`
**Version:** `11.7.5`
**Tested on:** 2026-03-09

## Bundling

Rollup bundling succeeded for all 5 test files.

## Test Results

### test-01-basic.js — constructor and chainable options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: navigator is not defined`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-mocha-01/target/wasm32-wasip1/debug/lib_mocha.wasm'`
- **Root cause:** Mocha initialization executes browser-detection logic that reads `navigator`, which is not available in this runtime.

### test-02-suite-model.js — Suite/Test tree construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: navigator is not defined`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-mocha-02/target/wasm32-wasip1/debug/lib_mocha.wasm'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-03-bdd-interface.js — BDD interface programmatic suite definition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: navigator is not defined`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-mocha-03/target/wasm32-wasip1/debug/lib_mocha.wasm'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-04-reporters.js — built-in reporter registry and selection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: navigator is not defined`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-mocha-04/target/wasm32-wasip1/debug/lib_mocha.wasm'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-05-grep-hooks.js — grep/fgrep/invert/rootHooks configuration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: navigator is not defined`
- **Run error:** `Error: failed to run main module 'tmp/lib-test-mocha-05/target/wasm32-wasip1/debug/lib_mocha.wasm'`
- **Root cause:** Same module-initialization failure before test logic executes.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs / unsupported environment:
  - Global `navigator` expected during Mocha module initialization
- Blockers:
  - Mocha aborts at startup in wasm-rquickjs, preventing all API usage in this workflow

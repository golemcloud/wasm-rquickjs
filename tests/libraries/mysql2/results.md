# mysql2 Compatibility Test Results

**Package:** `mysql2`
**Version:** `3.19.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — escaping and SQL formatting helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime initialization fails before `run()` executes because `mysql2` expects a default export from `string_decoder`, which the current runtime module surface does not provide.

### test-02-constants-and-plugins.js — constants/charsets/auth plugin exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime initialization fails before `run()` executes because `mysql2` expects a default export from `string_decoder`, which the current runtime module surface does not provide.

### test-03-query-factory-and-cache.js — parser cache and query factory API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime initialization fails before `run()` executes because `mysql2` expects a default export from `string_decoder`, which the current runtime module surface does not provide.

### test-04-pool-and-cluster.js — pool and pool-cluster lifecycle without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime initialization fails before `run()` executes because `mysql2` expects a default export from `string_decoder`, which the current runtime module surface does not provide.

### test-05-promise-api.js — mysql2/promise utilities and pool wrappers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime initialization fails before `run()` executes because `mysql2` expects a default export from `string_decoder`, which the current runtime module surface does not provide.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `string_decoder` default export
- Behavioral differences: N/A (all failures occur during module initialization)
- Blockers:
  - All wrappers compiled successfully, but every `wasmtime run` failed during JS module initialization.
  - Exact runtime failure for all tests: `JavaScript error: Could not find export 'default' in module 'string_decoder'`.

`mysql2` offline API surface covered by these tests (escaping/formatting, constants, parser-cache controls, and pool/promise object lifecycle without live connections) works in Node.js, but the library cannot initialize in wasm-rquickjs due to the missing `string_decoder` default export.

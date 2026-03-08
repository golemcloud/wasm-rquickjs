# mysql2 Compatibility Test Results

**Package:** `mysql2`
**Version:** `3.19.0`
**Tested on:** 2026-03-08 (re-tested after `string_decoder` fix)
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — escaping and SQL formatting helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack:** `at createRequire (node:module:837:120)` → `at <anonymous> (bundle/script_module:24:33)`
- **Root cause:** The Rollup bundle calls `createRequire(import.meta.url)` but `import.meta.url` is `undefined` in the wasm-rquickjs runtime, causing `createRequire` to reject the argument during module initialization.

### test-02-constants-and-plugins.js — constants/charsets/auth plugin exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01: `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`.

### test-03-query-factory-and-cache.js — parser cache and query factory API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01: `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`.

### test-04-pool-and-cluster.js — pool and pool-cluster lifecycle without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01: `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`.

### test-05-promise-api.js — mysql2/promise utilities and pool wrappers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01: `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- **Previous blocker (fixed):** `Could not find export 'default' in module 'string_decoder'` — this no longer occurs.
- **Current blocker:** `import.meta.url` is `undefined` in the wasm-rquickjs runtime. The Rollup `@rollup/plugin-commonjs` plugin converts `mysql2`'s CJS `require()` calls into `createRequire(import.meta.url)`, which fails because the runtime does not provide `import.meta.url`.
- Missing APIs: `import.meta.url` support in the runtime
- Behavioral differences: N/A (all failures occur during module initialization)
- Blockers:
  - All wrappers compiled successfully, but every `wasmtime run` failed during JS module initialization.
  - The `string_decoder` issue is resolved, but the next blocker is that `mysql2`'s bundled code relies on `createRequire(import.meta.url)` which requires `import.meta.url` to be defined.

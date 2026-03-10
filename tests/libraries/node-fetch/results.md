# node-fetch Compatibility Test Results

**Package:** `node-fetch`
**Version:** `3.3.2`
**Tested on:** 2026-03-10
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Stack overflow → `wasm trap: out of bounds memory access`
- **Root cause:** QuickJS stack overflow during deeply recursive bundled module initialization.

### test-02-headers.js — header normalization and repeated header values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Stack overflow → `wasm trap: out of bounds memory access`
- **Root cause:** Same stack overflow during module initialization.

### test-03-request.js — Request construction, clone behavior, GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Stack overflow → `wasm trap: out of bounds memory access`
- **Root cause:** Same stack overflow during module initialization.

### test-04-response.js — Response static helpers and body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Stack overflow → `wasm trap: out of bounds memory access`
- **Root cause:** Same stack overflow during module initialization.

### test-05-formdata-abort.js — FormData round-trip and AbortController rejection path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Stack overflow → `wasm trap: out of bounds memory access`
- **Root cause:** Same stack overflow during module initialization.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- **Previous blocker (fixed):** `node:fs` missing `promises` named export — this is now resolved
- **Current blocker:** All 5 tests crash with a QuickJS stack overflow (~600 recursive `JS_CallInternal` frames) during bundled module initialization. The `node-fetch` polyfill chain is too deeply nested for the default WASM stack size.
- Potential workaround: Increasing wasmtime stack size with `--wasm max-wasm-stack=...`

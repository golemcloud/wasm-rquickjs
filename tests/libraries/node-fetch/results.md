# node-fetch Compatibility Test Results

**Package:** `node-fetch`
**Version:** `3.3.2`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`
- **Root cause:** Missing `node:fs.promises` export in wasm-rquickjs module surface during bundle initialization.

### test-02-headers.js — header normalization and repeated header values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`
- **Root cause:** Missing `node:fs.promises` export in wasm-rquickjs module surface during bundle initialization.

### test-03-request.js — Request construction, clone behavior, GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`
- **Root cause:** Missing `node:fs.promises` export in wasm-rquickjs module surface during bundle initialization.

### test-04-response.js — Response static helpers and body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`
- **Root cause:** Missing `node:fs.promises` export in wasm-rquickjs module surface during bundle initialization.

### test-05-formdata-abort.js — FormData round-trip and AbortController rejection path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`
- **Root cause:** Missing `node:fs.promises` export in wasm-rquickjs module surface during bundle initialization.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `node:fs.promises`
- Behavioral differences: N/A (all tests fail during module initialization before test logic executes)
- Blockers:
  - All wrapper crates compile successfully, but each component traps during startup while evaluating bundled module initialization code.
  - Exact runtime failure: `Failed to evaluate module initialization: JavaScript error: Could not find export 'promises' in module 'node:fs'`.

`node-fetch` itself works as expected on Node.js for the tested API surface (data URI fetches, headers, request/response helpers, FormData handling, and abort semantics). In wasm-rquickjs, the bundled module fails to initialize because `node:fs.promises` is missing, so none of the runtime tests execute.

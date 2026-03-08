# undici Compatibility Test Results

**Package:** `undici`
**Version:** `7.22.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (module initialization failed)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` (at `createRequire (node:module:837:120)` / `bundle/script_module:6:33`)

### test-02-headers.js — header normalization, mutation, and iteration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (module initialization failed)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` (at `createRequire (node:module:837:120)` / `bundle/script_module:6:33`)

### test-03-request.js — Request construction, clone behavior, and GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (module initialization failed)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` (at `createRequire (node:module:837:120)` / `bundle/script_module:6:33`)

### test-04-response.js — Response static helpers and in-memory body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (module initialization failed)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` (at `createRequire (node:module:837:120)` / `bundle/script_module:6:33`)

### test-05-errors.js — undici error hierarchy and metadata fields
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (module initialization failed)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` (at `createRequire (node:module:837:120)` / `bundle/script_module:6:33`)

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `node:module.createRequire` initialization context (`filename` is `undefined`)
- Behavioral differences: N/A (all wasm runs abort during module initialization)
- Blockers:
  - All wasm runs abort before `run()` executes because `undici` initialization calls `node:module.createRequire` without a valid filename/import URL context.
  - `wasmtime` reports a panic from module initialization followed by `wasm trap: wasm unreachable instruction executed`.

`undici` works as expected on Node.js for the tested offline API surface (data URI fetches, Headers/Request/Response web APIs, and built-in error types). In wasm-rquickjs, all generated components build successfully but fail uniformly at JS module initialization.

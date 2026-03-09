# undici Compatibility Test Results

**Package:** `undici`
**Version:** `7.22.0`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'status' of undefined` at `run (bundle/script_module:35108:24)`
- **Root cause:** The `createRequire` issue is fixed and module initialization succeeds, but fetching a `data:` URI returns `undefined` instead of a `Response` object, so accessing `.status` throws.

### test-02-headers.js — header normalization, mutation, and iteration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-request.js — Request construction, clone behavior, and GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-response.js — Response static helpers and in-memory body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — undici error hierarchy and metadata fields
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 4/5
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- Remaining failure: test-01 — `fetch()` with a `data:` URI returns `undefined` instead of a `Response` object
- Behavioral differences: `data:` URI fetches are not supported by the runtime's `fetch` implementation

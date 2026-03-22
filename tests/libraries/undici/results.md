# undici Compatibility Test Results

**Package:** `undici`
**Version:** `7.22.0`
**Tested on:** 2026-03-20
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'status' of undefined` at `run (bundle/script_module:35108:24)`
- **Root cause:** Fetching a `data:` URI via undici's `fetch()` returns `undefined` instead of a `Response` object. The runtime's `fetch` implementation does not support `data:` URI scheme.

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

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 4/5
- Integration tests: N/A — not created (would require mock server for HTTP client testing)
- Remaining failure: test-01 — `fetch()` with a `data:` URI returns `undefined` instead of a `Response` object
- Behavioral differences: `data:` URI fetches are not supported by the runtime's `fetch` implementation
- All non-fetch features work: Headers, Request, Response, error classes

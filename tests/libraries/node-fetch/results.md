# node-fetch Compatibility Test Results

**Package:** `node-fetch`
**Version:** `3.3.2`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-02-headers.js — header normalization and repeated header values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-03-request.js — Request construction, clone behavior, GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-04-response.js — Response static helpers and body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-05-formdata-abort.js — FormData round-trip and AbortController rejection path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution was not reached)
- Behavioral differences: N/A (runtime execution was not reached)
- Blockers:
  - Wrapper crate compilation fails before any test can run in `wasmtime`.
  - Exact build failure: `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `fatal error: 'stdio.h' file not found` for target `wasm32-wasip1`.

`node-fetch` itself works as expected on Node.js for the tested API surface (data URI fetches, headers, request/response helpers, FormData handling, and abort semantics). Compatibility in wasm-rquickjs could not be validated because all generated wrapper crates failed during compilation.

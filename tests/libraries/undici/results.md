# undici Compatibility Test Results

**Package:** `undici`
**Version:** `7.22.0`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — fetch data: URIs and parse text/JSON responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-02-headers.js — header normalization, mutation, and iteration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-03-request.js — Request construction, clone behavior, and GET/body validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-04-response.js — Response static helpers and in-memory body readers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-05-errors.js — undici error hierarchy and metadata fields
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

`undici` works as expected on Node.js for the tested offline API surface (data URI fetches, Headers/Request/Response web APIs, and built-in error types). Compatibility in wasm-rquickjs could not be validated because all generated wrapper crates failed during compilation.

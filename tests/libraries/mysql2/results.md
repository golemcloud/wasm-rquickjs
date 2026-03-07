# mysql2 Compatibility Test Results

**Package:** `mysql2`
**Version:** `3.19.0`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — escaping and SQL formatting helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-02-constants-and-plugins.js — constants/charsets/auth plugin exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-03-query-factory-and-cache.js — parser cache and query factory API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-04-pool-and-cluster.js — pool and pool-cluster lifecycle without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-05-promise-api.js — mysql2/promise utilities and pool wrappers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution was not reached)
- Behavioral differences: N/A (runtime execution was not reached)
- Blockers:
  - Every generated wrapper crate failed during `cargo-component build` before `wasmtime run`.
  - Exact build failure: `error: failed to run custom build command for libsqlite3-sys v0.36.0` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found` while targeting `wasm32-wasip1`.

`mysql2` offline API surface covered by these tests (escaping/formatting, constants, parser-cache controls, and pool/promise object lifecycle without live connections) works in Node.js, but wasm-rquickjs compatibility could not be validated due to wrapper compilation failure.

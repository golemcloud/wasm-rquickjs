# pg Compatibility Test Results

**Package:** `pg`
**Version:** `8.20.0`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-escape-utils.js — SQL escaping helpers (`escapeIdentifier`, `escapeLiteral`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-02-connection-config.js — client connection string/config parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-03-type-parsers.js — global type parser override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-04-client-overrides.js — client-local type parser overrides
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-05-pool-and-native.js — pool/query object initialization without DB
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

`pg` offline API surface covered by these tests (escaping utilities, config parsing, type parser customization, and object initialization) works in Node.js, but wasm-rquickjs compatibility could not be validated due to wrapper compilation failure.

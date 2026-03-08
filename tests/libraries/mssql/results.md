# mssql Compatibility Test Results

**Package:** `mssql`
**Version:** `9.1.1`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — type inference and constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-02-validation.js — table metadata helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-03-advanced.js — connection string parsing and pool object init
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-04-request-params.js — request parameter APIs and template expansion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

### test-05-shared-state.js — type map, Promise override, value handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `error: failed to run custom build command for libsqlite3-sys v0.36.0`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1`; `libsqlite3-sys` compilation fails with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`.

## Untestable Features

The following features could not be tested without an external SQL Server instance:

- **Live connections and queries** (`connect`, `query`, `batch`, `execute`) — Require a reachable SQL Server endpoint and credentials.
- **Transactions and prepared statements against a real database** — Require server-side execution state.
- **Bulk insert execution** (`request.bulk(table)`) — Requires a live database connection.

To fully test these features, a user would need to:
1. Provision a SQL Server instance reachable from the test environment.
2. Create credentials and target schema.
3. Provide connection configuration for `mssql`.
4. Re-run dedicated integration tests that perform actual DB operations.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution was not reached)
- Behavioral differences: N/A (runtime execution was not reached)
- Blockers:
  - Every generated wrapper crate failed during `cargo-component build` before `wasmtime run`.
  - Exact build failure: `error: failed to run custom build command for libsqlite3-sys v0.36.0` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found` while targeting `wasm32-wasip1`.

`mssql` offline API surface covered by these tests works in Node.js, but wasm-rquickjs compatibility could not be validated due to wrapper compilation failure.

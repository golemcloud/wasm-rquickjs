# knex Compatibility Test Results

**Package:** `knex`
**Version:** `3.1.0`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic SELECT query compilation with filters/order/limit
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-02-insert-upsert.js — INSERT with ON CONFLICT MERGE and RETURNING SQL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-03-schema-ddl.js — schema builder CREATE TABLE DDL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-04-raw-and-ref.js — raw SQL fragments and identifier references
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-05-builder-utils.js — query builder clone immutability and binding isolation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution was not reached)
- Behavioral differences: N/A (runtime execution was not reached)
- Blockers:
  - All generated wrapper crates fail to compile before `wasmtime` execution.
  - Exact build failure: `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `fatal error: 'stdio.h' file not found` while targeting `wasm32-wasip1`.

`knex` query/schema compilation features worked as expected on Node.js for the tested offline API surface, but wasm-rquickjs compatibility could not be validated due to wrapper compilation failure.

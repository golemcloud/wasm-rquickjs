# knex Compatibility Test Results

**Package:** `knex`
**Version:** `3.1.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic SELECT query compilation with filters/order/limit
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-insert-upsert.js — INSERT with ON CONFLICT MERGE and RETURNING SQL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-schema-ddl.js — schema builder CREATE TABLE DDL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-raw-and-ref.js — raw SQL fragments and identifier references
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-builder-utils.js — query builder clone immutability and binding isolation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None

All knex offline query/schema compilation features work correctly in wasm-rquickjs. The previous blocker (`node:string_decoder` missing default export) has been resolved.

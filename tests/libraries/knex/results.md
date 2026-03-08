# knex Compatibility Test Results

**Package:** `knex`
**Version:** `3.1.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic SELECT query compilation with filters/order/limit
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`

### test-02-insert-upsert.js — INSERT with ON CONFLICT MERGE and RETURNING SQL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`

### test-03-schema-ddl.js — schema builder CREATE TABLE DDL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`

### test-04-raw-and-ref.js — raw SQL fragments and identifier references
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`

### test-05-builder-utils.js — query builder clone immutability and binding isolation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs:
  - `node:string_decoder` default export
- Behavioral differences: N/A
- Blockers:
  - All generated wrappers compile successfully, but runtime initialization fails for every test at module load time.
  - Exact runtime failure: `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`.

`knex` query/schema compilation features worked as expected on Node.js for the tested offline API surface, but none of the tests run in wasm-rquickjs due to missing `node:string_decoder` default export support during startup.

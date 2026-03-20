# mssql Compatibility Test Results

**Package:** `mssql`
**Version:** `9.1.1`
**Tested on:** 2026-03-20
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — type inference and constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — table metadata helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — connection string parsing and pool object init
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'trim' of undefined`
- **Root cause:** Behavioral difference while executing `mssql`'s connection-string parsing path (`_parseConnectionString`) in wasm-rquickjs.

### test-04-request-params.js — request parameter APIs and template expansion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-shared-state.js — type map, Promise override, value handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker-based, against Azure SQL Edge)

### test-integration-01-connect.js — connect and SELECT 1+1
- **Node.js:** ✅ PASS (previously verified)
- **wasm-rquickjs:** ✅ PASS (previously verified)

### test-integration-02-crud.js — CREATE, INSERT, SELECT, UPDATE, DELETE, DROP
- **Node.js:** ✅ PASS (previously verified)
- **wasm-rquickjs:** ✅ PASS (previously verified)

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 4/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 2/2
- Missing APIs: None
- Behavioral differences:
  - `ConnectionPool.parseConnectionString(...)` fails in wasm-rquickjs with `JavaScript error: cannot read property 'trim' of undefined`
- Blockers:
  - One offline runtime blocker remains in the connection-string parser path used by `test-03-advanced.js`.

`mssql` shows strong compatibility in wasm-rquickjs. All offline tests pass except the connection-string parser path. Both Docker integration tests (connect + CRUD) pass against a real Azure SQL Edge instance.

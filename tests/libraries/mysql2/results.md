# mysql2 Compatibility Test Results

**Package:** `mysql2`
**Version:** `3.19.0`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — escaping and SQL formatting helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-constants-and-plugins.js — constants/charsets/auth plugin exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-query-factory-and-cache.js — parser cache and query factory API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-pool-and-cluster.js — pool and pool-cluster lifecycle without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-promise-api.js — mysql2/promise utilities and pool wrappers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Requires:** Docker with `docker compose up -d --wait` in this directory.

**MySQL:** 8.0 with `--default-authentication-plugin=mysql_native_password`, host port 33061 → container port 3306.

### test-integration-01-connect.js — createConnection and SELECT 1+1
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — CREATE TABLE, INSERT, SELECT, UPDATE, DELETE, DROP TABLE
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 2/2
- Previous blockers (`string_decoder` missing default export, `createRequire(import.meta.url)` failure) are **fixed**
- Missing APIs: None
- Behavioral differences: None observed

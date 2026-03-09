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

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Previous blockers (`string_decoder` missing default export, `createRequire(import.meta.url)` failure) are **fixed**
- Missing APIs: None
- Behavioral differences: None observed

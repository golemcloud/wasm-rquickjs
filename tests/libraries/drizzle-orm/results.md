# Drizzle ORM Compatibility Test Results

**Package:** `drizzle-orm`
**Version:** `0.45.1`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Query builder compiles filtered and ordered select SQL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Placeholder handling and runtime parameter filling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — Relations metadata extraction and normalization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-entities.js — Entity/SQL runtime type guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-aggregates.js — Aggregate/group-by/having SQL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 5/5
- Missing APIs: None observed in covered API surface
- Behavioral differences: None observed
- Blockers: None

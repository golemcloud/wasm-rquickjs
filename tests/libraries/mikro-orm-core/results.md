# MikroORM Core Compatibility Test Results

**Package:** `@mikro-orm/core`
**Version:** `6.6.9`
**Tested on:** 2026-03-19
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Utils merge/asArray/equals/hash behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-entity-schema.js — EntitySchema metadata and constraints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-naming-strategies.js — EntityCase and Underscore naming strategy behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-cache-fragment.js — MemoryCacheAdapter and raw fragment creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-contexts.js — RequestContext and TransactionContext state propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass successfully

# Sequelize Compatibility Test Results

**Package:** `sequelize`
**Version:** `6.37.8`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — DataTypes validate values and render SQL types
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Output:** `PASS: DataTypes validate values and render SQL types`

### test-02-validation.js — Op symbols and SQL expression builders are usable
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Output:** `PASS: Op symbols and SQL expression builders are usable`

### test-03-advanced.js — Sequelize error hierarchy constructs and preserves inheritance
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Output:** `PASS: Sequelize error hierarchy constructs and preserves inheritance`

### test-04-model-build.js — Model.build supports in-memory instance state and change tracking
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Output:** `PASS: Model.build supports in-memory instance state and change tracking`

### test-05-hooks.js — Hook registration and exported constants are available
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Output:** `PASS: Hook registration and exported constants are available`

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 5/5
- Missing APIs: None in tested surface
- Behavioral differences: None observed in tested surface
- Blockers: None for tested offline ORM features

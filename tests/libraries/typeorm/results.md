# TypeORM Compatibility Test Results

**Package:** `typeorm`
**Version:** `0.3.28`
**Tested on:** 2026-03-20
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — EntitySchema captures table/column/index definitions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The "path" argument must be of type string. Received undefined` at `ERR_INVALID_ARG_TYPE` → `validateString` → `dirname (node:path:1040:20)` → `resolve (bundle/script_module:5870:32)` → `appRootPath$1`
- **Root cause:** The `app-root-path` library (a TypeORM dependency) passes `undefined` to `path.dirname` during module initialization, because it cannot resolve a filesystem root in the WASM environment.

### test-02-validation.js — Decorator validation and metadata registration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `app-root-path` / `path.dirname(undefined)` failure as test-01.

### test-03-advanced.js — Find operators and instance checks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `app-root-path` / `path.dirname(undefined)` failure as test-01.

### test-04-naming-strategy.js — DefaultNamingStrategy output stability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `app-root-path` / `path.dirname(undefined)` failure as test-01.

### test-05-find-options.js — FindOptionsUtils option-shape detection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `app-root-path` / `path.dirname(undefined)` failure as test-01.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- **Blocker:** All bundles fail during initialization when the `app-root-path` library (a TypeORM dependency) calls `path.dirname(undefined)`. The `app-root-path` library tries to resolve a module's filesystem path using `require.resolve` or `__dirname`-style lookups; in the WASM environment these resolve to `undefined`, which then fails validation in `path.dirname`.
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: All bundles fail during initialization via `app-root-path` → `path.dirname(undefined)`.

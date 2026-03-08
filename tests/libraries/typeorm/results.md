# TypeORM Compatibility Test Results

**Package:** `typeorm`
**Version:** `0.3.28`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — EntitySchema captures table/column/index definitions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** The bundled module calls `node:module.createRequire(...)` with an undefined filename during module initialization, causing the component to panic before `run()` executes.

### test-02-validation.js — Decorator validation and metadata registration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `node:module.createRequire(...)` undefined filename failure during module initialization.

### test-03-advanced.js — Find operators and instance checks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `node:module.createRequire(...)` undefined filename failure during module initialization.

### test-04-naming-strategy.js — DefaultNamingStrategy output stability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `node:module.createRequire(...)` undefined filename failure during module initialization.

### test-05-find-options.js — FindOptionsUtils option-shape detection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `node:module.createRequire(...)` undefined filename failure during module initialization.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: `node:module.createRequire` compatibility gap for this bundled usage pattern (`filename` argument resolution)
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: All bundles panic during initialization in `createRequire` before exported `run()` can be invoked.

# Prisma Client Compatibility Test Results

**Package:** `@prisma/client`
**Version:** `7.4.2`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Setup Notes

`@prisma/client` requires generated artifacts. Before running tests, a minimal Prisma schema was added in `prisma/schema.prisma` and `npx prisma generate` was executed to produce `.prisma/client/default`.

## Test Results

### test-01-basic.js — Prisma.sql parameterized fragments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime init)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Prisma's bundled runtime calls `node:module.createRequire(import.meta.url)`, but `import.meta.url` is undefined in the wasm-rquickjs module init path, which causes a panic before test code runs.

### test-02-validation.js — Prisma.join/raw/empty composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime init)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `createRequire(import.meta.url)` initialization failure.

### test-03-advanced.js — Prisma.validator and Prisma.skip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime init)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `createRequire(import.meta.url)` initialization failure.

### test-04-decimal-nulls.js — Prisma.Decimal and null sentinels
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime init)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `createRequire(import.meta.url)` initialization failure.

### test-05-errors-extension.js — Error types and defineExtension
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime init)
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same `createRequire(import.meta.url)` initialization failure.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: `node:module.createRequire` with valid `import.meta.url` context
- Behavioral differences: Module initialization panics before user test code executes
- Blockers: `@prisma/client` bundle assumes Node-style `import.meta.url` for `createRequire`; wasm-rquickjs provides `undefined` there during module init

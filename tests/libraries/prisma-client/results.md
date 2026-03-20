# Prisma Client Compatibility Test Results

**Package:** `@prisma/client`
**Version:** `7.4.2`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Setup Notes

`@prisma/client` requires generated artifacts. Before running tests, a minimal Prisma schema was added in `prisma/schema.prisma` and `npx prisma generate` was executed to produce `.prisma/client/default`.

## Test Results

### test-01-basic.js — Prisma.sql parameterized fragments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Prisma.join/raw/empty composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — Prisma.validator and Prisma.skip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-decimal-nulls.js — Prisma.Decimal and null sentinels
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors-extension.js — Error types and defineExtension
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 5/5
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- Missing APIs: None
- Behavioral differences: None observed

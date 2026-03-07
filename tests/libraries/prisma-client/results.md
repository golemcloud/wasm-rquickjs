# Prisma Client Compatibility Test Results

**Package:** `@prisma/client`
**Version:** `7.4.2`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Setup Notes

`@prisma/client` requires generated artifacts. Before running tests, a minimal Prisma schema was added in `prisma/schema.prisma` and `npx prisma generate` was executed to produce `.prisma/client/default`.

## Test Results

### test-01-basic.js — Prisma.sql parameterized fragments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails for `wasm32-wasip1` in transitive `libsqlite3-sys`; component is never produced.

### test-02-validation.js — Prisma.join/raw/empty composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` build failure blocks WASM compilation.

### test-03-advanced.js — Prisma.validator and Prisma.skip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` build failure blocks WASM compilation.

### test-04-decimal-nulls.js — Prisma.Decimal and null sentinels
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` build failure blocks WASM compilation.

### test-05-errors-extension.js — Error types and defineExtension
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` build failure blocks WASM compilation.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime not reached)
- Behavioral differences: N/A (runtime not reached)
- Blockers: `cargo-component build` fails in `libsqlite3-sys` for all wrappers (`stdio.h` missing for `wasm32-wasip1`)

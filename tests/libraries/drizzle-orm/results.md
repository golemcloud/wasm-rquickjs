# Drizzle ORM Compatibility Test Results

**Package:** `drizzle-orm`
**Version:** `0.45.1`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Query builder compiles filtered and ordered select SQL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails during `cargo-component build` for `wasm32-wasip1` in transitive dependency `libsqlite3-sys`.

### test-02-validation.js — Placeholder handling and runtime parameter filling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails during `cargo-component build` for `wasm32-wasip1` in transitive dependency `libsqlite3-sys`.

### test-03-advanced.js — Relations metadata extraction and normalization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails during `cargo-component build` for `wasm32-wasip1` in transitive dependency `libsqlite3-sys`.

### test-04-entities.js — Entity/SQL runtime type guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails during `cargo-component build` for `wasm32-wasip1` in transitive dependency `libsqlite3-sys`.

### test-05-aggregates.js — Aggregate/group-by/having SQL generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails during `cargo-component build` for `wasm32-wasip1` in transitive dependency `libsqlite3-sys`.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution not reached)
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: Every generated wrapper crate fails to compile for `wasm32-wasip1` because `libsqlite3-sys` cannot find C standard headers (`stdio.h`).

# TypeORM Compatibility Test Results

**Package:** `typeorm`
**Version:** `0.3.28`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — EntitySchema captures table/column/index definitions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation for `wasm32-wasip1` fails in transitive `libsqlite3-sys` before producing a component.

### test-02-validation.js — Decorator validation and metadata registration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-03-advanced.js — Find operators and instance checks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-04-naming-strategy.js — DefaultNamingStrategy output stability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-05-find-options.js — FindOptionsUtils option-shape detection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution not reached)
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: `cargo-component build` fails for all generated wrappers because `libsqlite3-sys` cannot compile for `wasm32-wasip1` (`stdio.h` missing).

# MikroORM Core Compatibility Test Results

**Package:** `@mikro-orm/core`
**Version:** `6.6.9`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Utils merge/asArray/equals/hash behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `cargo:warning=sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation for `wasm32-wasip1` fails in transitive `libsqlite3-sys` before producing a component.

### test-02-entity-schema.js — EntitySchema metadata and constraints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `cargo:warning=sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-03-naming-strategies.js — EntityCase and Underscore naming strategy behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `cargo:warning=sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-04-cache-fragment.js — MemoryCacheAdapter and raw fragment creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `cargo:warning=sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

### test-05-contexts.js — RequestContext and TransactionContext state propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `cargo:warning=sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compilation failure prevents component creation.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution not reached)
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: `cargo-component build` fails for all generated wrappers because transitive `libsqlite3-sys` cannot compile for `wasm32-wasip1` (`stdio.h` missing).

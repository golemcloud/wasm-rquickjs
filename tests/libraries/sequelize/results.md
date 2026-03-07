# Sequelize Compatibility Test Results

**Package:** `sequelize`
**Version:** `6.37.8`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — DataTypes validate values and render SQL types
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'`
- **Build detail:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Generated wrapper crate fails to compile for `wasm32-wasip1` because transitive `libsqlite3-sys` C compilation cannot find the WASI C headers.

### test-02-validation.js — Op symbols and SQL expression builders are usable
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'`
- **Build detail:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure blocks component creation.

### test-03-advanced.js — Sequelize error hierarchy constructs and preserves inheritance
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'`
- **Build detail:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure blocks component creation.

### test-04-model-build.js — Model.build supports in-memory instance state and change tracking
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'`
- **Build detail:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure blocks component creation.

### test-05-hooks.js — Hook registration and exported constants are available
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (compile-time)
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'`
- **Build detail:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure blocks component creation.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution not reached)
- Behavioral differences: N/A (runtime execution not reached)
- Blockers: `cargo-component build` fails for all generated wrappers because transitive `libsqlite3-sys` cannot compile for `wasm32-wasip1` (`stdio.h` missing).

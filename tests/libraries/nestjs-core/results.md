# NestJS Core Compatibility Test Results

**Package:** `@nestjs/core`
**Version:** `11.1.16`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — createApplicationContext resolves a basic injectable service
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Following the required workflow (`default = ["http", "sqlite"]`), `cargo-component build` fails when compiling `libsqlite3-sys` for `wasm32-wasip1` in this environment, so the component is never produced for runtime execution.

### test-02-providers.js — value and factory providers resolve correctly with token injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same compile-time failure in `libsqlite3-sys` before the WASM component can be generated.

### test-03-lifecycle.js — module/application lifecycle hooks run during init and close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same compile-time failure in `libsqlite3-sys` before the WASM component can be generated.

### test-04-reflector.js — Reflector reads metadata from SetMetadata and createDecorator
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same compile-time failure in `libsqlite3-sys` before the WASM component can be generated.

### test-05-modules.js — imported module exports are available to consumer module providers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same compile-time failure in `libsqlite3-sys` before the WASM component can be generated.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (blocked at wrapper compile step)
- Missing APIs: Not determined (runtime execution did not start)
- Behavioral differences: Not measurable (WASM components were not produced)
- Blockers:
  - Required wrapper feature set `default = ["http", "sqlite"]` fails to compile in this environment due `libsqlite3-sys` on `wasm32-wasip1`
  - `wasmtime run` cannot be executed because no `.wasm` artifacts are generated

## Execution Notes

- Per workflow, each bundled test (`test-01` through `test-05`) was processed independently with:
  1. `generate-wrapper-crate`
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run` (attempted, but skipped because step 3 failed)
- All five wrappers failed with the same `libsqlite3-sys` compile error.

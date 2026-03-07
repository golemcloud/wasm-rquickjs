# NestJS Common Compatibility Test Results

**Package:** `@nestjs/common`
**Version:** `11.1.16`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — core controller and route decorators attach expected metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Following the required workflow (`default = ["http", "sqlite"]`), `cargo-component build` fails when compiling `libsqlite3-sys` for `wasm32-wasip1`, so no WASM component is produced.

### test-02-validation.js — HttpException and built-in HTTP exceptions return consistent response bodies
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure before the component can be generated.

### test-03-advanced.js — built-in parsing and default-value pipes transform and validate values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure before the component can be generated.

### test-04-reflector.js — ValidationPipe transforms DTOs and rejects invalid/extra properties
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure before the component can be generated.

### test-05-modules.js — module builder, forwardRef, applyDecorators, and Logger are usable standalone
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper compile step)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` compile failure before the component can be generated.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (blocked at wrapper compile step)
- Missing APIs: Not determined (runtime execution did not start)
- Behavioral differences: Not measurable (WASM components were not produced)
- Blockers:
  - Required wrapper feature set `default = ["http", "sqlite"]` fails to compile in this environment because `libsqlite3-sys` cannot build for `wasm32-wasip1` (`stdio.h` missing)
  - `wasmtime run` could not be executed for any test because `cargo-component build` failed first

## Execution Notes

- Per workflow, each bundled test (`test-01` through `test-05`) was processed independently with:
  1. `generate-wrapper-crate`
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run` (not reachable because step 3 failed)
- All five wrappers failed with the same `libsqlite3-sys` compile error.

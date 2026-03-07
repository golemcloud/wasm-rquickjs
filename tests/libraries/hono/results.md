# Hono Compatibility Test Results

**Package:** `hono`
**Version:** `4.10.5`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic routing and path parameter extraction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Following the required workflow (`default = ["http", "sqlite"]`), `cargo-component build` fails in `libsqlite3-sys` for `wasm32-wasip1`, so no component is produced.

### test-02-cookies.js — Cookie parse/serialize and signed-cookie verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-03-jwt.js — JWT sign/verify/decode (HS256)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-04-html-cors.js — HTML escaping and CORS middleware headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-05-validator.js — Validator, `HTTPException`, and secure headers middleware
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

## Golem Compatibility

Hono supports server adapters (`app.fire()` / runtime-specific `serve`) but can also run as an in-process fetch handler without binding a port. In this test set, only non-server APIs were exercised (`app.request`, cookie utils, JWT utils, middleware behavior), which matches the Golem execution model.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (blocked at wrapper compile step)
- Missing APIs: Not measurable because wrapper compilation failed before runtime execution
- Behavioral differences: Not measurable because wrapper compilation failed before runtime execution
- Blockers:
  - Required wrapper feature set `default = ["http", "sqlite"]` fails to compile in this environment due to `libsqlite3-sys` on `wasm32-wasip1`

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All five wrappers failed at `cargo-component build` with the same `libsqlite3-sys` compile error, so no `wasmtime run` invocation was possible.

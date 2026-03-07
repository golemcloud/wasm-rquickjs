# Koa Compatibility Test Results

**Package:** `koa`
**Version:** `3.1.2`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic middleware callback response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Following the required workflow (`default = ["http", "sqlite"]`), `cargo-component build` fails in `libsqlite3-sys` for `wasm32-wasip1`, so the component is not produced.

### test-02-error-handling.js — `ctx.throw` status/message handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-03-request-parsing.js — Proxy-aware request parsing and subdomain handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-04-response-helpers.js — Response headers, vary, attachment, and body metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

### test-05-middleware-order.js — Middleware onion order and `ctx.state` propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Same `libsqlite3-sys` wrapper compile failure before runtime execution.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (blocked at wrapper compile step)
- Missing APIs: Not measurable because wrapper compilation failed before runtime execution
- Behavioral differences: Not measurable because wrapper compilation failed before runtime execution
- Blockers:
  - Required wrapper feature set `default = ["http", "sqlite"]` fails to compile in this environment due `libsqlite3-sys` on `wasm32-wasip1`
  - Koa primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All five wrappers failed with the same `libsqlite3-sys` compile error, so no `wasmtime run` invocation was possible.

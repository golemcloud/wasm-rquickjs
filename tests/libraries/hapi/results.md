# Hapi Compatibility Test Results

**Package:** `@hapi/hapi`
**Version:** `21.4.7`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic route registration and inject request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (panic at `src/internal.rs:521:41`, then `wasm trap: wasm 'unreachable' instruction executed`)
- **Root cause:** The bundled Hapi module fails at runtime during JS export invocation in wasm-rquickjs (`Heavy` path in `bundle/script_module`), before the test logic can execute.

### test-02-auth.js — Auth strategy and protected route execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (panic at `src/internal.rs:521:41`, then `wasm trap: wasm 'unreachable' instruction executed`)
- **Root cause:** Same runtime initialization failure in bundled Hapi path before test execution.

### test-03-method-cache.js — `server.method` caching and memoization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (panic at `src/internal.rs:521:41`, then `wasm trap: wasm 'unreachable' instruction executed`)
- **Root cause:** Same runtime initialization failure in bundled Hapi path before test execution.

### test-04-plugin-decorate.js — Plugin registration, expose, and toolkit decoration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (panic at `src/internal.rs:521:41`, then `wasm trap: wasm 'unreachable' instruction executed`)
- **Root cause:** Same runtime initialization failure in bundled Hapi path before test execution.

### test-05-routing-introspection.js — Route lookup/match/table introspection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (panic at `src/internal.rs:521:41`, then `wasm trap: wasm 'unreachable' instruction executed`)
- **Root cause:** Same runtime initialization failure in bundled Hapi path before test execution.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (all fail during runtime initialization)
- Missing APIs: Not directly exposed; failure is a JS runtime incompatibility (`JavaScript error: not a function`) in bundled Hapi initialization
- Behavioral differences: Hapi bundle initializes successfully on Node.js but traps in wasm-rquickjs before request/inject logic runs
- Blockers:
  - Runtime failure for every bundle invocation: `JavaScript error: not a function` in `bundle/script_module` (`Heavy` frame), causing panic and wasm trap
  - Hapi primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All five wrappers compiled successfully; each `wasmtime run` failed with the same runtime panic (`JavaScript error: not a function`) and trapped with `wasm 'unreachable'`.

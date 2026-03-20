# Koa Compatibility Test Results

**Package:** `koa`
**Version:** `3.1.2`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic middleware callback response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `callSiteLocation (bundle/script_module:937:17)` → `depd (bundle/script_module:774:32)` → `requireHttpErrors$1` → `requireApplication`
- **Root cause:** The `createRequire` issue is fixed. The `depd` library (Koa dependency) calls a function that is `not a function` in the wasm-rquickjs runtime — same issue as Express.

### test-02-error-handling.js — `ctx.throw` status/message handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-03-request-parsing.js — Proxy-aware request parsing and subdomain handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-04-response-helpers.js — Response headers, vary, attachment, and body metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-05-middleware-order.js — Middleware onion order and `ctx.state` propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- **Current blocker:** The `depd` library (shared dependency with Express) calls `callSiteLocation` which invokes a function that is `not a function` in the wasm-rquickjs runtime.
- Behavioral differences: Not measurable due to initialization failure.
- Blockers:
  - `depd` library relies on V8-specific stack trace APIs or similar functionality not available in QuickJS
  - Koa primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All five wrappers compiled, but every `wasmtime run` failed during module initialization with the same `node:module.createRequire` error.

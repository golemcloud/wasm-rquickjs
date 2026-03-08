# Koa Compatibility Test Results

**Package:** `koa`
**Version:** `3.1.2`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic middleware callback response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization fails at `createRequire (node:module:837:120)` from the bundled script (`bundle/script_module:20:33`), so the exported `run()` function is never invoked.

### test-02-error-handling.js — `ctx.throw` status/message handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same initialization failure in `node:module.createRequire` before runtime test execution.

### test-03-request-parsing.js — Proxy-aware request parsing and subdomain handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same initialization failure in `node:module.createRequire` before runtime test execution.

### test-04-response-helpers.js — Response headers, vary, attachment, and body metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same initialization failure in `node:module.createRequire` before runtime test execution.

### test-05-middleware-order.js — Middleware onion order and `ctx.state` propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Same initialization failure in `node:module.createRequire` before runtime test execution.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs (all fail during module initialization)
- Missing APIs: `node:module.createRequire` compatibility around filename/import-meta handling during bundled module bootstrap
- Behavioral differences: Not measurable because initialization fails before `run()` execution
- Blockers:
  - wasm module initialization aborts at `node:module.createRequire` (`filename` is `undefined`) for every Koa bundle
  - Koa primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All five wrappers compiled, but every `wasmtime run` failed during module initialization with the same `node:module.createRequire` error.

# Fastify Compatibility Test Results

**Package:** `fastify`
**Version:** `5.8.2`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic route registration and inject request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: ServerResponse has an already assigned socket` at `ERR_HTTP_SOCKET_ASSIGNED (__wasm_rquickjs_builtin/internal/errors:202:9)` → `assignSocket (__wasm_rquickjs_builtin/node_http_server:247:19)` → `Response (bundle/script_module:39266:22)`
- **Root cause:** The `createRequire` issue is fixed. Fastify's `Response` constructor attempts to assign a socket to a `ServerResponse` that already has one, triggering `ERR_HTTP_SOCKET_ASSIGNED` in the runtime's HTTP server implementation.

### test-02-schema-validation.js — Schema validation and response serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `ERR_HTTP_SOCKET_ASSIGNED` failure as test-01.

### test-03-hooks-decorators.js — Hooks and decorators in lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `ERR_HTTP_SOCKET_ASSIGNED` failure as test-01.

### test-04-plugin-encapsulation.js — Route introspection and request dispatch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `ERR_HTTP_SOCKET_ASSIGNED` failure as test-01.

### test-05-errors-not-found.js — Custom error and not-found handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `ERR_HTTP_SOCKET_ASSIGNED` failure as test-01.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- **Current blocker:** Fastify's `Response` constructor triggers `ERR_HTTP_SOCKET_ASSIGNED` because it attempts to assign a socket to a `ServerResponse` that already has one in the wasm-rquickjs HTTP server implementation.
- Behavioral differences: Not measurable due to initialization failure.
- Blockers:
  - `ServerResponse` socket assignment logic differs from Node.js expectations
  - Fastify primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Wrapper crate generation was executed with the documented workflow.
- Setting generated wrapper defaults to `default = ["http", "sqlite"]` failed to compile in this environment due `libsqlite3-sys` (`fatal error: 'stdio.h' file not found` for `wasm32-wasip1`).
- wasm-rquickjs executions above were run with generated wrapper defaults set to `default = ["http"]`.

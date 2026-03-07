# Fastify Compatibility Test Results

**Package:** `fastify`
**Version:** `5.8.2`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic route registration and inject request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack excerpt:** `at createRequire (node:module:837:120)`; `at <anonymous> (bundle/script_module:417:33)`
- **Root cause:** Fastify bundle initializes through a path that calls `node:module.createRequire(import.meta.url)` and receives `undefined` for the module URL in wasm-rquickjs.

### test-02-schema-validation.js — Schema validation and response serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack excerpt:** `at createRequire (node:module:837:120)`; `at <anonymous> (bundle/script_module:417:33)`
- **Root cause:** Same module-initialization failure before route/schema logic executes.

### test-03-hooks-decorators.js — Hooks and decorators in lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack excerpt:** `at createRequire (node:module:837:120)`; `at <anonymous> (bundle/script_module:417:33)`
- **Root cause:** Same module-initialization failure before hooks/decorators execute.

### test-04-plugin-encapsulation.js — Route introspection and request dispatch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack excerpt:** `at createRequire (node:module:837:120)`; `at <anonymous> (bundle/script_module:417:33)`
- **Root cause:** Same module-initialization failure before route introspection executes.

### test-05-errors-not-found.js — Custom error and not-found handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Stack excerpt:** `at createRequire (node:module:837:120)`; `at <anonymous> (bundle/script_module:417:33)`
- **Root cause:** Same module-initialization failure before handler logic executes.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- Missing APIs / module mismatch: `node:module.createRequire` initialization path expects a valid module URL input but receives `undefined`
- Behavioral differences: Not measurable due module initialization failure
- Blockers:
  - Runtime initialization fails before any Fastify test logic runs
  - Fastify primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

## Execution Notes

- Wrapper crate generation was executed with the documented workflow.
- Setting generated wrapper defaults to `default = ["http", "sqlite"]` failed to compile in this environment due `libsqlite3-sys` (`fatal error: 'stdio.h' file not found` for `wasm32-wasip1`).
- wasm-rquickjs executions above were run with generated wrapper defaults set to `default = ["http"]`.

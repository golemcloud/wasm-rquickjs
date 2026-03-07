# Express Compatibility Test Results

**Package:** `express`
**Version:** `5.1.0`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — App settings, middleware chain, and basic route response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Express dependency graph expects a default export from `node:string_decoder`, but the runtime module does not provide one.

### test-02-router.js — Router mounting, param middleware, and query parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-03-errors.js — Error propagation to Express error middleware
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same module-initialization failure before route handling starts.

### test-04-response-helpers.js — `res.append`, `res.cookie`, `res.location`, `res.type`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same module-initialization failure before response helpers execute.

### test-05-body-parser.js — `express.json()` body parsing and JSON response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same module-initialization failure before middleware stack executes.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- Missing APIs / module mismatch: `node:string_decoder` default export shape is incompatible with Express dependencies
- Behavioral differences: Not measurable due module initialization failure
- Blockers:
  - Runtime initialization fails before any Express test logic runs
  - Express primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

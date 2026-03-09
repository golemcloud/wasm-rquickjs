# Express Compatibility Test Results

**Package:** `express`
**Version:** `5.1.0`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — App settings, middleware chain, and basic route response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `callSiteLocation (bundle/script_module:1356:17)` → `depd (bundle/script_module:1193:32)` → `requireLayer` → `requireRouter` → `requireApplication` → `requireExpress$1`
- **Root cause:** The `depd` library calls a function that is `not a function` in the wasm-rquickjs runtime. The `createRequire` issue is fixed, but initialization now fails deeper in Express's dependency chain.

### test-02-router.js — Router mounting, param middleware, and query parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-03-errors.js — Error propagation to Express error middleware
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-04-response-helpers.js — `res.append`, `res.cookie`, `res.location`, `res.type`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

### test-05-body-parser.js — `express.json()` body parsing and JSON response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `depd` / `not a function` failure as test-01.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- Previous blockers (`string_decoder` missing default export, `createRequire(import.meta.url)` failure) are **fixed**
- **Current blocker:** The `depd` library (Express dependency) calls `callSiteLocation` which invokes a function that is `not a function` in the wasm-rquickjs runtime. This causes initialization to fail before any Express test logic runs.
- Behavioral differences: Not measurable due to initialization failure.
- Blockers:
  - `depd` library relies on V8-specific stack trace APIs or similar functionality not available in QuickJS
  - Express primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

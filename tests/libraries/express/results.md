# Express Compatibility Test Results

**Package:** `express`
**Version:** `5.1.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — App settings, middleware chain, and basic route response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` at `createRequire (node:module:837:120)`
- **Root cause:** Rollup's CJS-to-ESM interop emits `createRequire(import.meta.url)`, but `import.meta.url` is `undefined` in the wasm-rquickjs runtime.

### test-02-router.js — Router mounting, param middleware, and query parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `createRequire(import.meta.url)` failure — `import.meta.url` is `undefined`.
- **Root cause:** Same module-initialization failure before test logic executes.

### test-03-errors.js — Error propagation to Express error middleware
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `createRequire(import.meta.url)` failure — `import.meta.url` is `undefined`.
- **Root cause:** Same module-initialization failure before route handling starts.

### test-04-response-helpers.js — `res.append`, `res.cookie`, `res.location`, `res.type`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `createRequire(import.meta.url)` failure — `import.meta.url` is `undefined`.
- **Root cause:** Same module-initialization failure before response helpers execute.

### test-05-body-parser.js — `express.json()` body parsing and JSON response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same `createRequire(import.meta.url)` failure — `import.meta.url` is `undefined`.
- **Root cause:** Same module-initialization failure before middleware stack executes.

## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- **Previous blocker (fixed):** `string_decoder` missing default export — this is now resolved.
- **New blocker:** `import.meta.url` is `undefined` in the wasm-rquickjs runtime. Rollup's `@rollup/plugin-commonjs` emits `createRequire(import.meta.url)` for CJS dependencies that use `require()` for Node.js built-in modules (e.g., `node:zlib`). The runtime's `node:module` `createRequire` rejects `undefined` as the filename argument, causing initialization to fail before any Express test logic runs.
- Behavioral differences: Not measurable due to module initialization failure.
- Blockers:
  - Runtime initialization fails before any Express test logic runs
  - `import.meta.url` must be defined (or `createRequire` must accept `undefined`) for Rollup-bundled CJS code to work
  - Express primary usage model requires server binding (`app.listen`), which is incompatible with Golem's execution model

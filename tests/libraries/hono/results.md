# Hono Compatibility Test Results

**Package:** `hono`
**Version:** `4.10.5`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic routing and path parameter extraction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function`
- **Root cause:** Runtime failure in `__wasm_rquickjs_builtin/http` during Hono response serialization (`text`/`json` path).

### test-02-cookies.js — Cookie parse/serialize and signed-cookie verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-jwt.js — JWT sign/verify/decode (HS256)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-html-cors.js — HTML escaping and CORS middleware headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'headers' of null`
- **Root cause:** Runtime failure in `__wasm_rquickjs_builtin/http` header handling used by Hono CORS/response path.

### test-05-validator.js — Validator, `HTTPException`, and secure headers middleware
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
- **Root cause:** Runtime failure in `__wasm_rquickjs_builtin/http` while constructing headers during error/response handling.

## Golem Compatibility

Hono supports server adapters (`app.fire()` / runtime-specific `serve`) but can also run as an in-process fetch handler without binding a port. In this test set, only non-server APIs were exercised (`app.request`, cookie utils, JWT utils, middleware behavior), which matches the Golem execution model.

## Summary

- Tests passed: 5/5 on Node.js, 2/5 on wasm-rquickjs
- Missing APIs: None observed for tested crypto/cookie/JWT surfaces
- Behavioral differences:
  - Response construction paths used by Hono's routing/middleware hit runtime errors in `__wasm_rquickjs_builtin/http`
- Blockers:
  - `test-01-basic`: `JavaScript error: not a function`
  - `test-04-html-cors`: `JavaScript error: cannot read property 'headers' of null`
  - `test-05-validator`: `JavaScript error: cannot read property 'Symbol.iterator' of undefined`

## Execution Notes

- Workflow followed per test:
  1. `generate-wrapper-crate` for each bundled test
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run --invoke 'run()'`
- All wrappers compiled successfully in this run; failures are runtime errors for 3/5 tests.

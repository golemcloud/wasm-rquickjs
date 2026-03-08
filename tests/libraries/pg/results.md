# pg Compatibility Test Results

**Package:** `pg`
**Version:** `8.20.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-escape-utils.js — SQL escaping helpers (`escapeIdentifier`, `escapeLiteral`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime module initialization fails because `pg` expects a default export from `string_decoder`, but `node:string_decoder` in wasm-rquickjs does not provide that export shape.

### test-02-connection-config.js — client connection string/config parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime module initialization fails because `pg` expects a default export from `string_decoder`, but `node:string_decoder` in wasm-rquickjs does not provide that export shape.

### test-03-type-parsers.js — global type parser override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime module initialization fails because `pg` expects a default export from `string_decoder`, but `node:string_decoder` in wasm-rquickjs does not provide that export shape.

### test-04-client-overrides.js — client-local type parser overrides
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime module initialization fails because `pg` expects a default export from `string_decoder`, but `node:string_decoder` in wasm-rquickjs does not provide that export shape.

### test-05-pool-and-native.js — pool/query object initialization without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Runtime module initialization fails because `pg` expects a default export from `string_decoder`, but `node:string_decoder` in wasm-rquickjs does not provide that export shape.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `node:string_decoder` default export compatibility
- Behavioral differences: N/A (tests do not execute because module initialization fails)
- Blockers:
  - All bundles fail before test execution during JS module initialization in wasm-rquickjs.
  - Exact runtime failure from `wasmtime run`: `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`.

`pg` offline API surface covered by these tests (escaping utilities, config parsing, type parser customization, and object initialization) works in Node.js, but current wasm-rquickjs runtime initialization fails due to `string_decoder` export incompatibility.

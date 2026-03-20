# Got Compatibility Test Results

**Package:** `got`
**Version:** `14.6.6`
**Tested on:** 2026-03-20
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic GET flow using a mocked transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Bundle eagerly imports `node:tls` at module init; the `node:tls` stub throws unconditionally

### test-02-json.js — JSON parsing and resolveBodyOnly behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Same `node:tls` init failure

### test-03-http-errors.js — HTTPError behavior and throwHttpErrors override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Same `node:tls` init failure

### test-04-context-hooks.js — context propagation through hooks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Same `node:tls` init failure

### test-05-instances.js — instance extension and defaults inheritance
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Same `node:tls` init failure

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `node:tls` (throws at import time)
- Behavioral differences: N/A (runtime execution did not reach library code)
- Blockers:
  - `got` bundles eagerly import `node:tls`, and the runtime's `node:tls` stub throws `"tls is not supported in WebAssembly environment"` at module init, aborting before any test code runs
  - All tests use mock transports (never actually connect via TLS), but the eager import prevents even mock-based usage

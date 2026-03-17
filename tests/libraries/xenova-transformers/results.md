# Transformers.js Compatibility Test Results

**Package:** `@xenova/transformers`
**Version:** `2.17.2`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — env configuration mutability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Bundled ONNX web runtime initialization expects a browser-style global `self` during module init.

### test-02-export-surface.js — core export availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Module initialization fails before test logic runs because `self` is missing.

### test-03-config-remote-template.js — AutoConfig + custom cache + remote path template
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Same startup failure in bundled runtime dependency path.

### test-04-config-disabled.js — invalid configuration error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Module initialization aborts before `AutoConfig.from_pretrained()` is executed.

### test-05-custom-cache.js — AutoConfig via `env.customCache`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Runtime fails during bundled dependency startup.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-remote-config.js — fetch config from mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Initialization fails before HTTP request execution.

### test-integration-02-remote-404.js — 404 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Initialization fails before HTTP request execution.

### test-integration-03-invalid-json.js — malformed JSON handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: self is not defined`
- **Root cause:** Initialization fails before HTTP request execution.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 0/3 in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: N/A — not a token-gated service-client library
- Missing APIs / globals: browser global `self`
- Blockers: bundled initialization aborts before any library API call can run in wasm-rquickjs

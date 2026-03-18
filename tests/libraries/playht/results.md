# PlayHT Compatibility Test Results

**Package:** `playht`
**Version:** `0.21.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — exports, `init()`, and cache helper availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** The bundled SDK pulls in `whatwg-url`, which requires the Node built-in `punycode` module at initialization time. The wasm runtime cannot resolve `punycode`.

### test-02-init-validation.js — invalid credential validation in `init()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same startup module-resolution failure before test logic executes.

### test-03-uninitialized-guards.js — API methods requiring prior `init()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same startup module-resolution failure before test logic executes.

### test-04-generate-engine-validation.js — `generate()` rejects stream-only engine
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same startup module-resolution failure before test logic executes.

### test-05-clone-input-validation.js — clone input and mime-type validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same startup module-resolution failure before test logic executes.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-stream-basic.js — `stream()` returns mock audio bytes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Module initialization fails before the HTTP integration path starts.

### test-integration-02-stream-payload.js — PlayDialog payload fields over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Module initialization fails before the HTTP integration path starts.

### test-integration-03-stream-error.js — HTTP error propagation from mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Module initialization fails before the HTTP integration path starts.

## Live Service Tests

Live tests were not run because `tests/libraries/.tokens.json` does not contain the required PlayHT credentials (`PLAYHT_API_KEY` / `PLAYHT_USER_ID`).

## Untestable Features

The following features could not be validated end-to-end without live credentials:

- Authenticated PlayHT API calls to production endpoints
- Real text-to-speech generation quality and voice behavior
- Voice cloning and clone deletion against a live account

To fully test live behavior, provide PlayHT credentials in `tests/libraries/.tokens.json` and add `test-live-*.js` coverage.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (Node.js: 5/5)
- Integration tests passed: 0/3 in wasm-rquickjs (Node.js HTTP mock: 3/3)
- Live service tests passed: N/A — no PlayHT credentials available
- Missing APIs: `punycode` (module resolution at startup)
- Behavioral differences: Not measurable; startup fails before API behavior can be exercised
- Blockers: `playht` cannot initialize in wasm-rquickjs due unresolved `punycode` dependency in bundled module graph

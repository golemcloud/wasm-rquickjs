# PlayHT Compatibility Test Results

**Package:** `playht`
**Version:** `0.21.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — exports, `init()`, and cache helper availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** The bundled SDK pulls in `whatwg-url`, which uses CJS `require('punycode')` at initialization time. Although the wasm runtime now provides `node:punycode` and `punycode` as ESM modules, the bundled CJS `__require("punycode")` shim from Rollup's commonjs plugin cannot resolve against ESM-registered modules.

### test-02-init-validation.js — invalid credential validation in `init()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same CJS require resolution failure at startup.

### test-03-uninitialized-guards.js — API methods requiring prior `init()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same CJS require resolution failure at startup.

### test-04-generate-engine-validation.js — `generate()` rejects stream-only engine
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same CJS require resolution failure at startup.

### test-05-clone-input-validation.js — clone input and mime-type validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: Cannot find module 'punycode'`
- **Root cause:** Same CJS require resolution failure at startup.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

Integration tests were not re-run because all offline tests fail at module initialization (same `punycode` CJS require issue). The mock server tests would hit the identical startup failure before any HTTP integration path executes.

### test-integration-01-stream-basic.js — `stream()` returns mock audio bytes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (blocked by startup failure)

### test-integration-02-stream-payload.js — PlayDialog payload fields over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (blocked by startup failure)

### test-integration-03-stream-error.js — HTTP error propagation from mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (blocked by startup failure)

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
- Missing APIs: `punycode` via CJS `require()` — the runtime provides it as an ESM module but the bundled `whatwg-url` dependency uses a CJS `require('punycode')` shim that cannot resolve ESM-registered modules
- Behavioral differences: Not measurable; startup fails before API behavior can be exercised
- Blockers: `playht` cannot initialize in wasm-rquickjs due to CJS/ESM resolution mismatch for `punycode` in bundled `whatwg-url`

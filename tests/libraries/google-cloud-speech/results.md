# @google-cloud/speech Compatibility Test Results

**Package:** `@google-cloud/speech`
**Version:** `7.3.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — v2 client and proto entrypoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-client-construction.js — `SpeechClient` construction and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-path-helpers.js — v2 path template render/match helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (stack overflow — 597+ recursive `JS_CallInternal` frames)
- **Root cause:** SpeechClient construction in `fallback: true` mode triggers deeply recursive JS call chains (google-gax initialization, path template compilation) that exceed the WASM linear memory stack limit, causing an out-of-bounds memory access trap.

### test-04-proto-types.js — proto construction + encode/decode + enum checks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-validation.js — universe-domain validation and endpoint derivation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-recognize.js — `recognize()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (stack overflow — 597+ recursive `JS_CallInternal` frames)
- **Root cause:** Same stack overflow during SpeechClient construction as test-03; the test never reaches the HTTP call.

### test-integration-02-get-config.js — `getConfig()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (stack overflow — 597+ recursive `JS_CallInternal` frames)
- **Root cause:** Same stack overflow during SpeechClient construction.

### test-integration-03-error-handling.js — expected HTTP 500 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (stack overflow — 597+ recursive `JS_CallInternal` frames)
- **Root cause:** Same stack overflow during SpeechClient construction.

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`

### test-live-01-recognize.js — real `recognize()` request to Google Speech endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (not run — same stack overflow as integration tests)
- **Error:** SpeechClient construction crashes before any HTTP request is made.
- **Root cause:** Same stack overflow as above; skipped WASM run since the crash occurs during client initialization, not during the HTTP call.

## Summary

- Offline tests passed: 4/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client library
- Live service tests passed: 0/1
- Missing APIs: none observed in covered offline paths
- Behavioral differences: SpeechClient construction in `fallback: true` mode (which includes `new SpeechClient()` without explicit `fallback` in tests 01/02 but triggers deeper initialization with path templates in test-03 and all integration/live tests) causes a stack overflow in wasm-rquickjs due to deeply recursive JS call chains during google-gax initialization. The WASM stack limit is exhausted after 597+ nested `JS_CallInternal` frames.
- Blockers: Tests using `SpeechClient` with path template helpers or HTTP request paths crash with stack overflow during google-gax `fallback` mode initialization. Tests 01 (basic exports), 02 (simple construction), 04 (protos), and 05 (validation) work because they avoid the deep initialization path.

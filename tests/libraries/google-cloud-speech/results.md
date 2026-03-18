# @google-cloud/speech Compatibility Test Results

**Package:** `@google-cloud/speech`
**Version:** `7.3.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — v2 client and proto entrypoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-client-construction.js — `SpeechClient` construction and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-path-helpers.js — v2 path template render/match helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

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
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'` (panic surfaced from `#prepareRequest` / `requestAsync`)
- **Root cause:** HTTP request error objects from the Google client path cannot be converted cleanly in wasm-rquickjs, causing a panic before the test can assert on response data.

### test-integration-02-get-config.js — `getConfig()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'` (panic surfaced from `#prepareRequest` / `requestAsync`)
- **Root cause:** Same JS object-to-string conversion failure in the HTTP request/error path.

### test-integration-03-error-handling.js — expected HTTP 500 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: undefined !== 500`
- **Root cause:** wasm-rquickjs returns an error shape without `error.code` (status becomes `undefined`), so status assertions fail in the mocked 500 path.

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`

### test-live-01-recognize.js — real `recognize()` request to Google Speech endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Unexpected live API status: -1; message=Error converting from js 'object' into type 'string'`
- **Root cause:** Live HTTP request path hits the same object-to-string conversion failure observed in mock integration tests, preventing reliable status extraction.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client library
- Live service tests passed: 0/1
- Missing APIs: none observed in covered offline paths
- Behavioral differences: HTTP request/error handling in wasm-rquickjs fails with `Error converting from js 'object' into type 'string'`; error objects lose expected `code` metadata in assertions.
- Blockers: Speech API request paths (mock and live) cannot currently complete in wasm-rquickjs due HTTP error-object conversion behavior.

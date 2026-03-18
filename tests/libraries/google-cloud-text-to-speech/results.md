# @google-cloud/text-to-speech Compatibility Test Results

**Package:** `@google-cloud/text-to-speech`
**Version:** `6.4.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — v1 client and proto entrypoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-client-construction.js — `TextToSpeechClient` construction and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-path-helpers.js — model path template render/match helpers
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

### test-integration-01-list-voices.js — `listVoices()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** HTTP request handling in wasm-rquickjs fails in Google client transport code (`#prepareRequest` / `requestAsync`) before response assertions run.

### test-integration-02-synthesize.js — `synthesizeSpeech()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same JS object-to-string conversion failure in the HTTP request path.

### test-integration-03-error-handling.js — expected HTTP 500 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: undefined !== 500`
- **Root cause:** wasm-rquickjs error objects in this path do not preserve expected status metadata (`error.code` is `undefined`).

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`

### test-live-01-list-voices.js — real `listVoices()` request to Google Cloud Text-to-Speech endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected live API status: -1; message=Error converting from js 'object' into type 'string'`
- **Root cause:** Live HTTP request path in wasm-rquickjs hits the same object-to-string conversion failure as HTTP mock integration tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client library
- Live service tests passed: 0/1
- Missing APIs: none observed in covered offline paths
- Behavioral differences: HTTP request/error handling in wasm-rquickjs fails with `Error converting from js 'object' into type 'string'`; error objects can lose expected `code` metadata.
- Blockers: Text-to-Speech HTTP request paths (mock and live) cannot currently complete in wasm-rquickjs due HTTP error-object conversion behavior.

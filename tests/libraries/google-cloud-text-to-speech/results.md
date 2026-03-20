# @google-cloud/text-to-speech Compatibility Test Results

**Package:** `@google-cloud/text-to-speech`
**Version:** `6.4.0`
**Tested on:** 2026-03-20

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
- **Error:** `wasm trap: out of bounds memory access` (deep `JS_CallInternal` recursion — 596+ frames)
- **Root cause:** The Google Cloud client's HTTP request path (via `google-gax` fallback transport) triggers deep recursive JS call chains that overflow the WASM linear memory stack.

### test-integration-02-synthesize.js — `synthesizeSpeech()` against local mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (same deep recursion crash)
- **Root cause:** Same stack overflow in the HTTP request path.

### test-integration-03-error-handling.js — expected HTTP 500 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (same deep recursion crash)
- **Root cause:** Same stack overflow in the HTTP request path.

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`

### test-live-01-list-voices.js — real `listVoices()` request to Google Cloud Text-to-Speech endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (same deep recursion crash)
- **Root cause:** Same stack overflow as HTTP mock integration tests — the Google client's HTTP transport triggers deep recursive JS calls that exceed the WASM stack.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client library
- Live service tests passed: 0/1
- Missing APIs: none observed in covered offline paths
- Behavioral differences: All HTTP request paths (mock and live) crash with `wasm trap: out of bounds memory access` due to deep `JS_CallInternal` recursion (~596+ frames) in the `google-gax` fallback HTTP transport code.
- Blockers: The `google-gax` fallback transport's HTTP request handling triggers stack overflow in the WASM runtime. All offline/construction/protobuf features work correctly.

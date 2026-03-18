# Leonardo AI SDK Compatibility Test Results

**Package:** `@leonardo-ai/sdk`
**Version:** `4.21.1`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client construction and namespace exposure
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — async bearer auth resolution and `Authorization` header injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** SDK request construction fails inside `_createRequest` before request dispatch.

### test-03-prompt-random-mock.js — `prompt.promptRandom()` POST request and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** SDK request construction fails inside `_createRequest` before request dispatch.

### test-04-create-generation-mock.js — `image.createGeneration()` payload serialization and generation ID parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** SDK request construction fails inside `_createRequest` before request dispatch.

### test-05-error-handling.js — HTTP 401 propagation as SDK error type
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: + actual - expected + 'TypeError' - 'SDKError'`
- **Root cause:** wasm-rquickjs throws `TypeError` during request construction (`Error converting from js 'object' into type 'string'`) before HTTP status-based SDK error mapping can run.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-user-self.js — `user.getUserSelf()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** SDK request construction fails inside `_createRequest` before making the HTTP call.

### test-integration-02-create-generation.js — `image.createGeneration()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** SDK request construction fails inside `_createRequest` before making the HTTP call.

### test-integration-03-auth-error.js — 401 authentication error mapping against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: + actual - expected + 'TypeError' - 'SDKError'`
- **Root cause:** wasm-rquickjs throws `TypeError` during request construction (`Error converting from js 'object' into type 'string'`) before HTTP status-based SDK error mapping can run.

## Untestable Features

The following features could not be tested against the live Leonardo service because `LEONARDO_API_KEY` (or equivalent Leonardo bearer token) is not present in `tests/libraries/.tokens.json`:

- Live prompt and generation API behavior on Leonardo-hosted endpoints.
- Real account/user metadata responses and token-balance fields returned by `/me`.
- Live error-mode behavior (rate limits, auth failures, quota handling) from Leonardo's production API.

To fully test this library against the live service, a user would need to:
1. Obtain a Leonardo API bearer token.
2. Add a token key (for example `LEONARDO_API_KEY`) to `tests/libraries/.tokens.json`.
3. Add and run `test-live-*.js` scripts with minimal-cost API calls.

## Summary

- Offline tests passed: 1/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 0/3 HTTP mock in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: N/A — Leonardo token not available in `tests/libraries/.tokens.json`
- Missing APIs: none identified from these failures
- Behavioral differences: SDK HTTP request construction fails in wasm-rquickjs (`Error converting from js 'object' into type 'string'` in `_createRequest`), preventing all network-path SDK operations
- Blockers: Core Leonardo SDK functionality (all HTTP operations) is currently unusable in wasm-rquickjs

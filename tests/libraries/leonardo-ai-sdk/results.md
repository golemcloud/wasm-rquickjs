# Leonardo AI SDK Compatibility Test Results

**Package:** `@leonardo-ai/sdk`
**Version:** `4.21.1`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — client construction and namespace exposure
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — async bearer auth resolution and `Authorization` header injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Unsupported body type` followed by `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
- **Root cause:** SDK's internal HTTP client uses a `Request` body type not supported by the wasm-rquickjs fetch implementation; the SDK wraps the resulting TypeError as `UnexpectedClientError`.

### test-03-prompt-random-mock.js — `prompt.promptRandom()` POST request and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Unsupported body type` followed by `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
- **Root cause:** Same as test-02 — SDK request construction triggers an unsupported body type in the fetch implementation.

### test-04-create-generation-mock.js — `image.createGeneration()` payload serialization and generation ID parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
- **Root cause:** Same fetch/body incompatibility during SDK request dispatch.

### test-05-error-handling.js — HTTP 401 propagation as SDK error type
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: + actual - expected + 'UnexpectedClientError' - 'SDKError'`
- **Root cause:** wasm-rquickjs throws `TypeError` during request construction (`Unsupported body type` / `not a function`) before HTTP status-based SDK error mapping can run, so the SDK wraps it as `UnexpectedClientError` instead of `SDKError`.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-user-self.js — `user.getUserSelf()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Unsupported body type` followed by `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
- **Root cause:** SDK request construction fails before making the HTTP call due to unsupported body type in fetch.

### test-integration-02-create-generation.js — `image.createGeneration()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
- **Root cause:** Same fetch/body incompatibility during SDK request dispatch.

### test-integration-03-auth-error.js — 401 authentication error mapping against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: Expected values to be strictly equal: + actual - expected + 'UnexpectedClientError' - 'SDKError'`
- **Root cause:** wasm-rquickjs throws `TypeError` during request construction before HTTP status-based SDK error mapping can run.

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
- Missing APIs: none identified — failures are caused by unsupported `Request` body type in the fetch implementation
- Behavioral differences: SDK HTTP request construction fails in wasm-rquickjs (`Unsupported body type` / `TypeError: not a function`) preventing all network-path SDK operations. The error type changed from the previous test run (was `Error converting from js 'object' into type 'string'`, now `TypeError: not a function`), suggesting partial progress in the runtime but the body serialization path still fails.
- Blockers: Core Leonardo SDK functionality (all HTTP operations) is currently unusable in wasm-rquickjs

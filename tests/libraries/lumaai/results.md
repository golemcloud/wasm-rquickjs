# Luma AI SDK Compatibility Test Results

**Package:** `lumaai`
**Version:** `1.19.1`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client initialization and auth token validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-request-shape.js — `ping.check()` request path/method/auth header with custom fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-image-create-mock.js — `generations.image.create()` payload and response parsing with custom fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-list-and-get-mock.js — `generations.list()` and `generations.get()` query/response handling with custom fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-error-handling.js — HTTP 401 classification to `AuthenticationError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-ping.js — `ping.check()` against local HTTP endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-image-create.js — `generations.image.create()` against local HTTP endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-list-and-get.js — `generations.list()` and `generations.get()` against local HTTP endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the real Luma AI service because no `LUMAAI_API_KEY` token was available in `tests/libraries/.tokens.json`:

- **Live image/video generation requests** (`generations.image.create`, `generations.video.create`) against `api.lumalabs.ai`
- **Real account credit retrieval** (`credits.get`) against a real account
- **Real generation polling lifecycle** (`queued` → `dreaming` → `completed`) using actual generation IDs

To fully test this library against the live service, a user would need to:
1. Create a Luma AI account and generate an API key from the Luma AI developer dashboard.
2. Add `LUMAAI_API_KEY` to `tests/libraries/.tokens.json`.
3. Add and run `test-live-*.js` scripts that call the real API endpoints with minimal-cost requests.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 3/3 HTTP mock in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: N/A — no `LUMAAI_API_KEY` token available
- Missing APIs: none observed
- Behavioral differences: none observed in offline and HTTP mock flows
- Blockers: real-service behavior requires credentials (`LUMAAI_API_KEY`)

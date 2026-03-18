# Fal.ai Client Compatibility Test Results

**Package:** `@fal-ai/client`
**Version:** `1.9.4`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client API surface and endpoint ID parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-errors.js — `ApiError` / `ValidationError` behavior and retry classification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-middleware.js — middleware chaining and proxy URL rewriting
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-queue-helpers.js — queue status type guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-run-custom-fetch.js — authenticated `run()` request construction and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-run.js — `run()` against mock Fal endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-subscribe.js — queue submit + polling + result retrieval
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-cancel.js — queue cancel and canceled status handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

Live tests were not run because `tests/libraries/.tokens.json` does not contain a Fal credential token (`FAL_KEY` or `FAL_KEY_ID`/`FAL_KEY_SECRET`).

## Untestable Features

The following features could not be tested without external Fal.ai credentials and live service access:

- Real Fal.ai model execution against production endpoints.
- Realtime WebSocket session flows (`fal.realtime.connect(...)`) with temporary auth tokens.
- End-to-end storage uploads to Fal-managed object storage.

To fully test these paths, a user would need to:
1. Obtain a Fal API credential (`FAL_KEY`, or `FAL_KEY_ID` + `FAL_KEY_SECRET`).
2. Add it to `tests/libraries/.tokens.json`.
3. Add and run `test-live-*.js` scripts for live model invocation and realtime sessions.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 3/3 HTTP mock in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: N/A — no Fal credentials available in `.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none for offline and HTTP-mock usage

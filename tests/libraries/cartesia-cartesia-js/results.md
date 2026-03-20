# Cartesia JS Compatibility Test Results

**Package:** `@cartesia/cartesia-js`
**Version:** `3.0.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client construction and URL building
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-build-request-token.js — token auth + required headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-build-request-apikey.js — apiKey auth + JSON body serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-missing-auth.js — missing credential error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-with-options.js — `withOptions` timeout/header overrides
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-status-and-list.js — API status and voices listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-get-and-errors.js — voice retrieval and 404 error mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-retry-and-auth.js — retry-on-429 and 401 authentication error mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

- **Status:** N/A — no Cartesia credential was available in `tests/libraries/.tokens.json`.
- Expected credentials for real API calls: `CARTESIA_API_KEY` or a valid Cartesia bearer token.

## Untestable Features

The following features were not validated against the live Cartesia service:

- Real TTS/STT/voice-changing model execution against `https://api.cartesia.ai`
- Real WebSocket streaming behavior with `wss://api.cartesia.ai/tts/websocket`
- Server-side voice cloning/localization/fine-tune workflows requiring real account resources

These require valid Cartesia credentials and live service access.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests: N/A — not applicable for this HTTP SDK
- Live service tests passed: N/A — no tokens available
- Missing APIs: None observed in tested paths
- Behavioral differences: None observed in tested paths
- Blockers: None for offline and HTTP-mock usage

## Notes

- The package requires optional peer dependency `ws` in Node environments for successful import path resolution; this was added to the local test harness dependencies.

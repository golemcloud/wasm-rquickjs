# Brave Search Compatibility Test Results

**Package:** `brave-search`
**Version:** `0.9.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — class initialization, public method surface, and summarized-answer wiring
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-web-search-options.js — option formatting and request header construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-endpoints.js — polling defaults/overrides and summarizer-key flow behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-error-handling.js — BraveSearchError mapping for auth/rate-limit/generic/unexpected failures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-summary-polling.js — summary polling complete/missing/failed paths
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search.js — web/image/news HTTP requests against Brave-compatible mock endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-local.js — local POI and local description endpoints over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-summary-and-errors.js — summarized-search polling over HTTP plus auth/rate-limit error handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the live Brave service in this run:

- **Live Brave Search API responses** from production Brave backend endpoints.
- **Real account-level quota/rate-limit behavior** tied to a Brave API subscription.

To fully test these features, a user would need to:
1. Create a Brave Search API account at https://api.search.brave.com/app/keys.
2. Obtain a Brave API key.
3. Add `BRAVE_API_KEY` to `tests/libraries/.tokens.json`.
4. Add and run `test-live-*.js` scripts that call the real Brave API.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the correct integration path
- Live service tests passed: N/A — no `BRAVE_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline and HTTP-mock-tested flows

## Notes

- Generated wrapper crates were switched to `default = ["full-no-logging"]` before wasm runs so `wasmtime` could execute without `wasi:logging` imports.

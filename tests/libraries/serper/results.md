# Serper SDK Compatibility Test Results

**Package:** `serper`
**Version:** `1.0.6`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — `search()` request shape and organic-result parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-pagination.js — `nextPage()` / `prevPage()` / `toPage()` request paging behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-endpoints.js — `news()` / `images()` / `videos()` / `places()` endpoint mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-cache.js — in-memory cache on/off behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-validation.js — missing API key validation and option propagation (`timeout`, request body)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search.js — live HTTP `search()` + `nextPage()` against mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-endpoints.js — live HTTP calls for news/images/videos/places endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-errors-and-cache.js — unauthorized response path and cache behavior over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without external credentials:

- **Live Serper.dev API responses** from production backends
- **Real account quota/billing behavior** for a Serper account

To fully test these features, a user would need to:
1. Create a Serper account at https://serper.dev.
2. Obtain an API key.
3. Add `SERPER_API_KEY` to `tests/libraries/.tokens.json`.
4. Add and run `test-live-*.js` scripts that call the real Serper service.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the right integration path
- Live service tests passed: N/A — no `SERPER_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline and HTTP-mock-tested flows

## Notes

- Rollup bundling required preferring `main` over `module` for `serper@1.0.6` because published metadata points `module` at a non-shipped TypeScript path.
- Generated wrapper crates were switched to `default = ["full-no-logging"]` before wasm runs so `wasmtime` could execute without `wasi:logging` imports.

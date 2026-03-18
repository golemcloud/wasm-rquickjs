# Tavily Core Compatibility Test Results

**Package:** `@tavily/core`
**Version:** `0.7.2`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — API key validation and client method surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-env-config.js — environment-variable configuration (`TAVILY_API_KEY`, proxy, project)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-deprecated-apis.js — deprecated `searchQNA()` and `searchContext()` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search-extract.js — `search()` + `extract()` response mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-map-research.js — `map()`, `research()`, and `getResearch()` request/response flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — API error propagation from Tavily error payloads
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without external credentials:

- **Live Tavily API responses** from production Tavily backends
- **Real account quota and billing data** tied to a Tavily account
- **Streaming research mode** (`research(..., { stream: true })`) against live Tavily stream responses

To fully test these features, a user would need to:
1. Create a Tavily account at https://tavily.com.
2. Obtain a Tavily API key.
3. Add `TAVILY_API_KEY` to `tests/libraries/.tokens.json`.
4. Add and run `test-live-*.js` scripts that call the real Tavily API.

## Summary

- Offline tests passed: 3/3
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the correct integration path
- Live service tests passed: N/A — no `TAVILY_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline and HTTP-mock-tested flows

## Notes

- Generated wrapper crates were switched to `default = ["full-no-logging"]` before `wasmtime` runs so components would not import `wasi:logging/logging`, which `wasmtime run` does not provide by default.

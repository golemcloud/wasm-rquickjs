# Algolia Search Compatibility Test Results

**Package:** `algoliasearch`
**Version:** `5.49.2`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — constructor validation and API key mutation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth-and-options.js — auth mode handling and request option merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-search-surface.js — search endpoint construction (`search`, `searchSingleIndex`, `searchForFacetValues`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-write-and-wait.js — write flow and `waitForTask` polling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — `ApiError` propagation and `indexExists` 404 behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search.js — real HTTP search requests against mocked Algolia endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-write-task.js — real HTTP write + task polling + object retrieval
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-errors.js — real HTTP 404 handling through Algolia client
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully validated without live Algolia credentials and a real application/index:

- **Live Algolia API behavior** (production ranking/analytics behavior, account-level settings, API key permissions against a real app)
- **Service-side feature interactions** that depend on real Algolia index state and account configuration

To fully test these features, a user would need to:
1. Create or use an Algolia app and index.
2. Provide valid credentials (application ID + API key).
3. Add and run `test-live-*.js` cases that hit the live Algolia service.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the appropriate integration path
- Live service tests passed: N/A — no relevant Algolia token in `tests/libraries/.tokens.json`
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline and HTTP-mock-tested flows

## Notes

- Rollup bundling succeeded for all tests.
- Integration tests use an explicit fetch-based requester to ensure a consistent HTTP transport path in both Node.js and wasm-rquickjs.

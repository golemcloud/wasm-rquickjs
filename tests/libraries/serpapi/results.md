# SerpAPI Compatibility Test Results

**Package:** `serpapi`
**Version:** `2.2.1`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — `getJson` request construction and JSON parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — argument/API-key/timeout validation errors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-html-and-callback.js — `getHtml` output mode and callback behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-search-archive.js — archived search ID lookups (`getJsonBySearchId`, `getHtmlBySearchId`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-account-and-locations.js — account endpoint + locations endpoint behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search.js — `getJson` against mock `/search`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-archive-html.js — archive JSON/HTML endpoints against mock `/searches/{id}`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-account-locations-errors.js — account + locations + unauthorized error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without a real SerpAPI token:

- **Live SerpAPI responses from production engines** (Google/Bing/etc.)
- **Quota/billing/account behavior against a real SerpAPI account**

To fully test these features, a user would need to:
1. Create a SerpAPI account at https://serpapi.com.
2. Obtain a valid API key.
3. Add the key to `tests/libraries/.tokens.json` (for example as `SERPAPI_API_KEY`).
4. Add and run `test-live-*.js` scripts that call the real SerpAPI service.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the appropriate integration path
- Live service tests passed: N/A — no SerpAPI token key present in `tests/libraries/.tokens.json`
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline and HTTP-mock-tested flows

## Notes

- Rollup bundling succeeded for all tests.
- Integration tests patch `serpapi` internal transport (`_internals.execute`) to target the local mock server because the package hardcodes `https://serpapi.com` and does not expose host override in public API.

# Upstash Vector Compatibility Test Results

**Package:** `@upstash/vector`
**Version:** `1.2.3`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — basic `upsert()` + `query()` flow through a custom `Requester`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — missing credentials and invalid `query()` payload validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-namespace.js — namespace-scoped `upsert()`/`query()` endpoint routing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-update-fetch-delete.js — `update()`/`fetch()`/`delete()` response handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-management.js — `info()` + namespace management (`listNamespaces`, `deleteNamespace`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-upsert-query.js — HTTP `upsert()` and `query()` against a mock Upstash endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-namespace-query-many.js — namespace writes with `queryMany(..., { namespace })`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-management.js — HTTP `info()`, `listNamespaces()`, and `deleteNamespace()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

No Upstash Vector credentials are available in `tests/libraries/.tokens.json`, so live Upstash service API tests were not run.

The following features could not be validated against the real hosted service:
- End-to-end behavior against an actual Upstash Vector index (`UPSTASH_VECTOR_REST_URL` + `UPSTASH_VECTOR_REST_TOKEN`)
- Real server-side embedding/indexing latency and result ranking behavior
- Real authentication and quota behavior from Upstash cloud

To fully test this library against production endpoints:
1. Add `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` to `tests/libraries/.tokens.json`.
2. Add `test-live-*.js` scripts that execute minimal-cost live API calls.
3. Re-run the Node.js + wasm-rquickjs workflow for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no Upstash tokens in `tests/libraries/.tokens.json`
- Missing APIs: none observed in tested paths
- Behavioral differences: none observed between Node.js and wasm-rquickjs in tested offline + HTTP mock flows
- Blockers: live Upstash cloud coverage is credential-gated

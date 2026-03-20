# Milvus SDK Compatibility Test Results

**Package:** `@zilliz/milvus2-sdk-node`
**Version:** `2.6.11`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client constructors and core exports are available offline
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth-format.js — auth and formatting helpers (`getAuthString`, `formatAddress`, `parseTimeToken`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-schema-validation.js — schema builders and collection field validation helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-bytes-and-sparse.js — vector byte conversions (f16/bf16/int8/sparse)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-validation-helpers.js — request validation helper behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-collections.js — `HttpClient.listCollections()` against mock API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-search-topks.js — `HttpClient.search()` top-k response splitting
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-error.js — HTTP 500 error propagation as `HttpError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested against a real Milvus/Zilliz deployment:

- **gRPC transport operations** via `MilvusClient` (collection lifecycle, insert/upsert/query/search, RBAC, index operations) require a live Milvus endpoint.
- **Live HTTP API behavior** against Milvus/Zilliz Cloud was not executed; tests used deterministic mock responses.
- **TLS/mTLS and cluster-topology behavior** require real service endpoints and credentials.

To fully test live service behavior:
1. Provision a Milvus or Zilliz Cloud endpoint.
2. Add the required credentials/endpoints to local test configuration.
3. Add `test-live-*.js` scripts for minimal real API calls.
4. Re-run the same Node.js + wasm-rquickjs workflow for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no Milvus/Zilliz credential token configured in `tests/libraries/.tokens.json`
- Missing APIs: none observed in tested paths
- Behavioral differences: none observed between Node.js and wasm-rquickjs in tested paths
- Blockers: none for offline + mock HTTP coverage

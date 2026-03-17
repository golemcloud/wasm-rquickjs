# Qdrant JS Client REST Compatibility Test Results

**Package:** `@qdrant/js-client-rest`
**Version:** `1.17.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — `QdrantClient` API surface and generated OpenAPI methods
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor validation for invalid `url`/`host` combinations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-prefix-and-headers.js — prefixed base URL and custom headers with `versionInfo()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-errors.js — exported error classes (`Timeout`, `ResourceExhausted`, `UnexpectedResponse`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-https-default.js — constructor in API key mode and plain HTTP mode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `qdrant/qdrant:v1.13.2` on port `16333`

### test-integration-04-docker-connect.js — connect to real Qdrant and read metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-05-docker-crud.js — create collection, upsert vectors, count/query, delete collection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-metadata.js — `versionInfo()`, `getCollections()`, `collectionExists()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-collection-lifecycle.js — `createCollection()`, `getCollection()`, `deleteCollection()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-points.js — `upsert()`, `count()`, `query()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

No Qdrant Cloud credentials are available in `tests/libraries/.tokens.json`, so live cloud API tests were not run.

To fully test cloud-hosted behavior:
1. Add Qdrant Cloud credentials (for example `QDRANT_API_KEY` and `QDRANT_URL`) to `tests/libraries/.tokens.json`.
2. Add `test-live-*.js` scripts for minimal live API coverage.
3. Re-run the Node.js + wasm-rquickjs workflow for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 5/5 (Docker 2/2, HTTP mock 3/3)
- Live service tests passed: N/A — no Qdrant credentials in `tests/libraries/.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none for tested features

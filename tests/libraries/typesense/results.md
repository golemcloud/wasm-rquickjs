# Typesense Compatibility Test Results

**Package:** `typesense`
**Version:** `3.0.3`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client constructors and exported API surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-scoped-key.js — scoped search key generation (`crypto` HMAC)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-search-request-shape.js — `documents.search()` request shape and response handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-multisearch-cache.js — `multiSearch` cache behavior and invalidation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-import-errors.js — import error mapping and partial-result mode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `typesense/typesense:29.0` on port `18108`

### test-integration-04-docker-connect.js — health + collection lifecycle against real Typesense
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-05-docker-crud.js — document CRUD/search/multi-search against real Typesense
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-system.js — health + collection lifecycle over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-documents.js — create/retrieve/search/multi-search over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-errors.js — 404/409 error mapping to Typesense error classes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 5/5 (Docker 2/2, HTTP mock 3/3)
- Live service tests passed: N/A — no token-based live test flow required for this package
- Missing APIs: none observed
- Behavioral differences: none observed in tested paths
- Blockers: none for tested usage patterns

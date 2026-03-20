# ChromaDB Compatibility Test Results

**Package:** `chromadb`
**Version:** `3.3.3`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client constructors and Next.js helper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-errors.js — exported error classes and error-factory mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-embedding-registry.js — custom embedding registry + serializer path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-configuration.js — collection configuration validation helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-query-builders.js — where/filter/search builder JSON payloads
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `chromadb/chroma:1.0.20` on port `18081`

### test-integration-04-docker-connect.js — real Chroma version/heartbeat/identity
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-05-docker-crud.js — create/add/query/upsert/delete/count against real Chroma
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-system.js — version/heartbeat/preflight endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-collections.js — create/list/get/count/delete collection lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-records.js — add/get/query/delete record lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested due to missing credentials/tokens:

- **Chroma Cloud API flows (`CloudClient` / `AdminCloudClient`)** — require a valid `CHROMA_API_KEY` (and typically tenant/database scoping) for live cloud endpoints.

To fully test cloud-hosted behavior:
1. Add a valid `CHROMA_API_KEY` (and any required cloud identifiers) to `tests/libraries/.tokens.json`.
2. Add `test-live-*.js` scripts for minimal cloud connectivity and CRUD coverage.
3. Re-run Node.js and wasm-rquickjs test flow for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 5/5 (Docker 2/2, HTTP mock 3/3)
- Live service tests passed: N/A — no Chroma Cloud token in `tests/libraries/.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed in tested paths
- Blockers: none for tested local/server-backed usage

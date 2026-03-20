# OpenSearch Client Compatibility Test Results

**Package:** `@opensearch-project/opensearch`
**Version:** `3.5.1`
**Tested on:** 2026-03-18
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — mocked client construction and `ping()`/`info()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-document-crud.js — mocked index/create/update/get/delete document flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-search-and-count.js — mocked `search()` and `count()` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-bulk.js — mocked `bulk()` NDJSON serialization and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-helpers-and-child.js — mocked `child()` client + `helpers.search()` + 404 handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-ping-info.js — real HTTP `ping()`/`info()` against mock OpenSearch server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-index-search.js — real HTTP index/get/search lifecycle against mock OpenSearch server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-error.js — real HTTP 404 mapping to `ResponseError` and `ignore: [404]`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `opensearchproject/opensearch:2.15.0` on port `19210`

### test-integration-04-docker-connect.js — real cluster connectivity (`ping`/`info`/`cluster.health`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-05-docker-crud.js — real index CRUD + `bulk()` + `search()` + `count()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

- **Status:** N/A — no dedicated OpenSearch cloud token is present in `tests/libraries/.tokens.json`; offline + HTTP mock + Docker integration coverage was used.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 5/5 (HTTP mock 3/3, Docker 2/2)
- Live service tests passed: N/A — no tokens available
- Missing APIs: None identified from tested API surface
- Behavioral differences: None observed in this test suite
- Blockers: None identified

## Build Notes

Generated wrapper crates required switching generated default features from `normal` to `full-no-logging` for `wasmtime` execution (to avoid importing `wasi:logging`).

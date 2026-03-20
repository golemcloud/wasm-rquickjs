# Elasticsearch Client Compatibility Test Results

**Package:** `@elastic/elasticsearch`
**Version:** `9.3.4`
**Tested on:** 2026-03-20
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — mocked `ping()` and `info()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-document-crud.js — mocked `index/get/update/delete`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-search-and-count.js — mocked `search()` and `count()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-helpers-bulk.js — mocked `helpers.bulk()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-helpers-search-and-child.js — mocked `child()` + `helpers.search()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-ping-info.js — real HTTP `ping()` + `info()` against mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Request aborted`
- **Root cause:** HTTP requests from the Elasticsearch client abort in wasm-rquickjs before a response is processed.

### test-integration-02-http-index-search.js — real HTTP index/search/get flow against mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Request aborted`
- **Root cause:** Same request-abort behavior blocks all HTTP operations.

### test-integration-03-http-error.js — HTTP 404 mapping to `ResponseError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true` (assertion failed because expected `ResponseError` shape was not observed)
- **Root cause:** Under wasm-rquickjs the request aborts before normal 404 error mapping, so Node-compatible error behavior is not preserved.

## Integration Tests (Docker)

Docker integration tests (`test-integration-04-docker-connect.js`, `test-integration-05-docker-crud.js`) were skipped in this re-test run. Previous results (2026-03-18) showed the same `Request aborted` failures as the HTTP mock tests.

## Live Service Tests

- **Status:** N/A — no dedicated Elasticsearch cloud credentials in `tests/libraries/.tokens.json`; local Docker and HTTP mock integration coverage was used instead.

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- HTTP mock integration tests passed in Node.js: 3/3
- HTTP mock integration tests passed in wasm-rquickjs: 0/3
- Docker integration tests: skipped (same root cause as HTTP mock failures)
- Missing APIs: None identified from offline API-surface usage
- Behavioral differences: HTTP transport requests from `@elastic/elasticsearch` consistently abort in wasm-rquickjs (`JavaScript error: Request aborted`)
- Blockers: Real HTTP communication is currently non-functional for this package in wasm-rquickjs

## Build Notes

Generated wrapper crates required disabling logging imports for `wasmtime` execution by changing generated feature defaults from `normal` to `full-no-logging`.

# MeiliSearch Compatibility Test Results

**Package:** `meilisearch`
**Version:** `0.56.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client/index constructors and API surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-request-shape.js — custom `httpClient` request shaping for `search()` and `getDocuments()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** When `meilisearch` prepares request payloads in this runtime, object values passed through the request path can trigger JS→Rust conversion failures.

### test-03-task-wait.js — `EnqueuedTaskPromise.waitTask()` polling behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same request-serialization/conversion failure appears during document add + task polling calls.

### test-04-tenant-token.js — tenant token generation (`meilisearch/token`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — request failure wrapping and failed-task object handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Expected values to be strictly equal: + actual - expected + 'TypeError' - 'MeiliSearchRequestError'`
- **Root cause:** Error objects surfaced by the runtime differ from Node.js (`TypeError` instead of expected MeiliSearch error wrappers), causing assertion mismatch.

## Integration Tests (Docker)

**Service:** `getmeili/meilisearch:v1.15` on port `17700`

### test-integration-04-docker-connect.js — health/version against real Meilisearch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** HTTP request path fails before endpoint-specific behavior can complete.

### test-integration-05-docker-crud.js — index create + document CRUD/search against real Meilisearch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same conversion failure appears on index/document mutation requests.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-health.js — health endpoint over real HTTP path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Request setup/conversion fails before successful response handling.

### test-integration-02-http-index-docs.js — index lifecycle and search over mock HTTP API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same conversion failure when issuing create-index and document requests.

### test-integration-03-http-errors.js — API-error mapping and `deleteIndexIfExists` fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Expected values to be strictly equal: + actual - expected + 'TypeError' - 'MeiliSearchApiError'`
- **Root cause:** Runtime surfaces `TypeError` instead of MeiliSearch API error wrapper for this path.

## Summary

- Offline tests passed: Node.js 5/5, wasm-rquickjs 2/5
- Integration tests passed: Node.js 5/5 (HTTP mock 3/3, Docker 2/2), wasm-rquickjs 0/5
- Live service tests passed: N/A — no token-based MeiliSearch flow required
- Missing APIs: none observed in covered paths
- Behavioral differences:
  - Frequent wasm runtime failure: `Error converting from js 'object' into type 'string'` across MeiliSearch HTTP request paths
  - Error-class mismatch in wasm for failure paths (`TypeError` vs expected `MeiliSearchRequestError` / `MeiliSearchApiError`)
- Blockers: Core HTTP request execution paths fail in wasm-rquickjs, preventing practical MeiliSearch client use

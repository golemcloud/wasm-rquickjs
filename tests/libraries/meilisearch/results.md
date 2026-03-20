# MeiliSearch Compatibility Test Results

**Package:** `meilisearch`
**Version:** `0.56.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — client/index constructors and API surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-request-shape.js — custom `httpClient` request shaping for `search()` and `getDocuments()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-task-wait.js — `EnqueuedTaskPromise.waitTask()` polling behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-tenant-token.js — tenant token generation (`meilisearch/token`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — request failure wrapping and failed-task object handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-health.js — health endpoint over real HTTP path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Expected values to be strictly equal: 'ok' !== 'available'`
- **Root cause:** The `wasi:http` response body is parsed differently — `health.status` returns `'ok'` instead of the expected `'available'` from the mock server JSON response. Suggests the response body isn't being fully/correctly parsed through the HTTP transport.

### test-integration-02-http-index-docs.js — index lifecycle and search over mock HTTP API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `404: Not Found`
- **Root cause:** The `createIndex` POST request receives a 404 from the mock server, suggesting the request URL or method is not arriving correctly through the `wasi:http` transport path.

### test-integration-03-http-errors.js — API-error mapping and `deleteIndexIfExists` fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Expected values to be strictly equal: + actual - expected + undefined - 'index_not_found'`
- **Root cause:** `MeiliSearchApiError.cause.code` is `undefined` — the error response body from the mock server is not being parsed correctly through the `wasi:http` transport, so the structured error fields are lost.

## Integration Tests (Docker)

> Skipped — Docker integration tests not re-run in this session.

## Summary

- Offline tests passed: 5/5 (improved from 2/5 on 2026-03-18)
- Integration tests (HTTP mock) passed: 0/3
- Integration tests (Docker): not re-run
- Live service tests passed: N/A — no token-based MeiliSearch flow required
- Missing APIs: none observed in covered paths
- Behavioral differences:
  - HTTP mock integration tests fail due to `wasi:http` response body parsing issues — responses are not fully deserialized through the real HTTP transport
  - All offline tests using custom `httpClient` (bypassing real HTTP) now pass, indicating the core library logic works correctly
- Blockers: Real HTTP transport via `wasi:http` still has response parsing issues that affect MeiliSearch client's built-in fetch-based HTTP client

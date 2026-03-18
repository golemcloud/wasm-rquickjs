# googleapis Compatibility Test Results

**Package:** `googleapis`
**Version:** `171.4.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — module import and service client construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth-and-options.js — OAuth2 URL generation, credential assignment, and global options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-supported-apis.js — API catalog introspection via `getSupportedAPIs()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-gmail-validation.js — required parameter validation (`userId`) without network
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-drive-validation.js — required parameter validation (`fileId`) without network
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-customsearch.js — `customsearch.cse.list` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `FAIL: customsearch.cse.list request failed (Error converting from js 'object' into type 'string')`
- **Root cause:** HTTP request path in wasm-rquickjs fails during JS↔host conversion for thrown HTTP error objects.

### test-integration-02-books.js — `books.volumes.list` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `FAIL: books.volumes.list request failed (Error converting from js 'object' into type 'string')`
- **Root cause:** Same JS↔host conversion failure when handling request/response errors in the HTTP path.

### test-integration-03-error-handling.js — expected HTTP 500 propagation from mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `FAIL: unexpected error shape (Error converting from js 'object' into type 'string'; status=unknown)`
- **Root cause:** Error object metadata cannot be converted, so status/message assertions are not reachable.

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

### test-live-01-customsearch.js — real Google Custom Search API call with API key + engine ID
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `FAIL: live Google Custom Search request failed (Error converting from js 'object' into type 'string')`
- **Root cause:** Real HTTP requests hit the same JS object conversion failure seen in mock integration tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the appropriate integration path
- Live service tests passed: 0/1
- Missing APIs: none observed in offline-only covered paths
- Behavioral differences: HTTP request/error handling fails in wasm-rquickjs with `Error converting from js 'object' into type 'string'`
- Blockers: Google API calls cannot currently complete in wasm-rquickjs due HTTP error-object conversion issues in request handling

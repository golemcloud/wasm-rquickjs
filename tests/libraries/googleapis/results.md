# googleapis Compatibility Test Results

**Package:** `googleapis`
**Version:** `171.4.0`
**Tested on:** 2026-03-20

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
- **Error:** `wasm trap: out of bounds memory access` (deep recursive `JS_CallInternal` stack overflow, 500+ frames)
- **Root cause:** The googleapis HTTP request path triggers extremely deep JS call chains in QuickJS that exhaust the WASM linear memory stack.

### test-integration-02-books.js — `books.volumes.list` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (same deep recursive stack overflow)
- **Root cause:** Same deep JS call chain stack overflow as integration-01.

### test-integration-03-error-handling.js — expected HTTP 500 propagation from mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `wasm trap: out of bounds memory access` (same deep recursive stack overflow)
- **Root cause:** Same deep JS call chain stack overflow as integration-01.

## Live Service Tests

Skipped — mock integration tests already demonstrate the HTTP path failure. Live tests would hit the same stack overflow.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP API client; mock server is the appropriate integration path
- Live service tests passed: N/A — skipped (same HTTP path would fail)
- Missing APIs: none observed in offline paths
- Behavioral differences: All HTTP request paths trigger a deep recursive `JS_CallInternal` stack overflow (500+ frames) that causes `wasm trap: out of bounds memory access`. Previously (2026-03-18) these failed with `Error converting from js 'object' into type 'string'`; the failure mode has changed to a stack overflow crash.
- Blockers: Google API calls cannot complete in wasm-rquickjs due to QuickJS call stack depth exhausting WASM linear memory during HTTP request processing

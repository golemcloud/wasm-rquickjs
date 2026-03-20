# Effect Platform Node Compatibility Test Results

**Package:** `@effect/platform-node`
**Version:** `0.95.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-node-path-layer.js — NodePath layer path operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-node-filesystem-temp-io.js — NodeFileSystem directory IO (mkdir/write/read/rename/remove)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-node-kv-filesystem.js — NodeKeyValueStore filesystem backend
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-node-http-client-invalid-url.js — NodeHttpClient invalid URL RequestError
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-node-http-client-request-builders.js — HttpClientRequest URL/header/body builder behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true`
- **Root cause:** Behavioral mismatch in `HttpClientRequest.toUrl(...)` — the query-parameter assertion (`resolvedUrlString.includes('source=effect-platform-node-test')`) fails, indicating the URL builder produces different output in wasm-rquickjs.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-get.js — NodeHttpClient GET request and JSON response shape
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true`
- **Root cause:** `Array.isArray(payload)` returns false — `response.json` in `@effect/platform-node`'s HTTP client does not yield a proper array in wasm-rquickjs.

### test-integration-02-post.js — NodeHttpClient POST request and JSON body parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'id' of null`
- **Root cause:** `response.json` yields `null` for the POST response body in wasm-rquickjs, so expected JSON fields are unavailable.

### test-integration-03-error-handling.js — non-2xx response handling with `filterStatusOk`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 4/5
- Integration tests passed: 1/3 (HTTP mock server)
- Live service tests passed: N/A — not a service client library
- Missing APIs: None directly observed in this test set
- Behavioral differences:
  - `HttpClientRequest.toUrl(...)` / query assertion mismatch in wasm-rquickjs
  - HTTP success-response JSON parsing differs for GET (not recognized as array) and POST (yields null body)
- Blockers: `@effect/platform-node` is partially compatible — path, filesystem, key-value store, and error handling all work; HTTP response body parsing via `response.json` has issues

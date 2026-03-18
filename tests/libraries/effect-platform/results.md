# Effect Platform Compatibility Test Results

**Package:** `@effect/platform`
**Version:** `0.95.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-url-headers.js — URL mutation, query params, and headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** `Url.mutate` path fails in wasm-rquickjs when cloning/mutating URL instances (`new URL(self)` path inside `@effect/platform`), causing the component to trap.

### test-02-cookies.js — cookie creation, lookup, serialization, and removal
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-http-request-body.js — HttpClientRequest builder and body encoders
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true` (`AssertionError: false == true`)
- **Root cause:** Behavioral difference in URL handling: `HttpClientRequest.toUrl(...)` did not preserve/apply the appended query parameter (`source=effect-platform-test`) in wasm-rquickjs.

### test-04-memory-kv-and-path.js — KeyValueStore memory layer and Path layer
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-http-client-invalid-url.js — invalid URL RequestError surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-get.js — FetchHttpClient GET request and JSON response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-post.js — FetchHttpClient POST request and JSON body handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — non-2xx response handling via `filterStatusOk`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 3/5
- Integration tests passed: 3/3 (HTTP mock server)
- Live service tests passed: N/A — not a service client library
- Missing APIs: None observed in this test set
- Behavioral differences:
  - `Url.mutate` fails during URL cloning/mutation in wasm-rquickjs
  - `HttpClientRequest.toUrl` query-string behavior differs from Node.js for appended URL params
- Blockers: URL utility behavior mismatches prevent full compatibility for `@effect/platform` request/URL helper usage

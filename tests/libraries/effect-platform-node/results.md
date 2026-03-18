# Effect Platform Node Compatibility Test Results

**Package:** `@effect/platform-node`
**Version:** `0.95.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-node-path-layer.js — NodePath layer path operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-node-filesystem-temp-io.js — NodeFileSystem directory IO (mkdir/write/read/rename/remove)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: NotFound: FileSystem.makeDirectory (./effect-platform-node-fs-1773846849110): ENOENT: no such file or directory, mkdir '/effect-platform-node-fs-1773846849110'`
- **Root cause:** Filesystem directory creation from `@effect/platform-node` resolves to an unwritable/non-existent root path (`/...`) in this WASI runtime configuration.

### test-03-node-kv-filesystem.js — NodeKeyValueStore filesystem backend
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: NotFound: FileSystem.makeDirectory (./effect-platform-node-kv-1773846878554): ENOENT: no such file or directory, mkdir '/effect-platform-node-kv-1773846878554'`
- **Root cause:** `NodeKeyValueStore.layerFileSystem(...)` depends on filesystem directory creation, which fails for the same WASI path-resolution/writeability limitation.

### test-04-node-http-client-invalid-url.js — NodeHttpClient invalid URL RequestError
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-node-http-client-request-builders.js — HttpClientRequest URL/header/body builder behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true`
- **Root cause:** Behavioral mismatch in request URL/query handling (`HttpClientRequest.toUrl(...)` did not satisfy the expected query-parameter assertion in wasm-rquickjs).

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-get.js — NodeHttpClient GET request and JSON response shape
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: false == true`
- **Root cause:** Response payload shape/length mismatch from `response.json` on GET (assertion expecting 2 items failed in wasm-rquickjs).

### test-integration-02-post.js — NodeHttpClient POST request and JSON body parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'id' of null`
- **Root cause:** `response.json` yielded `null` for the POST response body in wasm-rquickjs, so expected JSON fields were unavailable.

### test-integration-03-error-handling.js — non-2xx response handling with `filterStatusOk`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 2/5
- Integration tests passed: 1/3 (HTTP mock server)
- Live service tests passed: N/A — not a service client library
- Missing APIs: None directly observed in this test set
- Behavioral differences:
  - Filesystem directory creation paths from `@effect/platform-node` failed in the WASI runtime (`ENOENT` on resolved root paths)
  - `HttpClientRequest.toUrl(...)` / query assertion mismatch
  - HTTP success-response JSON parsing differed for GET/POST integration flows (unexpected payload length/null body)
- Blockers: `@effect/platform-node` is only partially compatible in wasm-rquickjs due filesystem path handling and successful-response HTTP body behavior differences

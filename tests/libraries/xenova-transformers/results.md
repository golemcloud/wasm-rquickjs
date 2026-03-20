# Transformers.js Compatibility Test Results

**Package:** `@xenova/transformers`
**Version:** `2.17.2`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — env configuration mutability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-export-surface.js — core export availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-config-remote-template.js — AutoConfig + custom cache + remote path template
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-config-disabled.js — invalid configuration error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-custom-cache.js — AutoConfig via `env.customCache`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-remote-config.js — fetch config from mock server
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: HTTP request failed`
- **Root cause:** The library's internal `fetch()` call to `http://localhost:18080/models/mock-model/resolve/main/config.json` fails in the wasm-rquickjs runtime. The `wasi:http` outgoing handler cannot connect to `localhost` when running inside `wasmtime`.

### test-integration-02-remote-404.js — 404 propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (timeout)
- **Error:** Test timed out after 60 seconds
- **Root cause:** The `fetch()` call to localhost hangs rather than failing fast, causing the test to exceed the timeout.

### test-integration-03-invalid-json.js — malformed JSON handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected error: Could not locate file: "http://localhost:18080/models/invalid-json/resolve/main/config.json".`
- **Root cause:** The HTTP request fails before the library can attempt JSON parsing, so the error is a "could not locate file" rather than a JSON parse error. The `assert.rejects` check for "JSON" in the error message fails.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/3 (all fail due to `wasi:http` inability to reach localhost mock server from within wasmtime)
- Live service tests passed: N/A — not a token-gated service-client library
- Missing APIs / globals: None — the previous blocker (`self is not defined`) has been resolved
- Behavioral differences: HTTP fetch to localhost fails in the WASM runtime
- Blockers: None for offline usage; HTTP-based model loading requires a reachable remote host (not localhost)

# Axios Compatibility Test Results

**Package:** `axios`
**Version:** `1.7.9`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-utilities.js — Pure utility functions (getUri, HttpStatusCode, isAxiosError, isCancel, mergeConfig)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-headers.js — AxiosHeaders creation, get/set/has/delete, case-insensitive access
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-interceptors.js — axios.create, interceptor use/eject/clear, instance getUri
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-http-get.js — HTTP GET request to httpbin.org with query params
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-http-post.js — HTTP POST with JSON body, error handling for 404
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None

Axios works fully in the wasm-rquickjs runtime, including both pure computation features (URL building, headers, config merging, error types) and actual HTTP requests (GET with params, POST with JSON body, error handling for non-2xx responses) via the `wasi:http` adapter.

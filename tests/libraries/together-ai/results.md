# Together AI SDK Compatibility Test Results

**Package:** `together-ai`
**Version:** `0.37.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client construction and core namespace getters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — missing API key behavior and `withOptions` cloning
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-mock-api.js — `models.list()` with mocked fetch and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-retry.js — retry flow on HTTP 429 using mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-helpers.js — `APIError.generate` and `toFile` helper behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live Together.ai API calls** (`chat.completions.create`, `completions.create`, `embeddings.create`, `images.create`, etc.) — require a valid Together.ai API key and live network access.
- **Streaming responses against production endpoints** — require authenticated live API connectivity.

To fully test these features, a user would need to:
1. Register at https://api.together.xyz/.
2. Obtain an API key.
3. Set `TOGETHER_API_KEY=<key>`.
4. Re-run credentialed tests against live endpoints.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none identified in tested paths
- Behavioral differences: none
- Blockers: none — all offline tests pass
- **Previous issue resolved:** The `cannot read property 'Symbol.iterator' of undefined` error in the HTTP headers path (tests 03 and 04) has been fixed in the runtime.

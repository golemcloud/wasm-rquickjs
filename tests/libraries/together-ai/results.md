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
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
- **Root cause:** Request execution fails in the runtime HTTP/headers path before mocked `models.list()` response handling can complete.

### test-04-retry.js — retry flow on HTTP 429 using mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
- **Root cause:** Same HTTP headers/request-path incompatibility blocks SDK retry handling.

### test-05-helpers.js — `APIError.generate` and `toFile` helper behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this SDK targets Together.ai's hosted API and is not tied to a Docker-hostable local service.

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live Together.ai API calls** (`chat.completions.create`, `completions.create`, `embeddings.create`, `images.create`, etc.) — require a valid Together.ai API key and live network access.
- **Streaming responses against production endpoints** — require authenticated live API connectivity.

To fully test these features, a user would need to:
1. Register at https://api.together.xyz/.
2. Obtain an API key.
3. Set `TOGETHER_API_KEY=<key>`.
4. Re-run credentialed tests against live endpoints after request-path runtime issues are resolved.

## Summary

- Offline tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: none directly identified in tested constructor/helper paths
- Behavioral differences: SDK request/retry paths fail in wasm-rquickjs with `cannot read property 'Symbol.iterator' of undefined`
- Blockers: Runtime HTTP headers interoperability issue prevents Together SDK request methods from completing

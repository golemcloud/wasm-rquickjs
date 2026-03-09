# OpenAI SDK Compatibility Test Results

**Package:** `openai`
**Version:** `6.27.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — client construction and `withOptions` cloning
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — missing API key validation and env fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-mock-api.js — `models.list()` with mocked fetch and response metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined` (stack includes `at get headers (__wasm_rquickjs_builtin/http:337:26)` and `at makeRequest (bundle/script_module:7163:23)`)
- **Root cause:** Runtime incompatibility in the HTTP headers/request path used by OpenAI SDK request construction.

### test-04-retry.js — retry behavior on HTTP 429 with mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined` (stack includes `at get headers (__wasm_rquickjs_builtin/http:337:26)` and `at makeRequest (bundle/script_module:7163:23)`)
- **Root cause:** Same HTTP headers/request-path incompatibility blocks request execution before retry logic can complete.

### test-05-helpers.js — `toFile` helper for byte input
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following OpenAI SDK features could not be fully tested without external dependencies:

- **Live OpenAI API calls** (`chat.completions.create`, `responses.create`, embeddings, files, audio, images, etc.) — require a valid `OPENAI_API_KEY` and network access to OpenAI services.
- **Realtime API** (`client.realtime`) — requires live WebSocket connectivity and valid credentials.
- **Credential-dependent end-to-end webhook scenarios** — require realistic signed webhook payloads and integration setup.

To fully test these features, a user would need to:
1. Register at https://platform.openai.com.
2. Obtain an API key.
3. Set `OPENAI_API_KEY=<key>`.
4. Re-run tests that execute live API paths.

## Summary

- Tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline helpers/constructor paths
- Behavioral differences: request execution fails in wasm-rquickjs for OpenAI SDK HTTP path with `cannot read property 'Symbol.iterator' of undefined`
- Blockers: HTTP request path incompatibility prevents exercising request/retry flows

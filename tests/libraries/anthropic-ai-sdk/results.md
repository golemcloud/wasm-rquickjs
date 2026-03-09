# Anthropic SDK Compatibility Test Results

**Package:** `@anthropic-ai/sdk`
**Version:** `0.78.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — client construction, static constants, and `withOptions`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-url.js — `buildURL` with base URL and query composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-build-request.js — `buildRequest` header/body request construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-mock-api.js — `messages.create()` with mocked fetch and response metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:**
  - `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack includes `at get headers (__wasm_rquickjs_builtin/http:337:26)` and `at makeRequest (bundle/script_module:4921:23)`
- **Root cause:** Runtime incompatibility in the HTTP headers/request path used during Anthropic SDK request execution.

### test-05-errors-helpers.js — API error class mapping and `toFile` helper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following Anthropic SDK features could not be fully tested without external dependencies:

- **Live Anthropic API calls** (real model inference, file APIs, batch flows) — require a valid `ANTHROPIC_API_KEY` and network access to Anthropic services.
- **Streaming responses from live endpoints** — require a real API connection and credentials.

To fully test these features, a user would need to:
1. Register at https://console.anthropic.com.
2. Obtain an API key.
3. Set `ANTHROPIC_API_KEY=<key>`.
4. Re-run tests that execute live API paths.

## Summary

- Tests passed: 4/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline constructor/request-builder/helper paths
- Behavioral differences: request execution fails in wasm-rquickjs for Anthropic SDK with `cannot read property 'Symbol.iterator' of undefined`
- Blockers: HTTP request path incompatibility prevents fully exercising request/response handling methods such as `messages.create()`

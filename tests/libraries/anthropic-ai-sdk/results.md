# Anthropic SDK Compatibility Test Results

**Package:** `@anthropic-ai/sdk`
**Version:** `0.78.0`
**Tested on:** 2026-03-17

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
- **wasm-rquickjs:** ✅ PASS

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

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none — the `Symbol.iterator` issue from the previous test run (2026-03-09) is now resolved

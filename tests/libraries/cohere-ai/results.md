# Cohere AI Compatibility Test Results

**Package:** `cohere-ai`
**Version:** `7.20.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client construction, default environment, and resource getters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** The bundled SDK still requires the `formdata-node` module at initialization time, but this module is not available in the wasm-rquickjs runtime module resolver.

### test-02-check-api-key.js — checkApiKey() auth headers and withRawResponse()
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same initialization-time module resolution failure before any test logic runs.

### test-03-tokenization.js — tokenize/detokenize request serialization and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same initialization-time module resolution failure before any request mocking code executes.

### test-04-v2-chat.js — v2 chat response parsing and process.env token fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same initialization-time module resolution failure before any API call code executes.

### test-05-errors.js — CohereError/CohereTimeoutError behavior on HTTP failures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same initialization-time module resolution failure before any assertions run.

## Integration Tests (Docker)

N/A — this SDK targets the hosted Cohere API and is not tied to a Docker-hostable local service.

## Untestable Features

The following features could not be fully validated in this environment:

- **Live Cohere API calls (`chat`, `chatStream`, `embed`, `rerank`, etc.)** — Require a valid Cohere API key and live network calls to Cohere endpoints.
- **Streaming against production endpoints** — Requires authenticated live API access.

To fully test these features, a user would need to:
1. Create a Cohere account and obtain an API key.
2. Set `CO_API_KEY=<key>`.
3. Re-run credentialed/live-call tests after resolving the `formdata-node` runtime import issue.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: N/A (failure happens before API execution)
- Behavioral differences: N/A (runtime initialization fails)
- Blockers: Runtime cannot resolve `formdata-node`, so the package cannot initialize in wasm-rquickjs

# Mistral SDK Compatibility Test Results

**Package:** `@mistralai/mistralai`
**Version:** `1.15.1`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — client initialization and core namespace getters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-http-hooks.js — `HTTPClient` hook ordering and header mutation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-chat-complete.js — mocked `chat.complete()` request serialization + response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
  - Stack excerpt: `at UnexpectedClientError (bundle/script_module:624:10)` → `at _restoreContext (node:async_hooks:148:12)`
- **Root cause:** SDK request path invokes something that is not a function in the WASM runtime's async_hooks or HTTP client layer. The custom HTTPClient fetcher does not get called; the error occurs internally during request dispatch.

### test-04-embeddings-env.js — env API key fallback and `serverURL` override in `embeddings.create()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected HTTP client error: TypeError: not a function`
  - Stack excerpt: same as test-03
- **Root cause:** Same SDK request dispatch issue as test-03, triggered through the embeddings endpoint path.

### test-05-components-errors.js — component JSON helpers and SDK error classes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this SDK targets Mistral's hosted API and is not tied to a Docker-hostable local service.

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live Mistral API calls** (chat completions, embeddings, files, OCR, agents, fine-tuning, etc.) — Require a valid Mistral API key and live network access to Mistral endpoints.
- **Streaming and realtime production flows** — Require authenticated live API/WebSocket connections.

To fully test these features, a user would need to:
1. Register at https://console.mistral.ai/.
2. Obtain an API key.
3. Set `MISTRAL_API_KEY=<key>`.
4. Re-run credentialed tests against live endpoints after request-path runtime issues are resolved.

## Summary

- Offline tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: none directly identified in tested offline utility paths
- Behavioral differences: SDK request dispatch fails with `TypeError: not a function` in the async_hooks/HTTP client layer when the SDK's internal `_createRequest` path is exercised
- Blockers: Runtime incompatibility in request dispatch prevents SDK operation methods (chat.complete, embeddings.create) from executing

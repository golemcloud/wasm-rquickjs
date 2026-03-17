# Mistral SDK Compatibility Test Results

**Package:** `@mistralai/mistralai`
**Version:** `1.15.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client initialization and core namespace getters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-http-hooks.js — `HTTPClient` hook ordering and header mutation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
- **Root cause:** Runtime incompatibility in the `node:http` request header handling path when SDK `HTTPClient` issues a request.

### test-03-chat-complete.js — mocked `chat.complete()` request serialization + response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
  - Stack excerpt: `at _createRequest (bundle/script_module:6104:29)`
- **Root cause:** Runtime type-conversion mismatch in request construction for SDK chat calls.

### test-04-embeddings-env.js — env API key fallback and `serverURL` override in `embeddings.create()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
  - Stack excerpt: `at _createRequest (bundle/script_module:6104:29)`
- **Root cause:** Same request-construction conversion issue as chat calls, triggered in embeddings endpoint path.

### test-05-components-errors.js — component JSON helpers and SDK error classes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this SDK targets Mistral’s hosted API and is not tied to a Docker-hostable local service.

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

- Offline tests passed: 2/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: none directly identified in tested offline utility paths
- Behavioral differences: SDK request/HTTP paths fail in wasm-rquickjs (`headers` iterator error and JS object→string conversion error)
- Blockers: Runtime incompatibilities in request/header handling prevent most SDK operation methods from executing

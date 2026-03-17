# Ollama JS Compatibility Test Results

**Package:** `ollama`
**Version:** `0.6.3`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — constructor host normalization with mocked `version()` calls
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at checkOk (bundle/script_module:697:17)`
  - Stack excerpt: `at get (bundle/script_module:788:17)`
- **Root cause:** Runtime HTTP response/header handling fails while processing Ollama client's GET request path.

### test-02-version.js — `version()` request with configured headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at checkOk (bundle/script_module:697:17)`
  - Stack excerpt: `at get (bundle/script_module:788:17)`
- **Root cause:** Same runtime HTTP response/header iteration issue blocks the SDK's `version()` path.

### test-03-embed.js — `embed()` POST request and JSON response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at checkOk (bundle/script_module:697:17)`
  - Stack excerpt: `at get (bundle/script_module:788:17)`
- **Root cause:** The runtime HTTP layer fails before Ollama's response parsing logic can complete.

### test-04-stream-chat.js — streaming `chat(..., { stream: true })` NDJSON consumption
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at checkOk (bundle/script_module:697:17)`
  - Stack excerpt: `at get (bundle/script_module:788:17)`
- **Root cause:** Same HTTP response/header handling failure prevents the stream path from initializing.

### test-05-error.js — non-2xx error handling (`show()` should expose status/details)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Expected values to be strictly equal: undefined !== 404`
  - Stack excerpt: `AssertionError: Expected values to be strictly equal: undefined !== 404`
  - Stack excerpt: `at run (bundle/script_module:1223:22)`
- **Root cause:** In wasm-rquickjs, the thrown error object from the failed request path does not expose the expected `status_code` shape from Node.js (`ResponseError` compatibility difference).

## Integration Tests (Docker)

N/A — Ollama JS is an HTTP client SDK, not a Docker-hosted local dependency in this workflow.

## Integration Tests (HTTP Mock)

N/A — request paths were tested via injected `fetch` mocks in bundled tests; no separate `mock-server.mjs` process was required.

## Live Service Tests

N/A — this run focused on offline/mockable API paths only and did not require credentials from `tests/libraries/.tokens.json`.

## Untestable Features

The following features were not validated end-to-end against a real Ollama daemon:

- **Live text generation/chat/embeddings against an Ollama model** — requires a running local Ollama server and downloaded models.
- **Model lifecycle operations against a real daemon** (`pull`, `push`, `create`, `delete`, `ps`) — require a reachable Ollama service.

To fully test these features, a user would need to:
1. Install and run Ollama locally (https://ollama.com/download).
2. Pull at least one model (for example `ollama pull llama3`).
3. Re-run integration tests that target the live daemon host.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — no token-based live service path for this package
- Missing APIs: none identified at import/build time
- Behavioral differences: request/error handling diverges in wasm-rquickjs HTTP response/header paths; expected `ResponseError` details are not preserved
- Blockers: core HTTP request flows fail with `cannot read property 'Symbol.iterator' of undefined` in `__wasm_rquickjs_builtin/http`, preventing practical SDK use

# OpenAI SDK Compatibility Test Results

**Package:** `openai`
**Version:** `6.27.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client construction and `withOptions` cloning
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — missing API key validation and env fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-mock-api.js — `models.list()` with mocked fetch and response metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-retry.js — retry behavior on HTTP 429 with mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-helpers.js — `toFile` helper for byte input
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-models-list.js — `models.list()` against local HTTP endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-chat-completion.js — `chat.completions.create()` JSON response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-retry.js — retry flow (429 then 200) against local HTTP endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `OPENAI_API_KEY`

### test-live-01-chat-completion.js — live chat.completions.create
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-live-02-streaming.js — live streaming chat completion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-live-03-embeddings.js — live embeddings.create
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following OpenAI SDK features could not be fully tested without additional setup:

- **Realtime API** (`client.realtime`) — requires live WebSocket connectivity and valid credentials.
- **File uploads, images, audio** — require larger payloads and specific model access.

To run the live integration tests, set `OPENAI_API_KEY=<key>` and forward it to wasmtime via `--env`.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 3/3 HTTP mock in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: 3/3 in wasm-rquickjs (3/3 in Node.js)
- Missing APIs: none observed
- Behavioral differences: none
- Blockers: none; live API calls require `OPENAI_API_KEY`

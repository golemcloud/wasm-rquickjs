# Ollama JS Compatibility Test Results

**Package:** `ollama`
**Version:** `0.6.3`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — constructor host normalization with mocked `version()` calls
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-version.js — `version()` request with configured headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-embed.js — `embed()` POST request and JSON response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-stream-chat.js — streaming `chat(..., { stream: true })` NDJSON consumption
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-error.js — non-2xx error handling (`show()` should expose status/details)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not validated end-to-end against a real Ollama daemon:

- **Live text generation/chat/embeddings against an Ollama model** — requires a running local Ollama server and downloaded models.
- **Model lifecycle operations against a real daemon** (`pull`, `push`, `create`, `delete`, `ps`) — require a reachable Ollama service.

To fully test these features, a user would need to:
1. Install and run Ollama locally (https://ollama.com/download).
2. Pull at least one model (for example `ollama pull llama3`).
3. Re-run integration tests that target the live daemon host.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none
- Behavioral differences: none detected
- Blockers: none — all mock-based SDK paths work correctly

# Cohere AI Compatibility Test Results

**Package:** `cohere-ai`
**Version:** `7.20.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — client construction, default environment, and resource getters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-check-api-key.js — checkApiKey() auth headers and withRawResponse()
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-tokenization.js — tokenize/detokenize request serialization and response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-v2-chat.js — v2 chat response parsing and process.env token fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — CohereError/CohereTimeoutError behavior on HTTP failures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this SDK targets the hosted Cohere API and is not tied to a Docker-hostable local service.

## Untestable Features

The following features could not be fully validated in this environment:

- **Live Cohere API calls (`chat`, `chatStream`, `embed`, `rerank`, etc.)** — Require a valid Cohere API key and live network calls to Cohere endpoints.
- **Streaming against production endpoints** — Requires authenticated live API access.

To fully test these features, a user would need to:
1. Create a Cohere account and obtain an API key.
2. Set `CO_API_KEY=<key>`.
3. Re-run credentialed/live-call tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all offline tests pass in wasm-rquickjs

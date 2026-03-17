# VoyageAI SDK Compatibility Test Results

**Package:** `voyageai`
**Version:** `0.2.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — embed() basic request/response flow with custom fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — missing-key throw path and `VOYAGE_API_KEY` env fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-rerank.js — rerank scoring/order and request shape
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-timeout.js — timeout/abort error mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-http-error.js — HTTP 401 error mapping to SDK error type
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-embed.js — live HTTP embed call against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-rerank.js — live HTTP rerank call against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-retry.js — retry behavior (429 then 200) against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested in live mode:

- **Real Voyage API calls** (production embeddings/reranking) — require `VOYAGE_API_KEY`.
- **Local model/tokenizer path** (`voyage-4-nano`, `tokenize()`) — depends on optional `@huggingface/transformers` + `onnxruntime-node`, which was not installed for this suite.

To fully test live Voyage API calls, set `VOYAGE_API_KEY=<key>` in `tests/libraries/.tokens.json` and add `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `VOYAGE_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none for tested features

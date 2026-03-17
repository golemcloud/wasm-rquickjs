# Pinecone SDK Compatibility Test Results

**Package:** `@pinecone-database/pinecone`
**Version:** `7.1.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — Pinecone client configuration and namespace helper construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor rejects missing `apiKey`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-index-validation.js — `index()` validates required `name` or `host`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-assistant-validation.js — `assistant()` rejects empty assistant names
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-query-validation.js — query validation fails before network calls
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-control-plane.js — `listIndexes()` and `describeIndex()` over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-data-plane.js — `upsert()` + `query()` + `fetch()` over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-inference.js — `inference.embed()` and `inference.rerank()` over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested against the real Pinecone service:

- **Live control/data/inference API calls** — require a valid `PINECONE_API_KEY` and active Pinecone project resources.
- **Assistant live workflows** (chat/chat streaming, file upload against Pinecone-hosted assistants) — require real service credentials and assistant resources.

To fully test live Pinecone API behavior:
1. Add `PINECONE_API_KEY` to `tests/libraries/.tokens.json`.
2. Create `test-live-*.js` scripts that perform minimal-cost live requests.
3. Re-run the same Node.js + wasm-rquickjs flow for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `PINECONE_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none for tested (offline + mock HTTP) features

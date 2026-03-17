# LlamaIndex TS Compatibility Test Results

**Package:** `llamaindex`
**Version:** `0.12.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-document-schema.js — Document/TextNode schema and hashing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-prompt-template.js — PromptTemplate formatting and partials
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-sentence-splitter.js — SentenceSplitter metadata-preserving chunking
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-function-tool.js — FunctionTool metadata/call/bind behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-memory.js — createMemory + staticBlock state handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-openai-chat.js — OpenAI provider `chat()` against mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-rag-query.js — VectorStoreIndex RAG flow (embedding + chat) against mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-openai-retry.js — OpenAI provider retry behavior (429 → 200)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `OPENAI_API_KEY`

### test-live-01-openai-chat.js — live OpenAI chat completion via `@llamaindex/openai`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-live-02-vector-index.js — live VectorStoreIndex retrieval using OpenAI embeddings + LLM
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: 2/2
- Missing APIs: none observed
- Behavioral differences: none observed in the tested surface
- Blockers: none for tested APIs. Live tests in wasm-rquickjs require forwarding `OPENAI_API_KEY` to wasmtime via `--env OPENAI_API_KEY=...`.

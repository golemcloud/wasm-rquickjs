# LangChain OpenAI Compatibility Test Results

**Package:** `@langchain/openai`
**Version:** `1.3.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — ChatOpenAI construction and identifying/profile metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-invocation-params.js — invocation parameter mapping and call-option merge
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-token-counting.js — offline token counting via `getNumTokens`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-structured-output.js — offline `withStructuredOutput` runnable creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-embeddings-config.js — OpenAIEmbeddings constructor/config surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-chat.js — chat completion request + auth/custom headers over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-embeddings.js — embeddings request over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — HTTP 429 propagation to LangChain error metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `OPENAI_API_KEY` (value not logged)

### test-live-01-chat.js — live chat completion request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-live-02-embeddings.js — live embeddings request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP SDK wrapper, mock server is the appropriate integration approach
- Live service tests passed: 2/2
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none

## Notes

- Rollup bundling succeeded for all test scripts.
- Running live wasm tests required forwarding `OPENAI_API_KEY` to `wasmtime` with `--env OPENAI_API_KEY=...` so `process.env.OPENAI_API_KEY` is visible inside the component.

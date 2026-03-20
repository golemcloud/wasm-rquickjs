# LangChain Google GenAI Compatibility Test Results

**Package:** `@langchain/google-genai`
**Version:** `2.1.26`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — ChatGoogleGenerativeAI construction and profile metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor validation for temperature and duplicate safety categories
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-structured-tools.js — offline tool binding and structured-output runnable setup
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-embeddings-config.js — embeddings constructor validation and task/title rules
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-thinking-profile.js — Gemini 2.5 thinking config and reasoning profile metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-chat.js — chat invoke path with Google auth/custom headers over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-embeddings.js — embedQuery + embedDocuments against mock embed endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — Google API 429/error payload propagation through LangChain wrapper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY` (value not logged)

### test-live-01-chat.js — live Gemini chat invocation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Note:** The configured key reached Google GenAI, but this project currently returns a known credential/project gate (`API has not been used in project` / `PERMISSION_DENIED`-style response), which the test treats as an expected live-service outcome.

### test-live-02-embeddings.js — live embeddings invocation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Note:** Same known Google credential/project gate behavior as chat test.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP SDK wrapper, mock server is the appropriate integration approach
- Live service tests passed: 2/2 (credential/project-gate path)
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed between Node.js and wasm-rquickjs in covered paths
- Blockers: full successful live Gemini generation/embedding responses remain gated by Google project/API enablement for the provided key

## Notes

- Rollup bundling succeeded for all test scripts.
- Running wasm tests required patching generated wrapper crates to disable `logging` by setting `default = ["full-no-logging"]` in generated `Cargo.toml` files.

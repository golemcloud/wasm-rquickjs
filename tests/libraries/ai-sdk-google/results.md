# AI SDK Google Provider Compatibility Test Results

**Package:** `@ai-sdk/google`
**Version:** `3.0.43`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — provider factory/model aliases and metadata surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-tools.js — provider-defined tool descriptor factories
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-supported-urls.js — URL capability regexes and `new`-keyword guard
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-do-generate-mock.js — `doGenerate()` request construction with mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-embeddings.js — `doEmbed()` batch request parsing and 2048-value guard
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-generate.js — `doGenerate()` over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-headers.js — API key + custom headers over HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — Google API error payload propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY` (mapped to `GOOGLE_GENERATIVE_AI_API_KEY` for runtime)

### test-live-01-generate.js — live Gemini request with credential/project-gate handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Note:** The configured token reaches the live endpoint, but this project currently receives a Google API enablement/permission gate (`generativelanguage.googleapis.com` not enabled for the key's project). The test treats this known live-service gate as an expected outcome.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — not applicable for this HTTP SDK adapter
- Live service tests passed: 1/1 (credential/project gate path)
- Missing APIs: None observed in covered `@ai-sdk/google` surface
- Behavioral differences: None observed between Node.js and wasm-rquickjs in covered scenarios
- Blockers: Full successful Gemini generation could not be verified with the current token project configuration because the Generative Language API is not enabled for that Google Cloud project

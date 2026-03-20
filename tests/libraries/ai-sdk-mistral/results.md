# AI SDK Mistral Provider Compatibility Test Results

**Package:** `@ai-sdk/mistral`
**Version:** `3.0.24`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — provider factory aliases and metadata exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — unsupported image model rejection and embedding aliases
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-do-generate-mock.js — `doGenerate()` request/response with injected fetch mock
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-embedding-mock.js — `embedding().doEmbed()` request body and embedding response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-supported-urls.js — `supportedUrls` shape and HTTPS PDF matcher behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-generate.js — `doGenerate()` over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-headers.js — auth and custom header forwarding over HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — Mistral API error propagation from HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the real Mistral service because `tests/libraries/.tokens.json` does not contain `MISTRAL_API_KEY`:

- Live Mistral API calls against `https://api.mistral.ai/v1`
- Streaming behavior and service-specific production responses/rate limits

To fully test live service behavior, a user would need to:
1. Obtain a Mistral API key
2. Add `MISTRAL_API_KEY` to `tests/libraries/.tokens.json`
3. Re-run `test-live-*.js` scripts for this package

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — not applicable for this HTTP SDK adapter
- Live service tests passed: N/A — no `MISTRAL_API_KEY` token available
- Missing APIs: none observed in covered tests
- Behavioral differences: none observed in covered tests
- Blockers: none for offline and mock-HTTP usage; live endpoint behavior remains unverified without credentials

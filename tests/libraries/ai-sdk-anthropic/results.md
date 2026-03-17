# AI SDK Anthropic Provider Compatibility Test Results

**Package:** `@ai-sdk/anthropic`
**Version:** `3.0.58`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — provider factory and metadata surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor validation and unsupported model kinds
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-tools.js — Anthropic tool factory descriptors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-do-generate-mock.js — request construction and mocked response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-supported-urls.js — supported URL and MIME capability helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-generate.js — doGenerate over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-headers.js — Anthropic auth/version/custom headers over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — API error propagation from HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the real Anthropic service because `tests/libraries/.tokens.json` does not contain `ANTHROPIC_API_KEY`:

- Live Anthropic API calls (real `messages.create` behavior and model responses)
- Streaming behavior and service-specific rate/overload handling against Anthropic's production endpoints

To fully test live service behavior, a user would need to:
1. Obtain an Anthropic API key
2. Add `ANTHROPIC_API_KEY` to `tests/libraries/.tokens.json`
3. Re-run `test-live-*.js` scripts for this package

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — not applicable for this HTTP SDK adapter
- Live service tests passed: N/A — no `ANTHROPIC_API_KEY` token available
- Missing APIs: None observed in covered tests
- Behavioral differences: None observed in covered tests
- Blockers: None for offline and mock-HTTP use; live Anthropic endpoint behavior remains unverified without credentials

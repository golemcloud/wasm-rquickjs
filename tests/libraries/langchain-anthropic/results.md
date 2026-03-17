# LangChain Anthropic Compatibility Test Results

**Package:** `@langchain/anthropic`
**Version:** `1.3.24`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — ChatAnthropic construction and identifying parameter surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-invocation-params.js — invocation parameter mapping and thinking-mode guardrails
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-tools-formatting.js — tool schema conversion and automatic Anthropic beta selection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-prompt-conversion.js — prompt conversion and structured-output runnable construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-tools-and-ls-params.js — provider tool factories and LangSmith parameter projection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-chat.js — `ChatAnthropic.invoke` success path over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-headers.js — Anthropic auth/version/custom headers over HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-handling.js — Anthropic API error propagation from HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against Anthropic's live API because `tests/libraries/.tokens.json` does not contain `ANTHROPIC_API_KEY`:

- Real `messages.create` calls against Anthropic-hosted models
- Live streaming behavior and provider-side throttling behavior

To fully test this package against live Anthropic endpoints:
1. Add `ANTHROPIC_API_KEY` to `tests/libraries/.tokens.json`
2. Add and run `test-live-*.js` scripts for this package

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP SDK wrapper, mock server is the appropriate integration approach
- Live service tests passed: N/A — no `ANTHROPIC_API_KEY` token available
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for offline/mock coverage; live Anthropic endpoint behavior remains unverified without credentials

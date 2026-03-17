# Instructor JS Compatibility Test Results

**Package:** `@instructor-ai/instructor`
**Version:** `1.7.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-maybe.js — createInstructor proxy + provider detection for OpenAI-compatible clients
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-constructor-validation.js — constructor guardrails for invalid clients and unsupported mode warning path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-passthrough.js — calls without `response_model` pass through to the underlying client and preserve request options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-retry-zod.js — `response_model` validation failure retries and returns parsed payload on retry success
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-max-retries-zero.js — `max_retries: 0` surfaces validation error immediately
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-structured.js — structured TOOLS response parsing over real HTTP transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-retry.js — HTTP response schema mismatch triggers retry and succeeds on corrected second response
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-passthrough.js — pass-through completion behavior over HTTP transport without `response_model`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `OPENAI_API_KEY`

### test-live-01-openai-chat.js — live OpenAI structured output request via Instructor wrapper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — not applicable for this HTTP client wrapper
- Live service tests passed: 1/1
- Missing APIs: None observed in covered `@instructor-ai/instructor` scenarios
- Behavioral differences: None observed between Node.js and wasm-rquickjs in covered scenarios
- Blockers: None

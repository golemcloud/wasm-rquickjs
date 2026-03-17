# HuggingFace Inference Compatibility Test Results

**Package:** `@huggingface/inference`
**Version:** `4.13.3`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client construction, endpoint cloning, and exported provider constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — provider/task validation and request-option preparation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-chat-completion.js — routed `chatCompletion` call with mocked `fetch`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at innerRequest (bundle/script_module:2753:29)`
- **Root cause:** Request-based HTTP path crashes in wasm when HuggingFace client reads response headers.

### test-04-streaming.js — `chatCompletionStream` SSE parsing with mocked `fetch`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at innerStreamingRequest (bundle/script_module:2926:45)`
- **Root cause:** Streaming HTTP path hits the same response-header iteration failure in wasm.

### test-05-text-to-image.js — `textToImage` binary output from custom endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at innerRequest (bundle/script_module:2736:29)`
- **Root cause:** Binary-response request flow fails for the same HTTP headers iterator issue.

## Integration Tests (Docker)

N/A — `@huggingface/inference` is an HTTP API client and does not depend on a Docker-hostable local service.

## Integration Tests (HTTP Mock)

N/A — request paths were tested with deterministic injected `fetch` mocks in offline bundled tests.

## Live Service Tests

N/A — no Hugging Face token key was available in `tests/libraries/.tokens.json`.

## Untestable Features

The following features could not be tested without external credentials:

- **Live Hugging Face Inference API calls** (chat completions, text generation, image/audio/video tasks against hosted models) — requires a Hugging Face token.
- **Provider-routed live requests** (Groq, Together, Replicate, etc.) — require corresponding provider API keys.

To fully test these features, a user would need to:
1. Create an account at https://huggingface.co/ and generate an access token.
2. Optionally generate provider API keys for any third-party provider routes.
3. Set the relevant token(s) in `tests/libraries/.tokens.json`.
4. Re-run live-service tests for request-based inference methods.

## Summary

- Offline tests passed: 2/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — no tokens available
- Missing APIs: none identified in constructor/validation/request-options utility paths
- Behavioral differences: request/stream/binary inference paths fail in wasm-rquickjs with `JavaScript error: cannot read property 'Symbol.iterator' of undefined` from `__wasm_rquickjs_builtin/http` headers access
- Blockers: runtime HTTP response header handling incompatibility prevents core inference request methods from completing

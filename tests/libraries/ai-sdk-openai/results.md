# AI SDK OpenAI Provider Compatibility Test Results

**Package:** `@ai-sdk/openai`
**Version:** `3.0.41`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — provider factory/model aliases and model metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-tools.js — OpenAI built-in provider tool descriptors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-chat-do-generate-mock.js — `chat(...).doGenerate()` with mocked `fetch`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at extractResponseHeaders (bundle/script_module:5820:17)`
  - Stack excerpt: `at postToApi (bundle/script_module:7809:52)`
- **Root cause:** Runtime HTTP response-header handling breaks request-path execution in `@ai-sdk/openai` chat generation.

### test-04-responses-do-generate-mock.js — `responses(...).doGenerate()` with mocked `fetch`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at extractResponseHeaders (bundle/script_module:5820:17)`
  - Stack excerpt: `at postToApi (bundle/script_module:7809:52)`
- **Root cause:** Same runtime HTTP response-header incompatibility blocks Responses API request-path execution.

## Integration Tests (Docker)

N/A — `@ai-sdk/openai` is an HTTP API provider adapter, not a Docker-hostable local-service client.

## Integration Tests (HTTP Mock)

N/A — request-path behavior was covered with deterministic injected `fetch` mocks in offline bundled tests.

## Live Service Tests

**Token(s) used:** `OPENAI_API_KEY` (value not logged)

### test-live-01-chat-completion.js — real `gpt-4o-mini` chat completion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Notes:** In this environment, passing credentials to `wasmtime` required explicit `--env OPENAI_API_KEY=...`.

## Summary

- Offline tests passed: 2/4 in wasm-rquickjs (4/4 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: 1/1
- Missing APIs: none identified in tested constructor/tool descriptor surface
- Behavioral differences: request-path execution fails in wasm-rquickjs for mocked chat/responses generation with `cannot read property 'Symbol.iterator' of undefined` in `__wasm_rquickjs_builtin/http` header handling
- Blockers: HTTP response header handling incompatibility prevents reliable use of mocked request-path APIs for this provider

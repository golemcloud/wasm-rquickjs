# Replicate SDK Compatibility Test Results

**Package:** `replicate`
**Version:** `1.4.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client construction and progress parsing helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — invalid model reference and webhook URL validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-webhooks.js — `validateWebhook` signature verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-mock-request.js — `predictions.create` request path with mocked fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function`
  - Stack excerpt: `at text (__wasm_rquickjs_builtin/http:443:48)`
  - Stack excerpt: `at request (bundle/script_module:2224:44)`
- **Root cause:** Runtime HTTP response handling fails when the SDK request path awaits `response.text()`/response-body parsing.

### test-05-pagination.js — `paginate` over multi-page model listings
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function`
  - Stack excerpt: `at text (__wasm_rquickjs_builtin/http:443:48)`
  - Stack excerpt: `at request (bundle/script_module:2224:44)`
- **Root cause:** Same runtime HTTP response parsing issue blocks paginated request processing.

## Integration Tests (Docker)

N/A — Replicate SDK is an HTTP API client for a hosted service, not a Docker-hostable local dependency.

## Integration Tests (HTTP Mock)

N/A — offline tests used injected `fetch` mocks and did not require a separate mock-server process.

## Live Service Tests

N/A — no `REPLICATE_API_TOKEN` was available in `tests/libraries/.tokens.json`.

## Untestable Features

The following features could not be tested without external credentials:

- **Live prediction execution** (`run`, `stream`, `predictions.create` against Replicate API) — requires `REPLICATE_API_TOKEN`.
- **Live model/deployment/trainings/files API operations** — require authenticated access to `https://api.replicate.com`.

To fully test these features, a user would need to:
1. Create a Replicate account at https://replicate.com/.
2. Generate an API token.
3. Set `REPLICATE_API_TOKEN=<token>`.
4. Re-run live-service tests for prediction/model/deployment paths.

## Summary

- Offline tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — no tokens available
- Missing APIs: none identified in constructor/validation/webhook utility paths
- Behavioral differences: request/pagination paths fail in wasm-rquickjs with `JavaScript error: not a function` in `__wasm_rquickjs_builtin/http` response text handling
- Blockers: runtime HTTP response body API incompatibility prevents Replicate SDK request-based methods from completing

# Replicate SDK Compatibility Test Results

**Package:** `replicate`
**Version:** `1.4.0`
**Tested on:** 2026-03-20

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
- **wasm-rquickjs:** ✅ PASS

### test-05-pagination.js — `paginate` over multi-page model listings
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

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

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — no tokens available
- Missing APIs: none
- Behavioral differences: none
- Blockers: none — all offline tests pass

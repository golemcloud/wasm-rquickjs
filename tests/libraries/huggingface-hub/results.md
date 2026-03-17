# HuggingFace Hub Compatibility Test Results

**Package:** `@huggingface/hub`
**Version:** `2.11.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — constants, repo-type parsing, and cache-folder naming helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-safetensors-utils.js — safetensors shard parsing, glob matching, and quantized tensor checks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-sha256.js — deterministic hashing via `__internal_sha256`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-oauth-url.js — `oauthLoginUrl` PKCE URL creation with mocked OpenID config fetch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at oauthLoginUrl (bundle/script_module:89:32)`
- **Root cause:** OAuth HTTP response handling in wasm fails when iterating response headers from the runtime `node:http` implementation.

### test-05-http-mocks.js — `whoAmI` and `repoExists` with injected mock fetch responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'Symbol.iterator' of undefined`
  - Stack excerpt: `at get headers (__wasm_rquickjs_builtin/http:337:26)`
  - Stack excerpt: `at whoAmI (bundle/script_module:166:32)`
- **Root cause:** Auth request path fails on the same wasm response-header iterator issue.

## Integration Tests (Docker)

N/A — `@huggingface/hub` is an HTTP API client and does not depend on a Docker-hostable local service.

## Integration Tests (HTTP Mock)

N/A — request-path coverage was exercised with deterministic injected `fetch` mocks in offline bundled tests.

## Live Service Tests

N/A — no Hugging Face token key was available in `tests/libraries/.tokens.json`.

## Untestable Features

The following features could not be tested without external credentials:

- **Live Hub API calls** (repository creation/deletion, branch operations, upload/download against real Hub repos) — requires a valid Hugging Face access token.
- **Hosted service operations** (job APIs and authenticated model/dataset/space management against real accounts) — requires authenticated access.

To fully test these features, a user would need to:
1. Create an account at https://huggingface.co and generate an access token.
2. Add a Hugging Face token entry to `tests/libraries/.tokens.json`.
3. Re-run live-service tests for authenticated Hub API calls.

## Summary

- Offline tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — no tokens available
- Missing APIs: none identified in pure utility/hash paths
- Behavioral differences: authenticated HTTP/OAuth request paths fail in wasm-rquickjs with `cannot read property 'Symbol.iterator' of undefined` from `__wasm_rquickjs_builtin/http` headers access
- Blockers: runtime HTTP response header handling incompatibility blocks key Hub API methods that depend on request/response processing

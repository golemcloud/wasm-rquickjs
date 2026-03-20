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
- **wasm-rquickjs:** ✅ PASS

### test-05-http-mocks.js — `whoAmI` and `repoExists` with injected mock fetch responses
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without external credentials:

- **Live Hub API calls** (repository creation/deletion, branch operations, upload/download against real Hub repos) — requires a valid Hugging Face access token.
- **Hosted service operations** (job APIs and authenticated model/dataset/space management against real accounts) — requires authenticated access.

To fully test these features, a user would need to:
1. Create an account at https://huggingface.co and generate an access token.
2. Add a Hugging Face token entry to `tests/libraries/.tokens.json`.
3. Re-run live-service tests for authenticated Hub API calls.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- All previously failing tests (test-04, test-05) now pass — the `Symbol.iterator` response header iteration bug has been fixed
- Missing APIs: none identified
- Behavioral differences: none identified
- Blockers: none

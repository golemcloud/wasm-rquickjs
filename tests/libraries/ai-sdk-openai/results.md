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
- **wasm-rquickjs:** ✅ PASS

### test-04-responses-do-generate-mock.js — `responses(...).doGenerate()` with mocked `fetch`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without external dependencies:

- **API calls to OpenAI** — Requires an `OPENAI_API_KEY` obtained by registering at https://platform.openai.com. Without a valid key, all API calls return authentication errors.
- **Streaming completions** — Depends on a live API connection; cannot be tested offline.

To fully test this library, a user would need to:
1. Register at https://platform.openai.com
2. Obtain an API key
3. Set the environment variable `OPENAI_API_KEY=<key>`
4. Re-run the test scripts that are marked as requiring credentials

## Summary

- Offline tests passed: 4/4 in wasm-rquickjs (4/4 in Node.js)
- Missing APIs: none identified
- Behavioral differences: none
- Blockers: none — all offline tests pass
- **Previous issue resolved:** The `cannot read property 'Symbol.iterator' of undefined` error in `__wasm_rquickjs_builtin/http` header handling (tests 03 & 04) has been fixed.

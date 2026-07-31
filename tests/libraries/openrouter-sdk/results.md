# OpenRouter SDK Compatibility Test Results

**Package:** `@openrouter/sdk`
**Version:** `0.12.35`
**Tested on:** 2026-07-31

## Test Results

### test-01-basic.js — client construction and core API surface
- **Bundled Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18083`

### test-integration-01-chat-send.js — chat request and response parsing
- **Bundled Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Coverage:** Executes the SDK's real `Request.clone()` and `fetch` path, verifies
  authorization and JSON request payload at the server, and parses a deterministic
  chat-completion response.

## Bundling

Rollup reports that top-level `this` was rewritten to `undefined` in generated
TypeScript helper expressions in `esm/lib/sdks.js` and `esm/types/async.js`.
It also reports Zod's internal circular dependency. Both bundles complete and
execute successfully in Node.js and wasm-rquickjs, so these warnings are
non-blocking for version 0.12.35.

## Live Service Tests

Live OpenRouter requests were not run because no `OPENROUTER_API_KEY` is
configured. The deterministic HTTP mock covers request construction, transport,
and response decoding without credentials or external network access.

## Summary

- Offline tests passed: 1/1 in wasm-rquickjs (1/1 bundled Node.js)
- HTTP mock integration tests passed: 1/1 in wasm-rquickjs (1/1 bundled Node.js)
- Live service tests passed: N/A — no OpenRouter token configured
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none; live API calls require an `OPENROUTER_API_KEY`

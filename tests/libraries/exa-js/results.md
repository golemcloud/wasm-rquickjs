# Exa JS Compatibility Test Results

**Package:** `exa-js`
**Version:** `2.8.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client construction and API surface availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor/input validation error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-request-shaping.js — request payload shaping for `search`, `findSimilar`, and `getContents`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-zod-and-pagination.js — Zod schema conversion and pagination parameter wiring
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-polling-helpers.js — polling helper completion and timeout paths (`research`, `websets`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-search.js — `search()` request/response path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-contents-and-answer.js — `getContents()` and `answer()` JSON handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-stream-answer.js — `streamAnswer()` SSE chunk and citation parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain `EXA_API_KEY`.

## Untestable Features

The following features could not be tested without a real Exa API key:

- **Live Exa API calls against `https://api.exa.ai`** — requires `EXA_API_KEY`
- **Service-side ranking/crawl behavior** — depends on Exa backend responses and cannot be validated offline

To fully test these features, provide `EXA_API_KEY` in `tests/libraries/.tokens.json` and add `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `EXA_API_KEY` token available
- Missing APIs: none observed
- Behavioral differences: none observed in tested paths
- Blockers: live Exa service behavior remains credential-gated

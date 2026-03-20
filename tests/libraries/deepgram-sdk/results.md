# Deepgram SDK Compatibility Test Results

**Package:** `@deepgram/sdk`
**Version:** `5.0.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client initialization and namespace availability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth-and-validation.js — auth header prefix behavior and missing credential validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-environment-and-errors.js — environment constants and error classes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-websocket-construction.js — websocket connection object creation and query parameter wiring
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-websocket-guards.js — websocket send guards before `connect()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-transcribe-url.js — `listen.v1.media.transcribeUrl()` request/response path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-read-analyze.js — `read.v1.text.analyze()` body + response handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-speak-generate.js — `speak.v1.audio.generate()` binary response handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-04-auth-and-models.js — `auth.v1.tokens.grant()` and `manage.v1.models.list()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain `DEEPGRAM_API_KEY`.

## Untestable Features

The following features could not be tested without a real Deepgram API key:

- **Live Deepgram API calls against `https://api.deepgram.com`** — requires `DEEPGRAM_API_KEY`
- **Real streaming speech recognition/text-to-speech behavior against Deepgram services** — requires authenticated live WebSocket/API access

To fully test these features, provide `DEEPGRAM_API_KEY` in `tests/libraries/.tokens.json` and add `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 4/4 (HTTP mock)
- Live service tests passed: N/A — no `DEEPGRAM_API_KEY` token available
- Missing APIs: none observed in tested paths
- Behavioral differences: none observed in tested paths
- Blockers: live Deepgram service behavior remains credential-gated

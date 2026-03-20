# ElevenLabs Compatibility Test Results

**Package:** `elevenlabs`
**Version:** `1.59.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — client initialization and core exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-api-key-resolution.js — API key resolution and missing-key behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-generate-routing.js — `generate()` routing for direct voice IDs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-generate-voice-name-resolution.js — `generate()` voice-name resolution and unknown-voice error
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — `ElevenLabsError` and `ElevenLabsTimeoutError` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-voices.js — `voices.getAll()` against mock API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-models-and-user.js — `models.getAll()`, `user.get()`, and `user.getSubscription()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-tts-and-errors.js — `textToSpeech.convertWithTimestamps()` and HTTP 404 error mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain `ELEVENLABS_API_KEY`.

## Untestable Features

The following features could not be tested without external credentials:

- **Live ElevenLabs API calls** — requires `ELEVENLABS_API_KEY`
- **Real text-to-speech synthesis quality/voice behavior** — requires authenticated calls to ElevenLabs service
- **Voice cloning, workspace/account APIs, and production-rate-limit behavior** — require authenticated account-level access

To fully test live service behavior, add `ELEVENLABS_API_KEY` to `tests/libraries/.tokens.json` and run `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `ELEVENLABS_API_KEY` token available
- Missing APIs: none
- Behavioral differences: none
- Blockers: none — previous `formdata-node` bundling issue resolved by adding `exportConditions: ["node", "import", "default"]` to Rollup's `nodeResolve` plugin

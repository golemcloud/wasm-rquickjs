# ElevenLabs Compatibility Test Results

**Package:** `elevenlabs`
**Version:** `1.59.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — client initialization and core exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Rollup output still contains an external `formdata-node` import; wasm-rquickjs cannot resolve third-party npm modules at runtime

### test-02-api-key-resolution.js — API key resolution and missing-key behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** SDK initialization fails before test logic executes because unresolved `formdata-node` is imported during module load

### test-03-generate-routing.js — `generate()` routing for direct voice IDs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure

### test-04-generate-voice-name-resolution.js — `generate()` voice-name resolution and unknown-voice error
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure

### test-05-errors.js — `ElevenLabsError` and `ElevenLabsTimeoutError` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-voices.js — `voices.getAll()` against mock API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure before any HTTP request runs

### test-integration-02-models-and-user.js — `models.getAll()`, `user.get()`, and `user.getSubscription()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure before any HTTP request runs

### test-integration-03-tts-and-errors.js — `textToSpeech.convertWithTimestamps()` and HTTP 404 error mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Cannot find module 'formdata-node'`
- **Root cause:** Same startup module-resolution failure before any HTTP request runs

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain `ELEVENLABS_API_KEY`.

## Untestable Features

The following features could not be tested without external credentials:

- **Live ElevenLabs API calls** — requires `ELEVENLABS_API_KEY`
- **Real text-to-speech synthesis quality/voice behavior** — requires authenticated calls to ElevenLabs service
- **Voice cloning, workspace/account APIs, and production-rate-limit behavior** — require authenticated account-level access

To fully test live service behavior, add `ELEVENLABS_API_KEY` to `tests/libraries/.tokens.json` and run `test-live-*.js` scripts.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (Node.js: 5/5)
- Integration tests passed: 0/3 in wasm-rquickjs (Node.js HTTP mock: 3/3)
- Live service tests passed: N/A — no `ELEVENLABS_API_KEY` token available
- Missing APIs: none identified (failure occurs before API usage)
- Behavioral differences: not measurable due module initialization failure
- Blockers: wasm-rquickjs cannot run the bundled `elevenlabs` SDK because module initialization fails with `Cannot find module 'formdata-node'`

# Microsoft Cognitive Services Speech SDK Compatibility Test Results

**Package:** `microsoft-cognitiveservices-speech-sdk`
**Version:** `1.48.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — SpeechConfig base construction and property configuration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — SpeechConfig validation and endpoint/host constructors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-translation-config.js — translation and source-language configuration APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-audio-streams.js — audio stream format, push stream, and pull stream APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-pronunciation-and-connection.js — pronunciation configuration and connection management APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-voices-list.js — `getVoicesAsync()` HTTP endpoint behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-recognize-cancel.js — websocket recognition path against mock rejection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: expected recognizeOnceAsync() to attempt a websocket upgrade`
- **Root cause:** Behavioral difference in websocket transport path under wasm-rquickjs: the SDK does not trigger the expected websocket upgrade request to the mock endpoint.

### test-integration-03-speak-cancel.js — websocket synthesis path against mock rejection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: expected speakTextAsync() to attempt a websocket upgrade`
- **Root cause:** Behavioral difference in websocket transport path under wasm-rquickjs: the SDK does not trigger the expected websocket upgrade request to the mock endpoint.

## Live Service Tests

Live service tests were not run because `tests/libraries/.tokens.json` does not contain Azure Speech credentials.

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live Azure Speech recognition and synthesis calls** — Requires valid Azure Speech Service credentials (subscription key/region or auth token) and service access.
- **Production websocket flows against real Azure Speech endpoints** — Mock-server rejection behavior is covered, but full service interaction requires real credentials.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 1/3 (HTTP mock)
- Live service tests passed: N/A — no Azure Speech credentials available
- Missing APIs: none identified in tested offline APIs
- Behavioral differences: websocket recognition/synthesis transport behavior differs from Node.js in mock integration tests
- Blockers: websocket-based Speech SDK runtime paths are only partially working in wasm-rquickjs

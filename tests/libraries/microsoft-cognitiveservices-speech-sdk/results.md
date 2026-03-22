# Microsoft Cognitive Services Speech SDK Compatibility Test Results

**Package:** `microsoft-cognitiveservices-speech-sdk`
**Version:** `1.48.0`
**Tested on:** 2026-03-20

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
- **Root cause:** The SDK's websocket transport path does not trigger the expected HTTP upgrade request to the mock endpoint under wasm-rquickjs. The SDK internally uses `node:http` for websocket upgrade, but the wasm-rquickjs runtime's HTTP implementation does not support websocket upgrade handshakes.

### test-integration-03-speak-cancel.js — websocket synthesis path against mock rejection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: ErrorCode::ConnectionRefused` at `_parseNativeHttpError` / `_emitRequestError` / `_doSend` in `node:http`
- **Root cause:** The SDK's speech synthesis websocket transport fails with a connection refused error when attempting to reach the mock server via wasm-rquickjs's HTTP stack. The underlying issue is the same as integration-02: websocket upgrade is not supported.

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
- Behavioral differences: websocket upgrade handshakes not supported in wasm-rquickjs HTTP stack, causing SDK websocket transport (recognition/synthesis) to fail
- Blockers: websocket-based Speech SDK runtime paths do not work in wasm-rquickjs; HTTP-based endpoints (e.g., getVoicesAsync) work correctly

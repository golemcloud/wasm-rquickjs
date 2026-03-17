# Google Generative AI Compatibility Test Results

**Package:** `@google/generative-ai`
**Version:** `0.24.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — construction, model normalization, and chat history
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — model/chat input validation error paths
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-config.js — generation config, safety settings, and tools wiring
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-enums-errors.js — enum constants and SDK error class hierarchy
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-requests.js — chat defaults and cached-content consistency validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this SDK targets a hosted Google API and is not tied to a Docker-hostable local service.

## Untestable Features

The following features could not be tested without external credentials and live API access:

- **`generateContent()` / `sendMessage()` calls** — Require a valid Google AI API key and network access to Gemini endpoints.
- **`generateContentStream()` / `sendMessageStream()` streaming responses** — Require authenticated live API streaming responses.
- **`countTokens()`, `embedContent()`, `batchEmbedContents()`** — Require authenticated API calls.

To fully test these features, a user would need to:
1. Create a Google AI API key in Google AI Studio.
2. Set `GOOGLE_API_KEY=<key>`.
3. Add credentialed/live-call test scripts and re-run the same Node.js + wasm-rquickjs flow.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Missing APIs: None in the tested offline API surface
- Behavioral differences: None observed in offline tests
- Blockers: Live API functionality requires credentials and external network access

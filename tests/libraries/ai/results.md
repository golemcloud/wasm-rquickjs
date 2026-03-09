# AI SDK Compatibility Test Results

**Package:** `ai`
**Version:** `6.0.116`
**Tested on:** 2026-03-09

## Test Results

### test-01-ids.js — ID helpers (`generateId`, `createIdGenerator`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-math-data.js — vector similarity and deep data equality
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-partial-json.js — partial JSON parsing and repair behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-stop-conditions.js — stop-condition helpers (`stepCountIs`, `hasToolCall`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-prune-messages.js — assistant reasoning pruning policies
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following `ai` features could not be fully tested without external dependencies:

- **Provider-backed model calls** (`generateText`, `streamText`, `embed`, `generateObject`, media generation) when connected to real model providers — require provider credentials and network access.
- **Transport features that depend on live HTTP endpoints** (`HttpChatTransport`) — require an external service to validate end-to-end request/stream behavior.

To fully test these features, a user would need to:
1. Obtain provider credentials (for example OpenAI, Anthropic, or other supported providers).
2. Configure the relevant environment variables for the selected provider.
3. Re-run tests that exercise real provider and transport paths.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline API surface
- Behavioral differences: none observed in tested offline API surface
- Blockers: none for tested utility and message-processing paths

# LangChain.js Compatibility Test Results

**Package:** `langchain`
**Version:** `1.2.30`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — message filtering and trimming utilities
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-tools.js — `DynamicTool` and `tool(...)` invocation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-storage.js — `InMemoryStore` CRUD operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-agent.js — `createAgent` with `fakeModel` for offline agent invocation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-init-chat-model.js — `initChatModel` missing-provider-package error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Unexpected initChatModel error: cannot read property 'split' of undefined`
- **Root cause:** Behavioral difference in error path handling when provider integration package is missing (expected `Unable to import @langchain/openai` message on Node.js).

## Untestable Features

The following LangChain.js features could not be fully tested without external dependencies:

- **Real LLM provider integrations** (`@langchain/openai`, `@langchain/anthropic`, etc.) — require provider packages, API keys, and live network access
- **LangSmith tracing / observability flows** — require LangSmith credentials and network access
- **Vector store integrations** (Pinecone, Chroma, etc.) — require external services and credentials
- **Hub pull/push workflows** — require remote access and optional credentials

To fully test these features, a user would need to:
1. Install the relevant provider/integration packages
2. Obtain and configure provider-specific API keys
3. Provide access to the target external services
4. Re-run integration-focused tests that execute live API calls

## Summary

- Tests passed: 4/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline surfaces
- Behavioral differences: error shape mismatch for `initChatModel(...)` when provider integration package is absent
- Blockers: provider-backed and service-backed features remain unverified without credentials/network

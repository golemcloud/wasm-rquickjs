# Jina AI SDK Compatibility Test Results

**Package:** `@jina-ai/sdk`
**Tested on:** 2026-03-17

## Installation

This package cannot be installed from npm in the current registry:

- **Command:** `npm install`
- **Error:** `npm ERR! code E404`
- **Detail:** `@jina-ai/sdk@latest is not in this registry`

## Test Results

### test-01-basic.js — module import surface
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-02-validation.js — default export presence
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-03-advanced.js — export introspection
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-04-embeddings-shape.js — embeddings API shape
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-05-rerank-shape.js — rerank API shape
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-embeddings.js — embeddings request path
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-integration-02-rerank.js — rerank request path
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

### test-integration-03-errors.js — error handling path
- **Node.js:** ❌ BLOCKED
- **wasm-rquickjs:** ❌ BLOCKED
- **Reason:** Package installation failed (`E404`), so bundling/execution could not start.

## Live Service Tests

- **Status:** N/A — package installation blocked all execution before live test setup
- **Available tokens checked:** `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`, `OPENAI_API_KEY`, `SENDGRID_API_KEY`
- **Relevant Jina token:** Not present

## Summary

- Offline tests passed: 0/5 (blocked)
- Integration tests passed: 0/3 (blocked)
- Live service tests passed: N/A (blocked)
- Missing APIs: N/A (execution did not start)
- Behavioral differences: N/A (execution did not start)
- Blockers: npm registry install failure for `@jina-ai/sdk` (`E404`, package not found)
- Note: npm currently has `jinaai` (`Jina AI JavaScript SDK`) as the published package name.

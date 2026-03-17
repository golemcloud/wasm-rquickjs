# LangChain Community Compatibility Test Results

**Package:** `@langchain/community`
**Version:** `1.1.24`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — calculator tool expression evaluation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — BM25 retriever scoring on in-memory documents
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — CSVLoader blob parsing and column extraction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-transformers.js — HtmlToTextTransformer document conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-event-source-parse.js — event source parsing utilities
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-wikipedia.js — WikipediaQueryRun search + page fetch flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-searxng.js — SearxngSearch POST request + response mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-cheerio-loader.js — CheerioWebBaseLoader HTTP fetch + HTML parse
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

**Token(s) used:** `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` (values not logged)

### test-live-01-google-custom-search.js — live Google Custom Search request
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — HTTP integration paths are covered via mock server
- Live service tests passed: 1/1
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none

## Notes

- Rollup bundling succeeded for all offline, integration, and live test scripts.
- Generated wrapper crates currently default to `normal` features; for wasm execution, `Cargo.toml` was patched to `default = ["full-no-logging"]` to avoid unresolved `wasi:logging` imports in `wasmtime` CLI.

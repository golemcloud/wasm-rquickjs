# LangChain Core Compatibility Test Results

**Package:** `@langchain/core`
**Version:** `1.1.31`
**Tested on:** 2026-03-09

## Test Results

### test-01-messages.js — message coercion, buffer rendering, and storage mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-prompts-runnables.js — prompt formatting and runnable composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-output-parsers.js — string/JSON/list parser behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-tools.js — dynamic tool invocation and schema validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-cache-math.js — document, in-memory cache, and vector math utilities
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully tested in this offline test run:

- **LangSmith-backed tracing and remote observability** — requires external credentials/network.
- **Tokenizer/model-specific encoding downloads** (for some `utils/tiktoken` paths) — may require live network fetches depending on model/encoding usage.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline surfaces
- Behavioral differences: none observed
- Blockers: none for tested offline APIs

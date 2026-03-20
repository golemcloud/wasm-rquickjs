# LangSmith SDK Compatibility Test Results

**Package:** `langsmith`
**Version:** `0.5.10`
**Tested on:** 2026-03-17

## Test Results

### test-01-runtree-basic.js — RunTree creation, child runs, and serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-headers-context.js — distributed trace headers and run context helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-anonymizer.js — anonymizer redaction rules over nested payloads
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-traceable-disabled.js — traceable wrapper behavior with tracing disabled
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-client-fetch-override.js — client construction with custom fetch implementation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-create-run.js — create and read a run over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-update-run.js — patch run outputs over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-list-runs.js — list runs via `/runs/query`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the live LangSmith service because no LangSmith token is available in `tests/libraries/.tokens.json`:

- Dataset, example, and project CRUD calls against real LangSmith workspace state
- Prompt pull/push against live registries
- Evaluation APIs that require authenticated server-backed datasets and feedback writes

To fully test these features, provide `LANGSMITH_API_KEY` (or `LANGCHAIN_API_KEY`) in `tests/libraries/.tokens.json` and add `test-live-*.js` scripts.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no LangSmith token available
- Missing APIs: none observed in tested scenarios
- Behavioral differences: none observed in tested scenarios
- Blockers: live LangSmith API credential required for end-to-end service coverage

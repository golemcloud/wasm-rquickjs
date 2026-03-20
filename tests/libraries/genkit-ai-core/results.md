# GenKit Core Compatibility Test Results

**Package:** `@genkit-ai/core`
**Version:** `1.30.1`
**Tested on:** 2026-03-20

## Test Results

### test-01-actions-flows.js — action() and flow() execute typed handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-schema-validation.js — schema validation and parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-registry-plugin.js — Registry plugin/action/value APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-streaming.js — action stream() chunking and final output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-context-errors.js — context propagation and error helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker-hosted service applicable
- Live service tests passed: N/A — not a service-client library requiring API credentials
- Missing APIs: none
- Behavioral differences: none
- Blockers: none

# SurrealDB Compatibility Test Results

**Package:** `surrealdb`
**Version:** `2.0.2`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — basic value construction and create-query compilation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor validation errors for invalid identifiers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — duration math, UUID generation, and SurrealQL template bindings
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-error-classes.js — disconnected-client error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-codec.js — CBOR codec round-trip for core SurrealDB value types
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-connect.js — connect/health/version flow via HttpEngine
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-query.js — signin/use/query flow via HttpEngine
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-error.js — RPC validation error propagation via HttpEngine
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

Skipped — Docker integration tests not run in this re-test.

## Summary

- Offline tests passed: 5/5
- Integration tests passed (HTTP Mock): 3/3
- Integration tests passed (Docker): N/A — skipped
- Live service tests passed: N/A — not a token-gated external API client
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None — all tested functionality works correctly in wasm-rquickjs

# SurrealDB Compatibility Test Results

**Package:** `surrealdb`
**Version:** `2.0.2`
**Tested on:** 2026-03-18

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

### test-integration-01-http-connect.js — connect/health/version flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Runtime HTTP path fails during JS↔host conversion when SurrealDB performs real HTTP transport operations.

### test-integration-02-http-query.js — signin/use/query flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same HTTP transport conversion failure in wasm-rquickjs.

### test-integration-03-http-error.js — RPC validation error propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same HTTP transport conversion failure in wasm-rquickjs before SurrealDB error-mapping logic can run.

## Integration Tests (Docker)

**Service:** `surrealdb/surrealdb:v2.2.0` on port `18082`

### test-integration-04-docker-connect.js — real SurrealDB connect/version/query
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same HTTP transport conversion failure when talking to a real SurrealDB instance.

### test-integration-05-docker-crud.js — real SurrealDB CRUD lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'`
- **Root cause:** Same HTTP transport conversion failure in wasm-rquickjs blocks network-backed CRUD.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/5 in wasm-rquickjs (Node.js 5/5)
- Live service tests passed: N/A — not a token-gated external API client
- Missing APIs: None observed in offline coverage
- Behavioral differences: HTTP integration paths fail in wasm-rquickjs with JS object→string conversion panic
- Blockers: Real/networked SurrealDB usage is currently blocked by HTTP transport conversion errors in wasm-rquickjs

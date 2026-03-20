# Effect Cluster Compatibility Test Results

**Package:** `@effect/cluster`
**Version:** `0.57.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-entity-protocol.js — Entity protocol definition, RPC annotations, and shard-group routing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-message-serialization.js — Snowflake + Envelope + Message request serialization/deserialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-cluster-errors.js — Cluster error constructors and type guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-entity-test-client.js — in-memory entity handler execution with `Entity.makeTestClient`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-sharding-config.js — `ShardingConfig` defaults and layer override behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-get-pods.js — `K8sHttpClient.makeGetPods()` default pod listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: StatusCode: non 2xx status code (400 GET http://localhost:18080/api/v1/pods)`
- **Root cause:** Query parameters set via `HttpClientRequest.setUrlParam(...)` are not present on the outgoing request in wasm-rquickjs, so the mock server rejects the request (missing required `fieldSelector=status.phase=Running`).

### test-integration-02-namespace-selector.js — namespaced + label-selector pod listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: StatusCode: non 2xx status code (400 GET http://localhost:18080/api/v1/namespaces/payments/pods)`
- **Root cause:** Same query-parameter propagation mismatch as above; `fieldSelector` and/or `labelSelector` are not serialized as expected in wasm-rquickjs.

### test-integration-03-http-error.js — forced server error path and non-2xx handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: expected a 500 status failure message, got: StatusCode: non 2xx status code (400 GET http://localhost:18080/api/v1/pods)`
- **Root cause:** In Node.js, `labelSelector=app=error` is sent and the server returns 500 as expected; in wasm-rquickjs, the selector query parameter is not transmitted, so the request fails earlier with 400.

## Summary

- Offline tests passed: 5/5
- Docker integration tests passed: N/A — no Docker service applicable
- HTTP mock integration tests passed: 0/3
- Live service tests passed: N/A — not a credential-gated service client library
- Missing APIs: None observed in tested `@effect/cluster` surfaces
- Behavioral differences:
  - HTTP query-parameter serialization/propagation mismatch on `HttpClientRequest.setUrlParam(...)` under wasm-rquickjs (Node.js sends expected query params; wasm requests arrive without them)
- Blockers: HTTP-facing cluster helpers (notably `K8sHttpClient.makeGetPods`) are currently not compatible in wasm-rquickjs due query-string handling differences, even though core offline cluster primitives are compatible

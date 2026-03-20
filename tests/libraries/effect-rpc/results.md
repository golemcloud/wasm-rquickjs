# Effect RPC Compatibility Test Results

**Package:** `@effect/rpc`
**Version:** `0.74.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-rpc-definition.js — Rpc.make schemas and prefixing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-group-operations.js — RpcGroup add/merge/prefix behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-rpctest-unary.js — in-memory unary RPC with RpcTest.makeClient
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-rpctest-errors.js — typed failure propagation in RpcTest
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-rpctest-stream-and-flatten.js — stream RPC and flat client mode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-unary.js — HTTP protocol unary RPC call
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-headers.js — RpcClient.withHeaders over HTTP protocol
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-flatten.js — flat client invocation (`flatten: true`) over HTTP protocol
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Docker integration tests passed: N/A — no Docker service applicable
- HTTP mock integration tests passed: 3/3
- Live service tests passed: N/A — not a credential-gated service client library
- Missing APIs: None observed
- Behavioral differences: None observed in tested `@effect/rpc` APIs
- Blockers: None

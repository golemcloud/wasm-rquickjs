# @grpc/grpc-js Compatibility Test Results

**Package:** `@grpc/grpc-js`
**Version:** `1.13.4`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — metadata set/add/get/clone operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — metadata key/value validation rules
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-status-and-enums.js — status enums and `StatusBuilder`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-call-credentials.js — call credentials metadata generation/composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-experimental-and-logging.js — experimental URI/duration/load-balancer helpers and logging API
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested in this run:

- Live RPC calls against a gRPC endpoint (requires a running external service)
- Connection/retry/backoff behavior over real transports
- Server-side APIs that bind/listen for incoming gRPC traffic

To fully test this library, a user would need to:
1. Run a reachable gRPC server (or test fixture service)
2. Re-run client RPC integration scenarios against that server
3. Validate server APIs separately in an environment where server binding is allowed

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested offline API surface
- Behavioral differences: None observed in tested offline API surface
- Blockers: None for offline-compatible `@grpc/grpc-js` usage patterns

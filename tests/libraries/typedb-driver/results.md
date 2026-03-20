# TypeDB Driver Compatibility Test Results

**Package:** `typedb-driver`
**Version:** `2.29.7`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — Exports, constants, and enum helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-options.js — `TypeDBOptions` getters/setters and protobuf conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-stream.js — `Stream` functional helpers (`filter`/`map`/`flatMap`/etc.)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-credential-label.js — `TypeDBCredential` basic fields and `Label` semantics
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — `TypeDBDriverError` and `ErrorMessage` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `vaticle/typedb:2.29.1` on port `17290`

### test-integration-01-connect.js — `coreDriver` connect + database lifecycle + transaction open
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: [NDR7] Driver Error: Unable to connect to TypeDB server.`
- **Root cause:** `typedb-driver` uses gRPC (`@grpc/grpc-js`) over raw socket transport; in wasm-rquickjs this connection path fails, so the driver cannot establish a session with the TypeDB server.

### test-integration-02-crud.js — Schema define, insert, read aggregate, delete
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: [NDR7] Driver Error: Unable to connect to TypeDB server.`
- **Root cause:** Same gRPC connectivity failure as above blocks all end-to-end database operations in wasm-rquickjs.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/2 in wasm-rquickjs (2/2 in Node.js)
- Live service tests passed: N/A — no `typedb-driver`-specific token exists in `tests/libraries/.tokens.json`, and Docker integration already covers live service interaction
- Missing APIs: None observed in offline API coverage
- Behavioral differences: gRPC connection establishment fails in wasm-rquickjs for TypeDB driver (`[NDR7] Unable to connect to TypeDB server`)
- Blockers: TypeDB driver cannot connect to a running TypeDB instance from wasm-rquickjs, so real query execution is unavailable

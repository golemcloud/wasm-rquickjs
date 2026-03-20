# protobufjs Compatibility Test Results

**Package:** `protobufjs`
**Version:** `8.0.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — `Root.fromJSON` with encode/decode roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-longs-and-conversion.js — int64 conversion (`long`) and repeated fields
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-parse-proto.js — `.proto` text parsing and message roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-oneof-and-map.js — oneof selection and map-field serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-rpc-service.js — reflection service client + callback RPC implementation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass

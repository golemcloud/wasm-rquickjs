# protobufjs Compatibility Test Results

**Package:** `protobufjs`
**Version:** `8.0.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — `Root.fromJSON` with encode/decode roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Runtime startup fails while wiring `node:fs`; `require` is not available, so the component traps before test code executes.

### test-02-longs-and-conversion.js — int64 conversion (`long`) and repeated fields
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same startup failure in built-in `node:fs` wiring prevents execution.

### test-03-parse-proto.js — `.proto` text parsing and message roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same startup failure in built-in `node:fs` wiring prevents execution.

### test-04-oneof-and-map.js — oneof selection and map-field serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same startup failure in built-in `node:fs` wiring prevents execution.

### test-05-rpc-service.js — reflection service client + callback RPC implementation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same startup failure in built-in `node:fs` wiring prevents execution.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: No package-level API gaps identified; failure occurs before user test code runs
- Behavioral differences: Runtime abort/trap during built-in initialization (`node:fs`)
- Blockers: Any bundle that triggers current `node:fs` initialization path fails to start because `require` is unavailable in this execution context

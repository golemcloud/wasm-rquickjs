# Effect Compatibility Test Results

**Package:** `effect`
**Version:** `3.20.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Option/Either/Data primitives
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-sync-effect.js — synchronous Effect success + recovery
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-async-effect.js — async Effect APIs (`runPromise`, `sleep`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-schema.js — schema decode/encode and validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-collections.js — HashMap/HashSet/Chunk operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: None observed
- Behavioral differences: None observed in tested Effect core APIs
- Blockers: None

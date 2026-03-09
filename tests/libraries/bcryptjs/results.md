# bcryptjs Compatibility Test Results

**Package:** `bcryptjs`
**Version:** `3.0.3`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Sync salt/hash/compare roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-async.js — Async promise + callback APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-rounds-and-salt.js — Hash metadata APIs (`getRounds`, `getSalt`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-truncation.js — 72-byte truncation behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-validation.js — Invalid hash handling + rounds clamping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested flows
- Behavioral differences: None observed
- Blockers: None

`bcryptjs` is fully compatible for the tested offline hashing/comparison APIs in the current wasm-rquickjs runtime.

# uuid Compatibility Test Results

**Package:** `uuid`
**Version:** `13.0.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Constants, validation, parse/stringify, and version helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-name-based.js — Deterministic name-based UUID generation (`v3`/`v5`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-time-and-conversion.js — Time-based UUIDs (`v1`/`v6`/`v7`) with deterministic random input and v1↔v6 conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-buffer-and-errors.js — Buffer offset APIs and invalid-input error paths
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-default-random.js — Default random generation (`v4`/`v7`) using runtime randomness
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: none identified in tested uuid surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in these tests
- Blockers: none for the tested uuid APIs

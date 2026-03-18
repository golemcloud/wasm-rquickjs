# Effect Schema Compatibility Test Results

**Package:** `@effect/schema`
**Version:** `0.75.5`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — struct decode and typed error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-refinements.js — string refinements and Option decode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-transformations.js — `NumberFromString` and `DateFromString` round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-json-pipeline.js — `parseJson` composition with structured payloads
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-custom-transform.js — custom `Schema.transform` encode/decode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: None observed
- Behavioral differences: None observed in tested schema APIs
- Blockers: None

## Notes

- The npm package emits a deprecation warning (`@effect/schema` merged into `effect`), but runtime behavior in the tested APIs is fully compatible.

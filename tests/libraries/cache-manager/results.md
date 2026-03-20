# cache-manager Compatibility Test Results

**Package:** `cache-manager`
**Version:** `7.2.8`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — set/get/del basic flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-ttl.js — TTL expiration and ttl() metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-wrap.js — wrap() coalescing and cache reuse
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-events.js — EventEmitter integration and listener removal
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-multistore.js — multi-store fallback and bulk operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: none
- Behavioral differences: none observed
- Blockers: none

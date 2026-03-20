# lru-cache Compatibility Test Results

**Package:** `lru-cache`
**Version:** `11.2.6`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — Core LRU set/get/eviction behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-ttl.js — TTL expiration on access
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-size.js — `maxSize` and `sizeCalculation` eviction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-dispose.js — `dispose` and `disposeAfter` hooks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-memo-fetch.js — `memo()` and `fetch()` caching semantics
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: none
- Behavioral differences: none observed
- Blockers: none

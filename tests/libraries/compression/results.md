# compression Compatibility Test Results

**Package:** `compression`
**Version:** `1.8.1`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Applies gzip compression for compressible payloads
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-threshold.js — Skips compression when body size is below threshold
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-no-transform.js — Honors `Cache-Control: no-transform`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-head-request.js — Skips compression for HEAD requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-filter-enforce.js — Custom filter opt-out and `enforceEncoding` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Golem Compatibility

This library is middleware for Express/Node HTTP servers and is intended to be installed in a
server response pipeline. In the Golem execution model, components cannot start or own HTTP
servers; they export functions that the runtime exposes. This library therefore cannot be used
in its standard middleware role in Golem applications.

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in the tested offline middleware paths
- Behavioral differences: None observed
- Blockers: Primary usage depends on an HTTP server middleware pipeline (Golem-incompatible)

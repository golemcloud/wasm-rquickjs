# cors Compatibility Test Results

**Package:** `cors`
**Version:** `2.8.6`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Default middleware for simple requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-preflight-defaults.js — Default preflight behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-dynamic-origin.js — Dynamic origin callback and deny path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-preflight.js — Custom methods/headers/exposed/maxAge options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-options-delegate.js — Top-level options delegate and callback error forwarding
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

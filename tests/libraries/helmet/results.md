# Helmet Compatibility Test Results

**Package:** `helmet`
**Version:** `8.1.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Default Helmet middleware behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Invalid option validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-csp-dynamic.js — CSP dynamic directive callbacks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-options.js — Top-level options toggling sub-middlewares
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-standalone-middlewares.js — Standalone middleware factories
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

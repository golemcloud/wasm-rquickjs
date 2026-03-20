# Morgan Compatibility Test Results

**Package:** `morgan`
**Version:** `1.10.1`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — compile() renders core built-in tokens
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-customization.js — custom token and function format registration
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-middleware.js — immediate middleware logging and skip filtering
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-timing.js — response-time and total-time tokens
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-tokens.js — auth/header/date and core token behavior
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — not a service client library
- Live service tests passed: N/A — not a service client library
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass

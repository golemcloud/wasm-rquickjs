# jsonwebtoken Compatibility Test Results

**Package:** `jsonwebtoken`
**Version:** `9.0.3`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — HS256 sign/verify roundtrip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-decode.js — Decode payload/header without signature verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-claims-validation.js — Audience/issuer/subject/jwtid validation and rejection path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-time-errors.js — TokenExpiredError, NotBeforeError, and ignoreExpiration behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-async-callbacks.js — Callback-based sign/verify and invalid signature error path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested flows
- Behavioral differences: None observed
- Blockers: None

jsonwebtoken's tested HS* signing, verification, decode, claim validation, time-based checks, and callback-based APIs are compatible with the current wasm-rquickjs runtime.

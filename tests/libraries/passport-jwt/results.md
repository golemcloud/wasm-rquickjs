# passport-jwt Compatibility Test Results

**Package:** `passport-jwt`
**Version:** `4.0.1`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Basic extractor functions (header/body/query/auth header)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Extractor validation, chaining, and v1 compatibility fallback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — Strategy constructor validation and verifier option merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-authenticate-success.js — Authenticate success path with injected verifier and `passReqToCallback`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-failure-paths.js — Authenticate failure/error propagation (`fail` and `error` callbacks)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested passport-jwt extractor and strategy flows
- Behavioral differences: None observed between Node.js and wasm-rquickjs in tested flows
- Blockers: None

passport-jwt's offline-compatible API surface tested here (token extractors, strategy construction, and authenticate callback semantics) works in wasm-rquickjs.

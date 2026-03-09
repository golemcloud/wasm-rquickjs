# redis Compatibility Test Results

**Package:** `redis`
**Version:** `5.11.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — core exports and RESP constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-factories.js — client/pool/cluster/sentinel factory construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-define-script.js — script SHA1 helper and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-digest.js — optional xxhash dependency error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-types-and-errors.js — VerbatimString, errors, and cache stats
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- Missing APIs: None
- Behavioral differences: None observed

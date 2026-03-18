# EJS Compatibility Test Results

**Package:** `ejs`
**Version:** `3.1.10`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Core interpolation, escaping, and raw output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-options.js — Compile options (`strict`, `_with: false`, `destructuredLocals`) and `escapeXML`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-delimiters-whitespace.js — Custom delimiters and whitespace trimming behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-async.js — Async template compilation/rendering with awaited expressions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-cache.js — Template cache reuse and `clearCache` behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested EJS API surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in tested features
- Blockers: none for tested in-memory templating and cache APIs

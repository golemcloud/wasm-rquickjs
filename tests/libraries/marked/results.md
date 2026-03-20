# Marked Compatibility Test Results

**Package:** `marked`
**Version:** `17.0.4`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Basic markdown conversion (heading, emphasis, strong)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-gfm-table.js — GFM table rendering
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-parse-inline.js — Inline markdown links and code spans
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-renderer.js — Custom renderer heading override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-async-walk-tokens.js — Async `walkTokens` token transformation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; library is a pure markdown parser
- Live service tests passed: N/A — not a service client library
- Missing APIs: None
- Behavioral differences: None observed in tested scenarios
- Blockers: None

# Turndown Compatibility Test Results

**Package:** `turndown`
**Version:** `7.2.2`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Default heading + inline emphasis/strong conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-code-block-options.js — Fenced code blocks with language class
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-keep-remove.js — `keep()` pass-through and `remove()` stripping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-rule.js — `addRule()` custom replacement behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-ordered-list-start.js — Ordered list `start` attribute handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; library is pure in-memory HTML-to-Markdown conversion
- Live service tests passed: N/A — not a service client library
- Missing APIs: None
- Behavioral differences: None observed in tested scenarios
- Blockers: None

# Mustache Compatibility Test Results

**Package:** `mustache`
**Version:** `4.2.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Core render with escaped and raw interpolation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-sections-inverted.js — Sections, inverted sections, and dotted-name lookup
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-partials.js — Partials via object map and loader function
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-lambdas.js — Lambda section rendering with nested `render()` callback
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-tags-cache.js — Custom tags/escape plus parse/cache APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested Mustache API surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in these tests
- Blockers: none for templating-focused Mustache usage

# Handlebars Compatibility Test Results

**Package:** `handlebars`
**Version:** `4.7.8`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Core compile/render with escaped and raw interpolation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-helpers-safestring.js — Custom helpers with `SafeString` and explicit escaping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-partials.js — Partial blocks with `@partial-block` and `@index` iteration data
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-precompile-runtime.js — `precompile` + `template` runtime execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-strict-and-runtime-options.js — Strict-mode error behavior and per-render helper injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested Handlebars API surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in these tests
- Blockers: none for templating-focused Handlebars usage

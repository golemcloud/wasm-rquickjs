# Nunjucks Compatibility Test Results

**Package:** `nunjucks`
**Version:** `3.2.4`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Core `renderString` interpolation, autoescaping, and `safe` output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-control-flow-macros.js — Macros, conditionals/loops, and built-in `is divisibleby` test
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-custom-api.js — `addFilter`, `addTest`, and `addGlobal` extension APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-loader-inheritance.js — Custom in-memory loader with `{% extends %}` and `{% include %}`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-compile-errors.js — `compile` rendering plus undefined/syntax error surfacing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested Nunjucks API surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in tested paths
- Blockers: none for in-memory templating usage (`Environment`, custom loaders, compile/render, filters/tests/globals)

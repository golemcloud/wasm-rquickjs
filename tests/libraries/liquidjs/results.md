# LiquidJS Compatibility Test Results

**Package:** `liquidjs`
**Version:** `10.25.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — parseAndRender with interpolation and built-in filters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: stack underflow (op=112, pc=301)`
- **Root cause:** The bundled module fails during initialization (`Failed to evaluate module initialization`) before `run()` executes.

### test-02-control-flow.js — control-flow tags (`for`, `forloop`, `unless`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: stack underflow (op=112, pc=301)`
- **Root cause:** Same startup failure during module initialization; test logic is never reached.

### test-03-customization.js — custom filters and plugin registration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: stack underflow (op=112, pc=301)`
- **Root cause:** Same startup failure during module initialization; test logic is never reached.

### test-04-templates-map.js — in-memory templates with layout/render includes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: stack underflow (op=112, pc=301)`
- **Root cause:** Same startup failure during module initialization; test logic is never reached.

### test-05-sync-eval.js — sync parse/render and evalValue APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: stack underflow (op=112, pc=301)`
- **Root cause:** Same startup failure during module initialization; test logic is never reached.

## Summary

- Offline tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified (failure occurs before library APIs execute)
- Behavioral differences: module initialization fails in wasm-rquickjs while Node.js executes all tests successfully
- Blockers: QuickJS runtime startup failure for bundled `liquidjs` (`stack underflow`) prevents any usage

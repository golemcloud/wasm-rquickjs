# ts-jest Compatibility Test Results

**Package:** `ts-jest`
**Version:** `29.4.6`
**Tested on:** 2026-03-09

## Test Results

### test-01-default-preset.js — createDefaultPreset returns ts-jest transform mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'inspector'`
- **Root cause:** `ts-jest` module initialization depends on Node's `inspector` module, which is unavailable in wasm-rquickjs.

### test-02-esm-preset.js — createDefaultEsmPreset enables ESM transformer options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'inspector'`
- **Root cause:** `ts-jest` module initialization depends on Node's `inspector` module, which is unavailable in wasm-rquickjs.

### test-03-transform-patterns.js — transform regex constants match expected file suffixes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'inspector'`
- **Root cause:** `ts-jest` module initialization depends on Node's `inspector` module, which is unavailable in wasm-rquickjs.

### test-04-babel-preset.js — createJsWithBabelPreset wires babel-jest and ts-jest transforms
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'inspector'`
- **Root cause:** `ts-jest` module initialization depends on Node's `inspector` module, which is unavailable in wasm-rquickjs.

### test-05-options-forwarding.js — createDefaultPreset forwards ts-jest options into transform tuple
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Cannot find module 'inspector'`
- **Root cause:** `ts-jest` module initialization depends on Node's `inspector` module, which is unavailable in wasm-rquickjs.

## Summary

- Node.js bundled tests passed: 5/5
- wasm-rquickjs tests passed: 0/5
- Missing APIs: `inspector` module
- Blockers: `ts-jest` cannot initialize in wasm-rquickjs due to unresolved Node core dependency

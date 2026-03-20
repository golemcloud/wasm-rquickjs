# xlsx Compatibility Test Results

**Package:** `xlsx`
**Version:** `0.18.5`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Basic workbook write/read roundtrip preserves data
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — JSON sheet builders handle defaults and append origins
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — Formula, CSV, and HTML exports behave as expected
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-options.js — Read/write options preserve Date cells and raw values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-utils.js — Utility address helpers and workbook properties are preserved
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable and library does not make HTTP requests
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested `xlsx` surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs
- Blockers: none for tested workbook parsing/writing and utility features

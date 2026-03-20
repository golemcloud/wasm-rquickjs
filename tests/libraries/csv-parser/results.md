# csv-parser Compatibility Test Results

**Package:** `csv-parser`
**Version:** `3.2.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Parse basic CSV rows into objects
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-separator-quote.js — Handle custom separator and escaped quotes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-map-transform.js — Apply `mapHeaders` / `mapValues` with skipped lines and comments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-output-byte-offset.js — Support `headers: false` with `outputByteOffset`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-strict-errors.js — Emit strict-mode row-length mismatch errors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable and library does not make HTTP requests
- Live service tests passed: N/A — not a service client library
- Missing APIs: none identified in tested `csv-parser` surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs
- Blockers: none for tested CSV parsing features

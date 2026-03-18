# pdf-parse Compatibility Test Results

**Package:** `pdf-parse`
**Version:** `1.1.1`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Basic parsing returns expected shape and text
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (skipped)
- **Error:** `createCommonjsRequire(...).ensure is not a function`
- **Root cause:** The bundled `pdf.js` runtime path uses `require.ensure` through Rollup's generated `createCommonjsRequire(...)`, which is not stable across calls.

### test-02-max-pages.js — `max` option limits rendered pages
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (skipped)
- **Error:** `createCommonjsRequire(...).ensure is not a function`
- **Root cause:** Same bundling/runtime incompatibility as test-01.

### test-03-custom-pagerender.js — Custom `pagerender` callback
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (skipped)
- **Error:** `createCommonjsRequire(...).ensure is not a function`
- **Root cause:** Same bundling/runtime incompatibility as test-01.

### test-04-version-option.js — Select bundled pdf.js version
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (skipped)
- **Error:** `createCommonjsRequire(...).ensure is not a function`
- **Root cause:** Same bundling/runtime incompatibility as test-01.

### test-05-invalid-buffer.js — Invalid PDF rejects
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** N/A (skipped)
- **Note:** This assertion passes because an error is thrown, but functional parsing remains blocked by bundle initialization failures above.

## Bundling

This library **cannot be used as a functional Rollup bundle** in the current workflow:
- **Error:** `createCommonjsRequire(...).ensure is not a function`
- **Reason:** `pdf-parse` loads vendored pdf.js via dynamic `require('./pdf.js/${version}/build/pdf.js')`; the generated bundle's CommonJS shim breaks `require.ensure` handling in those pdf.js builds.
- **Impact:** Functional `pdf-parse` APIs cannot be validated in Node.js bundled mode, so wasm-rquickjs execution (Steps 5d–5e) is skipped.

## Summary

- Offline tests passed: 1/5 (only invalid-input rejection; 0/4 functional parsing tests)
- Integration tests passed: N/A — no Docker service applicable; library is offline PDF parsing
- Live service tests passed: N/A — not a service client library
- Missing APIs: None identified (failure happens before runtime API-level compatibility checks)
- Behavioral differences: Not reached due bundle initialization failure
- Blockers: Rollup-bundled execution fails with `createCommonjsRequire(...).ensure is not a function`

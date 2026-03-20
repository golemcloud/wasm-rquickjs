# envalid Compatibility Test Results

**Package:** `envalid`
**Version:** `8.1.1`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Core validators and coercion (`str`, `num`, `bool`, `email`, `url`, `json`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-defaults.js — `default`, `devDefault`, and `testOnly` semantics
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-custom-validator.js — `makeValidator` custom parsing + choices + failures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-proxy-accessors.js — Immutable env proxy and `isProduction`/`isDev` accessors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-error-classes.js — `reporter: null` and `EnvMissingError`/`EnvError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: none identified
- Behavioral differences: none observed in tested validation and error-reporting paths
- Blockers: none for offline environment validation use cases

# Ajv Compatibility Test Results

**Package:** `ajv`
**Version:** `8.18.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Basic schema validation and error reporting
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-references.js — Cross-schema references with `addSchema` + `$ref`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-mutation-options.js — `coerceTypes`, `useDefaults`, and `removeAdditional`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-format-keyword.js — Custom formats and custom keywords
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-async-validation.js — Async keyword validation and `ValidationError` flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None

Ajv is fully compatible for the tested validation workflows (core schema validation, `$ref` composition, mutation options, custom extension points, and async validation) in wasm-rquickjs.

# form-data Compatibility Test Results

**Package:** `form-data`
**Version:** `4.0.1`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Basic construction, append, getBoundary, getHeaders
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-buffer.js — Buffer append and getBuffer serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-length.js — hasKnownLength and getLengthSync
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-boundary.js — setBoundary, custom boundary, header merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-multipart-format.js — Multipart format structure verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- All core form-data functionality works correctly in the wasm-rquickjs runtime.

### Notes

A fix was required to add a `default` export to the `node:crypto` module's reexport JS. Rollup's `@rollup/plugin-commonjs` converts CJS `require('crypto')` calls to `import X from 'crypto'` (default imports), which requires the module to have an `export default`.

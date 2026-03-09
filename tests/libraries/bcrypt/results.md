# bcrypt Compatibility Test Results

**Package:** `bcrypt`
**Version:** `5.1.1`
**Tested on:** 2026-03-09
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — async hash/compare
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3' imported from .../dist/test-01-basic.bundle.js`
- **Root cause:** `bcrypt` depends on native addon loading via `node-gyp-build`/`@mapbox/node-pre-gyp`; the Rollup bundle retains unresolved optional dependencies used by that native loading path.

### test-02-sync.js — sync API and getRounds
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3' imported from .../dist/test-02-sync.bundle.js`
- **Root cause:** Same as above.

### test-03-compare-variants.js — buffer input and mismatch handling
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3' imported from .../dist/test-03-compare-variants.bundle.js`
- **Root cause:** Same as above.

### test-04-validation.js — validation errors
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3' imported from .../dist/test-04-validation.bundle.js`
- **Root cause:** Same as above.

### test-05-callbacks.js — callback-style API
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3' imported from .../dist/test-05-callbacks.bundle.js`
- **Root cause:** Same as above.

## Summary

- Tests passed in Node.js (bundled): 0/5
- Tests passed in wasm-rquickjs: 0/5 (not run; bundled Node.js precondition failed)
- Source (unbundled) sanity check in Node.js: 5/5 pass
- Missing APIs: N/A
- Behavioral differences: N/A
- Blockers:
  - Bundled artifacts cannot initialize because native-addon bootstrap code imports unresolved optional packages (`mock-aws-s3`, `aws-sdk`, `nock`).
  - `bcrypt` requires loading native `.node` binaries, which is incompatible with wasm-rquickjs's standard Rollup bundle-to-component flow.

## Bundling

Rollup emits bundle files, but they are not executable for this native-binding package:
- **Error at runtime (bundled output):** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'mock-aws-s3'`
- **Reason:** Native N-API addon loading path (`node-gyp-build` / `@mapbox/node-pre-gyp`) requires runtime module/native resolution that does not survive this bundling model.
- **Impact:** `bcrypt` cannot be used in wasm-rquickjs through the standard Rollup-based packaging flow.

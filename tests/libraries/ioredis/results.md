# ioredis Compatibility Test Results

**Package:** `ioredis`
**Version:** `5.10.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — lazy client creation and builtin command listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-command.js — command RESP encoding and argument transformers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-url-options.js — Redis URL parsing and option merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-pipeline.js — pipeline command queueing without network
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-define-command.js — custom Lua command registration helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass successfully

## Previous Failures (resolved)

All tests previously failed at module initialization with `Could not find export 'default' in module 'string_decoder'`. This was fixed by updating the `string_decoder` built-in module to include a proper default export.

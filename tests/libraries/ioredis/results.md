# ioredis Compatibility Test Results

**Package:** `ioredis`
**Version:** `5.10.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — lazy client creation and builtin command listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Missing/unsupported `string_decoder` module export shape during bundle initialization.

### test-02-command.js — command RESP encoding and argument transformers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test logic runs due to `string_decoder` export mismatch.

### test-03-url-options.js — Redis URL parsing and option merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test logic runs due to `string_decoder` export mismatch.

### test-04-pipeline.js — pipeline command queueing without network
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test logic runs due to `string_decoder` export mismatch.

### test-05-define-command.js — custom Lua command registration helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test logic runs due to `string_decoder` export mismatch.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs / module gaps: `string_decoder` default export expected by bundled `ioredis` dependency tree
- Behavioral differences: None observed (runtime fails at module init)
- Blockers: All tests are blocked by startup failure before any library API execution

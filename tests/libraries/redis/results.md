# redis Compatibility Test Results

**Package:** `redis`
**Version:** `5.11.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — core exports and RESP constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization calls `node:module.createRequire(...)` with an undefined filename.

### test-02-factories.js — client/pool/cluster/sentinel factory construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization calls `node:module.createRequire(...)` with an undefined filename.

### test-03-define-script.js — script SHA1 helper and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization calls `node:module.createRequire(...)` with an undefined filename.

### test-04-digest.js — optional xxhash dependency error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization calls `node:module.createRequire(...)` with an undefined filename.

### test-05-types-and-errors.js — VerbatimString, errors, and cache stats
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined`
- **Root cause:** Module initialization calls `node:module.createRequire(...)` with an undefined filename.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs / runtime gaps: `node:module.createRequire` receives an undefined filename during bundle startup (`import.meta.url`-style context not available)
- Behavioral differences: None observed (runtime fails before test logic executes)
- Blockers: All redis tests are blocked by the same module initialization failure

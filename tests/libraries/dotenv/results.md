# dotenv Compatibility Test Results

**Package:** `dotenv`
**Version:** `17.3.1`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Basic parsing semantics
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-quotes-and-multiline.js — Quoting and multiline behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-edge-cases.js — Edge parsing cases
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-populate.js — populate merge behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-config-processenv.js — config file loading + processEnv override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: ENOENT: no such file or directory, open 'fixtures/config.env'`
- **Root cause:** Filesystem paths used by `dotenv.config()` are not accessible in this WASI execution context, so `.env` files cannot be read via `node:fs`.

## Summary

- Tests passed: 4/5
- Missing APIs: none identified for `dotenv.parse` / `dotenv.populate`
- Behavioral differences: `dotenv.config()` cannot read `.env` files from filesystem paths in wasm-rquickjs (`ENOENT` on `node:fs` open)
- Blockers: file-based env loading is not available for this runtime invocation model

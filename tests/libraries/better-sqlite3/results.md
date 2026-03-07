# better-sqlite3 Compatibility Test Results

**Package:** `better-sqlite3`
**Version:** `12.6.2`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic database open/insert/get/all
- **Node.js:** ❌ FAIL (bundled output)
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `better-sqlite3` depends on the `bindings` package and native `.node` addon loading path, which relies on CommonJS globals (`__filename`) and dynamic native binding resolution.

### test-02-bindings-and-modes.js — named bindings plus raw/pluck result modes
- **Node.js:** ❌ FAIL (bundled output)
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `better-sqlite3` depends on the `bindings` package and native `.node` addon loading path, which relies on CommonJS globals (`__filename`) and dynamic native binding resolution.

### test-03-transactions.js — transaction commit and rollback behavior
- **Node.js:** ❌ FAIL (bundled output)
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `better-sqlite3` depends on the `bindings` package and native `.node` addon loading path, which relies on CommonJS globals (`__filename`) and dynamic native binding resolution.

### test-04-safe-integers-and-serialize.js — safeIntegers and serialize/deserialize
- **Node.js:** ❌ FAIL (bundled output)
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `better-sqlite3` depends on the `bindings` package and native `.node` addon loading path, which relies on CommonJS globals (`__filename`) and dynamic native binding resolution.

### test-05-functions-and-iterate.js — custom SQL functions and iterate()
- **Node.js:** ❌ FAIL (bundled output)
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `better-sqlite3` depends on the `bindings` package and native `.node` addon loading path, which relies on CommonJS globals (`__filename`) and dynamic native binding resolution.

## Summary

- Tests passed in Node.js: 0/5 (bundled output)
- Tests passed in wasm-rquickjs: 0/5 (not run; Node precondition failed)
- Source (unbundled) sanity check in Node.js: 5/5 pass
- Missing APIs: N/A
- Behavioral differences: N/A
- Blockers:
  - Bundled artifacts cannot initialize in Node.js due to `__filename` usage in `bindings` package code.
  - Library requires loading a native addon (`better_sqlite3.node`), which is incompatible with wasm-rquickjs's bundle-and-component model.

## Bundling

Rollup produced bundle files, but they are not executable for this library's native-binding load path:
- **Error at runtime (bundled output):** `FAIL: __filename is not defined`
- **Reason:** Native N-API addon loading (`bindings('better_sqlite3.node')`) depends on Node.js CommonJS execution semantics and dynamic `.node` resolution.
- **Impact:** `better-sqlite3` cannot be used in the wasm-rquickjs runtime using the standard Rollup bundling flow.

# pg Compatibility Test Results

**Package:** `pg`
**Version:** `8.20.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-escape-utils.js — SQL escaping helpers (`escapeIdentifier`, `escapeLiteral`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-connection-config.js — client connection string/config parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-type-parsers.js — global type parser override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-client-overrides.js — client-local type parser overrides
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-pool-and-native.js — pool/query object initialization without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None

All offline `pg` API surface tested (escaping utilities, config parsing, type parser customization, and object initialization) works correctly in both Node.js and wasm-rquickjs. The previous `string_decoder` default export issue has been resolved.

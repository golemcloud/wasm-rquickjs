# Superagent Compatibility Test Results

**Package:** `superagent`
**Version:** `10.3.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — request builder supports headers, json body, and request snapshot
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** `superagent` initialization imports `string_decoder` default export, but the runtime's `string_decoder` module does not provide a default export

### test-02-query.js — query params are accumulated and sorted deterministically
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** `superagent` initialization imports `string_decoder` default export, but the runtime's `string_decoder` module does not provide a default export

### test-03-auth-timeout-retry.js — auth, timeout options, and retry policy are configured correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** `superagent` initialization imports `string_decoder` default export, but the runtime's `string_decoder` module does not provide a default export

### test-04-plugin-ok.js — plugins can mutate requests and custom ok() predicate is applied
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** `superagent` initialization imports `string_decoder` default export, but the runtime's `string_decoder` module does not provide a default export

### test-05-agent.js — agent defaults are inherited by subsequent requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** `superagent` initialization imports `string_decoder` default export, but the runtime's `string_decoder` module does not provide a default export

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs:
  - `node:string_decoder` ESM default export
- Behavioral differences: Not observable (all failures occur during module initialization)
- Blockers:
  - All wasm runs abort at module initialization before test logic executes due missing `string_decoder` default export

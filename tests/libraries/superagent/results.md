# Superagent Compatibility Test Results

**Package:** `superagent`
**Version:** `10.3.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — request builder supports headers, json body, and request snapshot
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-query.js — query params are accumulated and sorted deterministically
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-auth-timeout-retry.js — auth, timeout options, and retry policy are configured correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-plugin-ok.js — plugins can mutate requests and custom ok() predicate is applied
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-agent.js — agent defaults are inherited by subsequent requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed** — the `createRequire` issue has been resolved
- Missing APIs: None
- Behavioral differences: None observed

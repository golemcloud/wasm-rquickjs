# supertest Compatibility Test Results

**Package:** `supertest`
**Version:** `7.2.2`
**Tested on:** 2026-03-09

## Bundling

Rollup bundling succeeded for all 5 test files.

## Test Results

### test-01-basic.js — request object construction from URL + method
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-expect-chain.js — `.expect()` chain registration and synthetic assert execution
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-status-helpers.js — `_assertStatus` and `_assertStatusArray`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-body-header-helpers.js — `_assertBody` and `_assertHeader`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-cookies.js — cookie assertion helpers (`set`, `contain`, `not`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Golem Compatibility

`supertest` is designed for HTTP integration testing against Node HTTP server apps. Its normal flow (`request(app).get(...).expect(...)`) creates or uses a server and relies on socket binding/listening for request execution. In the Golem execution model, components export functions and cannot bind/listen on HTTP ports directly, so this package cannot be used in its standard integration-testing pattern.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None observed in the tested offline assertion and cookie helper paths
- Behavioral differences: None observed in tested paths
- Blockers: Standard supertest request execution depends on server binding/listening, which is Golem-incompatible

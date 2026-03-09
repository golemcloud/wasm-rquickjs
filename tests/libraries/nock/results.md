# Nock Compatibility Test Results

**Package:** `nock`
**Version:** `14.0.11`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Core GET interception and JSON reply
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** `nock` depends on Node `http.ClientRequest` internals (`createConnection` path) that are not fully compatible in the runtime.

### test-02-query-and-headers.js — Query + header matcher behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same `node:http` client internals mismatch during request initialization.

### test-03-times-and-persist.js — Repetition and persistence controls
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Request never reaches `nock` matcher logic because `http` request setup fails first.

### test-04-optionally.js — Optional interceptors and done state
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same low-level `node:http` failure before mock response behavior can run.

### test-05-global-state.js — Global pending mocks and done state
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Runtime aborts in `node:http` request creation path used by `nock`.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: Node `http` request internals required by `nock` monkey-patching (`createConnection` path)
- Behavioral differences: `nock` interception cannot initialize because the underlying `node:http` request flow fails before matching/reply
- Blockers: Runtime panic during `run()` with `JavaScript error: cannot read property 'bind' of undefined` followed by wasm trap (`unreachable`)

# Nock Compatibility Test Results

**Package:** `nock`
**Version:** `14.0.11`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — Core GET interception and JSON reply
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** `nock` monkey-patches `node:http` internals. During `ClientRequest` construction, the `createConnection` callback provided by nock calls `.bind()` on a property that is `undefined` in the wasm-rquickjs `node:http` implementation.

### test-02-query-and-headers.js — Query + header matcher behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same `node:http` `createConnection` path failure.

### test-03-times-and-persist.js — Repetition and persistence controls
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same `node:http` `createConnection` path failure.

### test-04-optionally.js — Optional interceptors and done state
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same `node:http` `createConnection` path failure.

### test-05-global-state.js — Global pending mocks and done state
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'bind' of undefined`
- **Root cause:** Same `node:http` `createConnection` path failure.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: `node:http` `ClientRequest` internal `createConnection` callback path — nock monkey-patches `http.ClientRequest` and injects a custom `createConnection` option; the runtime's `_initializeCustomConnection` calls `.bind()` on a property that doesn't exist in the patched context.
- Behavioral differences: None observable — all tests fail before nock's interception logic runs.
- Blockers: `nock` fundamentally relies on monkey-patching `node:http` internals (`ClientRequest`, `request`, `get`). The runtime's `node:http` implementation does not expose the same internal structure (specifically the `createConnection` option handling), causing all nock interception to fail.

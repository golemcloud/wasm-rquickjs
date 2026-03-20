# Dgraph JS HTTP Compatibility Test Results

**Package:** `dgraph-js-http`
**Version:** `23.0.0-rc1`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — basic client/stub configuration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor and transaction validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-transaction-state.js — transaction finished-state behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-error-types.js — APIError and HTTPError structure
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-login-validation.js — login validation without credentials
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — HTTP mock integration tests were sufficient for this package's HTTP client behavior in this compatibility pass.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-login-query.js — login and read-only query with vars
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-mutate-commit-now.js — JSON mutation with `commitNow`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-health-http-error.js — raw-text health + HTTP error propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

N/A — not a token-authenticated external SaaS client library; no relevant token in `tests/libraries/.tokens.json`.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no applicable token-based live tests
- Missing APIs: None observed in this test set
- Behavioral differences: None observed in this test set
- Blockers: None

# Turbopuffer SDK Compatibility Test Results

**Package:** `@turbopuffer/turbopuffer`
**Version:** `1.19.0`
**Tested on:** 2026-03-17

## Test Results

### test-01-basic.js — client init, `withOptions()`, and namespace helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — constructor validation for missing/invalid config combinations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-request-options.js — default header/query merge and auth header emission
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-errors.js — `exists()` NotFound handling and API error subclass mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-pagination.js — NamespacePage cursor traversal and async iteration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-namespaces.js — paged namespace listing over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-write-query.js — `write()`, `query()`, and `multiQuery()` over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-schema-metadata.js — schema/metadata/explain/delete lifecycle over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features were not tested against the live Turbopuffer service:

- **Live API requests to Turbopuffer Cloud** — require a valid `TURBOPUFFER_API_KEY`.
- **Live index/query behavior against real namespace data** — requires access to an actual Turbopuffer account and namespace state.

To fully test live behavior:
1. Add `TURBOPUFFER_API_KEY` to `tests/libraries/.tokens.json`.
2. Add `test-live-*.js` scripts for minimal-cost live requests.
3. Re-run Node.js and wasm-rquickjs execution for those live tests.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Live service tests passed: N/A — no `TURBOPUFFER_API_KEY` in `tests/libraries/.tokens.json`
- Missing APIs: none observed
- Behavioral differences: none observed in tested offline + mock HTTP paths
- Blockers: live Turbopuffer coverage is credential-gated

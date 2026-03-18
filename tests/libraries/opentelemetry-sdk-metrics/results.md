# @opentelemetry/sdk-metrics Compatibility Test Results

**Package:** `@opentelemetry/sdk-metrics`
**Version:** `2.6.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Sync instrument aggregation (counter/updown/histogram/gauge)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Validation for negative values on monotonic instruments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-views.js — View-based rename, attribute allowlist, and dropped streams
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-observable.js — Observable and batch observable callback collection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-temporality.js — Delta temporality export behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — no Docker-hosted external service is required or applicable for this package.

## Integration Tests (HTTP Mock)

N/A — this package is a metrics SDK and does not perform HTTP requests as part of core metric recording/export logic covered here.

## Live Service Tests

N/A — not a live-service client library and no credential-gated API calls are part of this package.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; no HTTP mock integration applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none

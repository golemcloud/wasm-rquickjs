# @opentelemetry/api Compatibility Test Results

**Package:** `@opentelemetry/api`
**Version:** `1.9.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Trace API span lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-context.js — Context key/value immutability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-propagation.js — Baggage and text map helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-metrics.js — Meter instruments and observable callbacks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-diag.js — Diagnostic logger and component logger
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — no Docker-hosted external service is required or applicable for this package.

## Integration Tests (HTTP Mock)

N/A — `@opentelemetry/api` is an API surface package and does not perform HTTP requests by itself.

## Live Service Tests

N/A — not a live-service client library and no credential-gated API calls are part of this package.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; no HTTP mock integration applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none

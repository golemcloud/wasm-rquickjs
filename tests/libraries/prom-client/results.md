# prom-client Compatibility Test Results

**Package:** `prom-client`
**Version:** `15.1.3`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Counter increments and registry exposition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-gauge.js — Gauge set/inc/dec/labels/setToCurrentTime behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-histogram.js — Histogram observation, buckets, and zero initialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-summary.js — Summary count/sum/quantile output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-registry.js — Registry default labels and merge conflict handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — no Docker-hosted external service is required or applicable for this package.

## Integration Tests (HTTP Mock)

N/A — `prom-client` does not make HTTP requests as part of its core metric APIs tested here.

## Live Service Tests

N/A — not a live-service client library and no credential-gated API calls are part of this package.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; no HTTP mock integration applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none

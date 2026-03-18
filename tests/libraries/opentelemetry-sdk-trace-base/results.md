# @opentelemetry/sdk-trace-base Compatibility Test Results

**Package:** `@opentelemetry/sdk-trace-base`
**Version:** `2.6.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Basic tracer provider + span export flow
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-limits.js — Span limits for attributes/events
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-sampling.js — AlwaysOn/AlwaysOff sampler behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-ratio-sampler.js — TraceIdRatioBasedSampler decisions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-processors.js — Custom processor hook order + flush/shutdown
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — `@opentelemetry/sdk-trace-base` is a pure tracing SDK package and does not require any Docker-hosted external service.

## Integration Tests (HTTP Mock)

N/A — this package does not perform HTTP requests by itself (HTTP exporters are in separate OpenTelemetry exporter packages).

## Live Service Tests

N/A — not a live-service client library and no credential-gated API calls are part of this package.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable; no HTTP mock integration applicable
- Live service tests passed: N/A — not a service client library (and no relevant token-gated path for this package)
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none

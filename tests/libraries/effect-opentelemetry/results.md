# Effect OpenTelemetry Compatibility Test Results

**Package:** `@effect/opentelemetry`
**Version:** `0.62.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — `OtlpResource.make` with service and custom attributes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — `entriesToAttributes` and `unknownToAttributeValue` conversions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — `OtlpResource.fromConfig` and `unsafeServiceName`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-span-context.js — `Tracer.makeExternalSpan` id and sampling mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-serialization.js — `OtlpSerialization` JSON and Protobuf payload encoding
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-traces-export.js — OTLP trace export over HTTP to local collector
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-batching.js — OTLP payload includes configured resource metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-headers.js — OTLP exporter forwards custom collector headers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — not a Docker-service client library
- Live service tests passed: N/A — not a credential-gated external service client library
- Missing APIs: none observed in covered paths
- Behavioral differences: none observed in covered paths
- Blockers: none for tested offline and HTTP-export scenarios

## Notes

- Rollup produced non-fatal `"this" has been rewritten to "undefined"` warnings for some transitive dependencies; bundled execution still passed on both Node.js and wasm-rquickjs.
- Generated wrapper crates were patched to `default = ["full-no-logging"]` before `wasmtime` execution.

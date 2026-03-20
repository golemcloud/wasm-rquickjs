# @opentelemetry/exporter-trace-otlp-http Compatibility Test Results

**Package:** `@opentelemetry/exporter-trace-otlp-http`
**Version:** `0.213.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — Exporter lifecycle API surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-empty-export.js — `forceFlush`/`shutdown` with explicit config
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-network-failure.js — Failed export result when collector is unreachable
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-shutdown.js — Failed export result after shutdown
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-options.js — Advanced Node exporter options (`gzip`, `keepAlive`, headers, userAgent)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

N/A — this package is an OTLP HTTP exporter, not a Docker-hosted database/message-service client.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-export.js — OTLP JSON export to collector endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-headers.js — Custom headers and user-agent forwarding
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-gzip.js — Gzip-compressed OTLP payload export
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

N/A — no credential-gated live API is required for this exporter package.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3 (HTTP mock)
- Docker integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a token-gated external service client
- Missing APIs: none observed in covered exporter paths
- Behavioral differences: none observed in covered lifecycle and HTTP export paths
- Blockers: none

## Notes

- Rollup emitted non-fatal warnings (`"this" has been rewritten to "undefined"`, circular dependency notices in transitive deps), but all bundled tests executed successfully on both Node.js and wasm-rquickjs.
- Generated wrapper crates were patched to `default = ["full-no-logging"]` before `wasmtime` execution.

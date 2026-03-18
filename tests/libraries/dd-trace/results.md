# Datadog Trace Compatibility Test Results

**Package:** `dd-trace`
**Version:** `5.91.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — no-op span APIs before init
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-02-trace-scope.js — trace scope activation and restoration
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-03-wrap-callback.js — wrap() callback context propagation
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-04-propagation.js — inject/extract header propagation
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-05-baggage.js — tracer-wide baggage APIs
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-integration-01-trace-export.js — HTTP trace export to mock Datadog agent
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

### test-integration-02-telemetry.js — startup telemetry to mock Datadog agent
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** ❌ NOT RUN
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`

## Bundling

This library cannot produce a runnable Rollup ESM bundle in this workflow:
- **Error:** `ReferenceError: __dirname is not defined in ES module scope`
- **Where:** Generated bundles fail during module initialization at `dd-trace` config setup (`ddBasePath: globalThis.__DD_ESBUILD_BASEPATH || calculateDDBasePath(__dirname)`).
- **Reason:** `dd-trace` assumes CommonJS globals (`__dirname`) in bundled runtime code; Rollup emits ESM bundles for this workflow, so the bundled output crashes before any test code runs.
- **Impact:** Node.js bundled verification fails for all tests, so wasm-rquickjs execution is blocked.

## Summary

- Offline tests passed on bundled Node.js: 0/5
- HTTP mock integration tests passed on bundled Node.js: 0/2
- wasm-rquickjs tests passed: 0/7 (not runnable because bundled Node.js baseline fails)
- Live service tests passed: N/A — no Datadog token available in `tests/libraries/.tokens.json`
- Blockers: Rollup ESM bundle crashes at import time due CommonJS `__dirname` dependency in `dd-trace`

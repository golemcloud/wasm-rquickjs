# Weaviate Client Compatibility Test Results

**Package:** `weaviate-client`
**Version:** `3.12.0`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — configure helpers and UUID generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth.js — auth credential constructors and validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-filters.js — filter builder composition
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-connect-custom.js — `connectToCustom()` connection details with init checks disabled
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-connect-cloud.js — `connectToWeaviateCloud()` host/auth handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Weaviate startup failed with message: Weaviate failed to startup with message: tls is not supported in WebAssembly environment`
- **Root cause:** Cloud connection setup requires TLS (`node:tls`) which is not supported by the current wasm runtime.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-http-health.js — `getMeta()`, `isLive()`, `isReady()` over HTTP
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-http-schema.js — `collections.exists()` over schema endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-http-data.js — `data.insert()` + `data.exists()` over object endpoints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `semitechnologies/weaviate:1.30.3` on ports `18090` (HTTP) and `15051` (gRPC)

> Docker tests were skipped per request (not re-run in this session). Previous results from 2026-03-17 shown below.

### test-integration-04-docker-connect.js — connect and check `/v1/meta` + readiness against real Weaviate
- **Node.js:** ✅ PASS (previous run)
- **wasm-rquickjs:** ✅ PASS (previous run)

### test-integration-05-docker-crud.js — create collection, insert object, verify existence, delete collection
- **Node.js:** ✅ PASS (previous run)
- **wasm-rquickjs:** ✅ PASS (previous run)

## Untestable Features

No `WEAVIATE_API_KEY` or Weaviate Cloud URL token pair is present in `tests/libraries/.tokens.json`, so live Weaviate Cloud API tests were not run.

To fully test live cloud behavior:
1. Add Weaviate Cloud credentials to `tests/libraries/.tokens.json` (for example `WEAVIATE_API_KEY` and `WEAVIATE_URL`).
2. Add `test-live-*.js` scripts for minimal-cost live operations.
3. Re-run the Node.js + wasm-rquickjs flow for those live tests.

## Summary

- Offline tests passed: 4/5
- Integration tests passed: 5/5 (HTTP mock 3/3, Docker 2/2 from previous run)
- Live service tests passed: N/A — no Weaviate credentials in `tests/libraries/.tokens.json`
- Missing APIs: TLS support for cloud connection path (`node:tls`)
- Behavioral differences: `connectToWeaviateCloud()` works in Node.js but fails in wasm due TLS unsupported
- Blockers: Cloud-hosted Weaviate connectivity is blocked in wasm until TLS support is available

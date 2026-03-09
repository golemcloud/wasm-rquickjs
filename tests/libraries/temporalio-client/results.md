# @temporalio/client Compatibility Test Results

**Package:** `@temporalio/client`
**Version:** `1.15.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic-exports.js — core client exports and enums
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-payload-converter.js — default payload converter JSON/binary round-trips
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-workflow-options.js — workflow option compilation and duration validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-errors-and-retry.js — error hierarchy and gRPC retry helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-lazy-connection.js — lazy `Connection` and `Client` construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: tls is not supported in WebAssembly environment`
- **Root cause:** Creating Temporal connection/client objects pulls in gRPC transport paths that import `node:tls`, which is unsupported in wasm-rquickjs.

## Untestable Features

The following features could not be tested without external dependencies:

- **Workflow execution and signaling APIs** (`client.workflow.start`, `execute`, `signal`, `query`) — require a running Temporal server and namespace.
- **Schedule APIs and task queue reachability checks** — require live Temporal service endpoints.
- **Connection and RPC behavior against Temporal Cloud/self-hosted Temporal** — requires reachable gRPC endpoint and (optionally) credentials/API keys.

To fully test this library, a user would need to:
1. Run or provision a Temporal server (or Temporal Cloud namespace)
2. Configure connection details and credentials for that environment
3. Re-run integration scenarios that perform real RPC calls through `Connection.connect()` / `Client`

## Summary

- Tests passed: 4/5
- Missing APIs: `node:tls` support (required by gRPC transport path used by `@temporalio/client` connection/client features)
- Behavioral differences: Offline utility APIs work, but connection-oriented APIs fail during module initialization in wasm runtime
- Blockers: Any feature requiring Temporal gRPC client transport is blocked by missing TLS support

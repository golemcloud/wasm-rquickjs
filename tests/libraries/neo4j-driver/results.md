# Neo4j Driver Compatibility Test Results

**Package:** `neo4j-driver`
**Version:** `5.28.3`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — Driver/session construction without immediate network I/O
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-auth-and-integer.js — Auth token builders and Integer helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-record-and-graph-types.js — Graph value objects and `Record`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-errors-and-retryable.js — Neo4j error retryability classification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-bookmarks.js — Bookmark manager update/merge lifecycle
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `neo4j:5-community` on port `17687`

### test-integration-01-connect.js — `verifyConnectivity()` and `getServerInfo()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Failed to connect to server ... Caused by: getaddrinfo ESERVFAIL localhost`
- **Root cause:** Hostname resolution for `localhost` fails in the runtime networking path used by Neo4j driver (`node:net`/DNS resolution), so Bolt connections cannot be established from wasm-rquickjs.

### test-integration-02-crud.js — Create/read/delete via `executeQuery()`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Neo4jError: Failed to connect to server ... Caused by: getaddrinfo ESERVFAIL localhost`
- **Root cause:** Same DNS/connectivity failure (`getaddrinfo ESERVFAIL localhost`) prevents opening Bolt sessions, so query execution cannot proceed.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 0/2 in wasm-rquickjs (2/2 in Node.js)
- Live service tests passed: N/A — Neo4j was tested via local Docker integration (no token-gated cloud API flow required)
- Missing APIs: None observed in offline API coverage
- Behavioral differences: DNS resolution failure for `localhost` during Neo4j Bolt connection in wasm-rquickjs
- Blockers: Bolt connectivity is blocked by `getaddrinfo ESERVFAIL localhost`, preventing any end-to-end Neo4j operations

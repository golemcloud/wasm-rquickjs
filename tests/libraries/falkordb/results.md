# falkordb Compatibility Test Results

**Package:** `falkordb`
**Version:** `6.6.2`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — core exports, enums, and graph API surface
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-query-parsing.js — `Graph.query` parsing for scalar/array/map/point/vector values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-metadata-and-entities.js — metadata-driven parsing of node/edge labels and properties
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-index-ddl.js — index helper APIs generate expected Cypher DDL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-command-forwarding.js — graph methods forward arguments to client backend correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `falkordb/falkordb:latest` on port `63795`

### test-integration-01-connect.js — connect, list graphs, and read server config
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — graph CRUD plus index create/drop against live FalkorDB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 2/2
- Live service tests passed: N/A — not a token-gated cloud API client
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

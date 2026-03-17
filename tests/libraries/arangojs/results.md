# arangojs Compatibility Test Results

**Package:** `arangojs`
**Version:** `10.2.2`
**Tested on:** 2026-03-17
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — aql builds query text and bind variables
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — aql literal/join/query type guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — database resource handle construction (collection/graph/view/analyzer)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-client-options.js — auth helper and database cloning APIs without network I/O
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-errors.js — error classes and retry metadata behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `arangodb:3.12` on port `18529`

### test-integration-01-connect.js — connect and read server version metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'` (panic during `fetch` path)
- **Root cause:** HTTP response handling mismatch in wasm-rquickjs fetch/runtime conversion when `arangojs` performs live requests.

### test-integration-02-crud.js — create collection and perform insert/read/update/delete
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Error converting from js 'object' into type 'string'` (panic during `fetch` path)
- **Root cause:** Same HTTP response conversion issue as integration connect test; blocks all live ArangoDB operations.

## Integration Tests (HTTP Mock)

N/A — `arangojs` is a database client; Docker-backed integration against real ArangoDB is the representative integration mode.

## Live Service Tests

N/A — no `arangojs`-specific token is present in `tests/libraries/.tokens.json`.

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 0/2
- Missing APIs: None identified in offline API surface
- Behavioral differences: live HTTP requests from `arangojs` fail in wasm-rquickjs with JS-object-to-string conversion error
- Blockers: cannot execute live database operations due to fetch/runtime conversion failure

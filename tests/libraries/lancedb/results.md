# @lancedb/lancedb Compatibility Test Results

**Package:** `@lancedb/lancedb`
**Version:** `0.27.0`
**Tested on:** 2026-03-17
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — connect/create/query works
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Root cause:** Rollup tries to parse the platform-specific native addon binary (`.node`) as JavaScript.

### test-02-table-lifecycle.js — tableNames pagination and dropTable work
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Root cause:** Same bundling failure blocks all bundled test outputs.

### test-03-vector-search.js — vectorSearch returns nearest row
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Root cause:** Same bundling failure blocks all bundled test outputs.

### test-04-mutate-and-count.js — add/delete/countRows work
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Root cause:** Same bundling failure blocks all bundled test outputs.

### test-05-versioning.js — table versioning checkout works
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Root cause:** Same bundling failure blocks all bundled test outputs.

## Integration Tests (Docker)

- N/A — the library is an embedded database package; no separate Docker-hosted service is required for core API tests.

## Integration Tests (HTTP Mock)

- N/A — primary functionality is local embedded DB operations, not HTTP client behavior.

## Live Service Tests

- N/A — no relevant token-based live-service flow was applicable for this run.

## Summary

- Offline tests passed in Node.js (source sanity check): 5/5
- Offline tests passed in Node.js (bundled output): 0/5
- Tests passed in wasm-rquickjs: 0/5 (not run; bundling precondition failed)
- Integration tests passed: N/A — bundling failure prevented runtime execution
- Live service tests passed: N/A — not applicable
- Missing APIs: N/A
- Behavioral differences: N/A
- Blockers:
  - `@lancedb/lancedb` requires loading platform-specific native N-API `.node` binaries.
  - Rollup cannot bundle this native addon in the wasm-rquickjs single-bundle flow.

## Bundling

This library **cannot be bundled** with Rollup:
- **Error:** `(plugin commonjs) RollupError: node_modules/@lancedb/lancedb-darwin-arm64/lancedb.darwin-arm64.node (1:0): Unexpected character '�' (Note that you need plugins to import files that are not JavaScript)`
- **Reason:** Requires native N-API bindings (`.node` binary) that are loaded from filesystem and are not bundleable JS modules.
- **Impact:** `@lancedb/lancedb` cannot be tested in the wasm-rquickjs runtime using the standard Rollup-based bundle workflow.

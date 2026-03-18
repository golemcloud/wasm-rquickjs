# Effect SQL SQLite Compatibility Test Results

**Package:** `@effect/sql-sqlite-node`
**Version:** `0.51.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-connect-select.js — `SqliteClient` basic `SELECT` query on `:memory:`
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** `@effect/sql-sqlite-node` relies on `better-sqlite3` native addon loading via the `bindings` package, and the bundled artifact cannot provide the CommonJS `__filename` semantics that binding resolution expects.

### test-02-crud-builders.js — `SqliteClient` CRUD with `insert`/`update`/`in` helpers
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** Same native binding/bootstrap issue from `better-sqlite3` in bundled execution.

### test-03-transactions.js — transaction rollback + commit behavior
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** Same native binding/bootstrap issue from `better-sqlite3` in bundled execution.

### test-04-export-backup.js — database export and backup APIs
- **Node.js (bundled):** ❌ FAIL
- **wasm-rquickjs:** N/A (not run)
- **Error:** `FAIL: __filename is not defined`
- **Root cause:** Same native binding/bootstrap issue from `better-sqlite3` in bundled execution.

### test-05-migrator-loaders.js — `SqliteMigrator` record/glob loaders and `MigrationError`
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 1/5 (bundled Node.js execution)
- Integration tests passed: N/A — SQLite is embedded; no Docker-hosted external service required
- Live service tests passed: N/A — not a credential-gated service client library
- Missing APIs: N/A
- Behavioral differences: None observed in the one wasm-executed test (`SqliteMigrator` loaders)
- Blockers:
  - Bundled `SqliteClient` tests fail at startup with `__filename is not defined`.
  - Core runtime path depends on `better-sqlite3` native addon loading, which is incompatible with the Rollup bundle model used in this workflow.

## Additional Validation

To confirm test logic correctness, all five **unbundled** test sources were also run directly on Node.js and passed (5/5). The failure is specific to bundled/native binding initialization, not to test assertions.

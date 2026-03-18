# Effect SQL MySQL Compatibility Test Results

**Package:** `@effect/sql-mysql2`
**Version:** `0.51.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-compiler-dialect.js — `makeCompiler` mysql dialect and identifier transforms
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-insert-update-builders.js — `insert` / `update` / `in` statement helper compilation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-helpers-and-unsafe.js — logical helpers (`and`/`or`/`join`/`csv`) and unsafe/literal SQL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-migrator-from-record.js — `MysqlMigrator.fromRecord` ordering and `MigrationError` shape
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-migrator-glob-loaders.js — `fromGlob` / `fromBabelGlob` migration loader parsing and sort order
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `mysql:8.0` on port `33062`

### test-integration-01-connect.js — live MySQL connect + `SELECT 1 + 1`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — live table create/insert/select/update/delete/drop via `MysqlClient`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-transactions.js — transaction rollback and commit semantics
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 3/3
- Live service tests passed: N/A — not a credential-gated service client library
- Missing APIs: None observed
- Behavioral differences: None observed in the tested surface
- Blockers: None

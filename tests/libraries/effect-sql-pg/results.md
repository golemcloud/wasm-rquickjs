# Effect SQL pg Compatibility Test Results

**Package:** `@effect/sql-pg`
**Version:** `0.51.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-layer-from-pool-config.js — `layerFromPool` config parsing and dialect dispatch
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-query-builders.js — identifier transforms and SQL builder compilation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-helpers-and-update-values.js — helper combinators (`join`/`and`/`or`/`literal`/`updateValues`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-from-pool-constructor.js — `fromPool` constructor and pg-specific methods (`json`/`listen`/`notify`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-migrator-loader.js — `PgMigrator.fromRecord` ordering and `MigrationError` shape
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Service:** `postgres:16-alpine` on port `54320`

### test-integration-01-connect.js — live PostgreSQL connect + SELECT
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — CREATE/INSERT/SELECT/UPDATE/DELETE/DROP via `PgClient`
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

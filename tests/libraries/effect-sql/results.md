# Effect SQL Compatibility Test Results

**Package:** `@effect/sql`
**Version:** `0.50.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-statement-compiler.js — compiler output for `and` / `or` / `join` fragments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-statement-helpers.js — `defaultTransforms`, `defaultEscape`, `primitiveKind`, custom fragment guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-sqlschema.js — `findOne` / `single` schema wrappers with mocked execute function
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-model.js — `Model.Class` select/insert variants with `Generated` and `BooleanFromNumber`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-migrator-and-errors.js — `Migrator.fromRecord` normalization and SQL error classes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The package is a driver-agnostic abstraction layer. Features that execute real SQL (for example, live `SqlClient` queries and `Migrator.make(...)`) require a concrete driver package such as `@effect/sql-pg`, `@effect/sql-mysql2`, or `@effect/sql-sqlite-node` and a running database service.

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — `@effect/sql` has no built-in DB transport; integration belongs to adapter packages
- Live service tests passed: N/A — not a service client library
- Missing APIs: None observed
- Behavioral differences: None observed in tested APIs
- Blockers: None

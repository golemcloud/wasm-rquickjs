# mssql Compatibility Test Results

**Package:** `mssql`
**Version:** `9.1.1`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — type inference and constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — table metadata helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — connection string parsing and pool object init
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: cannot read property 'trim' of undefined`
- **Root cause:** Behavioral difference while executing `mssql`'s connection-string parsing path (`_parseConnectionString`) in wasm-rquickjs.

### test-04-request-params.js — request parameter APIs and template expansion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-shared-state.js — type map, Promise override, value handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without an external SQL Server instance:

- **Live connections and queries** (`connect`, `query`, `batch`, `execute`) — Require a reachable SQL Server endpoint and credentials.
- **Transactions and prepared statements against a real database** — Require server-side execution state.
- **Bulk insert execution** (`request.bulk(table)`) — Requires a live database connection.

To fully test these features, a user would need to:
1. Provision a SQL Server instance reachable from the test environment.
2. Create credentials and target schema.
3. Provide connection configuration for `mssql`.
4. Re-run dedicated integration tests that perform actual DB operations.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 4/5
- Missing APIs: None identified in these offline tests
- Behavioral differences:
  - `ConnectionPool.parseConnectionString(...)` fails in wasm-rquickjs with `JavaScript error: cannot read property 'trim' of undefined`
- Blockers:
  - No compile-time blockers in this run; all wrapper crates built successfully.
  - One runtime blocker remains in the connection-string parser path used by `test-03-advanced.js`.

`mssql` shows partial compatibility in wasm-rquickjs for offline, non-network API surface (types, table helpers, request parameter APIs, map/value handlers), with one parser-path runtime failure.

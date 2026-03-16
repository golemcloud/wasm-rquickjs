# pg Compatibility Test Results

**Package:** `pg`
**Version:** `8.20.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-escape-utils.js — SQL escaping helpers (`escapeIdentifier`, `escapeLiteral`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-connection-config.js — client connection string/config parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-type-parsers.js — global type parser override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-client-overrides.js — client-local type parser overrides
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-pool-and-native.js — pool/query object initialization without DB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

Requires Docker. Run `docker compose up -d --wait` in the `tests/libraries/pg/` directory before executing these tests. PostgreSQL is configured with **md5 authentication** (not SCRAM-SHA-256) because wasm-rquickjs does not yet support the `raw/PBKDF2` import format in `crypto.subtle.importKey`, which SCRAM-SHA-256 requires. Connection uses `127.0.0.1` instead of `localhost` to avoid DNS resolution issues in WASI.

### test-integration-01-connect.js — Connect and SELECT 1+1
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — CREATE TABLE, INSERT, SELECT, UPDATE, DELETE, DROP TABLE
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-transactions.js — BEGIN/ROLLBACK, BEGIN/COMMIT
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 3/3
- Integration tests passed in wasm-rquickjs: 3/3
- Missing APIs: `crypto.subtle.importKey` with `raw/PBKDF2` (blocks SCRAM-SHA-256 auth)
- Behavioral differences: DNS resolution of `localhost` fails in WASI; use `127.0.0.1` instead
- Blockers: None (with md5 auth)

All offline `pg` API surface tested (escaping utilities, config parsing, type parser customization, and object initialization) works correctly in both Node.js and wasm-rquickjs. Integration tests confirm that real PostgreSQL connectivity (connect, CRUD, transactions) works end-to-end in both environments when using md5 authentication and IP-based host addressing.

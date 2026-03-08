# mongodb Compatibility Test Results

**Package:** `mongodb`
**Version:** `7.1.0`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — BSON serialize/deserialize roundtrip for ObjectId, Decimal128, Binary, UUID
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — error hierarchy and retryable error labels
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — ReadPreference, ReadConcern, WriteConcern construction and validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-client-options.js — MongoClient URI/options parsing without connecting
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-objectid-uuid.js — ObjectId/UUID parsing, equality, and validation helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without an external MongoDB deployment:

- **Live database operations** (`connect`, CRUD, aggregation, transactions, sessions) — Require a reachable MongoDB server.
- **`mongodb+srv://` DNS discovery** — Requires live DNS SRV/TXT resolution.
- **Authentication integrations** (SCRAM against real server, cloud/OIDC, Kerberos) — Require real infrastructure/credentials.

To fully test these features, a user would need to:
1. Provision a MongoDB instance reachable from the test environment.
2. Provide connection URI and credentials.
3. Re-run integration tests that execute real connections and database commands.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None observed in the tested offline API surface
- Behavioral differences: None observed in the tested offline API surface
- Blockers: None for offline/document and option-parsing functionality

`mongodb` is compatible in wasm-rquickjs for the tested offline API surface.

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

## Integration Tests (Docker)

Requires Docker. Run `docker compose up -d --wait` in this directory to start MongoDB 7 on port 27019.

### test-integration-01-connect.js — connect and ping MongoDB
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — insertOne, findOne, updateOne, deleteOne, countDocuments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

Build notes: Generated wrapper crates used `default = ["full-no-logging"]` feature set to avoid `wasi:logging` linker errors. Ran with `wasmtime run --wasm component-model -S cli -S http -S inherit-network -S allow-ip-name-lookup --invoke 'run()'`.

## Untestable Features

- **`mongodb+srv://` DNS discovery** — Requires live DNS SRV/TXT resolution.
- **Authentication integrations** (SCRAM against real server, cloud/OIDC, Kerberos) — Require real infrastructure/credentials.
- **Transactions, sessions, change streams** — Require replica set configuration.

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 2/2
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

`mongodb` is fully compatible in wasm-rquickjs for both offline and live database operations.

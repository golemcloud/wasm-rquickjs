# mongoose Compatibility Test Results

**Package:** `mongoose`
**Version:** `9.2.4`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic schema/model usage, casting, and virtuals
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — schema validation rules and validation errors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-plugin-middleware.js — schema plugin adding instance methods
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-types-utilities.js — BSON/ObjectId helpers and utility APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-discriminator.js — discriminators, defaults, and document conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

Requires Docker. Run `docker compose up -d --wait` in the `tests/libraries/mongoose/` directory before executing these tests. MongoDB 7 is started on port 27018. Generated wrapper crates used `default = ["full-no-logging"]` feature set to avoid `wasi:logging` linker errors. Ran with `wasmtime run --wasm component-model -S cli -S http -S inherit-network -S allow-ip-name-lookup --invoke 'run()'`.

### test-integration-01-connect.js — Connect, verify readyState, admin ping, disconnect
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — Schema/model, create, findOne, updateOne, deleteOne, countDocuments
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without more complex infrastructure:

- **Replica set/session behavior** — Requires a multi-node deployment and server coordination.
- **Network-level error paths** (timeouts, reconnection, topology changes) — Depend on real network/database conditions.

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 2/2
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

`mongoose` is fully compatible in wasm-rquickjs for both offline document-layer APIs and live MongoDB CRUD operations.

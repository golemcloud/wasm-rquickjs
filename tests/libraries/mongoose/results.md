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

## Untestable Features

The following features could not be tested without an external MongoDB instance:

- **Live database operations** (`connect`, `save`, `find`, `aggregate`, transactions) — Require a reachable MongoDB server.
- **Replica set/session behavior** — Requires a real deployment and server coordination.
- **Network-level error paths** (timeouts, reconnection, topology changes) — Depend on real network/database conditions.

To fully test these features, a user would need to:
1. Provision a MongoDB instance reachable from the test environment.
2. Provide connection URI and credentials.
3. Re-run integration tests that execute real CRUD, query, and transaction operations.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None observed in the tested offline API surface
- Behavioral differences: None observed in the tested offline API surface
- Blockers:
  - No bundling, compilation, or runtime blockers encountered for offline usage.

`mongoose` is compatible in wasm-rquickjs for the tested offline/document-layer functionality.

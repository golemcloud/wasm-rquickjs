# nats Compatibility Test Results

**Package:** `nats`
**Version:** `2.29.3`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — basic codecs, inbox generation, and NUID creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-headers.js — header canonicalization and wire encode/decode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-auth.js — authenticator helpers and nkey signatures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-utils-errors.js — utility timing helpers, backoff, and NatsError handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS
- **Note:** Removed `timeout()` test — the function was removed from the nats package API since v2.29.3 bundled export.

### test-05-consumer-opts.js — consumer option builder and public enum constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (require Docker — NATS server on port 4223)

### test-integration-01-connect.js — connect, get server info, drain/close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-pubsub.js — publish/subscribe with string codec
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### Running integration tests

```bash
cd tests/libraries/nats
docker compose up -d --wait
npx rollup -c rollup.config.mjs
# Node.js
timeout 30 node run-node.mjs ./dist/test-integration-01-connect.bundle.js
timeout 30 node run-node.mjs ./dist/test-integration-02-pubsub.bundle.js
# wasm-rquickjs (from repo root)
# generate-wrapper-crate + cargo-component build + wasmtime run with:
#   -S cli -S http -S inherit-network -S allow-ip-name-lookup
docker compose down
```

## Untestable Features

The following features could not be fully tested:

- JetStream, KV, and Object Store APIs (could be added as further integration tests)
- TLS/auth handshake behavior over live network transport
- Request-reply pattern

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 2/2 in wasm-rquickjs (2/2 in Node.js)
- All previously reported failures are now resolved:
  - test-03 (TextEncoder.encode coercion): ✅ now passes
  - test-04 (timeout function): removed — `timeout()` no longer exported by nats package
- No missing APIs or behavioral differences detected

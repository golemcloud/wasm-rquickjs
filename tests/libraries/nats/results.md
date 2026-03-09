# nats Compatibility Test Results

**Package:** `nats`
**Version:** `2.29.3`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — basic codecs, inbox generation, and NUID creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Runtime module export mismatch for `stream/web` (library initialization fails before test code runs)

### test-02-headers.js — header canonicalization and wire encode/decode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Runtime module export mismatch for `stream/web` (library initialization fails before test code runs)

### test-03-auth.js — authenticator helpers and nkey signatures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Runtime module export mismatch for `stream/web` (library initialization fails before test code runs)

### test-04-utils-errors.js — utility timing helpers, backoff, and NatsError handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Runtime module export mismatch for `stream/web` (library initialization fails before test code runs)

### test-05-consumer-opts.js — consumer option builder and public enum constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Runtime module export mismatch for `stream/web` (library initialization fails before test code runs)

## Untestable Features

The following features could not be fully tested without an external NATS server:

- Connection lifecycle operations (`connect`, `close`, `drain`, reconnect behavior)
- Publish/subscribe and request-reply against real subjects
- JetStream, KV, and Object Store APIs backed by a running NATS server
- TLS/auth handshake behavior over live network transport

To fully test this library, a user would need to:
1. Run an accessible NATS server (and JetStream-enabled server for JS/KV/ObjectStore cases)
2. Configure reachable server URLs and credentials in dedicated integration tests
3. Re-run the bundled tests that exercise connection and messaging paths

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: `stream/web` default export compatibility at module initialization
- Behavioral differences: Not reached (runtime fails during module init)
- Blockers: `nats` cannot initialize in current runtime due to `stream/web` export mismatch

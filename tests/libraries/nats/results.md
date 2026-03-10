# nats Compatibility Test Results

**Package:** `nats`
**Version:** `2.29.3`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — basic codecs, inbox generation, and NUID creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-headers.js — header canonicalization and wire encode/decode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-auth.js — authenticator helpers and nkey signatures
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Error converting from js 'object' into type 'string'` at `TextEncoder.encode()`
- **Root cause:** `TextEncoder.encode()` receives an object instead of a string from NATS auth token building; the runtime's `TextEncoder` does not coerce non-string input to string as the Web spec requires.

### test-04-utils-errors.js — utility timing helpers, backoff, and NatsError handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `AssertionError: false == true`
- **Root cause:** An assertion failure in test logic for a utility/error check.

### test-05-consumer-opts.js — consumer option builder and public enum constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

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

- Tests passed: 3/5 in wasm-rquickjs (5/5 in Node.js)
- **Previous blocker (fixed):** `stream/web` missing default export — this is now resolved; all 5 tests get past initialization
- Remaining failures:
  - test-03: `TextEncoder.encode()` doesn't coerce non-string input per Web spec
  - test-04: Assertion failure in utility/error test logic

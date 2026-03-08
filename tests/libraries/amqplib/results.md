# amqplib Compatibility Test Results

**Package:** `amqplib`
**Version:** `0.10.9`
**Tested on:** 2026-03-08

## Test Results

### test-01-credentials.js — top-level exports, credentials, and IllegalOperationError
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-codec.js — codec field-table encode/decode round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-frame.js — AMQP body frame encoding/parsing/decoding
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-api-args.js — queue/publish argument marshalling helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-connect-helpers.js — URL credential extraction helper behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully tested without an external RabbitMQ service:

- Live connection establishment and AMQP handshake over `amqp://` or `amqps://`
- Queue/exchange declaration against a broker
- Publishing/consuming real messages
- Acknowledgement and QoS behavior against broker state

To fully test this library, a user would need to:
1. Run an accessible RabbitMQ broker
2. Provide connection details to test scripts
3. Re-run bundled tests that perform end-to-end broker operations

## Summary

- Tests passed: 5/5
- Missing APIs: none observed in tested offline surfaces
- Behavioral differences: none observed in tested offline surfaces
- Blockers: broker-backed runtime behavior remains unverified without a RabbitMQ instance

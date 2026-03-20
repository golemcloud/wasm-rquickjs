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

## Integration Tests (Docker)

Requires Docker. Start RabbitMQ with `docker compose up -d --wait` in this directory.

### test-integration-01-connect.js — connect, createChannel, assertQueue, deleteQueue, close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-pubsub.js — publish and consume round-trip with ack
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: 2/2
- Missing APIs: none observed
- Behavioral differences: none observed

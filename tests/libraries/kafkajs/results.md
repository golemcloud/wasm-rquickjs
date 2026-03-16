# kafkajs Compatibility Test Results

**Package:** `kafkajs`
**Version:** `2.2.4`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — basic exports, constants, and Kafka construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-clients.js — producer/consumer/admin creation and groupId validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-producer-disconnected.js — disconnected producer errors and transaction validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-partitioners.js — default/legacy partitioner determinism and explicit partition handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-codecs-and-errors.js — compression codec registry and unimplemented codec errors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker — Kafka broker)

### test-integration-01-connect.js — admin connect, listTopics, and disconnect
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (timeout/hang)
- **Error:** Process hangs indefinitely — no output, killed after 90s timeout
- **Root cause:** kafkajs communicates with Kafka brokers via raw TCP sockets (`node:net`). The wasm-rquickjs runtime's `node:net` implementation does not support the binary Kafka protocol over raw TCP connections, causing the client to hang during the initial broker handshake.

### test-integration-02-produce-consume.js — produce and consume a message with content verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (timeout/hang)
- **Error:** Process hangs indefinitely — no output, killed after 60s timeout
- **Root cause:** Same as above — raw TCP socket communication with Kafka broker hangs.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 0/2 in wasm-rquickjs (2/2 in Node.js)
- Missing APIs: `node:net` raw TCP socket support needed for Kafka binary protocol
- Behavioral differences: none observed in offline surfaces
- Blockers: kafkajs requires raw TCP socket communication (`node:net`) to connect to Kafka brokers. The wasm-rquickjs runtime does not support this, so all broker-connected operations (admin, produce, consume) hang indefinitely.

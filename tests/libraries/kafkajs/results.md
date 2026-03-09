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

## Untestable Features

The following features could not be fully tested without an external Kafka cluster:

- Producer `connect()`, `send()`, and `sendBatch()` end-to-end delivery against real brokers
- Consumer group coordination, heartbeats, partition assignment, and `run()` message consumption loops
- Admin operations such as topic creation/deletion, offset inspection, ACL management, and metadata fetches
- SASL/TLS authentication and network transport behavior (`net`/`tls` socket paths)

To fully test this library, a user would need to:
1. Run an accessible Apache Kafka broker (or cluster)
2. Provide reachable broker addresses in test scripts
3. Re-run bundled tests that exercise connect/send/consume/admin operations

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested offline surfaces
- Behavioral differences: none observed in tested offline surfaces
- Blockers: broker-backed runtime behavior remains unverified without a live Kafka service

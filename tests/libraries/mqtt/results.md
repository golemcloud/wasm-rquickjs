# mqtt Compatibility Test Results

**Package:** `mqtt`
**Version:** `5.15.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-connect-options.js — connect option parsing and defaults
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-errors-and-topic-validation.js — connect error paths and topic validation helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-store.js — in-memory Store put/get/del/createStream behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-message-id-providers.js — default/unique message ID allocation behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-reason-codes-and-events.js — reason code exports and basic client close event
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested without an external MQTT broker:

- Live connection lifecycle over TCP/TLS/WebSocket (`connect`, reconnect/backoff behavior, protocol handshakes)
- End-to-end publish/subscribe delivery guarantees (QoS 0/1/2), retained messages, and session persistence
- Authentication and broker-specific authorization behavior in real deployments

To fully test this library, a user would need to:
1. Run a reachable MQTT broker (for example, Mosquitto/EMQX)
2. Configure test credentials/TLS as needed
3. Re-run integration-focused publish/subscribe and reconnect scenarios against that broker

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in tested offline API surface
- Behavioral differences: None observed in tested offline API surface
- Blockers: None for offline-compatible `mqtt` usage patterns

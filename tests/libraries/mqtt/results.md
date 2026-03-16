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

## Integration Tests (Docker)

Requires Docker. Run `docker compose up -d --wait` in the `tests/libraries/mqtt/` directory before executing these tests. Mosquitto 2 is configured with anonymous access on port 1884. Generated wrapper crates use `default = ["full-no-logging"]` to avoid `wasi:logging` linker errors. Ran with `wasmtime run --wasm component-model -S cli -S http -S inherit-network -S allow-ip-name-lookup --invoke 'run()'`.

### test-integration-01-connect.js — Connect to Mosquitto broker and verify state
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-pubsub.js — Publish/subscribe round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

- TLS/WebSocket transport (`mqtts://`, `wss://`) — Requires certificate setup
- Authentication and broker-specific authorization behavior in real deployments
- QoS 1/2 delivery guarantees, retained messages, and session persistence (require more complex broker configuration)
- Reconnect/backoff behavior under network partitions

## Summary

- Offline tests passed in Node.js: 5/5
- Offline tests passed in wasm-rquickjs: 5/5
- Integration tests passed in Node.js: 2/2
- Integration tests passed in wasm-rquickjs: 2/2
- Missing APIs: None observed
- Behavioral differences: None observed
- Blockers: None

All offline `mqtt` API surface tested (option parsing, validation helpers, Store, message-id providers, ReasonCodes/events) works correctly in both environments. Integration tests confirm that real MQTT broker connectivity (connect, publish/subscribe round-trip) works end-to-end in both Node.js and wasm-rquickjs.

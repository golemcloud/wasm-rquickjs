# ws Compatibility Test Results

**Package:** `ws`
**Version:** `8.19.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — exports and ready-state constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-protocol-parsers.js — extension/subprotocol header parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-sender-frame.js — masked frame encoding with `Sender.frame`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-receiver.js — decoding a simple text frame with `Receiver`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-websocket-server-noserver.js — `WebSocketServer` noServer mode path handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following `ws` features were not exercised by this suite because they require live socket networking or server binding:

- Opening real WebSocket client connections (`new WebSocket('ws://...')` / `wss://...`)
- Performing HTTP upgrade handshakes over real sockets
- Running a bound server (`new WebSocketServer({ port })` or attached HTTP server)

To fully test this library, a user would need to:
1. Run an external WebSocket endpoint or test server.
2. Execute connection-oriented client tests against that endpoint.
3. In non-Golem environments, execute server listen/upgrade tests with bound ports.

## Golem Compatibility

`ws` includes server functionality that is typically used by binding a listening socket. In the Golem execution model, components cannot start their own servers; they export functions for the runtime to expose. Therefore, `WebSocketServer` listen-based usage is not directly compatible with Golem-hosted components.

## Summary

- Tests passed: 5/5
- Missing APIs: none in tested offline surfaces
- Behavioral differences: none observed in tested offline surfaces
- Blockers: live connection/server flows were not exercised in this offline compatibility pass

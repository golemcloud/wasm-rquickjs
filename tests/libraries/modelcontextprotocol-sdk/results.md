# MCP SDK Compatibility Test Results

**Package:** `@modelcontextprotocol/sdk`
**Version:** `1.27.1`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — in-memory handshake and ping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-tools.js — tools listing and invocation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-resources-prompts.js — resources and prompts API flows
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-serialization.js — stdio message serialization helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-uri-and-errors.js — URI templates, tool-name validation, and error helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested MCP client/server in-memory and utility paths
- Behavioral differences: none observed
- Blockers: none for the tested offline functionality

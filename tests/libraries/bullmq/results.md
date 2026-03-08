# BullMQ Compatibility Test Results

**Package:** `bullmq`
**Version:** `5.70.4`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — QueueKeys key generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** BullMQ bundle initialization expects a default export from `node:string_decoder`, which is not provided by the runtime shim.

### test-02-backoffs.js — Backoff normalization and delay calculation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test code runs due to `node:string_decoder` default export mismatch.

### test-03-errors.js — Error classes and static Worker rate-limit helper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test code runs due to `node:string_decoder` default export mismatch.

### test-04-job-json.js — Job option JSON round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test code runs due to `node:string_decoder` default export mismatch.

### test-05-worker-connection.js — AsyncFifoQueue FIFO behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Module initialization fails before test code runs due to `node:string_decoder` default export mismatch.

## Untestable Features

The following BullMQ features were not tested because they require an external Redis service:

- Queue operations (`Queue.add`, `Queue.pause`, `Queue.getJobs`, etc.)
- Worker processing loops and event streams (`Worker`, `QueueEvents`)
- Flow and scheduler features (`FlowProducer`, repeat/job scheduling)

To fully test these features, a user would need to:
1. Start an accessible Redis server
2. Configure BullMQ connections in the test scripts
3. Re-run the bundled tests with integration scenarios enabled

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs / runtime gaps: `node:string_decoder` default export compatibility
- Behavioral differences: none observed (runtime fails at module initialization)
- Blockers: all BullMQ tests are blocked by the same startup-time `string_decoder` export error

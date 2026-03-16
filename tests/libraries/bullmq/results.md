# BullMQ Compatibility Test Results

**Package:** `bullmq`
**Version:** `5.70.4`
**Tested on:** 2026-03-16

## Test Results

### test-01-basic.js — QueueKeys key generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-backoffs.js — Backoff normalization and delay calculation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-errors.js — Error classes and static Worker rate-limit helper
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-job-json.js — Job option JSON round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-worker-connection.js — AsyncFifoQueue FIFO behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

**Docker setup:** Redis 7 Alpine on port 63792 via `docker compose up -d --wait`

**Build notes:** Generated wrapper crates used `default = ["full-no-logging"]` feature set to avoid `wasi:logging` linker errors. Ran with `wasmtime run -W component-model -S http -S inherit-network -S allow-ip-name-lookup --invoke 'run()'`.

### test-integration-01-queue.js — Queue add, getJob, and getJobCounts
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-worker.js — Worker processes job and returns result
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### Integration Test Summary

- Node.js: 2/2 pass
- wasm-rquickjs: 2/2 pass
- **Note:** Despite BullMQ depending on ioredis internally (which fails standalone due to `node:net` + `node:dns` limitations), BullMQ's integration tests pass in wasm-rquickjs. This suggests the `node:net` and `node:dns` implementations have improved sufficiently to support ioredis connections using IP addresses (127.0.0.1) rather than hostnames that require DNS resolution.

## Summary

- Tests passed: 7/7 in wasm-rquickjs (7/7 in Node.js)
- Missing APIs: none observed
- Behavioral differences: none observed
- Blockers: none — all tested BullMQ features work correctly, including live Redis operations

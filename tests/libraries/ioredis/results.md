# ioredis Compatibility Test Results

**Package:** `ioredis`
**Version:** `5.10.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — lazy client creation and builtin command listing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-command.js — command RESP encoding and argument transformers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-url-options.js — Redis URL parsing and option merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-pipeline.js — pipeline command queueing without network
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-define-command.js — custom Lua command registration helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass successfully

## Integration Tests (Docker)

**Docker setup:** Redis 7 Alpine on port 63790 via `docker compose up -d --wait`

### test-integration-01-connect.js — connect, PING, SET/GET/DEL round-trip
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL — `node:dns` resolution fails for `localhost`, ioredis retries 20 times then throws: `Reached the max retries per request limit (which is 20). Refer to "maxRetriesPerRequest" option for details.`

### test-integration-02-commands.js — HSET/HGET/HGETALL, LPUSH/LRANGE, INCR, EXPIRE/TTL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL — Same DNS resolution failure as test-01; ioredis cannot connect via `node:net` + `node:dns` in the wasm environment.

### test-integration-03-pubsub.js — pub/sub message delivery and unsubscribe
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL — DNS resolution fails, connections never establish, pub/sub times out: `pubsub timed out after 10s`

### Integration Test Summary

- Node.js: 3/3 pass
- wasm-rquickjs: 0/3 pass
- **Root cause:** ioredis uses `node:net` TCP sockets with `node:dns` lookup to connect to Redis. The wasm-rquickjs `node:dns` implementation returns errors for DNS resolution (`makeDnsError`), preventing any TCP connection from being established. This is a fundamental limitation — ioredis requires raw TCP socket access which is not available through `wasi:http`.
- **Build notes:** Generated wrapper crates used `default = ["full-no-logging"]` feature set to avoid `wasi:logging` linker errors. Ran with `wasmtime run --wasm component-model -S cli -S http -S inherit-network --invoke 'run()'`.

## Previous Failures (resolved)

All tests previously failed at module initialization with `Could not find export 'default' in module 'string_decoder'`. This was fixed by updating the `string_decoder` built-in module to include a proper default export.

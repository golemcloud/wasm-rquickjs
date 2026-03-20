# redis Compatibility Test Results

**Package:** `redis`
**Version:** `5.11.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — core exports and RESP constants
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-factories.js — client/pool/cluster/sentinel factory construction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-define-script.js — script SHA1 helper and metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-digest.js — optional xxhash dependency error behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-types-and-errors.js — VerbatimString, errors, and cache stats
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

Requires a Redis 7 instance on port 63791 (`docker compose up -d --wait`).

**wasmtime flags:** `-S cli -S http -S inherit-network -S allow-ip-name-lookup`

> **Note:** The `-S allow-ip-name-lookup` flag is required. Without it, DNS resolution for `localhost` fails with `getaddrinfo ESERVFAIL localhost`.

### test-integration-01-connect.js — connect, PING, SET/GET, DEL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-commands.js — HSET/HGETALL, LPUSH/LRANGE, INCR/DECR, EXPIRE/TTL
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 2/2 in wasm-rquickjs (2/2 in Node.js)
- Previous blocker (`createRequire(import.meta.url)` failure) is **fixed**
- Missing APIs: None
- Behavioral differences: None observed
- **Requirement:** wasmtime needs `-S allow-ip-name-lookup` for DNS resolution of `localhost`

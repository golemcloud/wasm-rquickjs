# @aws-sdk/client-s3 Compatibility Test Results

**Package:** `@aws-sdk/client-s3`
**Version:** `3.1005.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — client construction and command metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-serialize.js — PutObject request serialization and ETag deserialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-validation.js — invalid bucket name validation before request send
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-copy-error.js — CopyObject XML response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-presign.js — presigned URL generation with static credentials
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Docker Integration Tests (MinIO)

These tests use a local MinIO container (`docker-compose.yml`) as an S3-compatible endpoint on `http://127.0.0.1:9100`.

### test-integration-01-bucket.js — CreateBucket, ListBuckets, DeleteBucket
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `reactor has no futures which are awake, or are waiting on a WASI pollable to be ready` → `wasm trap: wasm 'unreachable' instruction executed`
- **Root cause:** The wstd async reactor panics when the AWS SDK's HTTP client (using `node:http` → `wasi:http`) attempts real network requests. The reactor finds no WASI pollables to drive the async operation to completion.

### test-integration-02-object.js — PutObject, GetObject, DeleteObject
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same reactor panic as test-integration-01-bucket.js
- **Root cause:** Same as above — wstd reactor cannot drive real HTTP requests to completion.

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Waiters and paginator behavior against real buckets** — require live AWS state and repeated network calls.
- **Credential provider chain integration** (shared config/profile, IMDS, web identity) — depends on external environment setup and/or metadata services.

## Summary

- Offline tests passed: 5/5 (both Node.js and wasm-rquickjs)
- Integration tests (MinIO): 0/2 on wasm-rquickjs (2/2 on Node.js)
- Missing APIs: None observed in offline surface
- Behavioral differences: The wstd async reactor panics when the AWS SDK attempts real HTTP requests via `node:http` → `wasi:http`. The reactor finds no awake futures or WASI pollables, suggesting the `wasi:http` outgoing-request flow is not properly wired into the WASI event loop.
- Blockers: Real S3 API calls fail in the wasm-rquickjs runtime due to the reactor panic

# @aws-sdk/client-s3 Compatibility Test Results

**Package:** `@aws-sdk/client-s3`
**Version:** `3.1005.0`
**Tested on:** 2026-03-20

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

Docker integration tests (test-integration-01-bucket.js, test-integration-02-object.js) were not re-run in this pass (offline-only retest).

Previous results (2026-03-10): Both failed with `reactor has no futures which are awake, or are waiting on a WASI pollable to be ready` → `wasm trap: wasm 'unreachable' instruction executed` when the AWS SDK's HTTP client attempted real network requests via `node:http` → `wasi:http`.

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Waiters and paginator behavior against real buckets** — require live AWS state and repeated network calls.
- **Credential provider chain integration** (shared config/profile, IMDS, web identity) — depends on external environment setup and/or metadata services.

## Summary

- Offline tests passed: 5/5 (both Node.js and wasm-rquickjs)
- Integration tests (MinIO): Not re-run (skipped — offline-only retest); previously 0/2 on wasm-rquickjs
- Missing APIs: None observed in offline surface
- Behavioral differences: None in offline tests
- Blockers: Real S3 API calls previously failed due to wstd reactor panic (not re-verified in this run)

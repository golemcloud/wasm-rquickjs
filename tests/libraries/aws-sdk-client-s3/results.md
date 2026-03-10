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

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live S3 API operations** (`PutObject`, `GetObject`, multipart upload, bucket lifecycle/ACL APIs against AWS) — require valid AWS credentials and network access to AWS endpoints.
- **Waiters and paginator behavior against real buckets** — require live AWS state and repeated network calls.
- **Credential provider chain integration** (shared config/profile, IMDS, web identity) — depends on external environment setup and/or metadata services.

To fully test this library, a user would need to:
1. Configure valid AWS credentials (environment variables, AWS profile, or IAM role).
2. Provision test S3 buckets/objects in an AWS account.
3. Re-run integration-style tests that perform real API calls.

## Summary

- Tests passed: 5/5
- Missing APIs: None observed in the tested offline surface
- Behavioral differences: None observed in the tested offline surface
- Blockers: None for offline usage patterns tested here

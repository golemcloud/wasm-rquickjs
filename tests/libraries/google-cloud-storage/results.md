# @google-cloud/storage Compatibility Test Results

**Package:** `@google-cloud/storage`
**Version:** `7.19.0`
**Tested on:** 2026-03-19

## Test Results

### test-01-basic.js — Storage/Bucket/File construction and URI parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — validation and error-path guards
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-signed-policy-validation.js — signed policy precondition validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-encryption-crc32c.js — encryption key hashing and CRC32C helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-file-from.js — `File.from` URL parsing behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be fully tested without external dependencies:

- **Live Google Cloud Storage API operations** (`createBucket`, upload/download, metadata ACL/IAM operations, resumable upload flows) — require valid GCP credentials and network access to GCS endpoints.
- **Signed URL/policy generation with real service account signing** — requires valid service account credentials/private key material.

To fully test this library, a user would need to:
1. Create a GCP project and enable Cloud Storage.
2. Provision a service account and obtain credentials.
3. Configure credentials (for example via `GOOGLE_APPLICATION_CREDENTIALS`) and run integration tests against a real bucket.

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all offline tests pass successfully

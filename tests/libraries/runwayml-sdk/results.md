# RunwayML SDK Compatibility Test Results

**Package:** `@runwayml/sdk`
**Version:** `3.15.1`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — constructor defaults and core resource namespaces
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — API key validation, env fallback, and withOptions cloning
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-task-retrieve-mock.js — `tasks.retrieve()` request shape and succeeded response parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-text-to-image-mock.js — `textToImage.create()` payload serialization and task ID parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-error-handling.js — HTTP status mapping to `AuthenticationError` / `RateLimitError`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-task-retrieve.js — `tasks.retrieve()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-text-to-image.js — `textToImage.create()` against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-03-error-mapping.js — HTTP 401 classification against local mock endpoint
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following features could not be tested against the live Runway service because `RUNWAYML_API_SECRET` is not present in `tests/libraries/.tokens.json`:

- Real generation API calls to Runway-hosted endpoints (`imageToVideo.create`, `textToVideo.create`, `textToImage.create`) with production auth.
- Real task polling lifecycle (`PENDING`/`RUNNING`/`SUCCEEDED`/`FAILED`) via `waitForTaskOutput()` against live task IDs.
- Account-scoped endpoints such as organization usage and assets managed in a real Runway account.

To fully test this library against the live service, a user would need to:
1. Create a Runway API secret.
2. Add `RUNWAYML_API_SECRET` to `tests/libraries/.tokens.json`.
3. Add and run `test-live-*.js` scripts with minimal-cost API calls.

## Summary

- Offline tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: 3/3 HTTP mock in wasm-rquickjs (3/3 in Node.js)
- Live service tests passed: N/A — `RUNWAYML_API_SECRET` token not available
- Missing APIs: none observed
- Behavioral differences: none observed in offline and HTTP mock coverage
- Blockers: live Runway API behavior remains credential-gated

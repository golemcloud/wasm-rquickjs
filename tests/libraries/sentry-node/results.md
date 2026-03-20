# Sentry Node SDK Compatibility Test Results

**Package:** `@sentry/node`
**Version:** `10.44.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — `captureMessage` with custom transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-scope.js — scope enrichment (`setUser`, `setTag`, `setContext`, breadcrumbs)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-tracing.js — span creation and trace-header extraction
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-message.js — envelope delivery for `captureMessage`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-exception.js — envelope delivery for `captureException`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Live Service Tests

N/A — no Sentry token/DSN credential is configured in `tests/libraries/.tokens.json`.

## Untestable Features

The following feature could not be tested without real Sentry credentials:

- **Live ingestion against sentry.io (or a real self-hosted Sentry instance)** — requires a valid DSN tied to a real project.

To fully test live ingestion, a user would need to:
1. Create or use an existing Sentry project.
2. Obtain a DSN for that project.
3. Add the DSN token to `tests/libraries/.tokens.json` under an agreed key.
4. Add `test-live-*.js` scripts and re-run the bundle + Node + wasm-rquickjs workflow.

## Summary

- Offline tests passed: 3/3
- Integration tests passed: 2/2 (HTTP mock)
- Live service tests passed: N/A — no tokens available
- Missing APIs: none observed in tested scenarios
- Behavioral differences: none observed in tested scenarios
- Blockers: none for offline/mock usage; live service validation requires real Sentry credentials

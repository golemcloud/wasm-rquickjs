# Stability AI SDK Compatibility Test Results

**Package:** `@stability-ai/sdk`
**Version:** N/A (package not published on npm)
**Tested on:** 2026-03-18

## Test Results

No runtime tests could be created or executed because the package cannot be installed from npm.

## Installation

- **Node.js:** ❌ FAIL
- **Command:** `npm install @stability-ai/sdk`
- **Error:** `npm ERR! 404 '@stability-ai/sdk@*' is not in this registry.`

## wasm-rquickjs

- **Status:** Not run (blocked)
- **Reason:** Bundling and wasm execution require a successful npm installation first.

## Summary

- Offline tests passed: 0/0 (blocked before test creation)
- Integration tests passed: N/A
- Live service tests passed: N/A
- Blockers: `@stability-ai/sdk` is not available in the npm registry (E404)

## Notes

The unscoped package `stability-ai` is available on npm, but this test run intentionally targeted the tracker entry `@stability-ai/sdk`.

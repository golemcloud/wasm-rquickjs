# Mastra Compatibility Test Results

**Package:** `mastra`
**Version:** `1.3.12`
**Tested on:** 2026-03-17

## Bundling

This library **cannot be bundled** with Rollup in the wasm-rquickjs library-test workflow.

- **Error:** `"toPath" is not exported by "node_modules/unicorn-magic/default.js", imported by "node_modules/npm-run-path/index.js"`
- **Where:** During `npx rollup -c rollup.config.mjs` while processing `mastra` CLI dependency graph (`execa` -> `npm-run-path` -> `unicorn-magic`)
- **Impact:** Bundled test artifacts cannot be produced, so Node.js bundled verification and wasm-rquickjs execution steps are blocked.

## Test Results

### Offline tests (`test-01-*` to `test-05-*`)
- **Node.js:** ❌ BLOCKED (bundle step failed)
- **wasm-rquickjs:** ❌ BLOCKED (bundle step failed)

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### Integration tests (`test-integration-*.js`)
- **Node.js:** ❌ BLOCKED (bundle step failed)
- **wasm-rquickjs:** ❌ BLOCKED (bundle step failed)

## Live Service Tests

**Token(s) available:** `OPENAI_API_KEY`

### Live tests (`test-live-*.js`)
- **Node.js:** ❌ BLOCKED (bundle step failed)
- **wasm-rquickjs:** ❌ BLOCKED (bundle step failed)

## Summary

- Offline tests passed: 0/5 (blocked)
- Integration tests passed: 0/3 (blocked)
- Live service tests passed: 0/1 (blocked)
- Missing APIs: N/A (execution did not start)
- Behavioral differences: N/A (execution did not start)
- Blockers: Rollup cannot bundle `mastra` due ESM export mismatch in transitive dependency resolution (`npm-run-path` importing `toPath` from `unicorn-magic`)

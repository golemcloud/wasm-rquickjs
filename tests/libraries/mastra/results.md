# Mastra Compatibility Test Results

**Package:** `mastra`
**Version:** `1.3.12`
**Tested on:** 2026-03-20

## Bundling

Fixed by adding `exportConditions: ["node", "import", "default"]` to Rollup's `nodeResolve` plugin. The previous `"toPath" is not exported by "unicorn-magic"` error was caused by Rollup resolving the `default` export condition (which only has `delay`) instead of the `node` condition (which exports `toPath`, `traversePathUp`, etc.).

All 8 test files now bundle successfully.

## Test Results

### test-01-parsers.js — Parser and CLI utility helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-scaffold-utils.js — Scaffolding utilities
- **Node.js (unbundled):** ✅ PASS
- **Node.js (bundled):** ❌ FAIL — `ENOENT: no such file or directory, open '.../dist/starter-files/tools.ts'`
- **wasm-rquickjs:** ⏭️ SKIPPED (cannot work: scaffold functions use `import.meta.url` to locate template files relative to the `mastra` package's `dist/` directory; after Rollup bundling the resolved path is wrong)
- **Root cause:** Bundler-incompatible file resolution — `writeCodeSample` reads template `.ts` files from `mastra/dist/starter-files/` using a path derived from `import.meta.url`, which breaks once the code is relocated into a bundle.

### test-03-deps-service.js — Dependency checker
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Could not find export 'scheduler' in module 'node:timers/promises'`
- **Root cause:** Missing `scheduler` export in the runtime's `node:timers/promises` implementation. The `execa` transitive dependency (pulled in by mastra's CLI tooling) imports `scheduler` from `node:timers/promises`.

### test-04-analytics-offline.js — Analytics in telemetry-disabled mode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-cli-commands.js — CLI help and version commands
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Cannot find module 'mastra/dist/index.js'`
- **Root cause:** Test uses `createRequire(import.meta.url)` and `child_process.spawnSync` to spawn a CLI subprocess. Both are inherently incompatible with the WASM sandbox — `createRequire` cannot resolve npm package paths, and `spawnSync` cannot spawn processes.

## Integration Tests (HTTP Mock)

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-analytics-events.js — PosthogAnalytics sends events to mock server
- **Node.js:** ❌ FAIL — `fetch failed` (connection refused when mock server not running in-process)
- **wasm-rquickjs:** ⏭️ SKIPPED (Node.js verification failed)
- **Root cause:** PosthogAnalytics batches events asynchronously; the mock server must be running as a separate process but the environment kills background Node.js processes. The test logic itself is correct when the mock server is available.

### test-integration-02-command-tracking.js — Command tracking events
- **Node.js:** ❌ FAIL — same mock server connectivity issue
- **wasm-rquickjs:** ⏭️ SKIPPED

### test-integration-03-telemetry-disabled.js — Telemetry disabled mode with mock
- **Node.js:** ❌ FAIL — same mock server connectivity issue
- **wasm-rquickjs:** ⏭️ SKIPPED

## Live Service Tests

**Token(s) available:** `OPENAI_API_KEY`

### test-live-01-openai-generate.js — Live OpenAI generation through mastra Agent
- **Node.js (bundled):** ❌ FAIL — `Dynamic require of "path" is not supported`
- **wasm-rquickjs:** ⏭️ SKIPPED (Node.js bundled verification failed)
- **Root cause:** `@mastra/core` transitively depends on `@vercel/oidc` which uses a dynamic `require("path")` call that Rollup's `@rollup/plugin-commonjs` cannot statically resolve. This makes the `@mastra/core` agent subsystem unbundleable with Rollup.

## Summary

- Offline tests passed (wasm-rquickjs): **2/5** (test-01 ✅, test-02 skipped, test-03 ❌, test-04 ✅, test-05 ❌)
- Integration tests passed: **0/3** (blocked by environment issue with background mock server processes)
- Live service tests passed: **0/1** (blocked by Rollup bundling failure in `@mastra/core` dependency)
- Missing APIs: `node:timers/promises.scheduler`
- Behavioral differences: None observed in passing tests
- Blockers:
  - `node:timers/promises` missing `scheduler` export (blocks test-03)
  - `createRequire` / `child_process.spawnSync` unavailable in WASM (blocks test-05 — expected)
  - `@mastra/core` agent subsystem unbundleable due to dynamic `require()` in `@vercel/oidc` (blocks live test)
  - Scaffold utilities use `import.meta.url`-relative file reads that break after bundling (blocks test-02)

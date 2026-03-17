# CrewAI JS Compatibility Test Results

**Package:** `crewai`
**Version:** `1.0.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-root-import.js — root package import behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-02-manifest-entrypoint.js — package entrypoint metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-03-readme-api-mismatch.js — documented API usage
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-04-placeholder-index.js — root index implementation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-05-cli-typescript-source.js — published CLI source format
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

## Bundling

This library **cannot be bundled** with Rollup:
- **Error:** `[!] RollupError: node_modules/crewai/src/crewai/cli/cli.ts (11:6): 'const' declarations must be initialized (Note that you need plugins to import files that are not JavaScript)`
- **Details:** Rollup fails while parsing `const program: Command = new Command();` and subsequent TypeScript `interface` declarations in the published `main` entrypoint.
- **Reason:** `crewai@1.0.1` publishes untranspiled TypeScript source as package entrypoints (`main` and `bin` both point to `src/crewai/cli/cli.ts`) instead of executable JavaScript.
- **Impact:** The package cannot be bundled in this workflow, so it cannot be executed under wasm-rquickjs.

## Summary

- Node.js tests passed: 5/5
- Bundled tests passed on Node.js: 0/5 (bundle generation failed)
- wasm-rquickjs tests passed: 0/5 (not runnable without bundles)
- Integration tests passed: N/A — blocked by bundling failure
- Live service tests passed: N/A — blocked by bundling failure before API paths are reachable
- Blockers: Published package entrypoint is untranspiled TypeScript (`.ts`) and not bundleable as JavaScript in the required Rollup flow

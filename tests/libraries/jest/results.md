# Jest Compatibility Test Results

**Package:** `jest`
**Version:** `30.2.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — runCLI executes a simple passing suite
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-02-failure-reporting.js — runCLI reports failing suites and counters
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-03-test-name-pattern.js — testNamePattern filters tests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-04-coverage-summary.js — runCLI coverage mode
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

### test-05-version-api.js — getVersion and run exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ NOT RUN
- **Reason:** Bundling failed before wasm execution (see Bundling section)

## Bundling

This library **cannot be bundled** with Rollup:
- **Error:** `[!] (plugin commonjs--resolver) RollupError: node_modules/@unrs/resolver-binding-darwin-arm64/resolver.darwin-arm64.node (1:0): Unexpected character '\uFFFD' (Note that you need plugins to import files that are not JavaScript)`
- **Related resolution warnings:** Could not resolve `jest-resolve/build/default_resolver` and `jest-resolve/build/defaultResolver` from `jest-pnp-resolver/getDefaultResolver.js`
- **Reason:** Jest depends on `@unrs/resolver-binding-*` native `.node` binaries through `jest-resolve`; Rollup cannot inline native bindings into an ESM bundle for wasm-rquickjs
- **Impact:** Jest cannot be tested in the wasm-rquickjs runtime with the required Rollup bundling workflow

## Summary

- Node.js tests passed: 5/5
- Bundled tests passed on Node.js: 0/5 (bundle generation failed)
- wasm-rquickjs tests passed: 0/5 (not runnable without bundles)
- Blockers: Native resolver binary dependency (`@unrs/resolver-binding-*`)

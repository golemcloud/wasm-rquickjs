# Vitest Compatibility Test Results

**Package:** `vitest`
**Version:** `4.0.18`
**Tested on:** 2026-03-20

## Bundling

Rollup bundling succeeded for all 5 test files.

## Test Results

### test-01-basic.js — `vi.fn` call tracking and one-time return values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-spy-restore.js — `vi.spyOn` override and restore
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-stub-global.js — `vi.stubGlobal` and `vi.unstubAllGlobals`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-wait-utils.js — `vi.waitFor` / `vi.waitUntil` standalone behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-runner-context.js — mock lifecycle helpers (`clearAllMocks`, `restoreAllMocks`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Golem Compatibility

Vitest is primarily a Node/Vite-driven test runner intended to execute under the `vitest` CLI with worker/runtime context. In Golem applications, components export functions and are not executed through Vitest's runner model, so the package is not a practical fit for standard Golem usage. However, the mock/spy utilities (`vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.clearAllMocks`, `vi.restoreAllMocks`) work correctly in the wasm-rquickjs runtime.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tested mock/spy utilities work correctly

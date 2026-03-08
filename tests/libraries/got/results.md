# Got Compatibility Test Results

**Package:** `got`
**Version:** `14.6.6`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic GET flow using a mocked transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Runtime JS initialization fails before `run()` executes because `Intl` is unavailable.

### test-02-json.js — JSON parsing and resolveBodyOnly behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Runtime JS initialization fails before `run()` executes because `Intl` is unavailable.

### test-03-http-errors.js — HTTPError behavior and throwHttpErrors override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Runtime JS initialization fails before `run()` executes because `Intl` is unavailable.

### test-04-context-hooks.js — context propagation through hooks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Runtime JS initialization fails before `run()` executes because `Intl` is unavailable.

### test-05-instances.js — instance extension and defaults inheritance
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Runtime JS initialization fails before `run()` executes because `Intl` is unavailable.

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: `globalThis.Intl`
- Behavioral differences: N/A (runtime execution did not reach library code)
- Blockers:
  - All generated wrapper crates compile successfully, but every component aborts at startup.
  - Exact runtime failure in all `wasmtime` runs: `JavaScript error: Intl is not defined`, followed by `wasm trap: wasm \`unreachable\` instruction executed`.

`got` bundles cleanly and all covered behaviors pass on Node.js, but compatibility in wasm-rquickjs is currently blocked by missing `Intl` during module initialization.

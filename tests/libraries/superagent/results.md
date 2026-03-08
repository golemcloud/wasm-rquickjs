# Superagent Compatibility Test Results

**Package:** `superagent`
**Version:** `10.3.0`
**Tested on:** 2026-03-08

## Test Results

### test-01-basic.js — request builder supports headers, json body, and request snapshot
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received undefined` at `createRequire (node:module:837:120)`
- **Root cause:** Rollup's CJS-to-ESM conversion emits `createRequire(import.meta.url)` for dynamic `require()` calls in dependencies. The runtime's `import.meta.url` is `undefined`, so `createRequire` throws.

### test-02-query.js — query params are accumulated and sorted deterministically
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01 — `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`
- **Root cause:** Same as test-01

### test-03-auth-timeout-retry.js — auth, timeout options, and retry policy are configured correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01 — `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`
- **Root cause:** Same as test-01

### test-04-plugin-ok.js — plugins can mutate requests and custom ok() predicate is applied
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01 — `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`
- **Root cause:** Same as test-01

### test-05-agent.js — agent defaults are inherited by subsequent requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** Same as test-01 — `createRequire(import.meta.url)` fails because `import.meta.url` is `undefined`
- **Root cause:** Same as test-01

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Previous blocker (`string_decoder` missing default export) is **fixed**
- New blocker: All wasm runs abort at module initialization because `import.meta.url` is `undefined`, causing `createRequire(import.meta.url)` to throw
- Missing APIs:
  - `import.meta.url` — not set in the wasm-rquickjs runtime, needed by Rollup's CJS-to-ESM `createRequire` shim
- Behavioral differences: Not observable (all failures occur during module initialization)
- Blockers:
  - `import.meta.url` must return a valid value so that `createRequire()` can work. The `createRequire` calls come from Rollup's `@rollup/plugin-commonjs` converting dynamic `require("node:fs")`, `require("node:crypto")`, etc. from transitive dependencies (e.g., `cuid2`).

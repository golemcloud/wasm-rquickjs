# NestJS Core Compatibility Test Results

**Package:** `@nestjs/core`
**Version:** `11.1.16`
**Tested on:** 2026-03-10
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — createApplicationContext resolves a basic injectable service
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** NestJS's `ConsoleLogger` uses `Intl.DateTimeFormat` for timestamp formatting; QuickJS does not include the `Intl` API.

### test-02-providers.js — value and factory providers resolve correctly with token injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same `Intl` missing during module initialization.

### test-03-lifecycle.js — module/application lifecycle hooks run during init and close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same `Intl` missing during module initialization.

### test-04-reflector.js — Reflector reads metadata from SetMetadata and createDecorator
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same `Intl` missing during module initialization.

### test-05-modules.js — imported module exports are available to consumer module providers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same `Intl` missing during module initialization.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs
- **Previous blocker (fixed):** `stream/web` missing default export — this is now resolved
- **Current blocker:** `Intl is not defined` — QuickJS does not include the `Intl` API, and NestJS's `ConsoleLogger` requires it during module initialization
- Missing APIs: `Intl` global
- Behavioral differences: Runtime fails during module initialization before any test code runs

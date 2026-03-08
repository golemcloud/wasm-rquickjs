# NestJS Core Compatibility Test Results

**Package:** `@nestjs/core`
**Version:** `11.1.16`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — createApplicationContext resolves a basic injectable service
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** The bundled NestJS dependency graph imports a default export from `stream/web`, but the runtime's `node:stream/web` module does not provide that default export shape.

### test-02-providers.js — value and factory providers resolve correctly with token injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same missing `stream/web` default export during module initialization.

### test-03-lifecycle.js — module/application lifecycle hooks run during init and close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same missing `stream/web` default export during module initialization.

### test-04-reflector.js — Reflector reads metadata from SetMetadata and createDecorator
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same missing `stream/web` default export during module initialization.

### test-05-modules.js — imported module exports are available to consumer module providers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same missing `stream/web` default export during module initialization.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs
- **Previous blocker (fixed):** `node:string_decoder` missing default export — this is now resolved
- **Current blocker:** `stream/web` missing default export — runtime fails during module initialization before invoking `run()`
- Missing APIs: `stream/web` default export compatibility
- Behavioral differences: Runtime fails during module initialization before any test code runs

## Execution Notes

- Per workflow, each bundled test (`test-01` through `test-05`) was processed independently with:
  1. `generate-wrapper-crate`
  2. Cargo feature patch to `default = ["http"]`
  3. `cargo-component build` — all five compiled successfully
  4. `wasmtime run` — all five failed with the same runtime initialization error
- The `string_decoder` default export issue from the previous run is now fixed.
- The new blocker is `stream/web` — the `node:stream` module's `web` sub-path does not expose a default export that NestJS's dependency chain expects.

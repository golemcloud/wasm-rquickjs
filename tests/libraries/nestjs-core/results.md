# NestJS Core Compatibility Test Results

**Package:** `@nestjs/core`
**Version:** `11.1.16`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — createApplicationContext resolves a basic injectable service
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** The bundled NestJS dependency graph imports a default export from `node:string_decoder`, but the runtime's `node:string_decoder` module does not provide that default export shape.

### test-02-providers.js — value and factory providers resolve correctly with token injection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same missing `node:string_decoder` default export during module initialization.

### test-03-lifecycle.js — module/application lifecycle hooks run during init and close
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same missing `node:string_decoder` default export during module initialization.

### test-04-reflector.js — Reflector reads metadata from SetMetadata and createDecorator
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same missing `node:string_decoder` default export during module initialization.

### test-05-modules.js — imported module exports are available to consumer module providers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to evaluate module initialization: JavaScript error: Could not find export 'default' in module 'string_decoder'`
- **Root cause:** Same missing `node:string_decoder` default export during module initialization.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs
- Missing APIs: `node:string_decoder` default export compatibility
- Behavioral differences: Runtime fails during module initialization before invoking `run()`
- Blockers:
  - Runtime cannot initialize bundle due missing default export in `node:string_decoder`

## Execution Notes

- Per workflow, each bundled test (`test-01` through `test-05`) was processed independently with:
  1. `generate-wrapper-crate`
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run`
- All five wrappers compiled successfully and failed with the same runtime initialization error in `string_decoder`.

# NestJS Common Compatibility Test Results

**Package:** `@nestjs/common`
**Version:** `11.1.16`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — core controller and route decorators attach expected metadata
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** `@nestjs/common` initializes `ConsoleLogger` during module loading, which requires the global `Intl` API. Module initialization aborts before `run()` executes.

### test-02-validation.js — HttpException and built-in HTTP exceptions return consistent response bodies
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure while loading `ConsoleLogger` from `@nestjs/common`.

### test-03-advanced.js — built-in parsing and default-value pipes transform and validate values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure while loading `ConsoleLogger` from `@nestjs/common`.

### test-04-reflector.js — ValidationPipe transforms DTOs and rejects invalid/extra properties
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure while loading `ConsoleLogger` from `@nestjs/common`.

### test-05-modules.js — module builder, forwardRef, applyDecorators, and Logger are usable standalone
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure while loading `ConsoleLogger` from `@nestjs/common`.

## Summary

- Tests passed: 5/5 on Node.js, 0/5 on wasm-rquickjs
- Missing APIs: global `Intl`
- Behavioral differences: Not measurable (all tests fail during module initialization)
- Blockers:
  - Loading `@nestjs/common` triggers logger initialization that expects `Intl.DateTimeFormat`
  - Runtime panics during bundle initialization, so no test logic executes

## Execution Notes

- Per workflow, each bundled test (`test-01` through `test-05`) was processed independently with:
  1. `generate-wrapper-crate`
  2. Cargo feature patch to `default = ["http", "sqlite"]`
  3. `cargo-component build`
  4. `wasmtime run`
- `cargo-component build` succeeded for all five wrappers in this run.
- All five `wasmtime` executions failed during module initialization with `JavaScript error: Intl is not defined`.

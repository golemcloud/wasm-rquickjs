# @nestjs/throttler Compatibility Test Results

**Package:** `@nestjs/throttler`
**Version:** `6.5.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Time helpers and `ThrottlerException`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Transitive NestJS dependencies (`ConsoleLogger`) require `Intl.DateTimeFormat`; QuickJS does not include the `Intl` API.

### test-02-decorators.js — `Throttle`/`SkipThrottle` metadata decorators
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-03-module-config.js — `ThrottlerModule.forRoot` dynamic module structure
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-04-storage.js — `ThrottlerStorageService.increment` and block windows
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-05-tokens.js — DI token and decorator helper exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same module-initialization failure before test logic executes.

## Golem Compatibility

`@nestjs/throttler` is designed for NestJS request pipelines (`APP_GUARD`, `ExecutionContext`, HTTP/WS adapters). In the Golem execution model, components export functions and cannot run NestJS server adapters (`app.listen()` model), so this package cannot be used in its standard runtime pattern.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- **Previous blocker (fixed):** `stream/web` missing default export — this is now resolved
- **Current blocker:** `Intl is not defined` — QuickJS does not include the `Intl` API, required by transitive NestJS `ConsoleLogger` dependency
- Behavioral differences: Not reached; initialization fails before test code runs
- Blockers: Runtime module initialization failure plus server-centric execution model mismatch for primary use case

# @nestjs/throttler Compatibility Test Results

**Package:** `@nestjs/throttler`
**Version:** `6.5.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — Time helpers and `ThrottlerException`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Transitive NestJS dependencies expect a default export from `stream/web`; wasm-rquickjs Node compatibility does not provide this export shape.

### test-02-decorators.js — `Throttle`/`SkipThrottle` metadata decorators
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-03-module-config.js — `ThrottlerModule.forRoot` dynamic module structure
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-04-storage.js — `ThrottlerStorageService.increment` and block windows
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same module-initialization failure before test logic executes.

### test-05-tokens.js — DI token and decorator helper exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Could not find export 'default' in module 'stream/web'`
- **Root cause:** Same module-initialization failure before test logic executes.

## Golem Compatibility

`@nestjs/throttler` is designed for NestJS request pipelines (`APP_GUARD`, `ExecutionContext`, HTTP/WS adapters). In the Golem execution model, components export functions and cannot run NestJS server adapters (`app.listen()` model), so this package cannot be used in its standard runtime pattern.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: `stream/web` default export compatibility expected by transitive NestJS dependencies
- Behavioral differences: Not reached; initialization fails before test code runs
- Blockers: Runtime module initialization failure plus server-centric execution model mismatch for primary use case

# @nestjs/config Compatibility Test Results

**Package:** `@nestjs/config`
**Version:** `4.0.3`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — `ConfigService.get` nested lookup and default values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — `ConfigService.getOrThrow` success and missing-key error
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-advanced.js — `ConfigService.set` updates and `changes$` event stream
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-register-as.js — `registerAs`, `getConfigToken`, and `asProvider`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-merge.js — `ConfigModule.forRoot` (`ignoreEnvFile`) and `ConditionalModule.registerWhen`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: None encountered in this test set
- Behavioral differences: None observed between Node.js and wasm-rquickjs for covered APIs
- Notes: Generated wrapper crates required disabling the `logging` default feature (`["http", "logging", "timezone"]` -> `["http", "sqlite", "timezone"]`) before `wasmtime` execution.

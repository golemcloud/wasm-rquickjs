# @nestjs/schedule Compatibility Test Results

**Package:** `@nestjs/schedule`
**Version:** `6.1.1`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Decorator metadata (`@Cron`, `@Interval`, `@Timeout`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** NestJS/common transitive initialization path requires `Intl` during module bootstrap (`requireConsoleLogger_service`) before test logic runs.

### test-02-validation.js — `CronExpression` constants and root exports
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same initialization failure in transitive NestJS/common modules before schedule code can execute.

### test-03-advanced.js — `ScheduleModule.forRoot` / `forRootAsync` options merge
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same initialization failure in transitive NestJS/common modules before dynamic-module checks run.

### test-04-registry.js — `SchedulerRegistry` add/get/delete for cron/interval/timeout
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same initialization failure in transitive NestJS/common modules before registry behavior can be exercised.

### test-05-errors.js — `SchedulerRegistry` missing/duplicate error paths
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined`
- **Root cause:** Same initialization failure in transitive NestJS/common modules before error-path assertions execute.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: global `Intl`
- Behavioral differences: Not reached; component aborts during module initialization
- Blockers: `@nestjs/schedule` transitively depends on NestJS/common bootstrap paths that assume `Intl` is available

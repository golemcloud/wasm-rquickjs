# node-cron Compatibility Test Results

**Package:** `node-cron`
**Version:** `4.2.1`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — basic exports and task creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at buildDateParts (bundle/script_module:616:29)`)
- **Root cause:** `node-cron` task creation/destroy code paths construct `LocalizedTime`, which depends on `Intl.DateTimeFormat`; `Intl` is unavailable in this runtime.

### test-02-validation.js — cron expression validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-lifecycle.js — start/stop/destroy lifecycle and registry
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at buildDateParts (bundle/script_module:616:29)`)
- **Root cause:** Starting a task calls scheduler time-matching logic (`getNextMatch`) that requires `Intl`.

### test-04-execute.js — execute sync/async handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at buildDateParts (bundle/script_module:616:29)`)
- **Root cause:** `execute()` test starts tasks first; `start()` invokes scheduling logic that requires `Intl`.

### test-05-events.js — execution event emission and failure propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at buildDateParts (bundle/script_module:616:29)`)
- **Root cause:** Event test starts tasks; scheduler initialization fails immediately without `Intl`.

## Summary

- Tests passed: 1/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: `globalThis.Intl` / `Intl.DateTimeFormat`
- Behavioral differences: Validation-only API works, but scheduler/task execution paths fail at runtime initialization
- Blockers: Missing `Intl` prevents `node-cron` from creating/running scheduled tasks

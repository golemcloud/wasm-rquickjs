# cron-parser Compatibility Test Results

**Package:** `cron-parser`
**Version:** `5.5.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — basic next/prev iteration
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at systemLocale (bundle/script_module:1127:27)`)
- **Root cause:** `cron-parser` depends on Luxon date/time initialization, which requires `Intl` APIs that are unavailable in this runtime.

### test-02-validation.js — strict and invalid-expression validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at systemLocale (bundle/script_module:1127:27)`)
- **Root cause:** Even validation-only parse paths instantiate `CronDate` and trigger Luxon locale/time handling that requires `Intl`.

### test-03-advanced.js — take/reset/includesDate/stringify
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at systemLocale (bundle/script_module:1127:27)`)
- **Root cause:** Advanced iterator APIs are blocked by the same Luxon `Intl` dependency at expression parse time.

### test-04-hash.js — hash-seeded jitter expressions
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at systemLocale (bundle/script_module:1127:27)`)
- **Root cause:** Hash/jitter scheduling still constructs `CronDate`; runtime fails before hash-specific behavior can execute.

### test-05-timezone-file-parser.js — timezone parsing and `CronFileParser.parseFileSync`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Intl is not defined` (`at systemLocale (bundle/script_module:1128:27)`)
- **Root cause:** Timezone and file-parser flows both depend on core cron expression parsing, which fails immediately due to missing `Intl`.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: `globalThis.Intl` (including `Intl` functionality required by Luxon)
- Behavioral differences: None observed beyond startup failure; all tested APIs are blocked before execution
- Blockers: Missing `Intl` prevents `cron-parser` from parsing expressions in wasm-rquickjs

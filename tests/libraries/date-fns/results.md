# date-fns Compatibility Test Results

**Package:** `date-fns`
**Version:** `4.1.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Date arithmetic and calendar helpers (`addDays`, `subMonths`, `differenceInCalendarDays`, `isWeekend`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-format-parse.js — Formatting and parsing APIs (`format`, `parse`, `isMatch`, `parseISO`, `parseJSON`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-intervals.js — Interval generation, overlap checks, and duration conversion
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-locales.js — Locale data and default options behavior (`fr`, `enUS`, `setDefaultOptions`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-intl.js — Intl-based helpers (`intlFormat`, `intlFormatDistance`)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` (thrown from `intlFormatDistance` at `bundle/script_module:1026:19`)
- **Root cause:** `intlFormatDistance` relies on `Intl.RelativeTimeFormat` behavior that is not fully available in the current wasm-rquickjs runtime.

## Summary

- Tests passed: 4/5
- Missing APIs: none in core `date-fns`; failure is in Intl-relative-time functionality used by `intlFormatDistance`
- Behavioral differences: `intlFormat` works, but `intlFormatDistance` crashes in wasm-rquickjs with `JavaScript error: not a function`
- Blockers: Applications relying on `intlFormatDistance` cannot run as-is; non-Intl and locale-object-based `date-fns` APIs tested here work

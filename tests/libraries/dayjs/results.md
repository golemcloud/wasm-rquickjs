# dayjs Compatibility Test Results

**Package:** `dayjs`
**Version:** `1.11.19`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Core parsing, arithmetic, and immutability
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-validation.js — Comparisons, diff, and invalid-date validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-duration-relative.js — `duration` and `relativeTime` plugins
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-parse-locale.js — `customParseFormat`, `localizedFormat`, and locale updates
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-timezone.js — `utc` + `timezone` conversion and timezone detection
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Expected values to be strictly equal: + actual - expected\n\n+ '2024-06-01 12:00'\n- '2024-06-01 21:00'`
- **Root cause:** `dayjs/plugin/timezone` conversion behavior differs in wasm-rquickjs; converting UTC time to `Asia/Tokyo` did not apply the expected offset in this runtime.

## Summary

- Tests passed: 4/5
- Missing APIs: none observed for core `dayjs` and non-timezone plugins covered here
- Behavioral differences: timezone conversion (`utc().tz(...)`) returned an unconverted local value in wasm-rquickjs
- Blockers: applications depending on accurate IANA timezone conversion via `dayjs/plugin/timezone` are partially incompatible

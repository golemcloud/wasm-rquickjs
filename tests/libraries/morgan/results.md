# Morgan Compatibility Test Results

**Package:** `morgan`
**Version:** `1.10.1`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — compile() renders core built-in tokens
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` during module initialization
- **Stack excerpt:** `at callSiteLocation (...)`, `at depd (...)`, `at requireMorgan (...)`
- **Root cause:** Dependency incompatibility in `depd` initialization path (`callSiteLocation`)

### test-02-customization.js — custom token and function format registration
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` during module initialization
- **Stack excerpt:** `at callSiteLocation (...)`, `at depd (...)`, `at requireMorgan (...)`
- **Root cause:** Dependency incompatibility in `depd` initialization path (`callSiteLocation`)

### test-03-middleware.js — immediate middleware logging and skip filtering
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` during module initialization
- **Stack excerpt:** `at callSiteLocation (...)`, `at depd (...)`, `at requireMorgan (...)`
- **Root cause:** Dependency incompatibility in `depd` initialization path (`callSiteLocation`)

### test-04-timing.js — response-time and total-time tokens
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` during module initialization
- **Stack excerpt:** `at callSiteLocation (...)`, `at depd (...)`, `at requireMorgan (...)`
- **Root cause:** Dependency incompatibility in `depd` initialization path (`callSiteLocation`)

### test-05-tokens.js — auth/header/date and core token behavior
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` during module initialization
- **Stack excerpt:** `at callSiteLocation (...)`, `at depd (...)`, `at requireMorgan (...)`
- **Root cause:** Dependency incompatibility in `depd` initialization path (`callSiteLocation`)

## Summary

- Tests passed in Node.js (bundled): 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: None isolated at API level (failure occurs before test logic executes)
- Behavioral differences: N/A (module fails during initialization)
- Blockers: `morgan` cannot initialize because dependency `depd` fails with `callSiteLocation` (`not a function`)

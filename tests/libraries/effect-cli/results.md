# Effect CLI Compatibility Test Results

**Package:** `@effect/cli`
**Version:** `0.74.0`
**Tested on:** 2026-03-18

## Test Results

### test-01-basic.js — command tree introspection and completion generation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-options.js — option aliases, defaults, repeats, and optional values
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-args-validation.js — positional argument parsing and invalid integer failure path
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-command-run.js — command handler execution and parse-failure signaling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-help-usage.js — help/usage rendering with built-in options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Offline tests passed: 5/5
- Integration tests passed: N/A — no Docker service applicable
- Live service tests passed: N/A — not a service client library
- Missing APIs: None observed
- Behavioral differences: None observed in tested command/args/options/help APIs
- Blockers: None

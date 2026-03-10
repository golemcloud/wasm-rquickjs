# yargs Compatibility Test Results

**Package:** `yargs`
**Version:** `18.0.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Basic options, aliases, and defaults
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `bundle/script_module:468:23` during module initialization
- **Root cause:** `yargs` transitively loads `string-width`, which executes `new Intl.Segmenter()` at module init; this constructor is unavailable in the runtime

### test-02-validation.js — Choices, demandOption, implies, check
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `bundle/script_module:468:23` during module initialization
- **Root cause:** Same startup failure before test logic executes

### test-03-commands.js — Command handlers and strict command validation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `bundle/script_module:468:23` during module initialization
- **Root cause:** Same startup failure before command parsing runs

### test-04-parser-config.js — Parser configuration behaviors
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `bundle/script_module:468:23` during module initialization
- **Root cause:** Same startup failure before parser configuration code runs

### test-05-middleware-coerce.js — Middleware, coerce, nargs, requiresArg
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: not a function` at `bundle/script_module:468:23` during module initialization
- **Root cause:** Same startup failure before middleware/coerce logic runs

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 on Node.js)
- Missing APIs: `Intl.Segmenter` constructor
- Behavioral differences: Library aborts during startup in wasm-rquickjs, so no yargs API surface is reachable
- Blockers: Runtime lacks an `Intl.Segmenter` implementation required by yargs dependencies

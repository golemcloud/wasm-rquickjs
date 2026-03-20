# ts-jest Compatibility Test Results

**Package:** `ts-jest`
**Version:** `29.4.6`
**Tested on:** 2026-03-20

## Test Results

### test-01-default-preset.js — createDefaultPreset returns ts-jest transform mapping
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `ENOENT: no such file or directory, open '/node_modules/ts-jest/.ts-jest-digest'`
- **Root cause:** `ts-jest` module initialization calls `fs.readFileSync` to read `.ts-jest-digest` from `node_modules`. The bundled code retains these filesystem reads, which fail in the WASM sandbox since no `node_modules` directory exists at runtime.

### test-02-esm-preset.js — createDefaultEsmPreset enables ESM transformer options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `ENOENT: no such file or directory, open '/node_modules/ts-jest/.ts-jest-digest'`
- **Root cause:** Same as test-01 — `ts-jest` initialization reads files from the filesystem during module load.

### test-03-transform-patterns.js — transform regex constants match expected file suffixes
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `ENOENT: no such file or directory, open '/node_modules/ts-jest/.ts-jest-digest'`
- **Root cause:** Same as test-01 — `ts-jest` initialization reads files from the filesystem during module load.

### test-04-babel-preset.js — createJsWithBabelPreset wires babel-jest and ts-jest transforms
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `ENOENT: no such file or directory, open '/node_modules/ts-jest/.ts-jest-digest'`
- **Root cause:** Same as test-01 — `ts-jest` initialization reads files from the filesystem during module load.

### test-05-options-forwarding.js — createDefaultPreset forwards ts-jest options into transform tuple
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `ENOENT: no such file or directory, open '/node_modules/ts-jest/.ts-jest-digest'`
- **Root cause:** Same as test-01 — `ts-jest` initialization reads files from the filesystem during module load.

## Summary

- Offline tests passed: 0/5
- Missing APIs: None (previous `inspector` module blocker is now resolved)
- Behavioral differences: `ts-jest` performs `fs.readFileSync` calls during module initialization to read `.ts-jest-digest` and other files from `node_modules/`. These paths don't exist in the WASM sandbox.
- Blockers: `ts-jest` cannot initialize because it requires filesystem access to its own `node_modules` directory at runtime. The `inspector` module issue from the previous test run (2026-03-09) is now fixed, but the library's reliance on runtime filesystem reads remains a blocker.

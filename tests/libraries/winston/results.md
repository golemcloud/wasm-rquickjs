# Winston Compatibility Test Results

**Package:** `winston`
**Version:** `3.19.0`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — basic logger writes to custom transport with level filtering
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-format-pipeline.js — format pipeline combines label, metadata, and JSON output
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-child-logger.js — child logger merges parent and child metadata
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-custom-levels.js — custom levels and `isLevelEnabled` behavior
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-timer-and-errors.js — profiler duration and error stack formatting
- **Node.js (bundled):** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed in Node.js (bundled): 5/5
- Tests passed in wasm-rquickjs: 5/5
- Missing APIs: None observed in tested scenarios
- Behavioral differences: None observed
- Blockers: None

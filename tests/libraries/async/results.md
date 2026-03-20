# async Compatibility Test Results

**Package:** `async`
**Version:** `3.2.6`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Collection transforms with `map`, `filter`, and `reduce`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-control-flow.js — Control-flow orchestration with `series`, `waterfall`, and `auto`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-queues.js — Concurrency primitives with `queue` and `cargo`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-retry-timeout.js — Retry and timeout behavior with `retry` and `timeout`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-memoize-reflect.js — Utility behavior with `memoize`, `unmemoize`, and `reflectAll`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5
- Missing APIs: none identified in tested async surface
- Behavioral differences: none observed between Node.js and wasm-rquickjs in these tests
- Blockers: none for tested async control-flow and utility APIs

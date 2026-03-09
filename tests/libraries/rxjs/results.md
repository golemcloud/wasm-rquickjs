# RxJS Compatibility Test Results

**Package:** `rxjs`
**Version:** `7.8.2`
**Tested on:** 2026-03-09

## Test Results

### test-01-basic.js — core transformation and filtering operators
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-subjects.js — Subject, BehaviorSubject, ReplaySubject, and AsyncSubject behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-errors.js — retry, catchError, and finalize handling
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-combination.js — combineLatest/zip/forkJoin and higher-order mapping operators
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-schedulers.js — virtual-time scheduling for interval/timer/debounceTime
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Untestable Features

The following RxJS features were not exercised because they require browser or external runtime integrations:

- **`ajax(...)`** — requires HTTP I/O endpoints and network interaction
- **`webSocket(...)`** — requires a live WebSocket endpoint
- **`fromEvent(...)` on DOM targets** — requires browser `EventTarget` APIs
- **`animationFrames(...)` / `animationFrameScheduler`** — requires `requestAnimationFrame`

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: none observed in tested surfaces
- Behavioral differences: none observed in tested surfaces
- Blockers: none for offline reactive APIs; browser/network-specific integrations remain unverified

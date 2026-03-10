# Ramda Compatibility Test Results

**Package:** `ramda`
**Version:** `0.32.0`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — Core `pipe` data transforms over collections
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-curry-placeholder.js — Currying, placeholders (`R.__`), and conditional combinators
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-lens-object.js — Lens-based updates and immutable object path operations
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-transduce-iterable.js — Transducers and iterable reduction (`Symbol.iterator` path)
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-equality-natural-sort.js — Deep equality on `Map`/`Set` and `ascendNatural` ordering
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `JavaScript error: Expected values to be strictly deep-equal` with wasm result `['item-1', 'item-10', 'item-2']` vs Node result `['item-1', 'item-2', 'item-10']`
- **Root cause:** `R.ascendNatural("en", ...)` relies on locale-aware/numeric collation behavior (`localeCompare`/Intl path); wasm-rquickjs produced lexicographic ordering for this case.

## Summary

- Tests passed: 4/5
- Missing APIs: none identified in tested Ramda surface
- Behavioral differences: natural sort collation differs for `ascendNatural` (`item-10` vs `item-2` ordering)
- Blockers: workloads that depend on locale-aware natural ordering may require a workaround

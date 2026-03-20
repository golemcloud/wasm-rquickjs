# msgpackr Compatibility Test Results

**Package:** `msgpackr`
**Version:** `1.11.8`
**Tested on:** 2026-03-20

## Test Results

### test-01-basic.js — basic pack/unpack and encode/decode aliases
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-02-packr-options.js — `Packr`/`Unpackr` with `useRecords` and float options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-extension.js — custom extension via `addExtension`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-04-structured-clone.js — cycle + shared reference + `Set` with `structuredClone`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-05-multi-and-iterators.js — `unpackMultiple`, `encodeIter`, and `decodeIter`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Summary

- Tests passed: 5/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: None
- Behavioral differences: None
- Blockers: None — all tests pass

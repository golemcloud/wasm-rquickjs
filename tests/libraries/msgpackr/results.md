# msgpackr Compatibility Test Results

**Package:** `msgpackr`
**Version:** `1.11.8`
**Tested on:** 2026-03-10

## Test Results

### test-01-basic.js — basic pack/unpack and encode/decode aliases
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Runtime initialization aborts while wiring built-in `node:fs`, before test code executes.

### test-02-packr-options.js — `Packr`/`Unpackr` with `useRecords` and float options
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same built-in wiring failure in `node:fs` prevents execution.

### test-03-extension.js — custom extension via `addExtension`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same built-in wiring failure in `node:fs` prevents execution.

### test-04-structured-clone.js — cycle + shared reference + `Set` with `structuredClone`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same built-in wiring failure in `node:fs` prevents execution.

### test-05-multi-and-iterators.js — `unpackMultiple`, `encodeIter`, and `decodeIter`
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish built-in wiring: JavaScript error: require is not defined` (`at getPromises (node:fs:25:9)`)
- **Root cause:** Same built-in wiring failure in `node:fs` prevents execution.

## Summary

- Tests passed: 0/5 in wasm-rquickjs (5/5 in Node.js)
- Missing APIs: No package-specific API gap identified; failure occurs before user code runs
- Behavioral differences: Runtime abort/trap during built-in initialization (`node:fs`)
- Blockers: Current startup path crashes in built-in `node:fs` wiring due to missing `require`

# Got Compatibility Test Results

**Package:** `got`
**Version:** `14.6.6`
**Tested on:** 2026-03-07
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — basic GET flow using a mocked transport
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-02-json.js — JSON parsing and resolveBodyOnly behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-03-http-errors.js — HTTPError behavior and throwHttpErrors override
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-04-context-hooks.js — context propagation through hooks
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

### test-05-instances.js — instance extension and defaults inheritance
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (wrapper build failed)
- **Error:** `libsqlite3-sys@0.36.0: sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: N/A (runtime execution was not reached)
- Behavioral differences: N/A (runtime execution was not reached)
- Blockers:
  - Wrapper crate compilation fails before any test runs.
  - Exact build failure: `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `fatal error: 'stdio.h' file not found` for `wasm32-wasip1`.

`got` itself bundles and works correctly on Node.js for the covered API surface (mocked transport, JSON parsing, HTTP error handling, hook context, instance extension). Compatibility in wasm-rquickjs could not be assessed because all generated wrapper crates failed to compile in `libsqlite3-sys`.

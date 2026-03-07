# Superagent Compatibility Test Results

**Package:** `superagent`
**Version:** `10.3.0`
**Tested on:** 2026-03-07

## Test Results

### test-01-basic.js — request builder supports headers, json body, and request snapshot
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails before running JS due `libsqlite3-sys` failing for target `wasm32-wasip1`

### test-02-query.js — query params are accumulated and sorted deterministically
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails before running JS due `libsqlite3-sys` failing for target `wasm32-wasip1`

### test-03-auth-timeout-retry.js — auth, timeout options, and retry policy are configured correctly
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails before running JS due `libsqlite3-sys` failing for target `wasm32-wasip1`

### test-04-plugin-ok.js — plugins can mutate requests and custom ok() predicate is applied
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails before running JS due `libsqlite3-sys` failing for target `wasm32-wasip1`

### test-05-agent.js — agent defaults are inherited by subsequent requests
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `error: failed to run custom build command for 'libsqlite3-sys v0.36.0'` with `sqlite3/sqlite3.c:15244:10: fatal error: 'stdio.h' file not found`
- **Root cause:** Wrapper crate compilation fails before running JS due `libsqlite3-sys` failing for target `wasm32-wasip1`

## Summary

- Tests passed in Node.js: 5/5
- Tests passed in wasm-rquickjs: 0/5
- Missing APIs: None observed (runtime execution did not start)
- Behavioral differences: Not observable (runtime execution did not start)
- Blockers:
  - `cargo-component build` fails in generated wrapper crates due `libsqlite3-sys` C compilation error on `wasm32-wasip1`
  - No `.wasm` artifact is produced, so `wasmtime run --invoke 'run()'` cannot execute

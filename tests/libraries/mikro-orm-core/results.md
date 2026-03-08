# MikroORM Core Compatibility Test Results

**Package:** `@mikro-orm/core`
**Version:** `6.6.9`
**Tested on:** 2026-03-08
**Bundler:** Rollup (with `@rollup/plugin-commonjs` + `@rollup/plugin-node-resolve`)

## Test Results

### test-01-basic.js — Utils merge/asArray/equals/hash behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: Error resolving module 'constants' from 'bundle/script_module'`
- **Root cause:** The bundled module graph imports bare `constants`, but the runtime cannot resolve that module at startup.

### test-02-entity-schema.js — EntitySchema metadata and constraints
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: Error resolving module 'constants' from 'bundle/script_module'`
- **Root cause:** Same unresolved bare `constants` import during module initialization.

### test-03-naming-strategies.js — EntityCase and Underscore naming strategy behavior
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: Error resolving module 'constants' from 'bundle/script_module'`
- **Root cause:** Same unresolved bare `constants` import during module initialization.

### test-04-cache-fragment.js — MemoryCacheAdapter and raw fragment creation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: Error resolving module 'constants' from 'bundle/script_module'`
- **Root cause:** Same unresolved bare `constants` import during module initialization.

### test-05-contexts.js — RequestContext and TransactionContext state propagation
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL (runtime initialization)
- **Error:** `JavaScript error: Error resolving module 'constants' from 'bundle/script_module'`
- **Root cause:** Same unresolved bare `constants` import during module initialization.

## Summary

- Tests passed on Node.js: 5/5
- Tests passed on wasm-rquickjs: 0/5
- Missing APIs: `constants` module resolution for bare import `constants`
- Behavioral differences: N/A (tests do not reach execution due init failure)
- Blockers: All generated components compile, but every `wasmtime run` fails before `run()` executes because module initialization cannot resolve `constants`.

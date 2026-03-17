# GenKit Core Compatibility Test Results

**Package:** `@genkit-ai/core`
**Version:** `1.30.1`
**Tested on:** 2026-03-17

## Test Results

### test-01-actions-flows.js — action() and flow() execute typed handlers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: not a function` (stack includes `callSiteLocation` → `depd` → `requireBodyParser` → `requireExpress` → `requireReflection`)
- **Root cause:** Importing `@genkit-ai/core` pulls in the Reflection/Express dependency path during bundle initialization, and the `depd` call-site helper crashes in wasm-rquickjs.

### test-02-schema-validation.js — schema validation and parsing
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-03-registry-plugin.js — Registry plugin/action/value APIs
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: not a function` (stack includes `callSiteLocation` → `depd` → `requireBodyParser` → `requireExpress` → `requireReflection`)
- **Root cause:** Same module-initialization failure on the Reflection/Express import path.

### test-04-streaming.js — action stream() chunking and final output
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: not a function` (stack includes `callSiteLocation` → `depd` → `requireBodyParser` → `requireExpress` → `requireReflection`)
- **Root cause:** Same module-initialization failure on the Reflection/Express import path.

### test-05-context-errors.js — context propagation and error helpers
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Failed to finish module initialization: JavaScript error: not a function` (stack includes `callSiteLocation` → `depd` → `requireBodyParser` → `requireExpress` → `requireReflection`)
- **Root cause:** Same module-initialization failure on the Reflection/Express import path.

## Summary

- Offline tests passed: 1/5 in wasm-rquickjs (5/5 in Node.js)
- Integration tests passed: N/A — no Docker-hosted service applicable
- Live service tests passed: N/A — not a service-client library requiring API credentials
- Behavioral differences / blockers:
  - Package-level initialization path for `@genkit-ai/core` is blocked in wasm-rquickjs by the Reflection/Express dependency chain (`depd` call-site failure)
  - Schema-only subpath import (`@genkit-ai/core/schema`) works in wasm-rquickjs for pure validation/parsing use cases

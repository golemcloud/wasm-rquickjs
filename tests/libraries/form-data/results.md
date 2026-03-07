# form-data Compatibility Test Results

**Package:** `form-data`
**Version:** `4.0.1`
**Tested on:** 2026-03-07

## Test Results

### test-01-basic.js — Basic construction, append, getBoundary, getHeaders
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Dynamic require of "util" is not supported`
- **Root cause:** CJS library requires Node built-ins at module init time, before `globalThis.require` is available

### test-02-buffer.js — Buffer append and getBuffer serialization
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Dynamic require of "util" is not supported`
- **Root cause:** Same as test-01

### test-03-length.js — hasKnownLength and getLengthSync
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Dynamic require of "util" is not supported`
- **Root cause:** Same as test-01

### test-04-boundary.js — setBoundary, custom boundary, header merging
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Dynamic require of "util" is not supported`
- **Root cause:** Same as test-01

### test-05-multipart-format.js — Multipart format structure verification
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `Dynamic require of "util" is not supported`
- **Root cause:** Same as test-01

## Summary

- Tests passed: 0/5
- **Blocker:** CJS module initialization order issue

### Root Cause Analysis

The `form-data` library is a CommonJS package that `require()`s Node built-ins (`util`, `stream`, `path`, `http`, `https`, `url`, `fs`, `crypto`) at the **top level** during module initialization.

When bundled with esbuild in ESM format (`--format=esm`), the library's `require()` calls are preserved through esbuild's `__require` shim. This shim checks `typeof require !== "undefined"` to decide whether to use the native `require` or throw an error.

In the wasm-rquickjs runtime, `globalThis.require` is set up by the "wiring" script that runs in the init module. However, due to ES module evaluation order, the user module (containing the bundled library) is evaluated **before** the init module's body executes. This means:

1. Init module starts loading → its `import * as userModule from '...'` triggers user module evaluation
2. User module evaluates → `__require` IIFE runs → `typeof require === "undefined"` → creates Proxy fallback
3. Top-level `require_form_data()` calls trigger `__require("util")` → Proxy delegates to target function → throws "Dynamic require not supported"
4. Init module body (wiring) never gets to run

This affects **any CJS library that `require()`s Node built-ins at the top level** when bundled for ESM output. Libraries that are pure ESM or don't depend on Node built-ins (like `zod`) are not affected.

### Potential Fix (not implemented — documentation only)

The runtime could set up `globalThis.require` before evaluating user modules, either by:
- Registering `require` as a global in the QuickJS context before module loading
- Using a separate evaluation phase for the wiring script before importing user modules

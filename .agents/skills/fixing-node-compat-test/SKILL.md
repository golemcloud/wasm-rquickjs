---
name: fixing-node-compat-test
description: "Fixes failing Node.js compatibility tests in the node_compat suite. Use when asked to make a node_compat test pass, unskip a test, fix a test-crypto/test-path/test-* failure, or implement missing Node.js API behavior to satisfy a vendored test."
---

# Fixing a Node.js Compatibility Test

Step-by-step workflow for making a vendored Node.js test pass in `tests/node_compat/`.

## Overview

The `node_compat` test suite contains 800+ vendored Node.js tests (from v22.14.0) that verify our Node.js API compatibility. Tests are controlled by `tests/node_compat/config.jsonc`. The goal is always to make the vendored test pass **without modifying it**.

## Workflow

### Step 1: Read the vendored test

Read the test file in `tests/node_compat/suite/` (e.g., `tests/node_compat/suite/parallel/test-crypto-hmac.js`). Understand:
- Which APIs it exercises
- What error codes/messages it expects (exact strings matter!)
- What argument validation order it assumes
- Whether it uses `common` helpers (check `tests/node_compat/common-shim/`)

**NEVER modify vendored test files** in `tests/node_compat/suite/`. These are upstream Node.js tests and must remain unmodified.

### Step 2: Check current config status

Look at `tests/node_compat/config.jsonc` to see if the test is listed and whether it has `"skip": true`.

### Step 3: Research Node.js v22 behavior

When the test expects specific behavior you're unsure about, research the exact Node.js v22 semantics. Pay attention to:
- **Error fidelity**: Tests check exact `code` (e.g., `ERR_INVALID_ARG_TYPE`), `name`, `message`, and sometimes `library` properties
- **Validation order**: Tests may assert errors are thrown in a specific order (e.g., `digest` validated before `ikm`)
- **Argument names in errors**: Error messages must reference the exact argument name from upstream (e.g., `"hmac"` not `"algorithm"`)
- **Behavioral subtleties**: e.g., `Hash.digest()` throws on repeat calls, but `Hmac.digest()` returns empty buffer

### Step 4: Implement the fix

Fixes typically go in the **skeleton built-in modules** under `crates/wasm-rquickjs/skeleton/src/builtin/`:

- **JS wrapper** (e.g., `web-crypto.js`): Handles argument validation, error throwing, state management, API surface
- **Rust native module** (e.g., `web_crypto.rs`): Handles performance-critical operations, crypto primitives, system calls

Follow the hybrid native+JS pattern:
- All argument validation and Node.js-style error throwing happens in JavaScript
- Heavy computation (crypto, compression, etc.) delegates to Rust via `import { ... } from '__wasm_rquickjs_builtin/<name>_native'`
- JS must import using **original Rust `snake_case` names** — the `rename` attribute on `#[rquickjs::module]` does NOT affect JS imports
- When Rust returns `u32`, apply `>>> 0` in JS to recover unsigned values

If the test uses `common` helpers, check the shims in `tests/node_compat/common-shim/`. You may need to update shims (e.g., `crypto.js`, `index.js`) but never the vendored test itself.

### Step 5: Build and test

```bash
# 1. Clean skeleton build artifacts (MANDATORY before testing)
./cleanup-skeleton.sh

# 2. Run ONLY the specific test, save output
cargo test --test node_compat parallel__test_crypto_hmac_js -- --nocapture 2>&1 | tee /tmp/test-output.txt

# 3. Check the output file for results instead of re-running
grep -E "(PASS|FAIL|ok |FAILED)" /tmp/test-output.txt
```

**Test name format**: `parallel__test_<name>_js` (replace `-` with `_` and `.` with `_`).

### Step 6: Regression check

Run the broader module test suite to ensure no regressions:

```bash
cargo test --test node_compat parallel__test_crypto -- --nocapture 2>&1 | tee /tmp/test-regression.txt
```

### Step 7: Update config.jsonc

If the test was skipped, remove `"skip": true` (and `"reason"`) from its entry. If it wasn't listed, add it:

```jsonc
"parallel/test-crypto-hmac.js": {},
```

### Step 8: Update README.md

If you implemented a new API or significant new functionality, update the supported APIs list in `README.md`.

## Common Pitfalls

### `instanceof` across contexts
If a test does `value instanceof SomeClass` and it fails, the class constructor may differ between the global scope and the module export. Ensure constructors are wired to `globalThis` via `WIRE_JS` in the Rust module or set in `common-shim/index.js`.

### WASM performance limits
Crypto operations are slower in WASM/QuickJS. If a test times out:
- Add caching for repeated key parsing operations
- Reorder parsing logic to try fast native paths before JS fallbacks
- Add "fail-fast" checks to avoid slow fallback paths for invalid inputs

### Error message matching
Node.js tests use `assert.throws` with exact message matchers. Always verify:
- The error `code` property (e.g., `'ERR_INVALID_ARG_TYPE'`)
- The error `name` (e.g., `'TypeError'`)
- The error message string (argument names, value descriptions)
- Sometimes `err.library` or other custom properties

### Common shim helpers
Tests `require('../common')` which resolves to `tests/node_compat/common-shim/index.js`. Key helpers:
- `common.hasOpenSSL3` — gates legacy algorithm tests
- `common.hasCrypto` — gates crypto tests
- `common.mustCall()` / `common.mustNotCall()` — assertion wrappers
- `common.expectsError()` — structured error assertion

### Adding new Rust dependencies
If you need a new crate in the skeleton, add it to `crates/wasm-rquickjs/skeleton/Cargo.toml_` with `default-features = false`. Use pure-Rust backends to ensure `wasm32-wasip2` compatibility.

### No platform-conditional code
The skeleton is **always compiled to `wasm32-wasip1`**. Never write conditional code that checks for unix/windows/macOS or any other host platform (e.g., `#[cfg(unix)]`, `#[cfg(windows)]`, `#[cfg(target_os = "...")]`, `process.platform === "win32"`, `path.sep === "\\"`, etc.). Such checks are meaningless in the WASM target and add dead code complexity.

### No localhost side-channels for node:http
**NEVER introduce side-channels that pass metadata between the HTTP server and client based on localhost detection.** The `wasi:http` protocol has inherent limitations (e.g., no status message, no HTTP version, no raw headers beyond what the protocol exposes). These are real limitations that affect all users. Do NOT work around them by:
- Intercepting socket writes to capture HTTP response metadata (status messages, raw headers, connection headers)
- Storing captured metadata in global queues keyed by port number (e.g., `globalThis.__wasm_rquickjs_*`)
- Checking whether the hostname is localhost/127.0.0.1 to selectively apply captured metadata

Such tricks make localhost-based vendored tests pass while hiding real behavior gaps that users will hit with non-localhost hosts. If a test fails because it relies on HTTP features that `wasi:http` cannot provide, **mark the test as skipped** in `config.jsonc` with `"skip": true` and `"reason": "wasi:http does not expose <feature>"` rather than faking the behavior.

---
name: cleaning-up-builtin-module
description: "Cleans up and refactors a Node.js-compatible built-in module for improved code quality. Use when asked to clean up, simplify, refactor, or improve the coding style of an existing built-in module (e.g., node:buffer, node:path, node:crypto)."
---

# Cleaning Up a Built-in Module

Step-by-step workflow for analysing, simplifying, and refactoring an existing built-in module while preserving all test coverage.

## Overview

Each built-in module consists of up to three parts:
- **Rust native bridge**: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.rs`
- **JS wrapper**: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.js`
- **Internal helpers** (optional): files in `crates/wasm-rquickjs/skeleton/src/builtin/internal/` that the module imports

The goal is to improve code quality — simplification, dead code removal, clearer naming, better structure, modern JS patterns — without changing observable behavior. The cleanup is **best-effort** — apply everything that passes tests. You may run the cleanup on the same module multiple times.

**Important**: Some files in `builtin/` are **vendored third-party libraries** (e.g., `ieee754.js`, `base64.js`, `fetch-blob-4.0.0.js`, `formdata-polyfill-4.0.10.js`, `web-streams-polyfill-4.1.0.js`). **NEVER clean up or modify vendored third-party JS files** — only clean up our own wrappers and native bridges.

Some modules are **JS-only** — their `.rs` file contains only `include_str!`, re-export constants, and no native bridge. This is fine. If the cleanup reveals that moving logic to a Rust native bridge would improve the module, you may convert a JS-only module to a Rust+JS pair by creating the native bridge following the patterns in the `adding-builtin-module` skill.

## Workflow

### Step 1: Identify the module and its files

Determine which module to clean up (e.g., `buffer`). Locate all its files:

1. **Rust file**: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.rs`
2. **JS file**: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.js`
3. **Registration in mod.rs**: `crates/wasm-rquickjs/skeleton/src/builtin/mod.rs` — look for the module's entries in `add_module_resolvers`, `module_loader`, and `wire_builtins`
4. **Internal helpers**: Check imports in the JS file for `__wasm_rquickjs_builtin/internal/*` paths and read those files too — these are **in scope** for cleanup if improvements are found, but must be validated carefully since they are shared across modules (run tests for all modules that import the changed helper)
5. **Runtime tests**: `tests/runtime/<name>.rs` — our own functional tests
6. **Node-compat tests**: Search `tests/node_compat/config.jsonc` for entries matching the module name (e.g., `test-buffer-*`, `test-path-*`)
7. **Example project**: Check `examples/runtime/` for an example that exercises this module

### Step 2: Establish the green baseline

Before making any changes, verify all relevant tests pass:

```bash
# 1. Clean skeleton build artifacts (MANDATORY)
./cleanup-skeleton.sh

# 2. Run our runtime tests for this module
cargo test --test runtime <name> -- --nocapture 2>&1 | tee /tmp/cleanup-baseline-runtime.txt

# 3. Run node_compat tests for this module
cargo test --test node_compat parallel__test_<name> -- --nocapture 2>&1 | tee /tmp/cleanup-baseline-compat.txt
```

Save the baseline output. All tests must pass before proceeding. If any tests are already failing, note them and exclude them from your pass/fail tracking.

### Step 3: Study the upstream Node.js implementation

Use the **librarian** to read the corresponding module's implementation in the official Node.js repository (`github.com/nodejs/node`, branch `v22.x`, under `lib/`). This matches the v22.14.0 version our node_compat tests are vendored from. For example:
- `node:buffer` → `lib/buffer.js` (and possibly `lib/internal/buffer.js`)
- `node:path` → `lib/path.js`
- `node:crypto` → `lib/crypto.js` + `lib/internal/crypto/`
- `node:stream` → `lib/stream.js` + `lib/internal/streams/`
- `node:url` → `lib/url.js` + `lib/internal/url.js`
- `node:util` → `lib/util.js` + `lib/internal/util/`
- `node:events` → `lib/events.js`

Ask the librarian to explain the module's structure, key design patterns, and how specific functions are implemented.

Compare the upstream implementation against our JS wrapper. Look for:
- **Algorithmic improvements**: Does Node.js use a cleaner or more efficient algorithm for the same operation? If so, adopting it may simplify our code.
- **Structural patterns**: Does Node.js organize the code in a way that's clearer (e.g., helper extraction, early returns, validation ordering)?
- **Idiomatic patterns**: Does Node.js use modern JS features (classes, destructuring, `??`, `?.`) that we could adopt to reduce verbosity?
- **Dead code confirmation**: If our implementation has code that doesn't exist in upstream Node.js and isn't needed for compatibility, it's likely dead code.

**Important**: Only adopt upstream patterns when they lead to **simpler, cleaner code** in our context. Do NOT blindly copy Node.js internals — our environment (QuickJS + WASM) has different constraints. Specifically:
- Node.js uses V8 intrinsics and C++ bindings we cannot use
- Node.js has internal modules (`lib/internal/`) that we may not need
- Some Node.js patterns are complex due to backward compatibility concerns that don't apply to us

Note which upstream patterns are worth adopting and include them in the list of candidate improvements for Step 4.

### Step 4: Analyse the code with the oracle

Read the full Rust and JS source files. Then consult the oracle for a thorough code review, providing the upstream Node.js insights from Step 3 as additional context. Ask the oracle to identify:

- **Dead code**: Functions, variables, or branches that are never reachable
- **Unnecessary complexity**: Overly verbose patterns that can be simplified
- **Redundant compatibility shims**: Browser-oriented polyfills that don't apply in our QuickJS/WASM environment (e.g., `typeof SharedArrayBuffer !== 'undefined'` guards when we always have it)
- **Style improvements**: Inconsistent naming, missing `const`/`let`, old-style `var` usage, unnecessary `this` binding patterns
- **Structural improvements**: Functions that could be inlined, code that could be deduplicated, overly deep nesting
- **Modern JS patterns**: Arrow functions where appropriate, destructuring, template literals
- **Rust improvements**: Clippy suggestions, unnecessary `clone()`, better error handling patterns
- **Native ↔ JS boundary shifts**: Opportunities to move logic between the Rust native bridge and the JS wrapper (see "Moving Logic Between Rust and JS" below)
- **WIRE_JS minimization**: Check if logic in the module's `WIRE_JS` snippet can be moved into the JS wrapper module itself, leaving WIRE_JS as a minimal import-and-assign-to-globalThis (see "Minimizing WIRE_JS" below)
- **Test-cheating workarounds**: Code whose sole purpose is to make vendored node_compat tests pass without providing value to real users. This applies to ALL modules, not just HTTP — look for hardcoded return values, stub implementations that fake success, feature-detection lies, test-pattern branching, global side-channels, and platform capability fabrication (see "Detecting Test-Cheating Workarounds" below for the full checklist)

**Important constraints to tell the oracle**:
- The module's **observable behavior must not change** — all existing tests must continue to pass
- Do not suggest changes that would affect **error messages, error codes, or validation order** — node_compat tests are strict about these
- Do not suggest removing **exported symbols** — downstream code may depend on them
- Focus on **internal implementation quality**, not API surface changes

### Step 5: Triage the suggestions

Review the oracle's suggestions and classify each as:

1. **Safe**: Pure internal cleanup with zero risk of behavior change (e.g., removing dead code, renaming internal variables, simplifying control flow)
2. **Low risk**: Changes that simplify logic but touch code paths that are tested (e.g., collapsing redundant branches)
3. **Medium risk**: Structural changes that reorganize how code flows (e.g., extracting/inlining functions, reordering operations)
4. **Skip**: Changes that are too risky or would alter observable behavior

### Step 6: Verify against test-cheating workarounds

**This step applies to EVERY module, not just HTTP-related ones.** Before applying any other improvements, scan the module for test-cheating code (see "Detecting Test-Cheating Workarounds" below). This is a separate, mandatory step — not just an item on the oracle's checklist — because cheating code must be removed regardless of risk category.

"Test-cheating" means **any code whose primary purpose is making vendored node_compat tests pass rather than providing genuine functionality to real users**. This can appear in any module — `buffer`, `crypto`, `path`, `util`, `stream`, etc. — not just networking modules.

1. Read through the module's JS and Rust code looking for the red flags listed in "Detecting Test-Cheating Workarounds"
2. If cheating code is found:
   a. **Document it** — describe what the workaround does and why it's problematic
   b. **Remove it entirely** — the module must use the same code path for all inputs
   c. **Run the full test suite for the module** (runtime + node_compat)
   d. **For any newly failing node_compat tests**: mark them as `"skip": true` in `config.jsonc` with an explicit `"reason"` explaining the platform limitation (e.g., `"reason": "QuickJS does not support this V8-specific behavior"`)
   e. **Never re-introduce the cheat** — a skipped test with a clear reason is always preferable to faked behavior
3. If no cheating code is found, proceed to Step 7

This step takes priority over all other cleanup work. Cheating code is a correctness issue, not a style issue.

### Step 7: Apply improvements incrementally

Apply changes **one category at a time**, starting with the safest:

#### For each improvement:

1. Make the change
2. Clean and test:
   ```bash
   ./cleanup-skeleton.sh
   cargo test --test runtime <name> -- --nocapture 2>&1 | tee /tmp/cleanup-step-N.txt
   cargo test --test node_compat parallel__test_<name> -- --nocapture 2>&1 | tee /tmp/cleanup-compat-step-N.txt
   ```
3. If tests pass → continue to the next improvement
4. If tests fail → **revert the change immediately** and move on

**Group related safe changes** (e.g., all dead code removals) into a single batch if they don't interact. But keep distinct logical changes separate so failures can be isolated.

### Step 8: Run Clippy and format

After all improvements are applied:

```bash
cargo fmt
cargo clippy -- -Dwarnings
```

Fix any issues introduced by the changes.

### Step 9: Cross-module regression check

Run tests for **other modules** that might be affected. Choose modules that:
- Import from or depend on the cleaned-up module
- Share internal helpers with it
- Use similar patterns (e.g., if you cleaned up `buffer`, also test `string_decoder`, `fs`, `crypto`, `stream`)

```bash
# Run a selection of related module tests
./cleanup-skeleton.sh
cargo test --test runtime <related_module_1> -- --nocapture 2>&1 | tee /tmp/cleanup-regression-1.txt
cargo test --test runtime <related_module_2> -- --nocapture 2>&1 | tee /tmp/cleanup-regression-2.txt

# Run some related node_compat tests
cargo test --test node_compat parallel__test_<related> -- --nocapture 2>&1 | tee /tmp/cleanup-regression-compat.txt
```

**Common cross-module dependencies to check**:
| Module cleaned | Also test |
|---|---|
| `buffer` | `string_decoder`, `crypto`, `fs`, `stream`, `encoding` |
| `stream` | `fs`, `http`, `crypto`, `zlib` |
| `path` | `fs`, `url`, `module` |
| `crypto` / `web-crypto` | `buffer`, `stream`, `https`, `tls` |
| `events` | `stream`, `http`, `fs`, `process` |
| `url` | `path`, `http`, `https`, `querystring` |
| `util` | nearly everything — test broadly |
| `encoding` | `buffer`, `string_decoder`, `fs` |

### Step 10: Handle regressions

If cross-module tests fail:

1. Identify which specific improvement caused the regression
2. Revert that specific change
3. Re-run the failing tests to confirm the revert fixes them
4. Keep all other improvements that didn't cause regressions

If you cannot isolate the cause:
1. Use binary search — revert half the changes, test, narrow down
2. As a last resort, revert all changes and retry with only the safe category

### Step 11: Final verification

Run the full set of tests one more time to confirm the final state is clean:

```bash
./cleanup-skeleton.sh
cargo test --test runtime <name> -- --nocapture 2>&1 | tee /tmp/cleanup-final-runtime.txt
cargo test --test node_compat parallel__test_<name> -- --nocapture 2>&1 | tee /tmp/cleanup-final-compat.txt
cargo fmt -- --check
cargo clippy -- -Dwarnings
```

## Common Cleanup Patterns

### JS/Rust: Remove platform-conditional code
The skeleton is **always compiled to `wasm32-wasip1`**. Never write conditional code that checks for unix/windows/macOS or any other host platform (e.g., `#[cfg(unix)]`, `#[cfg(windows)]`, `#[cfg(target_os = "...")]`, `process.platform === "win32"`, `path.sep === "\\"`, etc.). Such checks are meaningless in the WASM target and add dead code complexity. If existing code has these, remove them as part of cleanup.

### JS: Remove browser-only guards
Our environment is QuickJS compiled to WASM — we always have `Uint8Array`, `ArrayBuffer`, `Symbol`, typed array support, etc. Guards like `typeof Uint8Array !== 'undefined'` or `Buffer.TYPED_ARRAY_SUPPORT` checks can often be simplified.

### JS: Replace `var` with `const`/`let`
Use `const` by default, `let` only when reassignment is needed. Never use `var`.

### JS: Simplify prototype-based patterns
If the codebase uses function constructors with `prototype` assignments that could be expressed more clearly with classes or simpler patterns, consider it — but only if the prototype chain behavior is preserved.

### Rust: Remove unnecessary `.clone()`
Check for clones that can be replaced with references or moves.

### Rust: Use `?` operator
Replace `match result { Ok(v) => v, Err(e) => return Err(e) }` with `result?`.

### JS: Remove unused imports/exports
If an internal function or import is not used anywhere, remove it. But **never remove public exports** from the module's API surface.

### Minimizing WIRE_JS

`WIRE_JS` snippets run at module load time and wire things onto `globalThis`. They are **embedded as Rust string literals** in the `.rs` file, making them hard to read, edit, and review. The goal is to keep WIRE_JS as **small as possible** — ideally just an import and a `globalThis` assignment:

```js
import { default as __x } from '__wasm_rquickjs_builtin/mymodule';
globalThis.myGlobal = __x;
```

**How to minimize**:
1. **Move helper functions** out of WIRE_JS and into the module's `.js` file. WIRE_JS should not define functions — those belong in the importable module.
2. **Move object construction** into the `.js` file's `default` export. If WIRE_JS builds an object by iterating over exports, wrapping methods, or adding properties, do that work inside the `.js` module and export the finished object as `default`.
3. **Move lazy getters/setters** into the `.js` file. Getters that reference `globalThis.process` or other globals work fine in the `.js` module because they resolve at access time, not definition time.

**Constraints**:
- Changes to WIRE_JS affect global state at startup and can break **any** module — treat as **high-risk** and test broadly after any change (not just the module being cleaned up).
- The resulting `globalThis` object must have the exact same property descriptors (enumerable, configurable, writable), method `.name` values, and prototype chain as before.
- If WIRE_JS does something that genuinely requires running *after* the module is imported (e.g., reading from another global that's set by a different WIRE_JS), it cannot be moved into the `.js` file and must stay in WIRE_JS.

### Detecting Test-Cheating Workarounds

**This section applies to ALL modules, not just HTTP.** Verify that the module implementation does not **cheat** to pass vendored node_compat tests. "Cheating" means any code whose sole purpose is making test cases pass, with no actual value for real users. These workarounds produce **asymmetric behavior** — tests see one code path while real-world usage hits a different, inferior one.

The core question to ask about any suspicious code: **"Would this code path ever execute for a real user, or does it only exist because a vendored test expects it?"** If the answer is the latter, it's cheating.

**General red flags to look for in ANY module**:
- **Hardcoded return values**: Functions that return specific values that happen to match what tests expect, instead of computing the result properly (e.g., returning a hardcoded string for an unimplemented operation instead of throwing)
- **Stub implementations that fake success**: Methods that silently succeed (return `0`, return `true`, return empty string) instead of being properly unimplemented — making tests pass while real callers get silently wrong results
- **Feature detection that always lies**: Code that reports a capability as available when it isn't actually implemented (e.g., reporting a cipher as supported when `getCiphers()` just returns a static list but the cipher doesn't actually work)
- **Special-case branching for test patterns**: Conditional logic that checks for patterns only found in test inputs (specific values, sizes, strings used by tests) and returns fabricated results for those specific inputs
- **Global side-channels**: Global variables (e.g., `globalThis.__wasm_rquickjs_*`) used to pass data between components in a way that only works in the test environment (same-process) but not in real deployments
- **Platform capability fabrication**: Code that fakes platform features our runtime doesn't support (e.g., pretending to support `process.getuid()` by returning `0`, pretending to support signals, faking file descriptors)

**HTTP-specific red flags** (for `node:http`, `node:https`, and related modules):
- **Loopback/localhost detection**: Code that checks whether a request targets `localhost`, `127.0.0.1`, or `::1` and takes a special path (e.g., bypassing `wasi:http` with a direct socket connection)
- **Metadata fabrication**: Capturing HTTP metadata (status messages, raw headers, HTTP version) from one side of a connection and injecting it into the other side to simulate features the underlying transport doesn't support

**What to do when you find cheating code**:
1. **Report it** — document what the workaround does and why it's problematic
2. **Remove it** — delete the workaround entirely; the module should use the same code path for all inputs
3. **Accept test failures** — if removing the workaround causes vendored node_compat tests to fail because they rely on features the platform genuinely cannot provide, **mark those tests as skipped** in `config.jsonc` with an explicit reason (e.g., `"reason": "QuickJS does not support this V8-specific behavior"`, `"reason": "wasi:http does not expose status messages"`, `"reason": "WASI does not provide OS user/group APIs"`)
4. **Never re-introduce the cheat** — the correct response to a platform limitation is to skip the test, not to fake the behavior

### Moving logic between Rust and JS

As part of the cleanup you may move logic between the native Rust bridge and the JS wrapper. This is a tradeoff between **runtime performance** and **simplicity of expressing idiomatic JS patterns**.

**Moving from JS → Rust** (prefer when):
- The logic is **computationally intensive** (loops over large buffers, encoding/decoding, hashing, compression)
- The JS version is awkwardly reimplementing something Rust does natively (e.g., byte manipulation, bitwise operations on large data)
- The code has no dependency on JS-specific semantics (prototypes, closures, `this` binding)

**Moving from Rust → JS** (prefer when):
- The logic is **API surface glue**: argument validation, error construction, option normalization, default values
- The Rust code is fighting `rquickjs` bindings to express something trivial in JS (e.g., building complex objects, working with JS classes/prototypes, variadic arguments)
- The logic involves **Node.js-style error throwing** with specific `code`, `message`, and `name` properties — this is far more natural in JS using the shared error constructors from `__wasm_rquickjs_builtin/internal/errors`
- The code is a thin wrapper that just shuffles values between JS and a lower-level Rust function — eliminate the middle layer

**Guidelines for boundary shifts**:
1. **Classify as medium risk** in the triage step — these changes affect the FFI boundary and can introduce subtle issues
2. When moving to Rust, add the new function to the existing `#[rquickjs::module]` block and update the JS `import` statement. Remember: JS must import using **original Rust `snake_case` names**, not renamed versions
3. When moving to JS, remove the Rust function (or keep it if other code uses it) and implement in the JS wrapper. If the Rust function was the only export, consider whether the native module is still needed
4. When moving to Rust, remember that `u32` values may arrive in JS as signed — apply `>>> 0` if needed
5. **Always test immediately after each boundary shift** — these are the changes most likely to introduce regressions
6. Keep the boundary clean: Rust handles **data processing**, JS handles **API shape and Node.js compatibility semantics**
7. **`WIRE_JS` snippets** should be kept as minimal as possible — they run at module load time and wire things to `globalThis`. If you can reduce or simplify a `WIRE_JS` snippet during cleanup, do so. But changes to `WIRE_JS` affect global state and can break any module — treat them as high-risk and test broadly after any change

## Critical Rules

1. **NEVER modify vendored test files** in `tests/node_compat/suite/`
2. **ALWAYS run `./cleanup-skeleton.sh`** before any test run
3. **ALWAYS save test output** to files for analysis without re-running
4. **NEVER run `cargo test` without a filter** — always scope to the relevant module
5. **Revert on failure** — if a change breaks tests, revert it immediately rather than trying to "fix forward"
6. **Preserve all exported symbols** — the module's public API must not change
7. **Preserve error fidelity** — error codes, messages, and validation order must remain identical
8. **NEVER modify vendored third-party JS files** in `builtin/` (e.g., `ieee754.js`, `base64.js`, `fetch-blob-*.js`, `formdata-polyfill-*.js`, `web-streams-polyfill-*.js`)
9. **NEVER allow test-cheating workarounds** — code that exists solely to make vendored tests pass (e.g., loopback side-channels, localhost-only special paths, metadata fabrication between client and server) must be removed. If a platform limitation means a test cannot pass honestly, skip the test with an explicit reason rather than faking the behavior

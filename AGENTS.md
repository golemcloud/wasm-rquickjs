# AGENTS.md - wasm-rquickjs Development Guide

## Project Overview

**wasm-rquickjs** is a command-line tool and library that wraps JavaScript code into WebAssembly Components using the QuickJS engine. The tool generates self-contained Rust crates that compile to WASM components.

## Project Structure

```
wasm-rquickjs/
├── crates/
│   ├── wasm-rquickjs/          # Main library crate
│   │   ├── skeleton/           # Embedded skeleton crate (separate project)
│   │   └── src/
│   └── wasi-logging/           # WASI logging support crate
├── examples/
│   ├── runtime/                # Examples used by runtime tests
│   └── compilation/            # Examples only tested via compilation
├── src/                        # CLI binary source (main.rs)
├── tests/                      # Integration tests
├── Cargo.toml                  # Workspace root
├── cleanup-skeleton.sh         # Script to clean skeleton build artifacts
└── README.md                   # Main documentation
```

## Skeleton Crate

The `skeleton` crate (`crates/wasm-rquickjs/skeleton/`) is a **separate project** embedded via `include_dir!`. It has special build requirements — **load the `skeleton-development` skill** for the full workflow (Cargo.toml_ convention, cleanup, test rules).

## Build Commands

### Build the CLI binary
```bash
cargo build --release
```

## Amp Orb Environment

Fresh Amp orbs are prepared by `.agents/setup`, which installs the CI toolchain,
initializes submodules, and persists the pinned Node.js, Wasmtime, Cargo, and WASI
SDK paths for non-interactive login shells. `.agents/resume` performs only fast
validation when an existing orb wakes. Keep both scripts idempotent and executable.

The orb root disk is limited to 64 GiB, while a complete P2 run can retain roughly
47 GiB in `target/` and `tmp/`. Do not retain P2 and P3 build artifacts together
when reproducing the full CI workflow. Use separate worktrees so
`enable-wasmtime-fork.sh` cannot affect stock-P3 tests, then run the lanes in this
order:

1. Run fork-enabled P2 build, test-other, runtime, and node-compat lanes.
2. Preserve test logs/results outside the P2 worktree, then remove that worktree's
   generated `target/`, `tmp/`, and `tests/node_compat/suite/` directories.
3. Run stock-P3 runtime and node-compat lanes.
4. Remove the P3 worktree's generated `tmp/` directory before running the dedicated
   `p3_generation`, `p3_exported_resource`, and `p3_async_values` tests. Those tests
   build isolated crates concurrently under `/tmp` and need substantial transient
   free space.

Use the repository-supported artifact and Wasmtime caches while a lane is active,
but never reuse stores, component instances, WASI state, wasm memory, QuickJS state,
or test temp directories. After an interrupted run, remove a generated cache lock
only after confirming that no process owns it.

### Run tests
```bash
cargo test
```

### Optional test caches

The runtime and node compatibility test harness keeps generated-artifact and
Wasmtime caches off by default. For local iteration, enable the
clean-state-preserving caches explicitly:

```bash
WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1 \
WASM_RQUICKJS_TEST_WASMTIME_CACHE=1 \
cargo test --test runtime --features use-golem-wasmtime -- module_resolution --report-time
```

- `WASM_RQUICKJS_TEST_WASMTIME_CACHE=1` uses Wasmtime's filesystem compilation cache.
- `WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1` reuses wrapper build and optimized component artifacts when their source inputs are unchanged.
- `WASM_RQUICKJS_TEST_UNOPTIMIZED=1` skips Wizer pre-initialization for short rebuild loops.
- `WASM_RQUICKJS_TEST_DROP_CACHE=1` refreshes generated artifacts and bypasses the Wasmtime cache.
- `WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE=1` reuses process-local immutable
  `Engine`/`Linker`/`Component` values on the normal `TestInstance::new` path.
  This improves grouped runtime tests; node-compat already prepares one component
  per worker. Stores, instances, WASI state, temp directories, wasm memory, and
  QuickJS state remain fresh.

Artifact caches never reuse wasm memory, QuickJS runtime state, a Wasmtime `Store`, a component instance, a WASI context, or a temp directory across cases.

For skeleton work, prefer the measured local workflow wrapper:

```bash
# Minimize latency to the first result after an edit.
tools/dev-test.sh p2 fast-start runtime <exact_test_filter>

# Precompile a changed component once before parallel workers start.
tools/dev-test.sh p2 fast-run node_compat <test_filter>

# Override the fast-run default when another worker count suits the machine or filter.
tools/dev-test.sh p2 fast-run node_compat <test_filter> --test-threads 4

# Use the embedded skeleton and default test semantics.
tools/dev-test.sh p3 standard runtime ':tag:group3'
```

Use `p3` instead of `p2` for Preview 3. The P2 command keeps the Golem Wasmtime
patch and its lockfile in an ignored shadow workspace, so the real manifests stay
clean. The accelerated profiles use locked Cargo builds; missing packages can still
be downloaded. Root manifest or lockfile changes rebuild the P2 shadow dependency
state automatically. Intentional Golem Wasmtime branch updates remain explicit
dependency maintenance.

`fast-run` defaults to eight workers, while `fast-start` defaults to one. An explicit
test-r `--test-threads N` argument overrides either default. Eight workers was selected
from local measurements on a 14-core Apple M3 Max MacBook Pro (10 performance cores,
4 efficiency cores, 36 GB RAM, macOS 26.5.1); other machines and filters may perform
better with a different value.

Independently of those optional caches, node modules app tests run `npm ci` once
per app and process, then copy the installed template into a fresh temp app
directory for each case. Runtime state is never shared between cases.

Do not use grouped tests to speed up module compatibility checks; these tests rely on clean runtime state per case.

### ⚠️ CRITICAL TEST RULES

**DO NOT run `cargo test` without arguments** — it runs everything and takes too long. **ALWAYS filter** to a specific test harness and module. Load the `skeleton-development` skill for full test rules and examples.

**`--nocapture` is no longer required for parallel execution.** Every `#[test_dep]` in this repo uses `scope = Cloneable` or `scope = PerWorker`, so test-r keeps `cargo test --test runtime` and `cargo test --test node_compat` parallel under `--test-threads N` even with output capturing on. You can still pass `--nocapture` when you want to see live test output, but you no longer need it just to keep the suite fast. See the `skeleton-development` skill for the (deprecated) `--test-threads` workaround.

### Generate code for a JavaScript module
```bash
./target/release/wasm-rquickjs generate-wrapper-crate \
  --js <path/to/module.js> \
  --wit <path/to/wit/root> \
  --output <output/directory>
```

### Generate TypeScript definitions
```bash
./target/release/wasm-rquickjs generate-dts \
  --wit <path/to/wit/root> \
  --output <output/directory>
```

## Code Quality

### Formatting

The project uses `rustfmt` for code formatting. Before committing, ensure code is formatted:

```bash
cargo fmt
```

To check formatting without making changes:

```bash
cargo fmt -- --check
```

### Clippy Linting

The project uses Clippy with strict warnings enabled. All warnings must be fixed:

```bash
cargo clippy -- -Dwarnings
```

To fix common issues automatically:

```bash
cargo clippy --fix -- -Dwarnings
```

### Pre-commit Checks

Run all quality checks before committing:

```bash
cargo fmt
cargo clippy -- -Dwarnings
cargo test
```

## Workspace Configuration

The workspace is configured in the root `Cargo.toml` with the following members:
- `crates/wasi-logging` - WASI logging support
- `crates/wasm-rquickjs` - Main library crate

**Excluded from workspace:**
- `crates/wasm-rquickjs/skeleton` - Separate project, compiled independently
- `tmp/` - Temporary build artifacts

## Development Workflow

### When working on the skeleton:

Load the `skeleton-development` skill. For Node.js compat test work, also load `fixing-node-compat-test`. For adding new modules, load `adding-builtin-module`.

### When working on code generation:

1. Modify the main `crates/wasm-rquickjs` crate
2. Run tests with `cargo test`
3. Changes to the skeleton will be embedded via `include_dir!` at compile time

### When working on the CLI:

1. Modify `src/main.rs`
2. Build with `cargo build --release`
3. Test with `cargo test --test compilation` or `cargo test --test runtime`

### Updating the Supported APIs Documentation

When adding a new built-in API — such as a new Node.js-compatible module or a new exported function in an existing module — **always update the list of supported APIs in `README.md`** to reflect the change.

## Regenerating DTS Goldenfiles

Load the `regenerating-goldenfiles` skill for the workflow.

## Node.js Compatibility Tests

The `tests/node_compat/` directory contains vendored Node.js test files used to verify our Node.js API compatibility. Important rules:

- **Never modify vendored test files** in `tests/node_compat/suite/`. These are upstream Node.js tests fetched via `vendor.sh` and must remain unmodified.
- **We only implement the public Node.js API.** Tests that exercise Node.js internals (internal modules, private APIs, implementation details) are out of scope. Only tests for the public-facing Node.js API surface are relevant.
- The `config.jsonc` allowlist controls which tests are run. Add or remove entries there rather than modifying test files.
- Tests are **dynamically generated** by `tests/node_compat.rs` using test-r's `#[test_gen]`: one test case per entry in `config.jsonc`. A shared `PreparedComponent` (compiled WASM) is created once as a test dependency and reused across all tests.
- Tests with `"skip": true` in `config.jsonc` are marked as `is_ignored` and reported as `IGNORED` by the test runner.
- Test names follow the pattern `gen_node_compat_tests::<suite>__<test_file>` (e.g., `parallel__test_btoa_atob_js`).

Load the `fixing-node-compat-test` skill for the full workflow when making a test pass.

## Node Modules App Tests

The `tests/node_modules_apps/` directory contains CI-enforced runtime tests for unbundled npm apps installed with real `node_modules` and attached to the component filesystem as `/app`. This suite is separate from `tests/libraries/`, which documents Rollup-bundled package compatibility.

Important rules:

- `tests/node_modules_apps/config.jsonc` is the source of truth for node modules app tests. Runtime tests in `tests/runtime/node_modules_apps.rs` are generated from it.
- Add app fixtures under `tests/node_modules_apps/apps/<app>/` with a `package.json`, `run-node.mjs`, and `test-*` files exporting `run()`.
- Node modules app tests run `npm ci --install-links --ignore-scripts --no-audit --no-fund`, verify the raw test with host Node.js, then run it through wasm-rquickjs from `/app`.
- Keep this suite focused on real `node_modules` module loading, CJS/ESM interop, package maps, filesystem-backed package behavior, and high-value smoke tests. Do not use it for native `.node`, WASM artifact loading, subprocess-heavy, or live-network scenarios.
- CI runs node modules app and in-component npm compatibility tests as runtime `group9`; regular runtime tests use `group1` through `group8`.
- Before running group9 after skeleton changes, run `./cleanup-skeleton.sh`, then use `cargo test --test runtime --features use-golem-wasmtime -- --test-threads 4 ':tag:group9'` for the CI-like group, `cargo test --test runtime --features use-golem-wasmtime -- node_modules_app --nocapture` for the node modules app suite, `cargo test --test runtime --features use-golem-wasmtime -- npm_compat --nocapture` for the npm compatibility suite, or a narrower filter.

## Agentic TypeScript Suite

`tests/agentic_ts/` contains the manual compatibility, performance, and memory-observation suite for TypeScript workloads executed through `wasm-rquickjs:execution`. Follow `tests/agentic_ts/README.md` for pinned tooling and measurement commands. Do not run the measurement mode as part of ordinary test sweeps; CI uses `AGENTIC_TS_VALIDATE_REPORTS=1 cargo test --test agentic_ts` to validate checked-in report contracts without executing workloads.

## Built-in Module Architecture

### Hybrid Native + JS Pattern

Built-in modules follow a two-layer architecture:
- **Native bridge (Rust)**: Low-level operations implemented in Rust using `#[rquickjs::module]`. These are registered under internal paths like `__wasm_rquickjs_builtin/<name>_native`.
- **JS wrapper**: A companion `.js` file imports from the native bridge and implements the high-level Node.js-compatible API (classes, streams, convenience methods, validation).

This separation keeps Rust code focused on performance-critical operations while JS handles API surface compatibility.

### How to Add a New Built-in Module

Load the `adding-builtin-module` skill for the full checklist, code templates, and gotchas.

### ⚠️ node:http Transport Rule

**Never use a loopback transport for `node:http`.** Every `node:http` client request MUST go through `wasi:http` (the native Rust `NodeHttpClientRequest`). Do NOT add any fallback that bypasses `wasi:http` by creating direct `node:net` socket connections for loopback/localhost addresses.

### ⚠️ No Localhost Side-Channels

**NEVER introduce side-channels that pass metadata between the server and client based on localhost detection.** The `wasi:http` protocol has inherent limitations (e.g., no status message, no HTTP version, no raw headers beyond what the protocol exposes). These limitations are real and affect all users. Do NOT work around them by:
- Intercepting socket writes to capture HTTP response metadata (status messages, raw headers, connection headers)
- Storing captured metadata in global queues keyed by port number
- Checking `isLoopbackHostname()` to selectively apply captured metadata only for localhost
- Using any `globalThis.__wasm_rquickjs_*` side-channel to pass data between server and client

If a vendored node_compat test fails because it relies on HTTP features that `wasi:http` cannot provide (e.g., custom status messages, HTTP version negotiation, informational 1xx responses), **mark the test as skipped** in `config.jsonc` with an explicit reason like `"reason": "wasi:http does not expose status messages"` rather than faking the behavior for localhost only.

## Key Files

- `src/main.rs` - CLI entry point
- `crates/wasm-rquickjs/src/` - Code generation logic
- `crates/wasm-rquickjs/skeleton/src/` - JavaScript runtime APIs
- `tests/` - Integration tests for compilation, runtime, DTS generation, and error handling

## Features

The generated crates support feature flags:
- `logging` - Enable `wasi:logging` for JavaScript console API
- `http` - Enable `wasi:http` for JavaScript fetch API

Both features are enabled by default in generated crates.

## Dependencies

Key external dependencies:
- `rquickjs` - QuickJS Rust bindings
- `wit-parser` / `wit-encoder` - WebAssembly Interface Type support
- `wasmtime` - WASM runtime for testing

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

### Run tests
```bash
cargo test
```

### ⚠️ CRITICAL TEST RULES

**DO NOT run `cargo test` without arguments** — it runs everything and takes too long. **ALWAYS filter** to a specific test harness and module. Load the `skeleton-development` skill for full test rules and examples.

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

### ⚠️ Keeping `node_compat` and `node_compat_report` in sync

The `tests/node_compat.rs` test harness and the `tests/node_compat_report.rs` report generator are **two separate runners** with independent Host types, linker setups, and WASI context configurations. **Whenever you change the WASI context, linker setup, or Host configuration in `tests/common/mod.rs` (used by `node_compat`), you MUST apply the same change to `tests/node_compat_report.rs`** — otherwise the two runners will produce different results.

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

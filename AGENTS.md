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
├── examples/                   # Example projects
├── src/                        # CLI binary source (main.rs)
├── tests/                      # Integration tests
├── Cargo.toml                  # Workspace root
├── cleanup-skeleton.sh         # Script to clean skeleton build artifacts
└── README.md                   # Main documentation
```

## Important Notes About @crates/wasm-rquickjs/skeleton

The `skeleton` crate is a **separate project** that is embedded within the `wasm-rquickjs` crate. It is crucial to understand the following:

### Cargo.toml Naming Convention

**The skeleton's `Cargo.toml` MUST be renamed to `Cargo.toml_` in the repository.**

- The file is stored as `Cargo.toml_` to avoid conflicts with Rust packaging when embedded
- When working on the skeleton locally, rename it to `Cargo.toml` before building
- Before committing changes back, rename it back to `Cargo.toml_`
- The embedded file in the final package uses the renamed `Cargo.toml_`

### Building and Testing the Skeleton

The skeleton crate can be compiled separately from the main project:

```bash
cd crates/wasm-rquickjs/skeleton

# Rename Cargo.toml_ to Cargo.toml for local development
mv Cargo.toml_ Cargo.toml

# Build/test the skeleton
cargo build
cargo test

# Rename back before committing
mv Cargo.toml Cargo.toml_
```

### Runtime tests
To test the builtin module of the skeleton, first define an example in `examples`, consisting of a pair of a JS file and a WIT interface,
and then add one or more tests in `tests/runtime.rs` that use the example.

### Cleaning Skeleton Build Artifacts

After compiling the skeleton for testing, **always clean its build artifacts** before compiling the main `wasm-rquickjs` crate:

```bash
./cleanup-skeleton.sh
```

**Why?** The `include_dir!` macro embeds the entire skeleton directory into the main package during compilation. If the skeleton's `target/` directory is present, it will be embedded, causing:
- Dramatically slower compilation times
- Significantly larger resulting binaries

## Build Commands

### Build the CLI binary
```bash
cargo build --release
```

### Run tests
```bash
cargo test
```

### Build specific test harness
```bash
cargo test --test compilation
cargo test --test runtime
cargo test --test dts
cargo test --test errors
```

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

### When working on the skeleton (JavaScript APIs, core functionality):

1. Navigate to the skeleton directory
2. Rename `Cargo.toml_` to `Cargo.toml`
3. Make changes and test with `cargo build`/`cargo test`
4. When done, run from the repo root: `./cleanup-skeleton.sh`
5. Rename skeleton's `Cargo.toml` back to `Cargo.toml_`
6. Commit your changes

### When working on code generation:

1. Modify the main `crates/wasm-rquickjs` crate
2. Run tests with `cargo test`
3. Changes to the skeleton will be embedded via `include_dir!` at compile time

### When working on the CLI:

1. Modify `src/main.rs`
2. Build with `cargo build --release`
3. Test with `cargo test --test compilation` or `cargo test --test runtime`

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
- `cargo-component` - WASM component compilation (for end users)

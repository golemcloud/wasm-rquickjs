---
name: skeleton-development
description: "Guides development workflow for the embedded skeleton crate. Use when modifying files under crates/wasm-rquickjs/skeleton/, working on JavaScript runtime APIs, or troubleshooting skeleton build issues."
---

# Skeleton Development Workflow

The skeleton crate (`crates/wasm-rquickjs/skeleton/`) is a **separate Rust project** embedded into the main `wasm-rquickjs` crate via `include_dir!` at compile time. It requires special handling.

## The `Cargo.toml_` Convention

The skeleton's `Cargo.toml` is stored as **`Cargo.toml_`** in the repository to avoid conflicts with Rust packaging.

- For local skeleton development: `mv Cargo.toml_ Cargo.toml`
- Before committing: `mv Cargo.toml Cargo.toml_`
- The main crate embeds the file as `Cargo.toml_`

## Build / Test Cycle

### When modifying skeleton files

```bash
# 1. Make your changes in crates/wasm-rquickjs/skeleton/src/

# 2. ALWAYS clean skeleton build artifacts before testing from the repo root
./cleanup-skeleton.sh

# 3. Run the appropriate test harness (NEVER run unfiltered)
cargo test --test runtime <module> -- --nocapture 2>&1 | tee /tmp/test-output.txt
# or
cargo test --test node_compat <test_filter> -- --nocapture 2>&1 | tee /tmp/test-output.txt
```

### Why `cleanup-skeleton.sh` is mandatory

The `include_dir!` macro embeds the **entire skeleton directory** into the main crate during compilation. If the skeleton's `target/` directory exists, it gets embedded too, causing:
- Dramatically slower compilation
- Significantly larger binaries

**Always run `./cleanup-skeleton.sh` before any `cargo test` or `cargo build` from the repo root.**

## Test Rules

**NEVER run `cargo test` without arguments** — it runs everything and takes too long.

**NEVER run `cargo test --test runtime` without a filter** — always specify a module:
```bash
cargo test --test runtime url -- --nocapture        # ✅
cargo test --test runtime crypto -- --nocapture     # ✅
cargo test --test runtime -- --nocapture            # ❌ TOO SLOW
```

**NEVER run `cargo test --test node_compat` without a filter** unless you intend the full suite:
```bash
cargo test --test node_compat parallel__test_crypto_hmac_js -- --nocapture  # ✅
cargo test --test node_compat parallel__test_crypto -- --nocapture          # ✅ (module group)
cargo test --test node_compat -- --nocapture                               # ❌ 800+ tests
```

**DO NOT run `cargo test --test compilation`** unless you modified files in `crates/wasm-rquickjs/src/` (the code generator). Skeleton-only changes do NOT require compilation tests.

**Always save test output** to a temp file for analysis without re-running:
```bash
cargo test --test runtime url -- --nocapture 2>&1 | tee /tmp/test-output.txt
```

## Always pass `--nocapture` when running `node_compat` (or any `#[test_dep]` harness) locally

The `tests/node_compat.rs` harness shares a single `#[test_dep] FullPreparedComponent`
across every test. In `test-r 3.0.x`, **with output capture on** (i.e. `--nocapture` not
passed) and shared `#[test_dep]` dependencies, the harness forcibly sets
`test_threads = 1` and emits a warning. This is why local shard runs that omit
`--nocapture` take an order of magnitude longer than CI — they collapse to a single
thread, even though tests are isolated and safe to run in parallel.

CI runs are already correct (they pass `--nocapture`). For local runs:

```bash
# ✅ multi-threaded (default = std::thread::available_parallelism())
cargo test --test node_compat <filter> -- --nocapture

# ❌ forced single-thread because of shared #[test_dep] + capture-on
cargo test --test node_compat <filter>
```

If you must keep capture on for some reason, explicitly opt back into parallelism with
`--test-threads <N>` (test-r reads it from CLI args, NOT from `RUST_TEST_THREADS`):

```bash
cargo test --test node_compat <filter> -- --test-threads 8
```

The same rule applies to any test binary that uses a shared `#[test_dep]`.

## Target Platform

The skeleton is **always compiled to `wasm32-wasip1`**. Never write conditional code that checks for unix/windows/macOS or any other host platform (e.g., `#[cfg(unix)]`, `#[cfg(windows)]`, `#[cfg(target_os = "...")]`, `process.platform === "win32"`, `path.sep === "\\"`, etc.). Such checks are meaningless in the WASM target and add dead code complexity.

## Adding Dependencies

When adding crates to `Cargo.toml_`:
- Use `default-features = false` for crates that may pull in C/native libraries
- Use pure-Rust backends (e.g., `rust_backend`) for `wasm32-wasip2` compatibility
- Example: `whirlpool = { version = "0.10", default-features = false }`

## ⚠️ node:http Transport Rule

**Never use a loopback transport for `node:http`.** Every `node:http` client request MUST go through `wasi:http` (the native Rust `NodeHttpClientRequest`). Do NOT add any fallback that bypasses `wasi:http` by creating direct `node:net` socket connections for loopback/localhost addresses.

## Key Directories

- `skeleton/src/builtin/` — Built-in Node.js module implementations (Rust + JS pairs)
- `skeleton/src/builtin/internal/` — Internal test bindings and helpers
- `skeleton/src/builtin/mod.rs` — Module registration (resolvers, loaders, wiring)

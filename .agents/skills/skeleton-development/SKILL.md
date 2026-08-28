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

### Lint the complete skeleton matrix

Use the repository-owned helper for Clippy rather than renaming the manifest by
hand:

```bash
tools/check-skeleton-clippy.sh
```

It checks the supported P2/P3 default and maximal feature lanes with
`-Dwarnings`, restores `Cargo.toml_`, and removes skeleton-local `target/`
artifacts on success, failure, or interruption.

### When modifying skeleton files

```bash
# Minimize latency to the first result after an edit: no Wizer, one worker.
tools/dev-test.sh p2 fast-start runtime <exact_test_filter>

# Precompile a changed component once before parallel workers start.
tools/dev-test.sh p2 fast-run runtime <module_filter>
tools/dev-test.sh p2 fast-run node_compat <test_filter>
tools/dev-test.sh p2 fast-run node_compat <test_filter> --test-threads 4

# Default semantics use the embedded skeleton.
tools/dev-test.sh p3 standard runtime ':tag:group3'
```

The accelerated profiles enable the generated-artifact and Wasmtime caches, read the skeleton
from the checkout without embedding it in the host test binary, and keep P2's Golem Wasmtime
patch in an ignored shadow workspace. They use locked Cargo builds while allowing missing
packages to be downloaded. `fast-run` also precompiles a changed component once before parallel
workers start and reuses immutable prepared components within each runtime-test worker.
`standard` uses the embedded skeleton and default test behavior. Every test creates fresh mutable
runtime state.

### When `cleanup-skeleton.sh` is required

Production/default builds still use `include_dir!` to embed the **entire skeleton directory**.
Before a default build or test, remove skeleton-local artifacts:

```bash
./cleanup-skeleton.sh
```

If the skeleton's `target/` directory exists in an embedded build, it causes:
- Dramatically slower compilation
- Significantly larger binaries

The accelerated `tools/dev-test.sh` profiles use the `external-skeleton` feature and do not
embed that directory, so cleanup is not part of the normal edit loop. The `standard` profile
uses the embedded skeleton and still requires cleanup when skeleton-local artifacts exist.

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

Save unusually verbose or failing output when it will be useful for analysis:
```bash
tools/dev-test.sh p2 fast-run runtime url 2>&1 | tee /tmp/test-output.txt
```

## Test concurrency

The runtime and node-compat dependencies use test-r's `Cloneable` or `PerWorker` scopes, so
captured output no longer forces serial execution. `--nocapture` is optional.

Do not leave focused component tests at machine-wide concurrency. On the development machine,
6–8 workers have the best measured throughput; launching 12 cold workers made a 12-test batch
take 94 seconds instead of 7 seconds. `tools/dev-test.sh ... fast-run` precompiles a changed
component once before parallel workers start, then defaults to eight workers. Pass test-r's
`--test-threads N` after the filter to override the profile default. These measurements used a
14-core Apple M3 Max MacBook Pro (10 performance cores, 4 efficiency cores, 36 GB RAM,
macOS 26.5.1).

When comparing profiles, report preparation, test execution, and total wall time separately.
Precompilation can sharply reduce the execution phase while still increasing preparation time.

```bash
# Direct Cargo equivalent when the workflow command is unsuitable:
cargo test --test node_compat <filter> -- --test-threads 8
```

## Target Platform

The skeleton is compiled as a component for the `wasm32-wasip2` Rust target. The generated
component can expose either the Preview 2 or Preview 3 runtime path. Never write conditional
code that checks for unix/windows/macOS or any other host platform (e.g., `#[cfg(unix)]`,
`#[cfg(windows)]`, `#[cfg(target_os = "...")]`, `process.platform === "win32"`,
`path.sep === "\\"`, etc.). Such checks are meaningless in the WASM target and add dead code
complexity.

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

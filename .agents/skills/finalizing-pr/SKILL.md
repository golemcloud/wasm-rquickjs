---
name: finalizing-pr
description: "Runs build, clippy, formatting, and lint checks across all targets before a PR. Use when asked to finalize, prepare, or clean up before submitting a pull request."
---

# Finalize PR

Run all quality checks across every build target and fix any issues. Execute each step in order — do not skip steps even if earlier ones pass.

## Step 1: Build all targets

```bash
cargo build --all-targets
```

Fix any compilation errors before proceeding.

## Step 2: Clippy and format (main workspace)

```bash
cargo fmt
cargo clippy --all-targets -- -Dwarnings
```

Fix all warnings and errors. Re-run until clean.

## Step 3: Clippy and format (skeleton crate)

The skeleton is a separate Rust project whose `Cargo.toml` is stored as `Cargo.toml_`.

```bash
# Temporarily activate
mv crates/wasm-rquickjs/skeleton/Cargo.toml_ crates/wasm-rquickjs/skeleton/Cargo.toml

# Check
cd crates/wasm-rquickjs/skeleton
cargo fmt
cargo clippy --all-targets -- -Dwarnings

# Restore when done
mv crates/wasm-rquickjs/skeleton/Cargo.toml crates/wasm-rquickjs/skeleton/Cargo.toml_
```

Fix all warnings and errors. **Always restore `Cargo.toml_`** — even if fixes fail.

## Step 4: TypeScript linting and formatting (tools/ai-dev-tools)

```bash
cd tools/ai-dev-tools
npx prettier --write src/
npx eslint src/
```

Fix any ESLint errors. Then verify TypeScript compilation:

```bash
npx tsc --noEmit
```

## Step 5: Final verification

Re-run the main workspace build to confirm skeleton changes did not break anything:

```bash
cargo build --all-targets
cargo clippy --all-targets -- -Dwarnings
```

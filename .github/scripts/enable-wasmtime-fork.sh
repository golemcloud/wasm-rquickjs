#!/usr/bin/env bash
# Enable Golem's wasmtime fork for the duration of a CI job.
#
# Why:
#   Upstream wasmtime 45.0.0 ships a "fix" for issue #13040 that calls
#   `tokio::task::yield_now()` inside `Deadline::Past::ready()` and re-polls
#   completed futures inside `wasi:io/poll#poll`. That breaks
#   `pollable.ready()` as a synchronous "is ready now?" probe (it always
#   returns `false` on first call) and starves QuickJS-driven event loops
#   that rely on it (e.g. dynamic `import('data:...')`), causing tests
#   such as `es_module__test_esm_invalid_data_urls_js` to hang.
#
#   Golem's fork (`golem-wasmtime-v45.0.0`) carries the alternative fix
#   (commit `6d349ad9` "Yield fix"), preserving the `pollable.ready()`
#   contract while still yielding once per `poll`/`block` call.
#
# Why not in Cargo.toml unconditionally:
#   The fork is not published to crates.io, so the published crate
#   (`cargo publish -p wasm-rquickjs`) cannot reference it. We therefore
#   keep the `[patch.crates-io]` section commented out in `Cargo.toml`
#   for local dev / publish, and uncomment it only in CI test jobs via
#   this script.
#
# Usage in CI:
#   bash .github/scripts/enable-wasmtime-fork.sh
#   cargo test ... --features use-golem-wasmtime
#
# Idempotent: re-running on an already-uncommented file is a no-op.

set -euo pipefail

# Uncomment the `[patch.crates-io]` header and every patched wasmtime line
# immediately following it. The patterns intentionally match the exact line
# shape produced by the commented block in `Cargo.toml`.
# We write to a temp file and `mv` over the original instead of `sed -i` to
# stay portable between GNU sed (Linux/CI) and BSD sed (macOS local dev),
# which disagree on the syntax of in-place edits.
tmp=$(mktemp)
# Strip a leading `#` from `[patch.crates-io]` and from any `wasmtime…` line
# that uses the Golem fork git URL. This matches every relevant line in the
# commented block without needing portability-fragile regex alternation.
sed \
    -e 's|^#\[patch\.crates-io\]$|[patch.crates-io]|' \
    -e 's|^#\(wasmtime[a-z-]* = { git = "https://github.com/golemcloud/wasmtime\.git", branch = "golem-wasmtime-v45\.0\.0" }\)$|\1|' \
    Cargo.toml > "$tmp"
mv "$tmp" Cargo.toml

echo "Enabled Golem wasmtime fork in Cargo.toml:"
grep -nE '^\[patch\.crates-io\]|^wasmtime[a-z-]* = \{ git = "https://github\.com/golemcloud/wasmtime' Cargo.toml || {
    echo "ERROR: no [patch.crates-io] entries found after uncommenting." >&2
    exit 1
}

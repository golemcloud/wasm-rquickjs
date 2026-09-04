#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
skeleton_dir="$repo_root/crates/wasm-rquickjs/skeleton"
manifest="$skeleton_dir/Cargo.toml"
stored_manifest="$skeleton_dir/Cargo.toml_"
target_dir="$skeleton_dir/target"
cargo_bin=${CARGO:-cargo}
p3_dir=""

if [[ ! -f "$stored_manifest" || -e "$manifest" ]]; then
    echo "Expected exactly $stored_manifest and no $manifest." >&2
    exit 2
fi

activated=true
cleanup() {
    local status=$?
    local cleanup_failed=0
    # Ignore termination signals before disabling the EXIT trap. Otherwise a second,
    # different signal can interrupt this handler after Cargo.toml was activated but
    # before it has been restored.
    trap '' INT TERM HUP
    trap - EXIT

    # Restore the canonical manifest before any potentially slow or fallible
    # artifact cleanup.
    if [[ "$activated" == true && -f "$manifest" ]]; then
        if [[ -e "$stored_manifest" ]]; then
            echo "Refusing to overwrite $stored_manifest while restoring the skeleton manifest." >&2
            cleanup_failed=1
        elif ! mv "$manifest" "$stored_manifest"; then
            echo "Failed to restore $stored_manifest." >&2
            cleanup_failed=1
        fi
    fi
    trap - INT TERM HUP

    if ! rm -rf -- "$target_dir"; then
        echo "Failed to remove $target_dir." >&2
        cleanup_failed=1
    fi
    if [[ -n "$p3_dir" ]] && ! rm -rf -- "$p3_dir"; then
        echo "Failed to remove $p3_dir." >&2
        cleanup_failed=1
    fi

    if [[ "$status" -eq 0 && "$cleanup_failed" -ne 0 ]]; then
        status=1
    fi

    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

mv "$stored_manifest" "$manifest"

run_clippy() {
    local label=$1
    local lane_manifest=$2
    shift 2
    echo "Checking skeleton Clippy lane: $label"
    CARGO_TARGET_DIR="$target_dir" "$cargo_bin" clippy \
        --manifest-path "$lane_manifest" \
        --locked \
        --target wasm32-wasip2 \
        --all-targets \
        "$@" \
        -- \
        -Dwarnings
}

# The default lanes cover feature-disabled adapters. The maximal lanes cover every
# optional implementation while keeping the mutually exclusive P2/P3 spines separate.
run_clippy p2-default "$manifest"
run_clippy p2-maximal "$manifest" \
    --no-default-features \
    --features full,golem,typescript-compiler-profiling
run_clippy p2-maximal-no-logging "$manifest" \
    --no-default-features \
    --features full-no-logging,golem,typescript-compiler-profiling

# Generated P3 crates bind `mod builtin` to builtin_p3.rs. Lint a temporary copy
# with the same binding so the P3 HTTP and socket ownership code is actually checked.
p3_dir=$(mktemp -d "/tmp/wasm-rquickjs-skeleton-clippy-p3.XXXXXX")
cp "$manifest" "$p3_dir/Cargo.toml"
cp "$skeleton_dir/Cargo.lock" "$p3_dir/Cargo.lock"
cp -R "$skeleton_dir/src" "$p3_dir/src"
perl -0pi -e 's/^mod builtin;/#[path = "builtin_p3.rs"]\nmod builtin;/m' "$p3_dir/src/lib.rs"

run_clippy p3-default "$p3_dir/Cargo.toml" \
    --no-default-features \
    --features normal-p3
run_clippy p3-maximal "$p3_dir/Cargo.toml" \
    --no-default-features \
    --features full-p3,golem,typescript-compiler-profiling
run_clippy p3-maximal-no-logging "$p3_dir/Cargo.toml" \
    --no-default-features \
    --features full-no-logging-p3,golem,typescript-compiler-profiling

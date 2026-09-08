#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
skeleton_dir="$repo_root/crates/wasm-rquickjs/skeleton"
manifest="$skeleton_dir/Cargo.toml"
stored_manifest="$skeleton_dir/Cargo.toml_"
target_dir="$repo_root/target"
cargo_bin=${CARGO:-cargo}

if [[ ! -f "$stored_manifest" || -e "$manifest" || -L "$manifest" ]]; then
    echo "Expected exactly $stored_manifest and no $manifest." >&2
    exit 2
fi

activated=false
cleanup() { [[ "$activated" == false ]] || unlink "$manifest"; }
trap cleanup EXIT

ln -s "$(basename "$stored_manifest")" "$manifest"
activated=true

run_clippy() {
    local label=$1
    shift
    echo "Checking skeleton Clippy lane: $label"
    CARGO_TARGET_DIR="$target_dir" "$cargo_bin" clippy \
        --manifest-path "$manifest" \
        --locked \
        --target wasm32-wasip2 \
        --all-targets \
        "$@" \
        -- \
        -Dwarnings
}

# The default lanes cover feature-disabled adapters. The maximal lanes cover every
# optional implementation while keeping the mutually exclusive P2/P3 spines separate.
run_clippy p2-default
run_clippy p2-maximal \
    --no-default-features \
    --features full,golem,typescript-transform-runtime
run_clippy p2-maximal-no-logging \
    --no-default-features \
    --features full-no-logging,golem,typescript-transform-runtime

run_clippy p3-default \
    --no-default-features \
    --features normal-p3
run_clippy p3-maximal \
    --no-default-features \
    --features full-p3,golem,typescript-transform-runtime
run_clippy p3-maximal-no-logging \
    --no-default-features \
    --features full-no-logging-p3,golem,typescript-transform-runtime

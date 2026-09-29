#!/usr/bin/env bash
set -euo pipefail

usage() {
    echo "usage: tools/check-component-licenses.sh [--check|--write]" >&2
    exit 2
}

mode=${1:---check}
[[ $# -le 1 ]] || usage
[[ "$mode" == "--check" || "$mode" == "--write" ]] || usage

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
skeleton_dir="$repo_root/crates/wasm-rquickjs/skeleton"
manifest="$skeleton_dir/Cargo.toml"
stored_manifest="$skeleton_dir/Cargo.toml_"
license_dir="$repo_root/crates/wasm-rquickjs/licenses"
config="$license_dir/about.toml"
template="$license_dir/component-licenses.hbs"
cargo_about=${CARGO_ABOUT:-cargo-about}
cargo_bin=${CARGO:-cargo}

if [[ ! -f "$stored_manifest" || -e "$manifest" || -L "$manifest" ]]; then
    echo "Expected exactly $stored_manifest and no $manifest." >&2
    exit 2
fi

version=$($cargo_about --version 2>/dev/null || true)
if [[ "$version" != "cargo-about 0.9.2" ]]; then
    echo "GOL-415 requires cargo-about 0.9.2; found ${version:-nothing}." >&2
    echo "Install it with: cargo install --locked --features cli --version 0.9.2 cargo-about" >&2
    exit 2
fi

work_dir=$(mktemp -d "${TMPDIR:-/tmp}/wasm-rquickjs-licenses.XXXXXX")
activated=false
cleanup() {
    [[ "$activated" == false ]] || unlink "$manifest"
    rm -rf "$work_dir"
}
trap cleanup EXIT HUP INT TERM

ln -s "$(basename "$stored_manifest")" "$manifest"
activated=true

# Fetch only the locked crate sources first, then keep license resolution offline. This prevents
# generated notices from depending on mutable repository contents or ambient network state.
"$cargo_bin" fetch \
    --manifest-path "$manifest" \
    --locked \
    --target wasm32-wasip2

generate() {
    local label=$1
    local features=$2
    local format=$3
    local output=$4
    shift 4

    echo "Checking component license lane: $label"
    "$cargo_about" generate \
        --manifest-path "$manifest" \
        --config "$config" \
        --locked \
        --offline \
        --fail \
        --no-default-features \
        --features "$features" \
        --target wasm32-wasip2 \
        --format "$format" \
        --output-file "$output" \
        "$@"
}

# Audit both public TypeScript features independently, then retain a notice for their union. This
# keeps both lanes protected and complete if a future backend makes their dependency graphs differ.
generate p2-typescript-runtime "normal typescript-runtime" json "$work_dir/p2-runtime.json"
generate p2-typescript-transform-runtime \
    "normal typescript-transform-runtime" json "$work_dir/p2-transform.json"
generate p3-typescript-runtime "normal-p3 typescript-runtime" json "$work_dir/p3-runtime.json"
generate p3-typescript-transform-runtime \
    "normal-p3 typescript-transform-runtime" json "$work_dir/p3-transform.json"

generate p2-notice \
    "normal typescript-runtime typescript-transform-runtime" handlebars "$work_dir/p2.txt" "$template"
generate p3-notice \
    "normal-p3 typescript-runtime typescript-transform-runtime" handlebars "$work_dir/p3.txt" "$template"

prepend_target() {
    local target=$1
    local source=$2
    local output=$3
    {
        echo "Target profile: $target"
        echo
        cat "$source"
    } | awk '
        { sub(/\r$/, ""); sub(/[ \t]+$/, "") }
        /^[[:space:]]*$/ { pending_blanks = pending_blanks "\n"; next }
        { printf "%s", pending_blanks; print; pending_blanks = "" }
    ' > "$output"
}

prepend_target "WASI Preview 2 / normal / TypeScript runtime + transform" \
    "$work_dir/p2.txt" "$work_dir/p2-final.txt"
prepend_target "WASI Preview 3 / normal-p3 / TypeScript runtime + transform" \
    "$work_dir/p3.txt" "$work_dir/p3-final.txt"

check_or_write() {
    local generated=$1
    local retained=$2
    if [[ "$mode" == "--write" ]]; then
        cp "$generated" "$retained"
    elif ! cmp -s "$generated" "$retained"; then
        echo "Component license notice is stale: $retained" >&2
        diff -u "$retained" "$generated" || true
        return 1
    fi
}

check_or_write "$work_dir/p2-final.txt" "$license_dir/THIRD_PARTY_COMPONENT_LICENSES_P2.txt"
check_or_write "$work_dir/p3-final.txt" "$license_dir/THIRD_PARTY_COMPONENT_LICENSES_P3.txt"

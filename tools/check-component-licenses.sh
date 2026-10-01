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
swc_sourcemap_license="$license_dir/clarifications/swc_sourcemap-10.0.2-LICENSE"
rquickjs_license="$license_dir/clarifications/rquickjs-0.10.0-LICENSE"
cargo_about=${CARGO_ABOUT:-cargo-about}
cargo_bin=${CARGO:-cargo}

if [[ ! -f "$stored_manifest" || -e "$manifest" || -L "$manifest" ]]; then
    echo "Expected exactly $stored_manifest and no $manifest." >&2
    exit 2
fi

version=$("$cargo_about" --version 2>/dev/null || true)
if [[ "$version" != "cargo-about 0.9.2" ]]; then
    echo "GOL-415 requires cargo-about 0.9.2; found ${version:-nothing}." >&2
    echo "Install it with: cargo install --locked --features cli --version 0.9.2 cargo-about" >&2
    exit 2
fi

work_dir=$(mktemp -d "${TMPDIR:-/tmp}/wasm-rquickjs-licenses.XXXXXX")
activated=false
cleanup() {
    if [[ "$activated" == true ]]; then
        unlink "$manifest"
        activated=false
    fi
    rm -rf "$work_dir"
}
trap cleanup EXIT
trap 'cleanup; exit 129' HUP
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

ln -s "$(basename "$stored_manifest")" "$manifest"
activated=true

# Fetch the locked crate sources first. cargo-about also resolves the explicit git clarifications
# in about.toml at each crate's crates.io-published VCS revision and verifies their pinned hashes.
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

# swc_sourcemap 10.0.2 was published with repository metadata that points at the SWC monorepo,
# while its VCS revision and BSD license live in swc-project/swc-sourcemap. cargo-about therefore
# cannot use its normal checksummed git clarification for this one crate. Replace only the exact
# generic fallback block, and fail closed if cargo-about changes its shape or attribution set.
swc_sourcemap_license_hash=$(shasum -a 256 "$swc_sourcemap_license" | awk '{ print $1 }')
if [[ "$swc_sourcemap_license_hash" != "7516e1cf340213f60d96bca77bb012882dbf80e7cca5922c914174f605d9ef71" ]]; then
    echo "Pinned swc_sourcemap license text changed: $swc_sourcemap_license" >&2
    exit 1
fi

replace_swc_sourcemap_fallback() {
    local source=$1
    local output=$2
    awk -v license_file="$swc_sourcemap_license" '
        function emit_block(    line) {
            if (block == "") {
                return
            }
            expected = "--- BSD 3-Clause \"New\" or \"Revised\" License ---\n" \
                "Used by:\n* swc_sourcemap 10.0.2\n\nCopyright (c) <year> <owner>. \n"
            if (index(block, expected) == 1) {
                replacements++
                print "--- BSD 3-Clause \"New\" or \"Revised\" License ---"
                print "Used by:"
                print "* swc_sourcemap 10.0.2"
                print ""
                while ((getline line < license_file) > 0) {
                    print line
                }
                close(license_file)
                print ""
            } else {
                if (index(block, "swc_sourcemap 10.0.2") > 0) {
                    print "Unexpected swc_sourcemap fallback block:" > "/dev/stderr"
                    printf "%s", block > "/dev/stderr"
                }
                printf "%s", block
            }
            block = ""
        }
        /^--- / {
            emit_block()
            block = $0 "\n"
            next
        }
        {
            if (block == "") {
                print
            } else {
                block = block $0 "\n"
            }
        }
        END {
            emit_block()
            if (replacements != 1) {
                exit 1
            }
        }
    ' "$source" > "$output"
}

rquickjs_license_hash=$(shasum -a 256 "$rquickjs_license" | awk '{ print $1 }')
if [[ "$rquickjs_license_hash" != "0517c7f76916dcc6557b3c0e1c077f14dd05bfe8e0d7d2a2fa298fe0d49a790a" ]]; then
    echo "Pinned rquickjs license text changed: $rquickjs_license" >&2
    exit 1
fi

replace_rquickjs_fallback() {
    local source=$1
    local output=$2
    awk -v license_file="$rquickjs_license" '
        function emit_block(    line) {
            if (block == "") {
                return
            }
            expected = "--- MIT License ---\n" \
                "Used by:\n* rquickjs-core 0.10.0\n* rquickjs-macro 0.10.0\n\n" \
                "MIT License\n\nCopyright (c) <year> <copyright holders>\n"
            if (index(block, expected) == 1) {
                replacements++
                print "--- MIT License ---"
                print "Used by:"
                print "* rquickjs-core 0.10.0"
                print "* rquickjs-macro 0.10.0"
                print ""
                while ((getline line < license_file) > 0) {
                    print line
                }
                close(license_file)
                print ""
            } else {
                if (index(block, "rquickjs-core 0.10.0") > 0 ||
                    index(block, "rquickjs-macro 0.10.0") > 0) {
                    print "Unexpected rquickjs fallback block:" > "/dev/stderr"
                    printf "%s", block > "/dev/stderr"
                }
                printf "%s", block
            }
            block = ""
        }
        /^--- / {
            emit_block()
            block = $0 "\n"
            next
        }
        {
            if (block == "") {
                print
            } else {
                block = block $0 "\n"
            }
        }
        END {
            emit_block()
            if (replacements != 1) {
                exit 1
            }
        }
    ' "$source" > "$output"
}

replace_swc_sourcemap_fallback "$work_dir/p2.txt" "$work_dir/p2-swc-attributed.txt"
replace_swc_sourcemap_fallback "$work_dir/p3.txt" "$work_dir/p3-swc-attributed.txt"
replace_rquickjs_fallback "$work_dir/p2-swc-attributed.txt" "$work_dir/p2-attributed.txt"
replace_rquickjs_fallback "$work_dir/p3-swc-attributed.txt" "$work_dir/p3-attributed.txt"

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
    "$work_dir/p2-attributed.txt" "$work_dir/p2-final.txt"
prepend_target "WASI Preview 3 / normal-p3 / TypeScript runtime + transform" \
    "$work_dir/p3-attributed.txt" "$work_dir/p3-final.txt"

reject_placeholder_attribution() {
    local generated=$1
    if grep -Eq '<year>|<copyright holders>|GB18030_2022_OVERRIDE_PUA' "$generated"; then
        echo "Component license notice contains placeholder or misidentified attribution: $generated" >&2
        return 1
    fi
}

reject_placeholder_attribution "$work_dir/p2-final.txt"
reject_placeholder_attribution "$work_dir/p3-final.txt"

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

status=0
check_or_write "$work_dir/p2-final.txt" "$license_dir/THIRD_PARTY_COMPONENT_LICENSES_P2.txt" || status=1
check_or_write "$work_dir/p3-final.txt" "$license_dir/THIRD_PARTY_COMPONENT_LICENSES_P3.txt" || status=1
exit "$status"

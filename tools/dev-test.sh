#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: tools/dev-test.sh <p2|p3> <quick|verify> <test-target> <filter> [test-r args...]

Examples:
  tools/dev-test.sh p2 quick runtime module_resolution::esm_package_map_edge_cases
  tools/dev-test.sh p2 verify runtime module_resolution::esm_
  tools/dev-test.sh p3 verify node_compat es_module__test_esm_pkgname_mjs

The command is offline by default so nested wrapper builds do not update the registry index.
Set WASM_RQUICKJS_DEV_ONLINE=1 after dependency or Wasmtime-fork changes.
EOF
}

if [[ $# -lt 4 ]]; then
    usage >&2
    exit 2
fi

target=$1
mode=$2
test_target=$3
filter=$4
shift 4

case "$target" in
    p2 | p3) ;;
    *)
        echo "Unknown target '$target'; expected p2 or p3." >&2
        exit 2
        ;;
esac

case "$mode" in
    quick | verify) ;;
    *)
        echo "Unknown mode '$mode'; expected quick or verify." >&2
        exit 2
        ;;
esac

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

export WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1
export WASM_RQUICKJS_TEST_WASMTIME_CACHE=1
unset WASM_RQUICKJS_TEST_PRIME_WASMTIME_CACHE
unset WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE
unset WASM_RQUICKJS_TEST_TARGET
unset WASM_RQUICKJS_TEST_UNOPTIMIZED

if [[ "${WASM_RQUICKJS_DEV_ONLINE:-0}" == 1 ]]; then
    unset CARGO_NET_OFFLINE
else
    export CARGO_NET_OFFLINE=true
fi

features="wasm-rquickjs/external-skeleton"

prepare_p2_workspace() {
    local shadow="$repo_root/tmp/p2-dev-workspace"
    local source_hash
    source_hash=$(git hash-object Cargo.toml Cargo.lock | git hash-object --stdin)

    mkdir -p "$shadow"
    for path in src tests examples crates README.md LICENSE; do
        ln -sfn "../../$path" "$shadow/$path"
    done
    ln -sfn .. "$shadow/tmp"

    if [[ ! -f "$shadow/.source-hash" ]] || [[ "$(<"$shadow/.source-hash")" != "$source_hash" ]]; then
        awk '
            $0 == "#[patch.crates-io]" { print substr($0, 2); next }
            $0 ~ /^#wasmtime(-wasi|-wasi-http|-wizer)? = / { print substr($0, 2); next }
            { print }
        ' Cargo.toml > "$shadow/Cargo.toml"
        cp Cargo.lock "$shadow/Cargo.lock"

        if ! grep -q '^\[patch\.crates-io\]$' "$shadow/Cargo.toml"; then
            echo "Could not activate the Golem Wasmtime patch in the P2 shadow manifest." >&2
            exit 1
        fi
        for package in wasmtime wasmtime-wasi wasmtime-wasi-http wasmtime-wizer; do
            if ! grep -q "^$package = { git = " "$shadow/Cargo.toml"; then
                echo "Missing Golem fork patch for '$package' in the root manifest." >&2
                exit 1
            fi
        done

        if ! cargo metadata \
            --quiet \
            --manifest-path "$shadow/Cargo.toml" \
            --format-version 1 \
            >/dev/null
        then
            echo "Failed to resolve the P2 shadow workspace." >&2
            echo "Retry with WASM_RQUICKJS_DEV_ONLINE=1 if the fork or dependencies are not cached." >&2
            exit 1
        fi
        printf '%s\n' "$source_hash" > "$shadow/.source-hash"
    fi

    features="use-golem-wasmtime,wasm-rquickjs/external-skeleton"
}

if [[ "$target" == p2 ]]; then
    prepare_p2_workspace
else
    export WASM_RQUICKJS_TEST_TARGET=p3
fi

test_r_args=(--report-time)
if [[ "$mode" == quick ]]; then
    export WASM_RQUICKJS_TEST_UNOPTIMIZED=1
    test_r_args+=(--test-threads 1)
else
    export WASM_RQUICKJS_TEST_PRIME_WASMTIME_CACHE=1
    export WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE=1
    test_r_args+=(--test-threads 8)
fi

if [[ "$target" == p2 ]]; then
    exec cargo test \
        --manifest-path "$repo_root/tmp/p2-dev-workspace/Cargo.toml" \
        --target-dir "$repo_root/target" \
        --test "$test_target" \
        --features "$features" \
        -- "$filter" \
        "${test_r_args[@]}" \
        "$@"
else
    exec cargo test \
        --target-dir "$repo_root/target" \
        --test "$test_target" \
        --features "$features" \
        -- "$filter" \
        "${test_r_args[@]}" \
        "$@"
fi

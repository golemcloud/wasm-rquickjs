#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: tools/dev-test.sh <p2|p3> <fast-start|fast-run|standard> <test-target> <filter> [test-r args...]

Examples:
  tools/dev-test.sh p2 fast-start runtime module_resolution::esm_package_map_edge_cases
  tools/dev-test.sh p2 fast-run runtime module_resolution::esm_
  tools/dev-test.sh p3 standard node_compat es_module__test_esm_pkgname_mjs
EOF
}

if [[ $# -lt 4 ]]; then
    usage >&2
    exit 2
fi

target=$1
profile=$2
test_target=$3
filter=$4
shift 4

test_threads_overridden=false
for arg in "$@"; do
    case "$arg" in
        --test-threads | --test-threads=*)
            test_threads_overridden=true
            ;;
    esac
done

case "$target" in
    p2 | p3) ;;
    *)
        echo "Unknown target '$target'; expected p2 or p3." >&2
        exit 2
        ;;
esac

case "$profile" in
    fast-start | fast-run | standard) ;;
    *)
        echo "Unknown profile '$profile'; expected fast-start, fast-run, or standard." >&2
        exit 2
        ;;
esac

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

unset WASM_RQUICKJS_TEST_ARTIFACT_CACHE
unset WASM_RQUICKJS_TEST_DROP_CACHE
unset WASM_RQUICKJS_TEST_LOCKED_BUILDS
unset WASM_RQUICKJS_TEST_PRECOMPILE_COMPONENT
unset WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE
unset WASM_RQUICKJS_TEST_TARGET
unset WASM_RQUICKJS_TEST_UNOPTIMIZED
unset WASM_RQUICKJS_TEST_WASMTIME_CACHE
unset CARGO_NET_OFFLINE

features=""
test_r_args=()

case "$profile" in
    fast-start)
        export WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1
        export WASM_RQUICKJS_TEST_LOCKED_BUILDS=1
        export WASM_RQUICKJS_TEST_UNOPTIMIZED=1
        export WASM_RQUICKJS_TEST_WASMTIME_CACHE=1
        features="wasm-rquickjs/external-skeleton"
        test_r_args+=(--report-time)
        if [[ "$test_threads_overridden" == false ]]; then
            test_r_args+=(--test-threads 1)
        fi
        ;;
    fast-run)
        export WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1
        export WASM_RQUICKJS_TEST_LOCKED_BUILDS=1
        export WASM_RQUICKJS_TEST_PRECOMPILE_COMPONENT=1
        export WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE=1
        export WASM_RQUICKJS_TEST_WASMTIME_CACHE=1
        features="wasm-rquickjs/external-skeleton"
        test_r_args+=(--report-time)
        if [[ "$test_threads_overridden" == false ]]; then
            test_r_args+=(--test-threads 8)
        fi
        ;;
    standard) ;;
esac

prepare_p2_workspace() {
    local shadow="$repo_root/tmp/p2-dev-workspace"
    local source_hash
    local dependency_files=(
        Cargo.toml
        Cargo.lock
        crates/golem-context/Cargo.toml
        crates/golem-websocket/Cargo.toml
        crates/wasi-logging/Cargo.toml
        crates/wasm-rquickjs/Cargo.toml
        crates/wasm-rquickjs/skeleton/Cargo.toml_
        crates/wasm-rquickjs/skeleton/Cargo.lock
    )
    source_hash=$(git hash-object "${dependency_files[@]}" | git hash-object --stdin)

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
            exit 1
        fi
        printf '%s\n' "$source_hash" > "$shadow/.source-hash"
    fi

    features="use-golem-wasmtime,wasm-rquickjs/external-skeleton"
}

if [[ "$target" == p2 ]]; then
    prepare_p2_workspace
    if [[ -n "$features" ]]; then
        features="use-golem-wasmtime,$features"
    else
        features="use-golem-wasmtime"
    fi
else
    export WASM_RQUICKJS_TEST_TARGET=p3
fi

if [[ "$target" == p2 ]]; then
    cargo_command=(
        cargo test
        --manifest-path "$repo_root/tmp/p2-dev-workspace/Cargo.toml"
        --target-dir "$repo_root/target"
    )
else
    cargo_command=(cargo test --target-dir "$repo_root/target")
fi

if [[ "$profile" != standard ]]; then
    cargo_command+=(--locked)
fi
cargo_command+=(--test "$test_target")
if [[ -n "$features" ]]; then
    cargo_command+=(--features "$features")
fi
cargo_command+=(-- "$filter")
if ((${#test_r_args[@]})); then
    cargo_command+=("${test_r_args[@]}")
fi
cargo_command+=("$@")
exec "${cargo_command[@]}"

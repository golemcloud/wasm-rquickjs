#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
results_dir="$repo_root/tests/typescript_transform_latency/results"

if [ "${1:-}" = "--check" ]; then
    cd "$repo_root"
    TYPESCRIPT_TRANSFORM_LATENCY_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh p2 standard typescript_transform_latency ""
    exit 0
fi

platform=$(node -p 'process.platform')
arch=$(node -p 'process.arch')
case "$platform" in
    darwin) platform=macos ;;
    win32) platform=windows ;;
esac
case "$arch" in
    arm64) arch=aarch64 ;;
    x64) arch=x86_64 ;;
esac

mkdir -p "$results_dir"
for target in p2 p3; do
    for mode in strip transform; do
        report="$results_dir/$(date +%Y-%m-%d)-$target-$mode-$platform-$arch.json"
        (
            cd "$repo_root"
            TYPESCRIPT_TRANSFORM_LATENCY_MEASURE=1 \
            TYPESCRIPT_TRANSFORM_LATENCY_MODE="$mode" \
            TYPESCRIPT_TRANSFORM_LATENCY_REPORT="$report" \
            TYPESCRIPT_TRANSFORM_LATENCY_SOURCE_ROOT="$repo_root" \
            tools/dev-test.sh "$target" standard typescript_transform_latency ""
        )
    done
done

(
    cd "$repo_root"
    TYPESCRIPT_TRANSFORM_LATENCY_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh p2 standard typescript_transform_latency ""
)

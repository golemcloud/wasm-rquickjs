#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
suite_dir="$repo_root/tests/agentic_ts"
results_dir="$suite_dir/results"
iterations=${AGENTIC_TS_ITERATIONS:-5}

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

node_version=$(node -p 'process.versions.node')
npm_version=$(npm --version)
if [ "$node_version" != "22.14.0" ] || [ "$npm_version" != "10.9.2" ]; then
    echo "agentic_ts requires Node 22.14.0/npm 10.9.2; found $node_version/$npm_version" >&2
    exit 1
fi

if [ ! -f "$suite_dir/node_modules/typescript/lib/tsc.js" ]; then
    echo "run npm ci in tests/agentic_ts first" >&2
    exit 1
fi

mkdir -p "$results_dir"
for target in p2 p3; do
    report="$results_dir/$(date +%Y-%m-%d)-$target-$platform-$arch.json"
    (
        cd "$repo_root"
        if [ "${1:-}" = "--check" ]; then
            AGENTIC_TS_REPORT_TO_CHECK="$report" \
            AGENTIC_TS_SOURCE_ROOT="$repo_root" \
            tools/dev-test.sh "$target" standard agentic_ts ""
        else
            AGENTIC_TS_ITERATIONS="$iterations" \
            AGENTIC_TS_REPORT="$report" \
            AGENTIC_TS_SOURCE_ROOT="$repo_root" \
            tools/dev-test.sh "$target" standard agentic_ts ""
        fi
    )
done

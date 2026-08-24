#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
suite_dir="$repo_root/tests/agentic_ts"
results_dir="$suite_dir/results"
iterations=${AGENTIC_TS_ITERATIONS:-5}

if [ "${1:-}" = "--check" ]; then
    (
        cd "$repo_root"
        AGENTIC_TS_VALIDATE_REPORTS=1 \
        AGENTIC_TS_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh p2 standard agentic_ts ""
    )
    exit 0
fi

if [ "${1:-}" = "--check-current" ]; then
    shift
    if [ "$#" -eq 0 ]; then
        echo "usage: tests/agentic_ts/run.sh --check-current <report>..." >&2
        exit 2
    fi
    reports_to_check=$(printf '%s\n' "$@")
    (
        cd "$repo_root"
        AGENTIC_TS_VALIDATE_REPORTS=1 \
        AGENTIC_TS_REPORTS_TO_CHECK="$reports_to_check" \
        AGENTIC_TS_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh p2 standard agentic_ts ""
    )
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

node_version=$(node -p 'process.versions.node')
npm_version=$(npm --version)
if [ "$node_version" != "22.14.0" ] || [ "$npm_version" != "10.9.2" ]; then
    echo "agentic_ts requires Node 22.14.0/npm 10.9.2; found $node_version/$npm_version" >&2
    exit 1
fi

(
    cd "$suite_dir"
    npm ci --ignore-scripts --no-audit --no-fund
)

mkdir -p "$results_dir"
generated_reports=""
for target in p2 p3; do
    report="$results_dir/$(date +%Y-%m-%d)-$target-$platform-$arch.json"
    (
        cd "$repo_root"
        AGENTIC_TS_ITERATIONS="$iterations" \
        AGENTIC_TS_REPORT="$report" \
        AGENTIC_TS_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh "$target" standard agentic_ts ""
    )
    generated_reports="${generated_reports}${report}\n"
done

reports_to_check=$(printf '%b' "$generated_reports")
(
    cd "$repo_root"
    AGENTIC_TS_VALIDATE_REPORTS=1 \
    AGENTIC_TS_REPORTS_TO_CHECK="$reports_to_check" \
    AGENTIC_TS_SOURCE_ROOT="$repo_root" \
    tools/dev-test.sh p2 standard agentic_ts ""
)

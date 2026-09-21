#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
results_dir="$repo_root/tests/esm_module_load_phases/results"
patch_rel="tests/esm_module_load_phases/2026-09-21-instrumentation.patch"

if [ "${1:-}" = "--check" ]; then
    cd "$repo_root"
    tools/dev-test.sh p2 standard esm_module_load_phases ""
    exit 0
fi

target=${1:-}
case "$target" in
    p2|p3) ;;
    *) echo "usage: $0 <p2|p3|--check>" >&2; exit 2 ;;
esac

cd "$repo_root"
git diff --quiet --exit-code
git diff --cached --quiet --exit-code
base_revision=$(git rev-parse HEAD)
worktree_parent=$(mktemp -d "${TMPDIR:-/tmp}/esm-module-load-phases.XXXXXX")
worktree="$worktree_parent/source"

cleanup() {
    git -C "$repo_root" worktree remove --force "$worktree" >/dev/null 2>&1 || true
    rmdir "$worktree_parent" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

git worktree add --detach "$worktree" "$base_revision"
patch_file="$worktree/$patch_rel"
git -C "$worktree" apply --check "$patch_file"
git -C "$worktree" apply "$patch_file"

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
default_report="$results_dir/$(date +%Y-%m-%d)-$target-$platform-$arch.json"
report=${ESM_MODULE_LOAD_PHASES_REPORT:-$default_report}
(
    cd "$worktree"
    ESM_MODULE_LOAD_PHASES_MEASURE=1 \
    ESM_MODULE_LOAD_PHASES_BASE_REVISION="$base_revision" \
    ESM_MODULE_LOAD_PHASES_PATCH_FILE="$patch_file" \
    ESM_MODULE_LOAD_PHASES_REPORT="$report" \
        tools/dev-test.sh "$target" standard esm_module_load_phases ""
)

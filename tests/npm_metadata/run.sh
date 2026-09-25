#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
suite_dir="$repo_root/tests/npm_metadata"
results_dir="$suite_dir/results"
iterations=${NPM_METADATA_ITERATIONS:-5}

if [ "${1:-}" = "--check" ]; then
    (
        cd "$repo_root"
        NPM_METADATA_VALIDATE_REPORTS=1 \
        NPM_METADATA_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh p2 standard npm_metadata ""
    )
    exit 0
fi

if [ "${1:-}" = "--check-current" ]; then
    shift
    if [ "$#" -eq 0 ]; then
        echo "usage: tests/npm_metadata/run.sh --check-current <report>..." >&2
        exit 2
    fi

    manifest="$results_dir/current-reports.txt"
    source_ref=
    for report in "$@"; do
        manifest_report=${report#"$repo_root"/}
        manifest_report=${manifest_report#./}
        manifest_entry=$(awk -v report="$manifest_report" '$2 == report { print $0 }' "$manifest")
        if [ -z "$manifest_entry" ] || [ "$(printf '%s\n' "$manifest_entry" | wc -l | tr -d ' ')" -ne 1 ]; then
            echo "current report is not named exactly once in $manifest: $manifest_report" >&2
            exit 2
        fi
        report_source_ref=${manifest_entry%% *}
        json_source_ref=$(jq -er '.environment.commitHint' "$report") || {
            echo "current report has no commit hint: $report" >&2
            exit 2
        }
        if [ "$json_source_ref" != "$report_source_ref" ]; then
            echo "current report source does not match $manifest: $report" >&2
            exit 2
        fi
        if [ -n "$source_ref" ] && [ "$source_ref" != "$report_source_ref" ]; then
            echo "current reports name different source revisions" >&2
            exit 2
        fi
        source_ref=$report_source_ref
    done
    if ! git -C "$repo_root" cat-file -e "$source_ref^{commit}" 2>/dev/null; then
        echo "current report source commit is unavailable: $source_ref" >&2
        exit 2
    fi

    source_parent=$(mktemp -d "${TMPDIR:-/tmp}/npm-metadata-current.XXXXXX")
    source_root="$source_parent/source"
    cleanup_current_source() {
        git -C "$repo_root" worktree remove --force "$source_root" >/dev/null 2>&1 || true
        rmdir "$source_parent" >/dev/null 2>&1 || true
    }
    trap cleanup_current_source EXIT HUP INT TERM
    git -C "$repo_root" worktree add --quiet --detach "$source_root" "$source_ref"

    reports_to_check=$(printf '%s\n' "$@")
    (
        cd "$repo_root"
        NPM_METADATA_VALIDATE_REPORTS=1 \
        NPM_METADATA_REPORTS_TO_CHECK="$reports_to_check" \
        NPM_METADATA_SOURCE_ROOT="$source_root" \
        tools/dev-test.sh p2 standard npm_metadata ""
    )
    exit 0
fi

if [ "${1:-}" != "--release" ] || [ "$#" -ne 1 ]; then
    echo "usage: tests/npm_metadata/run.sh --release|--check|--check-current <report>..." >&2
    exit 2
fi

node_overrides=
for variable in NODE_COMPILE_CACHE NODE_DEBUG NODE_DEBUG_NATIVE NODE_ENV NODE_INSPECT_RESUME_ON_START NODE_OPTIONS NODE_PATH NODE_PENDING_DEPRECATION; do
    if printenv "$variable" >/dev/null 2>&1; then
        node_overrides="${node_overrides}${node_overrides:+ }$variable"
    fi
done
if [ -n "$node_overrides" ]; then
    echo "release measurement rejects inherited Node configuration: $node_overrides" >&2
    exit 2
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
    echo "npm_metadata requires Node 22.14.0/npm 10.9.2; found $node_version/$npm_version" >&2
    exit 1
fi

mkdir -p "$results_dir"
measurement_date=$(date +%Y-%m-%d)
generated_reports=""
for target in p2 p3; do
    report="$results_dir/${measurement_date}-release-$target-$platform-$arch.json"
    (
        cd "$repo_root"
        NPM_METADATA_RUN=1 \
        NPM_METADATA_RELEASE_BASELINE=1 \
        NPM_METADATA_ITERATIONS="$iterations" \
        NPM_METADATA_REPORT="$report" \
        NPM_METADATA_SOURCE_ROOT="$repo_root" \
        tools/dev-test.sh "$target" release npm_metadata ""
    )
    generated_reports="${generated_reports}${report}\n"
done

reports_to_check=$(printf '%b' "$generated_reports")
(
    cd "$repo_root"
    NPM_METADATA_VALIDATE_REPORTS=1 \
    NPM_METADATA_ALLOW_UNTRACKED_REPORTS=1 \
    NPM_METADATA_REPORTS_TO_CHECK="$reports_to_check" \
    NPM_METADATA_SOURCE_ROOT="$repo_root" \
    tools/dev-test.sh p2 standard npm_metadata ""
)

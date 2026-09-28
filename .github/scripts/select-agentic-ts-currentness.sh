#!/usr/bin/env bash
set -euo pipefail

event_name=${1:?usage: select-agentic-ts-currentness.sh <event-name> <push-before> [pr-head]}
push_before=${2:-}
expected_pr_head=${3:-}
source_ref=$(git rev-parse HEAD)
diff_base=

case "$event_name" in
    pull_request)
        if [[ -z "$expected_pr_head" ]]; then
            echo "pull-request head SHA is missing" >&2
            exit 1
        fi
        read -r -a head_commit <<<"$(git rev-list --parents -n 1 HEAD)"
        if [[ ${#head_commit[@]} -ne 3 ]]; then
            echo "pull-request checkout is not a two-parent synthetic merge" >&2
            exit 1
        fi
        source_ref=$(git rev-parse HEAD^2)
        if [[ "$source_ref" != "$(git rev-parse "$expected_pr_head")" ]]; then
            echo "synthetic merge second parent does not match the pull-request head" >&2
            exit 1
        fi
        diff_base=HEAD^1
        ;;
    push)
        if [[ -n "$push_before" && ! "$push_before" =~ ^0+$ ]]; then
            if ! git cat-file -e "$push_before^{commit}" 2>/dev/null; then
                git fetch --no-tags --depth=1 origin "$push_before" >&2 || true
            fi
            if ! git cat-file -e "$push_before^{commit}" 2>/dev/null; then
                echo "push before commit is unavailable after fetch: $push_before" >&2
                exit 1
            fi
            diff_base=$push_before

            read -r -a head_commit <<<"$(git rev-list --parents -n 1 HEAD)"
            if [[ ${#head_commit[@]} -eq 3 \
                && "$(git rev-parse HEAD^1)" == "$(git rev-parse "$push_before")" ]]; then
                # A normal PR merge combines an already-advanced main tree with
                # the exact measured PR tree. Validate newly introduced reports
                # against that PR tree, not unrelated first-parent changes.
                diff_base=HEAD^1
                source_ref=$(git rev-parse HEAD^2)
            fi
        fi
        ;;
    *)
        echo "unsupported GitHub event: $event_name" >&2
        exit 1
        ;;
esac

reports_to_check=()
reports_count=0
if [[ -n "$diff_base" ]]; then
    report_list=$(mktemp)
    trap 'rm -f "$report_list"' EXIT
    if ! git diff --name-only --diff-filter=ACMR "$diff_base" HEAD \
        -- 'tests/agentic_ts/results/*.json' >"$report_list"; then
        echo "failed to select changed agentic TypeScript reports" >&2
        exit 1
    fi
    while IFS= read -r report; do
        reports_to_check+=("$report")
        reports_count=$((reports_count + 1))
    done <"$report_list"
fi

if [[ "$event_name" == push && $reports_count -gt 0 ]]; then
    read -r -a head_commit <<<"$(git rev-list --parents -n 1 HEAD)"
    if [[ ${#head_commit[@]} -gt 2 \
        && "$(git rev-parse HEAD^1)" != "$(git rev-parse "$push_before")" ]]; then
        echo "changed reports span a push whose merge source is ambiguous" >&2
        exit 1
    fi
fi

echo "source-ref=$source_ref"
echo "reports-to-check<<AGENTIC_TS_REPORTS"
if [[ $reports_count -gt 0 ]]; then
    printf '%s\n' "${reports_to_check[@]}"
fi
echo "AGENTIC_TS_REPORTS"

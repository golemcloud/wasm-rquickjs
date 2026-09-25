#!/usr/bin/env bash
set -euo pipefail

event_name=${1:?usage: select-agentic-ts-currentness.sh <event-name> <push-before> [pr-head]}
push_before=${2:-}
expected_pr_head=${3:-}
event_source_ref=$(git rev-parse HEAD)
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
        event_source_ref=$(git rev-parse HEAD^2)
        if [[ "$event_source_ref" != "$(git rev-parse "$expected_pr_head")" ]]; then
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
                # the reviewed PR tree. Select report artifacts from that PR
                # side, not unrelated first-parent changes.
                diff_base=HEAD^1
                event_source_ref=$(git rev-parse HEAD^2)
            fi
        fi
        ;;
    *)
        echo "unsupported GitHub event: $event_name" >&2
        exit 1
        ;;
esac

agentic_manifest=tests/agentic_ts/results/current-reports.txt
npm_manifest=tests/npm_metadata/results/current-reports.txt

validate_manifest() {
    local manifest=$1
    local expected_prefix=$2
    local source_ref
    local report
    local report_source_ref
    local extra
    local manifest_source_ref=
    local seen=
    local reports_count=0
    local p2_count=0
    local p3_count=0
    local p2_report=
    local p3_report=
    while read -r source_ref report extra; do
        if [[ ! "$source_ref" =~ ^[0-9a-f]{40}$ || -n "$extra" \
            || -z "$report" || "$report" != "$expected_prefix"*.json ]]; then
            echo "invalid current report entry in $manifest: $source_ref $report $extra" >&2
            exit 1
        fi
        if [[ ! -f "$report" ]]; then
            echo "current report does not exist: $report" >&2
            exit 1
        fi
        report_source_ref=$(jq -er '.environment.commitHint' "$report") || {
            echo "current report has no commit hint: $report" >&2
            exit 1
        }
        if [[ "$report_source_ref" != "$source_ref" ]]; then
            echo "current report source does not match $manifest: $report" >&2
            exit 1
        fi
        if grep -Fqx "$report" <<<"$seen"; then
            echo "duplicate current report in $manifest: $report" >&2
            exit 1
        fi
        if [[ -n "$manifest_source_ref" && "$source_ref" != "$manifest_source_ref" ]]; then
            echo "current reports in $manifest name different source revisions" >&2
            exit 1
        fi
        manifest_source_ref=$source_ref
        seen="${seen}${seen:+$'\n'}$report"
        reports_count=$((reports_count + 1))
        if [[ "$report" == *-p2-* ]]; then
            p2_count=$((p2_count + 1))
            p2_report=$report
        fi
        if [[ "$report" == *-p3-* ]]; then
            p3_count=$((p3_count + 1))
            p3_report=$report
        fi
    done <"$manifest"
    if [[ $reports_count -ne 2 || $p2_count -ne 1 || $p3_count -ne 1 ]]; then
        echo "current report manifest must name exactly one P2/P3 pair: $manifest" >&2
        exit 1
    fi
    if [[ "${p2_report/-p2-/-p3-}" != "$p3_report" ]]; then
        echo "current report manifest does not name a companion P2/P3 pair: $manifest" >&2
        exit 1
    fi
    if ! git cat-file -e "$manifest_source_ref^{commit}" 2>/dev/null; then
        git fetch --no-tags --depth=1 origin "$manifest_source_ref" >&2 || true
    fi
    if ! git cat-file -e "$manifest_source_ref^{commit}" 2>/dev/null; then
        echo "current report source commit is unavailable: $manifest_source_ref" >&2
        exit 1
    fi
    if ! git merge-base --is-ancestor "$manifest_source_ref" HEAD; then
        echo "current report source is not an ancestor of the checked-out source: $manifest_source_ref" >&2
        exit 1
    fi
    printf '%s\n' "$manifest_source_ref"
}

agentic_source_ref=$(validate_manifest "$agentic_manifest" tests/agentic_ts/results/)
npm_source_ref=$(validate_manifest "$npm_manifest" tests/npm_metadata/results/)

manifest_contains() {
    local manifest=$1
    local expected_report=$2
    local source_ref
    local report
    while read -r source_ref report; do
        if [[ "$report" == "$expected_report" ]]; then
            return 0
        fi
    done <"$manifest"
    return 1
}

agentic_reports_to_check=()
npm_reports_to_check=()
changed_reports_count=0
if [[ -n "$diff_base" ]]; then
    changed_paths=$(mktemp)
    report_candidates=$(mktemp)
    trap 'rm -f "$changed_paths" "$report_candidates"' EXIT
    if ! git diff --name-only --diff-filter=ACMR "$diff_base" HEAD \
        -- 'tests/agentic_ts/results/*.json' 'tests/npm_metadata/results/*.json' \
        "$agentic_manifest" "$npm_manifest" >"$changed_paths"; then
        echo "failed to select changed performance reports" >&2
        exit 1
    fi
    while IFS= read -r path; do
        case "$path" in
            "$agentic_manifest")
                while read -r _ report; do
                    printf '%s\n' "$report" >>"$report_candidates"
                done <"$agentic_manifest"
                changed_reports_count=$((changed_reports_count + 1))
                ;;
            "$npm_manifest")
                while read -r _ report; do
                    printf '%s\n' "$report" >>"$report_candidates"
                done <"$npm_manifest"
                changed_reports_count=$((changed_reports_count + 1))
                ;;
            tests/agentic_ts/results/*.json|tests/npm_metadata/results/*.json)
                printf '%s\n' "$path" >>"$report_candidates"
                changed_reports_count=$((changed_reports_count + 1))
                ;;
            *)
                echo "unexpected currentness input path: $path" >&2
                exit 1
                ;;
        esac
    done <"$changed_paths"
    sort -u -o "$report_candidates" "$report_candidates"
    while IFS= read -r report; do
        case "$report" in
            tests/agentic_ts/results/*.json)
                if manifest_contains "$agentic_manifest" "$report"; then
                    agentic_reports_to_check+=("$report")
                fi
                ;;
            tests/npm_metadata/results/*.json)
                if manifest_contains "$npm_manifest" "$report"; then
                    npm_reports_to_check+=("$report")
                fi
                ;;
            *)
                echo "unexpected performance report path: $report" >&2
                exit 1
                ;;
        esac
    done <"$report_candidates"
fi

if [[ "$event_name" == push && $changed_reports_count -gt 0 ]]; then
    read -r -a head_commit <<<"$(git rev-list --parents -n 1 HEAD)"
    if [[ ${#head_commit[@]} -gt 2 \
        && "$(git rev-parse HEAD^1)" != "$(git rev-parse "$push_before")" ]]; then
        echo "changed reports span a push whose merge source is ambiguous" >&2
        exit 1
    fi
fi

echo "source-ref=$event_source_ref"
echo "agentic-source-ref=$agentic_source_ref"
echo "npm-source-ref=$npm_source_ref"
echo "reports-to-check<<AGENTIC_TS_REPORTS"
if [[ ${#agentic_reports_to_check[@]} -gt 0 ]]; then
    printf '%s\n' "${agentic_reports_to_check[@]}"
fi
echo "AGENTIC_TS_REPORTS"
echo "npm-reports-to-check<<NPM_METADATA_REPORTS"
if [[ ${#npm_reports_to_check[@]} -gt 0 ]]; then
    printf '%s\n' "${npm_reports_to_check[@]}"
fi
echo "NPM_METADATA_REPORTS"

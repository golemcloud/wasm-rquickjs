#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
selector="$repo_root/.github/scripts/select-agentic-ts-currentness.sh"
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT

git -C "$fixture" init -q -b main
git -C "$fixture" config user.email ci-test@example.invalid
git -C "$fixture" config user.name 'CI contract test'
mkdir -p "$fixture/tests/agentic_ts/results"
mkdir -p "$fixture/tests/npm_metadata/results"
printf 'base\n' >"$fixture/build-input.txt"
git -C "$fixture" add build-input.txt
git -C "$fixture" commit -qm base-source
base_source=$(git -C "$fixture" rev-parse HEAD)
printf '{"environment":{"commitHint":"%s"}}\n' "$base_source" \
    >"$fixture/tests/agentic_ts/results/base-p2-report.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$base_source" \
    >"$fixture/tests/agentic_ts/results/base-p3-report.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$base_source" \
    >"$fixture/tests/npm_metadata/results/base-p2-report.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$base_source" \
    >"$fixture/tests/npm_metadata/results/base-p3-report.json"
printf '%s %s\n' "$base_source" tests/agentic_ts/results/base-p2-report.json \
    "$base_source" tests/agentic_ts/results/base-p3-report.json \
    >"$fixture/tests/agentic_ts/results/current-reports.txt"
printf '%s %s\n' "$base_source" tests/npm_metadata/results/base-p2-report.json \
    "$base_source" tests/npm_metadata/results/base-p3-report.json \
    >"$fixture/tests/npm_metadata/results/current-reports.txt"
git -C "$fixture" add tests
git -C "$fixture" commit -qm base
base=$(git -C "$fixture" rev-parse HEAD)

git -C "$fixture" switch -qc report-branch
printf 'report source\n' >"$fixture/report-source.txt"
git -C "$fixture" add report-source.txt
git -C "$fixture" commit -qm report-source
report_source=$(git -C "$fixture" rev-parse HEAD)
printf '{"environment":{"commitHint":"%s"}}\n' "$report_source" \
    >"$fixture/tests/agentic_ts/results/report-p2-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$report_source" \
    >"$fixture/tests/agentic_ts/results/report-p3-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$report_source" \
    >"$fixture/tests/npm_metadata/results/report-p2-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$report_source" \
    >"$fixture/tests/npm_metadata/results/report-p3-result.json"
printf '%s %s\n' "$report_source" tests/agentic_ts/results/report-p2-result.json \
    "$report_source" tests/agentic_ts/results/report-p3-result.json \
    >"$fixture/tests/agentic_ts/results/current-reports.txt"
printf '%s %s\n' "$report_source" tests/npm_metadata/results/report-p2-result.json \
    "$report_source" tests/npm_metadata/results/report-p3-result.json \
    >"$fixture/tests/npm_metadata/results/current-reports.txt"
git -C "$fixture" add tests
git -C "$fixture" commit -qm report
report_head=$(git -C "$fixture" rev-parse HEAD)

git -C "$fixture" switch -q main
printf 'concurrent main change\n' >>"$fixture/build-input.txt"
git -C "$fixture" commit -qam concurrent-main
main_parent=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" merge -q --no-ff report-branch -m merge

assert_plan() {
    local event_name=$1
    local before=$2
    local expected_event_source=$3
    local expected_measurement_source=$4
    local expected_agentic_p2=$5
    local expected_agentic_p3=$6
    local expected_npm_p2=$7
    local expected_npm_p3=$8
    local expected_pr_head=${9:-}
    local plan
    plan=$(cd "$fixture" && "$selector" "$event_name" "$before" "$expected_pr_head")
    grep -Fxq "source-ref=$expected_event_source" <<<"$plan"
    grep -Fxq "agentic-source-ref=$expected_measurement_source" <<<"$plan"
    grep -Fxq "npm-source-ref=$expected_measurement_source" <<<"$plan"
    for report in "$expected_agentic_p2" "$expected_agentic_p3" \
        "$expected_npm_p2" "$expected_npm_p3"; do
        if [[ -n "$report" ]]; then
            grep -Fxq "$report" <<<"$plan"
        fi
    done
}

assert_no_report_selection() {
    local plan=$1
    [[ "$plan" == *$'reports-to-check<<AGENTIC_TS_REPORTS\nAGENTIC_TS_REPORTS'* ]]
    [[ "$plan" == *$'npm-reports-to-check<<NPM_METADATA_REPORTS\nNPM_METADATA_REPORTS'* ]]
}

assert_plan pull_request '' "$report_head" "$report_source" \
    tests/agentic_ts/results/report-p2-result.json \
    tests/agentic_ts/results/report-p3-result.json \
    tests/npm_metadata/results/report-p2-result.json \
    tests/npm_metadata/results/report-p3-result.json "$report_head"
assert_plan push "$main_parent" "$report_head" "$report_source" \
    tests/agentic_ts/results/report-p2-result.json \
    tests/agentic_ts/results/report-p3-result.json \
    tests/npm_metadata/results/report-p2-result.json \
    tests/npm_metadata/results/report-p3-result.json
[[ "$(git -C "$fixture" rev-parse HEAD^2)" == "$report_head" ]]
if (cd "$fixture" && "$selector" pull_request '' "$base") >/dev/null 2>&1; then
    echo "mismatched pull-request head unexpectedly passed" >&2
    exit 1
fi
if (cd "$fixture" && "$selector" pull_request '') >/dev/null 2>&1; then
    echo "missing pull-request head unexpectedly passed" >&2
    exit 1
fi

initial_merge_head=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" switch -qc stale-pr
printf 'stale pull request change\n' >"$fixture/stale-pr.txt"
git -C "$fixture" add stale-pr.txt
git -C "$fixture" commit -qm stale-pr
stale_pr_head=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" switch -q main
printf 'new main report source\n' >"$fixture/new-main-report-source.txt"
git -C "$fixture" add new-main-report-source.txt
git -C "$fixture" commit -qm new-main-report-source
new_main_report_source=$(git -C "$fixture" rev-parse HEAD)
for report in \
    tests/agentic_ts/results/report-p2-result.json \
    tests/agentic_ts/results/report-p3-result.json \
    tests/npm_metadata/results/report-p2-result.json \
    tests/npm_metadata/results/report-p3-result.json; do
    printf '{"environment":{"commitHint":"%s"}}\n' "$new_main_report_source" \
        >"$fixture/$report"
done
printf '%s %s\n' \
    "$new_main_report_source" tests/agentic_ts/results/report-p2-result.json \
    "$new_main_report_source" tests/agentic_ts/results/report-p3-result.json \
    >"$fixture/tests/agentic_ts/results/current-reports.txt"
printf '%s %s\n' \
    "$new_main_report_source" tests/npm_metadata/results/report-p2-result.json \
    "$new_main_report_source" tests/npm_metadata/results/report-p3-result.json \
    >"$fixture/tests/npm_metadata/results/current-reports.txt"
git -C "$fixture" add tests
git -C "$fixture" commit -qm new-main-reports
new_main_head=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" merge -q --no-ff stale-pr -m stale-pr-merge
assert_plan pull_request '' "$stale_pr_head" "$new_main_report_source" '' '' '' '' \
    "$stale_pr_head"
stale_pr_plan=$(cd "$fixture" && "$selector" pull_request '' "$stale_pr_head")
assert_no_report_selection "$stale_pr_plan"
assert_plan push "$new_main_head" "$stale_pr_head" "$new_main_report_source" '' '' '' ''
stale_push_plan=$(cd "$fixture" && "$selector" push "$new_main_head")
assert_no_report_selection "$stale_push_plan"
if git -C "$fixture" merge-base --is-ancestor "$new_main_report_source" "$stale_pr_head"; then
    echo "concurrent main report source unexpectedly belongs to the stale PR" >&2
    exit 1
fi
git -C "$fixture" reset -q --hard "$initial_merge_head"

previous=$(git -C "$fixture" rev-parse HEAD)
printf 'direct source\n' >"$fixture/direct-source.txt"
git -C "$fixture" add direct-source.txt
git -C "$fixture" commit -qm direct-source
direct_source=$(git -C "$fixture" rev-parse HEAD)
printf '{"environment":{"commitHint":"%s"}}\n' "$direct_source" \
    >"$fixture/tests/agentic_ts/results/direct-p2-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$direct_source" \
    >"$fixture/tests/agentic_ts/results/direct-p3-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$direct_source" \
    >"$fixture/tests/npm_metadata/results/direct-p2-result.json"
printf '{"environment":{"commitHint":"%s"}}\n' "$direct_source" \
    >"$fixture/tests/npm_metadata/results/direct-p3-result.json"
printf '%s %s\n' "$direct_source" tests/agentic_ts/results/direct-p2-result.json \
    "$direct_source" tests/agentic_ts/results/direct-p3-result.json \
    >"$fixture/tests/agentic_ts/results/current-reports.txt"
printf '%s %s\n' "$direct_source" tests/npm_metadata/results/direct-p2-result.json \
    "$direct_source" tests/npm_metadata/results/direct-p3-result.json \
    >"$fixture/tests/npm_metadata/results/current-reports.txt"
git -C "$fixture" add tests
git -C "$fixture" commit -qm direct-push
direct_head=$(git -C "$fixture" rev-parse HEAD)
assert_plan push "$previous" "$direct_head" "$direct_source" \
    tests/agentic_ts/results/direct-p2-result.json \
    tests/agentic_ts/results/direct-p3-result.json \
    tests/npm_metadata/results/direct-p2-result.json \
    tests/npm_metadata/results/direct-p3-result.json

zero_plan=$(cd "$fixture" && "$selector" push 0000000000000000000000000000000000000000)
grep -Fqx "source-ref=$(git -C "$fixture" rev-parse HEAD)" <<<"$zero_plan"
grep -Fqx "agentic-source-ref=$direct_source" <<<"$zero_plan"
grep -Fqx "npm-source-ref=$direct_source" <<<"$zero_plan"
if grep -Fqx tests/agentic_ts/results/direct-p2-result.json <<<"$zero_plan"; then
    echo "zero-before push unexpectedly selected a current report" >&2
    exit 1
fi
if grep -Fqx tests/npm_metadata/results/direct-p2-result.json <<<"$zero_plan"; then
    echo "zero-before push unexpectedly selected a current npm report" >&2
    exit 1
fi

npm_manifest="$fixture/tests/npm_metadata/results/current-reports.txt"
printf '{"environment":{"commitHint":"%s"}}\n' "$direct_source" \
    >"$fixture/tests/npm_metadata/results/other-p3-result.json"
printf '%s %s\n' "$direct_source" tests/npm_metadata/results/direct-p2-result.json \
    "$direct_source" tests/npm_metadata/results/other-p3-result.json >"$npm_manifest"
if (cd "$fixture" && "$selector" push 0000000000000000000000000000000000000000) \
    >/dev/null 2>&1; then
    echo "mixed current-report pair unexpectedly passed" >&2
    exit 1
fi
printf '%s %s\n' "$base_source" tests/npm_metadata/results/direct-p2-result.json \
    "$base_source" tests/npm_metadata/results/direct-p3-result.json >"$npm_manifest"
if (cd "$fixture" && "$selector" push 0000000000000000000000000000000000000000) \
    >/dev/null 2>&1; then
    echo "mismatched current-report source unexpectedly passed" >&2
    exit 1
fi
printf '%s %s\n' "$direct_source" tests/npm_metadata/results/direct-p2-result.json \
    "$direct_source" tests/npm_metadata/results/direct-p3-result.json >"$npm_manifest"

historical_base=$(git -C "$fixture" rev-parse HEAD)
printf '{}\n' >"$fixture/tests/agentic_ts/results/historical-p2-result.json"
printf '{}\n' >"$fixture/tests/npm_metadata/results/historical-p2-result.json"
git -C "$fixture" add tests/agentic_ts/results/historical-p2-result.json tests/npm_metadata/results/historical-p2-result.json
git -C "$fixture" commit -qm historical-reports
historical_plan=$(cd "$fixture" && "$selector" push "$historical_base")
if grep -Fqx tests/agentic_ts/results/historical-p2-result.json <<<"$historical_plan"; then
    echo "historical agentic report unexpectedly selected for currentness" >&2
    exit 1
fi
if grep -Fqx tests/npm_metadata/results/historical-p2-result.json <<<"$historical_plan"; then
    echo "historical npm report unexpectedly selected for currentness" >&2
    exit 1
fi

git -C "$fixture" branch ambiguous-side "$previous"
git -C "$fixture" switch -q ambiguous-side
printf 'side\n' >"$fixture/side.txt"
git -C "$fixture" add side.txt
git -C "$fixture" commit -qm side
git -C "$fixture" switch -q main
git -C "$fixture" merge -q --no-ff ambiguous-side -m ambiguous-merge
if (cd "$fixture" && "$selector" push "$previous") >/dev/null 2>&1; then
    echo "ambiguous merge push unexpectedly selected a source" >&2
    exit 1
fi

main_head=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" switch -qc unrelated-report-source "$base"
printf 'unrelated report source\n' >"$fixture/unrelated-report-source.txt"
git -C "$fixture" add unrelated-report-source.txt
git -C "$fixture" commit -qm unrelated-report-source
unrelated_report_source=$(git -C "$fixture" rev-parse HEAD)
git -C "$fixture" switch -q main
for report in \
    tests/agentic_ts/results/direct-p2-result.json \
    tests/agentic_ts/results/direct-p3-result.json \
    tests/npm_metadata/results/direct-p2-result.json \
    tests/npm_metadata/results/direct-p3-result.json; do
    printf '{"environment":{"commitHint":"%s"}}\n' "$unrelated_report_source" \
        >"$fixture/$report"
done
printf '%s %s\n' \
    "$unrelated_report_source" tests/agentic_ts/results/direct-p2-result.json \
    "$unrelated_report_source" tests/agentic_ts/results/direct-p3-result.json \
    >"$fixture/tests/agentic_ts/results/current-reports.txt"
printf '%s %s\n' \
    "$unrelated_report_source" tests/npm_metadata/results/direct-p2-result.json \
    "$unrelated_report_source" tests/npm_metadata/results/direct-p3-result.json \
    >"$fixture/tests/npm_metadata/results/current-reports.txt"
if unrelated_error=$(cd "$fixture" && \
    "$selector" push 0000000000000000000000000000000000000000 2>&1); then
    echo "unrelated current-report source unexpectedly passed" >&2
    exit 1
fi
grep -Fq "current report source is not an ancestor of the checked-out source" \
    <<<"$unrelated_error"
git -C "$fixture" restore tests/agentic_ts/results tests/npm_metadata/results
[[ "$(git -C "$fixture" rev-parse HEAD)" == "$main_head" ]]

fake_bin="$fixture/fake-bin"
mkdir "$fake_bin"
real_git=$(command -v git)
printf '%s\n' \
    '#!/usr/bin/env bash' \
    'if [[ ${1:-} == fetch ]]; then exit 74; fi' \
    'if [[ ${1:-} == diff ]]; then exit 73; fi' >"$fake_bin/git"
printf 'exec %q "$@"\n' "$real_git" >>"$fake_bin/git"
chmod +x "$fake_bin/git"
if (cd "$fixture" && PATH="$fake_bin:$PATH" "$selector" push HEAD^1) >/dev/null 2>&1; then
    echo "failed git diff unexpectedly produced a validation plan" >&2
    exit 1
fi
missing_before=0000000000000000000000000000000000000001
if missing_error=$(cd "$fixture" && PATH="$fake_bin:$PATH" \
    "$selector" push "$missing_before" 2>&1); then
    echo "unresolvable push-before commit unexpectedly passed" >&2
    exit 1
fi
grep -Fq "push before commit is unavailable after fetch: $missing_before" <<<"$missing_error"

[[ "$base" != "$main_parent" ]]

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
printf 'base\n' >"$fixture/build-input.txt"
git -C "$fixture" add build-input.txt
git -C "$fixture" commit -qm base
base=$(git -C "$fixture" rev-parse HEAD)

git -C "$fixture" switch -qc report-branch
printf '{}\n' >"$fixture/tests/agentic_ts/results/report.json"
git -C "$fixture" add tests/agentic_ts/results/report.json
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
    local expected_source=$3
    local expected_report=$4
    local expected_pr_head=${5:-}
    local plan
    plan=$(cd "$fixture" && "$selector" "$event_name" "$before" "$expected_pr_head")
    grep -Fxq "source-ref=$expected_source" <<<"$plan"
    grep -Fxq "$expected_report" <<<"$plan"
}

assert_plan pull_request '' "$report_head" tests/agentic_ts/results/report.json "$report_head"
assert_plan push "$main_parent" "$report_head" tests/agentic_ts/results/report.json
[[ "$(git -C "$fixture" rev-parse HEAD^2)" == "$report_head" ]]
if (cd "$fixture" && "$selector" pull_request '' "$base") >/dev/null 2>&1; then
    echo "mismatched pull-request head unexpectedly passed" >&2
    exit 1
fi
if (cd "$fixture" && "$selector" pull_request '') >/dev/null 2>&1; then
    echo "missing pull-request head unexpectedly passed" >&2
    exit 1
fi

previous=$(git -C "$fixture" rev-parse HEAD)
printf '{}\n' >"$fixture/tests/agentic_ts/results/direct.json"
git -C "$fixture" add tests/agentic_ts/results/direct.json
git -C "$fixture" commit -qm direct-push
direct_head=$(git -C "$fixture" rev-parse HEAD)
assert_plan push "$previous" "$direct_head" tests/agentic_ts/results/direct.json

zero_plan=$(cd "$fixture" && "$selector" push 0000000000000000000000000000000000000000)
grep -Fqx "source-ref=$(git -C "$fixture" rev-parse HEAD)" <<<"$zero_plan"
if grep -Fqx tests/agentic_ts/results/direct.json <<<"$zero_plan"; then
    echo "zero-before push unexpectedly selected a current report" >&2
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

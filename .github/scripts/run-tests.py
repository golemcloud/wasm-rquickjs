"""Run a CTRF shard, retrying only demonstrated same-commit flakes once.

Usage: python3 .github/scripts/run-tests.py -- cargo test ... -- ...
No blanket timeout or hrtime retries. Each exact retry is a new process;
the testcase supplies fresh mutable state, not a reused shard instance.
"""

import copy
import json
import math
import os
from pathlib import Path
import re
import resource
import shutil
import subprocess
import sys
import time


# These cases recovered on same-commit reruns in the past two weeks. Keep this
# evidence-based list small; never turn arbitrary failures into shard retries.
ALLOWLIST = {
    "runtime::encoding::encoding",
    "runtime::pollable::await_pollable",
    "runtime::pollable::abortable_promise_not_aborted",
    "runtime::node_http::net_write_timeout_lifecycle",
    "runtime::node_http::node_http_self_connect_post",
    "runtime::node_http::node_http_response_persistence",
    "runtime::fetch::fetch_abort_releases_request",
    "runtime::fetch::fetch_abort_releases_upload",
    "runtime::fetch::fetch_abort_pending_response_body",
    "node_compat::gen_node_compat_tests::parallel__test_http_zero_length_write_js",
    # Run 38285927640: 120s timeout, then 2.7s pass on the same commit.
    "node_compat::gen_node_compat_tests::parallel__test_http_client_upload_js",
}
STATUSES = ("passed", "failed", "pending", "skipped", "other")


def number(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0


def read_reports(paths):
    if not paths:
        raise ValueError("missing CTRF reports")
    reports = []
    names = set()
    for path in paths:
        report = json.loads(path.read_text())
        if report["reportFormat"] != "CTRF":
            raise ValueError("not a CTRF report")
        results = report["results"]
        tests, summary = results["tests"], results["summary"]
        if not isinstance(tests, list) or not tests:
            raise ValueError(f"empty CTRF report: {path}")
        for test in tests:
            name = test["name"]
            if not isinstance(name, str) or not name or name in names:
                raise ValueError("missing or duplicate testcase name")
            names.add(name)
            if test["status"] not in ("passed", "failed", "skipped"):
                raise ValueError("incomplete or unsupported testcase status")
            if not number(test["duration"]):
                raise ValueError("invalid testcase duration")
            if test.get("extra") is not None and not isinstance(test["extra"], dict):
                raise ValueError("invalid testcase extra metadata")
        counts = {s: sum(t["status"] == s for t in tests) for s in STATUSES}
        counts["tests"] = len(tests)
        if any(type(summary[s]) is not int or summary[s] != count for s, count in counts.items()):
            raise ValueError("inconsistent CTRF summary")
        if not number(summary["start"]) or not number(summary["stop"]) or summary["stop"] < summary["start"]:
            raise ValueError("invalid CTRF timestamps")
        reports.append((path, report))
    return reports


def run(command, evidence):
    print("Running:", repr(command), flush=True)
    started = time.monotonic()
    # test-r writes intermediate CTRF snapshots with internally consistent
    # counts. For a failing run only its terminal stderr summary proves that
    # the suite completed rather than crashing after writing a partial snapshot.
    completed = []
    with evidence.open("w") as log:
        process = subprocess.Popen(command, stderr=subprocess.PIPE, text=True,
                                   errors="replace")
        for line in process.stderr:
            sys.stderr.write(line)
            log.write(line)
            match = re.fullmatch(
                r"test result: FAILED; (\d+) passed; (\d+) failed; (\d+) ignored; finished in [\d.]+s\n?",
                line,
            )
            if match:
                completed.append(tuple(map(int, match.groups())))
        code = process.wait()
        # Linux ru_maxrss is KiB and is the largest child high-water mark, not
        # the simultaneous RSS of all worker processes.
        print(f"CI command: {time.monotonic() - started:.3f}s; largest child peak RSS: "
              f"{resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss} KiB", flush=True)
        return code, completed


def main():
    command = sys.argv[2:]
    if sys.argv[1:2] != ["--"] or "--" not in command:
        raise ValueError("expected -- <cargo command> -- <test-r arguments>")
    prefix = command[:command.index("--")]
    target = Path("target")
    target.mkdir(exist_ok=True)
    archive = target / "ci-retries"
    if archive.exists():
        shutil.rmtree(archive)
    originals = archive / "original"
    originals.mkdir(parents=True)
    for old in target.glob("ctrf-*.json"):
        old.unlink()
    code, completed = run(command, originals / "stderr.log")  # Unchanged argv.
    paths = sorted(target.glob("ctrf-*.json"))
    for path in paths:
        shutil.copy2(path, originals / path.name)
    reports = read_reports(paths)
    failed = [(report, test) for _, report in reports
              for test in report["results"]["tests"] if test["status"] == "failed"]
    # Cargo test failures return 101. Any other failure is infrastructure, and
    # even exit 101 is not sufficient without corresponding testcase evidence.
    if (code == 0 and failed) or (code != 0 and (code != 101 or not failed)):
        raise ValueError(f"command exit {code} disagrees with testcase results")
    if failed:
        expected = sorted((r["results"]["summary"]["passed"],
                           r["results"]["summary"]["failed"],
                           r["results"]["summary"]["skipped"])
                          for _, r in reports if r["results"]["summary"]["failed"])
        if sorted(completed) != expected:
            raise ValueError("missing or inconsistent test-r completion summary")
    recovered = []
    retry_failed = False
    for report, test in failed:
        name = test["name"]
        if name not in ALLOWLIST:
            continue
        directory = archive / name.replace("::", "_")
        directory.mkdir()
        # CTRF includes the crate name, but test-r's exact filter excludes it.
        selector = name.split("::", 1)[1]
        retry_code, _ = run(prefix + ["--", "--exact", selector, "--test-threads", "1",
                                   "--report-time", "--format", "ctrf", "--logfile",
                                   str(directory / "retry.json")], directory / "stderr.log")
        try:
            retries = read_reports(sorted(directory.glob("retry-*.json")))
            cases = [t for _, r in retries for t in r["results"]["tests"]]
            if len(cases) != 1 or cases[0]["name"] != name:
                raise ValueError("retry did not execute exactly the selected testcase")
            retry = cases[0]
            if retry_code != 0 or retry["status"] != "passed":
                raise ValueError(f"retry unsuccessful (exit {retry_code})")
        except (ValueError, KeyError, TypeError, OSError) as error:
            print(f"Retry rejected for {name}: {error}", file=sys.stderr)
            retry_failed = True
            continue
        original = copy.deepcopy(test)
        test.update(status="passed", flaky=True, retries=1,
                    duration=original["duration"] + retry["duration"])
        if test.get("extra") is None:
            test["extra"] = {}
        test["extra"]["ciRetry"] = {
            "original": original, "retry": retry,
            "reports": str(directory),
        }
        # Duration represents both attempts; preserve original start and move
        # stop to the retry completion. Summary stop includes retry wall time.
        if "stop" in retry:
            test["stop"] = retry["stop"]
        summary = report["results"]["summary"]
        summary["stop"] = max(summary["stop"], retries[0][1]["results"]["summary"]["stop"])
        recovered.append(name)
        print(f"::warning title=Recovered test flake::{name} passed its one isolated retry; original evidence in {originals}")
    for path, report in reports:
        results = report["results"]
        for status in STATUSES:
            results["summary"][status] = sum(t["status"] == status for t in results["tests"])
        results["summary"]["tests"] = len(results["tests"])
        path.write_text(json.dumps(report, indent=2) + "\n")
    remaining = sum(t["status"] == "failed" for _, r in reports for t in r["results"]["tests"])
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
            summary.write(f"### Test retries\n\nRecovered: {len(recovered)}; remaining failures: {remaining}.\n")
            for name in recovered:
                summary.write(f"- `{name}` (one isolated retry)\n")
    return 1 if remaining or retry_failed else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f"Test wrapper failed: {error}", file=sys.stderr)
        sys.exit(1)

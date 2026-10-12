"""Public-CLI tests; no Cargo, network, or third-party Python dependencies."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


WRAPPER = Path(__file__).with_name("run-tests.py").resolve()
KNOWN = "runtime::encoding::encoding"
OTHER_KNOWN = "runtime::pollable::await_pollable"
UNKNOWN = "runtime::hrtime::timeout"
FAKE = r'''
import json
from pathlib import Path
import sys

args = sys.argv[1:]
config = json.loads(Path("config.json").read_text())
with open("calls.jsonl", "a") as log:
    log.write(json.dumps(args) + "\n")
retry = "--exact" in args
mode = config.get("retry_mode" if retry else "mode", "valid")
cases = config["retry" if retry else "initial"]
if retry:
    selected = args[args.index("--exact") + 1]
    # Match test-r 3.0.7: exact selectors omit the crate prefix printed in CTRF.
    cases = [c for c in cases if c[0].split("::", 1)[1] == selected]
    if mode == "wrong":
        cases = [["runtime::wrong", "passed"]]
    if mode == "extra":
        cases += [["runtime::extra", "passed"]]
logfile = Path(args[args.index("--logfile") + 1])
path = logfile.with_name(logfile.stem + "-fake.json")
path.parent.mkdir(parents=True, exist_ok=True)
tests = [dict(name=n, status=s, duration=3 if retry else 2,
              message="original failure" if s == "failed" else None,
              stdout=["evidence"], start=20 if retry else 10,
              stop=23 if retry else 12) for n, s in cases]
summary = {s: sum(t["status"] == s for t in tests)
           for s in ("passed", "failed", "pending", "skipped", "other")}
summary.update(tests=len(tests), start=20 if retry else 10,
               stop=23 if retry else 12)
if mode == "incomplete":
    summary["tests"] += 1
if mode != "missing":
    path.write_text("{" if mode == "malformed" else json.dumps({
        "reportFormat": "CTRF", "generatedBy": "test-r",
        "results": {"tool": {"name": "ctrf-rs"}, "tests": tests,
                    "summary": summary}}))
default = 101 if any(t["status"] == "failed" for t in tests) else 0
if default == 101 and mode != "snapshot":
    print(f'test result: FAILED; {summary["passed"]} passed; '
          f'{summary["failed"]} failed; {summary["skipped"]} ignored; '
          'finished in 0.002s', file=sys.stderr)
sys.exit(config.get("retry_exit" if retry else "exit", default))
'''


class WrapperTests(unittest.TestCase):
    def invoke(self, initial, retry=(), **options):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        (root / "fake.py").write_text(FAKE)
        (root / "config.json").write_text(json.dumps(dict(initial=initial, retry=retry, **options)))
        (root / "target").mkdir()
        (root / "target/ctrf-stale.json").write_text("not fresh")
        env = dict(os.environ, GITHUB_STEP_SUMMARY=str(root / "summary.md"))
        command = [sys.executable, str(root / "fake.py"), "test", "--test", "runtime",
                   "--features", "example", "--", "--format", "ctrf", "--logfile",
                   "target/ctrf.json", ":tag:group1"]
        result = subprocess.run([sys.executable, str(WRAPPER), "--", *command],
                                cwd=root, env=env, capture_output=True, text=True)
        calls = [json.loads(line) for line in (root / "calls.jsonl").read_text().splitlines()]
        self.assertEqual(calls[0], command[2:])
        self.assertFalse((root / "target/ctrf-stale.json").exists())
        return root, result, calls

    def test_success_without_retry(self):
        root, result, calls = self.invoke([[KNOWN, "passed"], [UNKNOWN, "skipped"]])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(calls), 1)
        original = (root / "target/ci-retries/original/ctrf-fake.json").read_text()
        self.assertEqual(json.loads(original), json.loads((root / "target/ctrf-fake.json").read_text()))

    def test_recovered_flake(self):
        root, result, calls = self.invoke([[KNOWN, "failed"], [UNKNOWN, "passed"]], [[KNOWN, "passed"]])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(calls[1], calls[0][:calls[0].index("--")] + [
            "--", "--exact", "encoding::encoding", "--test-threads", "1", "--report-time",
            "--format", "ctrf", "--logfile",
            "target/ci-retries/runtime_encoding_encoding/retry.json"])
        report = json.loads((root / "target/ctrf-fake.json").read_text())["results"]
        test = report["tests"][0]
        self.assertEqual((test["status"], test["flaky"], test["retries"], test["duration"]),
                         ("passed", True, 1, 5))
        self.assertEqual(test["extra"]["ciRetry"]["original"]["message"], "original failure")
        self.assertEqual(report["summary"]["passed"], 2)
        self.assertEqual(report["summary"]["failed"], 0)
        self.assertEqual(report["summary"]["stop"], 23)
        original = json.loads((root / "target/ci-retries/original/ctrf-fake.json").read_text())["results"]
        self.assertEqual(original["tests"][0]["status"], "failed")
        self.assertEqual(original["tests"][1], report["tests"][1])
        self.assertIn("::warning", result.stdout)
        self.assertIn(KNOWN, (root / "summary.md").read_text())

    def test_persistent_and_unknown_failures(self):
        for initial, retry in [([[KNOWN, "failed"]], [[KNOWN, "failed"]]),
                               ([[UNKNOWN, "failed"]], []),
                               ([[KNOWN, "failed"], [UNKNOWN, "failed"]], [[KNOWN, "passed"]])]:
            with self.subTest(initial=initial):
                root, result, calls = self.invoke(initial, retry)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(len(calls), 2 if initial[0][0] == KNOWN else 1)
                final = json.loads((root / "target/ctrf-fake.json").read_text())["results"]
                self.assertGreater(final["summary"]["failed"], 0)

    def test_one_process_per_known_case(self):
        _, result, calls = self.invoke([[KNOWN, "failed"], [OTHER_KNOWN, "failed"]],
                                      [[KNOWN, "passed"], [OTHER_KNOWN, "passed"]])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(calls), 3)
        self.assertEqual([c[c.index("--exact") + 1] for c in calls[1:]],
                         ["encoding::encoding", "pollable::await_pollable"])

    def test_bad_initial_reports_and_infrastructure(self):
        for options in [dict(mode=m) for m in ("missing", "malformed", "incomplete", "snapshot")] + [
            dict(exit=2), dict(exit=0), dict(exit=-9)]:
            with self.subTest(options=options):
                _, result, calls = self.invoke([[KNOWN, "failed"]], [[KNOWN, "passed"]], **options)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(len(calls), 1)
        _, result, calls = self.invoke([[KNOWN, "passed"]], exit=101)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 1)
        for initial in ([], [[KNOWN, "pending"]]):
            _, result, calls = self.invoke(initial)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(len(calls), 1)

    def test_invalid_retries_are_not_recovered(self):
        options_list = [dict(retry_mode=m) for m in
                        ("missing", "malformed", "incomplete", "wrong", "extra")]
        options_list += [dict(retry_exit=101), dict(retry_exit=2)]
        for options in options_list:
            with self.subTest(options=options):
                root, result, calls = self.invoke([[KNOWN, "failed"]], [[KNOWN, "passed"]], **options)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(len(calls), 2)
                test = json.loads((root / "target/ctrf-fake.json").read_text())["results"]["tests"][0]
                self.assertEqual(test["status"], "failed")
        _, result, calls = self.invoke([[KNOWN, "failed"]], [])
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 2)
        _, result, calls = self.invoke([[KNOWN, "failed"]], [[KNOWN, "failed"]], retry_exit=0)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 2)


class ReportTests(unittest.TestCase):
    def test_partial_and_report_only_reruns_preserve_latest_lane_evidence(self):
        script = WRAPPER.with_name("prepare-test-reports.py")
        with tempfile.TemporaryDirectory() as directory:
            source, output = Path(directory) / "raw", Path(directory) / "rendered"
            evidence = {}
            artifacts = []
            for lane, attempt, status in [("p2", 1, "failed"), ("p2", 2, "failed"),
                                          ("p2", 10, "passed"), ("p3", 1, "passed")]:
                shard = source / f"{lane}-report-attempt{attempt}"
                artifacts.append({"name": shard.name, "id": len(artifacts) + 1})
                shard.mkdir(parents=True)
                report = shard / "ctrf-test.json"
                report.write_text(json.dumps({"results": {"tests": [{"name": KNOWN, "status": status}]}}))
                evidence[report] = report.read_bytes()
                nested = shard / "ci-retries/original"
                nested.mkdir(parents=True)
                (nested / "ctrf-original.json").write_text("not a final result")
            result = subprocess.run([sys.executable, str(script), str(source), str(output)],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            tests = [t for path in output.glob("*/ctrf-*.json")
                     for t in json.loads(path.read_text())["results"]["tests"]]
            self.assertEqual({t["name"] for t in tests},
                             {f"p2 (attempt 10) / {KNOWN}", f"p3 (attempt 1) / {KNOWN}"})
            self.assertTrue(all(t["status"] == "passed" for t in tests))
            self.assertTrue(all(path.read_bytes() == data for path, data in evidence.items()))

            # Superseded artifacts can fail to download; never request them.
            # Paginated/mixed attempts must still retain lanes not rerun.
            pages = [{"artifacts": artifacts[:2]}, {"artifacts": artifacts[2:] + [
                {"name": "ci-test-reports-attempt99", "id": 99}]}]
            for data, expected in [
                (pages, "ids=3,4\nsingle-name=\n"),
                ([{"artifacts": artifacts[-1:]}],
                 "ids=4\nsingle-name=p3-report-attempt1\n"),
                ([{"artifacts": []}], "ids=\nsingle-name=\n"),
            ]:
                result = subprocess.run([sys.executable, str(script), "--select-artifacts"],
                                        input=json.dumps(data), capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout, expected)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Validate the dated cold path trace against the fixed npm metadata baseline."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OPERATIONS = ("version", "view", "ci")
CATEGORIES = (
    "physicalModuleProbe",
    "missingPackageJson",
    "fsRealpath",
    "cjsCanonicalization",
)
SUMMARY_KEYS = {
    "calls", "distinctPaths", "repeatCalls", "revisitedPaths", "overflowCalls", "pathLimit"
}
SAMPLE_KEYS = {
    "sequence", "operation", "registry", "cache", "success", "installed", "wallMs",
    "processCpuMs", "localHttpRequests", "counters", "pathTrace",
}


def load(name):
    return json.loads((ROOT / name).read_text())


reference = {}
for target in ("p2", "p3"):
    baseline = load(f"2026-09-18-{target}.json")
    trace = load(f"2026-09-18-trace-{target}.json")
    assert trace["schema"] == "npm-metadata-path-trace-v1"
    assert trace["target"] == target
    assert trace["node"] == baseline["node"] == "22.14.0"
    assert trace["npm"] == baseline["npm"] == "10.9.2"
    assert trace["iterations"] == 3
    assert len(trace["samples"]) == 9

    for operation in OPERATIONS:
        baseline_rows = [s for s in baseline["samples"] if
                         s["registry"] == "local" and s["cache"] == "cold"
                         and s["operation"] == operation]
        trace_rows = [s for s in trace["samples"] if s["operation"] == operation]
        assert len(baseline_rows) == len(trace_rows) == 3
        summaries = []
        for sample in trace_rows:
            assert set(sample) == SAMPLE_KEYS  # Raw paths cannot enter the report.
            assert sample["registry"] == "local" and sample["cache"] == "cold"
            assert sample["success"] is True
            assert sample["installed"] is (operation == "ci")
            assert sample["localHttpRequests"] == {"version": 0, "view": 1, "ci": 2}[operation]
            counters = sample["counters"]
            assert all("/" not in key and isinstance(value, int)
                       for key, value in counters.items())
            path_trace = sample["pathTrace"]
            assert set(path_trace) == set(CATEGORIES)
            for category, summary in path_trace.items():
                assert set(summary) == SUMMARY_KEYS
                assert all(isinstance(value, int) and value >= 0
                           for value in summary.values())
                assert summary["pathLimit"] == 16_384
                assert summary["overflowCalls"] == 0
                assert summary["calls"] == summary["distinctPaths"] + summary["repeatCalls"]
                assert summary["revisitedPaths"] <= summary["distinctPaths"]
            assert path_trace["physicalModuleProbe"]["calls"] == (
                counters["modules.fileProbe.systemCalls"]
                + counters["modules.directoryProbe.systemCalls"]
            )
            assert path_trace["missingPackageJson"]["calls"] == counters["modules.packageJson.notFound"]
            assert path_trace["fsRealpath"]["calls"] == counters["filesystem.realpath.calls"]
            assert path_trace["cjsCanonicalization"]["calls"] == path_trace["fsRealpath"]["calls"]
            assert any(sample["counters"] == row["result"]["profile"]["counters"]
                       for row in baseline_rows)
            summaries.append(path_trace)
        assert summaries[0] == summaries[1] == summaries[2]
        if target == "p2":
            reference[operation] = summaries[0]
        else:
            assert reference[operation] == summaries[0]

for operation in OPERATIONS:
    print(operation)
    for category in CATEGORIES:
        summary = reference[operation][category]
        print(f"  {category}: {summary['calls']} calls, {summary['distinctPaths']} distinct, "
              f"{summary['repeatCalls']} repeats, {summary['revisitedPaths']} revisited paths")
print("validated 18 successful cold samples; no overflow; baseline counters match")

#!/usr/bin/env python3
"""Validate the paired npm loader cache experiments and their acceptance gates."""

import json
import statistics
from pathlib import Path


ROOT = Path(__file__).parent
OPERATIONS = ("version", "view", "ci")
TARGETS = ("p2", "p3")
EXPECTED_HTTP = {"version": 0, "view": 1, "ci": 2}
BASELINE_MISSES = {"version": 204, "view": 1768, "ci": 2645}
CACHED_MISSES = {"version": 96, "view": 596, "ci": 847}
REALPATH_CALLS = {"version": 426, "view": 3545, "ci": 5007}
CACHED_REALPATH_CALLS = {"version": 77, "view": 475, "ci": 614}
FINAL_REALPATH_CALLS = {"version": 78, "view": 477, "ci": 616}
FINAL_REVISION = "f88f62e8750c60c8c288d8316c54e36cb0d2049c"


def load(family: str, target: str) -> dict:
    path = ROOT / f"2026-09-21-{family}-{target}.json"
    report = json.loads(path.read_text())
    assert report["target"] == target
    assert report["node"] == "22.14.0"
    assert report["npm"] == "10.9.2"
    assert report["iterations"] == 5
    assert len(report["samples"]) == 30
    assert sorted(sample["sequence"] for sample in report["samples"]) == list(range(30))
    return report


def rows(report: dict, operation: str, variant: str) -> list[dict]:
    result = [
        sample
        for sample in report["samples"]
        if sample["operation"] == operation and sample["variant"] == variant
    ]
    assert len(result) == 5
    return result


def final_rows(report: dict, operation: str) -> list[dict]:
    result = [
        sample
        for sample in report["samples"]
        if sample["operation"] == operation
        and sample["registry"] == "local"
        and sample["cache"] == "cold"
    ]
    assert len(result) == 3
    return result


def counter(sample: dict, name: str) -> int:
    return sample["result"]["profile"]["counters"].get(name, 0)


def median(samples: list[dict], name: str) -> float:
    return statistics.median(sample[name] for sample in samples)


def validate_common(report: dict) -> None:
    for sample in report["samples"]:
        operation = sample["operation"]
        assert operation in OPERATIONS
        assert sample["variant"] in ("control", "candidate")
        assert sample["registry"] == "local"
        assert sample["cache"] == "cold"
        assert sample["success"] is True
        assert sample["result"]["overflowed"] is False
        assert sample["localHttpRequests"] == EXPECTED_HTTP[operation]
        assert sample["installed"] is (operation == "ci")


def validate_package_json(report: dict) -> None:
    for operation in OPERATIONS:
        control = rows(report, operation, "control")
        candidate = rows(report, operation, "candidate")
        assert {counter(sample, "modules.packageJson.notFound") for sample in control} == {
            BASELINE_MISSES[operation]
        }
        assert {counter(sample, "modules.packageJson.notFound") for sample in candidate} == {
            CACHED_MISSES[operation]
        }
        for sample in report["samples"]:
            calls = counter(sample, "modules.packageJson.calls")
            accounted = sum(
                counter(sample, name)
                for name in (
                    "modules.packageJson.cacheHits",
                    "modules.packageJson.negativeCacheHits",
                    "modules.packageJson.reads",
                    "modules.packageJson.notFound",
                    "modules.packageJson.errors",
                )
            )
            assert calls == accounted
        if operation in ("view", "ci"):
            reduction = 1 - CACHED_MISSES[operation] / BASELINE_MISSES[operation]
            assert reduction >= 0.50
            assert median(candidate, "processCpuMs") <= median(control, "processCpuMs") * 1.03


def validate_realpath(report: dict) -> None:
    for operation in OPERATIONS:
        control = rows(report, operation, "control")
        candidate = rows(report, operation, "candidate")
        assert {counter(sample, "filesystem.realpath.calls") for sample in control} == {
            REALPATH_CALLS[operation]
        }
        assert {counter(sample, "filesystem.realpath.calls") for sample in candidate} == {
            CACHED_REALPATH_CALLS[operation]
        }
        for sample in report["samples"]:
            calls = counter(sample, "modules.realpath.calls")
            hits = counter(sample, "modules.realpath.cacheHits")
            system_calls = counter(sample, "modules.realpath.systemCalls")
            assert calls == hits + system_calls
            assert counter(sample, "filesystem.realpath.calls") == system_calls
        reduction = 1 - CACHED_REALPATH_CALLS[operation] / REALPATH_CALLS[operation]
        assert reduction >= 0.75
        assert median(candidate, "processCpuMs") <= median(control, "processCpuMs") * 1.03


def validate_final(target: str) -> None:
    path = ROOT / f"2026-09-21-loader-caches-final-{target}.json"
    report = json.loads(path.read_text())
    assert report["schema"] == "npm-metadata-v1"
    assert report["revision"] == FINAL_REVISION
    assert report["target"] == target
    assert report["node"] == "22.14.0"
    assert report["npm"] == "10.9.2"
    assert report["iterations"] == 3
    assert len(report["samples"]) == 30
    assert sorted(sample["sequence"] for sample in report["samples"]) == list(range(30))
    assert all(sample["success"] is True for sample in report["samples"])
    assert all(sample["result"]["overflowed"] is False for sample in report["samples"])

    for operation in OPERATIONS:
        samples = final_rows(report, operation)
        assert {sample["localHttpRequests"] for sample in samples} == {
            EXPECTED_HTTP[operation]
        }
        assert all(sample["installed"] is (operation == "ci") for sample in samples)
        assert {counter(sample, "modules.packageJson.notFound") for sample in samples} == {
            CACHED_MISSES[operation]
        }
        assert {counter(sample, "filesystem.realpath.calls") for sample in samples} == {
            FINAL_REALPATH_CALLS[operation]
        }
        for sample in samples:
            package_calls = counter(sample, "modules.packageJson.calls")
            package_accounted = sum(
                counter(sample, name)
                for name in (
                    "modules.packageJson.cacheHits",
                    "modules.packageJson.negativeCacheHits",
                    "modules.packageJson.reads",
                    "modules.packageJson.notFound",
                    "modules.packageJson.errors",
                )
            )
            assert package_calls == package_accounted
            realpath_calls = counter(sample, "modules.realpath.calls")
            realpath_hits = counter(sample, "modules.realpath.cacheHits")
            realpath_system_calls = counter(sample, "modules.realpath.systemCalls")
            assert realpath_calls == realpath_hits + realpath_system_calls
            assert counter(sample, "filesystem.realpath.calls") == realpath_system_calls

        if operation in ("view", "ci"):
            missing_reduction = 1 - CACHED_MISSES[operation] / BASELINE_MISSES[operation]
            assert missing_reduction >= 0.50
        realpath_reduction = 1 - FINAL_REALPATH_CALLS[operation] / REALPATH_CALLS[operation]
        assert realpath_reduction >= 0.75


def main() -> None:
    for target in TARGETS:
        negative = load("negative-package-json", target)
        assert negative["schema"] == "npm-metadata-negative-package-json-v1"
        validate_common(negative)
        validate_package_json(negative)

        realpath = load("loader-realpath", target)
        assert realpath["schema"] == "npm-metadata-loader-realpath-v1"
        validate_common(realpath)
        validate_realpath(realpath)

        combined = load("loader-caches", target)
        assert combined["schema"] == "npm-metadata-loader-caches-v1"
        validate_common(combined)
        validate_package_json(combined)
        validate_realpath(combined)

        validate_final(target)

    print("validated npm loader cache experiments")


if __name__ == "__main__":
    main()

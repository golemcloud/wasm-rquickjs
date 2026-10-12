"""Stage the latest available evidence per lane, preserving attempt provenance."""

import json
from pathlib import Path
import re
import sys


def latest_attempts(items):
    latest = {}
    for name, item in items:
        match = re.fullmatch(r"(.+)-report-attempt(\d+)", name)
        if not match:
            continue
        lane, attempt = match[1], int(match[2])
        if lane not in latest or attempt > latest[lane][0]:
            latest[lane] = (attempt, item)
    return latest


if sys.argv[1:] == ["--select-artifacts"]:
    # Select before downloading: superseded artifacts can be unavailable even
    # while GitHub still lists their metadata. Never fall back after a selected
    # latest artifact fails to download; that would hide missing current evidence.
    pages = json.load(sys.stdin)
    selected = latest_attempts((a["name"], a) for page in pages for a in page["artifacts"])
    artifacts = [item for _, (_, item) in sorted(selected.items())]
    print("ids=" + ",".join(str(a["id"]) for a in artifacts))
    print("single-name=" + (artifacts[0]["name"] if len(artifacts) == 1 else ""))
    sys.exit(0)

source, destination = map(Path, sys.argv[1:])
destination.mkdir(parents=True, exist_ok=True)
latest = latest_attempts((p.name, p) for p in source.iterdir() if p.is_dir())
for lane, (attempt, shard) in sorted(latest.items()):
    for report in sorted(shard.glob("ctrf-*.json")):
        try:
            data = json.loads(report.read_text())
            tests = data["results"]["tests"]
        except (ValueError, KeyError, TypeError) as error:
            # A failed/aborted test binary can leave an incomplete report. Its
            # job already failed; keep the raw artifact and report other shards.
            print(f"::warning::Cannot render {report}: {error}")
            continue
        for test in tests:
            # P2 and P3 deliberately run identically named tests. Do not merge
            # their identities in the central GitHub presentation.
            test["name"] = f"{lane} (attempt {attempt}) / {test['name']}"
        output = destination / shard.name
        output.mkdir(exist_ok=True)
        (output / report.name).write_text(json.dumps(data) + "\n")

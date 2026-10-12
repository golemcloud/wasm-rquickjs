"""Stage the latest available evidence per lane, preserving attempt provenance."""

import json
from pathlib import Path
import re
import sys

source, destination = map(Path, sys.argv[1:])
destination.mkdir(parents=True, exist_ok=True)
latest = {}
for shard in sorted(source.iterdir()):
    match = re.fullmatch(r"(.+)-report-attempt(\d+)", shard.name)
    if not shard.is_dir() or not match:
        continue
    lane, attempt = match[1], int(match[2])
    if lane not in latest or attempt > latest[lane][0]:
        latest[lane] = (attempt, shard)
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

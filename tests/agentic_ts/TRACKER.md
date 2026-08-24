# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.53 s | 17.67 s | 17.92 s | wall time |
| repeated unchanged fresh-job checks | — | 11.20 s | 11.28 s | median, 5 samples |
| incremental `.tsbuildinfo` checks | — | 11.15 s | 11.19 s | warm median, persisted artifact, 5 samples |
| repeated invalid checks then recovery | — | 11.38 s | 11.29 s | failure median, five nonzero exits followed by a successful check |
| project references/package graph | — | 18.49 s | 18.07 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.184 s | 0.182 s | structured result and wall time |
| generated JavaScript execution | n/a | 0.183 s | 0.186 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 11.77 s | 12.03 s | contended sibling completion; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.191 s | 0.196 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.183 s | 0.183 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-24, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-24-p2-macos-aarch64.json` and
`results/2026-08-24-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report.

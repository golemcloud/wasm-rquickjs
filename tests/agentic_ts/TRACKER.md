# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.55–0.62 s | 20.12 s | 17.84 s | wall time |
| repeated unchanged fresh-job checks | — | 12.02 s | 11.28 s | median, 5 samples |
| incremental `.tsbuildinfo` checks | — | 11.60 s | 12.04 s | warm median, persisted artifact, 5 samples |
| repeated invalid checks then recovery | — | 11.45 s | 11.71 s | failure median, five nonzero exits followed by a successful check |
| project references/package graph | — | 17.98 s | 18.70 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.187 s | 0.197 s | structured result and wall time |
| generated JavaScript execution | n/a | 0.185 s | 0.183 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 11.92 s | 12.51 s | contended sibling completion; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.196 s | 0.214 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.184 s | 0.204 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-25, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-25-p2-macos-aarch64.json` and
`results/2026-08-25-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report.

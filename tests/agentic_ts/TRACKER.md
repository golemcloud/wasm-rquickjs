# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.55–0.60 s | 18.05 s | 18.70 s | wall time |
| repeated unchanged non-incremental checks | — | 18.25 s | 18.12 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 11.71 s | 11.23 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 12.16 s | 11.36 s | failure median, five nonzero exits followed by a successful check |
| project references/package graph | — | 20.18 s | 18.29 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.449 s | 0.183 s | structured result and wall time |
| TypeScript emit | n/a | 19.74 s | 17.66 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.211 s | 0.184 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 13.26 s | 11.90 s | contended sibling completion; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.215 s | 0.200 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.202 s | 0.192 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-27, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-27-p2-macos-aarch64.json` and
`results/2026-08-27-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report. These reports use dev-profile guest
components; P2 uses Golem's Wasmtime fork and P3 uses stock Wasmtime, so the two
columns do not isolate the preview-version variable.

# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | measured | pass | pass | wall time in raw reports |
| repeated unchanged fresh-job checks | — | pass | pass | median/p95/throughput, 5 samples |
| incremental `.tsbuildinfo` checks | — | pass | pass | persisted artifact, 5 samples |
| repeated invalid checks then recovery | — | pass | pass | five nonzero exits followed by a successful check |
| project references/package graph | — | pass | pass | raw workspace fixture |
| direct TypeScript execution | n/a | pass | pass | structured result and wall time |
| generated JavaScript execution | n/a | pass | pass | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | measured | measured | isolated and contended sibling latency |
| repeated timeout then recovery | n/a | pass | pass | five bounded terminations followed by a successful job |
| repeated cancellation then recovery | n/a | pass | pass | five bounded terminations followed by a successful job |
| repeated-job memory observations | n/a | pass | pass | fresh QuickJS heap snapshots and outer Wasm high-water series |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-24, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-24-p2-macos-aarch64.json` and
`results/2026-08-24-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report.

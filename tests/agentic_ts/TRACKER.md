# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.57 s | 18.72 s | 18.85 s | wall time |
| repeated unchanged fresh-job checks | — | 12.00 / 14.21 s | 11.86 / 13.04 s | median/max-as-p95, 5 samples |
| incremental `.tsbuildinfo` checks | — | 12.22 / 13.69 s | 12.09 / 25.96 s | warmed median/max-as-p95, persisted artifact |
| invalid then valid edit | — | pass | pass | nonzero then zero exit |
| project references/package graph | — | pass | pass | raw workspace fixture |
| direct TypeScript execution | n/a | 0.20 s | 0.20 s | structured result |
| generated JavaScript execution | n/a | 0.21 s | 0.21 s | structured result |
| concurrent compiler/CPU/I/O jobs | n/a | serialized | serialized | 0.50/0.20 s isolated siblings both completed at 12.93 s under load (P2); similar P3 result |
| timeout responsiveness | n/a | 0.20 s | 0.20 s | completion latency |
| cancellation responsiveness | n/a | 0.20 s | 0.20 s | completion latency |
| repeated-job memory plateau | n/a | 0 B growth | 0 B growth | five unchanged and five warmed incremental compiler samples |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-12, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-12-p2-macos-aarch64.json` and
`results/2026-08-12-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report.

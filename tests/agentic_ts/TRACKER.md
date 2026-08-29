# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.53–0.59 s | 15.79 s | 16.23 s | wall time |
| repeated unchanged non-incremental checks | — | 15.66 s | 15.92 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 9.59 s | 9.41 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 9.70 s | 9.46 s | warm incremental failure median, one changed file per iteration, then recovery |
| project references/package graph | — | 16.53 s | 16.67 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.206 s | 0.197 s | structured result and wall time |
| TypeScript emit | n/a | 15.95 s | 16.04 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.197 s | 0.193 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 10.58 s | 9.96 s | warm incremental compiler plus CPU/I/O; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.201 s | 0.192 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.197 s | 0.185 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |
| phase-attributed core check | 0.63–0.67 s | 20.35 s | 20.90 s | instrumented wall time; compiler phases account for 19.77 s / 20.28 s |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-08-29, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-08-29-p2-macos-aarch64.json` and
`results/2026-08-29-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report. These reports use dev-profile guest
components and mirror the canonical runtime profiles: P2 with Golem's Wasmtime
fork and P3 with stock Wasmtime. Each column is an independent regression
baseline; comparing them does not isolate the preview level or Wasmtime
distribution. Schema-v5 rows use the recorded
`typescript-compiler-profiling` component feature, and the cold CLI workload
runs before the in-component profiler sidecar.

The preceding schema-v4 baseline remains available as
`results/2026-08-27-p2-macos-aarch64.json` and
`results/2026-08-27-p3-macos-aarch64.json`.

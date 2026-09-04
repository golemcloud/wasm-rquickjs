# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.57–0.59 s | 16.01 s | 16.34 s | wall time |
| repeated unchanged non-incremental checks | — | 15.70 s | 16.11 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 9.57 s | 9.63 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 9.64 s | 9.68 s | warm incremental failure median, one changed file per iteration, then recovery |
| project references/package graph | — | 16.58 s | 16.70 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.189 s | 0.189 s | structured result and wall time |
| TypeScript emit | n/a | 16.03 s | 17.47 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.193 s | 0.208 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 10.16 s | 10.40 s | warm incremental compiler plus CPU/I/O; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.202 s | 0.203 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.195 s | 0.194 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |
| phase-attributed core check | 0.65–0.68 s | 20.71 s | 21.18 s | instrumented wall time; measured compiler phases account for 20.11 s / 20.56 s |

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-09-04, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-09-04-p2-macos-aarch64.json` and
`results/2026-09-04-p3-macos-aarch64.json`. Node comparison currently covers the
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

# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.53–0.56 s | 15.74 s | 15.77 s | wall time |
| repeated unchanged non-incremental checks | — | 15.57 s | 15.57 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 9.24 s | 9.23 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 9.26 s | 9.24 s | warm incremental failure median, one changed file per iteration, then recovery |
| project references/package graph | — | 15.90 s | 15.94 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.182 s | 0.183 s | structured result and wall time |
| TypeScript emit | n/a | 15.44 s | 15.40 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.184 s | 0.182 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 9.81 s | 9.84 s | warm incremental compiler plus CPU/I/O; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.191 s | 0.191 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.184 s | 0.185 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | max linear growth / max fresh-runtime heap variation |
| phase-attributed core check | 0.63–0.64 s | 20.36 s | 20.34 s | instrumented wall time; compiler phases account for 19.76 s / 19.74 s |

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
distribution.

The preceding schema-v4 baseline remains available as
`results/2026-08-27-p2-macos-aarch64.json` and
`results/2026-08-27-p3-macos-aarch64.json`.

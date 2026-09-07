# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.53 s | 15.86 s | 15.83 s | wall time |
| repeated unchanged non-incremental checks | — | 15.58 s | 15.62 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 19.22 s | 19.17 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 21.36 s | 22.25 s | warm incremental failure median, one changed file per iteration, then recovery |
| project references/package graph | — | 23.27 s | 26.82 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.238 s | 0.255 s | structured result and wall time |
| TypeScript emit | n/a | 22.47 s | 23.07 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.234 s | 0.248 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 14.09 s | 14.48 s | warm incremental compiler plus CPU/I/O; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.236 s | 0.261 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.253 s | 0.246 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | within-series monotone high-water variation / terminal live-heap spread; not retained-memory measurement |
| phase-attributed core check | 0.63–0.64 s | 20.42 s | 20.38 s | instrumented wall time; measured compiler phases account for 19.83 s / 19.79 s |

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

Only the cold Node row runs the same command and is directly comparable. The
schema-v5 P2/P3 values include profiling instrumentation and are not absolute
comparisons with Node or the differently ordered schema-v4 reports. Workloads
run in the fixed report order inside one reused component and mounted workspace:
each QuickJS execution job is fresh, while generated filesystem artifacts
intentionally persist. The zero repeated-job linear-memory variation is a
within-series plateau below the monotone instance high-water mark already
reserved by the profiling sidecar; together with terminal live-heap spread it
does not measure retained memory or prove leak absence.

The preceding schema-v4 baseline remains available as
`results/2026-08-27-p2-macos-aarch64.json` and
`results/2026-08-27-p3-macos-aarch64.json`.

The exact-source GOL-350 CommonJS graph evidence is recorded in
`results/2026-09-07-gol-350-cjs-p2-macos-aarch64.json` and
`results/2026-09-07-gol-350-cjs-p3-macos-aarch64.json`. Both targets used clean
commit `a6ce1e3f8611606d230da19e4f5e7717c0cf4265`, standard optimized components,
disabled optional test caches, and a balanced alternating series of five Ajv
executions with the outer session disabled and five with it enabled. Every
disabled sample records `428 = 392 system + 0 outer-session + 36
invocation-local`; every enabled sample records `428 = 322 system + 70
outer-session + 36 invocation-local`. The outer session therefore avoids 17.9%
of physical probes in both targets: 50 file probes and 20 path-classification
probes.

P2 moved from a 777.863 ms median and 1.267 runs/s without the session to
771.730 ms and 1.301 runs/s with it (median -0.79%, throughput +2.67%). P3 moved
from a 759.794 ms median and 1.315 runs/s to 749.672 ms and 1.338 runs/s (median
-1.33%, throughput +1.77%). Five samples are insufficient for a durable latency
claim; the deterministic cross-target conclusion is the exact probe reduction.
Generated-module zero-hit checks were unarchived local diagnostics.

Affected node-compat candidates were also run unchanged on P2 and P3:
`test-fs-readfile` (16 passed, 1 existing Windows-only ignore),
`test-fs-read_file` (2 passed, 1 existing Linux-specific ignore),
`test-module-stat` (1 passed), `test-fs-rmdir` (11 passed, 4 existing
node-internals recursive ignores), and `test-fs-unlink` (1 passed). No
`config.jsonc` allowlist changes were needed.

# Agentic TypeScript workload tracker

| Workload | Node 22.14 baseline | P2 | P3 | Evidence |
|---|---:|---:|---:|---|
| cold `tsc --noEmit` | 0.57–0.58 s | 17.17 s | 16.03 s | wall time |
| repeated unchanged non-incremental checks | — | 16.03 s | 15.49 s | median, no `.tsbuildinfo`, 5 fresh jobs |
| incremental `.tsbuildinfo` checks | — | 9.73 s | 9.20 s | warm median, persisted artifact, 5 fresh jobs |
| repeated invalid checks then recovery | — | 9.80 s | 9.19 s | warm incremental failure median, one changed file per iteration, then recovery |
| project references/package graph | — | 16.32 s | 15.93 s | wall time, raw workspace fixture |
| direct TypeScript execution | n/a | 0.200 s | 0.182 s | structured result and wall time |
| TypeScript emit | n/a | 15.94 s | 15.51 s | emits the direct fixture to JavaScript; wall time |
| generated JavaScript execution | n/a | 0.187 s | 0.184 s | structured result and wall time |
| concurrent compiler/CPU/I/O jobs | n/a | 10.04 s | 9.80 s | warm incremental compiler plus CPU/I/O; isolated baselines in raw reports |
| repeated timeout then recovery | n/a | 0.194 s | 0.191 s | termination median, five attempts followed by a successful job |
| repeated cancellation then recovery | n/a | 0.189 s | 0.185 s | termination median, five attempts followed by a successful job |
| repeated-job memory observations | n/a | 0 B / 8,744 B | 0 B / 8,744 B | within-series monotone high-water variation / terminal live-heap spread; not retained-memory measurement |
| phase-attributed core check | 0.64–0.67 s | 21.20 s | 20.56 s | instrumented wall time; measured compiler phases account for 20.56 s / 19.96 s |

## Production release baseline — 2026-09-24

The retained [P2](results/2026-09-24-release-p2-macos-aarch64.json) and
[P3](results/2026-09-24-release-p3-macos-aarch64.json) reports establish the
matched production baseline at clean source `19ed7840`. Both the host harness
and generated component use locked Cargo release builds, the component uses the
production `typescript-transform-runtime` feature, and all optional test caches
are disabled. Each cell below is a five-sample median. The host and Wasm sides
run the exact same TypeScript 5.8.2 CLI arguments with fresh processes or
QuickJS jobs; only the incremental series preserves its independently isolated
`.tsbuildinfo`.

| Series | P2 host → Wasm | P3 host → Wasm | `8 × host + 1 s` goal |
|---|---:|---:|---:|
| cold fresh logical state | 0.553 → 5.650 s (10.22×) | 0.501 → 5.546 s (11.07×) | miss by 0.227 / 0.539 s |
| repeated unchanged, fresh jobs | 0.423 → 5.528 s (13.06×) | 0.422 → 5.516 s (13.07×) | miss by 1.141 / 1.141 s |
| warm incremental, fresh jobs | 0.191 → 2.696 s (14.15×) | 0.189 → 2.665 s (14.09×) | miss by 0.172 / 0.152 s |

The measured boundary is Node process spawn through exit on the host and the
`run-tsc` export invocation through result in Wasm. Workspace copying and
component preparation/instantiation are excluded from both workload medians.
Every sample completed successfully without output overflow. P2 and P3 each
reached a 145.06 MiB reused-instance Wasm linear-memory high-water mark, with
zero variation in the repeated and incremental terminal QuickJS heap samples.
This is the first matched production baseline, so its absolute memory values
seed the 10% regression gate for subsequent candidates rather than claiming a
historical release-memory improvement.

All three series still miss the practical-performance envelope. The small
fixture points most strongly at fresh-job compiler/module startup: repeated
non-incremental work is effectively as expensive as cold work, while preserving
TypeScript's explicit incremental artifact roughly halves Wasm time but leaves
a much larger host-relative ratio.

## Consolidated TypeScript module loading — 2026-09-23

The retained final [P2](results/2026-09-23-p2-macos-aarch64.json) and
[P3](results/2026-09-23-p3-macos-aarch64.json) reports measure clean source
`dd689c8c` with Node 22.14.0, npm 10.9.2, TypeScript 5.8.2, Rust 1.98.1, and
disabled optional test caches. Their build and benchmark input hashes match
across targets, and report validation plus exact currentness pass.

The first controlled step moved CJS `sourceMappingURL` extraction from
JavaScript to the existing native SWC lexer in TypeScript-feature builds. Its
intermediate raw reports are summarized rather than retained:

| Workload | P2 baseline → source-map candidate | P3 baseline → source-map candidate |
|---|---:|---:|
| cold `tsc --noEmit` | 19.17 → 16.72 s (-12.7%) | 19.22 → 16.90 s (-12.1%) |
| repeated unchanged checks | 18.95 → 16.83 s (-11.2%) | 19.18 → 17.07 s (-11.0%) |
| warm incremental checks | 12.43 → 9.99 s (-19.6%) | 12.34 → 10.20 s (-17.4%) |
| profiled TypeScript API import | 11.67 → 8.07 s (-30.9%) | 11.75 → 8.31 s (-29.3%) |

One-off phase attribution found that JavaScript source-map extraction owned
2.57–2.83 s while loading the large TypeScript CommonJS source; the native
lexer reduced that phase to 0.24–0.33 s. Temporary diagnostics were removed
after selecting the implementation. The source-map candidate cleared both
experiment gates on both targets: more than one second and more than 10% saved
in the cold exported CLI workload.

The source-preparation scanner step dispatches CommonJS export parsers only at
accepted leading bytes and advances the direct-`eval`, import-attribute, and
template-expression scanners between relevant sentinel bytes. A dedicated
five-sample comparison measured:

| Workload | P2 source-map → final | P3 source-map → final |
|---|---:|---:|
| profiled TypeScript API import | 8.33 → 4.22 s (-49.3%) | 8.49 → 4.22 s (-50.3%) |
| incremental profiler rerun | 5.43 → 4.22 s (-22.3%) | 5.42 → 4.22 s (-22.2%) |

The final known-format step classifies `.cjs`/`.cts`, `.mts`, explicit package
types, and default-type `node_modules` files before consulting source syntax.
Only ambiguous inputs run the ESM-syntax and CommonJS-wrapper lexical scans.
It preserves the existing cached-TypeScript and `force_module` precedence. A
second dedicated five-sample comparison reduced the TypeScript API import
median from 4.22 to 3.47 s on P2 (-17.9%) and from 4.22 to 3.44 s on P3
(-18.4%). The retained final reports independently record 3.47 s and 3.45 s
import phases.

The API profiler imports `typescript.js`, not the CLI's `_tsc.js`, so these
values support module-load attribution rather than a direct cold-CLI
comparison. Other compiler phases and end-to-end rows vary between local runs;
they are not used to claim the same percentage for full `tsc` workloads. The
final components are 492,525 bytes (0.28%) larger on P2 and 488,990 bytes
(0.28%) larger on P3 than the original controlled candidate baseline.

Focused public-boundary coverage verifies real line-comment directives, marker
text inside strings and templates, Node's U+2003 separator and U+2028 line
terminator, an empty last directive, the no-marker fast path, CommonJS source
preparation, and import attributes. The native path is intentionally
TypeScript-feature-only because those builds already carry SWC. Non-TypeScript
and VM builds retain the existing JavaScript scanner; its pre-existing
regex-literal heuristic gaps remain a proposed deferred follow-up. P2/P3
TypeScript runtime coverage also verifies `.mts`, `.cts`, ambiguous `.ts`,
cached CommonJS TypeScript, and explicit CommonJS/module package precedence.

Update this tracker from a dated report only. Stable runtime defects belong in
focused runtime, node_modules-app, or node-compat tests before an implementation
fix is proposed.

Baseline: 2026-09-07, Apple arm64, Node 22.14.0/npm 10.9.2/TypeScript
5.8.2, five repeated samples, caches disabled. The full reports are
`results/2026-09-07-p2-macos-aarch64.json` and
`results/2026-09-07-p3-macos-aarch64.json`. Node comparison currently covers the
same cold core-project `--noEmit` command; cells marked `—` were not separately
benchmarked on Node in this first report. These reports use dev-profile guest
components and mirror the canonical runtime profiles: P2 with Golem's Wasmtime
fork and P3 with stock Wasmtime. Each column is an independent regression
baseline; comparing them does not isolate the preview level or Wasmtime
distribution. Schema-v5 rows use the recorded
`typescript-compiler-profiling` component feature, and the cold CLI workload
runs before the in-component profiler sidecar.

The September 7 reports replace the September 4 reports at a later combined
GOL-347/GOL-350 source snapshot. Several timings moved materially, especially
the incremental rows; without a controlled A/B, those changes are not
attributed to one implementation change.

Only the cold Node row runs the same command and is directly comparable. The
schema-v5 P2/P3 values include profiling instrumentation and are not absolute
comparisons with Node or the differently ordered schema-v4 reports. Workloads
run in the fixed report order inside one reused component and mounted workspace:
each QuickJS execution job is fresh, while generated filesystem artifacts
intentionally persist. The zero repeated-job linear-memory variation is a
within-series plateau that does not exceed the monotone instance high-water
mark already reached by the profiling sidecar; together with terminal live-heap
spread it does not measure retained memory or prove leak absence.

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

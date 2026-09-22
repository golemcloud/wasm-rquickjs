# Result reports

`run.sh` writes one JSON file per target. Checked-in dated reports must include
the commit, dirty state, host environment, pinned tool versions, iteration
count, component size, workload results, median/p95 timing, throughput,
fresh-runtime QuickJS heap samples, and Wasm linear-memory high-water
observations. QuickJS samples are snapshots before tool loading and after the
compiler finishes; they complement, but do not replace, the outer linear-memory
growth observation.

The reports cover the repository's canonical runtime profiles: P2 with the
Golem Wasmtime fork and P3 with stock Wasmtime. Each profile is an independent
regression baseline. Differences between them cannot be attributed solely to
the WASI preview level or to the Wasmtime distribution.

Do not compare reports produced with different prepared-component, Wasmtime,
artifact-cache, or unoptimized settings without calling out those differences.

The checked-in 2026-09-07 macOS arm64 P2/P3 reports are the five-sample
schema-v5 baseline for GOL-347. Each report records a commit
hint, dirty state, BLAKE3 composite hashes for build and benchmark inputs, and
the exact optimized component hash.
The reports record `dirty: false`; their shared commit hint identifies the
common source snapshot, while their matching composite input hashes establish
that both targets used the same build and benchmark inputs.
`run.sh --check` validates every historical report and requires each P2/P3 pair
to share the input hashes without resolving Git history. `run.sh
--check-current` additionally compares selected reports with the current
checkout. CI performs that currentness check against the exact report-bearing
tree. For a pull-request synthetic merge or an ordinary two-parent merge push,
that tree is the second parent; unrelated first-parent changes must not rewrite
a historical measurement. Direct and squash pushes are checked against their
resulting `HEAD`, while ambiguous merge pushes fail closed. With five samples,
the reported p95 is the observed maximum; it is descriptive evidence rather
than a stable tail-latency estimate.

## Consolidated-source compiler recapture

The [2026-09-22 P2](2026-09-22-p2-macos-aarch64.json) and
[P3](2026-09-22-p3-macos-aarch64.json) reports were captured from clean
consolidated #154 revision `5349e9eabd84509fdb2f2807d30c57961c5ffa5d`.
They use the pinned Node 22.14.0/npm 10.9.2/TypeScript 5.8.2 fixture, five
repeated-job samples, Rust 1.98.1, and disabled optional test caches. The cold
CLI and host Node baselines each have one observation per target. Build and
benchmark input hashes agree across P2/P3; report validation and exact
currentness passed.

Cold `tsc --noEmit` took 19.17/19.22 s (P2/P3), while the same host Node command
took 0.631/0.623 s. Repeated unchanged checks had 18.95/19.18 s medians and
warm incremental checks had 12.43/12.34 s medians. In the separately
instrumented compiler-API profile, TypeScript import took 11.67/11.75 s,
program creation 5.08/5.00 s, and diagnostics 7.93/8.15 s. Its larger outer
wall must not be compared directly to the cold CLI row.

The September 7 reports used an earlier source and Rust toolchain; this
recapture is descriptive, not an isolated regression or speedup claim for the
npm loader caches or stripped-ESM fix. The compiler fixture still makes only
one module-resolution call, so the next useful experiment is to attribute
the TypeScript import phase rather than extend a broad loader cache.

## GOL-350 CommonJS graph probe evidence

The dated `2026-09-07-gol-350-cjs-p2-macos-aarch64.json` and
`2026-09-07-gol-350-cjs-p3-macos-aarch64.json` reports capture a balanced,
alternating comparison of five Ajv CommonJS executions with the probe session
disabled and five with it enabled. Both reports came from clean commit
`a6ce1e3f8611606d230da19e4f5e7717c0cf4265`, use standard optimized components
with all optional test caches disabled, and share identical build, benchmark,
fixture, and toolchain fingerprints while retaining distinct P2/P3 component
hashes.

Every enabled sample reconciles 428 logical path classifications into 322
physical metadata calls, 70 positive outer-session hits, and 36 invocation-local
hits. Every disabled sample records the same 428 logical classifications as 392
physical calls, zero outer-session hits, and 36 invocation-local hits. The session
therefore removes 17.9% of the physical calls in both targets: 50 file probes and
20 classification probes.

The optimized wall-clock result is directionally consistent but small. P2
improved from a 777.863 ms median and 1.267 runs/s to 771.730 ms and 1.301 runs/s
(median -0.79%, throughput +2.67%). P3 improved from a 759.794 ms median and
1.315 runs/s to 749.672 ms and 1.338 runs/s (median -1.33%, throughput +1.77%).
Five samples are insufficient for a durable latency claim, so the deterministic
probe reduction remains the supported cross-target conclusion. Earlier
generated-module zero-hit checks were local diagnostics and were not archived as
checked-in reports.

## GOL-347 compiler profile and mitigation

The 2026-09-07 schema-v5 reports add a shared TypeScript compiler-API profile
and feature-gated execution-job phase/counter summaries. The accepted bounded
mitigation replaces the default path-based `readFileSync` open/stat/8 KiB read
loop with one private native whole-file read, while file-descriptor operands and
custom flags retain the existing path.
The reports record the `typescript-compiler-profiling` component feature, and
the canonical cold CLI workload runs before the in-component profiling sidecar.
Only that cold Node row executes the same command and is directly comparable.
Later schema-v5 P2/P3 workloads include profiling instrumentation, run after the
sidecar in a fixed order, and are not absolute comparisons with Node or the
differently ordered schema-v4 reports. QuickJS jobs are fresh, but the component
and mounted workspace are reused and generated filesystem artifacts persist.
The September 7 reports replace the September 4 pair at a later combined
GOL-347/GOL-350 source snapshot. Several timings moved materially, especially
the incremental rows; the refresh is not a controlled A/B and does not
attribute those movements to one implementation change.

The September 7 reports record 68 whole-file reads for 10,961,854 bytes. The
remaining controlled P2/P3 work is approximately 7.52/7.44 s importing
TypeScript, 4.97/4.88 s creating the program, and 8.07/7.63 s computing
diagnostics. Runtime creation, loader setup, process setup, transport wiring,
and wrapper preparation together remain under 5 ms.

The reports also record 157,965,864-byte P2 and 155,255,439-byte P3 optimized
components, 37.75/29.98 s builds, and 16.67/14.86 s preparation plus
instantiation. These are per-component costs rather than the owner of repeated
fresh-job compiler latency. Repeated jobs show zero within-series variation in
the monotone linear-memory high-water mark and at most 8,744 bytes of terminal
live-heap spread, plus successful recovery after every timeout and cancellation
series. The linear plateau does not exceed the peak already reached by the
profiling sidecar; neither observation measures retained memory or proves leak
absence.

Follow-up disposition from the measured counters:

- GOL-348 remains a cache-lifetime and invalidation investigation; this compiler
  profile has only two missing package metadata lookups, so negative caching is
  not the material owner here.
- The GOL-350 follow-up used a separate representative cold `node_modules`
  graph because this workload has only five module-loader path probes (three
  file probes and two directory probes); its 636 filesystem stats are TypeScript
  compiler directory probes, not duplicate module-resolution probes. GOL-350
  now implements the positive-only outer-CJS probe session validated by that
  separate graph.
- GOL-349 remains ordered after GOL-418 and needs its overlapping `require(esm)`
  benchmark. The controlled compiler workload does not exercise that graph.
- GOL-351 stays folded/canceled: one module-resolution call cannot make helper
  hoisting meet the one-second and ten-percent materiality gate.

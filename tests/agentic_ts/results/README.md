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
--check-current` additionally compares the manifest-designated reports with
their exact measured source in a temporary pristine worktree. Each
`current-reports.txt` entry pairs an exact measured source
revision with one member of the latest P2/P3 pair. When that pair or manifest
changes, CI checks it against pristine worktrees at the named revision;
superseded experiment reports remain schema- and pair-validated without being
relabeled as measurements of a later source tree. Pull-request and ordinary
merge parents select newly introduced artifacts without mixing in unrelated
first-parent changes, while ambiguous merge pushes fail closed. With five
samples, the reported p95 is the observed maximum; it is descriptive evidence
rather than a stable tail-latency estimate.

## Production release baseline

The [2026-09-24 P2](2026-09-24-release-p2-macos-aarch64.json) and
[P3](2026-09-24-release-p3-macos-aarch64.json) reports are the retained matched
production release pair, measured from clean source `968657ac`. The host
harness and generated components are locked Cargo release builds, the component
uses `typescript-transform-runtime` rather than the profiling feature, and the
optional artifact, Wasmtime, prepared-component, and unoptimized test settings
are all disabled. Distinct P2/P3 component hashes, matching build/benchmark
input hashes, exact currentness, five samples per series, successful results,
memory evidence, and pair invariants pass validation.

Cold medians are 0.530 s host versus 5.773 s P2 and 0.528 s host versus
5.879 s P3. Repeated unchanged medians are 0.445 s versus 5.617 s and 0.459 s
versus 5.621 s. Warm incremental medians are 0.196 s versus 2.729 s and
0.200 s versus 2.830 s. Against the practical `8 × host + 1 s` target, P2/P3
miss by 0.534/0.658 s cold, 1.059/0.951 s repeated, and 0.159/0.231 s
incremental. The reused-instance linear-memory high-water mark remains
145.06 MiB on both targets, unchanged from the original release-memory anchor.

The original pair at `19ed7840` and this retained pair were measured in
separate sessions rather than an interleaved A/B. Host-adjusted Wasm time in
the retained pair is 146/306 ms higher cold, 68/68 ms higher repeated, and
28/154 ms higher incremental on P2/P3. Although the loader realpath-prefix
cache is the only intervening production change, the design cannot separate a
TypeScript workload effect from machine drift. Treat the retained pair as the
current absolute baseline, not as evidence of a TypeScript cache benefit.

Host timing covers Node process spawn through exit. Wasm timing covers the
`run-tsc` export invocation through its result. Fresh-workspace preparation and
component preparation/instantiation are outside those boundaries. Cold means
fresh logical execution state, not a physical-disk-cold machine. The repeated
and incremental series use fresh host processes and fresh QuickJS jobs; only
the incremental series preserves its explicitly named `.tsbuildinfo` in a
separate host or Wasm workspace.

A temporary current-release P2 attribution pass then ran the same production
component with TypeScript's `--extendedDiagnostics`. Its five-sample repeated
median was 5.865 seconds end to end. TypeScript accounted for 4.830 seconds:
1.520 seconds in program construction, 0.450 seconds in binding, and 2.850
seconds in checking. Loading `_tsc.js`, CLI/configuration work, and diagnostic
reporting left a 0.780-second inner residual, while the outer execution/export
envelope was 0.246 seconds. The corresponding host compiler total was 0.400
seconds; parse, bind, and check were approximately 18.0x, 11.3x, and 11.4x
slower in the instrumented Wasm run.

The warmed incremental median was 3.082 seconds. With checking skipped by the
unchanged build state, TypeScript still spent 1.630 seconds constructing the
program and 0.470 seconds binding it; the inner residual was 0.804 seconds and
the outer envelope 0.173 seconds. `--extendedDiagnostics` changes absolute
workload timing and reports at 10-millisecond precision, so these values are
phase attribution rather than a replacement baseline. They put the largest
remaining owner in TypeScript JavaScript execution, especially checking and
parsing/program construction. The temporary harness and raw report were
removed.

A later generic source-walker experiment at `04fe3cb2` skipped contiguous ASCII
whitespace before invoking parser visitors. The profiling component improved
its TypeScript import median by about 33 ms (1.0%), but an immediate production
P2 control did not reproduce a useful end-to-end gain. Candidate versus control
host-adjusted overhead was 5,240.345 versus 5,243.194 ms cold, 5,239.413 versus
5,171.978 ms repeated, and 2,584.604 versus 2,533.079 ms incremental. Memory was
unchanged. The candidate was reverted with a normal commit; its raw reports are
not retained.

Two whole-guest LLVM profile experiments were also rejected. Changing the
skeleton release profile from size optimization to `opt-level = 2` grew the P2
component from 17,123,349 to 20,131,015 bytes (+17.6%). Against the retained
pair, host-adjusted cold and repeated overhead worsened by 127 and 115 ms;
incremental improved by only 10 ms. `opt-level = 3` grew the component to
20,536,838 bytes (+19.9%) while cold was neutral, repeated worsened by 177 ms,
and incremental worsened by 24 ms. Memory was unchanged in both diagnostics.
Both profile edits were reverted and their raw reports are not retained.

Optimizing only the QuickJS/rquickjs native package did not produce a durable
tradeoff either. A package-specific `opt-level = 3` grew the P2 component by
about 244 KiB (1.4%): one adjacent run improved cold overhead by 362 ms and
incremental overhead by 57 ms, but repeated unchanged overhead regressed, and
a second candidate run made the repeated median 255 ms slower than the same
control. Package-specific `opt-level = 2` grew the component by about 220 KiB
(1.3%). Two runs put cold overhead on opposite sides of the retained baseline;
the clean rerun improved it by 98 ms but worsened repeated and incremental
overhead by 135 and 62 ms. Linear-memory high-water was unchanged throughout.
The overrides were reverted and the diagnostic reports are not retained.

An upstream-isolated QuickJS diagnostic enabled its GCC label-based direct
bytecode dispatch for WASI instead of the default switch loop. Clang accepted
the extension, but the resulting Wasm control flow was slower: host-adjusted
repeated overhead rose by 310 ms and incremental overhead by 147 ms, while the
cold series developed 8.9--14.3 s tails. Component size increased by only
9,158 bytes and memory was unchanged, so neither explains the regression. The
temporary dependency override and lockfile change were removed; direct
dispatch and its raw report are not retained.

Enabling `-msimd128` for the QuickJS C build was also rejected after a
five-sample P2 release screen. The generated component did contain SIMD
instructions, but host-adjusted cold, repeated, and incremental overhead rose
by 172, 280, and 109 ms against the retained baseline. Linear-memory high-water
was unchanged and component size increased by only 183 bytes. Because every
TypeScript series regressed, npm and P3 follow-ups were not run; the temporary
report is not retained.

Enabling rquickjs's `disable-assertions` feature removed QuickJS C assertions
and dump scaffolding. In an immediate P2 TypeScript candidate/control pair it
reduced host-adjusted cold, repeated, and incremental overhead by 112, 143,
and 169 ms (2.1%, 2.6%, and 6.3%), reduced the component by about 143 KiB
(0.84%), and did not increase memory. The global candidate was nevertheless
rejected after npm A/B/A: its clean second candidate leg made metadata overhead
106 ms (10.9%) slower than the adjacent control, while warm-tarball `npm ci`
was neutral at 12 ms faster. That metadata loss would consume the entire
remaining target margin. Assertions therefore remain enabled; P3 was not run
and the diagnostic reports are not retained.

An upstream-isolated follow-up disabled only QuickJS's inactive dump
instrumentation while preserving all assertions. It retained most of the size
benefit and improved TypeScript host-adjusted cold, repeated, and incremental
overhead by 271, 105, and 45 ms against the retained baseline. It also retained
the npm conflict: against the adjacent assertions-enabled control, metadata
overhead was 159 ms slower and warm-tarball `npm ci` was neutral within noise.
The patch and raw reports were removed. This narrows the workload split to the
dump-code removal/code layout rather than assertion evaluation itself.

A temporary P2 bytecode-cache prototype isolated a larger opportunity and its
constraints. Compiling the 9,065,703-byte `typescript.js` CommonJS wrapper took
826--912 ms, while loading source-stripped serialized QuickJS bytecode took
51--61 ms. Against an adjacent control, that version improved cold, repeated,
and incremental Wasm medians by 305, 252, and 140 ms with only a 9.2 KiB
component increase. It was rejected because omitting source text changes the
observable `Function.prototype.toString()` result. A source-preserving version
passed targeted content-invalidation and source-observability checks, but its
20,164,115-byte serialized artifact raised linear-memory high-water from
152,109,056 to 172,294,144 bytes (+13.3%), above the 10% budget.

The GOL-663 follow-up then prototyped a compact source-span representation. It
preserved `Function.prototype.toString()`, source maps and diagnostics, content
invalidation, fresh job state, and the memory budget (+2.1% in the P2
diagnostic), but the benefit was too narrow to retain. Fresh-component cold
TypeScript did not improve, the corrected repeated result lacked matched P2/P3
controlled confirmation, and npm recorded zero cache admissions, fills, or
hits across 50 successful samples. The only promising result was one warmed P2
incremental diagnostic about 0.24 s faster. GOL-663 was canceled; no external
fork or PR was created, and all prototype code, local dependency clones, and
raw diagnostics were removed.

A separate P2 diagnostic ran Binaryen `wasm-opt -O3` over the large embedded
core module after Wizer, with Binaryen limited to four workers. An immediate
A/B/A TypeScript sequence reduced the component from 17,123,442 bytes to about
14,944,500 bytes (-12.7%) with unchanged 152,109,056-byte linear-memory high
water. Relative to the adjacent control, host-adjusted overhead improved by
42–87 ms cold (0.8–1.7%), 138–308 ms repeated (2.6–5.8%), and 77–81 ms
incremental (3.0–3.1%). The result is a real but modest whole-program
optimization opportunity. It is not retained here because the prototype
required an undeclared system `wasm-opt`; adopting it needs an explicit
cross-platform build and binary-distribution design plus P2/P3 compatibility
coverage. GOL-661 tracks that production integration. Raw diagnostic reports
remain outside the repository.

## Consolidated TypeScript module-loading candidate

The [2026-09-23 P2](2026-09-23-p2-macos-aarch64.json) and
[P3](2026-09-23-p3-macos-aarch64.json) reports are the retained final pair for
the consolidated candidate at clean source revision `dd689c8c`. They use the
pinned Node 22.14.0/npm 10.9.2/TypeScript 5.8.2 fixture, five repeated-job
samples, Rust 1.98.1, and disabled optional test caches. Their build and
benchmark input hashes agree across P2/P3; report validation and exact
currentness pass.

The first accepted step moved CJS `sourceMappingURL` extraction to the existing
native SWC lexer for TypeScript-feature builds. Against the controlled parent
source at `74253b41`, the intermediate candidate reduced cold `tsc --noEmit`
from 19.17 to 16.72 s on P2 (-12.7%) and from 19.22 to 16.90 s on P3 (-12.1%).
Repeated unchanged medians improved 11.2%/11.0%, warm incremental medians
improved 19.6%/17.4%, and the separately instrumented TypeScript API import
phase improved 30.9%/29.3%. One-off startup diagnostics attributed 2.57–2.83 s
to the old JavaScript source-map scan and 0.24–0.33 s to the native replacement.
The intermediate raw pair and temporary startup traces are summarized here
rather than retained.

The source-preparation scanner step dispatches CommonJS export parsers only at
accepted leading bytes and advances the direct-`eval`, import-attribute, and
template-expression scanners between relevant sentinel bytes. Its dedicated
five-sample comparison reduced the TypeScript API import median from 8.33 to
4.22 s on P2 (-49.3%) and from 8.49 to 4.22 s on P3 (-50.3%).

The final known-format step classifies fixed extensions and package policies
before consulting source syntax, so only ambiguous inputs run the ESM-syntax
and CommonJS-wrapper lexical scans. Its dedicated five-sample comparison
reduced the TypeScript API import median from 4.22 to 3.47 s on P2 (-17.9%) and
from 4.22 to 3.44 s on P3 (-18.4%). The retained final reports independently
record 3.47 s and 3.45 s import phases. The profiler imports `typescript.js`,
not the CLI's `_tsc.js`, so these values support module-load attribution and
are not direct cold-CLI timings. Other compiler phases and end-to-end rows vary
between local runs and are not used to claim the same percentage for full
`tsc` workloads.

The final optimized component is 492,525 bytes (0.28%) larger than the original
P2 controlled candidate and 488,990 bytes (0.28%) larger on P3. Public runtime
coverage verifies a real line-comment source map with Node's U+2003 separator
and U+2028 line terminator, marker text inside strings and templates, an empty
last directive, the no-marker fast path, CommonJS source preparation, and
import attributes. P2/P3 TypeScript runtime coverage also verifies `.mts`,
`.cts`, ambiguous `.ts`, cached CommonJS TypeScript, and explicit
CommonJS/module package precedence. The native source-map path remains
TypeScript-feature-only because those builds already carry SWC; non-TypeScript
and VM builds retain the existing JavaScript scanner.

Timings remain indicative local measurements rather than thresholds. The
dedicated paired import experiments are the evidence for the two final scanner
and classification optimizations.

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

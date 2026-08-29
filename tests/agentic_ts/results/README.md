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

The checked-in macOS arm64 P2/P3 reports are the initial five-sample baseline
for GOL-426, refreshed after review on 2026-08-27. Each report records a commit
hint, dirty state, BLAKE3 composite hashes for build and benchmark inputs, and
the exact optimized component hash.
The refreshed reports record `dirty: true` and the parent commit as a navigation
hint because the reviewed harness correction was uncommitted during measurement;
their composite input hashes match the committed correction exactly.
`run.sh --check` validates every historical report and requires each P2/P3 pair
to share the input hashes without resolving Git history. `run.sh
--check-current` additionally compares selected reports with the current
checkout. With five samples, the reported p95 is the observed maximum; it is
descriptive evidence rather than a stable tail-latency estimate.

## GOL-347 compiler profile and mitigation

The 2026-08-29 schema-v5 reports add a shared TypeScript compiler-API profile
and feature-gated execution-job phase/counter summaries. The accepted bounded
mitigation replaces the default path-based `readFileSync` open/stat/8 KiB read
loop with one private native whole-file read, while file-descriptor operands and
custom flags retain the existing path.
The reports record the `typescript-compiler-profiling` component feature, and
the canonical cold CLI workload runs before the in-component profiling sidecar.

Five-sample controlled A/B measurements compared baseline commit `097e767b`
with mitigation commit `d04496f5`, with caches disabled:

| Target | Wasm wall median | Job median | TypeScript import median |
|---|---:|---:|---:|
| P2 baseline | 22.896 s | 22.892 s | 9.626 s |
| P2 mitigation | 20.306 s (-11.31%) | 20.302 s (-11.32%) | 7.370 s (-23.44%) |
| P3 baseline | 22.871 s | 22.868 s | 9.629 s |
| P3 mitigation | 20.291 s (-11.28%) | 20.288 s (-11.28%) | 7.372 s (-23.44%) |

The compiler load changed from 1,453 native 8 KiB read crossings to 68
whole-file reads for the same 10,961,854 bytes. In the accepted reports, the
remaining controlled P2/P3 work is approximately 7.38/7.53 s importing
TypeScript, 4.83/4.96 s creating the program, and 7.55/7.78 s computing
diagnostics. Runtime creation, loader setup, process setup, transport wiring,
and wrapper preparation together remain under 5 ms; built-in initialization is
about 163 ms and teardown about 369 ms.

The reports also record 155,036,326-byte P2 and 151,722,077-byte P3 optimized
components, 28.36/29.88 s builds, and 14.38/14.85 s preparation plus
instantiation. These are per-component costs rather than the owner of repeated
fresh-job compiler latency. Repeated jobs retain zero linear-memory high-water
growth, at most 8,744 bytes of observed QuickJS heap variation, and successful
recovery after every timeout and cancellation series.

Follow-up disposition from the measured counters:

- GOL-348 remains a targeted package-graph optimization; this compiler profile
  has only two missing package metadata lookups, so negative caching is not the
  material owner here.
- GOL-350 remains useful for a representative cold `node_modules` graph. This
  workload has one module-loader file probe; its 636 filesystem stats are
  TypeScript compiler directory probes, not duplicate module-resolution probes.
- GOL-349 remains ordered after GOL-418 and needs its overlapping `require(esm)`
  benchmark. The controlled compiler workload does not exercise that graph.
- GOL-351 stays folded/canceled: one module-resolution call cannot make helper
  hoisting meet the one-second and ten-percent materiality gate.

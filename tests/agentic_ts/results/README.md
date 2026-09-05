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

The checked-in 2026-09-04 macOS arm64 P2/P3 reports are the five-sample
schema-v5 baseline for GOL-347. Each report records a commit
hint, dirty state, BLAKE3 composite hashes for build and benchmark inputs, and
the exact optimized component hash.
The reports record `dirty: false`; their shared commit hint identifies the
common source snapshot, while their matching composite input hashes establish
that both targets used the same build and benchmark inputs.
`run.sh --check` validates every historical report and requires each P2/P3 pair
to share the input hashes without resolving Git history. `run.sh
--check-current` additionally compares selected reports with the current
checkout. With five samples, the reported p95 is the observed maximum; it is
descriptive evidence rather than a stable tail-latency estimate.

## GOL-347 compiler profile and mitigation

The 2026-09-04 schema-v5 reports add a shared TypeScript compiler-API profile
and feature-gated execution-job phase/counter summaries. The accepted bounded
mitigation replaces the default path-based `readFileSync` open/stat/8 KiB read
loop with one private native whole-file read, while file-descriptor operands and
custom flags retain the existing path.
The reports record the `typescript-compiler-profiling` component feature, and
the canonical cold CLI workload runs before the in-component profiling sidecar.

The current reports record 68 whole-file reads for 10,961,854 bytes. The
remaining controlled P2/P3 work is approximately 7.44/7.42 s importing
TypeScript, 4.82/4.82 s creating the program, and 7.55/7.54 s computing
diagnostics. Runtime creation, loader setup, process setup, transport wiring,
and wrapper preparation together remain under 5 ms.

The reports also record 157,680,677-byte P2 and 155,016,474-byte P3 optimized
components, 35.29/34.62 s builds, and 20.99/21.10 s preparation plus
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

# Agentic TypeScript compatibility and performance suite

This manual suite measures TypeScript workflows performed from inside
`wasm-rquickjs:execution`. It uses raw mounted projects and a pinned, real
`node_modules`; it does not bundle the workload.

## Prerequisites

- Node.js 22.14.0 with npm 10.9.2
- Rust and the repository's normal wasm32 component targets

The runner performs a clean, locked install before measuring. To prepare the
same tools manually:

```sh
cd tests/agentic_ts
npm ci --ignore-scripts --no-audit --no-fund
```

Run both targets from the repository root:

```sh
tests/agentic_ts/run.sh
```

During profiler development, validate only the shared controlled workload and
the feature-gated execution-job profile with:

```sh
AGENTIC_TS_PROFILE_SMOKE=1 tools/dev-test.sh p2 fast-start agentic_ts ""
AGENTIC_TS_PROFILE_SMOKE=1 tools/dev-test.sh p3 fast-start agentic_ts ""
```

Validate every checked-in report's schema, pinned settings, workload outcomes,
tracker reference, and P2/P3 input-hash pairing without installing Node or
rerunning the workloads:

```sh
tests/agentic_ts/run.sh --check
```

Validate selected reports against the current checkout's composite BLAKE3
input hashes:

```sh
tests/agentic_ts/run.sh --check-current \
  tests/agentic_ts/results/2026-08-27-p2-macos-aarch64.json \
  tests/agentic_ts/results/2026-08-27-p3-macos-aarch64.json
```

Set `AGENTIC_TS_ITERATIONS` to change the measured iteration count. The runner
writes raw JSON reports under `tests/agentic_ts/results/`. Timings are
indicative local measurements, not CI thresholds. Run from a clean checkout
and record machine load and cache settings when comparing commits.

Reports identify build inputs and benchmark inputs with deterministic BLAKE3
composite hashes over sorted paths and file contents. They also hash the exact
optimized component that was executed. The recorded Git commit is only a
navigation hint: validation never requires that commit to remain reachable, so
rebases and squash merges do not invalidate otherwise identical measurements.

Each exported component invocation reuses the component instance and mounted
workspace. Every TypeScript/compiler operation inside it uses a fresh execution
job. Therefore QuickJS mutable state is fresh while `.tsbuildinfo`, emitted
files, and other workspace artifacts intentionally persist.

Schema-v5 reports also run the same `profile-typescript.mjs` program under
host Node and inside a fresh QuickJS execution job. It separates TypeScript
module import, configuration loading and parsing, program/graph construction,
and diagnostics. Per-phase filesystem probe counts, read bytes, source-file
classification, process memory snapshots, and host-to-job outer overhead make
the dominant phase visible before an optimization is selected. These are
instrumented measurements, so compare phase proportions within each target;
the existing CLI workload remains the compatibility and end-to-end baseline.
The feature-gated job profile additionally aggregates native module-resolution
outcomes, file and directory probes, package metadata and module-source reads,
TypeScript transformations, and `node:fs` read/stat/directory operations. It
records bounded counters and byte totals rather than paths or event traces.

The Wasmtime host records the highest requested guest linear-memory size
without limiting growth. With Golem's Wasmtime fork it explicitly excludes
internal GC-heap callbacks, matching stock Wasmtime's guest-linear-memory-only
callback. Compiler jobs also record QuickJS heap use before loading TypeScript
and immediately before each fresh runtime is dropped. The former detects state
carried into a supposedly fresh runtime; the latter checks that equivalent jobs
end with comparable live heaps. Linear-memory high-water values are descriptive:
the report includes every workload checkpoint, but the value is monotone across
the component instance and cannot reveal allocations that fit inside memory
reserved by an earlier workload. A successful job after every exceptional
series verifies that execution capacity was reclaimed.

The initial reports use dev-profile guest components and mirror the repository's
canonical runtime profiles: P2 with Golem's Wasmtime fork and P3 with stock
Wasmtime. Treat each profile as its own compatibility and local-regression
baseline. A cross-profile comparison does not isolate either the WASI preview
level or the Wasmtime distribution and is not a production performance
comparison.

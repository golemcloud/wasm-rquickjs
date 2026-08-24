# Agentic TypeScript compatibility and performance suite

This manual suite measures TypeScript workflows performed from inside
`wasm-rquickjs:execution`. It uses raw mounted projects and a pinned, real
`node_modules`; it does not bundle the workload.

## Prerequisites

- Node.js 22.14.0 with npm 10.9.2
- Rust and the repository's normal wasm32 component targets
- `/usr/bin/time` for optional host peak-RSS collection

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
  tests/agentic_ts/results/2026-08-24-p2-macos-aarch64.json \
  tests/agentic_ts/results/2026-08-24-p3-macos-aarch64.json
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

The Wasmtime host records the highest requested linear-memory size without
limiting growth. Compiler jobs also record QuickJS heap use before loading
TypeScript and immediately before each fresh runtime is dropped. The former
detects state carried into a supposedly fresh runtime; the latter checks that
equivalent jobs end with comparable live heaps. Linear memory is not expected
to shrink, but successful, failed, timed-out, and cancelled job series should
approach a stable high-water mark. A successful job after every exceptional
series verifies that execution capacity was reclaimed.

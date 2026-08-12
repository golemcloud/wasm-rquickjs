# Agentic TypeScript compatibility and performance suite

This manual suite measures TypeScript workflows performed from inside
`wasm-rquickjs:execution`. It uses raw mounted projects and a pinned, real
`node_modules`; it does not bundle the workload.

## Prerequisites

- Node.js 22.14.0 with npm 10.9.2
- Rust and the repository's normal wasm32 component targets
- `/usr/bin/time` for optional host peak-RSS collection

Install the pinned tools once:

```sh
cd tests/agentic_ts
npm ci --ignore-scripts --no-audit --no-fund
```

Run both targets from the repository root:

```sh
tests/agentic_ts/run.sh
```

Check that the dated reports still match the suite sources and pinned settings
without rerunning the workloads:

```sh
tests/agentic_ts/run.sh --check
```

Set `AGENTIC_TS_ITERATIONS` to change the measured iteration count. The runner
writes raw JSON reports under `tests/agentic_ts/results/`. Timings are
indicative local measurements, not CI thresholds. Run from a clean checkout
and record machine load and cache settings when comparing commits.

Each exported component invocation reuses the component instance and mounted
workspace. Every TypeScript/compiler operation inside it uses a fresh execution
job. Therefore QuickJS mutable state is fresh while `.tsbuildinfo`, emitted
files, and other workspace artifacts intentionally persist.

The Wasmtime host records the highest requested linear-memory size without
limiting growth. QuickJS heap samples come from fresh jobs. Linear memory is
not expected to shrink; repeated workloads should approach a stable high-water
mark instead of growing without bound.

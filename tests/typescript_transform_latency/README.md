# TypeScript transform latency

This manual suite measures the public synchronous transform API plus four execution
paths: inline source, entry modules, ESM imports, and CommonJS loads. It runs
increasing source sizes in both strip-only and transform modes for P2 and P3.
The ESM matrix also imports output prepared by the direct API outside the timed
region, separating native transformation from downstream module compilation.

The largest requested size also records timeout and cancellation completion latency. A
same-runtime timer measures sibling responsiveness while the public synchronous
transform API is active, compared with an isolated timer baseline. Wasmtime's
instance-wide guest linear-memory high-water mark is recorded after repeated fresh
execution jobs. Transform profiles include an enum so transform-required syntax is
covered in addition to the cross-mode erasable source. The timings are descriptive
local evidence, not CI thresholds.

Run the four bounded profiles from the repository root:

```sh
tests/typescript_transform_latency/run.sh
```

Validate checked-in report contracts without executing workloads:

```sh
tests/typescript_transform_latency/run.sh --check
```

To additionally require that the historical reports were captured from the
current runtime and benchmark inputs, use `--check-current`. This stricter check
is expected to fail after relevant source changes until a new measurement matrix
is intentionally captured; do not rewrite capture hashes without rerunning the
workloads.

Override the defaults with `TYPESCRIPT_TRANSFORM_LATENCY_SIZES` (a comma-separated,
strictly increasing requested-byte target list) and
`TYPESCRIPT_TRANSFORM_LATENCY_ITERATIONS` (at least three). Each execution-path
sample uses a fresh execution job and, where filesystem-backed, a unique module
path; direct API samples run in the report's outer runtime. No QuickJS runtime,
Wasmtime store, or component instance is reused across reports.

The direct public API samples cover dense requested-size profiles through 64 KiB on
the recorded three-sample macOS arm64 host and target combinations. The current
requested 64-KiB direct-API maxima range from 17.65 to 19.19 ms. This is descriptive
evidence, not a CI threshold or a general upper bound. Earlier strip-mode captures
showed roughly 11-second ESM module latency after transformation. GOL-347 localized
that delay to two repository-owned source scanners and changed them to bulk-skip
contiguous ASCII whitespace. The refreshed matrix now completes the requested
64-KiB strip-mode prepared-ESM case in 189–191 ms and ordinary ESM in 325–329 ms on
P2/P3, removing the whitespace-size pathology without changing the transform API.

# TypeScript transform latency

This manual suite measures the public synchronous transform API plus four execution
paths: inline source, entry modules, ESM imports, and CommonJS loads. It runs
increasing source sizes in both strip-only and transform modes for P2 and P3.
The ESM matrix also imports output prepared by the direct API outside the timed
region, separating native transformation from downstream module compilation.

The largest size also records timeout and cancellation completion latency. A
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

Override the defaults with `TYPESCRIPT_TRANSFORM_LATENCY_SIZES` (a comma-separated,
strictly increasing byte list) and `TYPESCRIPT_TRANSFORM_LATENCY_ITERATIONS` (at
least three). Each sample uses a fresh execution job and a unique module path; no
QuickJS runtime, Wasmtime store, or component instance is reused across reports.

The documented native-transform bound is deliberately narrow: the direct public
API samples cover dense inputs through 64 KiB on the recorded host, target, and
three-sample profile. The calibration observed 64-KiB direct-API maxima at or below
21 ms in all four P2/P3 strip/transform profiles; a conservative 25 ms maximum is
the accepted local bound for this exact profile. This is evidence, not a CI
threshold or a general upper bound. In strip mode, the separately timed
prepared-ESM case reproduces nearly all of the much larger ESM module latency after
transformation, while similarly sized inputs with the same dense stripped padding
complete inline in about 203 ms and through CommonJS in about 370 ms. This localizes
the separate bottleneck to the ESM module-loading path rather than generic
compilation of whitespace-preserving output. GOL-347 owns phase-level profiling and
any measured optimization for that path; end-to-end strip-mode ESM latency is not
considered acceptable here.

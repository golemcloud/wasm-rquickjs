# Manual npm metadata measurements

## Matched production release baseline

`tests/npm_metadata/run.sh --release` produces the checked production evidence
pair. It uses the pinned Node 22.14.0/npm 10.9.2 toolchain, locked host and guest
release builds, and the production `normal` component feature. Five iterations
compare the same deterministic loopback registry on host Node and Wasm:

- a fresh-root, fresh-cache `npm view @types/lodash-es@4.17.12 version`; and
- `npm ci --offline` after an untimed seed populated an otherwise isolated
  tarball cache, with `node_modules` removed outside the timed boundary.

Each sample records exact output, success/overflow state, authoritative local
registry request counts, npm HTTP log counts, install identities, unchanged
lockfile evidence, and (for Wasm) linear-memory high-water observations captured
outside the timed invocation. Reports also fingerprint the copied npm tool tree,
fixture and tarball bytes, source/build inputs, host dependency graph, component,
profiles, toolchain, and cache settings. Public npmjs.org timings and npm
`--version` startup rows are intentionally excluded from the v2 release schema.

Run the contract without workloads or network access with:

```sh
tests/npm_metadata/run.sh --check
tests/npm_metadata/run.sh --check-current \
  tests/npm_metadata/results/2026-09-24-release-p2-macos-aarch64.json \
  tests/npm_metadata/results/2026-09-24-release-p3-macos-aarch64.json
```

The shared typed currentness helper parses the four-field manifest, verifies the
companion pair, and always compares each report with the manifest's source hint,
build hash, and benchmark hash. When the recorded source is available locally,
it also recomputes those hashes from a temporary pristine worktree. After a
rebase or squash replaces that commit, the durable manifest/report identity remains
validated without substituting the checkout as a measured source.

No `npm-metadata-v2` report is accepted as current unless both target reports
match the manifest's recorded input hashes and form one distinct P2/P3 pair.
When the source hint is available locally, those hashes must also match an exact
source recomputation. Changing the file sets that define either composite hash
requires remeasuring the current pair. The dated final
pair and its measured goal status are documented here only after that validation
passes from a clean source commit. Each `current-reports.txt` entry records the
measured source hint, build hash, benchmark hash, and report path for CI
currentness selection. Only this v2 pair is
retained as raw npm evidence; older v1 and path-trace results remain summarized
in the Markdown experiment reports.

### 2026-09-24 retained small-fixture measurement

The final [P2](2026-09-24-release-p2-macos-aarch64.json) and
[P3](2026-09-24-release-p3-macos-aarch64.json) reports measure exact clean
source revision `831632c61e49eedb69b635f25f75f5bf5c89f6b3`. All 60 host/Wasm
samples succeeded; none overflowed, every registry counter reconciled with zero
unexpected requests, and every `npm ci` produced the exact install tree without
changing the rewritten lockfile.

| Target / workload | Host median | Wasm median | Wasm / host | Goal ceiling | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| P2 cold metadata | 156.724 ms | 1,069.307 ms | 6.82x | 970.171 ms (`3x + 0.5s`) | misses by 99.136 ms |
| P3 cold metadata | 149.442 ms | 1,052.270 ms | 7.04x | 948.327 ms (`3x + 0.5s`) | misses by 103.942 ms |
| P2 warm-tarball `npm ci` | 248.087 ms | 2,272.384 ms | 9.16x | 1,496.175 ms (`2x + 1s`) | misses by 776.209 ms |
| P3 warm-tarball `npm ci` | 231.195 ms | 2,360.249 ms | 10.21x | 1,462.390 ms (`2x + 1s`) | misses by 897.859 ms |

Peak observed Wasm linear-memory high-water was 55.25 MiB for P2 and
48.25 MiB for P3. Compared with the pre-optimization production anchors at
revision `fae34bd9` (52.75 MiB and 48.125 MiB), that is +4.7% for P2 and +0.3%
for P3, within the 10% regression gate. The
[follow-up report](2026-09-24-release-cache-followups.md) records the retained
directory-prefix optimization and the measured candidates rejected on memory,
timing, or Node-fidelity grounds.

## Historical diagnostics

The dated JSON files are raw observations, not CI pass/fail thresholds. Run one
target at a time with the pinned Node 22.14.0/npm 10.9.2 installation:

```sh
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=3 NPM_METADATA_REPORT=tests/npm_metadata/results/YYYY-MM-DD-p2.json \
  tools/dev-test.sh p2 standard npm_metadata ''
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=3 NPM_METADATA_REPORT=tests/npm_metadata/results/YYYY-MM-DD-p3.json \
  tools/dev-test.sh p3 standard npm_metadata ''
```

Use the explicit `release` profile for a local production-build diagnostic. It
compiles both the host benchmark harness and generated guest component with
Cargo's release profile while retaining the same fresh-state measurement
semantics:

```sh
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p2.json \
  tools/dev-test.sh p2 release npm_metadata ''
NPM_METADATA_RUN=1 NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p3.json \
  tools/dev-test.sh p3 release npm_metadata ''
```

The current `npm-metadata-v1` schema does not record enough build provenance to
serve as the checked release baseline. Do not check in or compare these
diagnostic outputs as release evidence until the report records and validates
the host/component profiles, component digest, and build inputs.

Set `PATH` to the pinned Node installation first. The runner fetches the two
lockfile-pinned tarballs once before timing and serves the same bytes from the
local registry. Each cold invocation gets a fresh component instance, guest
runtime, workspace, and npm cache. Warm rows repeat a fresh execution job with
the same workspace/cache and are always labeled separately. Immutable
Wasmtime component preparation is shared but excluded from per-command timing.
The local registry is a controlled HTTP transport, not a network latency
baseline. Without `NPM_METADATA_RUN=1`, the test target exits without building
the component or using the network. Public npmjs.org results must never be used
as CI timing gates.

## Historical trace retention

The 2026-09-18 baseline and path-trace evidence is retained as reviewed
aggregates in `2026-09-18-report.md`. Its v1/path-trace JSON and one-off
instrumentation patch lacked the provenance contract of the v2 release pair,
so they are intentionally omitted from the code review.

## Cache experiments

The follow-up [cache experiment report](2026-09-21-cache-experiments.md)
records independent and combined five-pair measurements for the graph-scoped
missing `package.json` cache and runtime-scoped positive loader realpath cache.
It also records the final three-iteration P2/P3 candidate after review split
the CommonJS and ESM cache domains. Candidate and prototype samples remain
summarized in the report's aggregate tables; only the current v2 release pair
is retained as raw npm evidence.

The later [release-cache follow-up](2026-09-24-release-cache-followups.md)
records directory-prefix realpath reuse, the final matched release pair, and
the bytecode/lazy-loading/path-normalization/negative-probe experiments that
were measured and rejected.

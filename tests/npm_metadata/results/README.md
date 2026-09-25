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

The currentness command requires Git and `jq`; it recomputes source hashes from
a temporary pristine worktree at the exact revision in `current-reports.txt`.

No `npm-metadata-v2` report is accepted as current unless both target reports
match the source input hashes and form one distinct P2/P3 pair. The dated final
pair and its measured goal status are documented here only after that validation
passes from a clean source commit. `current-reports.txt` pairs that latest pair
with its exact measured source revision for CI currentness selection;
superseded `npm-metadata-v2` pairs remain contract-validated without being
treated as evidence for a later source tree. Earlier v1 and path-trace JSON
remain historical evidence outside this v2 currentness contract.

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

## Reproduce the cold path trace

The dated trace patch is a measurement tool, not a runtime change. It applies
to the 2026-09-18 baseline revision `9619718a1c444dd490d6075494de91918c712734`,
not to the current branch head. Create a clean worktree at that revision, use
the pinned Node/npm installation, and apply it only for the measurement. It
adds bounded per-job path-frequency counters and emits aggregate counts
without path strings.

```sh
git worktree add --detach ../wasm-rquickjs-npm-trace-baseline 9619718a1c444dd490d6075494de91918c712734
cd ../wasm-rquickjs-npm-trace-baseline
git apply --check tests/npm_metadata/results/2026-09-18-trace.patch
git apply tests/npm_metadata/results/2026-09-18-trace.patch
NPM_METADATA_RUN=1 NPM_METADATA_TRACE=1 NPM_METADATA_ITERATIONS=3 \
  NPM_METADATA_REPORT=/tmp/npm-metadata-trace-p2.json \
  tools/dev-test.sh p2 standard npm_metadata ''
NPM_METADATA_RUN=1 NPM_METADATA_TRACE=1 NPM_METADATA_ITERATIONS=3 \
  NPM_METADATA_REPORT=/tmp/npm-metadata-trace-p3.json \
  tools/dev-test.sh p3 standard npm_metadata ''
git apply --reverse tests/npm_metadata/results/2026-09-18-trace.patch
git diff --exit-code -- crates/wasm-rquickjs/skeleton tests/npm_metadata.rs
cd -
git worktree remove ../wasm-rquickjs-npm-trace-baseline
```

The two reproduction commands write separate `/tmp` files and do not
overwrite the checked-in observations. Both targets require a local loopback
listener and one pre-timing fetch of the pinned tarballs. The trace has no warm
or public-registry rows, and its timings should not be mixed with the original
baseline.

## Cache experiments

The follow-up [cache experiment report](2026-09-21-cache-experiments.md)
records independent and combined five-pair measurements for the graph-scoped
missing `package.json` cache and runtime-scoped positive loader realpath cache.
It also records the final three-iteration P2/P3 candidate after review split
the CommonJS and ESM cache domains. Only the final reviewed P2/P3 raw reports
are retained; the prototype samples remain summarized in the report's
aggregate tables.

The later [release-cache follow-up](2026-09-24-release-cache-followups.md)
records directory-prefix realpath reuse, the final matched release pair, and
the bytecode/lazy-loading/path-normalization/negative-probe experiments that
were measured and rejected.

# Manual npm release measurements

## Matched production release baseline

`tests/npm_metadata/run.sh --release` produces the checked production evidence
pair. It uses the pinned Node 22.14.0/npm 10.9.2 toolchain, locked host and guest
release builds, and the production `normal` component feature. Five iterations
compare the same deterministic loopback registry on host Node and Wasm:

- a fresh-root, fresh-cache `npm view @types/lodash-es@4.17.12 version`; and
- small and medium `npm ci --offline` installs after an untimed seed populated
  an otherwise isolated tarball cache, with `node_modules` removed outside the
  timed boundary. The small fixture has two packages; the medium fixture has
  11 direct and 16 total pure-JavaScript packages.

Each sample records exact output, success/overflow state, authoritative local
registry request counts, npm HTTP log counts, install identities, unchanged
lockfile evidence, normalized installed-tree content, separate POSIX-mode
evidence, and (for Wasm) linear-memory high-water observations captured outside
the timed invocation. Reports also fingerprint the copied npm tool tree, the
complete lockfile-derived fixture graph, tarball bytes, source/build inputs,
host dependency graph, component, profiles, toolchain, and cache settings.
Public npmjs.org timings and npm `--version` startup rows are intentionally
excluded from the v3 release schema.

Local registry counters are the authoritative HTTP evidence. npm HTTP log
counts are derived during generation and retained as corroborating aggregates;
raw stderr is compacted to a byte count and BLAKE3 digest rather than repeated
in every sample.

Run the contract without workloads or network access with:

```sh
tests/npm_metadata/run.sh --check
tests/npm_metadata/run.sh --check-current \
  tests/npm_metadata/results/2026-10-05-release-p2-macos-aarch64.json \
  tests/npm_metadata/results/2026-10-05-release-p3-macos-aarch64.json
```

The shared typed currentness helper parses the four-field manifest, verifies the
companion pair, and always compares each report with the manifest's source hint,
build hash, and benchmark hash. When the recorded source is available locally,
it also recomputes those hashes from a temporary pristine worktree. After a
rebase or squash replaces that commit, the durable manifest/report identity
remains validated without substituting the checkout as a measured source.

No `npm-metadata-v3` report is accepted as current unless both target reports
match the manifest's recorded input hashes and form one distinct P2/P3 pair.
When the source hint is available locally, those hashes must also match an exact
source recomputation, including the complete package identity derived from the
checked-in manifests and locks. Changing a composite-hash input requires
remeasuring the current pair. Each `current-reports.txt` entry records the
measured source hint, build hash, benchmark hash, and report path. Only the
final v3 pair is retained as raw npm evidence; v1/path-trace and superseded v2
raw files remain represented by their Markdown aggregates.

### 2026-10-05 retained small-and-medium measurement

The final [P2](2026-10-05-release-p2-macos-aarch64.json) and
[P3](2026-10-05-release-p3-macos-aarch64.json) reports measure exact clean
source revision `5965bdb5416f6eca085856df383e73dffc2b7eb8`. All 100 host/Wasm
samples succeeded without overflow. Every registry counter reconciled with
zero unexpected requests, every timed offline install made zero HTTP requests,
and all installs preserved the rewritten lockfile and exact expected
package/file content.

| Target / workload | Host median | Wasm median | Wasm / host | Goal ceiling | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| P2 cold metadata | 190.158 ms | 1,068.279 ms | 5.62x | 1,070.474 ms (`3x + 0.5s`) | meets by 2.195 ms |
| P3 cold metadata | 193.908 ms | 1,092.406 ms | 5.63x | 1,081.724 ms (`3x + 0.5s`) | misses by 10.682 ms |
| P2 small warm-tarball `npm ci` | 234.934 ms | 2,378.096 ms | 10.12x | 1,469.868 ms (`2x + 1s`) | misses by 908.227 ms |
| P3 small warm-tarball `npm ci` | 246.983 ms | 2,359.112 ms | 9.55x | 1,493.966 ms (`2x + 1s`) | misses by 865.145 ms |
| P2 medium warm-tarball `npm ci` | 903.200 ms | 22,694.225 ms | 25.13x | 2,806.400 ms (`2x + 1s`) | misses by 19,887.825 ms |
| P3 medium warm-tarball `npm ci` | 806.454 ms | 22,788.904 ms | 28.26x | 2,612.909 ms (`2x + 1s`) | misses by 20,175.995 ms |

The representative medium graph exposes a material scaling owner: both Wasm
targets take about 22.7-22.8 seconds with a warm tarball cache. Wasm medium
p95 is 24,627.521 ms for P2 and 24,526.309 ms for P3, respectively 8.5% and
7.6% above their medians, so the guest samples show no severe unexplained tail.
The raw host samples retain an isolated P2 medium tail (731.381-1,736.617 ms)
and the alternating host/Wasm order; the table uses the preregistered median.

Peak small-install linear-memory high-water is 53.56 MiB for P2 and 48.25 MiB
for P3, versus 55.25 MiB and 48.25 MiB in the superseded 2026-09-24 v2 pair.
That is within the 10% memory gate, although the v3 registry metadata gained
integrity fields and the comparison is not optimization attribution. Medium
warm-install high-water is 201.13 MiB for P2 and 196.69 MiB for P3; because the
timed install reuses its seeded component instance, this monotone observation
includes the seed peak and becomes the baseline for future medium candidates.

Host and Wasm content-tree hashes match for all small and medium installs.
Modes are deliberately excluded from that equality hash and retained
separately: host npm produced four executable medium-fixture files and both
`semver`/`uuid` bin targets were executable, while WASI produced none because
its filesystem bridge cannot apply `chmod`. The report therefore exposes this
known execution-fidelity limitation instead of claiming byte-and-mode identity;
the benchmark itself never executes installed bins.

### Superseded 2026-09-24 small-fixture anchor

The removed v2 raw pair measured source `831632c61e49eedb69b635f25f75f5bf5c89f6b3`.
Its retained aggregate was 1,069.307/1,052.270 ms for P2/P3 metadata and
2,272.384/2,360.249 ms for P2/P3 warm `npm ci`, with peak small-workload memory
of 55.25/48.25 MiB. The [follow-up report](2026-09-24-release-cache-followups.md)
contains the full prior table and the retained/rejected cache experiments.

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

The historical `npm-metadata-v1` schema does not record enough build provenance to
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
instrumentation patch lacked the provenance contract of the checked release pair,
so they are intentionally omitted from the code review.

## Cache experiments

The follow-up [cache experiment report](2026-09-21-cache-experiments.md)
records independent and combined five-pair measurements for the graph-scoped
missing `package.json` cache and runtime-scoped positive loader realpath cache.
It also records the final three-iteration P2/P3 candidate after review split
the CommonJS and ESM cache domains. Candidate and prototype samples remain
summarized in the report's aggregate tables; only the current v3 release pair
is retained as raw npm evidence.

The later [release-cache follow-up](2026-09-24-release-cache-followups.md)
records directory-prefix realpath reuse, the final matched release pair, and
the bytecode/lazy-loading/path-normalization/negative-probe experiments that
were measured and rejected.

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

The P2 metadata row meets the formula by only 2.195 ms and is not a robust
goal pass. Its five host samples span 145.254-411.509 ms, while the P3 host
samples span 155.729-524.204 ms; both series are bimodal. Relative to the v2
anchor, the P2 host median rose from 156.724 to 190.158 ms while the Wasm
median was effectively unchanged at 1,069.307 versus 1,068.279 ms. The table
keeps the preregistered median arithmetic, but this status reflects host
dispersion rather than a Wasm improvement.

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

### 2026-10-08 medium extraction attribution

GOL-737 rebaselined the medium P2 workload on exact production source
`4ad0cea7c3843b6cb98e183891a2b8fd081e0824`. One serial uninstrumented sample
took 9,755.564 ms versus 949.499 ms on the host, down from the retained
22,694.225 ms P2 result above. The 8,806.065 ms host-adjusted gap set a
preregistered material-owner threshold of 2,201.516 ms. This was an attribution
experiment, not an optimization comparison; the current-main improvement spans
other merged work.

Measurements used macOS 26.6.2 on arm64 with Node 22.14.0 and npm 10.9.2. The
temporary paired diagnostic head was `b89964d26f781bf394cd7931f50ea74f3d04a25c`;
its npm timing patch had BLAKE3
`da8cc9ef62283db266441f649f1c3a0349e0d86f5a902cc2125325bb338a84ad`.

A temporary profiling build then alternated five control and five trace samples.
Control median was 9,534.061 ms (range 9,439.172--9,952.776 ms), while trace
median was 9,944.005 ms (range 9,689.515--10,136.046 ms). The 4.30% trace
perturbation remained below the 10% gate. All ten installs succeeded without
overflow or HTTP, preserved the lockfile, and produced the same installed-tree
hash with 10,070 package files (10,071 files total). Control and trace memory
were stable at 179,109,888 and 181,141,504 bytes respectively.

npm's `reify:unpack` envelope was 8,266 ms at the trace median, or 83.1% of
trace wall time. Each trace observed 10,123 opens, 10,239 writes, 10,098 closes,
10,372 `lstat` calls, 703 `mkdir` calls, and 153 `stat` calls. Every operation's
success/not-found/error outcomes reconciled to its call count; writes totaled
33,839,228--33,839,230 bytes, and module-probe negative-cache invalidation
discarded zero entries during the extraction path.

Deterministic 1-in-64 sampling placed the median native-operation total at
2,393 ms and the enclosing JavaScript callback boundaries at 6,709 ms. The
largest envelopes were `lstat` callbacks at 3,508 ms and close callbacks at
1,335 ms. These clocks end after invoking the user callback, so they include
synchronous npm and tar work resumed inside that callback and are not measurements
of runtime overhead. About 4.3 seconds of the callback-envelope total remained
outside the sampled native bodies. Within `lstat`, the 704 ms native estimate
and 508 ms spent constructing 10,090 expected not-found errors still leave about
2.3 seconds undecomposed, slightly above the material-owner threshold. The
instrumentation did not separate runtime wrapper and `Stats` work from npm/tar
callback work.

One temporary direct no-throw delivery trace was roughly 0.6 seconds faster than
an adjacent trace. That is within the paired sample spread and consistent with
the roughly 0.5-second error-construction estimate, so the single sample was not
treated as speedup evidence and the prototype was reverted.

No owner above the gate was isolated at this instrumentation granularity. The
stop rule therefore ended the experiment after P2 without creating an
optimization issue or running P3; this negative attribution is not proof that no
optimizable owner remains. The diagnostic code, npm patch, and raw trace report
were removed; their aggregate result is retained here.

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

# npm release-cache follow-ups — 2026-09-24

This report continues the loader-cache work documented in
`2026-09-21-cache-experiments.md`, but evaluates production `normal` components
with matched host/P2/P3 release builds. Only the final raw P2/P3 pair is
retained. Intermediate and rejected candidates are summarized here rather than
kept sample by sample.

The pre-optimization release pair was measured at `fae34bd9`. The retained
source revision is `831632c61e49eedb69b635f25f75f5bf5c89f6b3`.

## Retained loader realpath directory prefixes

Revision `831632c6` extends the loader-only positive realpath cache with known
non-symlink directory prefixes. Repeated module resolutions can start below
already confirmed package-directory ancestors instead of walking every segment
again. Public `node:fs` realpath APIs remain uncached, CommonJS and ESM retain
separate loader cache domains, and preserve-symlink paths continue to bypass
canonicalization.

Five-sample release measurements against the original production pair showed:

| Target / workload | Original Wasm median | Prefix-cache Wasm median | Change |
| --- | ---: | ---: | ---: |
| P2 cold metadata | 1,332.059 ms | 1,069.307 ms | -262.752 ms (-19.7%) |
| P3 cold metadata | 1,277.538 ms | 1,052.270 ms | -225.268 ms (-17.6%) |
| P2 warm-tarball `npm ci` | 2,718.971 ms | 2,272.384 ms | -446.587 ms (-16.4%) |
| P3 warm-tarball `npm ci` | 2,503.777 ms | 2,360.249 ms | -143.528 ms (-5.7%) |

Peak observed linear memory was 55.25 MiB for P2 and 48.25 MiB for P3, or
+4.7% and +0.3% against the original production anchors. Both remain within
the 10% memory gate.

The runtime regression test verifies reuse for both CommonJS and ESM, separate
cache domains, exact counter reconciliation, fresh Wizer/runtime state, failed
lookup retries, symlink retargeting, preserve-symlink behavior, and uncached
public realpath calls.

## Final matched release pair

The retained reports use five iterations, the pinned Node 22.14.0/npm 10.9.2
tool tree, one deterministic loopback registry, isolated caches and workspaces,
fresh component/runtime state, and release builds for both host harness and
guest component.

| Target / workload | Host median | Wasm median | Goal status |
| --- | ---: | ---: | --- |
| P2 cold metadata | 156.724 ms | 1,069.307 ms | misses `3x + 0.5s` by 99.136 ms |
| P3 cold metadata | 149.442 ms | 1,052.270 ms | misses `3x + 0.5s` by 103.942 ms |
| P2 warm-tarball `npm ci` | 248.087 ms | 2,272.384 ms | misses `2x + 1s` by 776.209 ms |
| P3 warm-tarball `npm ci` | 231.195 ms | 2,360.249 ms | misses `2x + 1s` by 897.859 ms |

All 60 host/Wasm samples succeeded without overflow. Local HTTP totals, npm
HTTP log counts, exit status, metadata output, install identities, and unchanged
lockfiles reconciled. The repository report validator accepted the pair against
the retained source inputs.

Retained raw reports:
[P2](2026-09-24-release-p2-macos-aarch64.json) and
[P3](2026-09-24-release-p3-macos-aarch64.json).

## Native filesystem attribution

A temporary P2 diagnostic timed the bodies of the public native filesystem
operations without retaining instrumentation in the product. In the
counter-heavy profiling build, warm-tarball `npm ci` spent 806.419 ms of a
6,373.474 ms wall time (12.7%) inside those bodies; the cold local-registry seed
spent 907.101 ms of 6,477.023 ms (14.0%). The warm breakdown was 326.493 ms in
675 whole-file reads, 195.741 ms in 1,054 opens, 109.207 ms in 1,037 `lstat`
calls, 107.938 ms in 1,058 writes, 46.618 ms in 1,043 closes, and 20.423 ms in
the remaining timed operations. The 941,466 written bytes and 2,911,600 read
bytes were modest; loader realpath calls were outside these timers.

The instrumented wall times are not comparable with the production release
rows. Within this diagnostic, the public native filesystem-operation bodies
were a minority of warm-`ci` wall time. That observation does not establish an
attainable production speedup or assign the remaining time to a specific
subsystem; it only deprioritizes isolated operation-body tuning relative to
broader execution and cross-layer candidates. The temporary counters and raw
diagnostic report are not retained.

## Production CommonJS loading attribution

A second temporary P2 diagnostic kept the production `normal` capability set
and added aggregate timers around CommonJS source preparation, QuickJS wrapper
compilation, and the synchronous module-loading call tree. Five matched release
iterations loaded 461 wrappers (2,182,287 source bytes) for cold metadata and
599 wrappers (2,899,812 bytes) for warm-tarball `npm ci`. Median wrapper
compilation was 111.432/151.372 ms and the Rust source-rewrite pass was only
23.938/31.945 ms for metadata/`ci` respectively.

The instrumented medians were 1,169.805 ms for metadata and 2,568.851 ms for
warm-tarball `ci`, so they are not substituted for the retained production
rows. Within those runs, builtin initialization was about 97--99 ms and the
user-work phase was 1,052.916/2,441.290 ms. The synchronous CommonJS-loading
envelope accounted for 1,003.031 ms on metadata and 1,441.491 ms on `ci`.
Because a parent frame includes a child's rewrite and compile work before the
child execution frame begins, that envelope is deliberately treated as a
module-graph total rather than added to the separate compile/rewrite figures.

The work was broad rather than dominated by one source file: the largest
per-file loading charge was 46.487 ms for `debug/src/node.js` on metadata and
42.810 ms for a nested `pacote/lib/fetcher.js` on `ci`; the largest individual
wrapper compilation was only 3.176/3.078 ms. No single source file dominates;
excluding package-level concentration would require separate per-package
aggregation. The total compilation time also bounds a perfect external-module
compile cache at roughly 111/151 ms on these fixtures: potentially enough to
close the small metadata target miss, but not the remaining `npm ci` gap by
itself. The instrumentation and raw diagnostic report were removed.

## Deferred Binaryen post-link candidate

A temporary P2 prototype ran Binaryen `wasm-opt -O3` over the large embedded
core module after Wizer, limited to four workers. Relative to an immediately
adjacent five-sample control, it reduced the optimized npm component from
13,635,445 to 12,571,350 bytes (-7.8%). Host-adjusted metadata overhead
improved from 897.689 to 881.841 ms (-15.847 ms, -1.8%), and warm-tarball
`npm ci` overhead improved from 2,352.390 to 2,250.215 ms (-102.175 ms,
-4.3%). The candidate did not increase the observed memory high-water mark.

The optimization is not retained because the prototype depended on a system
`wasm-opt` binary that the CLI, CI, and release artifacts do not currently
provide. A production version needs an explicit cross-platform integration and
distribution decision, P2/P3 semantic coverage, and release-binary size/build
cost evaluation; GOL-661 tracks that work. The temporary implementation and raw
reports were removed.

## Rejected candidates

### Missing CommonJS path classifications

Candidate `59146d15` let an outer CommonJS resolution graph retain missing file
classifications. It reduced native file probes by 3.7% for `npm --version`,
13.5% for `npm view`, and 17.4% for `npm ci`. An immediate P2 control showed a
35 ms metadata-overhead reduction and a neutral `npm ci` median.

The candidate was nevertheless rejected after source review. Node 22.14's CJS
loader stores a `Module._stat` result only when the filesystem probe succeeds;
missing results are deliberately retried. Our graph cache was owned by one
`RuntimeServices`, while filesystem invalidation also reached only that runtime.
A file created by the host or a sibling runtime sharing the same mount could
therefore remain invisible to the first runtime until its outer graph ended.
The local write/retry test could not detect this because the same runtime's
`node:fs` mutation cleared its own cache.

The source and candidate-specific evidence were reverted with normal commits.
The measured SHA remains in history, but its raw reports are not retained.

### Other rejected experiments

- Precompiling the full built-in JavaScript graph reduced initialization from
  about 90 ms to 12–14 ms, but embedded about 4.23 MiB of bytecode and raised
  observed metadata memory from about 25.9 MiB to 35 MiB and warm-`ci` memory
  from about 57.9 MiB to 67.9 MiB. That exceeded the memory gate.
- An arbitrary top-ten bytecode subset was not dependency-closed. A valid
  single-module streams subset added about 186 KiB without a meaningful
  initialization improvement.
- Lazily registering built-ins reduced initial setup to roughly 63–65 ms, but
  npm still loaded 7 modules for `--version` and 20–22 for `view`/`ci`. The
  work moved into the measured hot path, and the TypeScript release candidate
  failed its memory contract.
- Disabling QuickJS C assertions and dump scaffolding made TypeScript 2–6%
  faster in an adjacent P2 comparison and reduced component size, but the clean
  npm A/B/A leg increased host-adjusted metadata overhead from 966.626 to
  1,072.388 ms (+105.762 ms, +10.9%). Warm-tarball `npm ci` was neutral
  (2,265.541 versus 2,253.981 ms overhead). The global feature was reverted
  because the metadata regression consumes the remaining target margin.
- An upstream-isolated variant removed only inactive QuickJS dump code while
  retaining every assertion. It kept the TypeScript and size improvements but
  made npm metadata overhead 159 ms slower than the same adjacent control;
  warm-tarball `npm ci` remained neutral within noise. This narrows the split
  to dump-code removal/code layout rather than assertion evaluation.
- Borrowing already normalized absolute paths avoided some Rust allocation, but
  the correctness candidate was flat to slower in one-sample npm measurements.

All rejected prototypes were absent from the retained revision.

## Reproduction

From a clean checkout of `831632c6` with the pinned Node/npm toolchain on
`PATH`:

```sh
CARGO_BUILD_JOBS=4 NPM_METADATA_RUN=1 NPM_METADATA_RELEASE_BASELINE=1 \
  NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p2.json \
  NPM_METADATA_SOURCE_ROOT="$PWD" \
  tools/dev-test.sh p2 release npm_metadata ''

CARGO_BUILD_JOBS=4 NPM_METADATA_RUN=1 NPM_METADATA_RELEASE_BASELINE=1 \
  NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p3.json \
  NPM_METADATA_SOURCE_ROOT="$PWD" \
  tools/dev-test.sh p3 release npm_metadata ''
```

Run the commands serially. The local coordination wrapper used during
development also serialized Cargo execution; it did not change test semantics.

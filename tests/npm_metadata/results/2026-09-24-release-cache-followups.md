# npm release-cache follow-ups — 2026-09-24

This report continues the loader-cache work documented in
`2026-09-21-cache-experiments.md`, but evaluates production `normal` components
with matched host/P2/P3 release builds. Only the final raw P2/P3 pair is
retained. Intermediate and rejected candidates are summarized here rather than
kept sample by sample.

The pre-optimization release pair was measured at `fae34bd9`. The retained
source revision is `59146d1562172ecdb206ba38ac15d99503556a14`, containing both
follow-ups below.

## Loader realpath directory prefixes

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

## Missing CommonJS path probes

Revision `59146d15` lets the existing outer-graph CommonJS probe session retain
missing file classifications in addition to positive file/directory results.
Entries never escape the current outer resolution graph or QuickJS runtime.
Every successful runtime filesystem mutation clears positive paths, missing
paths, and missing package metadata, so an `npm install` that creates a module
makes it visible to later resolution. The runtime test covers miss, repeated
miss, file creation, invalidation, and successful retry on both P2 and P3.

One profiling run showed the following native file-probe reductions relative
to the directory-prefix candidate. Every counter equation reconciled.

| Local command | File-probe system calls | Reduction | Graph-session hits (missing) |
| --- | ---: | ---: | ---: |
| `npm --version` | 461 → 444 | -17 (-3.7%) | 27 (19) |
| `npm view` | 4,913 → 4,252 | -661 (-13.5%) | 903 (735) |
| `npm ci` | 7,377 → 6,090 | -1,287 (-17.4%) | 1,678 (1,420) |

Because host load varied between runs, the P2 keep decision also used an
immediately repeated five-sample control at `831632c6`. Subtracting the matched
host median from the Wasm median reduced metadata overhead from 908.523 ms to
873.528 ms (-35.0 ms, -3.9%). Warm-`ci` overhead was effectively unchanged:
2,081.748 ms control versus 2,085.759 ms candidate (+4.0 ms, +0.2%). The
deterministic syscall reduction, small metadata gain, neutral `ci` median, and
bounded memory justified retaining the cache.

The P3 observations were directionally consistent, but were not an immediate
same-machine control: metadata overhead was 902.827 → 868.810 ms (-3.8%), and
warm-`ci` overhead was 2,129.054 → 2,098.694 ms (-1.4%). These timing deltas are
supporting evidence rather than a standalone attribution.

## Final matched release pair

The retained reports use five iterations, the pinned Node 22.14.0/npm 10.9.2
tool tree, one deterministic loopback registry, isolated caches and workspaces,
fresh component/runtime state, and release builds for both host harness and
guest component.

| Target / workload | Host median | Wasm median | Goal status |
| --- | ---: | ---: | --- |
| P2 cold metadata | 226.499 ms | 1,100.028 ms | meets `3x + 0.5s` by 79.470 ms |
| P3 cold metadata | 291.300 ms | 1,160.110 ms | meets `3x + 0.5s` by 213.790 ms |
| P2 warm-tarball `npm ci` | 270.155 ms | 2,355.914 ms | misses `2x + 1s` by 815.604 ms |
| P3 warm-tarball `npm ci` | 270.565 ms | 2,369.258 ms | misses `2x + 1s` by 828.129 ms |

All 60 host/Wasm samples succeeded without overflow. Local HTTP totals, npm
HTTP log counts, exit status, metadata output, install identities, and unchanged
lockfiles reconciled. The repository report validator accepted the pair against
the retained source revision. Peak Wasm linear memory was 53.8125 MiB for P2
and 47.125 MiB for P3, within the original 10% gate.

Retained raw reports:
[P2](2026-09-24-release-p2-macos-aarch64.json) and
[P3](2026-09-24-release-p3-macos-aarch64.json).

## Rejected candidates

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
- Borrowing already normalized absolute paths avoided some Rust allocation, but
  the correctness candidate was flat to slower in one-sample npm measurements.

All rejected prototypes were reverted before the retained revision. Their raw
reports are not part of the review surface.

## Reproduction

From a clean retained revision with the pinned Node/npm toolchain on `PATH`:

```sh
CARGO_BUILD_JOBS=4 NPM_METADATA_RUN=1 NPM_METADATA_RELEASE_BASELINE=1 \
  NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p2.json \
  tools/dev-test.sh p2 release npm_metadata ''

CARGO_BUILD_JOBS=4 NPM_METADATA_RUN=1 NPM_METADATA_RELEASE_BASELINE=1 \
  NPM_METADATA_ITERATIONS=5 NPM_METADATA_REPORT=/tmp/npm-release-p3.json \
  tools/dev-test.sh p3 release npm_metadata ''
```

Run the commands serially. The local coordination wrapper used during
development also serialized Cargo execution; it did not change test semantics.

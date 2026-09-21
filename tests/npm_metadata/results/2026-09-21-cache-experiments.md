# npm loader cache experiments — 2026-09-21

The path-frequency trace from 2026-09-18 showed material repetition in two
loader call sites: 69–70% of missing optional `package.json` reads and 83–88%
of CommonJS canonicalization realpaths revisited a path within one execution
job. This follow-up tested each cache independently, retained both candidates,
and measured the combined production behavior.

The initial production commits are `6897f208` for graph-scoped missing package
metadata and `fc42de34` for runtime-scoped positive loader realpaths. Combined
HEAD was `a492849a`. Each experiment temporarily added a profiling-only switch
to compare control and candidate in the same optimized component. Those
switches and their npm fixture exports were removed after measurement.

Review then identified that Node keeps CommonJS and ESM realpath state
separate, and that ESM source reads must continue to bypass canonicalization
under `--preserve-symlinks`. Commit `f88f62e8` split the cache domains, fixed
the preserve path, and removed a duplicate physical realpath on failed
CommonJS canonicalization. The final candidate was measured again at that
exact commit.

## Method

Each target ran five alternating control/candidate pairs for `npm --version`,
`npm view`, and cold `npm ci`. Runs were serial and used Node 22.14.0/npm
10.9.2, the deterministic local registry, and a fresh Wasmtime store,
component instance, QuickJS runtime, workspace, and npm cache per invocation.
Every command succeeded. Every `ci` installed both pinned packages and made
two local tarball requests; every `view` made one metadata request. No trace
overflow or raw path was emitted.

The timings use the instrumented development component and host process CPU,
so the filesystem call counts are the primary decision signal. Times below
are five-sample medians in seconds.

## Independent negative package metadata cache

Missing metadata is cached only while an outer CommonJS resolution graph is
active. It is cleared when the graph returns or throws and after guest
filesystem mutations. Only `NotFound` is retained; parse errors and other I/O
errors are retried. The shorter lifetime explains why the remaining physical
misses are slightly above the distinct-path counts from the earlier whole-job
trace.

| Target / command | Missing reads control → candidate | Wall control → candidate | CPU control → candidate |
| --- | ---: | ---: | ---: |
| P2 `--version` | 204 → 96 (-52.9%) | 0.781 → 0.774 | 0.788 → 0.782 |
| P2 `view` | 1,768 → 596 (-66.3%) | 5.948 → 5.906 | 6.032 → 5.991 |
| P2 `ci` | 2,645 → 847 (-68.0%) | 10.091 → 9.864 | 10.152 → 9.944 |
| P3 `--version` | 204 → 96 (-52.9%) | 0.826 → 0.801 | 0.833 → 0.807 |
| P3 `view` | 1,768 → 596 (-66.3%) | 6.296 → 6.234 | 6.318 → 6.283 |
| P3 `ci` | 2,645 → 847 (-68.0%) | 10.864 → 10.541 | 10.705 → 10.454 |

The candidate exceeded the 50% `view`/`ci` call-reduction gate on both targets
and had no median CPU regression.

## Independent loader realpath cache

Successful loader canonicalizations are cached for one QuickJS runtime, which
matches Node 22.14's stale positive realpath behavior. Failed canonicalizations
are not cached. `--preserve-symlinks` bypasses both loader caches, while
`--preserve-symlinks-main` bypasses CommonJS main-module canonicalization.
Public `node:fs` realpath APIs remain uncached and observe current filesystem
state. ESM main-entry handling for `--preserve-symlinks-main` remains a known
gap.

The control counts are 14–15 calls above the older trace because the candidate
routes previously uncounted Rust loader canonicalizations through the same
owner as CommonJS JavaScript. In every sample,
`modules.realpath.calls = cacheHits + systemCalls`, and physical
`filesystem.realpath.calls` equals `modules.realpath.systemCalls`.

| Target / command | Physical realpaths control → candidate | Wall control → candidate | CPU control → candidate |
| --- | ---: | ---: | ---: |
| P2 `--version` | 426 → 77 (-81.9%) | 0.804 → 0.591 | 0.810 → 0.585 |
| P2 `view` | 3,545 → 475 (-86.6%) | 6.610 → 3.969 | 6.335 → 3.965 |
| P2 `ci` | 5,007 → 614 (-87.7%) | 11.323 → 7.828 | 11.115 → 7.652 |
| P3 `--version` | 426 → 77 (-81.9%) | 0.947 → 0.621 | 0.897 → 0.613 |
| P3 `view` | 3,545 → 475 (-86.6%) | 6.294 → 5.001 | 6.261 → 4.405 |
| P3 `ci` | 5,007 → 614 (-87.7%) | 12.314 → 7.665 | 11.782 → 7.511 |

The candidate exceeded the 75% physical-call reduction gate for every command
and improved median CPU by 27.8–37.4% on P2 and 29.6–36.3% on P3.

## Initial combined prototype

| Target / command | Missing reads control → candidate | Physical realpaths control → candidate | Wall control → candidate | CPU control → candidate |
| --- | ---: | ---: | ---: | ---: |
| P2 `--version` | 204 → 96 | 426 → 77 | 0.848 → 0.626 | 0.836 → 0.612 |
| P2 `view` | 1,768 → 596 | 3,545 → 475 | 7.195 → 4.756 | 7.061 → 4.549 |
| P2 `ci` | 2,645 → 847 | 5,007 → 614 | 13.468 → 8.004 | 12.390 → 7.763 |
| P3 `--version` | 204 → 96 | 426 → 77 | 0.886 → 0.736 | 0.865 → 0.707 |
| P3 `view` | 1,768 → 596 | 3,545 → 475 | 6.259 → 4.158 | 6.187 → 4.099 |
| P3 `ci` | 2,645 → 847 | 5,007 → 614 | 11.423 → 7.570 | 11.314 → 7.507 |

The combined candidates preserve the independent call reductions. Median CPU
improved 35.6% for P2 `view`, 37.3% for P2 `ci`, 33.7% for P3 `view`, and
33.6% for P3 `ci`.

## Reviewed production candidate

After the cache-domain correction, each target ran three more iterations with
the standard harness at exact revision `f88f62e8`. The table below uses only
the serial, fresh-state, cold local-registry rows. The standard reports also
retain their public-registry and warm observations, but those are outside this
comparison. Every local command succeeded, every `ci` installed both pinned
packages, HTTP counts were 0/1/2 as expected, no trace overflow occurred, and
both package-metadata and realpath counter equations reconciled.

| Target / command | Missing reads control → final | Physical realpaths control → final | Final wall median | Final CPU median |
| --- | ---: | ---: | ---: | ---: |
| P2 `--version` | 204 → 96 (-52.9%) | 426 → 78 (-81.7%) | 0.566 | 0.563 |
| P2 `view` | 1,768 → 596 (-66.3%) | 3,545 → 477 (-86.5%) | 3.849 | 3.725 |
| P2 `ci` | 2,645 → 847 (-68.0%) | 5,007 → 616 (-87.7%) | 8.389 | 8.043 |
| P3 `--version` | 204 → 96 (-52.9%) | 426 → 78 (-81.7%) | 0.560 | 0.559 |
| P3 `view` | 1,768 → 596 (-66.3%) | 3,545 → 477 (-86.5%) | 3.631 | 3.620 |
| P3 `ci` | 2,645 → 847 (-68.0%) | 5,007 → 616 (-87.7%) | 7.882 | 7.784 |

Separating the two Node loader domains costs one physical realpath for
`--version` and two for `view`/`ci` compared with the initial combined
prototype. The final candidate still clears the 75% realpath reduction gate
for every command and the 50% missing-metadata reduction gate for `view` and
`ci`. Timing is reported as an observation from the final run; the physical
call counts remain the comparison invariant.

## Node compatibility candidates

No node-compat inventory entry changes in this work. The runnable
`es-module/test-esm-preserve-symlinks-not-found*.mjs` and
`parallel/test-module-main-{extension-lookup,fail,preserve-symlinks-fail}.js`
cases remain enabled. The ESM preserve-symlinks, symlink-main, circular
symlink, and symlinked-peer-module cases remain known gaps because their
vendored fixtures require rooted symlink targets that cannot be resolved
inside a WASI preopen. Persistent relative symlinks, cache-domain isolation,
retargeting, and retry behavior are covered by the module-resolution runtime
test instead.

Raw reports:

- [negative package JSON P2](2026-09-21-negative-package-json-p2.json) and
  [P3](2026-09-21-negative-package-json-p3.json)
- [loader realpath P2](2026-09-21-loader-realpath-p2.json) and
  [P3](2026-09-21-loader-realpath-p3.json)
- [combined P2](2026-09-21-loader-caches-p2.json) and
  [P3](2026-09-21-loader-caches-p3.json)
- reviewed candidate [P2](2026-09-21-loader-caches-final-p2.json) and
  [P3](2026-09-21-loader-caches-final-p3.json)

Run `python3 tests/npm_metadata/results/validate_cache_experiments.py` to check
sample success, installation and HTTP invariants, exact counter totals,
reconciliation equations, and the accepted reduction and CPU gates.

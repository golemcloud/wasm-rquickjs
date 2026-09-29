# ESM module-load phase attribution

The 2026-09-21 manual experiment attributed the roughly 11-second strip-mode
prepared-ESM latency reproduced by `tests/typescript_transform_latency`. It ran
five serial 64-KiB samples for P2 and P3. Every sample used a fresh execution-job
QuickJS runtime and a unique `.mjs` path; only the compiled component instance
was reused within one target.

Private instrumentation at revision
`7bed8b048cbafc43bc2a300c8d7b48733bf05386` measured exclusive loader
subphases and the surrounding resolver time. Same-runtime JavaScript timestamps
located evaluation within the import promise. The residual contains unresolved
resolver-chain dispatch, QuickJS linking, and promise scheduling; it is not an
exact link timer. The temporary instrumentation, runner, and raw archival pair
were removed after review because their meaningful aggregate evidence is
retained here and production tests cover the accepted scanner change.

| Target | Baseline end-to-end | Baseline pre-evaluation | CJS-global preflight | Prologue injection | QuickJS declaration | Residual |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P2 | 10,657.94 ms | 10,478.13 ms | 5,235.03 ms | 5,225.32 ms | 0.22 ms | 0.25 ms |
| P3 | 11,058.54 ms | 10,867.23 ms | 5,433.22 ms | 5,436.13 ms | 0.27 ms | 0.47 ms |

The two repository-owned source scans account for essentially the whole
pre-evaluation interval; filesystem resolution, QuickJS declaration and
evaluation were not material owners. The accepted change bulk-skips contiguous
ASCII whitespace in those scanners:

| Target | Candidate end-to-end | Pre-evaluation | CJS-global preflight | Prologue injection | Reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| P2 | 192.28 ms | 14.84 ms | 0.43 ms | 0.57 ms | 98.20% |
| P3 | 197.36 ms | 15.33 ms | 0.44 ms | 0.57 ms | 98.22% |

Every measured candidate sample returned 42 and reconciled its counters and
timings. The broader TypeScript latency matrix and focused module-loader tests
provide the retained end-to-end and semantic coverage.

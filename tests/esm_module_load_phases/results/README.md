# Results

The retained P2/P3 reports contain the final candidate's five raw samples, exact
base revision and instrumentation identities, component identity, execution
profile counters, and derived reconciliation. These are descriptive local
measurements, not CI thresholds. The baseline raw reports are summarized below
rather than retained sample by sample.

The baseline capture attributed essentially the entire pre-evaluation interval to
two repository-owned Rust source scans:

| Target | End-to-end median | Pre-evaluation median | CJS-global preflight median | Prologue injection median | QuickJS declaration median | Residual median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P2 | 10,657.94 ms | 10,478.13 ms | 5,235.03 ms | 5,225.32 ms | 0.22 ms | 0.25 ms |
| P3 | 11,058.54 ms | 10,867.23 ms | 5,433.22 ms | 5,436.13 ms | 0.27 ms | 0.47 ms |

Those instrumented end-to-end medians remained close to the immediately preceding
uninstrumented prepared-ESM medians (11,088.28 ms for P2 and 10,859.98 ms for P3).
The evidence rejected QuickJS parsing, linking, evaluation, filesystem resolution,
and source reads as material owners of this workload.

The final candidate bulk-skips contiguous ASCII whitespace in the two affected
source scanners. Its retained reports were captured from exact revision
`7bed8b048cbafc43bc2a300c8d7b48733bf05386`:

| Target | End-to-end median | Pre-evaluation median | CJS-global preflight median | Prologue injection median | End-to-end reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| P2 | 192.28 ms | 14.84 ms | 0.43 ms | 0.57 ms | 98.20% |
| P3 | 197.36 ms | 15.33 ms | 0.44 ms | 0.57 ms | 98.22% |

The candidate removes the whitespace-size pathology while keeping every sample's
result at 42 and preserving the report's counter and timing reconciliation
invariants. The broader TypeScript latency matrix and focused module-loader tests
provide the end-to-end and semantic checks.

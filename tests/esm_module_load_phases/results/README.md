# Results

The retained P2/P3 reports contain all five raw samples, exact base revision and
instrumentation identities, component identity, execution profile counters, and
derived reconciliation. These are descriptive local measurements, not CI
thresholds.

Both targets attribute essentially the entire pre-evaluation interval to two
repository-owned Rust source scans:

| Target | End-to-end median | Pre-evaluation median | CJS-global preflight median | Prologue injection median | QuickJS declaration median | Residual median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| P2 | 10,657.94 ms | 10,478.13 ms | 5,235.03 ms | 5,225.32 ms | 0.22 ms | 0.25 ms |
| P3 | 11,058.54 ms | 10,867.23 ms | 5,433.22 ms | 5,436.13 ms | 0.27 ms | 0.47 ms |

The instrumented end-to-end medians remain close to the immediately preceding
uninstrumented prepared-ESM medians (11,088.28 ms for P2 and 10,859.98 ms for P3).
The evidence therefore rejects QuickJS parsing, linking, evaluation, filesystem
resolution, and source reads as material owners of this workload. The next
candidate experiment should bulk-skip stripped whitespace in the source scanners,
then confirm the change with independent P2/P3 measurements and semantic loader
tests.

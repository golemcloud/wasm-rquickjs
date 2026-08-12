# Result reports

`run.sh` writes one JSON file per target. Checked-in dated reports must include
the commit, dirty state, host environment, pinned tool versions, iteration
count, component size, workload results, median/p95 timing, throughput,
QuickJS heap samples, and Wasm linear-memory high-water observations.

Do not compare reports produced with different prepared-component, Wasmtime,
artifact-cache, or unoptimized settings without calling out those differences.

The 2026-08-12 macOS arm64 reports are the initial five-sample baseline for
GOL-426. They were produced from a dirty test-only working tree based on commit
`149437f2c3b97a44d444e572f09d17c1a1b0cc10`; the report records that state
explicitly so later committed reruns are not mistaken for the same source.
`sourceFiles` fingerprints the exact suite inputs and `run.sh --check` rejects a
report after any of those files changes. With five samples, the reported p95 is
the observed maximum; it is descriptive evidence rather than a stable tail
latency estimate.

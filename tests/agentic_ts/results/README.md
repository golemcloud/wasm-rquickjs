# Result reports

`run.sh` writes one JSON file per target. Checked-in dated reports must include
the commit, dirty state, host environment, pinned tool versions, iteration
count, component size, workload results, median/p95 timing, throughput,
fresh-runtime QuickJS heap samples, and Wasm linear-memory high-water
observations. QuickJS samples are snapshots before tool loading and after the
compiler finishes; they complement, but do not replace, the outer linear-memory
growth observation.

Do not compare reports produced with different prepared-component, Wasmtime,
artifact-cache, or unoptimized settings without calling out those differences.

The checked-in macOS arm64 P2/P3 reports are the initial five-sample baseline
for GOL-426. Each report records a commit hint, dirty state, BLAKE3 composite
hashes for build and benchmark inputs, and the exact optimized component hash.
`run.sh --check` validates every historical report and requires each P2/P3 pair
to share the input hashes without resolving Git history. `run.sh
--check-current` additionally compares selected reports with the current
checkout. With five samples, the reported p95 is the observed maximum; it is
descriptive evidence rather than a stable tail-latency estimate.

# Native completion and Promise adapter checkpoint — 2026-10-12

Native completion is now implemented and exercised in the isolated fixture.
The production skeleton, SDK, Golem tools, release artifacts and server state
remain unchanged. The old paused fork-dependent integration is still paused.

## Completed work

`native_output.rs` owns bounded, independent byte buffers and a one-shot
completion lease. The Rust controller freezes output, destroys QuickJS, then
awaits a native test transport before reporting successful completion. Transport
failure and finalizer cancellation cannot become a successful tool result.

Seven completion scenarios pass on native, P2 and P3. P2/P3 each repeat every
scenario five times in fresh instances. They preserve binary bytes and exit
listener output, drain natural completion, preserve a chunk-independent limited
prefix, reject late writes and competing/repeated completion, handle partial
transport failure, cancel a pending finalizer, and finish empty channels.
The transport simulates backpressure with native asynchronous waits. This is
not a real Golem stream test or a native transport performance measurement.

The dispatch audit exposed a new regression in the earlier inner-only guard:
a result conversion requested exit, then the stock Promise adapter invoked a
user `then` getter while resolving its returned value. The new case failed with
one post-exit mutation before the fix. A wrapper-owned Promise adapter now checks
between readiness, conversion and resolve/reject. The case passes with zero
post-exit mutations. Native TypeError conversion and thrown-value preservation
also pass, using only public rquickjs APIs.

All 18 dispatch scenarios pass on native and in five repetitions each on P2/P3.
The same-batch unguarded negative control still exposes the original bypass.
The 12 public-language cases still match Node 22.14.0. Formatting and strict
Clippy pass on all three build lanes.

## Performance gate

31 repetitions, first excluded; 30 samples per variant per lane. Rotating
variants, fresh runtimes; fresh Wasmtime instances for P2/P3. CPU: 2 million
iterations, Promise: 100,000 awaits, host burst: 20,000 ready futures.
Median execution times in milliseconds:

| Lane / workload | Stock | Manual, checks off | Guarded adapter | Guarded vs stock |
| --- | ---: | ---: | ---: | ---: |
| Native CPU | 45.183 | 45.065 | 45.011 | −0.38% |
| Native Promise | 80.700 | 82.591 | 82.298 | +1.98% |
| Native host burst | 43.011 | 44.170 | 43.499 | +1.14% |
| P2 CPU | 100.057 | 99.099 | 99.233 | −0.82% |
| P2 Promise | 74.140 | 74.480 | 73.644 | −0.67% |
| P2 host burst | 43.668 | 43.862 | 43.812 | +0.33% |
| P3 CPU | 98.091 | 98.496 | 97.966 | −0.13% |
| P3 Promise | 74.441 | 74.480 | 74.058 | −0.51% |
| P3 host burst | 43.589 | 44.215 | 44.266 | +1.55% |

The native Promise slowdown is also present in the manual driver with checks
disabled. The P3 host paired median is +1.86%; its individual pairs range from
0.971 to 1.079. Small overhead is plausible and must not be dismissed. These
numbers do not sign off npm/tsc performance, memory, output collection or Wizer.
The synchronous byte capture and asynchronous test transport are not included
in these dispatch workloads. Default production paths have not been changed.

## Reproduce

```bash
PATH=/Users/noise64/.cargo/bin:/Users/noise64/.wasmtime/bin:$PATH \
WASI_SDK=/Users/noise64/wasi-sdk-25.0-arm64-macos \
ORACLE_NODE=/Users/noise64/.nvm/versions/node/v22.14.0/bin/node \
BOUNDARY_RESULTS_DIR=tmp/process-boundary-adapter-completion-results \
BOUNDARY_REPETITIONS=31 BOUNDARY_SIZE_MULTIPLIER=5 \
bash tools/process-boundary-no-fork/check.sh
```

Raw logs, summaries and WASMs are in that ignored results directory. The
intermediate native-completion-only pass is preserved separately in
`tmp/process-boundary-native-completion-results/`. The original proof's results
remain in `tmp/process-boundary-no-fork-results/`.

- P2 WASM: 1,467,435 bytes, SHA-256
  `00f93b271350e8dee461bf826358d36f6aaf1b66999b6b5c4a184e3e7f1190ff`.
- P3 WASM: 1,462,446 bytes, SHA-256
  `46921ac3f817c51e0ba71ba5b7588ed3e3d566f11d9f94448b5dbb04a5da68ec`.
- Same base checkout, registry rquickjs 0.10.0, compiler and Wasmtime identity
  as the previous checkpoint. No patched dependency is used.

Next production work follows [TERMINAL-CONTRACT.md](TERMINAL-CONTRACT.md): the
native component/SDK completion bridge, byte-safe real stdout, universal dispatch
coverage, exclusive admission, and Wizer-enabled actual tool benchmarks. The
fixture is not a safe substitute for any of those gates.

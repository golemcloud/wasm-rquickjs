# No-fork terminal-boundary checkpoint — 2026-10-11

The bounded no-fork candidate works in the focused reproducer. This does **not**
establish production readiness or prove that every runtime ingress is covered.
No production code, dependency fork, public PR, or Golem environment was changed.
The paused production edits remain untouched.

## Correctness

- Native: 15 guarded cases passed, plus one unguarded negative control.
- P2 and P3: all 15 guarded cases passed in five interleaved repetitions per
  lane, plus five negative controls per lane. Every call has a fresh instance.
- Node 22.14.0: all 12 public-language cases matched exit status and stdout/stderr.
- `await` continuations, bound callbacks, catch/finally, queued nextTicks and
  later timers did not execute after exit.
- A permanently pending host task was dropped without preventing completion;
  late retained wakeups did not resurrect its runtime.
- A host future that requested exit before returning Ready did not perform
  result conversion. A second already-ready host callback did not run.
- Disabling the inner guard reliably allowed that second host callback to mutate
  state. This validates that an outer waiter check alone is insufficient.
- Accepted output/status were returned through Rust after destruction; every
  case verified that its weak runtime handle could no longer be upgraded.
- Formatting and strict Clippy passed for native, P2 and P3 builds.

The minimal process/timer facade and Rust-owned string buffers are intentionally
not the production Node builtins, SDK streaming, or backpressure implementation.

## Performance

Stock `idle()` is compared with a manual driver plus host registration, and
with that driver plus inner guards. There is no extra box per guarded future,
no busy polling, and no context-lock acquisition per individual JS job.

Release-mode longer pass: 31 rotating/interleaved repetitions, first discarded,
30 samples per variant per lane (837 samples before discarding warmup).
CPU: 2,000,000 iterations; Promise: 100,000 awaits; host: 20,000 ready futures.
Every sample checks its result. Median execution times in milliseconds:

| Lane / workload | Stock | Manual, checks off | Manual, guarded | Guarded vs stock |
| --- | ---: | ---: | ---: | ---: |
| Native CPU | 45.327 | 45.264 | 45.151 | −0.39% |
| Native Promise | 76.221 | 77.049 | 76.857 | +0.83% |
| Native host burst | 46.679 | 45.843 | 45.251 | −3.06% |
| P2 CPU | 98.207 | 98.268 | 98.087 | −0.12% |
| P2 Promise | 80.709 | 79.913 | 80.214 | −0.61% |
| P2 host burst | 47.169 | 47.504 | 47.274 | +0.22% |
| P3 CPU | 102.655 | 102.013 | 101.221 | −1.40% |
| P3 Promise | 80.308 | 80.386 | 81.193 | +1.10% |
| P3 host burst | 47.517 | 47.229 | 47.371 | −0.31% |

Paired median guarded/stock changes range from −0.87% to +0.59% in this pass.
Individual pairs have wider variation, especially the native host burst
(0.875–1.185 ratio). Do not claim speedups or strict performance equivalence.

The initial 11-repetition pass showed +5.44% for the smaller native host burst
(4,000 futures). It did not reproduce in the larger pass. P2/P3 initial median
changes ranged from −2.25% to +2.07%. Thus **no repeatable material dispatch
regression was demonstrated**, but small overhead remains plausible.

These are dispatch microbenchmarks, not npm-install or tsc measurements. They
exclude Wasmtime startup/compilation and do not measure peak RSS, the production
Wizer preset, Golem host calls, or output-collection cost. Raw records contain
runtime initialization and total in-export times separately.

## Reproduction and identity

```bash
PATH=/Users/noise64/.cargo/bin:/Users/noise64/.wasmtime/bin:$PATH \
WASI_SDK=/Users/noise64/wasi-sdk-25.0-arm64-macos \
ORACLE_NODE=/Users/noise64/.nvm/versions/node/v22.14.0/bin/node \
BOUNDARY_REPETITIONS=31 BOUNDARY_SIZE_MULTIPLIER=5 \
bash tools/process-boundary-no-fork/check.sh
```

Base checkout: `38bdba3bf846b6bfd071f34ab1a2c8b30020eeb4`.
Registry rquickjs/core/sys 0.10.0, locked, no local/git dependency overrides.
Published core source metadata: `b567ffd29b7db3d09b4208beb05b37c63e104606`.
Rust 1.98.1, Wasmtime 46.0.1, WASI SDK 25, arm64 macOS 26.6.2.

Raw logs and immutable compiled assets:
`tmp/process-boundary-no-fork-results/` (ignored). `summary.json` is the longer
pass; `summary-initial.json` and `check.log` preserve the initial summary.

- P2 WASM: 1,378,045 bytes; SHA-256
  `6f56ad13a6330ff3e68ec4500dcfe180dd225922195f249baf209051bf0988ba`.
- P3 WASM: 1,379,676 bytes; SHA-256
  `2b8859eb13aebc799bc9c9fba840f74c31d67aa899df8a7dffee2ad2c92db210`.

## Decision and remaining gates

There is sufficient evidence to stop claiming a dependency fork is necessary
for a **terminal one-shot runtime with native completion**. There is not yet
evidence that the existing asynchronous JS tool wrapper can be made terminal
while preserving its result/stream contract unchanged.

Before production adoption:

1. Define native terminal result/output completion, including accepted bytes,
   overflow, stream finalization, backpressure and cancellation.
2. Audit and guard every dispatcher: generated imports, async macros, conversions,
   timers/checkpoints, retained stream drivers, module evaluation and disposal.
   The fixture guards only the futures and callbacks it owns.
3. Exercise real filesystem/network futures, uncaught async failures, cancellation
   and exclusive admission with overlapping/parked exports and retained writers.
4. Compare actual bundled npm cold installation and tsc fixtures against the
   current implementation, using the Wizer preset and fresh isolated environments.
   Keep ordinary non-terminal runtime paths unchanged. Do not accept a repeatable
   material latency or memory regression merely because these micros look close.

Do not resume JavaScript or reset termination after exit. This experiment relies
on destroying the runtime; same-runtime wrapper recovery remains out of scope.

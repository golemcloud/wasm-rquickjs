# Direct terminal process boundary without a fork

This is a bounded experiment, not a production runtime API or Golem tool.
It depends on registry rquickjs **0.10.0**, with no patches or local overrides.
The previous fork-dependent integration was archived in the ignored
`tmp/paused-process-boundary/` directory. No patched dependency is used.

Each invocation owns one runtime. Native exit uses QuickJS's existing uncatchable
exception API. A Rust controller drains individual JS jobs, checking exit between
them. Every host future in this fixture is guarded before polling and after
readiness. A wrapper-owned Promise adapter checks between readiness, conversion,
and resolve/reject; an inner-future guard alone is insufficient if conversion
requests exit. Timer checkpoints also check inside a poll.
After exit the runtime is destroyed, never resumed; Rust returns status and
independent bounded stdout/stderr without a JS completion Promise.

The guard does not allocate another box. Cancellation drops its pinned inner
future in place. The driver sleeps on scheduler/termination wakeups, not polling
timers or spinning. Promise batches share one context lock rather than locking
for each job. Ordinary production runtime paths are not modified.

## Checks and comparisons

23 cases cover await/bound callbacks, catch/finally, timers, native nextTick,
pending host work and late wakes, exit listeners, output overflow, and suppression
of post-readiness conversion, exit during conversion, and native error mapping.
The upstream function/method macros' public `crate` option selects a WRQ-owned
binding facade without changing macro argument or class-borrow handling. Tests
cover exit from generated async functions/methods and class borrows held across a
real suspension, then released before conversion, matching the stock adapter.
Three negative controls require a second host callback to mutate state after exit
or generated functions/methods to convert their results after exit without the
terminal adapter. A focused unit test checks ordinary macro behavior without a
terminal signal installed.
Node 22.14.0 is the oracle for 12 public-language cases.

Seven completion cases integrate the terminal runtime with a Rust-owned byte
buffer and an asynchronous test transport. They cover exact binary bytes,
synchronous exit-listener output, natural completion, independent limits,
stream failure, cancellation, duplicate completion, and empty channels. The
transport is a fixture, not Golem's actual stream service.

The release-mode microbenchmarks distinguish:

0. stock `idle()` with ordinary, unwrapped host adapters;
1. the manual driver plus host registration, without termination checks;
2. the manual driver plus a guarded, wrapper-owned Promise adapter.

CPU, Promise-chain, ready-host-future and generated-binding burst workloads
measure dispatch overhead. The generated-binding baseline uses the original
upstream macro/adapter, not the facade's fallback. Every sample gets fresh mutable
state. These are NOT npm-install or
TypeScript compiler performance measurements.

Run `bash tools/process-boundary-no-fork/check.sh` with `WASI_SDK` pointing to the
installed WASI SDK and `ORACLE_NODE` pointing to Node 22.14.0. Raw artifacts/logs
go to ignored `tmp/process-boundary-no-fork-results/`.

For the longer performance pass, set `BOUNDARY_REPETITIONS=31` and
`BOUNDARY_SIZE_MULTIPLIER=5`. This increases Promise/host workloads, not the CPU
loop. Each variant runs in rotating order; the first repetition is excluded
from the summary. P2/P3 calls use fresh Wasmtime processes, stores, instances,
and runtimes; immutable precompiled code is reused. Reported execution time
excludes Wasmtime startup and compilation. Initialization and total in-export
times are recorded separately. The native benchmark uses a fresh runtime per
sample, in one host process. Small differences are not an equivalence proof.

See [RESULTS.md](RESULTS.md) for the measured checkpoint and remaining gates.
The subsequent completion/adapter checkpoint is in
[COMPLETION-RESULTS.md](COMPLETION-RESULTS.md). The integration contract is in
[TERMINAL-CONTRACT.md](TERMINAL-CONTRACT.md).
The latest shared-primitives/macro checkpoint is in
[MACRO-RESULTS.md](MACRO-RESULTS.md).

The proof imports the skeleton's `terminal_process`, `terminal_output`,
`terminal_admission`, and `terminal_bindings` modules directly. They are behind
the disabled-by-default `terminal-process` feature in the actual skeleton.
When enabled, it now routes builtin async functions/class methods through the
adapter and supplies a native controller with byte-safe output and terminal
process hooks. It does not yet provide a supported execution mode or a Golem
tool export. The ordinary feature-disabled runtime remains unchanged.

`tests/runtime/terminal_process.rs` separately exercises the real builtin
environment on P2/P3 with fresh instances. Its test-only probe creates an owned
runtime; this is not the final existing-sidecar/Wizer integration. It covers
natural and explicit exits, handled/unhandled errors, diagnostic/rejection
re-entry, binary stdio, child exits, filesystem I/O and pending native work.

## Unproven production gates

The process/timer facade is deliberately minimal, not the real Node builtins.
This does not prove universal registration coverage, generated WIT adapters,
real fetch/filesystem I/O, uncaught async errors, P3 export cancellation or
overlap, SDK/tool streaming and backpressure, or Wizer restoration. Native
result completion requires an explicit production contract rather than resuming
the existing asynchronous JS wrapper. No generic same-runtime reuse is offered.
No performance claim may be extrapolated to npm/tsc from these microbenchmarks.

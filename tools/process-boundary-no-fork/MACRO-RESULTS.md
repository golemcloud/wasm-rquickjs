# Shared primitives and no-fork macros — 2026-10-12

This is an internal experiment, not an implemented native Golem tool export.
The runtime, admission and output code exercised by the proof now lives in the
actual skeleton behind disabled-by-default `terminal-process`. Ordinary builtin
bindings and reusable export behavior remain unchanged. The old fork-dependent
files were moved to ignored `tmp/paused-process-boundary/` and remain recoverable.

## Correctness

Registry rquickjs/core/sys/macro 0.10.0, without patches or local overrides.
Upstream `module`, `function` and `methods` support an explicit crate namespace.
The function/method namespace selects a WRQ facade with the owned Promise adapter,
while preserving upstream argument extraction and class-borrow handling.

All 23 dispatch cases and seven native-completion cases pass on host, P2 and P3.
Each P2/P3 case repeats five times in fresh instances. Three negative controls
reproduce post-exit host mutation or result conversion when guards are disabled.
The 12 public-language fixtures match Node 22.14.0. Three admission unit tests
and one stock-fallback macro unit test pass. Formatting and strict Clippy pass
for the proof on all three targets.

Class methods retain shared/mutable borrows across execution and a real pending
poll. Their async-body locals release the class borrow before result conversion,
as the stock macro does. An initial stronger assertion failed with both adapters;
the stock control transcript is preserved at
`/private/tmp/process-boundary-stock-conversion-borrow-control.log`.
Separately, a custom future's Drop does not run before conversion in the owned
adapter, covered by the retained-future fixture.

## Performance

31 interleaved repetitions, first discarded; 30 samples per variant. Each sample
owns fresh mutable runtime state. Wasmtime processes/stores/instances are fresh;
immutable compiled code is reused. These numbers measure inner dispatch, not
Wizer/startup, real CLI latency, memory, output transport or Golem host calls.

Two complete passes were made. Generated-binding bursts used 20,000 ready async
calls. The baseline uses the unmodified upstream macro/adapter. Guarded-vs-stock
execution overhead is shown below, with the paired-ratio median in parentheses.

| Lane | First pass | Final pass |
| --- | ---: | ---: |
| Host | −0.20% (+0.63%) | +1.48% (+2.39%) |
| P2 | +1.10% (+1.23%) | +3.18% (+3.61%) |
| P3 | +0.27% (+1.20%) | +3.38% (+2.71%) |

The final manual-host burst also costs +3.51% on P2 and +1.13% on P3 by median.
CPU/Promise medians vary from −0.82% to +1.38% across the final three lanes.
Small dispatch overhead remains plausible and is not signed off. Do not select
the best pass or infer an npm/tsc improvement from these tests.

Raw records and dependency metadata:
`tmp/process-boundary-macro-facade-results/` and
`tmp/process-boundary-macro-facade-final-results/`.
Final transcript: `/private/tmp/process-boundary-macro-facade-final-check.log`.

- P2 WASM: 1,595,760 bytes, SHA-256
  `bbab1b1cede469826a3fe141570c48f1ef6c64cee074c51580c8e3d574f65714`.
- P3 WASM: 1,589,415 bytes, SHA-256
  `10edeed480963ae4926ca0db8836b2013568c1d3869920628b35805bf44b5e01`.

These two passes used main at `38bdba3b`. The working branch was subsequently
fast-forwarded to `3d0e1012` (HTTP pipeline/end-callback merges, no overlap with
the terminal primitives). No experimental commit, push, PR or release was made.

On latest main, the exact existing
`runtime_idle_wait_uses_export_liveness_boundary` test passed with the feature
disabled. The generated P3 component also compiled with `terminal-process`.
Strict Clippy encountered the existing generated `JS_ADDITIONAL_MODULES`
`type_complexity` warning, reproduced without the feature. The opt-in check
passes with only `-A clippy::type_complexity`; this is not an unqualified clean
strict-Clippy claim. Transcripts:
`/private/tmp/process-boundary-latest-main-default-check.log`,
`/private/tmp/process-boundary-latest-main-clippy-baseline.log`, and
`/private/tmp/process-boundary-latest-main-opt-in-scoped-check.log`.

## Next gates

The facade is a verified integration mechanism, not universal dispatch coverage.
Real builtin/generated bindings, explicit spawned tasks, idle waiters, P3
retained writers/drivers and module/export admission still need wiring/auditing.
Native Golem `invoke`, actual stream finalization, runtime-state disposal and Wizer
restoration are not implemented by this feature. The SDK preparation helper is
only the preflight half. Follow [TERMINAL-CONTRACT.md](TERMINAL-CONTRACT.md) before
bundled cold-install npm and focused tsc end-to-end measurements.

Reproduce the final pass using the command in `COMPLETION-RESULTS.md` with
`BOUNDARY_RESULTS_DIR=tmp/process-boundary-macro-facade-final-results`.

## Subsequent native-builtin integration

The opt-in skeleton now contains `terminal_runtime.rs`. It owns event-loop
dispatch, native byte capture, terminal exit hooks, and native completion. It
guards timer polls and native rejection-tracker entry. Builtin async function
and class-method macros select the owned adapter through the upstream macro
crate option; synchronous functions retain their original adapter.

The real-builtin fixture covers 21 program cases plus binary stdio, in fresh
P2/P3 instances. It checks runtime release, native completion, and no post-exit
effects. It includes explicit exits, queued awaits/bound callbacks, nextTick,
referenced/unreferenced timers, handled/unhandled exceptions/rejections, exit
listeners, beforeExit scheduling, local child exit status, filesystem I/O and
pending execution work. Binary stdio preserves byte-view offsets and non-UTF8
bytes. The native controller installs its output sink before builtin initialization
because console logging mode is cached then; it clears initialization output
before CLI execution.

Diagnostic formatting must not inspect user getters after exit. Its potentially
user-controlled stack lookup/coercion runs inside one JS call, which an
uncatchable exit aborts. Exit throws an intrinsic error without assigning a
message through a user-modified prototype. Tests cover diagnostic getters and
rejection-tracker re-entry after exit.

Latest transcripts: `/private/tmp/terminal-real-builtins-p2.log` and
`/private/tmp/terminal-real-builtins-p3.log`. The feature-disabled P3 idle-boundary
test also passes (`/private/tmp/terminal-default-p3.log`). The full skeleton
default/maximal P2/P3 Clippy matrix, including terminal lanes, passes with strict
warnings (`/private/tmp/terminal-skeleton-clippy-matrix.log`), as does host runtime
test Clippy (`/private/tmp/terminal-host-clippy.log`). The new fixture's DTS golden
was generated and its focused drift test passes.

This fixture creates an owned runtime inside a normal test wrapper. It does not
yet consume a Wizer-restored tool sidecar, retain real Golem writer resources or
guard every shared component export. No native npm/tsc or Wizer performance
result is claimed. The Golem template/admission design is the current decision
needed before wiring the production bridge. The previous dispatch overhead
measurements remain evidence, not a signed-off result for this new controller.

The final standalone proof pass is saved under
`tmp/process-boundary-native-pr-check/` with transcript
`/private/tmp/terminal-final-proof.log`. All host/P2/P3 checks pass, including five
fresh-instance repetitions of runtime/completion cases and the negative controls.
This third 31-repetition pass reports generated-binding median/paired overhead:
host +1.22%/+1.61%, P2 +1.65%/+1.33%, P3 −0.42%/−0.07%. Variation across passes
still prevents a performance-equivalence claim; this is not the real-builtin
controller or an npm/tsc benchmark.

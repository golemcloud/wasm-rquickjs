# WASI P3 rquickjs async runtime spike

Phase 0 de-risking spike for a future WASI P3 generation mode. This crate is intentionally isolated from the main workspace (`[workspace]` is empty) and builds a component for the stable `wasm32-wasip2` Rust target while importing WASI 0.3/P3 clock APIs.

## Component exports

```wit
run: async func() -> string
host-delay-check: async func() -> string
event-loop: async func() -> string
concurrency-probe: async func() -> string
warmup: async func() -> string
probe-task: async func(id: u32, ms: u32) -> string
```

The world imports `wasi:clocks/monotonic-clock@0.3.0-rc-2026-03-15` directly and the Rust bindings use `wit_bindgen` `with:` remaps to the `wasip3` crate:

```rust
with: {
  "wasi:clocks/monotonic-clock@0.3.0-rc-2026-03-15": wasip3::clocks::monotonic_clock,
  "wasi:clocks/types@0.3.0-rc-2026-03-15": wasip3::clocks::types,
}
```

It also imports `wasm-rquickjs:phase0/host.host-delay`, an async WIT import bridged into JS as `hostDelay(ms)`.

## ⚠️ WASI 0.3 snapshot must match the host

WASI 0.3 (P3) is still pre-release, and each Wasmtime release pins a specific dated
snapshot of the WASI WIT. The guest toolchain (the `wasip3` crate) must be built against
the **same** snapshot, otherwise the host linker rejects async imports such as
`monotonic-clock.wait-for` with `instance export "wait-for" has the wrong type`.

| Host | bundled `wasi:clocks` version | matching `wasip3` crate |
| ---- | ----------------------------- | ----------------------- |
| Wasmtime 45.0.0 | `0.3.0-rc-2026-03-15` | `wasip3 = "=0.6.0"` (`0.6.0+wasi-0.3.0-rc-2026-03-15`) |
| Wasmtime 46.x | `0.3.0` (final) | `wasip3 = "0.7.0"` (`0.7.0+wasi-0.3.0`) |

This spike targets **Wasmtime 45** (golem's current version) and therefore pins
`wasip3 = "=0.6.0"` and imports `wasi:clocks/...@0.3.0-rc-2026-03-15`. The earlier
"Wasmtime 45 cannot run this" conclusion was a snapshot-skew artifact (the spike had
been built with `wasip3 0.7.0`, i.e. final `0.3.0`), not a Wasmtime limitation.

## Build

```sh
cargo build --manifest-path examples/phase0-p3-spike/Cargo.toml --target wasm32-wasip2
```

## Wasmtime 45 host harness

The sibling harness is isolated in `examples/phase0-p3-host45/` and pins `wasmtime = "=45.0.0"` and `wasmtime-wasi = "=45.0.0"`.

Run all checks (the harness builds the component first):

```sh
cargo run --manifest-path examples/phase0-p3-host45/Cargo.toml -- all
```

Observed result with Wasmtime 45.0.0 (guest aligned to `wasip3 0.6.0`):

```text
run: slept 10
event-loop: event-loop:background,5,15,30
host-delay: host-delay:1012
concurrency: concurrency:serialized:30,30
overlap task1 returned: enter1,enter2,exit1
overlap task2 returned: enter1,enter2,exit1,exit2
overlap total_ms: 202 (sleep per task = 200ms)
overlap verdict: INTERLEAVED (concurrent tasks share the context)
```

So Wasmtime 45.0.0 **does** run the P3 async clock spike, the `ctx.spawn` + multiple
concurrent timers + `rt.idle()` event-loop path, the async WIT import → JS bridge, and a
single shared/global runtime serving genuinely concurrent export calls.

## Concurrency: one shared runtime + concurrent exports

`warmup` initializes a single shared `AsyncRuntime`/`AsyncContext` once; the harness then
drives two `probe-task` calls concurrently on the **same** instance with `tokio::join!`
(`cargo run --manifest-path examples/phase0-p3-host45/Cargo.toml -- overlap`). Each task
records `enter<id>` / `exit<id>` into a shared `globalThis.order` array.

Findings:

- **Cross-task wakeup must be enabled.** With the default `wit-bindgen` async runtime,
  two concurrent export tasks sharing one rquickjs scheduler trap:
  `wasm trap: unreachable` from
  `wit_bindgen::rt::async_support::inter_task_wakeup_disabled::WakerState::wake`
  ("Cannot support cross-component-model-task wakeup unless the `wit-bindgen` crate is
  compiled with the `inter-task-wakeup` feature enabled"). This spike therefore enables
  `wit-bindgen`'s `inter-task-wakeup` feature.
- **With `inter-task-wakeup`, concurrent exports interleave correctly.** Observed order
  `enter1,enter2,exit1,exit2` and a wall-clock total of ~202ms for two overlapping 200ms
  sleeps (≈ max, not the ~400ms sum). So both tasks make progress concurrently against the
  one shared runtime.
- **JS execution stays cooperative / single-threaded.** Tasks only yield at `await`
  points, so shared mutable JS state is not preempted mid-statement — the standard JS
  event-loop model. No explicit `GLOBAL_BUSY` serialization guard is required for safety
  once `inter-task-wakeup` is on (the guarded `concurrency-probe` export is kept only as a
  serialized-path contrast).
- **Init must happen once.** `global_runtime()` lazily builds the shared runtime; concurrent
  first-callers could double-init, so the shared runtime is warmed up once (via `warmup`)
  before overlapping calls. Phase 1 needs a proper init-once for the shared state.

Implication for Phase 1: a single shared rquickjs runtime can back genuinely concurrent
async WIT exports on Wasmtime 45, provided the generated crate enables
`wit-bindgen/inter-task-wakeup`.

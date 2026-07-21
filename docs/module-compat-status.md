# Module Compatibility Status

This file is the current dashboard. Execution steps live in `module-compat-todo.md`; design
rationale and longer-term work live in `module-improvements-review.md`. Historical reviews
and audit logs are in `archive/`.

## Current Checkout

- Branch: `module-improvments`
- Loader-unification implementation commits: `091e9b0a`, `c7596f17`, `9e206316`,
  `2d660698`, `8b276688`, and `40192157`.
- The branch is ahead of `origin/module-improvments`.
- Root `Cargo.toml` and `Cargo.lock` contain local Golem/Wasmtime setup and are out of scope.
- The active architecture, status, and todo documents are part of the final audit batch.

## Current Loader Boundary

- Rust owns package-map semantics and mode-driven package resolution.
- JS owns CommonJS runtime state: `require.cache`, `require.extensions`,
  `Module._pathCache`, extension-handler invocation, source reads, module lifecycle, and
  final CommonJS error shaping.
- Host-side Rust initializes loader metadata for declared modules.
- Runtime and node_compat fixtures are the behavioral specification. A single tokenized
  boundary checker enforces ownership without inspecting helper bodies or ordering.

## Latest Validated Slice

The completed slices replace literal source guards with the structural checker, unify CJS
lifecycle in one descriptor-driven JS transaction, separate resolution from source reads,
share Rust CJS facade generation, normalize registered-loader results/caches, and canonicalize
recursive CJS analysis paths. Public Node APIs and the JS/Rust ownership boundary are
preserved.

## Test Harness And Timings

The recommended warm local path is explicit artifact caching plus Wasmtime filesystem
caching. Optional unoptimized mode may shorten rebuild loops. Prepared-component caching is
experimental and is not part of the recommended path.

A 2026-07-21 measurement of
`runner_static_registered_loader_async_resolve` plus
`runner_programmatic_registered_loader_chain` measured:

- rebuild-inclusive with artifact + Wasmtime caches and `WASM_RQUICKJS_TEST_DROP_CACHE=1`:
  690.41s;
- immediate warm artifact + Wasmtime caches: 23.16s.

Prepared-component caching was not enabled because the prior measurement showed no benefit.
Each runtime/node_compat case must retain
fresh wasm memory, Store, component instance, WASI context, temp directory, and QuickJS
state. Caches may reuse only generated, optimized, or compiled artifacts.

## Compatibility State

- The current module audit found no actionable same-process module behavior hidden as a
  known gap.
- With Node 22.14.0 selected where Node baselines are required, focused runtime
  `cjs_require:: module_resolution` passed 55/55 in 19.186s warm.
- `node_modules_app__module_interop` passed 21/21 in 151.867s against the strict Node
  22.14.0 baseline.
- The two focused registered-loader node_compat cases passed 2/2 in both the rebuild-inclusive
  and warm timing runs.
- Module-related report guards
  `module_related_node_compat_entries_are_configured` and
  `module_related_known_gaps_are_deferred_or_covered` passed 2/2 in 0.576s.
- Cache-policy/key tests passed 2/2, and the structural architecture checker passed 15/15.
- The known-gap audit added addon resolution to the module-adjacent scope so a future
  `known-gap` classification must use an accepted reason, and removed same-process coverage
  as an independent deferral; the two module inventory guards still pass 2/2.
- `cargo fmt -p wasm-rquickjs` and `git diff --check` passed.

## Accepted Deferrals

- simulated Node CLI, `process.execPath`, preload, and spawned child-process module modes;
- TypeScript stripping/transpilation and Amaro;
- worker-thread-only behavior;
- Node internals tests;
- native `.node`, WebAssembly/V8-specific behavior, and other true WASI/platform gaps;
- VM leak/GC checks that are not core same-process module behavior.

Same-process resolver, loader, module-kind, package-map, and CJS/ESM interop behavior is not
an accepted deferral.

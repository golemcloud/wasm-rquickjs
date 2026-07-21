# Module Compatibility Todo

This is the executable queue. Current state is in `module-compat-status.md`; architectural
rationale is in `module-improvements-review.md`.

## 1. Finish Test Cleanup

- [x] Remove the `WASM_RQUICKJS_TEST_FAST` umbrella.
- [x] Recommend explicit artifact and Wasmtime caches.
- [x] Keep `WASM_RQUICKJS_TEST_PREPARED_COMPONENT_CACHE=1` experimental/manual-only.
- [x] Document that caches may reuse artifacts but never wasm memory, Store, component
  instances, WASI contexts, temp directories, or QuickJS state between cases.
- [x] Measure rebuild-inclusive and warm artifact + Wasmtime cache paths without enabling
  prepared-component caching.
- [ ] Re-measure prepared-component caching only if a new implementation suggests a
  concrete benefit.

Select Node before compatibility work:

```sh
nvm use 22.14.0
```

Recommended warm local prefix:

```sh
WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1 \
WASM_RQUICKJS_TEST_WASMTIME_CACHE=1
```

Add `WASM_RQUICKJS_TEST_UNOPTIMIZED=1` for short rebuild loops. Use
`WASM_RQUICKJS_TEST_DROP_CACHE=1` when generated/compiled artifacts must be refreshed.

## 2. Source Guard Cleanup

- [x] Replace literal and compacted-source guards with one structural boundary checker.
- [x] Keep only owner declarations, bridge names, forbidden duplicates, and import-meta writes.
- [x] Keep helper bodies, statement ordering, and call counts out of the checker.

## 3. Loader Unification

- [x] Unify filesystem, main-module, and loader-provided CJS lifecycle in one JS transaction.
- [x] Separate resolution identity from source reads and live extension execution.
- [x] Share Rust analyzer/facade generation for disk and loader-provided CommonJS.
- [x] Normalize sync/async registered-loader results, cache keys, and generation invalidation.
- [x] Canonicalize recursive CJS analysis paths and operation-local cycle/cache identity.

Rust owns package/analyzer/facade semantics; JS owns mutable CJS state/lifecycle; the host
owns import-meta metadata.

## 4. Future Changes Remain Counterexample-First

For each resolver/parser/loader/runtime batch:

1. produce the smallest counterexample on Node 22.14.0;
2. reproduce the mismatch in wasm-rquickjs;
3. implement the general Node rule;
4. add behavioral runtime or node_compat coverage;
5. run focused adjacent tests;
6. request subagent review.

Do not continue opportunistic helper extraction without either a concrete mismatch or the
approved loader-unification design.

## Review-Agent Discipline

- Spawn a reviewer for resolver, parser, loader, or runtime code changes.
- Consume the result and close the completed reviewer immediately.
- If spawning fails because the thread limit is full, stop, close completed agents, and only
  then continue.
- Fixture, configuration, and documentation-only changes do not require review unless Node
  parity or classification is ambiguous.

## Validation

Harness and source-guard cleanup:

```sh
cargo test --test runtime -- \
  drop_cache_bypasses_explicit_wasmtime_cache \
  prepared_component_cache_key_includes_content_hash

cargo test -p wasm-rquickjs --lib -- module_loader_architecture --nocapture
```

Run `./cleanup-skeleton.sh` before runtime validation after any skeleton change. Run
`cargo fmt -p wasm-rquickjs` after Rust edits.

Runtime confidence:

```sh
WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1 \
WASM_RQUICKJS_TEST_WASMTIME_CACHE=1 \
cargo test --test runtime --features use-golem-wasmtime -- \
  cjs_require:: module_resolution --report-time
```

Module interop after CJS/parser/bridge changes:

```sh
WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1 \
WASM_RQUICKJS_TEST_WASMTIME_CACHE=1 \
NODE_MODULES_APP_STRICT_NODE_BASELINE=1 \
cargo test --test runtime --features use-golem-wasmtime -- \
  node_modules_app__module_interop --report-time
```

Registered-loader compatibility and timing:

```sh
WASM_RQUICKJS_TEST_ARTIFACT_CACHE=1 \
WASM_RQUICKJS_TEST_WASMTIME_CACHE=1 \
/usr/bin/time -p cargo test --test node_compat --features use-golem-wasmtime -- \
  runner_static_registered_loader_async_resolve \
  runner_programmatic_registered_loader_chain \
  --report-time
```

Add `WASM_RQUICKJS_TEST_DROP_CACHE=1` for the rebuild-inclusive measurement; omit it for
the immediate warm measurement. Do not enable prepared-component caching for this comparison.

Final focused checkpoint:

```sh
cargo test --test node_compat_report --features use-golem-wasmtime -- \
  module_related_node_compat_entries_are_configured \
  module_related_known_gaps_are_deferred_or_covered \
  --report-time

git diff --check
```

Never run an unfiltered broad test suite for this work. Do not commit root `Cargo.toml` or
`Cargo.lock`, and do not modify vendored tests under `tests/node_compat/suite/`.

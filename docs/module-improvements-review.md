# Module Loader Architecture Backlog

This document records architecture and rationale. It is not a checkpoint log or execution
queue; use `module-compat-status.md` and `module-compat-todo.md` for those.

## Design Principles

- Match general Node 22.14.0 behavior, not the shape of a vendored fixture.
- Keep package-map rules in one implementation.
- Keep stateful CJS lifecycle behavior in one implementation.
- Preserve a fresh runtime boundary for every compatibility case.
- Prefer bounded changes backed by a Node counterexample over speculative rewrites.
- Measure hot paths before adding caches, callbacks, scans, or cross-language bridges.

## Current JS/Rust Split

Rust owns package `exports` and `imports` target semantics, mode/condition-aware package
resolution, filesystem probe support, module classification/analyzers, host module
declaration, and host-owned loader metadata.

JS owns CJS runtime state and observable mutation: `require.cache`, `require.extensions`,
`Module._pathCache`, source reads, extension-handler calls, module records, parent/child
links, cycles, cleanup, and final CJS errors. JS also coordinates registered-loader behavior
where QuickJS requires an asynchronous boundary.

The boundary is enforced by a test-only structural checker. It tokenizes JavaScript and
parses Rust declarations, bridge registrations, and import-meta ownership without asserting
helper bodies, call counts, or statement ordering.

## Unified Loader Flow

The implemented flow is:

1. resolve an edge in an explicit mode and condition set;
2. apply registered-loader redirection and validate its result shape;
3. choose a builtin, ESM, JSON, CJS, or loader-provided source path;
4. establish cache identity and module record visibility;
5. read CJS source and invoke the selected live `require.extensions` handler;
6. link static edges and capture the Node-compatible CJS default snapshot;
7. complete or clean up the CJS record on success/failure;
8. shape the public Node error at the JS boundary.

One descriptor-driven JS transaction owns cache lookup, early cache insertion, parent/child
linkage, live extension selection, source execution, default-snapshot capture, loaded state,
and exact failure cleanup for filesystem, main-module, and loader-provided CommonJS. Pure
resolution returns identity without reading source or creating module records. Each descriptor
supplies its canonical cache key, Node-visible filename, parent, source strategy and URL, and
explicit main-module and ESM-fallback flags.

## CJS Analyzer And Facade

Rust is the sole named-export and recursive-reexport analyzer for both on-disk and
loader-provided CommonJS. Both paths use the same facade builder. Recursive analysis
canonicalizes paths before cycle detection and caches work only within an analysis/load
operation. JS remains the sole evaluator and owner of mutable CJS state and snapshots.

## Async Static Loader Hooks

QuickJS static resolution is synchronous while programmatic loader hooks may be async. Graph
preparation provides the async scheduling boundary before QuickJS linking. Sync and async
hook results use the same frozen internal result shape, and static cache keys include loader
generation, parent URL, specifier, and normalized import attributes. Registering a loader
invalidates the prior generation.

Do not fake async hooks with synchronous special cases or claim support for already-linked
graphs that cannot cross an async boundary. CLI `--loader` and spawned-process behavior stay
separate accepted deferrals unless the runtime architecture expands to own process modes.

## VM, Native, And Platform Residuals

Keep these distinct from same-process module-loader work:

- VM callback/realm fidelity beyond the supported main-context paths;
- native `.node` loading;
- V8-only WebAssembly module behavior;
- worker-thread-only semantics;
- TypeScript stripping/Amaro;
- CLI/preload/child-process execution modes;
- GC/leak assertions that require V8 or Node internals.

Platform limits should be classified explicitly. They must not hide ordinary same-process
package resolution, module-kind detection, loader behavior, or CJS/ESM interop.

## Performance Backlog

The useful local test caches are generated/optimized artifact reuse and Wasmtime's compiled
artifact cache. Prepared-component caching is experimental; its last focused timing was
slightly slower than artifact + Wasmtime caching alone.

Runtime performance work should prioritize:

- per-resolution filesystem probe reuse scoped to one operation;
- package.json parse/cache ownership and invalidation;
- avoiding duplicate full-source scans;
- avoiding repeated condition-array allocation and normalization;
- avoiding per-load helper construction and generated-source churn;
- minimizing JS/Rust bridge crossings in hot resolution loops;
- keeping loader result and module-source caches keyed by all semantic inputs.

Global caches must not leak filesystem state or runtime state across compatibility cases.
Every optimization must preserve fresh wasm memory, Store, component instance, WASI
context, temp directory, and QuickJS runtime per test.

## Source Guard Policy

Behavior belongs in runtime and node_compat fixtures. The only production-source checker is
the structural module-loader boundary checker. It may validate declared owners, bridge names,
duplicate declarations, and forbidden import-meta writes; it must not assert helper spelling,
bodies, call counts, or statement ordering.

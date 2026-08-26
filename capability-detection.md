# Plan: Per-app builtin trimming for wasm-rquickjs

This plan tracks the remaining work for the runtime capability-gates approach.
The wasm-rquickjs side prototype is in place: direct per-capability helper gates
in the skeleton, host-side lowering of those helpers to immutable wasm globals,
CLI flags on `inject-js`, and an end-to-end integration test.

## 0. Wait for the wasm-level dead-code / import eliminator

**Blocker for actually shipping size + import reductions to users.**

- The current scheme lowers each capability gate to an immutable `i32` wasm
  global initialized to `0` or `1`. Without DCE on the produced wasm, disabling
  a capability skips runtime registration but does not remove its native code,
  JS source bytes, or the WIT imports it transitively pulls in.
- A separate tool (already in development by the user) is expected to:
  - perform component-level dead-code elimination, and
  - drop unused component model imports based on what is reachable.
- We need to wait until that tool is usable end-to-end on a patched
  wasm-rquickjs base image before we start measuring real wins.
- Action: once the tool exists, run it on a `inject-js --auto-trim`-patched
  artifact and confirm the eliminator folds `global.get $cap_*` branches and
  then removes the now-unreachable pieces:
  - native builtin Rust code for disabled caps is gone,
  - JS bodies for disabled caps are gone,
  - WIT imports that are now dead (e.g. `wasi:filesystem` when `Fs` is off) are
    actually dropped from the final component.

Until that confirmation lands, everything below is preparation, polish, and
correctness work, not user-visible size wins.

## 1. Run the broader binary_inject suite

- Only the new `test_patch_capability_gates_and_run` was run in isolation.
- Run the full suite to catch regressions:
  ```
  cargo test --release --test binary_inject -- --nocapture
  ```
- If any pre-existing test fails because of the gates work, fix or annotate
  before merging.

## 2. CLI / docs polish for `inject-js`

Current behavior of the new flags is intentional but subtle:

- With **none** of `--auto-trim`, `--include`, `--exclude`: behaves like the
  old `inject-js` (no patching).
- With `--auto-trim`: scans the JS entry files and computes the closure.
- With only `--include` / `--exclude` (no `--auto-trim`): starts from
  "all enabled" and disables only what was excluded; `--include` is additive
  on top of that.

Action items:

- Make `--help` text spell this out clearly so users understand:
  - the default baseline used when `--auto-trim` is absent,
  - that `--exclude` removes from full,
  - that `--include` survives `--auto-trim`'s closure.
- When patching, log not just the count but the **enabled capability names**
  (or at least the disabled ones) so users can sanity-check what they shipped.
- Mention the gates story briefly in `README.md` once the DCE tool lands.

## 3. Add a `inspect-capabilities` (or similar) subcommand

Not strictly required, but very useful for debugging/auditing:

- Read the gates slot(s) from a wasm/component file.
- Verify all slot copies agree (reuse `read_capability_gates_from_bytes`).
- Print:
  - the raw `u64`,
  - the list of enabled capability names,
  - the list of disabled capability names.
- Should also handle the "no gates marker" case with a friendly message that
  this wasm predates capability-gates support.

## 4. Static-import dependency graph for builtin JS (correctness follow-up)

Discovered runtime caveat: some builtin JS bodies statically `import` other
builtins. The most obvious offender is `node:module` (`module.js`) which pulls
in many builtins, including `node:vm`. If the closure is computed only from the
manually curated `dependencies()` table in
[capability_scan.rs](file:///Users/vigoo/projects/golem/wasm-rquickjs/crates/wasm-rquickjs/src/capability_scan.rs),
trimming the wrong cap leaves a dangling static `import` and the runtime fails
during built-in wiring with messages like
`No such built-in module: node:vm`.

Options to consider:

- Derive an extra graph by scanning `crates/wasm-rquickjs/skeleton/src/builtin/**/*.js`
  for static `import` specifiers and unioning that into the dependency closure
  used by `Policy`.
- Or treat known umbrella caps (start with `Module`) as depending on every cap
  their JS imports, hard-coded.
- Or refuse to trim umbrella caps unless every transitively imported cap is
  also still enabled.

The mechanism itself is correct; this is about preventing unsafe trim policies.
Pick whichever is simplest to maintain.

## 5. Optional: surface the closure expansion in `--auto-trim`

When `--auto-trim` adds caps purely because of the dependency closure (or, once
implemented, the static-import graph from step 4), it would help debugging to
print the difference between:

- caps directly used by the JS, and
- caps added solely because of dependency closure.

This makes it obvious why something the user "doesn't use" is still enabled.

## 6. Future: precision improvements to the JS scanner

Out of scope for the current prototype, but worth noting:

- Better detection of dynamic `require` / `import()` patterns.
- Optional config to override the scanner's verdict per-app.
- Possibly a "strict" mode that errors instead of silently keeping all
  capabilities when the scanner is uncertain.

These can be revisited once we have real users running with `--auto-trim`.

## 7. End-to-end size measurement once the DCE tool exists

Tied to step 0. Once the DCE/import-stripper tool is available:

- Build a baseline wasm-rquickjs base image (no patching, no DCE).
- Build the same base image with `inject-js --auto-trim` for the Golem TS
  template scenario described in the experiment.
- Run the DCE/import-stripper on that.
- Compare:
  - final component size,
  - WIT imports present in the final component,
  - cold-start time if measurable.

Document the numbers in the README (or a dedicated benchmarks doc).

## 8. Findings: investigation into making WIT imports actually drop (2026-05)

This section captures the current state of the joint wasm-eliminator +
wasm-rquickjs effort and what is still blocking end-to-end import pruning. It
supersedes the optimistic wording of step 0 above.

### Status

- wasm-eliminator (in `../../oss/wasm-eliminator`) is feature-complete for the
  bits this scenario needs:
  - constant-prop through immutable globals,
  - dead-branch elimination on statically-zero `if`/`block` guards,
  - set-valued IPCP, deeper abstract operand stack,
  - flat-memory-backed `i32.load` folding,
  - outer fixed-point over direct-call argument facts,
  - constant-return direct-call folding,
  - reachability tracking so dead code does not pollute call-edge liveness or
    direct-call argument facts,
  - encoder scrubbing of dead `Call` / `ReturnCall` / `RefFunc` to
    `unreachable`,
  - wasmtime-as-a-library test harness validating shrunk binaries.
- All `cargo test -p wasm-eliminator` is green.
- wasm-rquickjs already does the producer-side work:
  - capability gates lowered to immutable wasm globals (already shipped),
  - custom [`BuiltinNativeLoader`](file:///Users/vigoo/projects/golem/wasm-rquickjs/crates/wasm-rquickjs/skeleton/src/builtin/mod.rs#L743)
    that replaces the generic `rquickjs::loader::ModuleLoader`. This removes
    every `ModuleLoader::load_func<X>` monomorphization.
- On the no-console fixture
  (`tmp/elim-experiment/example1-no-console-auto-trim.wasm`,
  `--auto-trim` reports `enabling 0 of 52 capabilities`):
  - core module size shrinks: `55,667,883 B -> 13,235,054 B`,
  - `declare_def<D>` monomorphizations: **0 survive** (good),
  - `load_func<D>` monomorphizations: **0 survive** (good),
  - but `Module::eval_fn::<D>` monomorphizations: **21 survive**,
  - component imports: **29 -> 29** (no change),
  - WIT imports `wasi:logging/logging`, `wasi:filesystem/*`, `wasi:http/*`,
    `wasi:sockets/*` are still present after DCE.

### Root cause

The 21 surviving `eval_fn<D>` are kept alive by active element segment 0 (the
big rust-lld-generated table). Some live `call_indirect` site has
`IndexSet::Any` on type `(i32, i32) -> i32`, so Phase A type-fallback in
wasm-eliminator keeps every type-2 slot — including all `eval_fn<D>` — alive.
Each per-D `eval_fn<D>` in turn keeps `D::evaluate` reachable, which keeps the
native code and host imports for D's builtin alive.

The relevant `call_indirect` is inside the QuickJS C runtime: the dispatch
loads `module->func` from a `JSModuleDef` allocated on the QuickJS heap and
calls it indirectly. The function pointer in that field is whatever was passed
to `JS_NewCModule(ctx, name, Some(callback))`. Today rquickjs calls
`JS_NewCModule(..., Some(Module::eval_fn::<D>))` once per ModuleDef type `D`,
so each `D` contributes a distinct callback function pointer.

### What we tried in wasm-eliminator

Earlier in this work we tried a broad Phase G "live source set" approach:
narrow `IndexSet::Any` to a small set whenever no live `i32.const` /
`ref.func` / static-data u32 produced any of the missing indices. This was
**unsound** — it broke tests like
`a3_same_type_dynamic_index_keeps_all_matching_slots`,
`b3_parameter_local_falls_back_to_phase_a`,
`f5_unknown_entry_dispatcher_falls_back_safely`,
`f6_two_callers_one_unknown_collapses_to_top` — because params, imported
function returns, imported globals, opaque arithmetic and opaque memory loads
can all supply call_indirect operands not visible in any constant source set.
That approach has been reverted and the soundness tests prove the boundary.

### What the oracle says

Asked the wasm-eliminator oracle for a sound, provenance-aware Phase G with a
realistic chance of solving the QuickJS shape. Verdict:

- The only sound generic direction is **per-call-site tracked-field provenance
  over abstract objects, with escape-to-Top**. Effort: **XL**.
- Even with that, the QuickJS dispatch reaches `call_indirect` through
  `i32.load` of an opaque heap-derived pointer whose abstract-object provenance
  is lost long before the dispatch site. Realistically, eliminator-only
  recovery is **unlikely** without producer cooperation (constructor / writer
  summaries telling the analysis "this allocator returns a fresh object whose
  field `func_off` is initialized from arg N").
- The pragmatic alternative is **producer-side**: replace the per-D
  `Module::eval_fn::<D>` with a single shared trampoline in wasm-rquickjs
  (M/L effort). Then there is exactly one `eval_fn` in the function table, the
  type-based Phase A fallback only keeps that one alive, and per-D
  `declare` / `evaluate` (and their builtin imports) can become dead.

### Producer-side shared trampoline: what blocks the in-tree implementation

Intended design: replace each
`Module::declare_def::<X::js_native_module, _>(ctx, name)` in
`BuiltinNativeLoader::load` with a single
`Module::declare_def::<UnifiedBuiltinModuleDef, _>(ctx, name)` whose
`declare` / `evaluate` dispatch by direct call based on the module's name. Net
result: 21 `eval_fn` monomorphizations collapse to 1, and per-D code becomes
direct-call-only (eliminable when the corresponding capability is gated off).

The unresolved technical issue is identifying the current module from inside
`UnifiedBuiltinModuleDef::evaluate(ctx, exports)` using only public rquickjs
API:

- `Module<'js, T>`'s `ptr` and `ctx` fields are **private** (not
  `pub(crate)`).
- `Module::from_ptr` and `Module::as_ptr` are `pub(crate)`.
- `Declarations<'js>(Module<'js, Declared>)` and
  `Exports<'js>(Module<'js, Declared>)` expose **no public accessor** for the
  inner module.
- `Module::name<N>(&self)` is public but requires a `&Module<Declared>`, which
  we cannot obtain through public APIs from inside `evaluate`.

Workarounds evaluated:

- **`unsafe` transmute of `&Exports` / `&Declarations` to `&Module<Declared>`,
  then call public `Module::name()`.** Works in practice because both wrappers
  are single-field tuple structs around `Module`, but `#[repr(Rust)]` layout
  is not formally guaranteed.
- **Thread-local set from `BuiltinNativeLoader::load`.** Works for `declare`
  (synchronous inside `Module::declare_def`). Does **not** work for
  `evaluate`, which QuickJS may call later from arbitrary module-instantiation
  contexts.
- **`ctx.script_or_module_name(0)` inside `evaluate`.** rquickjs itself uses
  `script_or_module_name(1)` from a JS-callback path. Whether this returns the
  correct module name when called from inside a `JS_NewCModule` init callback
  has not been verified.
- **Bypass `Module::declare_def` and call `qjs::JS_NewCModule` directly.**
  Blocked: cannot construct `Module<Declared>` from the returned pointer
  because `Module::from_ptr` is `pub(crate)`.
- **Const-generic `UnifiedDef<const ID: u32>`.** Still monomorphizes per `ID`
  — does not reduce the number of `eval_fn` functions.

### Decision needed

One of:

- **A**: ship the transmute-based shared trampoline in wasm-rquickjs (single
  helper, well-documented, runtime size/align assertion as a guard). Smallest
  change, gets the trampoline working.
- **B**: try `ctx.script_or_module_name(0)` first; if it works inside the init
  callback, no transmute is needed.
- **C**: upstream a small patch in rquickjs to make `Module::as_ptr` or
  `Exports::module()` / `Declarations::module()` public. Cleanest long-term,
  requires a release cycle.
- **D**: invest in the XL Phase G provenance work in wasm-eliminator. Oracle
  warns this likely will not even solve QuickJS without producer-side
  cooperation, so this is high cost for uncertain payoff.

Recommendation: A or B (B preferred if `script_or_module_name(0)` is
confirmed to work in an init callback), with C as the long-term cleanup.


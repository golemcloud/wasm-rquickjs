# Plan: Per-app builtin trimming for wasm-rquickjs

This plan tracks the remaining work for the runtime capability-gates approach.
The wasm-rquickjs side prototype is in place: gates slot in the skeleton,
host-side patching of all gate slot copies, CLI flags on `inject-js`, and an
end-to-end integration test.

## 0. Wait for the wasm-level dead-code / import eliminator

**Blocker for actually shipping size + import reductions to users.**

- The current scheme only flips a runtime bit. Without DCE on the produced wasm,
  disabling a capability does not remove its native code, JS source bytes, or
  the WIT imports it transitively pulls in.
- A separate tool (already in development by the user) is expected to:
  - perform component-level dead-code elimination, and
  - drop unused component model imports based on what is reachable.
- We need to wait until that tool is usable end-to-end on a patched
  wasm-rquickjs base image before we start measuring real wins.
- Action: once the tool exists, run it on a `inject-js --auto-trim`-patched
  artifact and confirm:
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

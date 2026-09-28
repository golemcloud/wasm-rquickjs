# Capability specialization for Golem: gate detection + Wizer

## Recommendation: keep and adapt, without wasm-eliminator

This branch can support two explicit Golem runtime contracts:

- **Full (default):** retain every compiled builtin and loader, including in new
  execution realms. Use this for agents that generate arbitrary JavaScript or
  TypeScript. TypeScript requires a compiler-enabled template.
- **Strict optimized (opt-in):** skip registration and initialization of runtime
  features the application promises not to need. Wizer then captures less
  initialized QuickJS state. Later code cannot assume omitted modules exist.

Neither mode needs wasm-eliminator. The dependency and `dce` CLI command have
been removed. `inject-js --strict-optimized` changes capability data bytes only;
it does not rewrite instructions, remove native functions, or trim WIT imports.
The earlier helper-lowering library API remains available for compatibility,
but neither this CLI path nor the new measurements use it.

The branch was locally merged with main at
[`f684fffb`](https://github.com/golemcloud/wasm-rquickjs/commit/f684fffb).
This implements runtime primitives in wasm-rquickjs, not a Golem CLI configuration
option or an end-to-end Golem SDK integration.

## What the branch actually does

1. Scan JavaScript imports and global API usage.
2. Expand that set to include builtin dependencies. On uncertainty, retain all
   features unless the caller explicitly requests aggressive trimming.
3. Patch a bitset in a fresh component template before initialization.
4. Let the runtime skip disabled module registrations and global initialization.
5. Run the ordinary Wizer optimizer to capture the smaller initialized state.

P2 and P3 now share the capability-aware registry. P3 still selects its own
`http_p3`, `node_http_p3`, and response-body implementations. The filesystem
module-loader gate applies to both targets. This avoids maintaining two copies
of registration and dependency policy.

Patching alone does not make the file smaller: native code and JS source data
remain present. The intended gain is a smaller **preinitialized snapshot**.
This is not a permission boundary and does not reduce the full guest world.

## How to use the modes

Full mode, including Wizer:

```sh
wasm-rquickjs inject-js --input template.wasm --output injected.wasm --js app.js
wasm-rquickjs optimize --input injected.wasm --output app.wasm
```

Strict optimized mode, on either target:

```sh
wasm-rquickjs scan-capabilities --js app.js
wasm-rquickjs inject-js --input template.wasm --output injected.wasm \
  --js app.js --strict-optimized
wasm-rquickjs optimize --input injected.wasm --output app.wasm
```

`--auto-trim` remains an alias. Include/exclude flags without automatic scanning
start from all capabilities. Required dependencies override conflicting excludes,
which are reported. `--trim-unknown` gives up conservative uncertainty fallback;
it is not necessary merely to select strict mode.

Always start from the original, unspecialized template, **before Wizer**. The
CLI does not prove this precondition. Repatching a snapshot cannot undo cached
gate values or already initialized modules. The caller must account for every
embedded module, generated bridge and future execution, not only injected JS.

## Measurements

The updated `binary_inject` harness builds stripped release components with LTO,
patches only data slots, and executes both raw components and Wizer snapshots
in fresh Wasmtime stores. Fixtures cover pure JS, base64's error path, aliased
WebStreams, and generated TypeScript dynamically importing `node:path`.

These are runtime mechanism measurements, **not Golem SDK agent benchmarks**.
Full means this branch's all-enabled template, not a separate pristine-main
build. The compiler is enabled only for the generated-TypeScript fixture.
Sizes are uncompressed component bytes, not download sizes or runtime memory.

Completed no-eliminator comparison:

| Target / fixture | Raw full | Raw strict | Wizer full | Wizer strict | Snapshot reduction |
| --- | ---: | ---: | ---: | ---: | ---: |
| P2 / pure JS | 5,712,650 | 5,712,650 | 12,629,474 | 6,312,193 | 50.02% |
| P2 / base64 | 5,712,708 | 5,712,708 | 12,629,821 | 12,629,684 | ~0% |
| P2 / WebStreams | 5,712,771 | 5,712,771 | 12,629,831 | 12,629,852 | ~0% |
| P2 / generated TypeScript | 8,394,848 | 8,394,848 | 15,306,962 | 15,306,996 | ~0% |
| P3 / pure JS | 5,671,857 | 5,671,857 | 12,605,497 | 6,288,044 | 50.12% |
| P3 / base64 | 5,671,915 | 5,671,915 | 12,605,950 | 12,605,915 | <0.001% |
| P3 / WebStreams | 5,671,978 | 5,671,978 | 12,606,139 | 12,606,095 | <0.001% |
| P3 / generated TypeScript | 8,357,803 | 8,357,803 | 15,286,912 | 15,287,043 | -0.0009% |

All pure-JS snapshots returned `pure:WORLD`. Across all four fixtures on both
targets, root component import/export sections are byte-identical in raw and
Wizer outputs, in both modes. The strict snapshot remains larger than raw Wasm: the saving
compares two preinitialized images, not Wizer against no Wizer.

The current scanner infers zero capabilities for pure JS, but all 53 for base64,
WebStreams and generated code because of conservative dependencies. Therefore
strict mode does not promise a saving for those applications. SDK applications
need their own measurement; the pure fixture is a best-case illustration.
Small byte differences between all-enabled snapshots are not feature removal.
Generated TypeScript returned `answer:42` in every raw/snapshot mode on both targets;
the slight size increase in its strict-labelled output reinforces that inference
does not guarantee smaller snapshots when all capabilities remain enabled.

The existing console fixture also scans to **53/53 with no uncertainty fallback**.
One concrete dependency chain is base64 → DOMException/AbortController → events
→ `require('node:util')` → the eager CommonJS module catalog → all capabilities.
Console also reaches this graph through util/crypto. This is a practical blocker
for many Golem agents, not an argument for ignoring those dependencies. Breaking
that coupling is the likely next step if real SDK bundles retain everything.

For historical comparison, the previous eliminator-enabled P2 pure-JS run
produced 12,600,895 bytes (full + DCE + Wizer) versus 6,278,619 bytes (restricted
+ DCE + Wizer). DCE alone saved only 28,444 bytes from a 5,712,656-byte raw
component. Those numbers are from the earlier implementation, not a controlled
same-build comparison against the current no-eliminator path. The new P2 full
snapshot is 28,579 bytes larger and the strict snapshot is 33,574 bytes larger
than those earlier results. In practical terms, the roughly 6.3 MB snapshot
saving survives without the eliminator or helper lowering; the observed cost
against the earlier restricted snapshot is about 34 KB, or 0.53%.

## Relationship to Golem #3939

#3939 chooses which **SDK implementations** Rollup retains: agent, tool and
middleware. This branch chooses which **QuickJS runtime facilities** initialize.
The two capability sets are different; neither manifest can substitute for the
other. TypeScript uses program/type-checker analysis; Effect uses a probe Rollup
build and retained-module analysis. Both must retain one full guest world.

The compatible build order is:

1. Run #3939's capability-sensitive Rollup bundling.
2. Inventory the retained bundle **and embedded SDK/Effect modules and bridges**.
3. Choose full or strict runtime policy explicitly.
4. Inject JS and, only for strict mode, patch runtime gate data.
5. Wizer-initialize the component, preserving the same full guest world.

Do not scan every SDK source: that defeats valid Rollup pruning. Do not scan
only the injected user slot: embedded runtime modules may need additional
builtins. Unknown host-module requirements must be included explicitly or cause
fallback to full mode. WIT-style imports are recorded separately; their absence
from static JS is not a reason to remove host interfaces.

Full mode must preserve the compiler, filesystem loading, builtin catalog and
host bridges in both the application realm and newly created execution realms.
It cannot restore SDK packages that Rollup or packaging omitted. Strict mode
may deliberately restrict future code, but should make that contract visible
to the agent developer rather than silently inferring it from SDK role usage.

## Remaining Golem integration work

- Update Golem's wasm-rquickjs dependency and regenerate its P3 SDK templates
  with this runtime. Older main-generated P3 templates have no gate slot;
  changing the injection flag cannot retrofit one. Preserve the full guest world.
- Add an explicit Golem build setting with full as the default. The wasm-rquickjs
  CLI flag alone does not wire this into Golem's existing library API calls.
  Use `patch_capability_gates_slots_in_bytes` for the data-only path, not the
  legacy helper-lowering API.
- Select a compiler-enabled template when runtime TypeScript is promised.
  Build-time Rollup transpilation alone does not require the embedded compiler.
  This existing template-feature choice is independent of gate specialization
  and does not require separate role-specific guest worlds.
- Supply a complete retained-module inventory and a versioned set of required
  runtime capabilities for embedded SDK/Effect modules and generated bridges.
  Pin the scanner and template gate schema together; an older scanner cannot
  account for new capabilities in a newer template.
- Benchmark actual empty, tool, agent, middleware and Effect components after
  #3939, with the full guest world and matching template/compiler features.
- Verify host module calls, dynamic JS/TS and filesystem imports in full mode;
  verify allowed behavior and deliberate missing-module failures in strict mode.
- Improve overly coupled builtin initialization only when real Golem bundles
  show it blocks useful savings. `node:module` currently retains the catalog;
  base64 also reaches broad dependencies through its error support.

## Merge repairs and verification procedure

The original branch was 178 main commits behind. The textual conflict was in
the builtin registry. Semantic repairs included current HTTP/V8 registration,
module-loading and TypeScript behavior, conservative scanner fallback,
source-derived builtin dependencies, and removal of unsafe private rquickjs
layout casts. The old DceOptions API and missing local eliminator dependency
were initially replaced with its public pinned API; the current revision removes
that dependency entirely. Six inspected Amp threads showed no unpublished
wasm-eliminator changes at the time of the earlier investigation.

The no-eliminator scanner and injection unit suites pass (56 and 22 tests).
The complete P2 and P3 `binary_inject` suites pass, including all four fixtures
in full and strict mode, before and after Wizer (32 matrix executions), plus
ordinary injection and reinjection.
Root/integration Clippy, all ten skeleton feature configurations, root formatting
and recursive skeleton formatting pass. Pre-PR formatting normalized existing
layout drift without changing behavior. Targeted P3 fetch POST/GET, node:http GET
and filesystem package-map regressions pass. The integration matrix additionally checks that a manually
disabled SQLite module cannot import. The canonical strict flag and old alias
produce byte-identical injected components.

Final PR checks also pass: all-target workspace build and Clippy, plus Prettier,
ESLint and TypeScript compilation for `tools/ai-dev-tools`.

Reproduce the focused checks:

```sh
cargo test -p wasm-rquickjs --lib capability_scan::tests
cargo test -p wasm-rquickjs --lib inject::tests
cargo test --test binary_inject
WASM_RQUICKJS_TEST_TARGET=p3 cargo test --test binary_inject
tools/dev-test.sh p3 fast-start runtime fetch_post_json_and_get
tools/dev-test.sh p3 fast-start runtime node_http_get
tools/dev-test.sh p3 fast-start runtime esm_package_map_edge_cases
cargo clippy --locked --test binary_inject -- -Dwarnings
tools/check-skeleton-clippy.sh
cargo fmt -- --check
```

Run P2 and P3 injection lanes sequentially: they share generated build paths.
Use `-- capability_specialization` for only the measurement matrix, or
`-- dynamic_typescript` for only the compiler-enabled case. No full node-compat
sweep, startup/memory benchmark or production Golem deployment is implied.

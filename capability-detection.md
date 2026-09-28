# Capability specialization: current implementation and measurements

## Recommendation: adapt, with two distinct contracts

Keep strict WebAssembly DCE as an independent, behavior-preserving size pass.
Keep capability scanning and P2 gate specialization as experimental tools for
explicitly closed-world applications. Do not use static application imports to
restrict a runtime that promises arbitrary later-generated JavaScript/TypeScript.
Reducing Golem's WIT import surface is not a goal of this work.

The demonstrated benefit is **smaller P2 Wizer snapshots for a restricted
runtime**, not large raw-component reductions. In the pure-JS fixture, specialization
halved the preinitialized component while changing the non-preinitialized size
by less than 1%. This does not justify restricting Golem's dynamic runtime.

This local branch merges wasm-rquickjs main at
[`f684fffb`](https://github.com/golemcloud/wasm-rquickjs/commit/f684fffb)
into the original capability branch. It pins wasm-eliminator to its inspected
HEAD, [`ddfeaf3424e438861404363bb3a3d6f610449524`](https://github.com/golemcloud/wasm-eliminator/commit/ddfeaf3424e438861404363bb3a3d6f610449524),
using the public strict `eliminate` API. It does not use trusted producer hints.
The six available Amp threads for wasm-eliminator were checked; none showed
unpublished repository changes. The roadmap thread reported a clean, pushed
checkout at this HEAD. This is evidence from those threads, not a guarantee about
other machines. The project is not yet published to crates.io, so the dependency
is Git-pinned rather than a local path or a fabricated release version.

## What was stale and what was repaired

Main had 178 commits beyond the common base. The textual merge conflicted only in
`skeleton/src/builtin/mod.rs`, but a textual merge was insufficient:

- Ported main's HTTP incoming and V8 registrations, fetch feature guard, and
  shared HTTP response-body module. Removed a filesystem re-export main deleted.
- Preserved main's module-loading, TypeScript transformation, and CJS behavior
  on the all-enabled path. The restricted loader remains an explicit P2 policy.
- Replaced the missing local wasm-eliminator dependency and removed calls to
  its obsolete `DceOptions`/`dce_with_options` API.
- Removed the unified native trampoline's private rquickjs layout casts. Native
  modules use public `Module::declare_def` APIs. Size/alignment checks did not
  make those casts safe. Reintroducing a shared trampoline requires a supported
  rquickjs API, not another guessed layout.
- Scanner uncertainty now retains all capabilities: parser failures, unknown
  packages, unresolved imports, indirect eval/Function references, global-object
  access, and VM imports. Fixed the `node:stream/web` registration mapping.
- Dependency closure combines curated runtime wiring edges with an audit of the
  embedded builtin JS sources and their internal helper imports. `node:module`
  retains the complete catalog; `btoa` retains its DOMException dependency.
  Explicit includes win over conflicting excludes.
- Repatching an already-specialized binary to a different policy now fails
  instead of changing its data slot while leaving lowered gate constants stale.
- Fixed recursive call-graph memoization in legacy capability-root metadata.
  That metadata is diagnostic only; strict DCE does not trust it.

The scanner is still a heuristic, not complete JavaScript reachability analysis.
The caller must supply all embedded modules and account for future code. Passing
`--trim-unknown` explicitly gives up the conservative uncertainty fallback.

## How to use the two modes

For unrestricted dynamic applications, including the Golem case:

```sh
wasm-rquickjs inject-js --input template.wasm --output injected.wasm --js app.js
wasm-rquickjs dce --input injected.wasm --output app.wasm
```

The template must already contain the promised facilities. In particular,
generated TypeScript requires the opt-in `typescript-runtime` Cargo feature;
keeping all runtime gates cannot restore code excluded at compile time.

For a deliberately closed-world P2 application:

```sh
wasm-rquickjs scan-capabilities --js app.js
wasm-rquickjs inject-js --input template.wasm --output app.wasm \
  --js app.js --auto-trim
```

Specialization must start from a fresh template **before Wizer initialization**.
A preinitialized snapshot already contains registrations and cached gate values.
The CLI does not prove that an input is such a fresh template; this remains a
caller precondition. Never reuse a restricted template for an unrelated app.
Complete injection and gate patching before DCE as well: preserving a binary's
current behavior is not a guarantee that later offline data patching remains
valid after constant propagation.

No specialization flags means ordinary injection, with all builtins retained.
Include/exclude flags without auto-trim start from all capabilities. Dependency
closure may make an exclusion ineffective, which the CLI reports. Neither gates
nor DCE are a security or host-permission boundary.

P3 has a separate builtin registry and no capability gate slot. It is not made
specializable by this merge; its filesystem loader stays enabled. Strict DCE is
the independently tested optimization path on P3.

## Measurements and verification

The `binary_inject` harness builds stripped release components (`opt-level=s`,
LTO), compares baseline, strict DCE, and P2 specialization followed by strict DCE,
and executes each artifact in a fresh Wasmtime store. Fixtures cover pure JS,
base64 including its error path, an aliased WebStreams import, and generated
TypeScript which dynamically imports `node:path` and returns `answer:42`.
P3 compares baseline and strict DCE and verifies that gate patching is rejected.
Byte counts are raw component bytes, not compressed download sizes. These are
small runtime fixtures, not Golem SDK application-size benchmarks. Baseline means
ordinary injection into this branch's all-enabled template, not a separate build
of pristine main. Only the generated-TypeScript fixture enables the compiler
feature, so its baseline is deliberately larger than the normal-runtime cases.

P2 pure-JS results, all executed successfully:

| Mode | Component bytes |
| --- | ---: |
| Ordinary injection | 5,712,656 |
| Strict DCE | 5,684,212 |
| Closed-world specialization + strict DCE | 5,679,147 |
| Strict DCE, then Wizer | 12,600,895 |
| Closed-world specialization + strict DCE, then Wizer | 6,278,619 |

Strict DCE saves 28,444 bytes (0.50%); specialization adds only 5,065 bytes of
non-preinitialized component savings. The specialized Wizer snapshot is
6,322,276 bytes smaller (50.17%) than the all-enabled snapshot. Both return `pure:WORLD`
after instantiation. Root imports remain 29 throughout the non-snapshot DCE
comparisons. Skipping builtin initialization avoids capturing that initialized
state; it does not imply those builtins' native code and source data disappeared.
The specialized snapshot is still larger than the non-preinitialized component;
the 50% saving compares two preinitialized images, not Wizer against no Wizer.

Other executed release-component comparisons:

| Target | Fixture | Baseline bytes | Strict DCE bytes | Specialization + DCE bytes |
| --- | --- | ---: | ---: | ---: |
| P2 | Base64 + error path | 5,712,714 | 5,684,270 | 5,679,021 |
| P2 | Aliased WebStreams | 5,712,777 | 5,684,333 | 5,679,084 |
| P2 | Generated TypeScript | 8,394,909 | 8,328,647 | 8,323,398 |
| P3 | Pure JS | 5,661,764 | 5,635,198 | Not supported |
| P3 | Base64 + error path | 5,661,822 | 5,635,256 | Not supported |
| P3 | Aliased WebStreams | 5,661,885 | 5,635,319 | Not supported |
| P3 | Generated TypeScript | 8,349,565 | 8,285,496 | Not supported |

Every output returned its expected value, including `answer:42` from generated
TypeScript on both targets. Strict DCE saves about 0.5% on normal images and
0.8% on compiler-enabled images. Root imports stay 29 on P2 and 27 on P3.
All DCE reports have `trusted_assumptions=false`.

The base64, WebStreams and dynamic fixtures infer all 53 capabilities under the
corrected dependency closure. Their P2 "specialization" therefore just lowers
all-enabled gates to constants: its additional roughly 5 KB saving is not builtin
removal. The pure-JS case infers zero. These numbers show both the potential
snapshot benefit and the current conservative policy's limited applicability.

The historical 55 MB to 13 MB claim in the old plan is not a comparable stripped
release measurement and is not used as evidence here. Root import counts are
diagnostic, not a success criterion. Startup latency, peak memory, production
Golem app behavior, SDK bundle sizes, and gate-only snapshots without DCE require
separate measurements. These are Linux x64/Rust 1.98.1 samples; build paths and
snapshot contents can affect exact byte counts.

Verification completed:

- Scanner unit tests: **56 passed**. Injection/gate unit tests: **22 passed**.
- P2 injection, Wizer, reinjection and manual-gate smoke checks passed. The
  corrected P2 matrix passed all four fixtures in all three modes, plus the two
  pure-JS snapshots. The first matrix attempt had used a compiler-disabled
  template for TypeScript and failed; the fixture now explicitly enables the
  compiler, and both its focused rerun and the complete matrix passed.
- The full P3 `binary_inject` harness passed, including all four baseline/DCE
  pairs, ordinary Wizer/reinjection checks, and rejection of gate patching.
- Root Clippy, integration-target Clippy, all ten P2/P3 skeleton Clippy feature
  lanes, root formatting, skeleton formatting and whitespace checks passed.
- No full node-compat sweep or actual Golem SDK application benchmark was run.

Reproduction:

```sh
cargo test -p wasm-rquickjs --lib capability_scan::tests
cargo test -p wasm-rquickjs --lib inject::tests
cargo test --test binary_inject
WASM_RQUICKJS_TEST_TARGET=p3 cargo test --test binary_inject
cargo clippy --locked -- -Dwarnings
cargo clippy --locked --test binary_inject -- -Dwarnings
tools/check-skeleton-clippy.sh
```

For practical host-side DCE speed, the final integration runs used
`--config 'profile.dev.package.wasm-eliminator.opt-level=3'` and
`--config 'profile.dev.package.wasm-ir.opt-level=3'` on the Cargo test build.
These do not change the guest release profile or reuse mutable runtime state.
Pass `-- capability_dce` to run only the matrix, or `-- dynamic_typescript` for
the compiler-enabled case. P2 and P3 should run sequentially in one work directory;
the investigation used isolated scratch directories for concurrent lanes.

## Relationship to Golem PR #3939

The two systems operate at different layers:

- Golem's inspected `cli/golem-cli/src/app/build/command.rs` injects into the SDK
  image before calling `optimize_component(..., "wizer-initialize")`. This order
  accommodates a pre-Wizer size pass; it does not make a restrictive policy safe.
- The TypeScript component plugin analyzes SDK registration and chooses real or
  empty guest implementations. Effect's build helper probes retained Rollup
  modules before selecting its implementations. Their output still implements
  one full guest world with canonical exports.
- This branch controls QuickJS builtin registration and loaders, then optionally
  runs Wasm DCE. An SDK agent/tool/middleware capability is not a QuickJS builtin
  capability. Do not reuse either capability manifest as the other's policy.
- Rollup should first remove unnecessary SDK implementation code. Strict Wasm
  DCE can then optimize the resulting component without intentionally reducing
  the guest world or interpreting missing static JS imports as missing runtime
  requirements. Keep external host modules and execution support available.
- Scanning only an injected entry misses embedded Effect modules and generated
  WIT bridges. Scanning every SDK source instead would defeat Rollup's valid
  specialization. A future closed-world integration needs an inventory of the
  retained application modules, embedded modules, and host modules separately.
- Preserving the JS/TS evaluator alone is insufficient: future generated code
  also needs builtin registrations, loaders, compiler support and host bridges.
  Separately, if the SDK package now resolves to a small app-specific wrapper,
  dynamically importing the full SDK from a new realm is a package-availability
  issue which this optimizer cannot repair.

## Useful follow-on work

1. Use measured strict-DCE results to decide whether its build cost pays off.
   It does not need capability inference or WIT minimization.
2. Evaluate the measured P2 snapshot benefit on real closed-world apps, together
   with initialization latency and memory. The public gate-patching API can skip
   registration without DCE; the CLI currently chains the two. Consider a
   gate-only CLI path if DCE's small saving is not worth its build-time cost.
3. If native size wins are insufficient, improve producer reachability through a
   supported shared-trampoline API in rquickjs. Opaque QuickJS heap function
   pointers can keep same-signature callbacks alive under sound DCE. Do not
   restore unsafe casts or old trusted symbol suppression to force a win.
4. Audit inline Rust wiring dependencies, add broader builtin and filesystem
   regression coverage, then consider a separately designed P3 gate registry.
   Splitting tightly coupled initialization helpers (for example DOMException
   from AbortController/Events) could let simple APIs retain smaller subsets.
5. Only integrate closed-world specialization into an SDK build when the product
   explicitly restricts future code. Keep unrestricted Golem builds on the full
   dynamic runtime and one full guest world.

For unrestricted Golem, the snapshot result instead motivates investigating
**lazy or per-realm builtin initialization while retaining availability**. Keep
the complete native/module catalog, loader and compiler in both the outer app
and future execution realms, but avoid eagerly initializing unused wrappers
before Wizer. The current single gate mask applies to every QuickJS realm in the
component, so it cannot express this distinction. This would be a separate
runtime design, with tests for
global property descriptors, identities, initialization side effects, dependency
cycles and fresh execution realms. It is not something PR #3939's SDK capability
manifest can safely enable in this branch today.

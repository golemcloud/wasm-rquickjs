# wasm-rquickjs — Node module-compatibility review (`module-improvments`)

> All `file:line` references below are against the **`module-improvments`** branch (the PR under
> review). This document itself is delivered on a separate branch off `main`.

**Scope:** same-process Node.js module compatibility — ESM/CJS interop, `require(esm)`, package
`exports`/`imports`, condition handling, `node_modules` resolution, CJS named-export analysis,
loader-provided CommonJS named exports, `module.register()`/loader behavior, module-kind / syntax
detection, and node_compat config/report accounting.

**Baseline:** Node **v22.14.0** (`$HOME/.nvm/versions/node/v22.14.0/bin`).
**Runtime under review:** branch `module-improvments`, feature `use-golem-wasmtime`.
**Method:** 8 independent deep-dives + reviewer cross-verification. Every behavioral claim below was
checked against real Node 22.14.0 with a throwaway fixture **and** traced to the exact runtime code
path (file:line). Nothing here rests on "the test passes."

---

## 1. Verdict

**Strong, genuinely-engineered PR — but not yet full same-process parity.** The core resolver,
`require(esm)` interop, loader/`module.register()`, import-attributes/JSON, and node_compat
accounting are Node-faithful and *not* test-shaped. However there are **concrete same-process bugs**,
one of which is exactly the "recognizes only a vendored fixture shape" pattern the review targets.

Recommended gate before claiming CJS named-export / resolver parity:

| Must-fix before parity claim | Should-fix | Acceptable as-is / documented follow-up |
|---|---|---|
| **F1** export-star `tslib`-receiver hack (Rust) | **F4** template `${}` not parsed (module-kind split) | resolver edge error-codes (F7a–F7e) |
| **F2** JS loader has no export-star handling | **F5** `await`/`import`/`export` as identifier ⇒ false ESM | perf: negative-cache, multi-pass (P1–P3) |
| **F3** `import.meta.resolve` ignores `exports`/node_modules | **F6** resolver error-text drift (Rust vs JS vs Node) | loader `context.conditions` on load hook |

None are catastrophic; all have narrow, low-risk fixes. The unifying root cause is **parallel
hand-written implementations** (Rust for the `import` side, JS for the `require`/loader side, and a
*third* naive one for `import.meta.resolve`) with **no cross-path parity test** — they have already
drifted in several concrete places.

---

## 2. What was independently verified as PASSING / correct

Re-run and re-derived by the reviewer, not taken on faith:

- **`cargo test --test runtime --features use-golem-wasmtime -- module_resolution` → 35/35 pass, 0 fail** (242s, local).
- **node_compat report numbers reproduced independently** by replicating the classification logic:
  **3240 runnable / 4423 primary = 73.3%, `unevaluated = 0`** (full inventory 6865; excluded:
  NodeInternals 1122, WasmImpossible 1156, EngineDifference 164). No same-process module bug is
  hidden in a percentage-excluded bucket (every module entry there genuinely spawns a `node` binary,
  uses worker/inspector/vm-realm, or imports `internal/*`).
- **`require(esm)` namespace shape** matches Node exactly: `__esModule:true` + `[object Module]`
  **only** when a `default` export exists; no `__esModule` otherwise; live bindings preserved via the
  proxy `get` (`module.js:2177` `wrapEsmNamespace`).
- **Package `exports`/`imports` core** — condition *membership* (order is correctly irrelevant since
  matching iterates package.json key order), pattern precedence (`packagePatternCompare` ≡ Node
  `PATTERN_KEY_COMPARE`), invalid/`node:`/bare targets, `%2f`/`%5c` rejection, null/blocked, array
  fallback, nested conditions, self-reference, and the intended package-root `.`/`./` split
  (ESM → `ERR_UNSUPPORTED_DIR_IMPORT`, CJS → `MODULE_NOT_FOUND`) — all Node-matching.
- **Dual-package hazard** works on both real paths: `require('pkg')` picks the `require` condition,
  `import 'pkg'` picks the `import` condition; `module-sync` present in both sets. (`import.meta.resolve`
  is the one path that fails to reuse this — see F3.)
- **CJS named-export analysis outside export-star** reproduces Node 22.14.0 **exactly** in both
  engines: object-literal keys with correct bail points, `...require()` spread, `Object.defineProperty`
  value/getter/method-shorthand (arrow getter correctly rejected; `enumerable`-after-`get` correctly
  bails; member-return depth), interleaved / computed / dash / numeric `exports.x`,
  `module.exports = require(...)` reassignment, and `Object.keys(...).forEach(...)` Babel star. Node
  quirks matched: Node does **not** detect `Object.assign(exports, {…})`, and the runtime correctly
  declines it too. (See Appendix B for the full table.)
- **import-of-CJS `__esModule` semantics** — `import def from './babel.cjs'` binds `def` to the whole
  `module.exports` (Node does not honor `__esModule` on this direction); `import * as ns` gives
  `ns.default` = whole exports. Runtime matches (`internal.rs:6479-6491`, `cjs_named_export_source`
  `internal.rs:6368`).
- **`require(esm)` async / cycle errors are genuinely detected, not assumed** — `require_esm_impl`
  (`vm.rs:139-243`) evaluates an `import * as ns` wrapper and inspects the evaluation **Promise state**
  (`Pending` → `ERR_REQUIRE_ASYNC_MODULE`; caches async result to avoid re-eval); cycle detection uses
  a real in-progress registry keyed by path + file URL (`ERR_REQUIRE_CYCLE_MODULE`), mirrored on the
  JS side (`module.js:4422-4428`).
- **Import attributes / JSON modules** — all four codes correct (`ERR_IMPORT_ATTRIBUTE_MISSING`,
  `…_UNSUPPORTED`, `…_TYPE_INCOMPATIBLE`, parsed-object default) via a single rule set shared by the
  Rust static path, the dynamic-import JS path, and the `data:` URL loader
  (`internal.rs:1263-1313`, `mod.rs:640-708`).
- **`createRequire`** — URL→path, synthetic parent `paths`, `.cache`/`.resolve`/`.resolve.paths`/
  `.extensions`, CJS conditions (`module.js:5411-5451`). (One cosmetic gap — see F7f.)
- **`data:` URL modules**, **symlink/`preserveSymlinks`** — correct / deferral-bounded.
- **Loader / `module.register()`** — `nextResolve` chaining order (4-hook fixture reproduces Node's
  string byte-for-byte), real module-instance realm isolation (marker-based, stripped from
  `import.meta.url`), loader-provided CJS named exports, `ERR_REQUIRE_ASYNC_MODULE` /
  `ERR_LOADER_CHAIN_INCOMPLETE` boundaries. CLI `--loader` cases correctly deferred (they
  `spawnPromisified` a node binary). `loader_commonjs_source_named_exports` and
  `static_loader_absolute_entry_specifier` both passed in the live 35/35 run.
- **Anti-hack test net is real:** `tests/runtime/node_modules_apps.rs` runs each fixture under **real
  Node 22.14.0 first** (`verify_with_node` asserts exit 0), then the same self-asserting fixture must
  return `PASS:` in the runtime. Expected values are therefore Node-validated, not hand-authored — so
  the residual risk is *weak assertions / coverage gaps*, not fabricated baselines.

---

## 3. Findings (severity-ordered)

Classification key — **SP** = same-process module-compat bug (in scope); **AD** = accepted deferral.
All findings below are **SP** unless noted.

### F1 — Export-star reexport detection is a fixture-shape hack (Rust) — HIGH

- **Where:** `crates/wasm-rquickjs/skeleton/src/internal.rs:5287-5312` (`parse_export_star_callee`,
  inside `parse_export_star_reexport`).
- **What:** the member form `recv.__exportStar(...)` / `recv.__export(...)` is rejected for any
  receiver (line 5289 `previous_significant_byte(...) == Some(b'.')`) and then re-accepted **only** when
  the receiver is the literal identifier `tslib` (lines 5298-5310).
- **Why it's wrong:** Node's `cjs-module-lexer` keys on the **method name** (`__export`/`__exportStar`)
  and accepts **any** receiver. The canonical TypeScript `--importHelpers` emit is
  `tslib_1.__exportStar(require("./x"), exports)` (a numbered import binding), which the runtime
  silently drops.

  | input | Node 22.14.0 | Rust |
  |---|---|---|
  | `tslib_1.__exportStar(require("./o"), exports)` (real tsc emit) | `alpha,beta` | **∅** |
  | `helper.__exportStar(require("./o"), exports)` (any receiver) | `alpha,beta` | **∅** |
  | `a.b.__exportStar(require("./o"), exports)` | `alpha,beta` | **∅** |
  | `tslib.__exportStar(...)` (the vendored fixture spelling) | `alpha,beta` | `alpha,beta` |

- **Effect:** `import { x } from 'barrel-pkg'` throws `SyntaxError: … does not provide an export named
  'x'` for the large class of published CJS packages compiled with `importHelpers: true`. The `tslib`
  literal matches the test fixture and essentially no real-world code.
- **Proof it's realized (no wasm build needed):** the repo's own unit test
  `detects_only_documented_export_star_helper_reexports` (`internal.rs:8835-8848`) **asserts the buggy
  behavior** — its second block expects `helper.__export(require("./dep-b.cjs"), exports)` to yield an
  **empty** reexport set, whereas Node detects it.
- **Repro (maintainer):**
  ```sh
  # Node baseline — proves the correct behavior:
  mkdir -p t && cd t && printf 'exports.alpha=1;exports.beta=2;\n' > o.cjs
  printf '"use strict";var tslib_1=require("./o.cjs");tslib_1.__exportStar(require("./o.cjs"),exports);\n' > b.cjs
  printf 'import * as ns from "./b.cjs";console.log(Object.keys(ns));\n' > r.mjs
  node r.mjs      # -> [ 'alpha', 'beta' ]  (runtime analyzer yields none)
  # Repo proof — flip the second assert_analysis in internal.rs:8835 to expect
  # &["./dep-b.cjs"] and add helper.__exportStar(...); the analyzer test now fails.
  ```
- **Fix:** in `parse_export_star_callee`, match `__export`/`__exportStar` as a maximal identifier token
  keyed only on the method name, **regardless of a preceding `.` and regardless of receiver depth**;
  delete the `member_access` rejection and the `tslib`-literal special case. Keep the
  identifier-boundary check (so `__exportStarX`/`foo__exportStar` still don't match) and the top-level
  `brace_depth==0` gate (`internal.rs:6227`), which already match Node. Then fix the fixture test to the
  Node-correct expectation.

### F2 — JS loader scanner has no export-star handling at all — HIGH (loader path) / MED overall

- **Where:** `crates/wasm-rquickjs/skeleton/src/builtin/module.js:3938-3986` (`addLoaderCjsNames`).
  `grep -nE '__export|__exportStar|exportStar'` over `module.js` → **zero matches**.
- **What:** CJS source delivered via a `module.register()` load hook under-detects **every** export-star
  reexport — the bare `__export(require("./x"))` / `__exportStar(require("./x"), exports)` forms
  (default tsc **without** importHelpers) **and** the member/tslib forms. Strictly worse than the Rust
  side (which at least handles the bare + `tslib` forms).
- **Effect:** a `module.register` loader returning `{ format: 'commonjs', source }` for any tsc/tslib
  barrel exposes none of its re-exported names.
- **Fix:** add `readLoaderExportStar(source, pos)` mirroring the corrected Rust function, called under
  the `braceDepth === 0` guard in `addLoaderCjsNames` alongside `readLoaderModuleExportsRequire`, feeding
  the reexport-resolution path at `module.js:3977-3982`.

### F3 — `import.meta.resolve` uses a third, naive resolver that ignores `exports`/node_modules — MED

- **Where:** `crates/wasm-rquickjs/skeleton/src/builtin/mod.rs:546-607`
  (`IMPORT_META_RESOLVE_JS` / `__wasm_rquickjs_import_meta_resolve`), wired at `internal.rs:7139`.
- **What:** this standalone JS resolver handles only absolute URLs, `node:`, `/abs`, `./rel`, builtin
  names, and bare specifiers **ending in `/`** (naive `node_modules/<x>/`). It never consults
  package.json `exports`/`imports`/`main`/conditions or performs node_modules package resolution.
- **Verified vs Node (fixture: `node_modules/pkg` with `exports: { "./valid": "./ok.js" }`):**

  | call | Node 22.14.0 | Runtime |
  |---|---|---|
  | `import.meta.resolve('pkg/valid')` | `file://…/node_modules/pkg/ok.js` | **throws `ERR_MODULE_NOT_FOUND`** (mod.rs:606) |
  | `import.meta.resolve('pkg/')` | `ERR_PACKAGE_PATH_NOT_EXPORTED` | **bogus `file://…/node_modules/pkg/`** (mod.rs:600-604) |

  Both `import 'pkg/valid'` (Rust `NodeModulesResolver`) and `require.resolve('pkg/valid')` (JS
  `resolveFromNodeModules`) resolve `pkg/valid` correctly — so `import.meta.resolve` is asymmetric with
  **both** existing resolvers.
- **Note:** `docs/module-compat-status.md:1547-1551` frames `import.meta.resolve` coverage narrowly
  (missing-package codes, parent URLs, trailing slash) and omits successful bare-package/`exports`
  resolution; the only documented deferral there is spawned-CLI, so this is **not** an accepted deferral.
- **Fix:** route `import.meta.resolve` through the shared ESM resolver (the Rust `NodeModulesResolver`)
  rather than the standalone JS function, so `exports`/`imports`/conditions/node_modules are honored.

### F4 — Rust syntax scanner doesn't parse template `${}` ⇒ nested-template misclassification (Rust vs JS split) — MED

- **Where:** `internal.rs:6827-6842` (backtick handled like a flat `'…'` string in
  `source_has_top_level_await`; same flatness in `skip_string_or_template` ~`4739`). The JS side
  descends correctly (`module.js:2300` `skipTemplateExpression`).
- **What:** on a **nested** template, Rust's backtick pairing desyncs and inner template text is scanned
  as code:

  | input | Rust | JS | Node |
  |---|---|---|---|
  | `` const h=`<p>${`please await approval`}</p>`; module.exports=h; `` | **ESM** | CJS | CJS |
  | `` const t=`a${`b${import.meta.url}`}c`; `` | **ESM** | CJS | ESM |

- **Why it matters:** Rust's `has_esm_syntax` runs **eagerly and unconditionally** on the import path
  (`internal.rs:6442-6446`), so a nested-template CJS file gets misclassified as ESM → `module`/`exports`
  undefined → breaks. The same file `require()`d works (JS lazy path descends correctly) — a genuine
  import-vs-require split, and Rust also disagrees with Node.
- **Fix:** make the Rust template skip parse `${…}` recursively (reuse the brace-depth scanner) in both
  `source_has_top_level_await` and `skip_string_or_template`.

### F5 — `await`/`import`/`export` as identifier or property ⇒ false-positive ESM (both scanners) — MED-LOW

- **Where:** `internal.rs:6862` returns `true` on a bare `await` token with no preceding-token check;
  JS has the same gap (`module.js:2642`).
- **What:**

  | input | Node | Rust / JS |
  |---|---|---|
  | `module.exports = { await: function(){} };` | CJS | **ESM** |
  | `exports.await = function(){};` | CJS | **ESM** |
  | `const await = 1;` | CJS | **ESM** |
  | `globalThis.y = obj.await;` | CJS | **ESM** |

- **Why it matters:** `await` (also `import`/`export`) is a legal property/identifier in sloppy-mode CJS.
  Reachable eagerly on the import path (`internal.rs:6442`) → misclassified CJS breaks; works on the lazy
  require path → another import-vs-require split. Node's real parser never false-positives here.
- **Fix:** require `await`/`import`/`export` to be in statement/expression position — reject when the
  previous significant char is `.` (member) or the token is an object-literal key (followed by `:`), or a
  binding name.

### F6 — Resolver error-message text has drifted (Rust vs JS vs Node) — LOW

- **Where:** `internal.rs:4414-4488` (`throw_node_package_resolve_error`) vs `module.js:825-869`
  (`makePackagePathNotExportedError` / `makeInvalidPackageTargetError` / `makePackageImportNotDefinedError`).
- **What (verified against Node 22.14.0):** the same failing resolve yields different message text under
  `import` vs `require`, and each matches Node on a *different* subset:
  - `ERR_PACKAGE_PATH_NOT_EXPORTED`: Node & Rust use **single** quotes `'./x'`; **JS uses
    `JSON.stringify` → double quotes** `"./x"`.
  - `ERR_INVALID_PACKAGE_TARGET`: Node & JS use **double** quotes `"tgt"`; **Rust uses single** `'tgt'`.
  - Both omit the `package.json` path and the `imported from …` / `main` / `defined in the package
    config …` context Node includes.
- **Severity:** LOW — all error **codes** are correct; only message text differs. But it is a realized
  instance of the dual-impl drift.
- **Fix:** align both factories to Node's exact text (single quotes for subpath/specifier, double for
  target; include the package.json path + `imported from`).

### F7 — Low-severity edge divergences (batch)

- **F7a** `#foo/` (trailing-slash imports specifier): both impls skip Node's up-front `endsWith('/')`
  check (`internal.rs:3545-3552`, `module.js:849-853`) → return `ERR_PACKAGE_IMPORT_NOT_DEFINED` where
  Node gives `ERR_INVALID_MODULE_SPECIFIER`.
- **F7b** `#` / `#/` validation runs **after** the `imports`-presence check (`internal.rs:3447-3452`,
  `module.js:1333-1336`) → wrong code for a package with no `imports`.
- **F7c** CJS `require('#foo')` with no `imports` field → `ERR_PACKAGE_IMPORT_NOT_DEFINED` where Node
  gives `MODULE_NOT_FOUND` (`module.js:5250-5262`). (Rust/ESM side is correct.)
- **F7d** Rust **double-decodes** package-target segments (`decode_package_target_path` `internal.rs:3969`
  then `is_invalid_package_target_segment` `internal.rs:4211-4217`): a double-percent-encoded target
  (`"./%252e%252e/main.mjs"`) `require`-resolves (JS, correct) but `import`-rejects (Rust) — Rust-vs-JS
  and Rust-vs-Node disagreement. Exotic input.
- **F7e** `DEP0166` (leading/trailing-slash target) deprecation warning not emitted by either impl
  (`internal.rs:4287`, `module.js:968`) — resolution result correct, warning missing.
- **F7f** `createRequire(import.meta.url)` sets `require.main` to a synthetic root (`module.js:5395`);
  Node returns `undefined` when there is no CJS main entry. Cosmetic.
- **F7g** `for await (…)` at top level → both over-detect as ESM; Node treats as CJS (throws in CJS parse,
  no ESM retry). Edge.
- **F7h** Loader **load**-hook `context.conditions` is populated with the full array (`module.js:5809`,
  `6011`); Node passes `undefined` to the *load* hook (resolve-hook conditions are correct:
  `['node','import','module-sync','node-addons']`).
- **F7i** Rust export-star **over-detects** on liberal spacing at the call joints — `__exportStar (require(…`
  and `__exportStar( require(…` are accepted where Node requires no whitespace/comment between callee→`(`
  and `(`→`require`. Harmless in practice; note only.

---

## 4. Performance

Positives verified: package.json **positive** parse-caching works and persists on both sides
(`packageJsonParseCache` `module.js:597`; `PACKAGE_JSON_CACHE` thread-local `internal.rs:3044`); the JS
`require()` path is lazy (compiles CJS first, scans only on `SyntaxError` — **zero** full scans for
normal CJS); the "avoid allocation" commits under review do what they claim (const-generic stack arrays,
integer-return getter parsing).

- **P1 — negative package.json lookups are never cached (both sides), MED.** `readPackageJson`
  (`module.js:604`) returns `null` without caching the miss; `read_package_json_optional`
  (`internal.rs:3278`) caches only the `Ok` arm. Every scope walk (`getPackageScopeInfo`,
  `findPackageScope`, `package_scope_info`) climbs to the fs root re-issuing an ENOENT read on each
  ancestor without a `package.json`, on every require/import. Node's `packageJsonCache` caches misses.
  *Fix:* store a negative sentinel; have `getPackageScopeInfo` consult `packageScopeCache`.
- **P2 — ESM-import-of-CJS runs ~6 independent full-source passes, MED-LOW.** `CjsCompatLoader::load`
  (`internal.rs:6442-6473`): four detection predicates (`source_has_static_import_or_export`,
  `source_has_import_meta`, `source_has_top_level_await`, `has_cjs_wrapper_lexical_redeclaration`) then
  `statement_starts` + the analyzer pass. Bounded to the import path. *Fix (optional):* fuse the four
  predicates into one `scan_code_positions` pass recording all booleans.
- **P3 — require()-of-ESM graph pre-scan rebuilds its cache per call, MED-LOW.** `markRequireEsmGraph`
  (`module.js:4400-4406`) builds a fresh `fileInfoCache` each call; nothing reused across separate
  require-of-ESM calls. Gated to the interop scenario. *Fix (optional):* promote to a module-level cache
  invalidated like `moduleCache`.

---

## 5. Known-gap classification & report integrity — substantially honest

- Numbers reproduce exactly (§2). No same-process resolver/bridge/lexer/package-map/condition/
  detect-module bug is hidden in a percentage-excluded bucket.
- **A1 — inaccurate reason on `es-module/test-esm-snapshot.mjs` (`config.jsonc:6083`), LOW.** The reason
  ("V8 startup snapshot … cache coupling") is wrong: the fixture has no snapshot. It tests genuine
  same-process CJS/ESM interop — a CJS module sets `module.exports = 1`, a mutator does
  `require.cache[path].exports++` (→2), and Node still binds the ESM `import one` default to **1** (the
  default binding snapshots `module.exports` at interop-creation time). It is correctly counted as a
  *failing* known-gap (does **not** inflate 73.3%), but it is a real same-process gap **mislabeled as an
  accepted deferral** — so "all remaining module known-gaps are accepted deferrals" is slightly false for
  this one entry. *Fix:* correct the reason; decide whether the binding-timing case is worth implementing
  (obscure).
- **A2 — split-subtest completeness guarded only by a warning, LOW.** `node_compat.rs:611` `eprintln!`s
  on a config-vs-discovered subtest count mismatch rather than asserting. End-truncation of a failing
  subtest list would be undetectable. Currently **unexploited** — all 589 split files have contiguous
  `0..max` index sets. *Fix:* promote the warning to a hard assertion.
- **A3 — one module-ish file entirely unlisted:** `parallel/test-vm-module-referrer-realm.mjs` (a
  `vm.SourceTextModule`/realm engine test) is not run or reported — an accepted `vm`/engine deferral, but
  it should be explicitly classified rather than silently absent.
- Dangling config keys (4, all HTTP/non-module) for removed suite files are kept as `known-gap` rather
  than silently deleted — the opposite of removal-gaming. Reassuring.

---

## 6. Root cause & the single highest-leverage fix

Every F1–F6 finding is an instance of the same structural issue: **the resolver, CJS named-export
analysis, and module-kind detection each exist as two hand-written implementations** (Rust for `import`,
JS for `require`/loader), plus a **third** naive resolver for `import.meta.resolve`. The
`node_modules_apps` harness validates each path against Node *independently* (require-fixtures exercise
the JS path, import-fixtures the Rust path), so drift-from-Node is caught only for shapes a fixture
happens to cover — the drift risk is really a **coverage-gap** risk, and it has already produced F1/F2
(export-star split), F4 (template split), F6 (error-text split), F7d (double-decode split), and F3
(import.meta.resolve asymmetry).

**Recommended (single highest-leverage) addition:** a **cross-path parity test** that feeds one shared
fixture set through *both* the runtime's `require()` and `import` entry points (and, where applicable,
`require.resolve` vs `import.meta.resolve`) and asserts equal exports/resolution. It would have caught
F1, F2, F4, F6, F7d and F3, and it prevents future divergence cheaply. No rewrite is required or
recommended — keeping the two engines is fine; only the missing equality check is the gap.

---

## 7. Residual risks

1. No cross-path parity test (above) — the structural driver of most findings.
2. Weak-assertion risk in `node_modules_apps`: fixtures are Node-validated, but a fixture whose
   assertions don't tightly pin the interesting behavior can pass on both Node and a subtly-wrong runtime.
   Export-star barrels and `import.meta.resolve` are the current examples of shapes no fixture pins.
3. `docs/module-compat-status.md:237/246` claims the Rust analyzer "matches Node 22.14.0 and the JS
   loader scanner" — overstated given F1/F2 (that file is untracked/out of scope, but the claim is
   inaccurate and should be corrected alongside the fix).

---

## Appendix A — Export-star grammar & fix spec

Node grammar (from the `cjs-module-lexer` README, confirmed empirically):
`(__export | __exportStar) ( require ( STRING_LITERAL …` — callee matched as a maximal identifier token
**keyed only on the method name**; receiver and receiver-depth irrelevant; top-level only; the two call
joints (callee→`(`, `(`→`require`) admit no whitespace/comment.

| # | Shape | Node | Rust | JS-loader | Fix target |
|---|-------|------|------|-----------|------------|
| 1 | `__export(require("x"))` | ✅ | ✅ | ❌ | F2 |
| 2 | `__exportStar(require("x"), exports)` | ✅ | ✅ | ❌ | F2 |
| 3 | `tslib_1.__exportStar(require("x"), exports)` (real tsc) | ✅ | ❌ | ❌ | **F1**, F2 |
| 4 | `tslib.__exportStar(...)` | ✅ | ✅ | ❌ | F2 |
| 5 | `<anyIdent>.__exportStar(...)` | ✅ | ❌ | ❌ | **F1**, F2 |
| 6 | `a.b.__exportStar(...)` deep receiver | ✅ | ❌ | ❌ | **F1**, F2 |
| 7 | `(0, tslib_1.__exportStar)(...)` | ❌ | ❌ | ❌ | leave (Node agrees) |
| 9 | `tslib.__exportStar(require("x"))` 1-arg | ✅ | ✅ | ❌ | F2 |
| 10 | `__exportStar(require("x").foo, exports)` | ✅ | ❌ | ❌ | exotic |
| 15/16 | space at call joints | ❌ | ✅ over | ❌ | F7i (low) |

Fix: (1) Rust `parse_export_star_callee` — match `__export`/`__exportStar` by method name regardless of
`.`-prefix and receiver depth; delete the `tslib` literal; keep identifier boundaries + top-level gate.
(2) JS loader — add the mirror function. Outside export-star, **no analyzer change is needed** (Appendix B).

## Appendix B — Non-export-star analyzer parity (all match Node 22.14.0, both engines)

`module.exports = { a, b }` → `[a,b]`; string-key ident-value → keep; numeric/computed key → bail;
method shorthand → keep; numeric/other non-ident value → bail (after adding prior idents); member value
→ add then bail; spread non-require → `[]`; `{ a, ...require("y") }` → `[a]` + reexport y;
`Object.assign(exports,{…})` → `[]` (Node declines; runtime declines); `Object.defineProperty` value →
keep; `{get:function(){…}}` / `{get(){…}}` / named getter → keep; arrow getter → reject; getter return
member / bracket-string → keep; bracket-identifier / deep member / throw → reject; `enumerable:false` →
reject; `enumerable` after `get` → bail (Node quirk, matched); interleaved / `module.exports.x` /
computed-string / `"a-b"` dash-name / numeric-computed `exports.x`; `module.exports=require("y");
module.exports.b=2` → reexport cleared + re-added; `Object.keys(_x).forEach(k=>exports[k]=_x[k])` (arrow
& function) → reexport `_x`. **No new over/under-detection found.**

## Appendix C — Condition sets (verified correct; order irrelevant)

- ESM/import (Rust `ESM_CONDITIONS` `internal.rs:3076`; JS `esmDefaultPackageConditions` `module.js:790`):
  `[golem, node, module-sync, import, default]`.
- CJS/require (Rust CjsAnalysis `internal.rs:3078`; JS `cjsDefaultPackageConditions` `module.js:789`):
  `[golem, node, require, module-sync, default]`.
- Loader hook (`loaderDefaultConditions` `module.js:791`): `[node, import, module-sync, node-addons]`.

`golem` is the intended custom condition. Membership is correct (require has `require` not `import`;
import has `import` not `require`; both carry `module-sync` for Node 22 sync-ESM). Array *order* does not
affect resolution — Node and both engines iterate package.json key order and test set membership.

## Appendix D — Reproduction commands

```sh
# Independent suite re-run
PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH" \
  cargo test --test runtime --features use-golem-wasmtime -- module_resolution --report-time

# Report numbers
cargo test --test node_compat_report --features use-golem-wasmtime -- --nocapture

# F1 (export-star) Node baseline: see §F1.
# F3 (import.meta.resolve): node_modules/pkg with exports {"./valid":"./ok.js"}, then
#   node --input-type=module -e 'console.log(import.meta.resolve("pkg/valid"))'  # resolves; runtime throws
# F4/F5 (module-kind): put the shape in a no-"type" package .js and observe ESM-vs-CJS load.
```

# Node.js target selection (NJ-01, GOL-1946)

**Status:** Node.js 26.13.1 with npm 11.20.0 is the selected target for NJ-02 (GOL-1947),
compared against Node.js 24.22.3. The harness, CI and runtime remain pinned to 22.14.0 until
NJ-02 switches them. This record is a qualification result, not implemented runtime support.
The runtime still reports `process.version` `v22.0.0`.

Qualified on 11 November 2026 against `golemcloud/wasm-rquickjs`
`21a6c10b4c871bf1c686ce7584ade770991e79ed` on the P2 Golem Wasmtime fork lane
(`tools/dev-test.sh p2 fast-run`), then the default generation target. After P2 generation
was removed, the component checks were rerun on 12 November 2026 on the
surviving P3 path: stock Wasmtime 50.0.1 at the removal commit
`e6782e4d4711c143ae0a668f1f03effb12d34769`, with the same vendored suites, configs and scratch
shim. Tables show the P3 results; [P3 requalification](#p3-requalification) lists every
difference from the historical P2 results. All vendored tests are unmodified.

## Pins and provenance

| | Selected | Comparator | Current baseline |
| --- | --- | --- | --- |
| Node.js | 26.13.1 "Lithium" | 24.22.3 "Krypton" | 22.14.0 "Jod" |
| Release date | 2026-11-10 (security release) | 2026-11-10 (security release) | 2025-02-11 |
| Bundled npm | 11.20.0 | 11.19.1 | 10.9.2 |
| `process.versions.modules` | 147 | 137 | 127 |
| Tag commit (`nodejs/node`) | `e9c277643b0249c50f6e6de5413be8a88ea11b6a` | `e63cab040c09d43ceef8cb35508c40044614e906` | `5d2feb257bcee090e57900eb51720171a6aa92f3` |
| `node-v*-linux-x64.tar.xz` SHA-256 | `5c063e46bab0fbc1c17cc445d7ff129cbdcd0471be6ed83b6ab864f8143bc864` | `4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb` | `69b09dba5c8dcb05c4e4273a4340db1005abeafe3927efda2bc5b249e80437ec` |
| `node-v*.tar.gz` (source) SHA-256 | `60c6cdf11c3e9d5932fccd0eafae77f1152661584e129047684cb8646f228d3e` | `4690edccae352134bbe31d844b37898f2a28b2c3d67901d0112fb6c4996d556a` | `6c4e31ed5702dc45cfd8c435af56a36a474427e1bd7afe74c346136060beba8a` |
| Active LTS from | 2026-10-28 | 2025-10-28 | 2024-10-29 |
| Maintenance from | 2027-10-20 | 2026-10-20 | 2025-10-21 |
| End of life | 2029-04-30 | 2028-04-30 | 2027-04-30 |

Sources were read on 11 November 2026: <https://nodejs.org/dist/index.json>,
`https://nodejs.org/dist/v<version>/SHASUMS256.txt`, and
<https://raw.githubusercontent.com/nodejs/Release/main/schedule.json>. Each `SHASUMS256.txt.asc`
verified with a good signature against <https://github.com/nodejs/release-keys>. 26.13.1 and
24.22.3 were signed by key `5BE8A3F6C8A5C01D106C0AD820B1A390B168D356`, and 22.14.0 by
`C0D6248439F1D5604AAFFB4021D900FFDB233756`.

The compatibility-test source is `nodejs/node` at tag `v26.13.1`, vendored by
`./tests/node_compat/vendor.sh 26.13.1`. The API inventory sources are the release's
`docs/api/all.json` and the pinned binary's own `require('node:module').builtinModules` and
exports.

The measured pins are exactly Node.js 26.13.1 with npm 11.20.0, against the 24.22.3 comparator.
Moving to a different 26.x patch is a separate decision outside this qualification. Record it with
the same provenance, re-vendor, and requalify it by rerunning the mapping below, because a patch
change can move tests.

## Baseline

On 22.14.0, P3 `node_compat` passed 3257 runnable cases, failed 0 and ignored 3654, plus 34
harness unit tests. Wall time was 9 min 19 s at 12 test threads. This matches the `report.md`
primary count of 3257/4451. The historical P2 run had the same 3257/0/3654, plus 2 P2-only
harness unit tests, in 10 min 38 s.

## Measured differences

Each target used the same runtime build. The steps were:

1. Vendor the target suite.
2. Set `nodeVersion`.
3. Run the stock `migrate_config_split` tool.
4. Reapply each original 22.14.0 category by exact entry and subtest name; the tool itself
   drops them (see harness work).
5. Run the full suite.

The second set of target columns also adds the missing `test/common` helpers to a scratch copy of
the shim.

### Suite inventory

| | 22.14.0 | 24.22.3 | 26.13.1 |
| --- | --- | --- | --- |
| Vendored `.js`/`.mjs` files (parallel, sequential, es-module) | 3910 | 5013 | 5442 |
| Config files missing from the target suite | — | 70 | 110 |
| Config files byte-identical / modified | — | 2272 / 1507 | 2179 / 1560 |
| New files that `migrate_config_split` adds (`.js` only) | — | 738 | 1108 |
| Unlisted `.mjs` files the tool ignores | — | 496 | 595 |
| Files the stock tool newly splits / re-splits / unsplits | — | 40 / 82 / 5 | 40 / 87 / 6 |

### Baseline-case mapping (3257 cases passing on 22.14.0)

| Disposition | 24.22.3 | 26.13.1 |
| --- | --- | --- |
| exact-pass: same test name passes | 2813 | 2731 |
| resplit-pass / split-all-pass: renamed by index or newly split, all pass | 52 | 60 |
| exact-fail / resplit-fail / split-some-fail / unsplit-fail | 270 | 280 |
| now-ignored: the file now uses `--expose-internals` | 38 | 38 |
| renamed-unmapped: subtest renamed beyond an index shift, needs review | 53 | 63 |
| removed: file removed or moved upstream | 31 | 85 |

Without the shim helpers (historical P2 only; not rerun on P3), 26.13.1 had 2673 exact passes
and 259 exact failures. 102 of those
failures threw at a missing `test/common` helper: `hasFIPS()` (90), `skipIfSQLiteMissing()` (10),
`expectRequiredTLAError()` (1) and `skipIfPerfettoEnabled()` (1). Adding the helpers recovered 57
exact passes; the remaining cases then reached real runtime gaps.

Comparing per case:

| | Cases |
| --- | --- |
| Needs work on both 24.22.3 and 26.13.1 | 391 (257 failing, in 106 files) |
| Needs work only on 26.13.1 | 75 |
| Needs work only on 24.22.3 | 1 (renamed-unmapped) |

The 75 Node 26-only cases break down as follows:

- 30 cover APIs that reached end of life after Node 24 and are target-semantics changes, not lost
  coverage: `assert.CallTracker` (10), multi-argument `assert.fail` (5), `fs.rmdir` with
  `recursive` (10), keygen `hash`/`mgf1Hash` (2), dgram deprecations (1), FileHandle close on GC
  (1), and `_stream_*` aliases (1).
- 11 are `test-trace-events-*` tests that moved to `test/trace_events/`, which is not vendored.
- 3 are sqlite tests renamed by "sqlite: rename DatabaseSync and StatementSync" (`f2b698f1cf`).
- 8 are renamed-unmapped.
- 23 are failing cases in 20 files: stream 6, crypto/webcrypto 6, buffer 2, sqlite 2, and one each
  for assert, `c-ares`, http, net, test_runner, url and util. Stream examples are
  `test-stream-push-strings`, `test-stream-readable-infinite-read`, `test-stream-typedarray` and
  `test-stream-uint8array`. The webcrypto failures are four `getRandomValues` cases that expect a
  `TypeError`, not a `DOMException`.

The full per-case table is in [`target-mapping-22.14.0.json`](target-mapping-22.14.0.json).

### P3 requalification

The P3 reruns used the same vendored suites, migrated configs and scratch shim helpers as the P2
runs, 12 test threads, and stock Wasmtime 50.0.1:

| Run | Historical P2 (fork) | P3 (stock) |
| --- | --- | --- |
| 22.14.0 baseline | 3257 passed, 0 failed, 3654 ignored | 3257 passed, 0 failed, 3654 ignored |
| 24.22.3 with shim helpers | 3016 passed, 467 failed, 4468 ignored | 3014 passed, 467 failed, 4468 ignored |
| 26.13.1 with shim helpers | 2961 passed, 503 failed, 4812 ignored | 2959 passed, 503 failed, 4812 ignored |

Each pass total includes the harness unit tests; the 2 fewer passes on P3 are the 2 P2-only
harness unit tests. Only two generated cases changed status, the same two on both targets:

- `parallel/test-cli-eval.js` block_02 (a 22.14.0 baseline case) fails on P2 and passes on P3.
  This moves it from exact-fail to exact-pass on both targets and out of the mapping file.
- `parallel/test-fs-syncwritestream.js` passes on P2 and fails on P3 with
  `Requested stdio configuration is not supported` from `child_process.spawn`. It was skipped
  on 22.14.0, so it is not a baseline case; on the targets it is an unevaluated new failure.

All other dispositions and every Node 26-only and Node 24-only case are identical. The
unshimmed 26.13.1 run and the in-runtime API surface probe were not rerun on P3, so the runtime
columns of the API table remain P2 evidence.

### Public API surface

Introspection of the pinned host binaries counts builtin exports, class members and globals.
The same probe ran inside the 22.14.0-pinned runtime (historical P2 lane).

| | 24.22.3 | 26.13.1 | 26.13.1 relative to 24.22.3 |
| --- | --- | --- | --- |
| Identifiers added since 22.14.0 | 344 | 484 | +142 |
| Of those, absent from the runtime | 315 | 454 | +141 |
| Identifiers removed since 22.14.0 | 64 | 241 | 179 removed |
| Of those, still exposed by the runtime | 38 | 88 | 50 |

The 141 Node 26-only additions missing from the runtime are:

| API | Identifiers | Classification |
| --- | --- | --- |
| `node:ffi` | 46 | WASI-impossible |
| sqlite `Database`/`Statement` and statement stats | 36 | Mostly aliases of the existing `*Sync` classes |
| zlib zip archive API | 18 | |
| `diagnostics_channel` `BoundedChannel` | 8 | |
| http header validators and WebSocket mask helpers | 6 | |
| Globals `Temporal`, `localStorage`/`sessionStorage`/`Storage` and `QuotaExceededError` | 5 | `Temporal` depends on the engine |
| `fs.Stats` `*Instant` and `fs.openAsBlobSync` | 5 | |
| Other | 17 | |

The 50 Node 26 removals the runtime still exposes are `_stream_*` modules,
`assert.CallTracker`, `buffer.SlowBuffer`, `fs.ReadStream#open`/`WriteStream#open` and dgram
internals. Documentation inventories from `docs/api/all.json` held 4042, 4663 and 4695 entries.
They are name-level only, and presence is not behavior.

### Package engines and fixtures

| | 22.14.0 | 24.22.3 | 26.13.1 |
| --- | --- | --- | --- |
| Packages (of 1694 with `engines.node`, across 211 lockfiles) whose range excludes the version | 2 | 2 | 5 |
| node_modules_apps host-only verification | 54/54 | 52/54 | 52/54 |

The packages excluding 26.13.1 are `better-sqlite3@12.6.2` and `@12.8.0`, `dd-trace@5.91.0` (`<26`),
`@azure/msal-node@1.18.4`, and the `agentic_ts` self-pin. The two node_modules_apps failures are
the same `module-interop` cjs-lexer parity fixtures on both 24.22.3 and 26.13.1.

### npm 10.9.2 against npm 11.20.0

| | npm 10.9.2 (current) | npm 11.20.0 (selected) |
| --- | --- | --- |
| `engines.node` | `^18.17.0 \|\| >=20.5.0` | `^20.17.0 \|\| >=22.9.0` |
| Tool tree SHA-256 (sorted per-file list) | `e5a198448ed88525e37c2a611ea52e4138c256e717955691028c0aafaec9f4b2` | `9826743dccdc696da8f672eae40efb2c15e1788d533fe22147e63406d91bfa38` |
| Config definitions | 155 | 181 (26 added, 0 removed) |
| Bundled `minizlib` / `tar` | 2.1.2 / 6.2.1 | 3.1.0 / 7.5.22 |

Both npm versions accept both Node versions, so all four cells are valid: Node 22.14.0 or 26.13.1,
each with npm 10.9.2 or 11.20.0. Node 22.14.0 with npm 10.9.2 is the current pair; Node 26.13.1
with npm 11.20.0 is the selected pair. Comparing npm versions on the same Node binary isolates
npm effects, and comparing Node versions with the same npm isolates Node effects. On an
unsupported Node, npm 11 warns on stderr rather than refusing to run. The added definitions include
the `allow-scripts` family, `allow-git`/`allow-file`/`allow-remote`/`allow-directory` (default
`all`) and `min-release-age` (default unset). `install-links` still defaults to false.

Every probe used disposable copies, an isolated `HOME`, cache, user and global npmrc, and no
credentials. Registry cases used the repository's loopback registry; the public registry was
contacted only by the `tests/libraries` installs, which read existing lockfiles.

**Component (in-runtime npm), Node 22.14.0 host:**

| Suite | Lane | npm 10.9.2 | npm 11.20.0 | Attribution |
| --- | --- | --- | --- | --- |
| `npm_compat` (24 tests) | P3 | 24/24 | 17/24 | Runtime metadata |
| `npm_compat`, scratch filter for the one engine line | P3 | — | 24/24 | — |
| `npm_compat` (24 tests) | P2, historical | 24/24 | 17/24 | Runtime metadata |
| `npm_compat`, scratch filter for the one engine line | P2, historical | — | 24/24 | — |
| `npm_metadata` release smoke, 1 iteration | P3 | pass | pass | Runtime metadata (stderr only) |
| `npm_metadata` release smoke, 1 iteration | P2, historical | pass | pass | No difference |

The npm 10.9.2 P3 `npm_compat` result is the clean runtime group-9 run, and the npm 10.9.2 P3
`npm_metadata` report is clean (`dirty: false`). The npm 11.20.0 P3 rows change only the
`NPM_BASELINE` pins; the filtered rows are scratch diagnostics, not clean passes. P3 failed the
same 7 tests as P2, with the same warning. The historical P2 `npm_metadata` smokes ran with the
filter applied.

- **`npm_compat` failures.** All 7 failing tests assert empty stderr: `npm_cli_version`,
  `npm_cli_prefix`, `npm_cli_help_and_config`, `npm_ci_local_pure_javascript`,
  `npm_install_local_pure_javascript`, `npm_exec_runs_persistent_local_bin` and
  `npx_runs_persistent_local_bin`. They fail only on
  `npm warn cli npm v11.20.0 does not support Node.js v22.0.0`. The guest reports the runtime's
  `process.version` `v22.0.0`, which is below npm 11's `>=22.9.0`. That warning is a
  runtime-metadata prerequisite, which NJ-02's `v26.13.1` alignment removes; it is not an npm
  behavior change.
- **Filtered rerun.** With a scratch filter that strips only that one line, all 24 pass, so no
  other npm 11 stderr or behavior change reaches these assertions.
  `npm_install_runs_node_lifecycle_script` does not assert stderr, so it could not detect npm 11's
  install-scripts notice. Whether that notice appears inside the component was not checked.
- **`npm_metadata` smoke.** On P3 and P2, with either npm, the host and wasm sides produced the
  same installed-tree hashes (small `90e58b4d…`, medium `ab14a1da…`). Lockfiles were unchanged,
  request counts matched (one metadata request for `view`, 2 or 16 tarballs for the seed, 0 for
  the offline timed `ci`), and no unexpected requests were made. Unfiltered on P3, npm 11 adds
  exactly 198 bytes of stderr to every wasm operation, the length of the engine-warning line;
  host stderr differs by at most 1 byte. `npm_metadata` does not assert stderr.
- **Timing.** The single wasm medium timed `ci` took 17.9 s with npm 10 and 20.6 s with npm 11 on
  P3 (19.0 s and 21.5 s on P2). That is one sample per cell, so it does not establish a
  regression.
- **zlib facade.** npm 11's `minizlib` 3.1.0 still reaches `_handle._handle`, so the
  version-scoped zlib facade in `skeleton/src/builtin/zlib.js` stays required. Its comment and the
  npm_compat README name npm 10.9.2.

**Host npm CLI (34 cases across 4 cells):** fixture `npm ci` over the 11 node_modules_apps and
`agentic_ts`, lock-only regeneration of 16 lockfiles, the npm_compat local `ci`/`run`/`exec`/`npx`
fixture, dependency selection (default, omit dev+optional, include dev), workspace
install+link, and a loopback-registry install, `ci --offline`, `view` and `exec --package`
(including `pack` file lists and integrity).

- **Shared results.** Every case exited 0 in every cell. Installed trees (439 packages for the
  node_modules_apps), workspace locks, offline `ci` (0 requests), pack output, lifecycle and `run`
  effects, the `exec` exit status 7, `npx` output and `ls` were identical.
- **Lock-only regeneration** changed 2 of 16 locks, identically in all four cells. Both are
  pre-existing drift, not npm 11: the undici-clone-policy lock's `name` and the dependency order in
  the npm_compat local-install lock.
- **npm-only differences, on both Node versions:**
  - A 4-line `npm warn install-scripts … not yet covered by allowScripts` notice for the
    `fixture-dependency` postinstall. The script still runs, with the same effect.
  - `EBADENGINE` for the `agentic_ts` `package.json` self-pin (`npm: 10.9.2`).
- **Node-only differences, with either npm:**
  - undici 8.10.2's `>=22.19.0` `EBADENGINE` warning disappears on 26.13.1.
  - The 2 `module-interop` host fixtures fail as reported above.

**Host `tests/libraries` workflow (`npm install`, `npx rollup`, bundled run) for 6 libraries:**

| Library | n22/npm10 | n22/npm11 | n26/npm10 | n26/npm11 |
| --- | --- | --- | --- | --- |
| msgpackr, lodash, express | 5/5 each | 5/5 each | 5/5 each | 5/5 each |
| bcrypt, prisma-client | 0/5 each | 0/5 each | 0/5 each | 0/5 each |
| better-sqlite3 | 0/5 | 0/5 | install fails | install fails |

- **Shared results.** Lockfiles were unchanged everywhere. Where the install completes, npm 11
  adds a 4–5-line install-scripts notice for bcrypt, better-sqlite3, prisma-client and msgpackr.
- **better-sqlite3 on Node 26** is a Node effect. 12.6.2 has no prebuilt binary for ABI 147,
  and its source build fails against the Node 26 V8 headers
  (`PropertyCallbackInfo<v8::Value>` has no `This`). With no installed `rollup`, `npx` then
  waited at its install prompt; the probe stopped it.
- **prisma-client** fails the same way under every cell, but `tests/libraries/libraries.md` marks
  it ✅ (2026-03-09). The cause was not investigated.

**Not run:** the `agentic_ts` component suite (it requires Node 22.14.0 with npm 10.9.2), a
full multi-iteration `npm_metadata` release report, public-registry metadata resolution, and
Node 24.22.3 with npm 11.19.1. The four cells already separate npm effects from Node effects, so
the 24.22.3 comparator was not needed for that.

## Required harness work for NJ-02

All of this is required for either target unless marked "26 only".

1. **Pins.** 62 lines across 26 files reference 22.14.0, npm 10.9.2, `v22.0.0` or ABI 127.
   - `.nvmrc`, `.github/workflows/ci.yaml` (2), `vendor.sh`, `config.jsonc` and `report.md`.
   - `node_compat_config_report.rs` fixtures.
   - `NODE_MODULES_APP_BASELINE_*` in `tests/runtime/node_modules_apps.rs`.
   - `NODE_BASELINE` in `tests/runtime/npm_compat.rs`.
   - `tests/npm_metadata.rs` and `run.sh`, and `tests/agentic_ts` (`package.json`, `run.sh`,
     `agentic_ts.rs`).
   - READMEs and the two skills that cite `v22.x`.
2. **`migrate_config_split`.** It preserves only `skip`/`reason`, but `config.jsonc` now
   classifies with `category` (3626 entries). A run would turn known-gap, internals and
   WASI-impossible subtests of re-split files into runnable. It also discovers only `.js`, so it
   would miss 496 (24) or 595 (26) unlisted `.mjs` files. Preserve `category`, `flaky`, `timeout` and
   the split options, and include `.mjs`.
3. **Runner.** A split entry whose file is missing is skipped with only a warning, which silently
   shrinks the denominator. Make it fail.
4. **Vendoring.** Vendor `test/sqlite/`, which `test-sqlite*.js` now load as `../sqlite/next-db.js`,
   and copy it in `setup_node_compat_test_files`. `test/sea/` and `test/trace_events/` (26 only)
   are where moved tests now live; vendor them only if those cases stay classified.
5. **Shim helpers.**
   - Both targets need `hasFIPS` and `isBoringSSL` in `common-shim/crypto.js`, plus
     `hasInspector`, `hasSQLite`, `skipIfSQLiteMissing`, `expectRequireStack`,
     `expectRequiredTLAError`, `sleepSync`, `isRiscv64` and `usesSharedLibrary`.
   - 26 only: `hasFFI`, `skipIfFFIMissing`, `hasPerfetto`, `skipIfPerfettoEnabled`/`Disabled`,
     `hasDtls`, `hasQuic`, `hasLocalStorage`, `hasTemporal`, `hasFullICU` and `hasV8Sandbox`.
   - Export them from `index.mjs` too.
6. **Mapping review.** Review the renamed-unmapped (63), now-ignored (38) and removed (85) rows
   in the mapping file. Where a subtest of an `--expose-internals` file such as
   `test-stream-finished.js` uses only public API, give it an explicit `runnable` category rather
   than losing it.
7. **npm 11 refresh.** The measurements above put the work in these places:
   - **npm pins:** `NPM_BASELINE` in `tests/runtime/npm_compat.rs`; four checks in
     `tests/npm_metadata.rs` (lines 325, 388, 939 and 2791) and `tests/npm_metadata/run.sh`; the
     `agentic_ts` `package.json` engines, `run.sh` and `agentic_ts.rs`; and the npm_compat,
     npm_metadata and agentic_ts READMEs. This overlaps item 1.
   - **Prerequisite:** the 7 `npm_compat` failures disappear only once `process.version` is at
     least `v22.9.0`, which the runtime-metadata alignment provides. Do not filter or relax the
     empty-stderr assertions to pass them.
   - **Install scripts:** decide how fixtures with install scripts handle npm 11's allowScripts
     notice. The scripts still run by default. The options are approving them in the fixture or
     accepting the notice. Either way, add a stderr expectation to
     `npm_install_runs_node_lifecycle_script` so the notice is covered.
   - **Retained reports:** regenerate the `npm_metadata` release reports and the `agentic_ts`
     baseline with the new pins. The checked-report validator requires the pinned npm and
     `dirty: false`.
   - **Version labels:** update the npm 10.9.2 references in the zlib facade comment and the
     npm_compat README. The facade stays, because npm 11's `minizlib` still uses `_handle._handle`.
   - **26 only:** `tests/libraries/better-sqlite3` pins 12.6.2, which does not build on 26.13.1.
     Bump it to a release that supports ABI 147 (not yet identified) or record the host install
     failure.

## Estimated engineering effort

These are estimates, not measurements. They assume one engineer who knows the harness and
skeleton, the single surviving P3 path, and the failure counts above. The failures were grouped
by error message but not root-caused, so the runtime ranges are wide.

| Work | Either target | Additional for 26.13.1 |
| --- | --- | --- |
| Pins, CI, docs and skills (item 1) | 0.5–1 day | — |
| `migrate_config_split`, runner and vendoring fixes (items 2–4) | 2–3 days | 0.25 day (`trace_events` decision) |
| Shim helpers (item 5) | 0.5–1 day | 0.25 day |
| Mapping review (item 6) | 2–4 days (55 renamed, 38 ignored, 41 removed) | 0.5–1 day (8 renamed, 44 removed, 30 of them EOL) |
| Runtime restoration of failing baseline cases | 10–20 days (257 cases, 106 files; crypto 71, `util.inspect` 41, sqlite 20, File/Blob 18, module/esm 15, fs 15) | 2–5 days (23 cases, 20 files) |
| npm 11 fixture refresh (item 7) | 1–2.25 days (was 2–5 days, unmeasured) | 0–0.25 day (better-sqlite3 fixture) |
| Runtime metadata alignment | 0.5 day | — |
| **Total** | **≈16.5–32 days** | **≈3–7 days, about 18–21% more** |

The npm 11 range covers about 0.25–0.5 day for pins and labels, 0.25 day for the allowScripts
decision and stderr expectation, 0.25–1 day to regenerate the `npm_metadata` and `agentic_ts`
reports, and 0.25–0.5 day for whatever the unrun `agentic_ts` component suite exposes. The
measured npm 11 differences were stderr notices only, on both P2 and P3.

The 141 Node 26-only API additions are not part of restoring the baseline. They become chart
rows and improvement-campaign work; `node:ffi` (46) is WASI-impossible. Mapping the sqlite
`Database`/`Statement` aliases would take about 1–2 more days if it is wanted early.

Main uncertainties:

- A single shared root cause, such as a crypto key-export path, could shrink the crypto range
  considerably.
- npm 11 inside the component was exercised with `npm_compat` and a one-iteration
  `npm_metadata` smoke, on P3 and P2. `agentic_ts` and the full `npm_metadata` timings were not
  run.
- P3 reproduced the P2 failure counts within two cases, so the lane change does not move these
  estimates. P3 adds one `child_process` stdio gap in a case outside the baseline.

No material blocker to Node 26 was found. Its incremental cost is small next to the shared switch
cost, and it adds one year of support (end of life 2029-04-30 against 2028-04-30).

## Implementer instructions

1. Create a fresh worktree, run `./tests/node_compat/vendor.sh 26.13.1`, and set
   `"nodeVersion": "26.13.1"`.
2. Apply harness item 2 first, then run `cargo test --test migrate_config_split`.
3. Keep each 22.14.0 category. New files start as `unevaluated`; they are not part of the
   restored baseline.
4. Map every 22.14.0 passing case using the mapping file:
   - **exact- and resplit-**: must pass again.
   - **unsplit- and split-**: the file-level or every subtest case must pass.
   - **removed-api-eol**: record as a target-semantics change, with the upstream commit.
   - **removed-moved-or-split**: map to the replacement file, keeping the original assertions.
   - **renamed-unmapped**: map by reading both versions; never by count alone.
5. Never edit a vendored test to obtain a pass. A denominator change alone does not establish
   parity.
6. Align runtime metadata with the target:
   - `process.version` `v26.13.1`, `process.versions.node` `26.13.1`, `modules` `147`, and
     `process.config.variables.node_module_version` `147`.
   - Review `process.versions.sqlite` (upstream `common` derives `hasSQLite` from it) and
     `process.features` (26.13.1 adds `require_module`, `dtls`, `quic`, `typescript` and
     `openssl_is_boringssl`).
7. Decide whether the 50 removed identifiers the runtime still exposes stay as a documented
   superset or are removed.
8. Switch the npm pins with harness item 7 only after step 6, then run
   `tools/dev-test.sh stock fast-run runtime npm_compat::`. If the pins switch while
   `process.version` is still `v22.0.0`, seven tests fail on npm 11's engine warning.
9. Run the full stock runtime and `node_compat` lanes, plus the fork build and `test-other`
   lanes, following the disk ordering in `AGENTS.md`.

## Limitations

- Results are from Linux x64 at 12 test threads. The `node_compat` and `npm_compat` component
  and `npm_metadata` results are from P3 (stock Wasmtime 50.0.1); the unshimmed 26.13.1 run and
  the in-runtime API probe are historical P2 results that were not rerun.
- Each configuration ran once; timeouts in a few http/net cases may be flaky.
- Name matching does not prove assertion equality. 1560 modified files keep their names.
- No runtime changes were made, so the failures measure the restore work, not its feasibility.
- npm 11 component checks used a runtime that still reports `v22.0.0`. The npm 11 runs and both
  P2 `npm_metadata` smokes ran with scratch-only pin or filter edits, so those `npm_metadata`
  reports are marked `dirty`. `agentic_ts` ran host `npm ci` only.
- The bundled library check covered 6 of the `tests/libraries` fixtures, on the host only.
  Golem consumers were not run against either target.

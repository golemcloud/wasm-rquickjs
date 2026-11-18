# Node.js Compatibility Tests

This directory contains infrastructure for running upstream Node.js test cases
against the wasm-rquickjs runtime.

## Directory Structure

```
tests/node_compat/
├── suite/                  # Vendored Node.js test files (gitignored)
│   ├── parallel/           # ~3600 test files from test/parallel/
│   ├── sequential/         # ~120 test files from test/sequential/
│   ├── es-module/          # ~190 test files from test/es-module/
│   ├── common/             # Node.js test/common/ infrastructure
│   ├── fixtures/           # Node.js test/fixtures/ data files
│   ├── sqlite/             # Node.js test/sqlite/ helpers (next-db.js in newer releases)
│   └── NODE_VERSION        # Version string (e.g., "26.13.1")
├── common-shim/            # Our WASM-compatible shim for test/common
│   └── index.js
├── config.jsonc            # Allowlist of tests that should pass
├── vendor.sh               # Script to fetch Node.js test files
└── README.md               # This file
```

## Vendoring Tests

To fetch (or update) the vendored test suite:

```bash
# Default version (26.13.1)
./tests/node_compat/vendor.sh

# Specific version
./tests/node_compat/vendor.sh 22.16.0
```

This sparse-checkouts `test/parallel/`, `test/sequential/`, `test/es-module/`,
`test/common/`, `test/fixtures/`, and `test/sqlite/` from the Node.js repository at the
specified tag. The `suite/` directory is gitignored — each
developer runs the vendor script to populate it.

Configuration loading and report generation inspect these pinned sources to
distinguish public API coverage from tests that rely on Node.js internals. They
fail when the suite is absent, any configured entry has no vendored source, or
the vendored version differs from `config.jsonc`; this prevents missing inputs
from silently changing the compatibility totals. The runner also fails when a
split entry's subtest names differ from the names discovered in its source,
because each subtest runs by the index in its configured name.

## Migrating the Config After Re-vendoring

Keep a copy of the previously vendored suite, vendor the new version, set `nodeVersion` and run:

```bash
NODE_COMPAT_MIGRATION_PREVIOUS_SUITE=/path/to/previous/suite \
  cargo test --test migrate_config_split -- --exact migrate_config_split
```

The previous suite is required whenever the subtests of a split file changed.

The migration rewrites only entries whose subtests changed and keeps every
metadata key (`category`, `reason`, `flaky`, `timeout`, split options) of the file
and of each surviving subtest:

- An unsplit file that now has several subtests is split; each subtest inherits
  the file's metadata. An explicit `"split": false` keeps it whole.
- A subtest keeps the metadata of the previous subtest with identical source,
  even when its index, and with it a generated name such as `block_05_block_05`,
  changed. Otherwise it keeps the metadata of the previous subtest with the same
  name, or of the one with the same unique description. A new subtest starts
  `unevaluated` unless the file is already excluded from the runner.
- A changed subtest with a generated name keeps the metadata of the previous
  subtest at its position only as a proposal. The report lists every such subtest
  under `matchedByPosition`, including excluded ones, and the run fails until each
  has an accepted mapping decision (see below).
- A split file that no longer splits becomes one entry only when all its
  subtests carried identical metadata; otherwise it is left unchanged for a
  decision.
- Unlisted vendored `test-*.js` and `test-*.mjs` files are added as
  `unevaluated`.

It never deletes an entry. Configured files without a source, removed subtests,
undecided unsplits, positional subtests without an accepted decision and unused
decisions are written to `target/node-compat-migration-report.json` (override with
`NODE_COMPAT_MIGRATION_REPORT`), and the run fails until each one is mapped by
reading both versions. The tool's contract tests run with
`cargo test --test migrate_config_split -- ':tag:migration_contract'`.

### Mapping decisions for subtests matched by position

Read both versions of each subtest in `pendingPositionDecisions`, then record a
decision for it in a JSON file and rerun the migration on the same input config
with `NODE_COMPAT_MIGRATION_DECISIONS=/path/to/decisions.json`:

```json
{
  "from": "22.14.0",
  "to": "26.13.1",
  "previousConfig": {
    "revision": "<commit of the input config>",
    "path": "tests/node_compat/config.jsonc",
    "testsBlake3": "<positionInputs.testsBlake3>"
  },
  "positionDecisions": [
    {
      "file": "parallel/test-a.js",
      "subtest": "block_03_block_03",
      "previousBlake3": "<from the pending row>",
      "currentBlake3": "<from the pending row>",
      "previous": { "raw": {}, "fileEntry": {}, "effective": { "category": "runnable", "reason": null, "flaky": false } },
      "entry": { "category": "known-gap", "reason": "the new assertion needs X" },
      "assertions": "changed",
      "obligation": "baseline-gap",
      "note": "what the old and new block assert"
    }
  ]
}
```

- `from` and `to` must be the `NODE_VERSION` of the previous and current suites,
  and `testsBlake3` the hash of the input config's `tests` object that the report
  prints under `positionInputs`; otherwise the run fails before writing. A
  decisions file therefore applies only to the config it was written for: after
  changing an entry, restore that config (`revision` records where it came from)
  and rerun, rather than applying the decisions to the migrated config.
- `previousBlake3` and `currentBlake3` hash both versions of the whole test file,
  and `previous` must equal the raw entry, the file's metadata and the effective
  category, reason and flaky flag the harness gave the subtest in the previous
  suite. A changed file or a different previous classification leaves the
  subtest pending with a `stale` or `previousMismatch` problem. The hashes do not
  cover helpers the test imports or the harness itself.
- `entry` is written as the subtest's metadata. `assertions` (`kept`, `changed`,
  `moved` or `none`) and `note` record what happened to the old assertions.
- A formerly runnable subtest that no longer runs, and a former known gap that
  leaves the primary surface, need an `obligation`: `baseline-gap` (runnable to a
  known gap with a reason), `moved` with `movedTo` naming tests the runner
  selects that run or are themselves baseline gaps, or `target-change` with
  `evidence`. The runner runs a split file with subtests only as its subtests and
  any other file only as a whole, so a target is a `file#subtest` of a split file
  with subtests and otherwise the `file`; a split parent or a subtest listed
  under an unsplit file is rejected. The report lists these under `obligations` for
  review; the tool checks their shape, not whether the old assertions really are
  kept.
- Duplicate or malformed decisions fail the run; a decision that matches no
  pending subtest is listed under `unusedDecisions` and fails it. A decision for
  an excluded subtest is required too.

## Target Selection

The `node_compat` suite and the runtime's `process` version metadata target Node.js 26.13.1,
selected by NJ-01 (with npm 11.20.0) against Node.js 24.22.3. The host Node.js and npm pins of the
runtime, npm and `agentic_ts` lanes are still 22.14.0 and npm 10.9.2 until the npm refresh. The
22.14.0 baseline cases that the switch could not carry over unchanged are recorded, with their
disposition, in [`mapping-22.14.0-to-26.13.1.json`](mapping-22.14.0-to-26.13.1.json). Cases that
regressed on 26.13.1 are `known-gap` entries whose reason starts with `Node 26.13.1 baseline gap: `
and are listed in the record's `baselineGaps`. They are outstanding repairs, not accepted gaps: a
repair makes the entry `runnable` and removes it from `baselineGaps`. See
[`target-selection.md`](target-selection.md) for pin provenance, measured suite, API and
npm 10.9.2-to-11.20.0 differences, required harness changes and switching instructions, and
[`target-mapping-22.14.0.json`](target-mapping-22.14.0.json) for the mapping of every 22.14.0
passing case that does not pass unchanged on both candidates.

## Config Format

`config.jsonc` is an allowlist of tests expected to pass. Only listed tests
are run by the test harness. Each entry can include:

- `{}` — test should pass
- `{ "category": "...", "reason": "..." }` — classification; see the header of
  `config.jsonc` for the categories. Only `runnable` entries run.
- `{ "flaky": true }` — one retry (two total attempts, each with fresh runtime state)
- `{ "timeout": 300 }` — per-case timeout in seconds

Retries are bounded by test-r's native `RetryKnownFlaky(2)` policy: a passing
attempt ends the test, and two failed attempts fail it. Non-split tests use the
entry's `flaky` flag; split tests use only their own subtest's `flaky` flag.
There are no body-level or CI-wrapper retries layered on top. Each invocation
constructs a fresh `TestInstance` and temporary filesystem; only immutable
prepared components are reused.

Per-case timeouts remain inside the test body and return an error with stdout,
stderr, and host-trace diagnostics, so a known flaky case can retry a timeout.
They are not test-r harness timeouts, which are not retryable. Native CTRF output
records retry counts, flaky status, and attempt history without post-processing
the report or replacing the original failure evidence.

## Common Shim

The `common-shim/index.js` replaces Node.js's `test/common/index.js` with
WASM-appropriate stubs. Key differences:

- Platform flags are always false (we're WASM, not Linux/macOS/Windows)
- `mustCall()` / `mustCallAtLeast()` are pass-through (no `process.on('exit')`)
- `canCreateSymLink()` returns false
- Network/process-related helpers are stubbed or throw
- `common.skip()` counts as a pass, so capability flags added by newer
  `test/common` releases (`hasSQLite`, `hasInspector`, `hasFFI`, `hasFIPS()` and
  others) report what the component actually provides; `hasSQLite` probes
  `node:sqlite` instead of reading `process.versions.sqlite`. A guard must not
  skip a test whose module is available.

## How Tests Run

The node-compat-runner example (Phase 0 Step 4) compiles a single WASM component
that:

1. Reads test JS files from the WASI preopened filesystem
2. Rewrites `require('../common')` to load our shim instead
3. Executes the test via the CJS loader
4. Reports pass (clean exit) or fail (thrown error)

See `NODE_COMPAT_PLAN.md` Section 5 for the full architecture.

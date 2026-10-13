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
│   └── NODE_VERSION        # Version string (e.g., "22.14.0")
├── common-shim/            # Our WASM-compatible shim for test/common
│   └── index.js
├── config.jsonc            # Allowlist of tests that should pass
├── vendor.sh               # Script to fetch Node.js test files
└── README.md               # This file
```

## Vendoring Tests

To fetch (or update) the vendored test suite:

```bash
# Default version (22.14.0)
./tests/node_compat/vendor.sh

# Specific version
./tests/node_compat/vendor.sh 22.16.0
```

This sparse-checkouts `test/parallel/`, `test/sequential/`, `test/es-module/`,
`test/common/`, and `test/fixtures/` from the Node.js repository at the
specified tag. The `suite/` directory is gitignored — each
developer runs the vendor script to populate it.

Configuration loading and report generation inspect these pinned sources to
distinguish public API coverage from tests that rely on Node.js internals. They
fail when the suite is absent, a source required for implicit classification is
missing, or the vendored version differs from `config.jsonc`; this prevents
missing classification inputs from silently changing the compatibility totals.

## Config Format

`config.jsonc` is an allowlist of tests expected to pass. Only listed tests
are run by the test harness. Each entry can include:

- `{}` — test should pass
- `{ "flaky": true }` — one retry (two total attempts, each with fresh runtime state)
- `{ "skip": true, "reason": "..." }` — skip with explanation

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

## How Tests Run

The node-compat-runner example (Phase 0 Step 4) compiles a single WASM component
that:

1. Reads test JS files from the WASI preopened filesystem
2. Rewrites `require('../common')` to load our shim instead
3. Executes the test via the CJS loader
4. Reports pass (clean exit) or fail (thrown error)

See `NODE_COMPAT_PLAN.md` Section 5 for the full architecture.

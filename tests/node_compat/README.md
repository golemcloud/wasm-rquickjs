# Node.js Compatibility Tests

This directory contains infrastructure for running upstream Node.js test cases
against the wasm-rquickjs runtime.

## Directory Structure

```
tests/node_compat/
├── suite/                  # Vendored Node.js test files (gitignored)
│   ├── parallel/           # ~3600 test files from test/parallel/
│   ├── common/             # Node.js test/common/ infrastructure
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

This sparse-checkouts `test/parallel/` and `test/common/` from the Node.js
repository at the specified tag. The `suite/` directory is gitignored — each
developer runs the vendor script to populate it.

## Config Format

`config.jsonc` is an allowlist of tests expected to pass. Only listed tests
are run by the test harness. Each entry can include:

- `{}` — test should pass
- `{ "flaky": true }` — retry up to 3 times
- `{ "skip": true, "reason": "..." }` — skip with explanation

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

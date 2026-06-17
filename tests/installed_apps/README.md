# Installed App Compatibility Tests

This suite tests unbundled npm-installed apps with real `node_modules` attached to the component filesystem. It is intentionally separate from `tests/libraries/`, which tests Rollup-bundled package usage and records human compatibility notes in `tests/libraries/libraries.md`.

## What This Suite Covers

Use installed-app tests for:

- Node-style package resolution from a filesystem `node_modules` tree
- package `exports` / `imports`, including wildcard patterns
- CJS/ESM interop and same-process `require(esm)` behavior
- package graphs that behave differently when bundled versus installed
- small smoke tests for pure-JS packages that should run without subprocesses or live services

Do not use installed-app tests for native `.node` bindings, packages that load WASM artifacts, subprocess-heavy behavior, or live network/cloud service calls.

## Source Of Truth

`tests/installed_apps/config.jsonc` is the source of truth. Runtime tests in `tests/runtime/installed_apps.rs` are generated from this config, and `tests/installed_apps/report.md` is generated from the same config.

Each app has this shape:

```jsonc
{
  "apps": {
    "example-app": {
      "category": "runnable",
      "reason": "Short suite description",
      "tests": {
        "test-01-basic.mjs": "Coverage summary shown in the report"
      }
    }
  }
}
```

Test entries can also be objects when a per-test category, reason, or timeout is needed:

```jsonc
"test-02-edge.cjs": {
  "category": "known-gap",
  "coverage": "Coverage summary",
  "reason": "Specific gap explanation",
  "timeout": 180
}
```

Supported categories are:

| Category | Runner behavior | Report meaning |
|---|---|---|
| `runnable` | Runs in `cargo test --test runtime` | Expected to pass |
| `known-gap` | Ignored | Public behavior is in scope but missing/incomplete |
| `deferred` | Ignored | Intentionally outside this installed-app suite's current scope |

## App Directory Layout

Each app lives under `tests/installed_apps/apps/<app-name>/`:

```text
tests/installed_apps/apps/example-app/
├── package.json
├── run-node.mjs
├── test-01-basic.mjs
└── test-02-edge.cjs
```

`package.json` should pin direct dependency versions. The harness installs dependencies with:

```sh
npm install --install-links --ignore-scripts --no-audit --no-fund
```

`run-node.mjs` should import or require the requested test file, call its exported `run()` function, print the returned result, and fail if it does not start with `PASS:`.

## Test Format

Each test file must export `run()` and return a `PASS:` string:

```js
import assert from 'node:assert';

export async function run() {
  assert.strictEqual(1 + 1, 2);
  return 'PASS: basic behavior works';
}
```

CommonJS tests can use `.cjs` and `module.exports.run = ...`.

## How Runtime Tests Run

For every runnable config entry, the harness:

1. Copies the app directory to a temporary directory.
2. Runs `npm install --install-links --ignore-scripts --no-audit --no-fund`.
3. Verifies the raw app test with host Node.js: `node run-node.mjs <test-file>`.
4. Copies the installed app into the WASI preopen as `/app`.
5. Runs `examples/runtime/installed-app-runner`, which imports or requires the test from `/app` and executes it against real `/app/node_modules`.

## Commands

Run the installed-app suite after skeleton changes:

```sh
./cleanup-skeleton.sh
cargo test --test runtime --features use-golem-wasmtime -- installed_app --nocapture
```

Run a narrower filter:

```sh
cargo test --test runtime --features use-golem-wasmtime -- installed_app__module_interop --nocapture
```

Regenerate the report after `config.jsonc` changes:

```sh
cargo test --test installed_apps_report --features use-golem-wasmtime -- --nocapture
```

## Relationship To Rollup Library Tests

| Suite | Purpose | Execution |
|---|---|---|
| `tests/libraries/` | Documents package compatibility when bundled with Rollup like the Golem CLI pipeline | Manual/agent workflow using Rollup, generated wrapper crates, and `wasmtime run` |
| `tests/installed_apps/` | CI-enforced regression tests for unbundled apps with real filesystem `node_modules` | Rust runtime harness generated from `config.jsonc` |

The same npm package may be covered in both suites for different reasons. Rollup tests answer whether bundled usage works; installed-app tests answer whether Node-style installed package loading works.

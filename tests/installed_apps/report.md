# Installed App Compatibility Report

This report tracks compatibility for unbundled npm-installed apps attached to the component as a filesystem. It is intentionally separate from `tests/libraries/libraries.md`, which tests Rollup-bundled library usage.

## Scope

| Included | Deferred |
|---|---|
| Pure JavaScript packages installed with npm | Native `.node` bindings |
| `node_modules` package resolution | Packages that load WASM artifacts |
| package `exports` / `imports` | Child process execution |
| CJS/ESM interop and same-process cycles | CLI preload/eval/warning behavior |

## Apps

| App | Status | Tests | Notes |
|---|---:|---:|---|
| `module-interop` | Passing | 13/13 | Synthetic local npm packages covering module loader interop behavior. Verifies npm install with `--install-links`, Node baseline execution, then wasm-rquickjs execution from an attached `/app/node_modules` filesystem. |

## `module-interop`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-esm-import-cjs.js` | Passing | ESM app imports named/default exports from installed CJS packages, including a package reexport. |
| `test-02-cjs-require-esm.cjs` | Passing | CJS app requires an installed synchronous ESM package. |
| `test-03-package-exports-imports.js` | Passing | Conditional package `exports`, subpath exports, and package `imports` aliases. |
| `test-04-cycle-require-esm.cjs` | Passing | Installed package CJS `require(esm)` cycle reports `ERR_REQUIRE_CYCLE_MODULE`. |
| `test-05-tla-require.cjs` | Passing | Installed TLA ESM rejects CJS `require()` with `ERR_REQUIRE_ASYNC_MODULE`; dynamic import still works. |
| `test-06-conditional-import-graph.cjs` | Passing | Static ESM package imports in the graph use import conditions when detecting cycles. |
| `test-07-conditional-import-no-false-positive.cjs` | Passing | Static ESM package imports do not pre-mark module-sync branches and reject valid graphs. |
| `test-08-conditional-imports-alias-graph.cjs` | Passing | Package `imports` aliases in ESM use import conditions when detecting cycles. |
| `test-09-create-require-alias-cycle.cjs` | Passing | ESM `createRequire` alias bridges participate in cycle detection. |
| `test-10-already-evaluated-dependency.cjs` | Passing | CJS bridge can require an already evaluated ESM dependency. |
| `test-11-module-sync-before-import-graph.cjs` | Passing | Package `exports` with `module-sync` before `import` are scanned in Node-compatible condition order. |
| `test-12-module-sync-before-imports-alias-graph.cjs` | Passing | Package `imports` aliases with `module-sync` before `import` are scanned in Node-compatible condition order. |
| `test-13-scanner-false-positive-guards.cjs` | Passing | Graph scanners avoid property require, non-call createRequire, local createRequire, and nested CJS require false positives. |

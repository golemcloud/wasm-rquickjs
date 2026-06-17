# Installed App Compatibility Report

Generated: 2026-06-17 | Source: `tests/installed_apps/config.jsonc` | Engine: wasm-rquickjs (QuickJS)

This report tracks compatibility for unbundled npm-installed apps attached to the component as a filesystem. It is intentionally separate from `tests/libraries/libraries.md`, which tests Rollup-bundled library usage. Runtime tests in `tests/runtime/installed_apps.rs` are generated from the same config file as this report.

## Scope

| Included | Deferred |
|---|---|
| Pure JavaScript packages installed with npm | Native `.node` bindings |
| `node_modules` package resolution | Packages that load WASM artifacts |
| package `exports` / `imports` | Child process execution |
| CJS/ESM interop and same-process cycles | CLI preload/eval/warning behavior |

## How It Runs

For every runnable test, the runtime harness:

1. Copies `tests/installed_apps/apps/<app>` to a temporary directory.
2. Runs `npm install --install-links --ignore-scripts --no-audit --no-fund`.
3. Verifies the raw app test on host Node.js via `node run-node.mjs <test-file>`.
4. Copies the installed app into the WASI preopen as `/app`.
5. Executes the test through `examples/runtime/installed-app-runner` against real `/app/node_modules`.

## Summary

Runnable installed-app compatibility: **46/46** tests.

| Classification | Count |
|---|---:|
| Passing (runnable) | 46 |
| Known gap | 0 |
| Deferred | 0 |

## Apps

| App | Status | Tests | Notes |
|---|---:|---:|---|
| `cloud-sdk-offline` | Passing | 4/4 | Cloud SDK packages installed as a real app with node_modules attached as filesystem; tests use offline constructors/API shapes only |
| `crypto-auth` | Passing | 3/3 | Authentication and crypto-adjacent pure-JS packages installed as a real app with node_modules attached as filesystem |
| `data-formats` | Passing | 3/3 | Data parsing and serialization packages installed as a real app with node_modules attached as filesystem |
| `db-clients-offline` | Passing | 4/4 | Database client packages installed as a real app with node_modules attached as filesystem; tests avoid network connections |
| `fs-template-config` | Passing | 3/3 | Configuration, templating, and filesystem glob packages installed as a real app with node_modules attached as filesystem |
| `http-clients` | Passing | 3/3 | HTTP client packages installed as a real app with node_modules attached as filesystem; tests avoid external network by using custom fetch/adapter paths |
| `logging-observability` | Passing | 2/2 | Logging and observability packages installed as a real app with node_modules attached as filesystem; tests avoid subprocesses/transports |
| `module-interop` | Passing | 16/16 | Synthetic npm-installed app covering CJS/ESM/package graph behavior |
| `popular-pure-js` | Passing | 6/6 | Popular pure-JS npm packages installed as a real app with node_modules attached as filesystem |
| `validation-schema` | Passing | 2/2 | Validation packages installed as a real app with node_modules attached as filesystem |

## `cloud-sdk-offline`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-openai.mjs` | Passing | OpenAI SDK offline client surface |
| `test-02-anthropic.mjs` | Passing | Anthropic SDK offline client surface |
| `test-03-aws-s3.mjs` | Passing | AWS S3 SDK offline client and command construction |
| `test-04-stripe.cjs` | Passing | Stripe SDK offline client surface |

## `crypto-auth`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-jsonwebtoken-bcrypt.cjs` | Passing | jsonwebtoken and bcryptjs CommonJS execution |
| `test-02-jose.mjs` | Passing | jose ESM JWT signing and verification |
| `test-03-nanoid-cookie.mjs` | Passing | nanoid, cookie, and cookie-signature package interop |

## `data-formats`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-csv.cjs` | Passing | papaparse and csv-parse CommonJS CSV parsing |
| `test-02-yaml-xml.cjs` | Passing | yaml and xml2js parsing/serialization |
| `test-03-binary-protobuf.cjs` | Passing | msgpackr and protobufjs binary serialization |

## `db-clients-offline`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-sql-builders.cjs` | Passing | knex query builder offline execution |
| `test-02-pg-mysql.cjs` | Passing | pg and mysql2 client construction without connecting |
| `test-03-mongodb-redis.mjs` | Passing | mongodb and redis client construction without connecting |
| `test-04-drizzle.mjs` | Passing | drizzle-orm schema helpers offline execution |

## `fs-template-config`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-config-parsers.cjs` | Passing | ini and toml config parsing |
| `test-02-template-engines.cjs` | Passing | ejs, handlebars, and mustache rendering |
| `test-03-fast-glob-fs.cjs` | Passing | fast-glob filesystem traversal |

## `http-clients`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-axios.cjs` | Passing | Axios CommonJS load, custom adapter, and interceptors |
| `test-02-fetch-ky.mjs` | Passing | node-fetch and ky ESM package loading with local data/custom fetch paths |
| `test-03-graphql-request.mjs` | Passing | graphql-request client execution with custom fetch |

## `logging-observability`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-loggers.cjs` | Passing | pino, loglevel, and winston API loading without transports/processes |
| `test-02-consola-otel.mjs` | Passing | consola and OpenTelemetry API loading |

## `module-interop`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-esm-import-cjs.js` | Passing | ESM app imports named/default exports from installed CJS packages |
| `test-02-cjs-require-esm.cjs` | Passing | CJS app requires an installed synchronous ESM package |
| `test-03-package-exports-imports.js` | Passing | Installed packages use conditional exports, subpaths, and package imports aliases |
| `test-04-cycle-require-esm.cjs` | Passing | CJS require(esm) cycle inside an installed package reports ERR_REQUIRE_CYCLE_MODULE |
| `test-05-tla-require.cjs` | Passing | CJS require() of installed TLA ESM reports ERR_REQUIRE_ASYNC_MODULE and dynamic import still works |
| `test-06-conditional-import-graph.cjs` | Passing | Graph scanning follows import conditions for static ESM package imports |
| `test-07-conditional-import-no-false-positive.cjs` | Passing | Graph scanning does not mark module-sync branches for static ESM package imports |
| `test-08-conditional-imports-alias-graph.cjs` | Passing | Graph scanning follows import conditions for package imports aliases |
| `test-09-create-require-alias-cycle.cjs` | Passing | Graph scanning handles createRequire aliases in ESM modules |
| `test-10-already-evaluated-dependency.cjs` | Passing | CJS bridge can require an already evaluated ESM dependency |
| `test-11-module-sync-before-import-graph.cjs` | Passing | Graph scanning honors module-sync before import in package exports |
| `test-12-module-sync-before-imports-alias-graph.cjs` | Passing | Graph scanning honors module-sync before import in package imports aliases |
| `test-13-scanner-false-positive-guards.cjs` | Passing | Graph scanning avoids property require, non-call createRequire, local createRequire, and nested CJS require false positives |
| `test-14-exports-patterns.mjs` | Passing | Package exports wildcard patterns resolve for ESM, module-sync, and CJS require |
| `test-15-imports-patterns.cjs` | Passing | Package imports wildcard patterns resolve for CJS require |
| `test-16-shim-patterns.mjs` | Passing | OpenAI-style _shims/auto wildcard package exports resolve |

## `popular-pure-js`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-cjs-utilities.cjs` | Passing | Classic CommonJS utilities and transitive dependencies |
| `test-02-modern-esm.mjs` | Passing | Modern ESM and exports-heavy packages |
| `test-03-date-fns-subpaths.mjs` | Passing | Package subpath exports |
| `test-04-dotenv-fs.cjs` | Passing | Filesystem-backed configuration loading |
| `test-05-ajv.cjs` | Passing | Larger CommonJS validation package graph |
| `test-06-rxjs.mjs` | Passing | RxJS package exports and operator subpaths |

## `validation-schema`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-joi-yup.cjs` | Passing | joi and yup validation |
| `test-02-superstruct-valibot.mjs` | Passing | superstruct and valibot validation |

## Non-Runnable Tests

_No non-runnable installed-app tests._

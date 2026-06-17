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
| `module-interop` | Passing | 16/16 | Synthetic local npm packages covering module loader interop behavior. Verifies npm install with `--install-links`, Node baseline execution, then wasm-rquickjs execution from an attached `/app/node_modules` filesystem. |
| `popular-pure-js` | Passing | 6/6 | Popular pure-JS npm package smoke suite for attached `node_modules` execution. |
| `http-clients` | Passing | 3/3 | HTTP client package smoke suite using custom adapters/fetch paths to avoid external network. |
| `crypto-auth` | Passing | 3/3 | Auth and crypto-adjacent pure-JS package smoke suite. |
| `data-formats` | Passing | 3/3 | Data parsing and serialization package smoke suite. |
| `fs-template-config` | Passing | 3/3 | Configuration, templating, and filesystem glob package smoke suite. |
| `validation-schema` | Passing | 2/2 | Additional validation package smoke suite. |
| `logging-observability` | Passing | 2/2 | Logging and observability package smoke suite without subprocesses/transports. |
| `cloud-sdk-offline` | Passing | 4/4 | Cloud SDK package smoke suite using offline constructors/API shapes only. |
| `db-clients-offline` | Passing | 4/4 | Database client package smoke suite without network connections. |

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
| `test-14-exports-patterns.mjs` | Passing | Package exports wildcard patterns resolve for ESM, module-sync, and CJS require. |
| `test-15-imports-patterns.cjs` | Passing | Package imports wildcard patterns resolve for CJS require. |
| `test-16-shim-patterns.mjs` | Passing | OpenAI-style `_shims/auto/*` wildcard package exports resolve. |

## `popular-pure-js`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-cjs-utilities.cjs` | Passing | Classic CommonJS utilities: `lodash`, `semver`, `debug`, `ms`. |
| `test-02-modern-esm.mjs` | Passing | Modern ESM / exports-heavy packages: `chalk`, `zod`, `uuid`. |
| `test-03-date-fns-subpaths.mjs` | Passing | `date-fns` subpath exports. |
| `test-04-dotenv-fs.cjs` | Passing | `dotenv` reading config from attached filesystem. |
| `test-05-ajv.cjs` | Passing | Larger CommonJS validation graph with `ajv`. |
| `test-06-rxjs.mjs` | Passing | `rxjs` package exports and operator subpaths. |

## `http-clients`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-axios.cjs` | Passing | Axios CommonJS load, custom adapter, and interceptors. |
| `test-02-fetch-ky.mjs` | Passing | node-fetch data URL execution and ky ESM package API loading. |
| `test-03-graphql-request.mjs` | Passing | graphql-request client execution with custom fetch. |

## `crypto-auth`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-jsonwebtoken-bcrypt.cjs` | Passing | jsonwebtoken and bcryptjs CommonJS execution. |
| `test-02-jose.mjs` | Passing | jose ESM JWT signing and verification. |
| `test-03-nanoid-cookie.mjs` | Passing | nanoid, cookie, and cookie-signature package interop. |

## `data-formats`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-csv.cjs` | Passing | papaparse and csv-parse CommonJS CSV parsing. |
| `test-02-yaml-xml.cjs` | Passing | yaml and xml2js parsing/serialization. |
| `test-03-binary-protobuf.cjs` | Passing | msgpackr and protobufjs binary serialization. |

## `fs-template-config`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-config-parsers.cjs` | Passing | ini and toml config parsing. |
| `test-02-template-engines.cjs` | Passing | ejs, handlebars, and mustache rendering. |
| `test-03-fast-glob-fs.cjs` | Passing | fast-glob filesystem traversal. |

## `validation-schema`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-joi-yup.cjs` | Passing | joi and yup validation. |
| `test-02-superstruct-valibot.mjs` | Passing | superstruct and valibot validation. |

## `logging-observability`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-loggers.cjs` | Passing | pino, loglevel, and winston API loading without transports/processes. |
| `test-02-consola-otel.mjs` | Passing | consola and OpenTelemetry API loading. |

## `cloud-sdk-offline`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-openai.mjs` | Passing | OpenAI SDK offline client surface. |
| `test-02-anthropic.mjs` | Passing | Anthropic SDK offline client surface. |
| `test-03-aws-s3.mjs` | Passing | AWS S3 SDK offline client and command construction. |
| `test-04-stripe.cjs` | Passing | Stripe SDK offline client surface. |

## `db-clients-offline`

| Test | Status | Coverage |
|---|---:|---|
| `test-01-sql-builders.cjs` | Passing | knex query builder offline execution. |
| `test-02-pg-mysql.cjs` | Passing | pg and mysql2 client construction without connecting. |
| `test-03-mongodb-redis.mjs` | Passing | mongodb and redis client construction without connecting. |
| `test-04-drizzle.mjs` | Passing | drizzle-orm schema helpers offline execution. |

# NPM Library Compatibility Test Tracker

This document tracks compatibility testing of popular npm packages with the wasm-rquickjs runtime.

**Legend:**
- ✅ Tested & working
- ⚠️ Tested & partially working
- ❌ Tested & not working
- ⬜ Not yet tested

---

## HTTP & Web Frameworks

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 1 | Express | `express` | ❌ | 2026-03-09 | Requires server binding (Golem-incompatible); wasm init fails: `depd` library calls `not a function` in `callSiteLocation` |
| 2 | Fastify | `fastify` | ❌ | 2026-03-09 | Requires server binding (Golem-incompatible); wasm run fails: `ServerResponse has an already assigned socket` (`ERR_HTTP_SOCKET_ASSIGNED`) |
| 3 | NestJS Core | `@nestjs/core` | ✅ | 2026-03-11 | All 5 bundled tests pass in Node.js and wasm-rquickjs (service injection, providers, lifecycle hooks, reflector, module imports) |
| 4 | NestJS Common | `@nestjs/common` | ✅ | 2026-03-11 | All 5 bundled tests pass in Node.js and wasm-rquickjs (decorators, exceptions, pipes, validation, module builder/Logger) |
| 5 | Koa | `koa` | ❌ | 2026-03-09 | Requires server binding (Golem-incompatible); wasm init fails: `depd` library calls `not a function` in `callSiteLocation` |
| 6 | Hapi | `@hapi/hapi` | ❌ | 2026-03-08 | Requires server binding (Golem-incompatible); wasm run fails for all bundles: `JavaScript error: not a function` |
| 7 | Hono | `hono` | ⚠️ | 2026-03-08 | 2/5 wasm tests pass (cookies, JWT); response/header paths fail (`not a function`, `headers` null/iterator errors) |

## HTTP Clients

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 8 | Axios | `axios` | ✅ | 2026-03-07 | All 5 tests pass (utilities, headers, interceptors, HTTP GET, HTTP POST) |
| 9 | Got | `got` | ❌ | 2026-03-11 | Node bundles pass (5/5), but all wasm runs fail at init: `node:tls` stub throws `tls is not supported in WebAssembly environment` |
| 10 | node-fetch | `node-fetch` | ❌ | 2026-03-10 | Node bundles pass (5/5), but all wasm runs crash with QuickJS stack overflow during deeply recursive module init |
| 11 | undici | `undici` | ⚠️ | 2026-03-09 | 4/5 wasm tests pass (Headers, Request, Response, errors); test-01 fetch of data: URI fails (`status` of undefined) |
| 12 | superagent | `superagent` | ✅ | 2026-03-09 | All 5 tests pass (request builder, query params, auth/timeout/retry, plugins, agent defaults) |

## Databases — SQL & ORMs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 13 | Prisma Client | `@prisma/client` | ✅ | 2026-03-09 | All 5 tests pass (SQL fragments, join/raw/empty, validator/skip, Decimal/nulls, errors/extension) |
| 14 | TypeORM | `typeorm` | ❌ | 2026-03-09 | wasm init fails: `app-root-path` passes undefined to `path.dirname` (The "path" argument must be of type string) |
| 15 | Drizzle ORM | `drizzle-orm` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (query builder, placeholders, relations, entities, aggregates) |
| 16 | Sequelize | `sequelize` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (DataTypes, Op/SQL builders, errors, Model.build, hooks) |
| 17 | MikroORM | `@mikro-orm/core` | ❌ | 2026-03-08 | Node bundles pass (5/5), but all wasm runs fail at init: `Error resolving module 'constants'` |
| 18 | Knex | `knex` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (SELECT, INSERT/upsert, DDL, raw SQL, builder cloning) |
| 19 | pg | `pg` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (escape utils, connection config, type parsers, client overrides, pool/native) |
| 20 | mysql2 | `mysql2` | ✅ | 2026-03-09 | All 5 tests pass (escaping/SQL, constants/charsets, query factory/cache, pool/cluster, promise API) |
| 21 | better-sqlite3 | `better-sqlite3` | ❌ | 2026-03-08 | Bundled tests fail to initialize (`__filename is not defined`); native `.node` binding load path incompatible |
| 22 | mssql | `mssql` | ⚠️ | 2026-03-08 | 4/5 wasm tests pass; `ConnectionPool.parseConnectionString(...)` fails with `cannot read property 'trim' of undefined` |

## Databases — NoSQL

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 23 | Mongoose | `mongoose` | ✅ | 2026-03-08 | 5/5 bundled tests pass in Node and wasm-rquickjs for offline schema/model/document APIs; live MongoDB operations untested |
| 24 | mongodb | `mongodb` | ✅ | 2026-03-08 | 5/5 bundled tests pass in Node and wasm-rquickjs for offline BSON/errors/options APIs; live DB operations untested |

## Caching & Redis

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 25 | ioredis | `ioredis` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (lazy client, RESP encoding, URL parsing, pipeline, custom Lua commands) |
| 26 | redis | `redis` | ✅ | 2026-03-09 | All 5 tests pass (core exports, factories, defineScript, digest, types/errors) |
| 27 | lru-cache | `lru-cache` | ✅ | 2026-03-08 | All 5 bundled tests pass in Node.js and wasm-rquickjs (LRU behavior, TTL, size eviction, dispose hooks, memo/fetch) |
| 28 | cache-manager | `cache-manager` | ✅ | 2026-03-08 | All 5 bundled tests pass in Node.js and wasm-rquickjs (basic CRUD, TTL, wrap coalescing, events, multi-store ops) |

## Message Queues & Async Processing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 29 | BullMQ | `bullmq` | ✅ | 2026-03-08 | All 5 bundled tests pass on Node.js and wasm-rquickjs (QueueKeys, backoffs, errors, job JSON, AsyncFifoQueue) |
| 30 | amqplib | `amqplib` | ✅ | 2026-03-08 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (credentials, codec, frame, API args, URL credential helpers); live broker operations untested |
| 31 | kafkajs | `kafkajs` | ✅ | 2026-03-09 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (exports/constants, client factories/validation, disconnected producer errors, partitioners, codec registry); live broker operations untested |
| 32 | nats | `nats` | ⚠️ | 2026-03-10 | 3/5 wasm tests pass (codecs, headers, consumer opts); auth test fails (`TextEncoder.encode` non-string coercion), utils test has assertion failure |
| 33 | mqtt | `mqtt` | ✅ | 2026-03-09 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (connect/options parsing, validation helpers, Store, message-id providers, ReasonCodes/events); live broker flows untested |

## Workflow Engines & Reactive

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 34 | Temporal SDK | `@temporalio/client` | ⚠️ | 2026-03-09 | 4/5 tests pass; offline APIs work, but connection/client path fails in wasm: `tls is not supported in WebAssembly environment` |
| 35 | RxJS | `rxjs` | ✅ | 2026-03-09 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (core operators, Subject variants, error handling, combinations, virtual-time schedulers) |

## AI / LLM Frameworks

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 36 | LangChain.js | `langchain` | ⚠️ | 2026-03-09 | 4/5 wasm tests pass; offline message/tool/store/agent APIs work, but `initChatModel` missing-provider error path differs (`cannot read property 'split' of undefined`) |
| 37 | LangChain Core | `@langchain/core` | ✅ | 2026-03-09 | All 5 tests pass (messages, prompts/runnables, output parsers, tools, cache/math) |
| 38 | LangGraph.js | `@langchain/langgraph` | ✅ | 2026-03-09 | All 5 bundled offline tests pass (annotations/reducers, Send routing, messages reducer, MemorySaver checkpoints, Command/errors) |
| 39 | OpenAI SDK | `openai` | ⚠️ | 2026-03-09 | 3/5 wasm tests pass; constructor/env/toFile helpers work, but request/retry flows fail in wasm HTTP path with `cannot read property 'Symbol.iterator' of undefined`; live API calls require credentials |
| 40 | Anthropic SDK | `@anthropic-ai/sdk` | ⚠️ | 2026-03-09 | 4/5 wasm tests pass; constructor/URL/request-builder/error/helper paths work, but `messages.create()` fails in wasm HTTP path with `cannot read property 'Symbol.iterator' of undefined`; live API calls require credentials |
| 41 | Vercel AI SDK | `ai` | ✅ | 2026-03-09 | All 5 bundled offline utility/message-processing tests pass in Node.js and wasm-rquickjs |
| 42 | MCP SDK | `@modelcontextprotocol/sdk` | ✅ | 2026-03-09 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (in-memory client/server flows, tools, resources/prompts, stdio utilities, URI/error helpers) |

## Authentication & Security

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 43 | jsonwebtoken | `jsonwebtoken` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (HS sign/verify, decode, claims/time validation, callback APIs) |
| 44 | passport | `passport` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (strategy registration, authenticate flows, serialize/deserialize, auth info transforms, initialize helpers) |
| 45 | passport-jwt | `passport-jwt` | ✅ | 2026-03-09 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (extractors, strategy validation, authenticate success/failure paths) |
| 46 | passport-local | `passport-local` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (constructor/options, success/fail/error paths, query/custom fields, passReqToCallback) |
| 47 | bcrypt | `bcrypt` | ❌ | 2026-03-09 | Bundled tests fail to initialize (`ERR_MODULE_NOT_FOUND: mock-aws-s3`); native `.node` binding/bootstrap path incompatible |
| 48 | bcryptjs | `bcryptjs` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (sync/async hashing, getRounds/getSalt, truncation, validation) |
| 49 | helmet | `helmet` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (default headers, option validation, dynamic CSP, custom toggles, standalone middleware factories) |
| 50 | cors | `cors` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (simple requests, preflight defaults, dynamic origin, custom preflight options, options delegate) |
| 51 | express-rate-limit | `express-rate-limit` | ❌ | 2026-03-09 | 5/5 offline middleware/store tests pass in Node.js and wasm-rquickjs, but standard usage requires an Express server pipeline (Golem-incompatible) |
| 52 | NestJS Throttler | `@nestjs/throttler` | ✅ | 2026-03-11 | All 5 bundled tests pass in Node.js and wasm-rquickjs (helpers, decorators, module config, storage, tokens) |

## Validation

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 53 | Zod | `zod` | ✅ | 2026-03-07 | All 5 tests pass; pure JS, fully compatible |
| 54 | Joi | `joi` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (object/conditional/alternatives/binary validation) |
| 55 | class-validator | `class-validator` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (standalone validators, class-style sync/async constraints, whitelist/groups, validateOrReject) |
| 56 | class-transformer | `class-transformer` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (plain/instance transforms, Expose/Exclude, nested Type/Date, groups/version, clone+serialize) |
| 57 | Ajv | `ajv` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (core validation, $ref schemas, mutation options, custom formats/keywords, async validation) |
| 58 | Yup | `yup` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (coercion/defaults, aggregated errors, conditional refs, array+tuple validation, custom method/locale/reach) |

## Logging

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 59 | Pino | `pino` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (basic JSON logging, child bindings, redaction/serializers, multistream, level changes) |
| 60 | Winston | `winston` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (custom transport, format pipeline, child metadata, custom levels, profiler/errors) |
| 61 | Morgan | `morgan` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs fail at init: `depd` `callSiteLocation` throws `not a function` |

## Testing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 62 | Jest | `jest` | ❌ | 2026-03-09 | Node source tests pass (5/5), but Rollup bundling fails on native `@unrs/resolver-binding-*.node`; cannot run in wasm-rquickjs workflow |
| 63 | Vitest | `vitest` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs abort at init: `cannot wstd::runtime::block_on inside an existing block_on!` |
| 64 | Mocha | `mocha` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs fail at init: `navigator is not defined` |
| 65 | Supertest | `supertest` | ❌ | 2026-03-09 | Offline assertion/cookie helper tests pass in Node.js and wasm-rquickjs (5/5), but standard `request(app)` usage requires server binding/listening (Golem-incompatible) |
| 66 | Sinon | `sinon` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs abort at init: `cannot wstd::runtime::block_on inside an existing block_on!` |
| 67 | Chai | `chai` | ✅ | 2026-03-09 | All 5 bundled assertion tests pass in Node.js and wasm-rquickjs (assert/expect/should, deep/nested, throws, subset/keys) |
| 68 | nock | `nock` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs fail in `node:http` request setup: `JavaScript error: cannot read property 'bind' of undefined` |
| 69 | ts-jest | `ts-jest` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs fail at init: `JavaScript error: Cannot find module 'inspector'` |

## GraphQL

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 70 | graphql | `graphql` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (graphqlSync execution, validation, AST transforms, introspection, custom scalar behavior) |
| 71 | Apollo Server | `@apollo/server` | ❌ | 2026-03-09 | 5/5 offline APIs pass in wasm, but standard usage requires HTTP server binding (Golem-incompatible) |
| 72 | graphql-subscriptions | `graphql-subscriptions` | ✅ | 2026-03-09 | All 5 bundled tests pass in Node.js and wasm-rquickjs (PubSub delivery, unsubscribe, async iterators, iterator close, withFilter) |

## gRPC & Serialization

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 73 | gRPC JS | `@grpc/grpc-js` | ✅ | 2026-03-10 | All 5 bundled offline API tests pass in Node.js and wasm-rquickjs (metadata, enums, credentials, experimental helpers); live RPC/server flows untested |
| 74 | Proto Loader | `@grpc/proto-loader` | ⚠️ | 2026-03-10 | 5/5 bundled tests pass for descriptor/object APIs in Node.js and wasm-rquickjs, but bundled `load`/`loadSync` file-loading path is unavailable |
| 75 | protobufjs | `protobufjs` | ❌ | 2026-03-10 | 5/5 bundled tests pass in Node.js, but 0/5 run in wasm-rquickjs due to startup failure: `node:fs` built-in wiring throws `require is not defined` |
| 76 | msgpackr | `msgpackr` | ❌ | 2026-03-10 | 5/5 bundled tests pass in Node.js, but 0/5 run in wasm-rquickjs due to startup failure: `node:fs` built-in wiring throws `require is not defined` |

## WebSocket & Real-time

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 77 | socket.io | `socket.io` | ❌ | 2026-03-10 | Offline APIs pass (5/5), but primary usage requires server binding/listening (Golem-incompatible) |
| 78 | ws | `ws` | ✅ | 2026-03-10 | All 5 bundled offline API tests pass in Node.js and wasm-rquickjs (parsers/frame encode-decode/noServer mode); live socket and listen-based flows were not exercised |
| 79 | socket.io-client | `socket.io-client` | ⚠️ | 2026-03-10 | All 5 bundled offline API tests pass in Node.js and wasm-rquickjs (manager/socket options, buffering, listeners, cache); live connect/ACK/reconnect flows require a running Socket.IO server |

## Scheduling & Cron

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 80 | node-cron | `node-cron` | ✅ | 2026-03-11 | All 5 bundled tests pass in Node.js and wasm-rquickjs (exports, validation, lifecycle, execute, events) |
| 81 | cron-parser | `cron-parser` | ⚠️ | 2026-03-11 | 4/5 wasm tests pass (basic, validation, advanced, hash); test-05 fails with `ENOENT` writing temp file via `node:fs` |
| 82 | NestJS Schedule | `@nestjs/schedule` | ⚠️ | 2026-03-11 | 4/5 wasm tests pass (decorators, CronExpression, module config, errors); test-04 registry fails: `DateTimeFormat` must be called with `new` (Intl bug) |

## Email

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 83 | Nodemailer | `nodemailer` | ✅ | 2026-03-10 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (json transport, stream transport, address normalization, attachments) |

## Cloud & Infrastructure SDKs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 84 | AWS SDK v3 | `@aws-sdk/client-s3` | ⚠️ | 2026-03-10 | 5/5 bundled offline tests pass in Node.js and wasm-rquickjs; live S3 API calls require AWS credentials and network |
| 85 | Google Cloud Storage | `@google-cloud/storage` | ❌ | 2026-03-10 | Node bundles 5/5 pass, but all wasm runs fail at startup: `JavaScript error: Cannot find module 'punycode'` |

## Configuration & Environment

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 86 | dotenv | `dotenv` | ⚠️ | 2026-03-10 | 4/5 tests pass; `parse`/`populate` work, but `config()` fails in wasm with `ENOENT` when opening `.env` via `node:fs` |
| 87 | NestJS Config | `@nestjs/config` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (ConfigService get/getOrThrow/set, registerAs/getConfigToken/asProvider, ConfigModule+ConditionalModule) |
| 88 | convict | `convict` | ✅ | 2026-03-10 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (defaults, env/args precedence, strict validation, custom formats, sensitive masking) |
| 89 | envalid | `envalid` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (core validators, defaults/devDefault/testOnly, custom validators, strict proxy accessors, error classes) |

## Compression & File Handling

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 90 | compression | `compression` | ❌ | 2026-03-10 | All 5 bundled offline middleware tests pass in Node.js and wasm-rquickjs, but standard usage requires an Express/HTTP server middleware pipeline (Golem-incompatible) |
| 91 | multer | `multer` | ❌ | 2026-03-10 | Node bundles pass (5/5), but wasm runs fail in multipart stream pipeline (`TypeError: not a function`); disk storage test also fails with `ENOENT` creating writable dir |
| 92 | form-data | `form-data` | ✅ | 2026-03-07 | All 5 tests pass (basic, buffer, length, boundary, multipart format) |

## Utility Libraries

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 93 | lodash | `lodash` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (chaining, deep paths, collections, clone/merge, template/curry/memoize) |
| 94 | uuid | `uuid` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (v3/v5 deterministic hashes, v1/v6/v7 generation, parse/stringify, buffer APIs) |
| 95 | date-fns | `date-fns` | ⚠️ | 2026-03-10 | 4/5 bundled tests pass in Node.js and wasm-rquickjs; `intlFormatDistance` fails in wasm with `JavaScript error: not a function` |
| 96 | dayjs | `dayjs` | ⚠️ | 2026-03-10 | 4/5 bundled tests pass; core/date parsing/formatting plugins work, but timezone conversion (`utc().tz(...)`) returns unconverted time in wasm |
| 97 | semver | `semver` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (parsing/validation, ranges, comparison/inc, range algebra, coerce/sort/class APIs) |
| 98 | async | `async` | ✅ | 2026-03-10 | All 5 bundled tests pass in Node.js and wasm-rquickjs (collections, control flow, queues, retry/timeout, memoize/reflect) |
| 99 | yargs | `yargs` | ✅ | 2026-03-11 | All 5 bundled tests pass in Node.js and wasm-rquickjs (basic options, validation, commands, parser config, middleware/coerce) |
| 100 | Ramda | `ramda` | ⚠️ | 2026-03-10 | 4/5 bundled tests pass; `ascendNatural("en", ...)` sort order differs in wasm (`item-10` before `item-2`) |

---

## Compatibility Notes

### Likely compatible (pure JS, minimal Node.js built-in deps)
`zod`, `joi`, `date-fns`, `dayjs`, `lodash`, `uuid`, `semver`, `async`, `yargs`, `dotenv`, `lru-cache`, `msgpackr`, `form-data`, `graphql`, `ajv`, `yup`, `ramda`, `cron-parser`, `rxjs`

### Needs `node:crypto`
`bcryptjs`, `jsonwebtoken`, `uuid` (v4/v7)

### Needs `node:http` + `node:stream`
`express`, `fastify`, `axios`, `got`, `node-fetch`, `undici`, `superagent`, `multer`, `compression`, `nodemailer`, `ws`, `socket.io`, `hono`, `koa`

### Needs `node:net` / native bindings (likely incompatible)
`pg`, `mysql2`, `better-sqlite3`, `ioredis`, `redis`, `@grpc/grpc-js`, `mongodb`, `bcrypt`

### Complex multi-module runtimes (likely incompatible)
`@temporalio/*`, `kafkajs`, `amqplib`, `@nestjs/core`, `jest`, `vitest`, `mocha`

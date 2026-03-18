# NPM Library Compatibility Test Tracker

This document tracks compatibility testing of popular npm packages with the wasm-rquickjs runtime.

**Legend:**
- ✅ Tested & working
- ✅💰 Tested & working (requires API token/credentials for full live testing)
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
| 19 | pg | `pg` | ✅ | 2026-03-16 | All 5 offline + 3 Docker integration tests pass on Node.js and wasm-rquickjs. Integration tests cover connect, CRUD, and transactions against real PostgreSQL (md5 auth; SCRAM-SHA-256 blocked by missing `raw/PBKDF2` in `crypto.subtle.importKey`) |
| 20 | mysql2 | `mysql2` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass on Node.js and wasm-rquickjs. Integration tests cover connect+SELECT and full CRUD against real MySQL 8.0 |
| 21 | better-sqlite3 | `better-sqlite3` | ❌ | 2026-03-08 | Bundled tests fail to initialize (`__filename is not defined`); native `.node` binding load path incompatible |
| 22 | mssql | `mssql` | ⚠️ | 2026-03-16 | 4/5 offline + 2/2 Docker integration tests pass in wasm-rquickjs; connect + CRUD work against Azure SQL Edge; `ConnectionPool.parseConnectionString(...)` has a behavioral difference |

## Databases — NoSQL

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 23 | Mongoose | `mongoose` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass on Node.js and wasm-rquickjs. Integration tests cover connect/disconnect and full CRUD against real MongoDB 7 |
| 24 | mongodb | `mongodb` | ✅ | 2026-03-16 | 5/5 offline + 2/2 Docker integration tests pass in Node and wasm-rquickjs; connect, ping, CRUD all work via `node:net` TCP |

## Caching & Redis

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 25 | ioredis | `ioredis` | ✅ | 2026-03-08 | All 5 offline tests pass; Docker integration tests (connect, commands, pub/sub) pass on Node.js but fail in wasm-rquickjs — `node:dns` resolution fails, blocking `node:net` TCP connections to Redis |
| 26 | redis | `redis` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass (connect, PING, SET/GET, DEL, HSET/HGETALL, LPUSH/LRANGE, INCR/DECR, EXPIRE/TTL); requires `-S allow-ip-name-lookup` for DNS |
| 27 | lru-cache | `lru-cache` | ✅ | 2026-03-08 | All 5 bundled tests pass in Node.js and wasm-rquickjs (LRU behavior, TTL, size eviction, dispose hooks, memo/fetch) |
| 28 | cache-manager | `cache-manager` | ✅ | 2026-03-08 | All 5 bundled tests pass in Node.js and wasm-rquickjs (basic CRUD, TTL, wrap coalescing, events, multi-store ops) |

## Message Queues & Async Processing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 29 | BullMQ | `bullmq` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass on Node.js and wasm-rquickjs (QueueKeys, backoffs, errors, job JSON, AsyncFifoQueue, Queue add/getJob, Worker processing) |
| 30 | amqplib | `amqplib` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass in Node.js and wasm-rquickjs; live connect, queue assert, pub/sub with ack all verified against RabbitMQ |
| 31 | kafkajs | `kafkajs` | ⚠️ | 2026-03-16 | 5/5 offline tests pass; 0/2 Docker integration tests pass in wasm-rquickjs (both hang — kafkajs requires raw TCP via `node:net` for Kafka binary protocol, which is unsupported) |
| 32 | nats | `nats` | ⚠️ | 2026-03-16 | 3/5 offline + 2/2 integration (connect, pub/sub) pass in wasm; auth test fails (`TextEncoder.encode` non-string coercion), utils test has assertion failure |
| 33 | mqtt | `mqtt` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass in Node.js and wasm-rquickjs. Integration tests cover connect and publish/subscribe round-trip against real Mosquitto broker |

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
| 39 | OpenAI SDK | `openai` | ✅ | 2026-03-17 | All 5 offline + 3 live integration tests pass in Node.js and wasm-rquickjs (constructor, validation, mock API, retry, toFile, live chat completion, streaming, embeddings); live tests require `OPENAI_API_KEY` |
| 40 | Anthropic SDK | `@anthropic-ai/sdk` | ✅ | 2026-03-17 | 5/5 wasm tests pass; constructor, URL builder, request builder, mock API call with `messages.create()`, error classes, and `toFile` all work; live API calls require credentials |
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
| 83 | Nodemailer | `nodemailer` | ✅ | 2026-03-16 | All 5 offline + 2 Docker integration tests pass in Node.js and wasm-rquickjs (json/stream/SMTP transport, address normalization, attachments, MailHog SMTP send/verify) |

## Cloud & Infrastructure SDKs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 84 | AWS SDK v3 | `@aws-sdk/client-s3` | ⚠️ | 2026-03-16 | 5/5 offline tests pass; 0/2 Docker integration tests (MinIO) fail in wasm-rquickjs — wstd reactor panics on real HTTP requests |
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

## AI / LLM Clients & Providers

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 101 | Google Generative AI | `@google/generative-ai` | ✅💰 | 2026-03-17 | 5/5 offline bundled tests pass in Node.js and wasm-rquickjs (constructors, validation, config, enums/errors, chat state); live API/streaming/embed calls require credentials |
| 102 | Cohere SDK | `cohere-ai` | ❌ | 2026-03-17 | 5/5 bundled tests pass in Node.js, but 0/5 run in wasm-rquickjs: module initialization fails with `Cannot find module 'formdata-node'` |
| 103 | Mistral SDK | `@mistralai/mistralai` | ⚠️ | 2026-03-17 | 5/5 bundled tests pass in Node.js; 2/5 pass in wasm-rquickjs (constructor/helpers OK), request paths fail with `headers` iterator and object→string conversion errors; live API calls require credentials |
| 104 | Groq SDK | `groq-sdk` | ✅ | 2026-03-17 | 5/5 bundled offline tests pass in both Node.js and wasm-rquickjs (constructor, validation, mocked API requests, retry flow, helpers); previous `Symbol.iterator` error resolved; live API calls require credentials |
| 105 | Together AI SDK | `together-ai` | ✅ | 2026-03-17 | 5/5 bundled offline tests pass in both Node.js and wasm-rquickjs (constructor, validation, mocked API requests, retry flow, helpers); previous `Symbol.iterator` error resolved; live API calls require credentials |
| 106 | Fireworks AI SDK | `@fireworks-ai/sdk` | ❌ | 2026-03-17 | Package unpublished from npm on 2026-02-14; cannot be installed or tested |
| 107 | Replicate SDK | `replicate` | ⚠️ | 2026-03-17 | 5/5 bundled offline tests pass in Node.js; 3/5 pass in wasm-rquickjs (constructor/validation/webhook helpers), while request/pagination paths fail with `JavaScript error: not a function` in `__wasm_rquickjs_builtin/http`; live API calls require credentials |
| 108 | HuggingFace Inference | `@huggingface/inference` | ✅ | 2026-03-17 | 5/5 bundled offline tests pass in both Node.js and wasm-rquickjs (constructor, validation, chat completion, streaming SSE, text-to-image); previously failing Symbol.iterator bug is now fixed; live API calls require credentials |
| 109 | HuggingFace Hub | `@huggingface/hub` | ✅ | 2026-03-17 | 5/5 bundled offline tests pass in both Node.js and wasm-rquickjs (constants, safetensors utils, SHA-256 hashing, OAuth URL building, mocked whoAmI/repoExists); previously failing Symbol.iterator bug is now fixed; live API calls require credentials |
| 110 | Ollama JS | `ollama` | ✅ | 2026-03-17 | 5/5 bundled offline tests pass in both Node.js and wasm-rquickjs (host normalization, version, embed, streaming chat, error handling); previously failing Symbol.iterator bug is now fixed |
| 111 | AI SDK OpenAI Provider | `@ai-sdk/openai` | ✅ | 2026-03-17 | 4/4 offline tests pass in both Node.js and wasm-rquickjs (factory/tools/mocked chat doGenerate/mocked responses doGenerate); previously failing Symbol.iterator bug is now fixed; live API calls require `OPENAI_API_KEY` |
| 112 | AI SDK Anthropic Provider | `@ai-sdk/anthropic` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (factory/validation/tools/request+headers/error propagation); live Anthropic API calls require `ANTHROPIC_API_KEY` |
| 113 | AI SDK Google Provider | `@ai-sdk/google` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live credential-gate tests pass in Node.js and wasm-rquickjs (factory/tools/supported URLs/mocked doGenerate+embeddings/header+error paths); full live generation remains gated because `generativelanguage.googleapis.com` is not enabled for the configured Google project |
| 114 | AI SDK Mistral Provider | `@ai-sdk/mistral` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (factory/validation/doGenerate/embeddings/supportedUrls + header/error transport paths); live Mistral API calls require `MISTRAL_API_KEY` |

## AI Agent Frameworks & Tools

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 115 | LangChain OpenAI | `@langchain/openai` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 live tests pass in Node.js and wasm-rquickjs (ChatOpenAI/structured output/token counting, embeddings, auth headers, and 429 error mapping) |
| 116 | LangChain Anthropic | `@langchain/anthropic` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (constructor/invocation params/tool formatting/prompt conversion + invoke/header/error transport paths); live Anthropic API calls require `ANTHROPIC_API_KEY` |
| 117 | LangChain Google GenAI | `@langchain/google-genai` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 live credential-gate tests pass in Node.js and wasm-rquickjs (chat/embeddings/structured-output/tool-binding coverage); full live Gemini responses remain gated by Google project/API enablement for the configured key |
| 118 | LangChain Community | `@langchain/community` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live Google CSE tests pass in Node.js and wasm-rquickjs (calculator, BM25, CSV/html transforms, SSE parser, Wikipedia/Searxng/Cheerio HTTP paths) |
| 119 | LangSmith SDK | `langsmith` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (RunTree/traceable/anonymizer/client CRUD/list coverage); live LangSmith API coverage requires `LANGSMITH_API_KEY`/`LANGCHAIN_API_KEY` |
| 120 | AutoGen JS | `autogen` | ✅ | 2026-03-17 | All 5 offline bundled tests pass in Node.js and wasm-rquickjs; npm `autogen@0.0.1` is a minimal passthrough utility (not Microsoft AutoGen framework) |
| 121 | CrewAI JS | `crewai` | ❌ | 2026-03-17 | 5/5 Node tests pass, but Rollup cannot bundle package entrypoint (`src/crewai/cli/cli.ts`) due untranspiled TypeScript syntax (`const program: Command`); wasm tests blocked |
| 122 | Instructor JS | `@instructor-ai/instructor` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live tests pass in Node.js and wasm-rquickjs (constructor/proxy validation, pass-through, retry behavior, and live OpenAI structured output) |
| 123 | Mastra | `mastra` | ❌ | 2026-03-17 | Rollup bundling fails before execution: `"toPath" is not exported by "unicorn-magic"` via `npm-run-path`; Node/wasm bundle-based tests blocked |
| 124 | GenKit | `@genkit-ai/core` | ⚠️ | 2026-03-17 | 5/5 bundled tests pass in Node.js, but only 1/5 pass in wasm-rquickjs: imports from `@genkit-ai/core` fail during module init (`depd`/Express Reflection path: `JavaScript error: not a function`); `@genkit-ai/core/schema` works |

## Embedding & Retrieval

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 125 | OpenAI Embeddings (via openai) | `openai` | ✅ | 2026-03-17 | OpenAI SDK suite passes fully in Node.js and wasm-rquickjs: 5/5 offline + 3/3 HTTP mock + 3/3 live tests, including `embeddings.create()` |
| 126 | Voyage AI SDK | `voyageai` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (embed/rerank/retry/error paths); live Voyage API calls require `VOYAGE_API_KEY`, and local `voyage-4-nano`/`tokenize()` paths need optional `@huggingface/transformers` + `onnxruntime-node` |
| 127 | Jina AI SDK | `@jina-ai/sdk` | ❌ | 2026-03-17 | `npm install` fails with E404 (`@jina-ai/sdk@latest` not in registry); package cannot be installed, bundled, or executed |
| 128 | Transformers.js | `@xenova/transformers` | ❌ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js, but 0/8 run in wasm-rquickjs: bundled init fails with `JavaScript error: self is not defined` |
| 129 | LlamaIndex TS | `llamaindex` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 live tests pass in Node.js and wasm-rquickjs (Document/Prompt/SentenceSplitter/FunctionTool/Memory + OpenAI provider chat/retry + VectorStoreIndex RAG); live wasm runs require `--env OPENAI_API_KEY=...` |

## Vector Databases

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 130 | Pinecone SDK | `@pinecone-database/pinecone` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (control/data/inference paths); live Pinecone API calls remain credential-gated (`PINECONE_API_KEY`) |
| 131 | Weaviate Client | `weaviate-client` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 Docker tests pass in Node.js; wasm-rquickjs passes 9/10 tests, with only `connectToWeaviateCloud()` failing (`tls is not supported in WebAssembly environment`) |
| 132 | Qdrant JS | `@qdrant/js-client-rest` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 Docker integration tests pass in Node.js and wasm-rquickjs (`versionInfo`, collection lifecycle, upsert/count/query) |
| 133 | ChromaDB Client | `chromadb` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 Docker integration tests pass in Node.js and wasm-rquickjs (constructors, config/builders, collection lifecycle, and record CRUD/query); Chroma Cloud live tests are credential-gated (`CHROMA_API_KEY`) |
| 134 | Milvus SDK | `@zilliz/milvus2-sdk-node` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs; live Milvus/Zilliz service calls (gRPC + real HTTP endpoints) remain untested |
| 135 | LanceDB | `@lancedb/lancedb` | ❌ | 2026-03-17 | Cannot bundle: Rollup fails on native `.node` addon import (`lancedb.darwin-arm64.node`); source sanity tests pass in Node.js |
| 136 | Turbopuffer SDK | `@turbopuffer/turbopuffer` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs; live Turbopuffer API coverage requires `TURBOPUFFER_API_KEY` |
| 137 | Upstash Vector | `@upstash/vector` | ✅💰 | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs; live Upstash API coverage requires `UPSTASH_VECTOR_REST_URL` + `UPSTASH_VECTOR_REST_TOKEN` |

## Graph Databases

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 138 | Neo4j Driver | `neo4j-driver` | ⚠️ | 2026-03-17 | 5/5 offline tests pass in Node.js and wasm-rquickjs; 2/2 Docker integration tests pass in Node.js but fail in wasm-rquickjs with `getaddrinfo ESERVFAIL localhost` when opening Bolt connections |
| 139 | ArangoDB JS | `arangojs` | ⚠️ | 2026-03-17 | 5/5 offline + 2/2 Docker integration tests pass in Node.js; wasm-rquickjs passes offline tests but fails live HTTP operations (0/2 integration) with `Error converting from js 'object' into type 'string'` |
| 140 | Dgraph JS | `dgraph-js-http` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (client config, validation, transaction state, login/query/mutate HTTP paths, and error handling) |
| 141 | SurrealDB JS | `surrealdb` | ⚠️ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs, but all HTTP integration tests fail in wasm-rquickjs (0/5 HTTP mock + Docker) with `Error converting from js 'object' into type 'string'` |
| 142 | FalkorDB SDK | `falkordb` | ✅ | 2026-03-18 | All 5 offline + 2 Docker integration tests pass in Node.js and wasm-rquickjs (connect/config, graph CRUD, and index create/drop against live FalkorDB) |
| 143 | TypeDB Driver | `typedb-driver` | ⚠️ | 2026-03-18 | 5/5 offline + 2/2 Docker integration tests pass in Node.js; wasm-rquickjs passes offline tests but cannot establish gRPC connections to TypeDB in integration tests (`[NDR7] Driver Error: Unable to connect to TypeDB server`) |

## Search Providers

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 144 | Elasticsearch Client | `@elastic/elasticsearch` | ⚠️ | 2026-03-18 | 5/5 offline + 5/5 integration tests pass in Node.js; wasm-rquickjs passes offline APIs (5/5) but all real HTTP operations fail (0/5 HTTP mock + Docker) with `JavaScript error: Request aborted` |
| 145 | Algolia Search | `algoliasearch` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs; live Algolia service tests are credential-gated |
| 146 | Typesense Client | `typesense` | ✅ | 2026-03-18 | All 5 offline + 5 integration tests (HTTP mock 3/3, Docker 2/2) pass in Node.js and wasm-rquickjs |
| 147 | MeiliSearch JS | `meilisearch` | ❌ | 2026-03-18 | Node.js passes all 5 offline + 5 integration tests (HTTP mock 3/3, Docker 2/2), but wasm-rquickjs fails core HTTP paths (0/5 integration, 2/5 offline only) with `JavaScript error: Error converting from js 'object' into type 'string'` |
| 148 | OpenSearch Client | `@opensearch-project/opensearch` | ✅ | 2026-03-18 | All 5 offline + 5 integration tests (HTTP mock 3/3, Docker 2/2) pass in Node.js and wasm-rquickjs |

## Web Search APIs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 149 | SerpAPI | `serpapi` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`getJson`/`getHtml`/archive/account/locations); live SerpAPI calls remain credential-gated |
| 150 | Serper SDK | `serper` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`search`/`news`/`images`/`videos`/`places`, pagination, cache); live Serper.dev calls remain credential-gated |
| 151 | Tavily SDK | `@tavily/core` | ✅💰 | 2026-03-18 | 3/3 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`search`/`extract`/`map`/`research`/`getResearch`, deprecated APIs, error handling); live Tavily API calls remain credential-gated |
| 152 | Brave Search SDK | `brave-search` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`webSearch`/`imageSearch`/`newsSearch`, local POI/descriptions, summary polling, auth/rate-limit mapping); live Brave API calls remain credential-gated |
| 153 | Exa JS | `exa-js` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`search`/`findSimilar`/`getContents`/`answer`/`streamAnswer`, schema + polling helpers); live Exa API calls remain credential-gated (`EXA_API_KEY` missing) |
| 154 | Google Custom Search | `googleapis` | ⚠️ | 2026-03-18 | 5/5 offline tests pass in Node.js + wasm-rquickjs, but all HTTP paths fail in wasm (0/3 mock integration, 0/1 live) with `Error converting from js 'object' into type 'string'` |

## Speech-to-Text & Text-to-Speech

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 155 | Deepgram SDK | `@deepgram/sdk` | ✅💰 | 2026-03-18 | 5/5 offline + 4/4 HTTP mock tests pass in Node.js and wasm-rquickjs (`listen`/`read`/`speak`/`auth`/`manage`, websocket client construction/guards); live Deepgram API tests remain credential-gated (`DEEPGRAM_API_KEY` missing) |
| 156 | AssemblyAI SDK | `assemblyai` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (`files`/`transcripts`/`lemur` + temporary token APIs, realtime/streaming transcriber URL and guard behavior); live AssemblyAI API tests remain credential-gated (`ASSEMBLYAI_API_KEY` missing) |
| 157 | ElevenLabs SDK | `elevenlabs` | ❌ | 2026-03-18 | Node.js passes 5/5 offline + 3/3 HTTP mock tests, but all wasm-rquickjs runs fail at module init: `Cannot find module 'formdata-node'` |
| 158 | OpenAI Audio (via openai) | `openai` | ❌ | 2026-03-17 | Agent did not update row; check logs |
| 159 | Google Cloud Speech | `@google-cloud/speech` | ⚠️ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs, but HTTP request paths fail in wasm (0/3 mock integration, 0/1 live) with `Error converting from js 'object' into type 'string'` and missing error status metadata |
| 160 | Google Cloud Text-to-Speech | `@google-cloud/text-to-speech` | ⚠️ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs, but HTTP request paths fail in wasm (0/3 mock integration, 0/1 live) with `Error converting from js 'object' into type 'string'` and missing error status metadata |
| 161 | Azure Cognitive Speech | `microsoft-cognitiveservices-speech-sdk` | ⚠️ | 2026-03-18 | 5/5 offline + 1/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs; websocket recognition/synthesis integration paths fail in wasm (no websocket upgrade observed), while `getVoicesAsync` HTTP path works; live Azure calls remain credential-gated |
| 162 | PlayHT SDK | `playht` | ❌ | 2026-03-18 | Node.js passes 5/5 offline + 3/3 HTTP mock tests, but all wasm-rquickjs runs fail at module init: `Cannot find module 'punycode'` |
| 163 | Cartesia SDK | `@cartesia/cartesia-js` | ✅ | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (status, voices, access-token retry/auth flows); live Cartesia API/WebSocket tests were not run (`CARTESIA_API_KEY` not present in `.tokens.json`) |

## Video & Image Generation

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 164 | Replicate (video models) | `replicate` | ❌ | 2026-03-17 | Agent did not update row; check logs |
| 165 | Stability AI SDK | `@stability-ai/sdk` | ❌ | 2026-03-18 | npm install fails with E404 (`@stability-ai/sdk` not found in registry); runtime testing blocked |
| 166 | Fal.ai Client | `@fal-ai/client` | ✅ | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (`run`, queue subscribe/cancel, middleware, errors/helpers); live Fal API tests were not run (`FAL_KEY` not present in `.tokens.json`) |
| 167 | Luma AI SDK | `lumaai` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs; live Luma API tests not run because `LUMAAI_API_KEY` is not present in `.tokens.json` |
| 168 | RunwayML SDK | `@runwayml/sdk` | ✅💰 | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (`tasks.retrieve`, `textToImage.create`, error mapping); live Runway API tests not run because `RUNWAYML_API_SECRET` is not present in `.tokens.json` |
| 169 | Leonardo AI SDK | `@leonardo-ai/sdk` | ❌ | 2026-03-18 | Node.js passes 5/5 offline + 3/3 HTTP mock tests, but wasm-rquickjs only passes 1/5 offline and 0/3 integration tests; all HTTP paths fail in `_createRequest` with `Error converting from js 'object' into type 'string'` |

## Effect Ecosystem

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 170 | Effect | `effect` | ✅ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs (Option/Either/Data primitives, sync+async Effect execution, schema validation, immutable collections) |
| 171 | Effect Platform | `@effect/platform` | ⚠️ | 2026-03-18 | 3/5 offline + 3/3 HTTP mock integration tests pass in wasm-rquickjs; URL helper paths have behavioral mismatches (`Url.mutate` conversion error, `HttpClientRequest.toUrl` query-param difference) |
| 172 | Effect Platform Node | `@effect/platform-node` | ⚠️ | 2026-03-18 | Node.js passes 5/5 offline + 3/3 HTTP mock tests, but wasm-rquickjs passes 2/5 offline + 1/3 integration tests; filesystem directory creation fails (`ENOENT` on resolved root paths) and successful HTTP JSON payload handling differs (query/body assertions fail) |
| 173 | Effect Schema | `@effect/schema` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (struct decode, refinements, built-in transforms, `parseJson` pipeline, custom transform); package is deprecated and merged into `effect` |
| 174 | Effect CLI | `@effect/cli` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (command descriptors, args/options parsing, `Command.run`, help/usage, shell completion generation) |
| 175 | Effect SQL | `@effect/sql` | ✅ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs (Statement compiler/helpers, SqlSchema wrappers, Model variants, Migrator loader/error types); package is driver-agnostic so DB integration is tested in adapter packages |
| 176 | Effect SQL pg | `@effect/sql-pg` | ✅ | 2026-03-18 | 5/5 offline + 3/3 Docker integration tests pass in Node.js and wasm-rquickjs (`layerFromPool`/`fromPool` config + builders, `PgMigrator.fromRecord`, live connect/CRUD/transactions against PostgreSQL) |
| 177 | Effect SQL MySQL | `@effect/sql-mysql2` | ✅ | 2026-03-18 | 5/5 offline + 3/3 Docker integration tests pass in Node.js and wasm-rquickjs (`MysqlClient.makeCompiler` builders, `MysqlMigrator` loaders, live connect/CRUD/transactions against MySQL 8.0) |
| 178 | Effect SQL SQLite | `@effect/sql-sqlite-node` | ❌ | 2026-03-18 | Bundled `SqliteClient` tests fail at startup with `__filename is not defined` (native `better-sqlite3` binding path); only migrator loader helpers pass |
| 179 | Effect RPC | `@effect/rpc` | ✅ | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (`Rpc.make`/`RpcGroup` operations, `RpcTest` unary+error+stream flows, and HTTP protocol client with headers + flat mode) |
| 180 | Effect OpenTelemetry | `@effect/opentelemetry` | ✅ | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (`OtlpResource` conversions/config, `Tracer.makeExternalSpan`, `OtlpSerialization` JSON/Protobuf, OTLP trace export/resource metadata/custom headers) |
| 181 | Effect Cluster | `@effect/cluster` | ⚠️ | 2026-03-18 | 5/5 offline tests pass in Node.js and wasm-rquickjs, but HTTP mock integration tests only pass in Node.js (wasm-rquickjs fails 0/3 with 400s due query params from `HttpClientRequest.setUrlParam` not being propagated) |

## Observability & Tracing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 182 | OpenTelemetry API | `@opentelemetry/api` | ✅ | 2026-03-18 | All 5 offline tests pass in Node.js and wasm-rquickjs (trace, context, propagation/baggage, metrics, diag APIs) |
| 183 | OpenTelemetry SDK Trace | `@opentelemetry/sdk-trace-base` | ✅ | 2026-03-18 | All 5 offline tests pass in Node.js and wasm-rquickjs (provider/span lifecycle, limits, samplers, TraceIdRatioBasedSampler, custom processor hooks + flush/shutdown) |
| 184 | OpenTelemetry SDK Metrics | `@opentelemetry/sdk-metrics` | ✅ | 2026-03-18 | All 5 offline tests pass in Node.js and wasm-rquickjs (sync instruments, monotonic value validation, views/aggregation controls, observable callbacks, delta temporality) |
| 185 | OpenTelemetry Exporter OTLP HTTP | `@opentelemetry/exporter-trace-otlp-http` | ✅ | 2026-03-18 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (lifecycle + failure handling, OTLP JSON export, custom headers/user-agent forwarding, gzip payload compression) |
| 186 | Sentry Node SDK | `@sentry/node` | ✅💰 | 2026-03-18 | 3/3 offline + 2/2 HTTP mock integration tests pass in Node.js and wasm-rquickjs (`captureMessage`/`captureException`, scope enrichment, tracing headers, envelope delivery); full live ingestion remains credential-gated (no Sentry DSN token configured) |
| 187 | Datadog Trace | `dd-trace` | ❌ | 2026-03-18 | Rollup ESM bundles crash before test execution (`ReferenceError: __dirname is not defined in ES module scope` at dd-trace init), so bundled Node baseline and wasm-rquickjs runs are blocked |
| 188 | Prometheus Client | `prom-client` | ✅ | 2026-03-18 | All 5 offline bundled tests pass in Node.js and wasm-rquickjs (Counter, Gauge, Histogram, Summary, Registry/merge/default-label behavior) |

## Template Engines & Rendering

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 189 | Handlebars | `handlebars` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (compile/escape, helpers+SafeString, partial blocks, precompile/runtime template, strict mode + runtime helper overrides) |
| 190 | EJS | `ejs` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (render/escape, compile options, custom delimiters, async templates, cache APIs) |
| 191 | Mustache | `mustache` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (escaped/raw interpolation, sections/inverted blocks, partials, lambdas, custom tags/escape + cache APIs) |
| 192 | Nunjucks | `nunjucks` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (renderString escaping/safe output, macros/loops/tests, custom filters/tests/globals, in-memory loader extends/include, compile + error handling) |
| 193 | Liquid | `liquidjs` | ❌ | 2026-03-18 | Node.js 5/5 pass, but wasm-rquickjs 0/5: every bundle fails at startup with `JavaScript error: stack underflow (op=112, pc=301)` during module initialization |

## Data Processing & Streaming

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 194 | csv-parser | `csv-parser` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (basic parsing, separator/quote handling, mapHeaders/mapValues, output byte offsets, strict-mode errors) |
| 195 | PapaParse | `papaparse` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (basic header parsing, dynamic typing, quoted field handling, unparse round-trip, step/preview behavior) |
| 196 | xlsx / SheetJS | `xlsx` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (workbook read/write roundtrip, JSON sheet builders, formula/CSV/HTML exports, Date-cell options, address helpers + workbook props) |
| 197 | pdf-parse | `pdf-parse` | ❌ | 2026-03-18 | Rollup bundle initializes but functional tests fail at runtime: `createCommonjsRequire(...).ensure is not a function` (dynamic `pdf.js` require/`require.ensure` incompatibility) |
| 198 | cheerio | `cheerio` | ⚠️ | 2026-03-18 | Offline API surface works (3/3), but `fromURL` integration fails in wasm-rquickjs with `getaddrinfo ESERVFAIL localhost` (Node.js 5/5 pass) |
| 199 | turndown | `turndown` | ✅ | 2026-03-18 | All 5 bundled offline tests pass in Node.js and wasm-rquickjs (headings/inline formatting, fenced code blocks, keep/remove, custom rules, ordered-list start handling) |
| 200 | marked | `marked` | ✅ | 2026-03-18 | All offline parser/extension tests pass in wasm-rquickjs |

---

## Compatibility Notes

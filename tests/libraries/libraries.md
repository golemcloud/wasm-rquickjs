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
| 101 | Google Generative AI | `@google/generative-ai` | ⚠️ | 2026-03-17 | 5/5 offline bundled tests pass in Node.js and wasm-rquickjs (constructors, validation, config, enums/errors, chat state); live API/streaming/embed calls require credentials |
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
| 112 | AI SDK Anthropic Provider | `@ai-sdk/anthropic` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (factory/validation/tools/request+headers/error propagation); live Anthropic API calls require `ANTHROPIC_API_KEY` |
| 113 | AI SDK Google Provider | `@ai-sdk/google` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live credential-gate tests pass in Node.js and wasm-rquickjs (factory/tools/supported URLs/mocked doGenerate+embeddings/header+error paths); full live generation remains gated because `generativelanguage.googleapis.com` is not enabled for the configured Google project |
| 114 | AI SDK Mistral Provider | `@ai-sdk/mistral` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock integration tests pass in Node.js and wasm-rquickjs (factory/validation/doGenerate/embeddings/supportedUrls + header/error transport paths); live Mistral API calls require `MISTRAL_API_KEY` |

## AI Agent Frameworks & Tools

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 115 | LangChain OpenAI | `@langchain/openai` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 live tests pass in Node.js and wasm-rquickjs (ChatOpenAI/structured output/token counting, embeddings, auth headers, and 429 error mapping) |
| 116 | LangChain Anthropic | `@langchain/anthropic` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (constructor/invocation params/tool formatting/prompt conversion + invoke/header/error transport paths); live Anthropic API calls require `ANTHROPIC_API_KEY` |
| 117 | LangChain Google GenAI | `@langchain/google-genai` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 2/2 live credential-gate tests pass in Node.js and wasm-rquickjs (chat/embeddings/structured-output/tool-binding coverage); full live Gemini responses remain gated by Google project/API enablement for the configured key |
| 118 | LangChain Community | `@langchain/community` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live Google CSE tests pass in Node.js and wasm-rquickjs (calculator, BM25, CSV/html transforms, SSE parser, Wikipedia/Searxng/Cheerio HTTP paths) |
| 119 | LangSmith SDK | `langsmith` | ⚠️ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock tests pass in Node.js and wasm-rquickjs (RunTree/traceable/anonymizer/client CRUD/list coverage); live LangSmith API coverage requires `LANGSMITH_API_KEY`/`LANGCHAIN_API_KEY` |
| 120 | AutoGen JS | `autogen` | ✅ | 2026-03-17 | All 5 offline bundled tests pass in Node.js and wasm-rquickjs; npm `autogen@0.0.1` is a minimal passthrough utility (not Microsoft AutoGen framework) |
| 121 | CrewAI JS | `crewai` | ❌ | 2026-03-17 | 5/5 Node tests pass, but Rollup cannot bundle package entrypoint (`src/crewai/cli/cli.ts`) due untranspiled TypeScript syntax (`const program: Command`); wasm tests blocked |
| 122 | Instructor JS | `@instructor-ai/instructor` | ✅ | 2026-03-17 | 5/5 offline + 3/3 HTTP mock + 1/1 live tests pass in Node.js and wasm-rquickjs (constructor/proxy validation, pass-through, retry behavior, and live OpenAI structured output) |
| 123 | Mastra | `mastra` | ❌ | 2026-03-17 | Rollup bundling fails before execution: `"toPath" is not exported by "unicorn-magic"` via `npm-run-path`; Node/wasm bundle-based tests blocked |
| 124 | GenKit | `@genkit-ai/core` | ⚠️ | 2026-03-17 | 5/5 bundled tests pass in Node.js, but only 1/5 pass in wasm-rquickjs: imports from `@genkit-ai/core` fail during module init (`depd`/Express Reflection path: `JavaScript error: not a function`); `@genkit-ai/core/schema` works |

## Embedding & Retrieval

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 125 | OpenAI Embeddings (via openai) | `openai` | ✅ | 2026-03-17 | OpenAI SDK suite passes fully in Node.js and wasm-rquickjs: 5/5 offline + 3/3 HTTP mock + 3/3 live tests, including `embeddings.create()` |
| 126 | Voyage AI SDK | `voyageai` | ⬜ | | Voyage AI embedding/reranking client |
| 127 | Jina AI SDK | `@jina-ai/sdk` | ⬜ | | Jina AI embedding/reranking API client |
| 128 | Transformers.js | `@xenova/transformers` | ⬜ | | Local ML inference (embeddings, NLP); uses ONNX runtime |
| 129 | LlamaIndex TS | `llamaindex` | ⬜ | | LlamaIndex data framework for LLM apps (RAG, agents) |

## Vector Databases

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 130 | Pinecone SDK | `@pinecone-database/pinecone` | ⬜ | | Pinecone vector DB client; HTTP-based |
| 131 | Weaviate Client | `weaviate-client` | ⬜ | | Weaviate vector DB client; HTTP/gRPC |
| 132 | Qdrant JS | `@qdrant/js-client-rest` | ⬜ | | Qdrant vector DB REST client |
| 133 | ChromaDB Client | `chromadb` | ⬜ | | ChromaDB embedding database client |
| 134 | Milvus SDK | `@zilliz/milvus2-sdk-node` | ⬜ | | Milvus/Zilliz vector DB client; uses gRPC |
| 135 | LanceDB | `@lancedb/lancedb` | ⬜ | | LanceDB embedded vector DB; uses native bindings |
| 136 | Turbopuffer SDK | `@turbopuffer/turbopuffer` | ⬜ | | Turbopuffer vector DB HTTP client |
| 137 | Upstash Vector | `@upstash/vector` | ⬜ | | Upstash serverless vector DB; HTTP-based |

## Graph Databases

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 138 | Neo4j Driver | `neo4j-driver` | ⬜ | | Neo4j graph DB driver; uses Bolt protocol via `node:net` |
| 139 | ArangoDB JS | `arangojs` | ⬜ | | ArangoDB multi-model DB client; HTTP-based |
| 140 | Dgraph JS | `dgraph-js-http` | ⬜ | | Dgraph graph DB HTTP client |
| 141 | SurrealDB JS | `surrealdb` | ⬜ | | SurrealDB multi-model DB client; HTTP + WebSocket |
| 142 | FalkorDB SDK | `falkordb` | ⬜ | | FalkorDB (Redis-based graph DB) client |
| 143 | TypeDB Driver | `typedb-driver` | ⬜ | | TypeDB (formerly Grakn) driver; uses gRPC |

## Search Providers

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 144 | Elasticsearch Client | `@elastic/elasticsearch` | ⬜ | | Elasticsearch/OpenSearch HTTP client |
| 145 | Algolia Search | `algoliasearch` | ⬜ | | Algolia search API client; HTTP-based |
| 146 | Typesense Client | `typesense` | ⬜ | | Typesense search engine HTTP client |
| 147 | MeiliSearch JS | `meilisearch` | ⬜ | | MeiliSearch HTTP client; pure JS |
| 148 | OpenSearch Client | `@opensearch-project/opensearch` | ⬜ | | OpenSearch HTTP client |

## Web Search APIs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 149 | SerpAPI | `serpapi` | ⬜ | | SerpAPI web search client; HTTP-based |
| 150 | Serper SDK | `serper` | ⬜ | | Serper.dev Google search API client |
| 151 | Tavily SDK | `@tavily/core` | ⬜ | | Tavily AI-optimized web search API client |
| 152 | Brave Search SDK | `brave-search` | ⬜ | | Brave Search API client |
| 153 | Exa JS | `exa-js` | ⬜ | | Exa (formerly Metaphor) neural search API client |
| 154 | Google Custom Search | `googleapis` | ⬜ | | Google APIs client (Custom Search, etc.); HTTP-based |

## Speech-to-Text & Text-to-Speech

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 155 | Deepgram SDK | `@deepgram/sdk` | ⬜ | | Deepgram STT/TTS API client; HTTP + WebSocket |
| 156 | AssemblyAI SDK | `assemblyai` | ⬜ | | AssemblyAI speech-to-text client; HTTP-based |
| 157 | ElevenLabs SDK | `elevenlabs` | ⬜ | | ElevenLabs TTS/voice cloning API client |
| 158 | OpenAI Audio (via openai) | `openai` | ❌ | 2026-03-17 | Agent did not update row; check logs |
| 159 | Google Cloud Speech | `@google-cloud/speech` | ⬜ | | Google Cloud Speech-to-Text client; uses gRPC |
| 160 | Google Cloud Text-to-Speech | `@google-cloud/text-to-speech` | ⬜ | | Google Cloud TTS client; uses gRPC |
| 161 | Azure Cognitive Speech | `microsoft-cognitiveservices-speech-sdk` | ⬜ | | Azure Speech Services SDK; native + WebSocket |
| 162 | PlayHT SDK | `playht` | ⬜ | | PlayHT text-to-speech API client |
| 163 | Cartesia SDK | `@cartesia/cartesia-js` | ⬜ | | Cartesia real-time TTS API client |

## Video & Image Generation

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 164 | Replicate (video models) | `replicate` | ❌ | 2026-03-17 | Agent did not update row; check logs |
| 165 | Stability AI SDK | `@stability-ai/sdk` | ⬜ | | Stability AI image generation (Stable Diffusion) client |
| 166 | Fal.ai Client | `@fal-ai/client` | ⬜ | | Fal.ai serverless AI model client (image/video) |
| 167 | Luma AI SDK | `lumaai` | ⬜ | | Luma AI Dream Machine video generation client |
| 168 | RunwayML SDK | `@runwayml/sdk` | ⬜ | | RunwayML Gen-3 video generation API client |
| 169 | Leonardo AI SDK | `@leonardo-ai/sdk` | ⬜ | | Leonardo.ai image generation API client |

## Effect Ecosystem

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 170 | Effect | `effect` | ⬜ | | Core Effect library; typed functional effects, fibers, streams, layers |
| 171 | Effect Platform | `@effect/platform` | ⬜ | | Cross-platform HTTP client/server, file system, key-value store |
| 172 | Effect Platform Node | `@effect/platform-node` | ⬜ | | Node.js runtime adapter for @effect/platform |
| 173 | Effect Schema | `@effect/schema` | ⬜ | | Schema validation/serialization (successor to io-ts) |
| 174 | Effect CLI | `@effect/cli` | ⬜ | | CLI argument parsing built on Effect |
| 175 | Effect SQL | `@effect/sql` | ⬜ | | SQL database layer for Effect |
| 176 | Effect SQL pg | `@effect/sql-pg` | ⬜ | | PostgreSQL adapter for @effect/sql |
| 177 | Effect SQL MySQL | `@effect/sql-mysql2` | ⬜ | | MySQL adapter for @effect/sql |
| 178 | Effect SQL SQLite | `@effect/sql-sqlite-node` | ⬜ | | SQLite Node.js adapter for @effect/sql |
| 179 | Effect RPC | `@effect/rpc` | ⬜ | | Type-safe RPC layer for Effect |
| 180 | Effect OpenTelemetry | `@effect/opentelemetry` | ⬜ | | OpenTelemetry integration for Effect |
| 181 | Effect Cluster | `@effect/cluster` | ⬜ | | Distributed systems / cluster primitives for Effect |

## Observability & Tracing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 182 | OpenTelemetry API | `@opentelemetry/api` | ⬜ | | OpenTelemetry core API; pure JS |
| 183 | OpenTelemetry SDK Trace | `@opentelemetry/sdk-trace-base` | ⬜ | | OTel trace SDK base; pure JS |
| 184 | OpenTelemetry SDK Metrics | `@opentelemetry/sdk-metrics` | ⬜ | | OTel metrics SDK; pure JS |
| 185 | OpenTelemetry Exporter OTLP HTTP | `@opentelemetry/exporter-trace-otlp-http` | ⬜ | | OTel OTLP exporter over HTTP |
| 186 | Sentry Node SDK | `@sentry/node` | ⬜ | | Sentry error/performance monitoring; uses native hooks |
| 187 | Datadog Trace | `dd-trace` | ⬜ | | Datadog APM tracing; native bindings |
| 188 | Prometheus Client | `prom-client` | ⬜ | | Prometheus metrics collector; pure JS |

## Template Engines & Rendering

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 189 | Handlebars | `handlebars` | ⬜ | | Template engine; pure JS |
| 190 | EJS | `ejs` | ⬜ | | Embedded JavaScript templates; pure JS |
| 191 | Mustache | `mustache` | ⬜ | | Logic-less templates; pure JS |
| 192 | Nunjucks | `nunjucks` | ⬜ | | Jinja2-inspired template engine |
| 193 | Liquid | `liquidjs` | ⬜ | | Shopify Liquid template engine; pure JS |

## Data Processing & Streaming

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 194 | csv-parser | `csv-parser` | ⬜ | | CSV streaming parser; uses `node:stream` |
| 195 | PapaParse | `papaparse` | ⬜ | | CSV parser; mostly pure JS |
| 196 | xlsx / SheetJS | `xlsx` | ⬜ | | Excel file parser/generator; pure JS |
| 197 | pdf-parse | `pdf-parse` | ⬜ | | PDF text extraction; pure JS |
| 198 | cheerio | `cheerio` | ⬜ | | HTML parser/scraper (jQuery-like API); pure JS |
| 199 | turndown | `turndown` | ⬜ | | HTML to Markdown converter; pure JS |
| 200 | marked | `marked` | ⬜ | | Markdown to HTML parser; pure JS |

---

## Compatibility Notes

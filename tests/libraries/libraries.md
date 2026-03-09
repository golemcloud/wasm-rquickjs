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
| 3 | NestJS Core | `@nestjs/core` | ❌ | 2026-03-08 | Node tests pass, but wasm init fails: missing `stream/web` default export |
| 4 | NestJS Common | `@nestjs/common` | ❌ | 2026-03-08 | Node bundles pass; wasm module init fails: `Intl is not defined` |
| 5 | Koa | `koa` | ❌ | 2026-03-09 | Requires server binding (Golem-incompatible); wasm init fails: `depd` library calls `not a function` in `callSiteLocation` |
| 6 | Hapi | `@hapi/hapi` | ❌ | 2026-03-08 | Requires server binding (Golem-incompatible); wasm run fails for all bundles: `JavaScript error: not a function` |
| 7 | Hono | `hono` | ⚠️ | 2026-03-08 | 2/5 wasm tests pass (cookies, JWT); response/header paths fail (`not a function`, `headers` null/iterator errors) |

## HTTP Clients

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 8 | Axios | `axios` | ✅ | 2026-03-07 | All 5 tests pass (utilities, headers, interceptors, HTTP GET, HTTP POST) |
| 9 | Got | `got` | ❌ | 2026-03-08 | Node bundles pass (5/5), but all wasm runs fail at startup: `JavaScript error: Intl is not defined` |
| 10 | node-fetch | `node-fetch` | ❌ | 2026-03-08 | Node bundles pass (5/5), but all wasm runs fail at init: `Could not find export 'promises' in module 'node:fs'` |
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
| 32 | nats | `nats` | ❌ | 2026-03-09 | Node bundles pass (5/5), but all wasm runs fail at init: `Could not find export 'default' in module 'stream/web'` |
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
| 42 | MCP SDK | `@modelcontextprotocol/sdk` | ⬜ | — | Model Context Protocol for LLM tool-use |

## Authentication & Security

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 43 | jsonwebtoken | `jsonwebtoken` | ⬜ | — | JWT signing and verification |
| 44 | passport | `passport` | ⬜ | — | Authentication middleware |
| 45 | passport-jwt | `passport-jwt` | ⬜ | — | Passport strategy for JWT auth |
| 46 | passport-local | `passport-local` | ⬜ | — | Username/password authentication strategy |
| 47 | bcrypt | `bcrypt` | ⬜ | — | Password hashing (native) |
| 48 | bcryptjs | `bcryptjs` | ⬜ | — | Pure-JS bcrypt (no native deps) |
| 49 | helmet | `helmet` | ⬜ | — | Security HTTP headers middleware |
| 50 | cors | `cors` | ⬜ | — | CORS middleware |
| 51 | express-rate-limit | `express-rate-limit` | ⬜ | — | Rate limiting middleware for Express |
| 52 | NestJS Throttler | `@nestjs/throttler` | ⬜ | — | Rate limiting for NestJS |

## Validation

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 53 | Zod | `zod` | ✅ | 2026-03-07 | All 5 tests pass; pure JS, fully compatible |
| 54 | Joi | `joi` | ⬜ | — | Schema validation |
| 55 | class-validator | `class-validator` | ⬜ | — | Decorator-based validation for TypeScript classes |
| 56 | class-transformer | `class-transformer` | ⬜ | — | Serialization/deserialization of TS classes |
| 57 | Ajv | `ajv` | ⬜ | — | JSON Schema validator |
| 58 | Yup | `yup` | ⬜ | — | Schema builder for runtime validation |

## Logging

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 59 | Pino | `pino` | ⬜ | — | Extremely fast JSON logger |
| 60 | Winston | `winston` | ⬜ | — | Versatile logger with transports |
| 61 | Morgan | `morgan` | ⬜ | — | HTTP request logger middleware for Express |

## Testing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 62 | Jest | `jest` | ⬜ | — | Most popular test runner |
| 63 | Vitest | `vitest` | ⬜ | — | Vite-native test runner |
| 64 | Mocha | `mocha` | ⬜ | — | Flexible test framework |
| 65 | Supertest | `supertest` | ⬜ | — | HTTP integration testing |
| 66 | Sinon | `sinon` | ⬜ | — | Test spies, stubs, and mocks |
| 67 | Chai | `chai` | ⬜ | — | Assertion library |
| 68 | nock | `nock` | ⬜ | — | HTTP mocking |
| 69 | ts-jest | `ts-jest` | ⬜ | — | TypeScript preprocessor for Jest |

## GraphQL

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 70 | graphql | `graphql` | ⬜ | — | GraphQL JS reference implementation |
| 71 | Apollo Server | `@apollo/server` | ⬜ | — | GraphQL server |
| 72 | graphql-subscriptions | `graphql-subscriptions` | ⬜ | — | PubSub for GraphQL subscriptions |

## gRPC & Serialization

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 73 | gRPC JS | `@grpc/grpc-js` | ⬜ | — | Pure-JS gRPC implementation |
| 74 | Proto Loader | `@grpc/proto-loader` | ⬜ | — | Load .proto files at runtime |
| 75 | protobufjs | `protobufjs` | ⬜ | — | Protocol Buffers for JS |
| 76 | msgpackr | `msgpackr` | ⬜ | — | Fast MessagePack serialization |

## WebSocket & Real-time

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 77 | socket.io | `socket.io` | ⬜ | — | Real-time bidirectional event-based communication |
| 78 | ws | `ws` | ⬜ | — | Lightweight WebSocket implementation |
| 79 | socket.io-client | `socket.io-client` | ⬜ | — | Client-side Socket.io |

## Scheduling & Cron

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 80 | node-cron | `node-cron` | ⬜ | — | Cron-style task scheduler |
| 81 | cron-parser | `cron-parser` | ⬜ | — | Parse cron expressions |
| 82 | NestJS Schedule | `@nestjs/schedule` | ⬜ | — | Cron/schedule decorator module for NestJS |

## Email

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 83 | Nodemailer | `nodemailer` | ⬜ | — | De-facto standard for sending email |

## Cloud & Infrastructure SDKs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 84 | AWS SDK v3 | `@aws-sdk/client-s3` | ⬜ | — | Modular AWS SDK v3 (S3, DynamoDB, SES, etc.) |
| 85 | Google Cloud Storage | `@google-cloud/storage` | ⬜ | — | GCS client |

## Configuration & Environment

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 86 | dotenv | `dotenv` | ⬜ | — | Load .env files into process.env |
| 87 | NestJS Config | `@nestjs/config` | ⬜ | — | Configuration module backed by dotenv |
| 88 | convict | `convict` | ⬜ | — | Schema-based configuration loading |
| 89 | envalid | `envalid` | ⬜ | — | Validate and coerce environment variables |

## Compression & File Handling

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 90 | compression | `compression` | ⬜ | — | Express gzip compression middleware |
| 91 | multer | `multer` | ⬜ | — | Multipart/form-data handling (file uploads) |
| 92 | form-data | `form-data` | ✅ | 2026-03-07 | All 5 tests pass (basic, buffer, length, boundary, multipart format) |

## Utility Libraries

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 93 | lodash | `lodash` | ⬜ | — | General-purpose utility belt |
| 94 | uuid | `uuid` | ⬜ | — | RFC-compliant UUID generation |
| 95 | date-fns | `date-fns` | ⬜ | — | Modern functional date utility library |
| 96 | dayjs | `dayjs` | ⬜ | — | Lightweight Moment.js alternative |
| 97 | semver | `semver` | ⬜ | — | Semantic versioning parsing |
| 98 | async | `async` | ⬜ | — | Async control flow utilities (parallel, series, queue) |
| 99 | yargs | `yargs` | ⬜ | — | CLI argument parsing |
| 100 | Ramda | `ramda` | ⬜ | — | Functional programming utility library |

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

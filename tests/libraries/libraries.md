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
| 1 | Express | `express` | ❌ | 2026-03-07 | Requires server binding (Golem-incompatible); wasm init fails: missing `string_decoder` default export |
| 2 | Fastify | `fastify` | ❌ | 2026-03-07 | Requires server binding (Golem-incompatible); wasm init fails in `node:module.createRequire` with undefined filename |
| 3 | NestJS Core | `@nestjs/core` | ❌ | 2026-03-08 | Node tests pass, but wasm init fails: missing `string_decoder` default export |
| 4 | NestJS Common | `@nestjs/common` | ❌ | 2026-03-08 | Node bundles pass; wasm module init fails: `Intl is not defined` |
| 5 | Koa | `koa` | ❌ | 2026-03-08 | Requires server binding (Golem-incompatible); wasm module init fails in `node:module.createRequire` with undefined filename |
| 6 | Hapi | `@hapi/hapi` | ❌ | 2026-03-08 | Requires server binding (Golem-incompatible); wasm run fails for all bundles: `JavaScript error: not a function` |
| 7 | Hono | `hono` | ⬜ | — | Non-server APIs may work |

## HTTP Clients

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 8 | Axios | `axios` | ✅ | 2026-03-07 | All 5 tests pass (utilities, headers, interceptors, HTTP GET, HTTP POST) |
| 9 | Got | `got` | ⬜ | — | HTTP client |
| 10 | node-fetch | `node-fetch` | ⬜ | — | Fetch API polyfill |
| 11 | undici | `undici` | ⬜ | — | HTTP/1.1 client |
| 12 | superagent | `superagent` | ⬜ | — | HTTP client |

## Databases — SQL & ORMs

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 13 | Prisma Client | `@prisma/client` | ⬜ | — | Requires `prisma generate` |
| 14 | TypeORM | `typeorm` | ⬜ | — | SQL ORM |
| 15 | Drizzle ORM | `drizzle-orm` | ⬜ | — | TypeScript ORM |
| 16 | Sequelize | `sequelize` | ⬜ | — | Promise-based ORM |
| 17 | MikroORM | `@mikro-orm/core` | ⬜ | — | TypeScript ORM |
| 18 | Knex | `knex` | ⬜ | — | SQL query builder |
| 19 | pg | `pg` | ⬜ | — | PostgreSQL client |
| 20 | mysql2 | `mysql2` | ⬜ | — | MySQL client |
| 21 | better-sqlite3 | `better-sqlite3` | ❌ | 2026-03-08 | Bundled tests fail to initialize (`__filename is not defined`); native `.node` binding load path incompatible |
| 22 | mssql | `mssql` | ⬜ | — | MS SQL Server client |

## Databases — NoSQL

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 23 | Mongoose | `mongoose` | ⬜ | — | MongoDB ODM |
| 24 | mongodb | `mongodb` | ⬜ | — | Official MongoDB Node.js driver |

## Caching & Redis

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 25 | ioredis | `ioredis` | ⬜ | — | Robust Redis client with cluster/sentinel support |
| 26 | redis | `redis` | ⬜ | — | Official Node Redis client (v4+) |
| 27 | lru-cache | `lru-cache` | ⬜ | — | High-performance in-process LRU cache |
| 28 | cache-manager | `cache-manager` | ⬜ | — | Flexible multi-store caching |

## Message Queues & Async Processing

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 29 | BullMQ | `bullmq` | ⬜ | — | Redis-based job queue with delayed jobs, rate limiting |
| 30 | amqplib | `amqplib` | ⬜ | — | AMQP 0-9-1 (RabbitMQ) client |
| 31 | kafkajs | `kafkajs` | ⬜ | — | Apache Kafka client |
| 32 | nats | `nats` | ⬜ | — | NATS messaging client |
| 33 | mqtt | `mqtt` | ⬜ | — | MQTT client for IoT/messaging |

## Workflow Engines & Reactive

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 34 | Temporal SDK | `@temporalio/client` | ⬜ | — | Durable workflow execution engine |
| 35 | RxJS | `rxjs` | ⬜ | — | Reactive Extensions for JS |

## AI / LLM Frameworks

| # | Package | npm name | Status | Tested On | Notes |
|---|---------|----------|--------|-----------|-------|
| 36 | LangChain.js | `langchain` | ⬜ | — | Chains, agents, RAG for LLMs |
| 37 | LangChain Core | `@langchain/core` | ⬜ | — | Core abstractions (runnables, messages, retrievers) |
| 38 | LangGraph.js | `@langchain/langgraph` | ⬜ | — | Stateful agent graphs (agentic workflows) |
| 39 | OpenAI SDK | `openai` | ⬜ | — | Official OpenAI TypeScript/Node.js SDK |
| 40 | Anthropic SDK | `@anthropic-ai/sdk` | ⬜ | — | Official Anthropic (Claude) SDK |
| 41 | Vercel AI SDK | `ai` | ⬜ | — | Unified AI SDK with streaming |
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

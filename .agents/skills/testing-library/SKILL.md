---
name: testing-library
description: "Tests a 3rd-party npm library against the wasm-rquickjs runtime. Use when asked to test an npm package, check library compatibility, or pick the next untested library from the tracker."
---

# Testing a 3rd-Party NPM Library

Tests an npm library by creating small test apps, verifying them on Node.js, then running them through the wasm-rquickjs runtime to document any incompatibilities.

## Overview

The goal is **documentation, not fixing**. We create 1–5 focused test scripts for a library, confirm they pass on Node.js, then run each through the WASM runtime and record every error, missing API, or behavioral difference in `tests/libraries/libraries.md`.

**Bundler choice:** We use **Rollup** (not esbuild) for bundling because this matches the production Golem CLI toolchain (`golem-cli` uses Rollup with `@rollup/plugin-commonjs` and `@rollup/plugin-node-resolve`). This ensures test results reflect what real Golem users will experience. Rollup's `@rollup/plugin-commonjs` hoists CJS `require()` calls to ESM `import` statements, unlike esbuild which generates a `createRequire(import.meta.url)` shim that fails when `import.meta.url` is undefined.

## Step 1: Pick the Library

- If the user provides a library name, use that.
- Otherwise, read `tests/libraries/libraries.md` and pick the **first** library with status `⬜` (Not yet tested).

## Step 2: Research the Library

Use the **librarian** tool to understand what the library does, its core API surface, and what typical usage looks like. Focus on:
- Pure computation / data-transformation features (most likely to work)
- Features that rely on Node.js built-ins (crypto, streams, http, net, fs)
- Whether the library is pure JS or has native bindings

## Step 3: Create Test Scripts

Create **~5 small test scripts** in `tests/libraries/<package-name>/`. Each test script should:

- Be a **standalone ESM file** (`.js`) that exports a `run` function
- Use `assert` or simple `console.log`-based checks — no test framework dependencies
- Exit with code 0 on success, non-zero on failure (use `process.exit(1)` or let uncaught errors propagate)
- **Not require API keys, network services, databases, or manual intervention**
- Test a distinct aspect of the library's API
- Print `PASS: <description>` on success or throw/print `FAIL: <description>` on failure

### Test naming convention

```
tests/libraries/<package-name>/
├── test-01-basic.js              # Core functionality
├── test-02-validation.js         # Input validation, edge cases
├── test-03-advanced.js           # More complex features
├── test-integration-01-connect.js  # (Optional) Docker integration: connectivity
├── test-integration-02-crud.js     # (Optional) Docker integration: CRUD operations
├── test-live-01-completion.js     # (Optional) Live service test (requires token)
├── docker-compose.yml            # (Optional) Docker service for integration tests
├── mock-server.mjs               # (Optional) HTTP mock server for integration tests
├── rollup.config.mjs             # Rollup config (see template below)
├── run-node.mjs                  # Shared Node.js runner (see below)
├── package.json                  # Dependencies + rollup devDeps
└── results.md                    # Test results (created in Step 6)
```

### Test script format — dual-mode (Node.js + WASM)

Each test is an **ESM file** that exports a `run` function returning `"PASS: <description>"` or throwing on failure. This format works for both Node.js verification and WASM embedding (where the WIT exports `run: func() -> string`).

```js
// test-01-basic.js
import assert from 'assert';
import lib from '<package-name>';

export const run = () => {
    const result = lib.someFunction('input');
    assert.strictEqual(result, 'expected');
    return "PASS: someFunction works correctly";
};
```

**Important:** Always use `import` statements, not `require()`. Rollup's `@rollup/plugin-commonjs` converts CJS `require()` calls from dependencies into ESM imports, but test source files should use native ESM `import` for clarity and compatibility with both Node.js and the WASM runtime.

### Shared Node.js runner

Create `run-node.mjs` once per package directory:

```js
// run-node.mjs — runs a test file and prints the result (supports sync and async run())
const testFile = process.argv[2];
if (!testFile) { console.error('Usage: node run-node.mjs ./test-01-basic.js'); process.exit(1); }
const mod = await import(testFile);
try {
    const result = await mod.run();
    console.log(result);
    if (!result.startsWith('PASS')) process.exit(1);
} catch (e) {
    console.error('FAIL:', e.message || e);
    process.exit(1);
}
```

### Rollup config template

Create `rollup.config.mjs` in each package directory. This mirrors the production Golem CLI Rollup config:

```js
// rollup.config.mjs
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import fs from "fs";

// Discover all test-*.js files automatically
const testFiles = fs.readdirSync(".").filter(f => f.startsWith("test-") && f.endsWith(".js"));

// Node.js built-in modules — kept as external imports (the runtime provides them)
const nodeBuiltins = [
  "assert", "buffer", "child_process", "crypto", "dgram", "dns", "events",
  "fs", "http", "http2", "https", "module", "net", "os", "path",
  "perf_hooks", "querystring", "readline", "stream", "string_decoder",
  "tls", "url", "util", "v8", "vm", "worker_threads", "zlib",
];

const externalPackages = (id) => {
  // Keep Node.js built-ins as external imports
  const bare = id.replace(/^node:/, "");
  return nodeBuiltins.includes(bare);
};

export default testFiles.map((input) => ({
  input,
  output: {
    file: `dist/${input.replace(".js", ".bundle.js")}`,
    format: "esm",
    inlineDynamicImports: true,
    sourcemap: false,
  },
  external: externalPackages,
  plugins: [
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".node"],
    }),
    commonjs({
      include: ["node_modules/**"],
    }),
    json(),
  ],
}));
```

### ESM-only packages

Some modern npm packages (e.g., `got` v12+, `node-fetch` v3+, `chalk` v5+) only ship ESM — they have `"type": "module"` in their `package.json` and no CJS fallback. This is fine for our workflow because:

- **For Node.js testing:** Our test files are ESM (they use `export`), and Rollup handles resolving ESM dependencies during bundling.
- **For WASM bundling:** Rollup with `nodeResolve` + `commonjs` plugins inlines all imports (both ESM and CJS) into the final bundle.

No special handling is needed — Rollup resolves both CJS and ESM dependencies transparently during the bundle step.

## Step 4: Install Dependencies, Bundle, and Verify on Node.js

First install dependencies and bundle:

```bash
cd tests/libraries/<package-name>
npm install

# Bundle all test files at once using the rollup config
npx rollup -c rollup.config.mjs
```

Then verify the **bundled** output on Node.js:

```bash
node run-node.mjs ./dist/test-01-basic.bundle.js
node run-node.mjs ./dist/test-02-validation.bundle.js
# ... etc
```

**Important:** Always verify the *bundled* files, not the raw sources.

**Every test MUST pass on Node.js** before proceeding. If a test doesn't pass on Node.js, fix the test (not the library).

## Step 5: Run Tests Through wasm-rquickjs

### 5a. Build wasm-rquickjs

Before running any tests through the runtime, ensure the latest CLI is built:

```bash
# From the repo root
./cleanup-skeleton.sh
cargo build --release
```

This produces `./target/release/wasm-rquickjs`.

### 5b. Create a WIT file for the tests

Create a minimal WIT that exports a `run` function. Place it in `tests/libraries/<package-name>/wit/<package-name>.wit`:

```wit
package test:lib-<package-name>;

world lib-<package-name> {
  export run: func() -> string;
}
```

### 5c. Use the bundles from Step 4

The bundled test files in `dist/` (created and verified in Step 4) are ready to use. Each bundle is a self-contained ESM file with the library code inlined and Node.js built-ins preserved as ESM `import` statements for the runtime to resolve.

#### When bundling fails

If Rollup cannot bundle a library (native bindings, dynamic `require()`, WASM binaries, etc.), **do not attempt workarounds**. Record the failure in `results.md`:

```markdown
### Bundling

This library **cannot be bundled** with Rollup:
- **Error:** `<exact Rollup error>`
- **Reason:** Requires native N-API bindings / uses dynamic require() / loads .node files
- **Impact:** Library cannot be tested in the wasm-rquickjs runtime without a bundleable alternative
```

Mark the library as ❌ in `libraries.md` with note "Cannot bundle — requires native bindings" and skip Steps 5d–5e.

### 5d. Generate, compile, and run for each test

For each bundled test file:

```bash
# 1. Generate wrapper crate
./target/release/wasm-rquickjs generate-wrapper-crate \
  --js tests/libraries/<package-name>/dist/test-01-basic.bundle.js \
  --wit tests/libraries/<package-name>/wit \
  --output tmp/lib-test-<package-name>-01

# 2. Patch Cargo.toml features — disable "logging" (wasmtime CLI doesn't provide
#    wasi:logging), keep "http" and "sqlite" (required for compilation)
sed -i '' 's/default = \["http", "logging"\]/default = ["http", "sqlite"]/' \
  tmp/lib-test-<package-name>-01/Cargo.toml

# 3. Compile to WASM
cd tmp/lib-test-<package-name>-01
cargo-component build
cd ../..

# 4. Run with wasmtime
#    - --invoke 'run()' — parentheses are REQUIRED
#    - -S cli -S http -S inherit-network — provide WASI imports
#    - --invoke must come BEFORE the wasm path
wasmtime run --wasm component-model \
  -S cli -S http -S inherit-network \
  --invoke 'run()' \
  tmp/lib-test-<package-name>-01/target/wasm32-wasip1/debug/lib_test_<package_name>_01.wasm
```

**Do NOT write Rust test harnesses** for running library tests. Always use `wasmtime` CLI as shown above.

Capture stdout/stderr from each run. If the component fails to compile or run, record the exact error.

## Step 5.5: Docker-Based Integration Tests (Optional)

Many libraries (databases, message queues, caches, etc.) are designed to connect to an external service. The tests in Step 3–5 deliberately avoid external dependencies. This step adds **optional integration tests** that validate the library works end-to-end against a real, locally-running service via Docker.

### 5.5a. Determine if Docker testing is applicable

Check whether the library's primary use case involves communicating with a service that can be run locally via Docker. Common examples:

| Library type | Docker image | Port |
|---|---|---|
| PostgreSQL clients (`pg`, `postgres`, `slonik`) | `postgres:16-alpine` | 5432 |
| MySQL clients (`mysql2`, `mariadb`) | `mysql:8` or `mariadb:11` | 3306 |
| Redis clients (`ioredis`, `redis`) | `redis:7-alpine` | 6379 |
| MongoDB clients (`mongoose`, `mongodb`) | `mongo:7` | 27017 |
| Elasticsearch clients (`@elastic/elasticsearch`) | `elasticsearch:8.x` | 9200 |
| RabbitMQ clients (`amqplib`) | `rabbitmq:3-management-alpine` | 5672 |
| NATS clients (`nats`, `nats.ws`) | `nats:latest` | 4222 |
| Kafka clients (`kafkajs`) | `confluentinc/cp-kafka` | 9092 |
| MinIO/S3 clients (`@aws-sdk/client-s3`, `minio`) | `minio/minio` | 9000 |
| SMTP clients (`nodemailer`) | `mailhog/mailhog` | 1025 |

**Skip this step entirely** if:
- The library is a pure-computation library (validation, formatting, crypto utilities)
- The service requires paid/proprietary software with no Docker image
- The library is a server framework (Express, Fastify, etc.) — already excluded by the Golem constraint
- The library requires API keys to a cloud service that cannot be self-hosted (e.g., OpenAI, Stripe)

### 5.5b. Create `docker-compose.yml`

Place a `docker-compose.yml` in the test directory:

```yaml
# tests/libraries/<package-name>/docker-compose.yml
services:
  <service-name>:
    image: <docker-image>:<tag>
    ports:
      - "<host-port>:<container-port>"
    environment:
      # Use simple, deterministic credentials for testing
      <ENV_VAR>: <value>
    healthcheck:
      test: ["CMD", "<health-check-command>"]
      interval: 5s
      timeout: 5s
      retries: 10
    tmpfs:
      - /var/lib/<data-dir>  # Use tmpfs for speed — no persistent data needed
```

**Example for PostgreSQL (`pg`):**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "54320:5432"
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U testuser -d testdb"]
      interval: 5s
      timeout: 5s
      retries: 10
    tmpfs:
      - /var/lib/postgresql/data
```

**Rules for `docker-compose.yml`:**
- Use **non-standard host ports** (e.g., 54320 instead of 5432) to avoid conflicts with locally running services
- Use **deterministic, non-secret credentials** (these are ephemeral test containers)
- Always include a **healthcheck** so the startup script can wait for readiness
- Use **`tmpfs`** for data directories — no need for persistent volumes
- Use **Alpine-based images** where available for faster pulls

### 5.5c. Create integration test scripts

Create additional test scripts named `test-integration-*.js` in the same directory. These follow the same dual-mode format (export a `run` function) but connect to the locally running service:

```js
// test-integration-01-connect.js
import { Client } from 'pg';

export const run = async () => {
    const client = new Client({
        host: 'localhost',
        port: 54320,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
    });
    await client.connect();
    const res = await client.query('SELECT 1 + 1 AS result');
    await client.end();
    if (res.rows[0].result !== 2) throw new Error(`Expected 2, got ${res.rows[0].result}`);
    return "PASS: Connect and query PostgreSQL";
};
```

**Integration test rules:**
- **Hard-code the connection parameters** to match `docker-compose.yml` — no environment variable indirection
- Create **2–4 integration tests** covering: connection, basic CRUD, library-specific features (transactions, pub/sub, etc.)
- Tests must be **idempotent** — create tables/keys if they don't exist, clean up after themselves
- Handle **async operations** — integration tests will typically need `async run()` functions
- Use the same `PASS:`/`FAIL:` output convention

### 5.5d. Update Rollup config

The existing `rollup.config.mjs` already discovers `test-*.js` files automatically. The `test-integration-*.js` files match this glob, so they will be bundled automatically. No changes needed.

### 5.5e. Run integration tests

```bash
# Start the service
cd tests/libraries/<package-name>
docker compose up -d --wait

# Bundle (if not already done — the config picks up integration test files too)
npx rollup -c rollup.config.mjs

# Verify on Node.js first
node run-node.mjs ./dist/test-integration-01-connect.bundle.js
node run-node.mjs ./dist/test-integration-02-crud.bundle.js

# Run through wasm-rquickjs (same generate/compile/run flow as Step 5d)
# For each integration test bundle:
./target/release/wasm-rquickjs generate-wrapper-crate \
  --js tests/libraries/<package-name>/dist/test-integration-01-connect.bundle.js \
  --wit tests/libraries/<package-name>/wit \
  --output tmp/lib-test-<package-name>-int-01

sed -i '' 's/default = \["http", "logging"\]/default = ["http", "sqlite"]/' \
  tmp/lib-test-<package-name>-int-01/Cargo.toml

cd tmp/lib-test-<package-name>-int-01
cargo-component build
cd ../..

wasmtime run --wasm component-model \
  -S cli -S http -S inherit-network \
  --invoke 'run()' \
  tmp/lib-test-<package-name>-int-01/target/wasm32-wasip1/debug/lib_test_<package_name>_int_01.wasm

# Tear down
cd tests/libraries/<package-name>
docker compose down
```

**Important:**
- Always **start the service before running** and **tear it down after**
- Use `docker compose up -d --wait` to block until healthcheck passes
- If Docker is not available on the machine, skip this step and note it in `results.md`
- Use `timeout 60` for each test run to prevent hangs

### 5.5f. Handle async `run()` in WASM

The WIT definition from Step 5b (`run: func() -> string`) is synchronous. If integration tests need `async`, and the library supports it, the wrapper must await internally. The standard approach is:

```js
// test-integration-01-connect.js
export const run = async () => {
    // ... async operations ...
    return "PASS: description";
};
```

The wasm-rquickjs runtime handles top-level `async` `run()` functions — the QuickJS engine runs the microtask queue to completion. No special WIT changes are needed.

## Step 5.6: HTTP Mock Server Integration Tests (Optional)

Some libraries are **HTTP client libraries** (e.g., `axios`, `got`, `node-fetch`, `ky`, `superagent`, `undici`) or libraries whose core functionality involves making HTTP requests (e.g., REST API wrappers, GraphQL clients like `graphql-request`, webhook senders). For these, a simple local HTTP mock server provides much better test coverage than offline-only tests.

### 5.6a. Determine if HTTP mock testing is applicable

Use this approach when:
- The library's **primary purpose** is making HTTP requests
- The library wraps a REST/GraphQL API and you want to test its HTTP layer without real credentials
- The library transforms HTTP responses (parsing, retries, interceptors) and you need a server that returns controlled responses

**Skip this step** if:
- The library doesn't make HTTP requests
- The library can be fully tested with offline/computation-only tests
- Docker-based testing (Step 5.5) already covers the library's needs better (e.g., database clients)

### 5.6b. Create the mock server

Create a standalone `mock-server.mjs` in the test directory. The server should:
- Use **only `node:http`** — no frameworks, no npm dependencies
- Listen on a **non-standard port** (e.g., `18080`) to avoid conflicts
- Serve **deterministic, hard-coded responses** for known routes
- Support the HTTP methods the library uses (GET, POST, PUT, DELETE, PATCH, etc.)
- Include a `GET /health` endpoint for readiness checking
- Print the listening port to stdout so the test runner can detect when it's ready
- Handle unknown routes with a 404

```js
// mock-server.mjs — lightweight HTTP mock server for testing
import http from 'node:http';

const PORT = 18080;

const routes = {
  'GET /health': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  },
  'GET /api/users': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]));
  },
  'POST /api/users': (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 3, ...user }));
    });
  },
  'GET /api/error': (req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  },
  'GET /api/slow': (req, res) => {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ delayed: true }));
    }, 2000);
  },
};

const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];
  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
```

**Customize the routes** to match what the library tests need — add/remove endpoints, adjust response bodies, add headers (e.g., `Content-Type`, `Authorization` echo-back), simulate redirects (`301`/`302`), return streaming responses, etc.

### 5.6c. Create integration test scripts

Create test scripts named `test-integration-*.js` that make requests to the mock server:

```js
// test-integration-01-get.js
import axios from 'axios';
import assert from 'assert';

const BASE = 'http://localhost:18080';

export const run = async () => {
    const res = await axios.get(`${BASE}/api/users`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.length, 2);
    assert.strictEqual(res.data[0].name, 'Alice');
    return "PASS: GET request returns parsed JSON";
};
```

```js
// test-integration-02-post.js
import axios from 'axios';
import assert from 'assert';

const BASE = 'http://localhost:18080';

export const run = async () => {
    const res = await axios.post(`${BASE}/api/users`, { name: 'Charlie' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.name, 'Charlie');
    assert.strictEqual(res.data.id, 3);
    return "PASS: POST request sends and receives JSON";
};
```

```js
// test-integration-03-error-handling.js
import axios from 'axios';
import assert from 'assert';

const BASE = 'http://localhost:18080';

export const run = async () => {
    try {
        await axios.get(`${BASE}/api/error`);
        throw new Error('Should have thrown');
    } catch (e) {
        assert.strictEqual(e.response.status, 500);
        assert.strictEqual(e.response.data.error, 'Internal Server Error');
    }
    return "PASS: Error responses are handled correctly";
};
```

**Integration test rules:**
- **Hard-code `http://localhost:18080`** (or whatever port the mock server uses) — no environment variable indirection
- Tests must work with the **deterministic mock responses** — no random data
- Use `async run()` since HTTP requests are inherently async
- Follow the same `PASS:`/`FAIL:` output convention

### 5.6d. Run HTTP mock integration tests

The Rollup config automatically discovers `test-integration-*.js` files. Run the flow:

```bash
cd tests/libraries/<package-name>

# 1. Bundle (picks up integration test files automatically)
npx rollup -c rollup.config.mjs

# 2. Start the mock server in the background
node mock-server.mjs &
MOCK_PID=$!

# 3. Wait for the server to be ready
for i in $(seq 1 10); do
  curl -s http://localhost:18080/health > /dev/null && break
  sleep 0.5
done

# 4. Verify on Node.js first
node run-node.mjs ./dist/test-integration-01-get.bundle.js
node run-node.mjs ./dist/test-integration-02-post.bundle.js
node run-node.mjs ./dist/test-integration-03-error-handling.bundle.js

# 5. Run through wasm-rquickjs (same generate/compile/run flow as Step 5d)
# For each integration test bundle:
./target/release/wasm-rquickjs generate-wrapper-crate \
  --js tests/libraries/<package-name>/dist/test-integration-01-get.bundle.js \
  --wit tests/libraries/<package-name>/wit \
  --output tmp/lib-test-<package-name>-int-01

sed -i '' 's/default = \["http", "logging"\]/default = ["http", "sqlite"]/' \
  tmp/lib-test-<package-name>-int-01/Cargo.toml

cd tmp/lib-test-<package-name>-int-01
cargo-component build
cd ../..

wasmtime run --wasm component-model \
  -S cli -S http -S inherit-network \
  --invoke 'run()' \
  tmp/lib-test-<package-name>-int-01/target/wasm32-wasip1/debug/lib_test_<package_name>_int_01.wasm

# 6. Kill the mock server
kill $MOCK_PID 2>/dev/null
```

**Important:**
- Always **start the mock server before running tests** and **kill it after**
- Use `timeout 60` for each test run to prevent hangs
- If a test hangs, the mock server port may be occupied — kill stale processes on port 18080 before retrying
- The mock server runs as a **separate Node.js process** — it is NOT bundled or run inside WASM

### 5.6e. When to use HTTP mock vs Docker

| Scenario | Use HTTP Mock (5.6) | Use Docker (5.5) |
|---|---|---|
| HTTP client library (axios, got, fetch) | ✅ | ❌ |
| REST API wrapper (without real API key) | ✅ | ❌ |
| Database client (pg, redis, mongodb) | ❌ | ✅ |
| Message queue client (amqplib, kafkajs) | ❌ | ✅ |
| Library that speaks HTTP to a specific service | Consider either — mock if only HTTP matters, Docker if protocol-specific behavior matters | ✅ |

## Step 5.7: Live Service Integration Tests Using Tokens (Optional)

Some libraries are clients for real external services (e.g., OpenAI, Stripe, AWS, Twilio) and can only be meaningfully tested with live API calls. A **per-user token file** enables these tests when the user has provided credentials, without requiring API keys to be committed to the repository.

### Token file location and format

The token file lives at **`tests/libraries/.tokens.json`**. It is a flat JSON object mapping well-known service names to API keys or tokens:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "STRIPE_SECRET_KEY": "sk_test_...",
  "AWS_ACCESS_KEY_ID": "AKIA...",
  "AWS_SECRET_ACCESS_KEY": "...",
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "TWILIO_ACCOUNT_SID": "AC...",
  "TWILIO_AUTH_TOKEN": "..."
}
```

**Rules for the token file:**
- The file is **gitignored** — it must NEVER be committed (already in `.gitignore`)
- Key names should match the **standard environment variable names** the library expects
- The file is **optional** — tests must handle its absence gracefully
- Each user creates their own file locally; it is never shared

### 5.7a. Determine if live service testing is applicable

Use this approach when:
- The library is a **client for a specific external API** (LLM providers, payment processors, cloud services, email/SMS APIs)
- The library's core value is making API calls that cannot be replicated with a mock server (e.g., LLM completions, payment processing, cloud resource management)
- The user has provided the relevant token in `.tokens.json`

**Skip this step** if:
- No relevant token exists in `.tokens.json`
- The `.tokens.json` file doesn't exist
- The library can be fully tested offline, with a mock server, or with Docker

### 5.7b. Check for available tokens

At the start of Step 2 (Research), read `.tokens.json` to discover which tokens are available:

```js
// Conceptual — the agent reads this file, not the test script
import fs from 'fs';
const tokensPath = 'tests/libraries/.tokens.json';
const tokens = fs.existsSync(tokensPath)
  ? JSON.parse(fs.readFileSync(tokensPath, 'utf-8'))
  : {};
```

When researching a library, check if the library's required credentials are present. For example:
- Testing `openai` → look for `OPENAI_API_KEY`
- Testing `stripe` → look for `STRIPE_SECRET_KEY`
- Testing `@aws-sdk/client-s3` → look for `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

If the required token is **not present**, skip live service tests entirely and fall back to the offline-only approach described in "Handling Libraries That Require External Services or API Keys".

### 5.7c. Create live service integration test scripts

Create test scripts named `test-live-*.js`. These follow the same dual-mode format but read tokens from the environment (set by the runner):

```js
// test-live-01-completion.js
import OpenAI from 'openai';
import assert from 'assert';

export const run = async () => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply with exactly: HELLO' }],
        max_tokens: 10,
    });

    const text = response.choices[0].message.content.trim();
    assert.strictEqual(text, 'HELLO');
    return "PASS: Chat completion returns expected response";
};
```

**Live test rules:**
- **Read credentials from `process.env`** — the runner injects them (see 5.7d)
- **Minimize API usage** — use the cheapest models/tiers, smallest payloads, fewest calls possible
- **Use test/sandbox modes** when available (e.g., Stripe test keys, AWS LocalStack-compatible calls)
- **Never log, print, or include tokens in output** — not in `PASS:`/`FAIL:` messages, not in error messages
- **Make tests idempotent** — don't create resources that can't be cleaned up
- **Name tests `test-live-*.js`** to distinguish them from offline and integration tests

### 5.7d. Run live service tests

The Rollup config discovers `test-live-*.js` files automatically (they match `test-*.js`). The key difference is passing tokens as environment variables:

```bash
cd tests/libraries/<package-name>

# 1. Bundle
npx rollup -c rollup.config.mjs

# 2. Read tokens and export as environment variables
# (the agent reads .tokens.json and sets the relevant vars)
export OPENAI_API_KEY="$(cat ../../../tests/libraries/.tokens.json | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).OPENAI_API_KEY || '')")"

# 3. Verify on Node.js first
node run-node.mjs ./dist/test-live-01-completion.bundle.js

# 4. Run through wasm-rquickjs (same generate/compile/run flow as Step 5d)
./target/release/wasm-rquickjs generate-wrapper-crate \
  --js tests/libraries/<package-name>/dist/test-live-01-completion.bundle.js \
  --wit tests/libraries/<package-name>/wit \
  --output tmp/lib-test-<package-name>-live-01

sed -i '' 's/default = \["http", "logging"\]/default = ["http", "sqlite"]/' \
  tmp/lib-test-<package-name>-live-01/Cargo.toml

cd tmp/lib-test-<package-name>-live-01
cargo-component build
cd ../..

# Pass the env var through to wasmtime
OPENAI_API_KEY="$OPENAI_API_KEY" wasmtime run --wasm component-model \
  -S cli -S http -S inherit-network \
  --invoke 'run()' \
  tmp/lib-test-<package-name>-live-01/target/wasm32-wasip1/debug/lib_test_<package_name>_live_01.wasm
```

**Important:**
- Use `timeout 60` for each test run — live API calls can hang
- **Never echo or log the token values** in shell commands or output
- If a live test fails due to authentication errors, verify the token in `.tokens.json` is valid and not expired
- Live tests may incur **real costs** — keep API calls minimal

### 5.7e. Interaction with offline tests

Live service tests **supplement, not replace** offline tests. Always create offline tests first (Step 3) that exercise the library's API surface without credentials (object construction, request building, validation, configuration). Live tests add coverage for the actual API call path.

A typical test directory for a service-client library:

```
tests/libraries/openai/
├── test-01-client-init.js          # Offline: client construction, config
├── test-02-message-building.js     # Offline: message/request object creation
├── test-03-error-classes.js        # Offline: error types, validation
├── test-live-01-completion.js      # Live: real API call (requires OPENAI_API_KEY)
├── test-live-02-embedding.js       # Live: embedding API (requires OPENAI_API_KEY)
├── mock-server.mjs                 # (Optional) mock for HTTP-layer testing
├── rollup.config.mjs
├── run-node.mjs
├── package.json
└── results.md
```

## Step 6: Record Results

### Update `tests/libraries/<package-name>/results.md`

Create a detailed results file:

```markdown
# <Package Name> Compatibility Test Results

**Package:** `<npm-name>`
**Version:** `<version>`
**Tested on:** <date>

## Test Results

### test-01-basic.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `<exact error message>`
- **Root cause:** Missing `node:xyz` API / Unsupported feature / Behavioral difference

### test-02-validation.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

## Integration Tests (Docker)

> This section is only present when Docker-based integration tests were run (see Step 5.5).

**Service:** `<docker-image>:<tag>` on port `<host-port>`

### test-integration-01-connect.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-crud.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `<exact error message>`
- **Root cause:** <explanation>

## Integration Tests (HTTP Mock)

> This section is only present when HTTP mock server integration tests were run (see Step 5.6).

**Mock server:** `mock-server.mjs` on port `18080`

### test-integration-01-get.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-integration-02-post.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `<exact error message>`
- **Root cause:** <explanation>

## Live Service Tests

> This section is only present when live service tests were run using tokens from `.tokens.json` (see Step 5.7).

**Token(s) used:** `OPENAI_API_KEY` (do NOT include the actual token value)

### test-live-01-completion.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ✅ PASS

### test-live-02-embedding.js — <description>
- **Node.js:** ✅ PASS
- **wasm-rquickjs:** ❌ FAIL
- **Error:** `<exact error message>`
- **Root cause:** <explanation>

## Summary

- Offline tests passed: X/Y
- Integration tests passed: X/Y (or "N/A — no Docker service applicable" / "N/A — Docker not available" / "N/A — HTTP mock not applicable")
- Live service tests passed: X/Y (or "N/A — no tokens available" / "N/A — not a service client library")
- Missing APIs: `node:xyz.someMethod`, `node:abc.otherMethod`
- Behavioral differences: <list>
- Blockers: <list of issues preventing the library from working>
```

### Clean up the `tmp` directory

After all tests are complete (whether they passed or failed), remove the temporary build artifacts:

```bash
rm -rf tmp/lib-test-<package-name>-*
```

### Update `tests/libraries/libraries.md`

**⚠️ Use `edit_file` to update ONLY the specific library's row.** Never overwrite the entire file — it contains ~100 library entries that would be lost.

Update the library's row in the tracker table:

- **Status:** Set to ✅, ⚠️, or ❌ based on results
  - ✅ = All tests pass
  - ⚠️ = Some tests pass, some fail (partially working)
  - ❌ = No tests pass or critical functionality broken
- **Tested On:** Set to today's date (YYYY-MM-DD)
- **Notes:** Brief summary of issues (e.g., "Missing `crypto.timingSafeEqual`; core validation works")

## Golem Execution Model Constraint

The wasm-rquickjs runtime powers **Golem applications**. In Golem, components **cannot bind or start their own HTTP/TCP servers**. They define exported functions (agents with methods), and the Golem runtime exposes them via HTTP, MCP, etc.

This means:
- **Do NOT create tests that start servers** (e.g., `app.listen(3000)`, `http.createServer()`, `server.bind()`)
- If a library's **primary purpose** is running a server (Express, Fastify, Koa, Hapi, etc.), document this in `results.md`:

```markdown
## Golem Compatibility

This library is fundamentally a server framework that requires binding to a port via
`app.listen()`. In the Golem execution model, components cannot start their own servers —
they export functions that the Golem runtime exposes. This library **cannot be used** in
its standard way in Golem applications.
```

- If a library has **both server and non-server features**, test only the non-server parts. For example, a validation library bundled with a framework middleware — test the validation, skip the middleware.
- Mark server-only libraries as ❌ in `libraries.md` with note "Requires server binding — incompatible with Golem model"

## Handling Libraries That Require External Services or API Keys

Some libraries (e.g., cloud SDKs, payment APIs, LLM clients) cannot be meaningfully tested without external credentials or running services.

**First, check `tests/libraries/.tokens.json`** — if the user has provided the relevant token, use Step 5.7 (Live Service Integration Tests) to test against the real service. This is the preferred approach when tokens are available.

When no token is available:

1. **Still create test scripts** that exercise as much of the library as possible without live credentials — e.g., object construction, request building, validation, configuration parsing, error handling
2. **Document the limitation clearly** in `results.md` under a `## Untestable Features` section:

```markdown
## Untestable Features

The following features could not be tested without external dependencies:

- **API calls to OpenAI** — Requires an `OPENAI_API_KEY` obtained by registering at https://platform.openai.com. Without a valid key, all API calls return authentication errors.
- **Streaming completions** — Depends on a live API connection; cannot be tested offline.

To fully test this library, a user would need to:
1. Register at <URL>
2. Obtain an API key
3. Set the environment variable `OPENAI_API_KEY=<key>`
4. Re-run the test scripts that are marked as requiring credentials
```

3. **Mark the library status** in `libraries.md` as ⚠️ with a note like "Partially tested — API calls require credentials"

## Package.json Template

The `package.json` for each test directory should include Rollup and its plugins as dev dependencies:

```json
{
  "private": true,
  "dependencies": {
    "<package-name>": "<version>"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^28.0.0",
    "@rollup/plugin-json": "^6.1.0",
    "@rollup/plugin-node-resolve": "^16.0.0",
    "rollup": "^4.0.0"
  }
}
```

## Important Rules

1. **Do NOT attempt to fix any issues** — only document them
2. **Do NOT modify skeleton code, built-in modules, or runtime code**
3. **Every test must pass on Node.js first** — the test validates the library works, the WASM run validates our runtime
4. **Use the exact error messages** from the WASM runtime in the results
5. **Add `dist/` and `node_modules/` to `.gitignore`** in the test directory
6. **Keep tests minimal** — test the library's API, not complex application scenarios
7. **Use the dual-mode ESM format** — tests export a `run` function and use `import` for all imports (see Step 3)
8. **Always use wasmtime CLI to run tests** — do NOT write Rust test harnesses in `tests/runtime/`
9. **Always use `edit_file` to update `libraries.md`** — never overwrite the entire file
10. **Always use Rollup for bundling** — do NOT use esbuild; Rollup matches the production Golem CLI toolchain
11. **Always run tests with a timeout** — use `timeout 60` (or similar) when running tests both on Node.js and via wasmtime to prevent hanging on tests that wait for network/IO that will never arrive
12. **Always tear down Docker services** — run `docker compose down` after integration tests, even if tests fail
13. **Integration tests are optional** — only create them when the library's primary purpose involves a Docker-hostable service or HTTP requests; never force integration tests for pure-computation libraries
14. **Always kill the mock server** — run `kill $MOCK_PID` after HTTP mock integration tests, even if tests fail
15. **Mock servers are Node.js-only** — the `mock-server.mjs` runs as a separate Node.js process on the host; it is never bundled or run inside WASM
16. **NEVER commit `.tokens.json`** — it is gitignored; never stage, commit, or display token values in output, logs, results, or error messages
17. **Live tests are opportunistic** — only run them when the required token exists in `.tokens.json`; never ask the user to provide tokens or fail because they're missing
18. **Minimize live API costs** — use cheapest models/tiers, smallest payloads, and fewest calls possible in `test-live-*.js` scripts

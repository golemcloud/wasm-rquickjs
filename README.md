# wasm-rquickjs

## Introduction

Command line tool and library to generate a Rust crate wrapping JavaScript code into a WebAssembly Component using the
QuickJS engine.

### Comparison with ComponentizeJS

[ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS) achieves the same goal of wrapping JavaScript code
into
a WebAssembly Component, but it does it using a modified version of the SpiderMonkey engine.

Advantages of wasm-rquickjs over ComponentizeJS:

- At the time of writing, there are known bugs in ComponentizeJS (or one of its underlying modules) that prevents it
  from being used in production.
- Much simpler to develop and debug, as everything exposed for JavaScript is implemented in async Rust using
  the [rquickjs library](https://github.com/DelSkayn/rquickjs)
- The WIT-JS mapping rules and the set of available JavaScript APIs are well defined
- Smaller WASM binary size

Advantages of ComponentizeJS over wasm-rquickjs:

- Faster runtime (due to the SpiderMonkey engine)
- Faster startup time (it does pre-initialization with Wizer)
- No need for the Rust toolchain for end users

### Comparison with wasmedge-quickjs

The project is similar to [wasmedge-quickjs](https://github.com/second-state/wasmedge-quickjs/) in using te QuickJS
engine compiled to WASM
to run JavaScript code, but it is different in the following ways:

- It does not provide support for using the component model from JS (defining imports and exports using WIT)
- The imports the resulting WASM component has are WasmEdge specific

## Usage

The tool can be used as a command line tool or as a library. The command line tool has two top level commands:

```
  generate-wrapper-crate  Generate the wrapper crate for a JavaScript module
  generate-dts            Generate TypeScript module definitions
```

### Generating the wrapper crate

This is the primary command that generates the Rust crate embedding the JavaScript code into a WebAssembly Component.

```
Usage: wasm-rquickjs generate-wrapper-crate --js <JS> --wit <WIT> --output <OUTPUT>
```

- The `--js` arguments is the path to the JavaScript file to be wrapped. There can be only one JavaScript file,
  containing an ES6 module exporting the necessary functions and classes as described below.
- The `--wit` argument is the path to the WIT root containing a single world that describes the imports and exports of
  the component
- The `--output` argument is the path to the output directory where the generated Rust crate will be created.

The output directory is going to contain a self-contained Rust crate that can be compiled into a WASM component using
the [cargo-component](https://github.com/bytecodealliance/cargo-component) tool.

The generated crate has some **features** that control what imports the component will have beside the ones defined in
the user's WIT world:

- `logging`: enables the `wasi:logging` import to be used for the JavaScript `console` API
- `http`: enables the `wasi:http` import to be used for the JavaScript `fetch` API
- `sqlite`: enables the `node:sqlite` module with an embedded SQLite database engine

By default `logging` and `http` are enabled. The `sqlite` feature must be explicitly enabled.

### Generating TypeScript module definitions

The `generate-dts` command generates TypeScript module definitions for all the exported and imported interfaces:

```
Usage: wasm-rquickjs generate-dts --wit <WIT> --output <OUTPUT>
```

- The `--wit` argument is the path to the WIT root containing a single world that describes the imports and exports of
  the component.
- The `--output` argument is the path to the output directory where the generated TypeScript module definitions (
  `.d.ts`) will be created.

### Using with Golem

`wasm-rquickjs` is integrated into [Golem](https://golem.cloud)'s command line interface, so it can be directly used
using Golem app templates.

## Mappings

### Exports

#### Top level exported functions

The following WIT code:

```wit
package demo:pkg;

world example {
  export hello: func() -> string;
}
```

must be implemented in JavaScript as:

```javascript
export const hello = () => {
    return "Hello, world!";
};
``` 

The `this` is bound to the module object. The JS function name is always in camelCase.

#### Exported interfaces

Exported interfaces has to be exported from JavaScript as objects:

The following WIT example:

```wit
package demo:pkg;

interface sample-api {
  get-string-length: func(value: string) -> u64;
}

world example {
  export sample-api;
}
```

has to be implemented in JavaScript as:

```javascript
export const sampleApi = {
    getStringLength: (value) => {
        return value.length;
    }
};
```

All names are converted to camelCase. The JavaScript `this` is bound to object representing the exporter interface, in
the above example it is `sampleApi`.

#### Exported resources

Exported resources are implemented as **classes** in JS:

The following WIT example:

```wit
package demo:pkg;

interface iface {
  resource example-resource {
    constructor(name: string);
    get-name: func() -> string;
    compare: static func(h1: borrow<example-resource>, h2: borrow<example-resource>) -> s32;
    merge: static func(h1: own<example-resource>, h2: own<example-resource>) -> hello;
  }
}

world example {
  export iface;
}
```

Must be exported from JavaScript in the following way:

```js
class Hello {
    constructor(name) {
        this.name = name;
    }

    // async to demonstrate it is possible
    async getName() {
        return this.name;
    }

    static compare(h1, h2) {
        if (h1.name === h2.name) {
            return 0;
        } else if h1.name < h2.name) {
            return -1;
        } else {
            return 1;
        }
    }

    static merge(h1, h2) {
        return new Hello(`${h1.name} & ${h2.name}`);
    }
}

export const iface = {
    Hello: Hello,
};
```

The classes have a UpperCamelCase name and their methods are in camelCase. All methods and static methods can be either
sync or async.

### Types

| Name                    | WIT                 | JS                                                | Notes                                                                         |
|-------------------------|---------------------|---------------------------------------------------|-------------------------------------------------------------------------------|
| Character               | `char`              | `string`                                          | -                                                                             |
| String                  | `string`            | `string`                                          | -                                                                             |
| Signed 8-bit integer    | `s8`                | `number`                                          | -                                                                             |
| Unsigned 8-bit integer  | `u8`                | `number`                                          | -                                                                             |
| Signed 16-bit integer   | `s16`               | `number`                                          | -                                                                             |
| Unsigned 16-bit integer | `u16`               | `number`                                          | -                                                                             |
| Signed 32-bit integer   | `s32`               | `number`                                          | -                                                                             |
| Unsigned 32-bit integer | `u32`               | `number`                                          | -                                                                             |
| Signed 64-bit integer   | `s64`               | `bigint`                                          | -                                                                             |
| Unsigned 64-bit integer | `u64`               | `bigint`                                          | -                                                                             |
| 32-bit float            | `f32`               | `number`                                          | -                                                                             |
| 64-bit float            | `f64`               | `number`                                          | -                                                                             |
| Optional type           | `option<T>`         | `T \| undefined`                                  | Nested options are encoded differently                                        |
| List                    | `list<T>`           | `T[]`                                             | -                                                                             |
| Result                  | `result<T, E>`      | `{ tag: "ok": val: T } \| { tag: "err", val: E }` | -                                                                             |
| Tuple                   | `tuple<A, B, C>`    | Array                                             | -                                                                             |
| Enum                    | `enum { a, b, c}`   | `"a" \| "b" \| "c"`                               | The strings match the WIT enum cases                                          |
| Flags                   | `flags { a, b, c }` | `{ a: boolean, b: boolean, c: boolean }`          | The object keys are camelCase                                                 |
| Record                  | `record { .. }`     | Object                                            | Field names are camelCase                                                     |
| Variant                 | `variant { .. }`    | `{ tag: "x", val: X }`                            | Tag names match the WIT variant case names; `val` is undefined for unit cases |

### Limitations

- Maximum number of function parameters is 26
- Anonymous interface exports/imports are not supported
- Imported individual functions into the world are not supported (only whole interfaces)

## Available JavaScript APIs

### APIs

#### Web Platform APIs

<details>
<summary><strong>Console</strong></summary>

If the `logging` feature flag is enabled in the generated crate, it depends on `wasi:logging`, otherwise just on the core WASI interfaces.

- `assert`, `clear`, `count`, `countReset`, `debug`, `dir`, `dirXml`, `error`, `group`, `groupCollapsed`, `groupEnd`, `info`, `log`, `table`, `time`, `timeEnd`, `timeLog`, `trace`, `warn`

</details>

<details>
<summary><strong>HTTP (fetch)</strong></summary>

Only if the `http` feature flag is enabled in the generated crate. It depends on `wasi:http`.

- `fetch`, `Headers`, `Request`, `Response`, `FormData`, `Blob`, `File`

</details>

<details>
<summary><strong>URL</strong></summary>

- `URL` (`createObjectURL`, `revokeObjectURL`)
- `URLSearchParams`

</details>

<details>
<summary><strong>Streams</strong></summary>

Implemented by https://github.com/MattiasBuelens/web-streams-polyfill

- `ByteLengthQueuingStrategy`, `CountQueuingStrategy`
- `ReadableStream`, `ReadableStreamDefaultReader`, `ReadableStreamBYOBReader`, `ReadableStreamDefaultController`, `ReadableByteStreamController`, `ReadableStreamBYOBRequest`
- `WritableStream`, `WritableStreamDefaultController`
- `TransformStream`, `TransformStreamDefaultController`

</details>

<details>
<summary><strong>Timers</strong></summary>

- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `setImmediate`

</details>

<details>
<summary><strong>Abort Controller</strong></summary>

- `AbortController`, `AbortSignal`, `DOMException`

</details>

<details>
<summary><strong>Encoding</strong></summary>

- `TextEncoder`, `TextDecoder`, `TextDecoderStream`, `TextEncoderStream`

</details>

<details>
<summary><strong>Messaging</strong></summary>

- `MessageChannel`, `MessagePort`

</details>

<details>
<summary><strong>Events</strong></summary>

- `Event`, `EventTarget`, `CustomEvent`

</details>

<details>
<summary><strong>Intl (Internationalization)</strong></summary>

Minimal en-US implementation for library compatibility. All locale inputs are accepted but resolved to `en-US`.

- `Intl.DateTimeFormat` — `format()`, `formatToParts()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.NumberFormat` — `format()`, `formatToParts()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.Collator` — `compare()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.PluralRules` — `select()`, `selectRange()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.getCanonicalLocales()`, `Intl.supportedValuesOf()`

When the `timezone` feature is enabled (default), `DateTimeFormat` supports all ~590 IANA timezones via `chrono-tz`.

</details>

<details>
<summary><strong>Crypto (global)</strong></summary>

- `crypto.randomUUID`, `crypto.getRandomValues`

</details>

<details>
<summary><strong>Structured Clone</strong></summary>

Implemented by https://github.com/ungap/structured-clone — `structuredClone`

</details>

#### Node.js-Compatible Modules

<details>
<summary><strong><code>node:assert</code></strong></summary>

- `ok`, `equal`, `notEqual`, `strictEqual`, `notStrictEqual`
- `deepEqual`, `notDeepEqual`, `deepStrictEqual`, `notDeepStrictEqual`, `partialDeepStrictEqual`
- `throws`, `doesNotThrow`, `rejects`, `doesNotReject`
- `ifError`, `match`, `doesNotMatch`, `fail`
- `AssertionError`, `CallTracker`
- `strict` — strict mode variant (re-maps `equal` → `strictEqual`, `deepEqual` → `deepStrictEqual`, etc.)

</details>

<details>
<summary><strong><code>node:async_hooks</code></strong></summary>

- `AsyncLocalStorage` — `run`, `exit`, `getStore`, `enterWith`, `disable`, `snapshot`, `bind`
- `AsyncResource` — `runInAsyncScope`, `asyncId`, `triggerAsyncId`, `bind`
- `createHook` — stub (returns enable/disable no-ops)
- `executionAsyncId`, `triggerAsyncId`, `executionAsyncResource` — stubs

Context propagation works through `Promise.prototype.then/catch/finally` and `setTimeout`/`setInterval`. **Limitation:** QuickJS `await` uses internal C-level `perform_promise_then` which bypasses JS-visible `Promise.prototype.then`, so context is **not** propagated across `await` boundaries.

</details>

<details>
<summary><strong><code>node:buffer</code></strong></summary>

- `Buffer`, `Blob`, `File`, `SlowBuffer`
- `resolveObjectURL`, `isAscii`, `isUtf8`
- `INSPECT_MAX_BYTES`, `kMaxLength`, `kStringMaxLength`, `constants`

</details>

<details>
<summary><strong><code>node:child_process</code></strong> (stub)</summary>

Compatibility stubs — all spawn/exec functions throw `ENOSYS` since WASI does not support process creation.

- `ChildProcess`, `exec`, `execFile`, `fork`, `spawn`, `execSync`, `execFileSync`, `spawnSync`

</details>

<details>
<summary><strong><code>node:cluster</code></strong> (stub)</summary>

Compatibility stubs — clustering is not supported in WASM.

- `isPrimary`, `isMaster`, `isWorker`, `fork`, `disconnect`, `setupPrimary`

</details>

<details>
<summary><strong><code>node:constants</code></strong></summary>

Merged constants from `os.constants`, `fs.constants`, and `crypto.constants` (signal numbers, errno values, file flags, etc.)

</details>

<details>
<summary><strong><code>node:crypto</code></strong></summary>

- **Hashing:** `createHash`, `createHmac`, `hash`, `getHashes`
- **Ciphers:** `createCipheriv`, `createDecipheriv`, `getCiphers`
  - Supported: aes-128/256-cbc, aes-128/256-ctr, aes-128/256-gcm, aes-128/192/256-wrap, id-aes128/192/256-wrap, id-aes128/192/256-wrap-pad, des-ede3-cbc, des3-wrap, chacha20-poly1305
- **Signing:** `createSign`, `createVerify` (Ed25519, ECDSA with P-256, P-384, secp256k1)
- **Keys:** `createPublicKey`, `createPrivateKey`, `createSecretKey`, `KeyObject`, `generateKeyPairSync`, `generateKeyPair`
- **ECDH:** `createECDH`, `ECDH`, `diffieHellman`, `getCurves`
- **Certificate:** `Certificate` (`verifySpkac`, `exportPublicKey`, `exportChallenge`)
- **Random:** `randomBytes`, `randomFillSync`, `randomFill`, `randomInt`, `randomUUID`, `pseudoRandomBytes`, `prng`, `rng`
- **KDF:** `pbkdf2`, `pbkdf2Sync`, `scrypt`, `scryptSync`, `hkdf`, `hkdfSync`
- **Primes:** `generatePrime`, `generatePrimeSync`, `checkPrime`, `checkPrimeSync`
- **Other:** `timingSafeEqual`, `getFips`, `setFips`, `secureHeapUsed`

</details>

<details>
<summary><strong><code>node:dgram</code></strong></summary>

UDP datagram sockets built on WASI sockets.

- `dgram.createSocket(type[, listener])` — create a UDP socket (`udp4` or `udp6`)
- `socket.bind`, `socket.send`, `socket.sendto`, `socket.connect`, `socket.disconnect`, `socket.close`
- `socket.address()`, `socket.remoteAddress()`
- `socket.setTTL`, `socket.setRecvBufferSize` / `getRecvBufferSize`, `socket.setSendBufferSize` / `getSendBufferSize`
- `socket.ref()` / `socket.unref()` — no-op
- Events: `message`, `listening`, `close`, `error`, `connect`

**Not supported:** multicast operations (`setBroadcast`, `setMulticastTTL`, `addMembership`, etc.) throw `ENOSYS`.

</details>

<details>
<summary><strong><code>node:diagnostics_channel</code></strong></summary>

Publish/subscribe diagnostic messaging and tracing.

- `channel(name)`, `subscribe(name, onMessage)`, `unsubscribe(name, onMessage)`, `hasSubscribers(name)`, `tracingChannel(name)`
- `Channel` — `subscribe`, `unsubscribe`, `publish`, `bindStore`, `unbindStore`, `runStores`, `hasSubscribers`, `name`
- `TracingChannel` — `subscribe`, `unsubscribe`, `hasSubscribers`, `traceSync`, `tracePromise`, `traceCallback`

Built-in HTTP diagnostics channels: `http.client.request.created`, `http.client.request.start`, `http.client.request.error`, `http.client.response.finish`.

</details>

<details>
<summary><strong><code>node:dns</code></strong></summary>

DNS resolution via WASI sockets.

- `lookup`, `lookupService`, `resolve`, `resolve4`, `resolve6`
- `resolveAny`, `resolveCname`, `resolveCaa`, `resolveMx`, `resolveNaptr`, `resolveNs`, `resolvePtr`, `resolveSoa`, `resolveSrv`, `resolveTxt`, `resolveTlsa`
- `reverse`, `setServers`, `getServers`, `setDefaultResultOrder`, `getDefaultResultOrder`
- `Resolver` class
- `promises` — promise-based API
- Error constants: `NODATA`, `FORMERR`, `SERVFAIL`, `NOTFOUND`, `NOTIMP`, `REFUSED`, `BADQUERY`, `BADNAME`, `BADFAMILY`, `BADRESP`, `CONNREFUSED`, `TIMEOUT`, `EOF`, `FILE`, `NOMEM`, `DESTRUCTION`, `BADSTR`, `BADFLAGS`, `NONAME`, `BADHINTS`, `NOTINITIALIZED`, `LOADIPHLPAPI`, `ADDRGETNETWORKPARAMS`, `CANCELLED`, `ADDRCONFIG`, `V4MAPPED`, `ALL`

</details>

<details>
<summary><strong><code>node:domain</code></strong></summary>

Deprecated error-handling domains (sync-only).

- `domain.create()` / `domain.createDomain()`, `domain.active`, `domain._stack`
- `Domain` class (extends `EventEmitter`): `run`, `add`, `remove`, `bind`, `intercept`, `enter`, `exit`, `dispose`, `members`, `parent`
- `process.domain` — reflects active domain
- Error decoration: `error.domain`, `error.domainEmitter`, `error.domainBound`, `error.domainThrown`
- EventEmitter integration and async propagation via `process.nextTick`, `setTimeout`, `setInterval`

**Limitation:** No async context propagation via `async_hooks` — only synchronous errors and explicitly bound callbacks are captured.

</details>

<details>
<summary><strong><code>node:events</code></strong></summary>

- `EventEmitter` — `on`, `once`, `off`, `addListener`, `removeListener`, `removeAllListeners`, `emit`, `listenerCount`, `eventNames`, `listeners`, `rawListeners`, `prependListener`, `prependOnceListener`, `setMaxListeners`, `getMaxListeners`
- Static: `once`, `on`, `getEventListeners`, `getMaxListeners`, `setMaxListeners`, `addAbortListener`, `errorMonitor`, `captureRejections`
- `Event`, `EventTarget`, `CustomEvent`

</details>

<details>
<summary><strong><code>node:fs</code></strong></summary>

Comprehensive filesystem API built on WASI filesystem.

- **Sync:** `readFileSync`, `writeFileSync`, `appendFileSync`, `openSync`, `closeSync`, `readSync`, `writeSync`, `ftruncateSync`, `fsyncSync`, `fdatasyncSync`, `statSync`, `lstatSync`, `fstatSync`, `statfsSync`, `readdirSync`, `accessSync`, `existsSync`, `realpathSync`, `truncateSync`, `copyFileSync`, `linkSync`, `symlinkSync`, `readlinkSync`, `chmodSync`, `fchmodSync`, `lchmodSync`, `chownSync`, `fchownSync`, `lchownSync`, `utimesSync`, `futimesSync`, `lutimesSync`, `unlinkSync`, `renameSync`, `mkdirSync`, `rmdirSync`, `rmSync`, `mkdtempSync`, `opendirSync`, `readvSync`, `writevSync`, `cpSync`
- **Async (callback):** `readFile`, `writeFile`, `appendFile`, `open`, `close`, `read`, `write`, `stat`, `lstat`, `fstat`, `statfs`, `ftruncate`, `fsync`, `fdatasync`, `readdir`, `access`, `exists`, `realpath`, `truncate`, `copyFile`, `link`, `symlink`, `readlink`, `chmod`, `fchmod`, `lchmod`, `chown`, `fchown`, `lchown`, `utimes`, `futimes`, `lutimes`, `unlink`, `rename`, `mkdir`, `rmdir`, `rm`, `mkdtemp`, `opendir`, `watch`, `watchFile`, `unwatchFile`, `readv`, `writev`, `cp`, `openAsBlob`
- **Streams:** `createReadStream`, `createWriteStream`
- **Classes:** `Stats`, `Dirent`, `Dir`, `FSWatcher`, `StatWatcher`, `ReadStream`, `WriteStream`
- **Constants:** `F_OK`, `R_OK`, `W_OK`, `X_OK`, `O_RDONLY`, `O_WRONLY`, `O_RDWR`, `O_CREAT`, `O_EXCL`, `O_TRUNC`, `O_APPEND`, etc.

</details>

<details>
<summary><strong><code>node:fs/promises</code></strong></summary>

Promise-based filesystem API.

- `FileHandle`, `open`, `readFile`, `writeFile`, `appendFile`, `unlink`, `rename`, `mkdir`, `rmdir`, `rm`, `stat`, `lstat`, `readdir`, `opendir`, `access`, `realpath`, `truncate`, `copyFile`, `link`, `symlink`, `readlink`, `chmod`, `lchmod`, `chown`, `lchown`, `utimes`, `lutimes`, `mkdtemp`, `cp`, `watch`, `statfs`, `constants`

</details>

<details>
<summary><strong><code>node:http</code> / <code>node:https</code></strong></summary>

Requires the `http` feature flag. Client requests use `wasi:http` (TLS handled transparently). Server support uses `wasi:sockets` for TCP-level HTTP/1.1 serving.

- `http.request(url|options[, callback])`, `http.get(url|options[, callback])`
- `http.METHODS`, `http.STATUS_CODES`, `http.maxHeaderSize`
- `http.validateHeaderName`, `http.validateHeaderValue`
- `http.Agent`, `http.globalAgent`
- `http.OutgoingMessage` — base class for writable HTTP message objects
- `http.ClientRequest` — `write`, `end`, `setHeader`, `getHeader`, `removeHeader`, `hasHeader`, `getHeaderNames`, `getHeaders`, `getRawHeaderNames`, `flushHeaders`, `setNoDelay`, `setSocketKeepAlive`, `abort`, `destroy`, `setTimeout`
- `http.IncomingMessage` — `statusCode`, `statusMessage`, `headers`, `rawHeaders`, `httpVersion`
- `https.request` / `https.get` — delegates to `http` (WASI-HTTP handles TLS transparently)
- `http.createServer([options][, requestListener])` — create an HTTP/1.1 server (requires `wasi:sockets`)
- `http.Server` (extends `net.Server`): `listen`, `close`, `closeAllConnections`, `closeIdleConnections`, `setTimeout`
- `http.ServerResponse` (extends `EventEmitter`): `writeHead`, `setHeader`, `getHeader`, `removeHeader`, `hasHeader`, `getHeaders`, `getHeaderNames`, `getRawHeaderNames`, `write`, `end`, `flushHeaders`, `writeContinue`, `cork`, `uncork`
- Server-side `IncomingMessage` (extends `stream.Readable`): `method`, `url`, `headers`, `headersDistinct`, `rawHeaders`, `httpVersion`, `socket`, `complete`, `aborted`, `trailers`
- `node:_http_common` — `_checkIsHttpToken`, `_checkInvalidHeaderChar`
- Supported features: keep-alive connections, chunked transfer encoding, content-length bodies, sequential request pipelining, idle connection cleanup

**Not yet supported:** HTTP Upgrade, 1xx informational events, server-side timeout enforcement, `https.createServer()` / HTTPS server, client `lookup` / `autoSelectFamily` options.

**WebSocket support:** Available through the `golem` feature flag using Golem's WebSocket API.

</details>

<details>
<summary><strong><code>node:http2</code></strong> (stub)</summary>

Compatibility stubs — HTTP/2 is not supported.

- `connect`, `createServer`, `createSecureServer`, `Http2ServerRequest`, `Http2ServerResponse`

</details>

<details>
<summary><strong><code>node:inspector</code></strong> (stub)</summary>

Compatibility stubs — no V8 inspector in WASM.

- `Session`, `open`, `close`, `url`, `waitForDebugger`, `console`, `Network`

</details>

<details>
<summary><strong><code>node:module</code></strong></summary>

- `require`, `createRequire`, `builtinModules`, `isBuiltin`, `runMain`, `_nodeModulePaths`

</details>

<details>
<summary><strong><code>node:net</code></strong></summary>

TCP sockets and servers built on WASI sockets.

- `net.createServer([options][, connectionListener])`, `net.createConnection(options[, connectListener])`, `net.connect(...)`
- `net.isIP(input)` / `net.isIPv4(input)` / `net.isIPv6(input)`
- `net.getDefaultAutoSelectFamily()` / `net.setDefaultAutoSelectFamily(value)` — stubs
- `net.Socket` (extends `stream.Duplex`): `connect`, `write`, `end`, `destroy`, `resetAndDestroy`, `setTimeout`, `setNoDelay`, `setKeepAlive`, `address`, `ref`, `unref`
  - Properties: `remoteAddress`, `remotePort`, `remoteFamily`, `localAddress`, `localPort`, `localFamily`, `bytesRead`, `bytesWritten`, `connecting`, `pending`, `readyState`
  - Events: `connect`, `ready`, `data`, `end`, `close`, `error`, `timeout`, `drain`, `lookup`
- `net.Server` (extends `EventEmitter`): `listen`, `close`, `address`, `getConnections`, `ref`, `unref`
  - Properties: `listening`, `maxConnections`
  - Events: `listening`, `connection`, `close`, `error`, `drop`
- `net.BlockList`, `net.SocketAddress`, `net.Stream`

**Not supported:** IPC/Unix domain sockets, Happy Eyeballs/`autoSelectFamily` (stubbed), `cluster` integration.

</details>

<details>
<summary><strong><code>node:os</code></strong></summary>

- `arch`, `platform`, `type`, `release`, `version`, `machine`, `hostname`, `homedir`, `tmpdir`, `endianness`
- `cpus`, `loadavg`, `freemem`, `totalmem`, `uptime`, `availableParallelism`
- `networkInterfaces`, `userInfo`, `getPriority`, `setPriority`
- `EOL`, `devNull`, `constants` (signals, errno, priority)

</details>

<details>
<summary><strong><code>node:path</code></strong></summary>

- `sep`, `delimiter`, `basename`, `dirname`, `extname`, `isAbsolute`, `join`, `normalize`, `relative`, `resolve`, `parse`, `format`, `matchesGlob`, `toNamespacedPath`, `posix`

</details>

<details>
<summary><strong><code>node:perf_hooks</code></strong></summary>

- `performance` — `now()`, `timeOrigin`, `mark()`, `measure()`, `getEntries()`, `getEntriesByName()`, `getEntriesByType()`, `clearMarks()`, `clearMeasures()`, `toJSON()`
- `PerformanceEntry`, `PerformanceObserver`
- `monitorEventLoopDelay`, `createHistogram`, `constants`

</details>

<details>
<summary><strong><code>node:process</code></strong></summary>

- **Properties:** `argv`, `argv0`, `env`, `pid`, `ppid`, `platform` (`'wasi'`), `arch` (`'wasm32'`), `version`, `versions`, `config`, `features`, `execArgv`, `execPath`, `exitCode`, `stdout`, `stderr`
- **Methods:** `exit(code)`, `cwd()`, `nextTick(callback, ...args)`, `hrtime()`, `hrtime.bigint()`, `uptime()`, `cpuUsage()`, `memoryUsage()`, `kill(pid, signal)`, `abort()`, `emitWarning()`
- **User/Group:** `getuid`, `getgid`, `geteuid`, `getegid`, `getgroups`, `setuid`, `setgid`
- Inherits from `EventEmitter` — supports `on('uncaughtException')`, `on('unhandledRejection')`, etc.

</details>

<details>
<summary><strong><code>node:punycode</code></strong></summary>

- `decode`, `encode`, `toASCII`, `toUnicode`, `ucs2`, `version`

</details>

<details>
<summary><strong><code>node:querystring</code></strong></summary>

- `stringify` / `encode`, `parse` / `decode`, `escape`, `unescape`, `unescapeBuffer`

</details>

<details>
<summary><strong><code>node:readline</code></strong></summary>

- `createInterface`, `Interface`, `clearLine`, `clearScreenDown`, `cursorTo`, `moveCursor`, `emitKeypressEvents`
- `readline/promises` — promise-based API

</details>

<details>
<summary><strong><code>node:repl</code></strong> (stub)</summary>

- `start`, `REPLServer`, `Recoverable`, `builtinModules`

</details>

<details>
<summary><strong><code>node:sqlite</code></strong></summary>

Requires the `sqlite` feature flag. Provides a synchronous SQLite database API with an embedded SQLite engine.

- `DatabaseSync` — `prepare`, `exec`, `close`, `open`, `isOpen`, `isTransaction`, `createSession`, `applyChangeset`, `enableLoadExtension`, `function`, `aggregate`, `backup`
- `StatementSync` — `run`, `get`, `all`, `iterate`, `columns`, `setReadBigInts`, `setAllowBareNamedParameters`, `sourceSQL`, `expandedSQL`
- `Session` — `changeset`, `patchset`, `close`
- Constants: `SQLITE_CHANGESET_OMIT`, `SQLITE_CHANGESET_REPLACE`, `SQLITE_CHANGESET_ABORT`

**Not supported:** `loadExtension()` (throws — native extensions cannot be loaded in WASM).

</details>

<details>
<summary><strong><code>node:stream</code></strong></summary>

- `Readable` (with `from`, `fromWeb`, `toWeb`, `wrap`, and functional methods: `map`, `filter`, `flatMap`, `take`, `drop`, `toArray`, `forEach`, `reduce`, `some`, `every`, `find`)
- `Writable`, `Duplex`, `Transform`, `PassThrough`, `Stream`
- `pipeline`, `finished`, `compose`, `duplexPair`, `addAbortSignal`
- `getDefaultHighWaterMark`, `setDefaultHighWaterMark`, `isDisturbed`, `destroy`
- `stream/consumers` (`arrayBuffer`, `blob`, `buffer`, `json`, `text`)
- `stream/promises` — promise-based `pipeline` and `finished`

</details>

<details>
<summary><strong><code>node:string_decoder</code></strong></summary>

- `StringDecoder`

</details>

<details>
<summary><strong><code>node:test</code></strong></summary>

Built-in test runner.

- `test`, `describe` / `suite`, `it`, `before`, `after`, `beforeEach`, `afterEach`
- `mock` — function mocking utilities
- `run` — programmatic test execution

</details>

<details>
<summary><strong><code>node:timers</code></strong></summary>

- `setTimeout`, `setInterval`, `setImmediate`, `clearTimeout`, `clearInterval`
- `timers/promises` — promise-based `setTimeout`, `setInterval`, `setImmediate`

</details>

<details>
<summary><strong><code>node:tls</code></strong> (stub)</summary>

Compatibility stubs — TLS is handled transparently by the WASI-HTTP layer.

- `SecureContext`, `TLSSocket`, `Server`, `connect`, `createServer`, `createSecureContext`, `checkServerIdentity`, `getCiphers`, `rootCertificates`
- `DEFAULT_MIN_VERSION`, `DEFAULT_MAX_VERSION`, `DEFAULT_ECDH_CURVE`

</details>

<details>
<summary><strong><code>node:trace_events</code></strong></summary>

Partial compatibility API to unblock modules that inspect tracing state.

- `createTracing({ categories: string[] })` — creates a `Tracing` handle
- `Tracing#enable()` / `Tracing#disable()` — toggles local tracing state
- `Tracing#enabled` / `Tracing#categories` — read tracing configuration
- `getEnabledCategories()` — returns currently enabled categories as a comma-separated string

**Limitation:** No native trace sink; API-surface compatibility only.

</details>

<details>
<summary><strong><code>node:tty</code></strong></summary>

- `isatty`, `ReadStream`, `WriteStream`

</details>

<details>
<summary><strong><code>node:url</code></strong></summary>

- `URL`, `URLSearchParams`
- `parse`, `resolve`, `format` (legacy API)
- `fileURLToPath`, `pathToFileURL`, `urlToHttpOptions`

</details>

<details>
<summary><strong><code>node:util</code></strong></summary>

- `format`, `inspect`, `deprecate`, `debugLog`, `log`
- Type checks: `isArray`, `isBoolean`, `isNull`, `isNullOrUndefined`, `isNumber`, `isString`, `isSymbol`, `isUndefined`, `isRegExp`, `isObject`, `isDate`, `isError`, `isFunction`, `isPrimitive`, `isBuffer`
- `promisify`, `callbackify`
- `parseEnv`, `styleText`, `getCallSite`, `getCallSites`, `toUSVString`, `_extend`
- `TextEncoder`, `TextDecoder`

</details>

<details>
<summary><strong><code>node:v8</code></strong></summary>

- `getHeapStatistics`, `getHeapSpaceStatistics`, `getHeapSnapshot`, `getHeapCodeStatistics`
- `setFlagsFromString`, `writeHeapSnapshot`, `takeCoverage`, `stopCoverage`
- `serialize`, `deserialize`, `Serializer`, `Deserializer`, `DefaultSerializer`, `DefaultDeserializer`

</details>

<details>
<summary><strong><code>node:vm</code></strong></summary>

- `runInNewContext`, `runInContext`, `runInThisContext`, `createContext`, `isContext`, `compileFunction`
- `Script`, `createScript`
- `SourceTextModule` (experimental, limited `export const`/`export let`/`export var` support)

</details>

<details>
<summary><strong><code>node:worker_threads</code></strong> (stub)</summary>

Compatibility stubs — workers are not supported in single-threaded WASM.

- `isMainThread`, `parentPort`, `workerData`, `threadId`, `resourceLimits`
- `Worker`, `BroadcastChannel`, `MessagePort`, `MessageChannel`
- `markAsUntransferable`, `moveMessagePortToContext`, `receiveMessageOnPort`
- `getEnvironmentData`, `setEnvironmentData`

</details>

<details>
<summary><strong><code>node:zlib</code></strong></summary>

- **Classes:** `Deflate`, `Inflate`, `Gzip`, `Gunzip`, `DeflateRaw`, `InflateRaw`, `Unzip`, `BrotliCompress`, `BrotliDecompress`
- **Factory:** `createGzip`, `createGunzip`, `createDeflate`, `createInflate`, `createDeflateRaw`, `createInflateRaw`, `createUnzip`, `createBrotliCompress`, `createBrotliDecompress`
- **Async:** `gzip`, `gunzip`, `deflate`, `inflate`, `deflateRaw`, `inflateRaw`, `unzip`, `brotliCompress`, `brotliDecompress`
- **Sync:** `gzipSync`, `gunzipSync`, `deflateSync`, `inflateSync`, `deflateRawSync`, `inflateRawSync`, `unzipSync`, `brotliCompressSync`, `brotliDecompressSync`
- `crc32`, `constants`, `codes`

</details>

#### Internal / Compatibility Modules

<details>
<summary><strong>Additional internal modules</strong></summary>

- `internal/url` — `isURL`
- `internal/http` — `kOutHeaders` symbol
- `base64-js` — `byteLength`, `toByteArray`, `fromByteArray`
- `ieee754` — `read`, `write`

</details>

### Compatibility Reports

- [NPM Library Compatibility Tracker](tests/libraries/libraries.md) — test results for popular npm packages
- [Node.js v22 Compatibility Report](tests/node_compat/report.md) — per-test results for vendored Node.js test suite

### Coming from QuickJS

- Global:
    - `parseInt`
    - `parseFloat`
    - `isNaN`
    - `isFinite`
    - `quickMicrotask`
    - `decodeURI`
    - `decodeURIComponent`
    - `encodeURI`
    - `encodeURIComponent`
    - `escape`
    - `unescape`
    - `Infinity`
    - `NaN`
    - `undefined`
    - `[Symbol.toStringTag]`

- `Object`
    - static methods and properties:
        - `create`
        - `getPrototypeOf`
        - `setPrototypeOf`
        - `defineProperty`
        - `defineProperties`
        - `getOwnPropertyNames`
        - `getOwnPropertySymbols`
        - `groupBy`
        - `keys`
        - `values`
        - `entries`
        - `isExtensible`
        - `preventExtensions`
        - `getOwnPropertyDescriptor`
        - `getOwnPropertyDescriptors`
        - `is`
        - `assign`
        - `seal`
        - `freeze`
        - `isSealed`
        - `isFrozen`
        - `fromEntries`
        - `hasOwn`
    - methods and properties:
        - `toString`
        - `toLocaleString`
        - `valueOf`
        - `hasOwnProperty`
        - `isPrototypeOf`
        - `propertyIsEnumerable`
        - `__proto__`
        - `__defineGetter__`
        - `__defineSetter__`
        - `__lookupGetter__`
        - `__lookupSetter__`
- `Function`
    - methods and properties:
        - `call`
        - `apply`
        - `bind`
        - `toString`
        - `[Symbol.hasInstance]`
        - `fileName`
        - `lineNumber`
        - `columnNumber`
- `Error`
    - methods and properties:
        - `name`
        - `message`
        - `toString`
    - static methods and properties:
        - `isError`
        - `captureStackTrace`
        - `stackTraceLimit`
        - `prepareStackTrace`
- `Generator`
    - methods and properties:
        - `next`
        - `return`
        - `throw`
        - `[Symbol.toStringTag]`
    - static methods and properties:
        - `from`
- `Iterator`
    - static methods and properties:
        - `from`
    - methods and properties:
        - `drop`
          `filter`
          `flatMap`
          `map`
          `take`
          `every`
          `find`
          `forEach`
          `some`
          `reduce`
          `toArray`
          `[Symbol.iterator]`
          `[Symbol.toStringTag]`
- `Array`
    - static methods and properties:
        - `isArray`
        - `from`
        - `of`
        - `[Symbol.species]`
    - methods and properties:
        - `at`
        - `with`
        - `concat`
        - `every`
        - `some`
        - `forEach`
        - `map`
        - `filter`
        - `reduce`
        - `reduceRight`
        - `fill`
        - `find`
        - `findIndex`
        - `findLast`
        - `findLastIndex`
        - `indexOf`
        - `lastIndexOf`
        - `includes`
        - `join`
        - `toString`
        - `toLocaleString`
        - `pop`
        - `push`
        - `shift`
        - `unshift`
        - `reverse`
        - `toReversed`
        - `sort`
        - `toSorted`
        - `slice`
        - `splice`
        - `toSpliced`
        - `copyWithin`
        - `flatMap`
        - `flat`
        - `values`
        - `[Symbol.iterator]`
        - `keys`
        - `entries`
- `Number`
    - static methods and properties:
        - `parseInt`
        - `parseFloat`
        - `isNaN`
        - `isFinite`
        - `isInteger`
        - `isSafeInteger`
        - `MAX_VALUE`
        - `MIN_VALUE`
        - `NaN`
        - `NEGATIVE_INFINITY`
        - `POSITIVE_INFINITY`
        - `EPSILON`
        - `MAX_SAFE_INTEGER`
        - `MIN_SAFE_INTEGER`
    - methods and properties:
        - `toExponential`
        - `toFixed`
        - `toPrecision`
        - `toString`
        - `toLocaleString`
        - `valueOf`
- `Boolean`
    - methods and properties:
        - `toString`
        - `valueOf`
- `String`
    - static methods and properties:
        - `fromCharCode`
        - `fromCodePoint`
        - `raw`
    - methods and properties:
        - `length`
        - `at`
        - `charCodeAt`
        - `charAt`
        - `concat`
        - `codePointAt`
        - `isWellFormed`
        - `toWellFormed`
        - `indexOf`
        - `lastIndexOf`
        - `includes`
        - `endsWith`
        - `startsWith`
        - `match`
        - `matchAll`
        - `search`
        - `split`
        - `substring`
        - `substr`
        - `slice`
        - `repeat`
        - `replace`
        - `replaceAll`
        - `padEnd`
        - `padStart`
        - `trim`
        - `trimEnd`
        - `trimRight`
        - `trimStart`
        - `trimLeft`
        - `toString`
        - `valueOf`
        - `localeCompare`
        - `normalize`
        - `toLowerCase`
        - `toUpperCase`
        - `toLocaleLowerCase`
        - `toLocaleUpperCase`
        - `[Symbol.iterator]`
        - `anchor`
        - `big`
        - `blink`
        - `bold`
        - `fixed`
        - `fontcolor`
        - `fontsize`
        - `italics`
        - `link`
        - `small`
        - `strike`
        - `sub`
        - `sup`
- `Symbol`
    - static methods and properties:
        - `for`
        - `keyFor`
    - methods and properties:
        - `toString`
        - `valueOf`
        - `description`
        - `[Symbol.toPrimitive]`
        - `[Symbol.toStringTag]`
- `Map`
    - static methods and properties:
        - `groupBy`
        - `[Symbol.species]`
    - methods and properties:
        - `set`
        - `get`
        - `has`
        - `delete`
        - `clear`
        - `size`
        - `forEach`
        - `values`
        - `keys`
        - `entries`
        - `[Symbol.iterator]`
        - `[Symbol.toStringTag]`
- `Set`
    - static methods and properties:
        - `[Symbol.species]`
    - methods and properties:
        - `add`
        - `has`
        - `delete`
        - `clear`
        - `size`
        - `forEach`
        - `isDisjointFrom`
        - `isSubsetOf`
        - `isSupersetOf`
        - `intersection`
        - `difference`
        - `symmetricDifference`
        - `union`
        - `values`
        - `keys`
        - `[Symbol.iterator]`
        - `entries`
        - `[Symbol.toStringTag]`
- `WeakMap`
    - methods and properties:
        - `set`
        - `get`
        - `has`
        - `delete`
        - `[Symbol.toStringTag]`
- `WeakSet`
    - methods and properties:
        - `add`
        - `has`
        - `delete`
        - `[Symbol.toStringTag]`
- `GeneratorFunction`
    - methods and properties:
        - `[Symbol.toStringTag]`
- `Math`
    - static methods and properties:
        - `min`
        - `max`
        - `abs`
        - `floor`
        - `ceil`
        - `round`
        - `sqrt`
        - `acos`
        - `asin`
        - `atan`
        - `atan2`
        - `cos`
        - `exp`
        - `log`
        - `pow`
        - `sin`
        - `tan`
        - `trunc`
        - `sign`
        - `cosh`
        - `sinh`
        - `tanh`
        - `acosh`
        - `asinh`
        - `atanh`
        - `expm1`
        - `log1p`
        - `log2`
        - `log10`
        - `cbrt`
        - `hypot`
        - `random`
        - `f16round`
        - `fround`
        - `imul`
        - `clz32`
        - `sumPrecise`
        - `[Symbol.toStringTag]`
        - `E`
        - `LN10`
        - `LN2`
        - `LOG2E`
        - `LOG10E`
        - `PI`
        - `SQRT1_2`
        - `SQRT2`
- `Reflect`
    - static methods and properties:
        - `apply`
        - `construct`
        - `defineProperty`
        - `deleteProperty`
        - `get`
        - `getOwnPropertyDescriptor`
        - `getPrototypeOf`
        - `has`
        - `isExtensible`
        - `ownKeys`
        - `preventExtensions`
        - `set`
        - `setPrototypeOf`
        - `[Symbol.toStringTag]`
- `RegExp`
    - static methods and properties:
        - `escape`
        - `[Symbol.species]`
    - methods and properties:
        - `flags`
        - `source`
        - `global`
        - `ignoreCase`
        - `multiline`
        - `dotAll`
        - `unicode`
        - `unicodeSets`
        - `sticky`
        - `hasIndices`
        - `exec`
        - `compile`
        - `test`
        - `toString`
        - `[Symbol.replace]`
        - `[Symbol.match]`
        - `[Symbol.matchAll]`
        - `[Symbol.search]`
        - `[Symbol.split]`
- `JSON`
    - static methods and properties:
        - `parse`
        - `stringify`
        - `[Symbol.toStringTag]`
- `Promise`
    - static methods and properties:
        - `resolve`
        - `reject`
        - `all`
        - `allSettled`
        - `any`
        - `try`
        - `race`
        - `withResolvers`
        - `[Symbol.species]`
    - methods and properties:
        - `then`
        - `catch`
        - `finally`
        - `[Symbol.toStringTag]`
- `AsyncFunction`
    - methods and properties:
        - `[Symbol.toStringTag]`
- `AsyncIterator`
    - methods and properties:
        - `next`
        - `return`
        - `throw`
- `AsyncGeneratorFunction`
    - methods and properties:
        - `[Symbol.toStringTag]`
- `AsyncGenerator`
    - methods and properties:
        - `next`
        - `return`
        - `throw`
        - `[Symbol.toStringTag]`
- `Date`
    - static methods and properties:
        - `now`
        - `parse`
        - `UTC`
    - methods and properties:
        - `valueOf`
        - `toString`
        - `[Symbol.toPrimitive]`
        - `toUTCString`
        - `toGMTString`
        - `toISOString`
        - `toDateString`
        - `toTimeString`
        - `toLocaleString`
        - `toLocaleDateString`
        - `toLocaleTimeString`
        - `getTimezoneOffset`
        - `getTime`
        - `getYear`
        - `getFullYear`
        - `getUTCFullYear`
        - `getMonth`
        - `getUTCMonth`
        - `getDate`
        - `getUTCDate`
        - `getHours`
        - `getUTCHours`
        - `getMinutes`
        - `getUTCMinutes`
        - `getSeconds`
        - `getUTCSeconds`
        - `getMilliseconds`
        - `getUTCMilliseconds`
        - `getDay`
        - `getUTCDay`
        - `setTime`
        - `setMilliseconds`
        - `setUTCMilliseconds`
        - `setSeconds`
        - `setUTCSeconds`
        - `setMinutes`
        - `setUTCMinutes`
        - `setHours`
        - `setUTCHours`
        - `setDate`
        - `setUTCDate`
        - `setMonth`
        - `setUTCMonth`
        - `setYear`
        - `setFullYear`
        - `setUTCFullYear`
        - `toJSON`
- `BigInt`
    - static methods and properties:
        - `asIntN`
        - `asUintN`
    - methods and properties:
        - `toString`
        - `valueOf`
        - `[Symbol.toStringTag]`
- `ArrayBuffer`
    - static methods and properties:
        - `isView`
        - `[Symbol.species`
    - methods and properties:
        - `byteLength`
        - `maxByteLength`
        - `resizeable`
        - `detached`
        - `resize`
        - `slice`
        - `transfer`
        - `transferToFixedLength`
        - `[Symbol.toStringTag]`
- `SharedArrayBuffer`
    - static methods and properties:
        - `[Symbol.species]`
    - methods and properties:
        - `byteLength`
        - `maxByteLength`
        - `growable`
        - `grow`
        - `slice`
        - `[Symbol.toStringTag]`
- Typed arrays (`Int8Array`, `Uint8Array`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `BigInt64Array`,
  `BigUint64Array`, `Float32Array`, `Float64Array`, `Float16Array`)
    - static methods and properties:
        - `from`
        - `of`
        - `[Symbol.species]`
    - methods and properties:
        - `length`
        - `at`
        - `with`
        - `buffer`
        - `byteLength`
        - `set`
        - `byteOffset`
        - `values`
        - `[Symbol.iterator]`
        - `keys`
        - `entries`
        - `[Symbol.toStringTag]`
        - `copyWithin`
        - `every`
        - `some`
        - `forEach`
        - `map`
        - `filter`
        - `reduce`
        - `reduceRight`
        - `fill`
        - `find`
        - `findIndex`
        - `findLast`
        - `findLastIndex`
        - `reverse`
        - `toReversed`
        - `slice`
        - `subarray`
        - `sort`
        - `toSorted`
        - `join`
        - `toLocaleString`
        - `indexOf`
        - `lastIndexOf`
        - `includes`
- `DataView`
    - methods and properties:
        - `buffer`
        - `byteLength`
        - `byteOffset`
        - `getInt8`
        - `getUint8`
        - `getInt16`
        - `getUint16`
        - `getInt32`
        - `getUint32`
        - `getBigInt64`
        - `getBigUint64`
        - `getFloat16`
        - `getFloat32`
        - `getFloat64`
        - `setInt8`
        - `setUint8`
        - `setInt16`
        - `setUint16`
        - `setInt32`
        - `setUint32`
        - `setBigInt64`
        - `setBigUint64`
        - `setFloat16`
        - `setFloat32`
        - `setFloat64`
        - `[Symbol.toStringTag]`
- `Atomics`
    - static methods and properties:
        - `add`
        - `and`
        - `or`
        - `sub`
        - `xor`
        - `exchange`
        - `compareExchange`
        - `load`
        - `store`
        - `isLockFree`
        - `pause`
        - `wait`
        - `notify`
        - `[Symbol.toStringTag]`
- `Performance`
    - methods and properties:
        - `now`
- `WeakRef`
    - methods and properties:
        - `deref`
        - `[Symbol.toStringTag]`
- `FinalizationRegistry`
    - methods and properties:
        - `register`
        - `unregister`
        - `[Symbol.toStringTag]`
- `Callsite`
    - methods and properties:
      -`isNative`
        - `getFileName`
        - `getFunction`
        - `getFunctionName`
        - `getColumnNumber`
        - `getLineNumber`
        - `[Symbol.toStringTag]`
- `Proxy`

## Developing

There are a few important things to keep in mind when working on the project:

- The `skeleton` crate can be opened and compiled separately when working on the APIs provided for JavaScript.
  Unfortunately we cannot use the `Cargo.toml` file name in it because that breaks Rust packaging - so before working on
  it, it has to be renamed to `Cargo.toml`
  and before committing back it has to be renamed back to `Cargo.toml_`.

- If the `skeleton` crate was compiled for testing, and then `wasm-rquickjs` is compiled, the `include_dir!` macro is
  embedding everything from the `skeleton` directory **including** the `target` directory, resulting in slow compilation
  times and huge resulting binaries. Use the `cleanup-skeleton.sh` script to quickly remove the `target` directory from
  the `skeleton` crate.

## Acknowledgements

The builtin JS modules are based on the work of several other projects:
  
- [abortcontroller-polyfill](https://github.com/mo/abortcontroller-polyfill)
- [base64-js](https://github.com/beatgammit/base64-js)
- [buffer](https://github.com/feross/buffer)
- [consoleTable](https://github.com/ronnyKJ/consoleTable)
- [eventemitter3](https://github.com/primus/eventemitter3)
- [fetch-blob](https://github.com/node-fetch/fetch-blob)
- [fetch.js](https://github.com/JakeChampion/fetch/blob/main/fetch.js)
- [FormData](https://github.com/jimmywarting/FormData)
- [ieee754](https://github.com/feross/ieee754)
- [url-search-params-polyfill](https://github.com/jerrybendy/url-search-params-polyfill)
- [structured-clone](https://github.com/ungap/structured-clone)
- [wasmedge-quickjs](https://github.com/second-state/wasmedge-quickjs)
- [web-streams-polyfill](https://github.com/MattiasBuelens/web-streams-polyfill)

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

#### Console

If the `logging` feature flag is enabled in the generated crate, it depends on `wasi:logging`, otherwise just on the
core WASI interfaces.

- `assert`
- `clear`
- `count`
- `countReset`
- `debug`
- `dir`
- `dirXml`
- `error`
- `group`
- `groupCollapsed`
- `groupEnd`
- `info`
- `log`
- `table`
- `time`
- `timeEnd`
- `timeLog`
- `trace`
- `warn`

#### HTTP (fetch)

Only if the `http` feature flag is enabled in the generated crate. It depends on `wasi:http`.

- `fetch`
- `Headers`
- `Request`
- `Response`
- `FormData`
- `Blob`
- `File`

#### URL

- `URL`
- `URL.createObjectURL`
- `URL.revokeObjectURL`
- `URLSearchParams`

#### Streams

Implemented by https://github.com/MattiasBuelens/web-streams-polyfill

- `ByteLengthQueuingStrategy`
- `CountQueuingStrategy`
- `ReadableByteStreamController`
- `ReadableStream`
- `ReadableStreamBYOBReader`
- `ReadableStreamBYOBRequest`
- `ReadableStreamDefaultController`
- `ReadableStreamDefaultReader`
- `TransformStream`
- `TransformStreamDefaultController`
- `WritableStream`
- `WritableStreamDefaultController`

#### Timeout functions

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `setImmediate`

#### Abort Controller

- `AbortController`
- `AbortSignal`
- `DOMException`

#### Encoding

- `TextEncoder`
- `TextDecoder`
- `TextDecoderStream`
- `TextEncoderStream`

#### Messaging

- `MessageChannel`
- `MessagePort`

#### Intl (Internationalization)

Minimal en-US implementation for library compatibility. All locale inputs are accepted but resolved to `en-US`.

- `Intl.DateTimeFormat` — `format()`, `formatToParts()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.NumberFormat` — `format()`, `formatToParts()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.Collator` — `compare()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.PluralRules` — `select()`, `selectRange()`, `resolvedOptions()`, `supportedLocalesOf()`
- `Intl.getCanonicalLocales()`
- `Intl.supportedValuesOf()`

When the `timezone` feature is enabled (default), `DateTimeFormat` supports all ~590 IANA timezones via `chrono-tz`.

#### Structured Clone

Implemented by https://github.com/ungap/structured-clone

- `structuredClone`

### `node:util`
- `format`
- `deprecate`
- `debugLog`
- `inspect`
- `isArray`
- `isBoolean`
- `isNull`
- `isNullOrUndefined`
- `isNumber`
- `isString`
- `isSymbol`
- `isUndefined`
- `isRegExp`
- `isObject`
- `isDate`
- `isError`
- `isFunction`
- `isPrimitive`
- `isBuffer`
- `log`
- `_extend`
- `promisify`
- `callbackify`
- `parseEnv`
- `styleText`
- `getCallSite`
- `getCallSites`
- `toUSVString`
- `TextEncoder`
- `TextDecoder`

### `node:buffer`
- `Buffer`
- `Blob`
- `File`
- `resolveObjectURL`
- `INSPECT_MAX_BYTES`
- `kMaxLength`
- `kStringMaxLength`
- `constants`
- `SlowBuffer`
- `isAscii`
- `isUtf8`

### `node:fs`
- `readFile`
- `readFileSync`
- `writeFile`
- `writeFileSync`

### `node:path`
- `sep`
- `delimiter`
- `basename`
- `dirname`
- `extname`
- `isAbsolute`
- `join`
- `normalize`
- `relative`
- `resolve`
- `parse`
- `format`
- `matchesGlob`
- `toNamespacedPath`
- `posix`

### `internal/url`
- `isURL`

### `node:process`
- `argv`
- `argv0`
- `env`
- `cwd`
- `hrtime` / `hrtime.bigint`

### `node:vm`
- `runInNewContext`
- `runInContext`
- `runInThisContext`
- `createContext`
- `isContext`
- `compileFunction`
- `Script`
- `createScript`
- `SourceTextModule` (experimental, limited `export const`/`export let`/`export var` support)

### `node:stream`
- `_uint8ArrayToBuffer`
- `addAbortSignal`
- `compose`
- `destroy`
- `Duplex`
- `duplexPair`
- `finished`
- `getDefaultHighWaterMark`
- `setDefaultHighWaterMark`
- `isDisturbed`
- `_isUint8Array`
- `PassThrough`
- `pipeline`
- `Readable`
  - `Readable.from`
  - `Readable.fromWeb`
  - `Readable.toWeb`
  - `Readable.wrap`
  - `Readable.prototype.map`
  - `Readable.prototype.filter`
  - `Readable.prototype.flatMap`
  - `Readable.prototype.take`
  - `Readable.prototype.drop`
  - `Readable.prototype.toArray`
  - `Readable.prototype.forEach`
  - `Readable.prototype.reduce`
  - `Readable.prototype.some`
  - `Readable.prototype.every`
  - `Readable.prototype.find`
- `Stream`
- `Transform`
- `Writable`
- `stream/consumers` (`arrayBuffer`, `blob`, `buffer`, `json`, `text`)

### `base64-js`
- `byteLength`
- `toByteArray`
- `fromByteArray`

### `ieee754`
- `read`
- `write`

### `node:http` / `node:https`

Requires the `http` feature flag. Client requests use `wasi:http` (TLS handled transparently). Server support uses `wasi:sockets` for TCP-level HTTP/1.1 serving.

- `http.request(url|options[, callback])` — make HTTP requests
- `http.get(url|options[, callback])` — convenience GET helper
- `http.METHODS` — list of supported HTTP methods
- `http.STATUS_CODES` — status code to reason phrase mapping
- `http.maxHeaderSize` — constant (16384)
- `node:_http_common` / `_http_common` — `_checkIsHttpToken(value)` and `_checkInvalidHeaderChar(value)` header validators
- `internal/http` — internal `kOutHeaders` symbol used by `OutgoingMessage` internals
- `http.validateHeaderName(name)` — validate header name
- `http.validateHeaderValue(name, value)` — validate header value
- `http.Agent` — connection pooling stub (options accepted, pooling is host-controlled)
- `http.globalAgent` — default Agent instance
- `http.OutgoingMessage` — base class for writable HTTP message objects (`write`, `end`, `destroy`, `writableLength`, `writableHighWaterMark`)
- `http.ClientRequest` — outgoing request (`write`, `end`, `setHeader`, `getHeader`, `removeHeader`, `hasHeader`, `getHeaderNames`, `getHeaders`, `getRawHeaderNames`, `flushHeaders`, `setNoDelay`, `setSocketKeepAlive`, `writableEnded`, `writableFinished`, `abort`, `destroy`, `setTimeout`)
- `http.IncomingMessage` — incoming response (`statusCode`, `statusMessage`, `headers`, `rawHeaders`, `httpVersion`, `on('data')`, `on('end')`)
- `https.request` / `https.get` — delegates to `http` (WASI-HTTP handles TLS transparently)
- `http.createServer([options][, requestListener])` — create an HTTP/1.1 server (requires `wasi:sockets`)
- `http.Server` (extends `net.Server`):
  - `listen(port[, host][, callback])` — start listening
  - `close([callback])` — stop accepting connections
  - `closeAllConnections()` — forcefully close all connections
  - `closeIdleConnections()` — close idle keep-alive connections
  - `setTimeout(ms[, callback])` — set server timeout
  - Properties: `timeout`, `keepAliveTimeout`, `headersTimeout`, `requestTimeout`, `maxHeadersCount`, `maxRequestsPerSocket`
- `http.ServerResponse` (extends `EventEmitter`):
  - `writeHead(statusCode[, statusMessage][, headers])` — send response head
  - `setHeader(name, value)` / `getHeader(name)` / `removeHeader(name)` / `hasHeader(name)` — manage headers
  - `getHeaders()` / `getHeaderNames()` / `getRawHeaderNames()` — retrieve headers
  - `write(chunk[, encoding][, callback])` — write response body
  - `end([data][, encoding][, callback])` — finish response
  - `flushHeaders()` — force header send
  - `writeContinue()` — send 100 Continue
  - `addTrailers(headers)` — stub
  - `cork()` / `uncork()` — buffer control
  - Properties: `statusCode`, `statusMessage`, `headersSent`, `sendDate`, `finished`, `writableEnded`, `writableFinished`
- Server-side `IncomingMessage` (extends `stream.Readable`):
  - Properties: `method`, `url`, `headers`, `headersDistinct`, `rawHeaders`, `httpVersion`, `socket`, `complete`, `aborted`, `trailers`
  - `setTimeout(ms[, callback])` — set request timeout
- Supported features: keep-alive connections, chunked transfer encoding, content-length bodies, sequential request pipelining, idle connection cleanup
- **Not yet supported:** HTTP Upgrade/WebSocket, 1xx informational events, server-side timeout enforcement, header value injection validation, `https.createServer()` / HTTPS server, client `lookup` / `autoSelectFamily` options (DNS/address selection is host-controlled via WASI HTTP)

### `node:crypto`
- `createHash`
- `createHmac`
- `createCipheriv` (aes-128-cbc, aes-256-cbc, aes-128-ctr, aes-256-ctr, aes-128-gcm, aes-256-gcm, aes-128-wrap, aes-192-wrap, aes-256-wrap, id-aes128-wrap, id-aes192-wrap, id-aes256-wrap, id-aes128-wrap-pad, id-aes192-wrap-pad, id-aes256-wrap-pad, des-ede3-cbc, des3-wrap, chacha20-poly1305)
- `createDecipheriv` (aes-128-cbc, aes-256-cbc, aes-128-ctr, aes-256-ctr, aes-128-gcm, aes-256-gcm, aes-128-wrap, aes-192-wrap, aes-256-wrap, id-aes128-wrap, id-aes192-wrap, id-aes256-wrap, id-aes128-wrap-pad, id-aes192-wrap-pad, id-aes256-wrap-pad, des-ede3-cbc, des3-wrap, chacha20-poly1305)
- `createSign` (Ed25519, ECDSA with P-256, P-384, secp256k1)
- `createVerify` (Ed25519, ECDSA with P-256, P-384, secp256k1)
- `createPublicKey`
- `createPrivateKey`
- `createSecretKey`
- `createECDH`
- `ECDH` (`generateKeys`, `computeSecret`, `getPublicKey`, `getPrivateKey`, `setPublicKey`, `setPrivateKey`, `convertKey`)
- `diffieHellman`
- `Certificate` (`verifySpkac`, `exportPublicKey`, `exportChallenge`)
- `generateKeyPairSync` (ed25519, ed448, ec with prime256v1/P-256, secp384r1/P-384, secp256k1, P-521, dh, x25519, x448)
- `generateKeyPair`
- `KeyObject` (`type`, `asymmetricKeyType`, `asymmetricKeyDetails`, `symmetricKeySize`, `export`, `equals`, `toCryptoKey`, `from`)
- `hash`
- `getHashes`
- `getCiphers`
- `getCurves`
- `getFips`
- `setFips`
- `secureHeapUsed` (reports secure-heap usage when `--secure-heap` / `--secure-heap-min` are set)
- `randomBytes`
- `pseudoRandomBytes` (alias of `randomBytes`)
- `prng` (alias of `randomBytes`)
- `rng` (alias of `randomBytes`)
- `randomFillSync`
- `randomFill`
- `randomInt`
- `randomUUID`
- `timingSafeEqual`
- `pbkdf2`
- `pbkdf2Sync`
- `scrypt`
- `scryptSync`
- `hkdf`
- `hkdfSync`
- `generatePrime`
- `generatePrimeSync`
- `checkPrime`
- `checkPrimeSync`

### `node:dgram`

UDP datagram sockets built on WASI sockets. Supported API:

- `dgram.createSocket(type[, listener])` — create a UDP socket (`udp4` or `udp6`)
- `socket.bind([port][, address][, callback])` — bind to a local address/port
- `socket.send(msg[, offset, length], port, address[, callback])` — send a datagram
- `socket.sendto(msg, offset, length, port, address[, callback])` — send with explicit args
- `socket.connect(port[, address][, callback])` — associate socket with remote address
- `socket.disconnect()` — disassociate from remote address
- `socket.close([callback])` — close the socket
- `socket.address()` — get local address info
- `socket.remoteAddress()` — get remote address info
- `socket.setTTL(ttl)` — set IP TTL
- `socket.setRecvBufferSize(size)` / `socket.getRecvBufferSize()`
- `socket.setSendBufferSize(size)` / `socket.getSendBufferSize()`
- `socket.ref()` / `socket.unref()` — no-op (WASI has no ref counting)
- Events: `message`, `listening`, `close`, `error`, `connect`

**Not supported:** `setBroadcast`, `setMulticastTTL`, `setMulticastLoopback`, `setMulticastInterface`, `addMembership`, `dropMembership`, `addSourceSpecificMembership`, `dropSourceSpecificMembership` (throw `ENOSYS`).

### `node:net`

TCP sockets and servers built on WASI sockets. Supported API:

- `net.createServer([options][, connectionListener])` — create a TCP server
- `net.createConnection(options[, connectListener])` — create a client connection
- `net.connect(...)` — alias for `createConnection`
- `net.isIP(input)` / `net.isIPv4(input)` / `net.isIPv6(input)` — IP address validation
- `net.getDefaultAutoSelectFamily()` / `net.setDefaultAutoSelectFamily(value)` — stubs
- `net.getDefaultAutoSelectFamilyAttemptTimeout()` / `net.setDefaultAutoSelectFamilyAttemptTimeout(value)` — stubs
- `net.Socket` (extends `stream.Duplex`):
  - `connect(port[, host][, connectListener])` — connect to a TCP server
  - `write(data[, encoding][, callback])` — write data
  - `end([data][, encoding][, callback])` — half-close (send FIN)
  - `destroy([error])` — destroy the socket
  - `resetAndDestroy()` — immediately close without graceful shutdown
  - `setTimeout(timeout[, callback])` — set idle timeout (emits `'timeout'`, does not close)
  - `setNoDelay([noDelay])` — no-op (WASI has no `TCP_NODELAY`)
  - `setKeepAlive([enable][, initialDelay])` — configure TCP keep-alive
  - `address()` — get local address info
  - `ref()` / `unref()` — no-op
  - Properties: `remoteAddress`, `remotePort`, `remoteFamily`, `localAddress`, `localPort`, `localFamily`, `bytesRead`, `bytesWritten`, `connecting`, `pending`, `readyState`
  - Events: `connect`, `ready`, `data`, `end`, `close`, `error`, `timeout`, `drain`, `lookup`
- `net.Server` (extends `EventEmitter`):
  - `listen(port[, host][, backlog][, callback])` — start listening
  - `close([callback])` — stop accepting, close when all connections drain
  - `address()` — get server address info
  - `getConnections(callback)` — get active connection count
  - `ref()` / `unref()` — no-op
  - Properties: `listening`, `maxConnections`
  - Events: `listening`, `connection`, `close`, `error`, `drop`
- `net.BlockList` — IP address filtering (addAddress, addRange, addSubnet, check)
- `net.SocketAddress` — IP address + port value object
- `net.Stream` — alias for `net.Socket`

**Not supported:** IPC/Unix domain sockets (`path` option throws), Happy Eyeballs/`autoSelectFamily` (stubbed), `cluster` integration.

### `node:sqlite`

Requires the `sqlite` feature flag. Provides a synchronous SQLite database API with an embedded SQLite engine.

- `DatabaseSync` — synchronous database connections (in-memory and file-backed)
  - `prepare(sql)` — create a prepared statement
  - `exec(sql)` — execute one or more SQL statements directly
  - `close()` — close the database connection
  - `open()` — reopen a closed database
  - `isOpen` — whether the database is currently open
  - `isTransaction` — whether a transaction is currently active
  - `createSession([options])` — create a changeset tracking session
  - `applyChangeset(changeset[, options])` — apply a changeset or patchset
  - `enableLoadExtension(allow)` — enable/disable extension loading (throws in WASM)
  - `loadExtension(path)` — load a SQLite extension (not supported in WASM)
  - `function(name, options, func)` — register a user-defined scalar function
  - `aggregate(name, options)` — register a user-defined aggregate function
  - `backup(destination[, options])` — backup database to a file
- `StatementSync` — prepared statements
  - `run([...params])` — execute with optional parameters, return changes info
  - `get([...params])` — fetch a single row
  - `all([...params])` — fetch all rows
  - `iterate([...params])` — return an iterator over rows
  - `columns()` — return column metadata
  - `setReadBigInts(enabled)` — toggle BigInt for integer columns
  - `setAllowBareNamedParameters(enabled)` — allow named parameters without prefix
  - `sourceSQL` — the original SQL source
  - `expandedSQL` — the SQL with bound parameters expanded
- `Session` — changeset tracking
  - `changeset()` — get the changeset as a `Uint8Array`
  - `patchset()` — get the patchset as a `Uint8Array`
  - `close()` — close the session
- SQLite constants (`SQLITE_CHANGESET_OMIT`, `SQLITE_CHANGESET_REPLACE`, `SQLITE_CHANGESET_ABORT`)

**Not supported:** `loadExtension()` (throws — native extensions cannot be loaded in WASM).

### `node:diagnostics_channel`

Publish/subscribe diagnostic messaging and tracing.

- `channel(name)` — get or create a named Channel
- `subscribe(name, onMessage)` — subscribe to a named channel
- `unsubscribe(name, onMessage)` — unsubscribe from a named channel
- `hasSubscribers(name)` — check if a named channel has subscribers
- `tracingChannel(name)` — create a TracingChannel
- `Channel` — individual pub/sub channel (`subscribe`, `unsubscribe`, `publish`, `bindStore`, `unbindStore`, `runStores`, `hasSubscribers`, `name`)
- `TracingChannel` — structured tracing across sync/async operations (`subscribe`, `unsubscribe`, `hasSubscribers`, `traceSync`, `tracePromise`, `traceCallback`)

Built-in HTTP diagnostics channels: `http.client.request.created`, `http.client.request.start`, `http.client.request.error`, `http.client.response.finish`.

### `node:domain`

Deprecated error-handling domains (sync-only). Supported API:

- `domain.create()` / `domain.createDomain()` — create a new Domain
- `domain.active` — currently active domain (live binding)
- `domain._stack` — internal domain stack
- `Domain` class (extends `EventEmitter`):
  - `run(fn, ...args)` — run function in domain context, catching sync errors
  - `add(emitter)` / `remove(emitter)` — explicitly bind/unbind EventEmitters
  - `bind(callback)` — wrap callback with domain error routing
  - `intercept(callback)` — wrap error-first callback with domain error routing
  - `enter()` / `exit()` — manually push/pop domain stack
  - `dispose()` — clean up domain (remove members, listeners)
  - `members` — array of explicitly added emitters
  - `parent` — parent domain (set on `enter()`)
- `process.domain` — reflects active domain
- Error decoration: `error.domain`, `error.domainEmitter`, `error.domainBound`, `error.domainThrown`
- EventEmitter integration: unhandled `'error'` events on domained emitters route to the domain
- Async propagation: `process.nextTick`, `setTimeout`, `setInterval` callbacks auto-bind to active domain

**Limitation:** No async context propagation via `async_hooks` — only synchronous errors and explicitly bound callbacks are captured.

### `node:async_hooks`

- `AsyncLocalStorage` — `run`, `exit`, `getStore`, `enterWith`, `disable`, `snapshot`, `bind`
- `AsyncResource` — `runInAsyncScope`, `asyncId`, `triggerAsyncId`, `bind`
- `createHook` — stub (returns enable/disable no-ops)
- `executionAsyncId`, `triggerAsyncId`, `executionAsyncResource` — stubs

Context propagation works through `Promise.prototype.then/catch/finally` and `setTimeout`/`setInterval`. **Limitation:** QuickJS `await` uses internal C-level `perform_promise_then` which bypasses JS-visible `Promise.prototype.then`, so context is **not** propagated across `await` boundaries.

### `node:trace_events`

Partial compatibility API to unblock modules that inspect tracing state.

- `createTracing({ categories: string[] })` — creates a `Tracing` handle
- `Tracing#enable()` / `Tracing#disable()` — toggles local tracing state
- `Tracing#enabled` / `Tracing#categories` — read tracing configuration
- `getEnabledCategories()` — returns currently enabled categories as a comma-separated string

**Limitation:** No native trace sink is implemented in the WASM runtime; this is API-surface compatibility only.

### Crypto (global)
- `crypto.randomUUID`
- `crypto.getRandomValues`

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

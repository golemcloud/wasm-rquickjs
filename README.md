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

By default both feature flags are enabled.

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
| Signed 64-bit integer   | `s64`               | `number`                                          | -                                                                             |
| Unsigned 64-bit integer | `u64`               | `number`                                          | -                                                                             |
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
- `debug`
- `error`
- `group`
- `groupCollapsed`
- `groupEnd`
- `info`
- `log`
- `trace`
- `warn`

#### HTTP (fetch)

Only if the `http` feature flag is enabled in the generated crate. It depends on `wasi:http`.

- `fetch`
- `Headers`
- `Response`
- `FormData`
- `Blob`
- `File`

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


#### Encoding

- `TextEncoder`
- `TextDecoder`
- `TextDecoderStream`
- `TextEncoderStream`

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


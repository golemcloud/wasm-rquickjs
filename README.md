# wasm-rquickjs

## Introduction

Command line tool and library to generate a Rust crate wrapping JavaScript code into a WebAssembly Component using the
QuickJS engine.

### Comparison with ComponentizeJS

### Comparison with wasmedge-quickjs

## Mappings

### Exports

#### Top level exported functions

The following WIT code:

```wit
package demo:package;

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
package demo:package;

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
package demo: package;

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

# wasm-rquickjs

## Introduction

Command line tool and library to generate a Rust crate wrapping JavaScript code into a WebAssembly Component using the
QuickJS engine.

### Comparison with ComponentizeJS

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

All names are converted to camelCase. The JavaScript `this` is bound to object representing the exporter interface, in the above example it is `sampleApi`.

### Types

| Name   | WIT      | JS       | Notes |
|--------|----------|----------|-------|
| String | `string` | `string` | -     |

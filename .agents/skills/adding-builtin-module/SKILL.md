---
name: adding-builtin-module
description: "Scaffolds and registers a new Node.js-compatible built-in module in the skeleton. Use when asked to add a new node:X module, implement a new built-in, or create a new native+JS module pair."
---

# Adding a New Built-in Module

Step-by-step guide for adding a new Node.js-compatible built-in module to the skeleton.

## Architecture

Built-in modules use a **hybrid native+JS pattern**:
- **Rust native bridge**: Low-level operations via `#[rquickjs::module]`, registered as `__wasm_rquickjs_builtin/<name>_native`
- **JS wrapper**: High-level Node.js-compatible API surface, imports from the native bridge

## Checklist

### 1. Create the Rust native module

File: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.rs`

```rust
use rquickjs::module::ModuleDef;
use rquickjs::prelude::*;

pub const <NAME>_JS: &str = include_str!("<name>.js");
pub const REEXPORT_JS: &str = r#"export { default } from 'node:<name>'; export * from 'node:<name>';"#;
pub const WIRE_JS: &str = "";  // Only if globals need wiring

#[rquickjs::module]
mod native_module {
    // Export functions here
    #[rquickjs::function]
    pub fn example_function() -> String {
        "hello".to_string()
    }
}

pub use native_module::js_native_module;
```

### 2. Create the JS wrapper

File: `crates/wasm-rquickjs/skeleton/src/builtin/<name>.js`

```javascript
import { example_function } from '__wasm_rquickjs_builtin/<name>_native';
// NOTE: Always use original Rust snake_case names in imports!

// Implement Node.js-compatible API surface
const result = example_function();

export { result };
export default { result };
```

### 3. Add dependencies (if needed)

Edit `crates/wasm-rquickjs/skeleton/Cargo.toml_`:
- Always use `default-features = false` for crates that may pull in C/native libraries
- Use pure-Rust backends (e.g., `rust_backend` feature) for `wasm32-wasip2` compatibility

### 4. Register in `mod.rs`

File: `crates/wasm-rquickjs/skeleton/src/builtin/mod.rs`

Four places need updating:

**a) Add the module declaration** (top of file):
```rust
mod <name>;
```

**b) Add to `add_module_resolvers`** — register the internal native path and public names:
```rust
.with_module("__wasm_rquickjs_builtin/<name>_native")
.with_module("node:<name>")
.with_module("<name>")
```

**c) Add to `module_loader` (ModuleLoader)** — map native path to Rust module:
```rust
.with_module("__wasm_rquickjs_builtin/<name>_native", <name>::js_native_module)
```

**d) Add to `module_loader` (BuiltinLoader)** — map public names to JS constants:
```rust
.with_module("node:<name>", <name>::<NAME>_JS)
.with_module("<name>", <name>::REEXPORT_JS)
```

**e) (Optional) Add to `wire_builtins`** — if the module needs to attach globals:
```rust
writeln!(result, "{}", <name>::WIRE_JS).unwrap();
```

### 5. Update README.md

Add the new module to the supported APIs list in `README.md`.

## Critical Gotchas

### `#[rquickjs::module(rename = ...)]` does NOT affect JS imports
The `rename` attribute (e.g., `rename = "camelCase"`) only affects Rust-side naming. JavaScript `import` statements must always use the **original Rust `snake_case` names**. Importing the camelCase version causes "Could not find export" errors.

### `u32` return value truncation
`rquickjs` may deliver `u32` as signed i32 to JavaScript (e.g., `0xFFFFFFFF` → `-1`). In the JS wrapper, apply `>>> 0`:
```javascript
const result = native_fn() >>> 0;
```

### CJS default export immutability
Use `Object.defineProperty` with `writable: false, configurable: false` on default export objects to emulate Node.js behavior where module constants are immutable.

### WASM-compatible dependencies
Always use `default-features = false` for crates that may pull in C libraries. Use pure-Rust backends to ensure `wasm32-wasip2` target compatibility.

### No platform-conditional code
The skeleton is **always compiled to `wasm32-wasip1`**. Never write conditional code that checks for unix/windows/macOS or any other host platform (e.g., `#[cfg(unix)]`, `#[cfg(windows)]`, `#[cfg(target_os = "...")]`, `process.platform === "win32"`, `path.sep === "\\"`, etc.). Such checks are meaningless in the WASM target and add dead code complexity.

### node:http transport rule
**Never use a loopback transport for `node:http`.** Every `node:http` client request MUST go through `wasi:http` (the native Rust `NodeHttpClientRequest`). Do NOT add any fallback that bypasses `wasi:http` by creating direct `node:net` socket connections for loopback/localhost addresses.

## Testing

1. Define an example in `examples/runtime/` (JS file + WIT interface pair)
2. Add tests in `tests/runtime.rs` that use the example
3. Run: `cargo test --test runtime <module> -- --nocapture`

If also adding node_compat coverage, use the `fixing-node-compat-test` skill for that workflow.

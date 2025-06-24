use std::fmt::Write;

mod console;

pub fn add_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    resolver
        .with_module("__wasm_rquickjs_builtin/console_native")
        .with_module("__wasm_rquickjs_builtin/console")
}

pub fn module_loader() -> (
    rquickjs::loader::ModuleLoader,
    rquickjs::loader::BuiltinLoader,
) {
    (
        rquickjs::loader::ModuleLoader::default().with_module(
            "__wasm_rquickjs_builtin/console_native",
            console::js_native_module,
        ),
        rquickjs::loader::BuiltinLoader::default()
            .with_module("__wasm_rquickjs_builtin/console", console::CONSOLE_JS),
    )
}

pub fn wire_builtins() -> String {
    let mut result = String::new();
    writeln!(result, "{}", console::WIRE_JS).unwrap();
    result
}

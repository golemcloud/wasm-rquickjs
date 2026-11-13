// Empty file, to be generated

mod builtin;
pub mod internal;
mod modules;
pub mod wrappers;

static JS_EXPORT_MODULE_NAME: &str = "bundle/script_module";
static JS_EXPORT_MODULE_SOURCE: &str = include_str!("bundle_script_module.js");

fn js_export_module() -> &'static str {
    JS_EXPORT_MODULE_SOURCE
}

type GetModuleFn = Box<dyn (Fn() -> String) + Send + Sync>;

static JS_ADDITIONAL_MODULES: std::sync::LazyLock<Vec<(&str, GetModuleFn)>> =
    std::sync::LazyLock::new(Vec::new);

// Empty file, to be generated

mod builtin;
pub mod internal;
mod modules;
pub mod wrappers;

static JS_EXPORT_MODULE_NAME: &str = "bundle/script_module";
static JS_EXPORT_MODULE: &str = include_str!("bundle_script_module.js");

static JS_ADDITIONAL_MODULES: std::sync::LazyLock<
    Vec<(&str, Box<dyn (Fn() -> String) + Send + Sync>)>,
> = std::sync::LazyLock::new(|| vec![]);

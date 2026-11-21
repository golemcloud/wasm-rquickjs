use std::collections::HashMap;
use std::sync::Arc;

use rquickjs::loader::{ImportAttributes, Loader};
use rquickjs::module::Declared;
use rquickjs::{Ctx, Error, Module, Result};

use super::sync_exports::{FacadeExports, facade_source, implementation_name};

enum BuiltinSource {
    Static(&'static str),
    Facade {
        name: &'static str,
        exports: Arc<FacadeExports>,
    },
}

/// Borrows embedded sources and retains only descriptors for public facades.
#[derive(Default)]
pub struct BuiltinSourceLoader {
    modules: HashMap<String, BuiltinSource>,
}

impl BuiltinSourceLoader {
    pub fn with_module(mut self, name: impl Into<String>, source: &'static str) -> Self {
        self.modules
            .insert(name.into(), BuiltinSource::Static(source));
        self
    }

    pub(super) fn with_facade(mut self, name: &'static str, exports_source: &'static str) -> Self {
        self.modules.insert(
            name.to_string(),
            BuiltinSource::Facade {
                name,
                exports: FacadeExports::for_source(exports_source),
            },
        );
        self
    }
}

impl Loader for BuiltinSourceLoader {
    fn load<'js>(
        &mut self,
        ctx: &Ctx<'js>,
        path: &str,
        _attributes: Option<ImportAttributes<'js>>,
    ) -> Result<Module<'js, Declared>> {
        // Match BuiltinLoader: even a failed declaration consumes the entry.
        let source = self
            .modules
            .remove(path)
            .ok_or_else(|| Error::new_loading(path))?;
        match source {
            BuiltinSource::Static(source) => Module::declare(ctx.clone(), path, source.as_bytes()),
            BuiltinSource::Facade { name, exports } => {
                let source = facade_source(name, &implementation_name(name), &exports);
                Module::declare(ctx.clone(), path, source)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rquickjs::loader::BuiltinResolver;
    use rquickjs::{Context, Runtime};
    use std::cell::Cell;
    use std::rc::Rc;

    struct ObservedLoader {
        loader: BuiltinSourceLoader,
        facades: Rc<Cell<usize>>,
    }

    impl Loader for ObservedLoader {
        fn load<'js>(
            &mut self,
            ctx: &Ctx<'js>,
            path: &str,
            attributes: Option<ImportAttributes<'js>>,
        ) -> Result<Module<'js, Declared>> {
            let module = self.loader.load(ctx, path, attributes)?;
            if path == "used" {
                self.facades.set(self.facades.get() + 1);
            }
            Ok(module)
        }
    }

    #[test]
    fn repeated_imports_generate_one_facade_per_runtime() {
        let facades = Rc::new(Cell::new(0));
        for expected in 1..=2 {
            let runtime = Runtime::new().unwrap();
            let implementation = implementation_name("used");
            let loader = BuiltinSourceLoader::default()
                .with_module(implementation.clone(), "export default {};")
                .with_facade("used", "export default {};");
            assert_eq!(facades.get(), expected - 1);
            runtime.set_loader(
                BuiltinResolver::default()
                    .with_module("used")
                    .with_module(implementation),
                ObservedLoader {
                    loader,
                    facades: facades.clone(),
                },
            );
            let context = Context::full(&runtime).unwrap();
            context.with(|ctx| {
                Module::declare(ctx.clone(), "first", "import 'used';").unwrap();
                assert_eq!(facades.get(), expected);
                Module::declare(ctx, "second", "import 'used';").unwrap();
                assert_eq!(facades.get(), expected);
            });
        }
    }

    #[test]
    fn fresh_runtimes_use_the_registered_export_source() {
        const SOURCE: &str = "export const first = 1; export const second = 2;";
        let first_only = &SOURCE[.."export const first = 1;".len()];
        for (exports_source, has_second) in
            [(first_only, false), (SOURCE, true), (first_only, false)]
        {
            let runtime = Runtime::new().unwrap();
            let context = Context::full(&runtime).unwrap();
            context.with(|ctx| {
                ctx.eval::<(), _>(
                    r#"
                    globalThis.__wasm_rquickjs_builtin_facade_has_own = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
                    globalThis.__wasm_rquickjs_builtin_facade_object_create = Object.create;
                    globalThis.__wasm_rquickjs_builtin_facade_define_property = Object.defineProperty;
                    globalThis.__wasm_rquickjs_builtin_facade_object_keys = Object.keys;
                    "#,
                )
                .unwrap();
                Module::declare(
                    ctx.clone(),
                    implementation_name("used"),
                    "export const first = 1; export const second = 2; export default {};",
                )
                .unwrap();
                let module = BuiltinSourceLoader::default()
                    .with_facade("used", exports_source)
                    .load(&ctx, "used", None)
                    .unwrap();
                let (module, promise) = module.eval().unwrap();
                promise.finish::<()>().unwrap();
                assert_eq!(
                    module.namespace().unwrap().contains_key("second").unwrap(),
                    has_second,
                );
            });
        }
    }

    #[test]
    fn declarations_consume_sources_even_on_failure() {
        let runtime = Runtime::new().unwrap();
        let context = Context::full(&runtime).unwrap();
        context.with(|ctx| {
            let mut loader = BuiltinSourceLoader::default()
                .with_module("valid", "export default 42;")
                .with_module("invalid", "export const = ;");
            assert!(loader.load(&ctx, "missing", None).unwrap_err().is_loading());
            loader.load(&ctx, "valid", None).unwrap();
            assert!(loader.load(&ctx, "valid", None).unwrap_err().is_loading());
            assert!(
                loader
                    .load(&ctx, "invalid", None)
                    .unwrap_err()
                    .is_exception()
            );
            let _exception = ctx.catch();
            assert!(loader.load(&ctx, "invalid", None).unwrap_err().is_loading());
        });
    }

    #[test]
    fn unused_facades_are_not_generated() {
        let runtime = Runtime::new().unwrap();
        let context = Context::full(&runtime).unwrap();
        context.with(|ctx| {
            Module::declare(
                ctx.clone(),
                implementation_name("used"),
                "export const value = 42; export default { value };",
            )
            .unwrap();
            // An unresolved star export panics if facade generation is attempted.
            let mut loader = BuiltinSourceLoader::default()
                .with_facade("unused", "export * from 'unresolved';")
                .with_facade("used", "export const value = 42; export default { value };");
            loader.load(&ctx, "used", None).unwrap();
            assert!(loader.load(&ctx, "used", None).unwrap_err().is_loading());
        });
    }
}

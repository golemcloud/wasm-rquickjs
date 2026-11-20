// Empty file, to be generated

pub const NATIVE_MODULE_NAMES: &[&str] = &[];

pub static CUSTOM_INVOCATION_CONTEXT_HOST: Option<
    crate::internal::custom_invocation_context::Host,
> = None;

pub fn add_native_module_resolvers(
    resolver: rquickjs::loader::BuiltinResolver,
) -> rquickjs::loader::BuiltinResolver {
    resolver
}

pub fn module_loader() -> rquickjs::loader::ModuleLoader {
    rquickjs::loader::ModuleLoader::default()
}

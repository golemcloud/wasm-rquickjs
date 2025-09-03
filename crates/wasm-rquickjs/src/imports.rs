use crate::javascript::escape_js_ident;
use crate::rust_bindgen::RustWitFunction;
use crate::types::{
    WrappedType, get_function_name, get_wrapped_type, ident_in_imported_interface_or_global,
    process_parameter, to_unwrapped_param_refs, to_wrapped_func_arg_list,
};
use crate::{GeneratorContext, ImportedInterface};
use anyhow::{Context, anyhow};
use heck::{ToLowerCamelCase, ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span, TokenStream};
use quote::quote;
use std::collections::BTreeMap;
use syn::LitStr;
use wit_parser::{FunctionKind, TypeDefKind, WorldItem, WorldKey};

/// Generates the `mod.rs` and one file per imported interface in the `<output>/src/modules`
/// directory.
/// Each Rust module contains a rquicks `NativeModule` exposing the WIT bindings for the
/// imported WIT interfaces as JavaScript modules.
pub fn generate_import_modules(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    let (global, interfaces) = collect_imported_interfaces(context)?;

    for interface in &interfaces {
        let module_name = interface.module_name()?;
        let file_name = format!("{module_name}.rs");

        let module_path = context.output.join("src").join("modules").join(&file_name);
        let module_tokens = generate_import_module(context, interface, &interfaces)?;

        let module_ast: syn::File = syn::parse2(module_tokens)
            .context(format!("failed to parse generated {file_name} tokens"))?;

        let module_src = prettier_please::unparse(&module_ast);

        std::fs::write(&module_path, module_src)?;
    }

    let global_module_path = context.output.join("src").join("modules").join("mod.rs");
    let global_module_tokens = generate_import_module(context, &global, &interfaces)?;

    let global_module_ast: syn::File =
        syn::parse2(global_module_tokens).context("failed to parse generated mod.rs tokens")?;
    let global_module_src = prettier_please::unparse(&global_module_ast);
    std::fs::write(&global_module_path, global_module_src)?;

    Ok(())
}

pub fn collect_imported_interfaces<'a>(
    context: &'a GeneratorContext<'a>,
) -> anyhow::Result<(ImportedInterface<'a>, Vec<ImportedInterface<'a>>)> {
    let world = &context.resolve.worlds[context.world];

    let mut global_imports = Vec::new();
    let mut interfaces = Vec::new();

    for (name, import) in &world.imports {
        let name = match name {
            WorldKey::Name(name) => name.as_str(),
            WorldKey::Interface(id) => {
                let interface = &context.resolve.interfaces[*id];
                interface
                    .name
                    .as_ref()
                    .ok_or_else(|| anyhow!("Interface import does not have a name"))?
                    .as_str()
            }
        };
        match import {
            WorldItem::Interface { id, .. } => {
                interfaces.push(context.get_imported_interface(id)?);
            }
            WorldItem::Function(function) => {
                global_imports.push((name, function));
            }
            WorldItem::Type(_) => {}
        }
    }

    let global = ImportedInterface {
        package_name: None,
        name: context.world_name.to_upper_camel_case(),
        functions: global_imports,
        interface: None,
        interface_id: None,
    };

    Ok((global, interfaces))
}

fn generate_import_module(
    context: &GeneratorContext<'_>,
    import: &ImportedInterface<'_>,
    all_imported_interfaces: &[ImportedInterface<'_>],
) -> anyhow::Result<TokenStream> {
    let mut submodules = Vec::new();
    let mut loader_init = quote! {};
    if import.interface.is_none() {
        let mut resolver_chain = Vec::new();
        let mut loader_chain = Vec::new();

        // This is the global module
        for interface in all_imported_interfaces {
            let module_name = interface.module_name()?;
            let module_ident = Ident::new(&module_name, Span::call_site());
            submodules.push(quote! { pub mod #module_ident; });

            let rust_module_struct_ident = interface.rust_interface_name();
            let fully_qualified_interface = interface.fully_qualified_interface_name();
            let fully_qualified_interface_lit =
                LitStr::new(&fully_qualified_interface, Span::call_site());

            resolver_chain.push(quote! { with_module(#fully_qualified_interface_lit)});
            loader_chain.push(quote! { with_module(#fully_qualified_interface_lit, crate::modules::#module_ident::#rust_module_struct_ident) });
        }

        if all_imported_interfaces.is_empty() {
            loader_init = quote! {
                pub fn add_native_module_resolvers(resolver: rquickjs::loader::BuiltinResolver) -> rquickjs::loader::BuiltinResolver {
                    resolver
                }

                pub fn module_loader() -> rquickjs::loader::ModuleLoader {
                  rquickjs::loader::ModuleLoader::default()
                }
            };
        } else {
            loader_init = quote! {
                pub fn add_native_module_resolvers(resolver: rquickjs::loader::BuiltinResolver) -> rquickjs::loader::BuiltinResolver {
                    resolver.#(#resolver_chain).*
                }

                pub fn module_loader() -> rquickjs::loader::ModuleLoader {
                  rquickjs::loader::ModuleLoader::default().#(#loader_chain).*
                }
            };
        }
    }

    let rust_interface_name = import.rust_interface_name();

    let mut bridge_functions = Vec::new();
    let mut bridge_classes = Vec::new();
    let mut declarations = Vec::new();
    let mut exports = Vec::new();
    let mut resource_functions = BTreeMap::new();

    // Preinitialize resource_functions from types to have entries for resources with no methods
    if let Some(iface) = import.interface {
        for (_, type_id) in &iface.types {
            let typ = context
                .resolve
                .types
                .get(*type_id)
                .ok_or_else(|| anyhow!("Unknown type id {type_id:?}"))?;
            if typ.kind == TypeDefKind::Resource {
                resource_functions.insert(*type_id, Vec::new());
            }
        }
    }

    // Process all imported functions
    for (name, function) in &import.functions {
        match &function.kind {
            FunctionKind::Freestanding => {
                let rust_fn = RustWitFunction::new(context, name, function);

                let rust_function_name = &rust_fn.function_name;
                let rust_function_ident = rust_fn.function_name_ident();

                let js_function_name = escape_js_ident(name.to_lower_camel_case());
                let js_function_lit = LitStr::new(&js_function_name, Span::call_site());
                let js_bridge_name = format!("js_{rust_function_name}");
                let js_bridge_ident = Ident::new(&js_bridge_name, Span::call_site());

                declarations.push(quote! { decl.declare(#js_function_lit)? });

                exports.push(quote! { exports.export(#js_function_lit, #js_bridge_ident)? });

                let bindgen_path = ident_in_imported_interface_or_global(
                    context,
                    rust_function_ident.clone(),
                    import.name_and_interface(),
                );

                let parameters = function
                    .params
                    .iter()
                    .zip(rust_fn.export_parameters)
                    .zip(rust_fn.import_parameters)
                    .map(
                        |(((param_name, param_type), export_parameter), import_parameter)| {
                            process_parameter(
                                context,
                                param_name,
                                param_type,
                                &export_parameter,
                                &import_parameter,
                            )
                        },
                    )
                    .collect::<anyhow::Result<Vec<_>>>()?;

                let param_list: Vec<TokenStream> = to_wrapped_func_arg_list(&parameters);

                let param_refs: Vec<TokenStream> = to_unwrapped_param_refs(&parameters);
                let func_ret = match &function.result {
                    Some(typ) => {
                        get_wrapped_type(context, &rust_fn.return_type, &rust_fn.return_type, typ)
                            .context(format!("Failed to encode result type for {name}"))?
                    }
                    None => WrappedType::unit(),
                };
                let original_result = &func_ret.original_type_ref;
                let wrapped_result = &func_ret.wrapped_type_ref;
                let wrap = &func_ret.wrap;
                let wrap_result = wrap.run(quote! { result });

                bridge_functions.push(quote! {
                    #[rquickjs::function]
                    fn #rust_function_ident(#(#param_list),*) -> #wrapped_result {
                        let result: #original_result = #bindgen_path(#(#param_refs),*);
                        #wrap_result
                    }
                });
            }
            FunctionKind::AsyncFreestanding
            | FunctionKind::AsyncMethod(_)
            | FunctionKind::AsyncStatic(_) => {
                Err(anyhow!("Async imported functions are not supported yet"))?
            }
            FunctionKind::Method(type_id)
            | FunctionKind::Static(type_id)
            | FunctionKind::Constructor(type_id) => {
                resource_functions
                    .entry(*type_id)
                    .or_insert_with(Vec::new)
                    .push((name, function));
            }
        }
    }

    for (resource_type_id, resource_funcs) in resource_functions {
        let typ = context
            .resolve
            .types
            .get(resource_type_id)
            .ok_or_else(|| anyhow!("Unknown resource type id"))?;

        let resource_name = typ
            .name
            .as_ref()
            .ok_or_else(|| anyhow!("Resource type has no name"))?;
        let resource_name_ident =
            Ident::new(&resource_name.to_upper_camel_case(), Span::call_site());
        let borrow_wrapper_ident = Ident::new(
            &format!("Borrow{resource_name_ident}Wrapper"),
            Span::call_site(),
        );
        let resource_name_lit = LitStr::new(
            &resource_name_ident.to_string().to_upper_camel_case(),
            Span::call_site(),
        );

        let bindgen_path = ident_in_imported_interface_or_global(
            context,
            resource_name_ident.clone(),
            import.name_and_interface(),
        );

        let constructor_function = resource_funcs
            .iter()
            .find(|(_, f)| matches!(f.kind, FunctionKind::Constructor(_)));
        let constructor = if let Some((_, constructor_function)) = constructor_function {
            let rust_fn = RustWitFunction::new(context, "new", constructor_function);

            let parameters = constructor_function
                .params
                .iter()
                .zip(rust_fn.export_parameters)
                .zip(rust_fn.import_parameters)
                .map(
                    |(((param_name, param_type), export_parameter), import_parameter)| {
                        process_parameter(
                            context,
                            param_name,
                            param_type,
                            &export_parameter,
                            &import_parameter,
                        )
                    },
                )
                .collect::<anyhow::Result<Vec<_>>>()?;

            let param_list: Vec<TokenStream> = to_wrapped_func_arg_list(&parameters);
            let param_refs: Vec<TokenStream> = to_unwrapped_param_refs(&parameters);
            quote! {
                #[qjs(constructor)]
                pub fn new(#(#param_list),*) -> Self {
                  Self {
                    inner: Some(std::rc::Rc::new(#bindgen_path::new(#(#param_refs),*))),
                  }
                }
            }
        } else {
            quote! {}
        };

        let mut methods: Vec<TokenStream> = Vec::new();
        for (name, function) in resource_funcs {
            let name = get_function_name(name, function)?;

            let rust_fn = RustWitFunction::new(context, &name, function);

            let rust_method_name_ident = rust_fn.function_name_ident();

            let parameters = function
                .params
                .iter()
                .zip(rust_fn.export_parameters)
                .zip(rust_fn.import_parameters)
                .map(
                    |(((param_name, param_type), export_parameter), import_parameter)| {
                        process_parameter(
                            context,
                            param_name,
                            param_type,
                            &export_parameter,
                            &import_parameter,
                        )
                    },
                )
                .collect::<anyhow::Result<Vec<_>>>()?;

            let param_list: Vec<TokenStream> = to_wrapped_func_arg_list(&parameters);

            let param_refs: Vec<TokenStream> = to_unwrapped_param_refs(&parameters);

            let func_ret = match &function.result {
                Some(typ) => {
                    get_wrapped_type(context, &rust_fn.return_type, &rust_fn.return_type, typ)
                        .context(format!("Failed to encode result type for {name}"))?
                }
                None => WrappedType::unit(),
            };
            let original_result = &func_ret.original_type_ref;
            let wrapped_result = &func_ret.wrapped_type_ref;
            let wrap = &func_ret.wrap;
            let wrap_result = wrap.run(quote! { result });

            match &function.kind {
                FunctionKind::Method(_) => {
                    let param_list = param_list[1..].to_vec();
                    let param_refs = param_refs[1..].to_vec();
                    methods.push(quote! {
                       pub fn #rust_method_name_ident(&self, #(#param_list),*) -> #wrapped_result {
                            let result: #original_result = self
                              .inner
                              .as_ref()
                              .expect("Resource has already been disposed")
                              .deref()
                              .#rust_method_name_ident(#(#param_refs),*);
                            #wrap_result
                        }
                    });
                }
                FunctionKind::Static(_) => {
                    methods.push(quote!{
                       #[qjs(static)]
                       pub fn #rust_method_name_ident(#(#param_list),*) -> #wrapped_result {
                            let result: #original_result = #bindgen_path::#rust_method_name_ident(#(#param_refs),*);
                            #wrap_result
                       }
                    });
                }
                _ => {
                    // skip
                }
            }
        }

        let mut special_methods = Vec::new();
        if resource_name == "pollable"
            && &import.name == "poll"
            && import
                .package_name
                .as_ref()
                .map(|p| format!("{}:{}", p.namespace, p.name))
                == Some("wasi:io".to_string())
        {
            special_methods.push(quote! {
                pub async fn promise(&mut self) -> () {
                    let js_state = crate::internal::get_js_state();
                    let reactor = js_state.reactor.borrow().clone().unwrap();

                    let pollable = self.inner.take().expect("Resource has already been disposed");
                    let pollable: wasi::io::poll::Pollable = unsafe { wasi::io::poll::Pollable::from_handle(pollable.take_handle()) };
                    reactor.wait_for(pollable).await;
                }
            });
        }

        let rquickjs_class =
            generate_rquickjs_class_module(resource_name, &resource_name_ident, &resource_name_lit);

        bridge_classes.push(quote! {
            #[derive(Clone, JsLifetime, Trace)]
            pub struct #resource_name_ident {
                #[qjs(skip_trace = true)]
                inner: Option<std::rc::Rc<#bindgen_path>>,
            }

            #rquickjs_class

            #[rquickjs::methods(rename_all = "camelCase")]
            impl #resource_name_ident {
                #constructor

                #(#methods)*

                #[qjs(rename="__dispose")]
                pub fn __dispose(&mut self) {
                    let _ = self.inner.take();
                }

                #(#special_methods)*
            }

            impl<'js> rquickjs::IntoJs<'js> for #bindgen_path {
                fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                    #resource_name_ident {
                        inner: Some(std::rc::Rc::new(self)),
                    }
                    .into_js(ctx)
                }
            }

            impl<'js> rquickjs::FromJs<'js> for #bindgen_path {
                fn from_js(ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                    let wrapper = #resource_name_ident::from_js(ctx, value)?;
                    unsafe {
                        Ok(
                            #bindgen_path::from_handle(
                                wrapper
                                  .inner
                                  .ok_or_else(|| rquickjs::Error::FromJs { from: "JavaScript object", to: #resource_name_lit, message: Some("Resource has already been disposed".to_string()) })?
                                  .take_handle(),
                            ),
                        )
                    }
                }
            }

            pub struct #borrow_wrapper_ident(pub #bindgen_path);

            impl<'js> rquickjs::FromJs<'js> for #borrow_wrapper_ident {
                fn from_js(ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                    let wrapper = #resource_name_ident::from_js(ctx, value)?;
                    unsafe {
                        Ok(#borrow_wrapper_ident(
                            #bindgen_path::from_handle(
                                wrapper
                                  .inner
                                  .ok_or_else(|| rquickjs::Error::FromJs { from: "JavaScript object", to: #resource_name_lit, message: Some("Resource has already been disposed".to_string()) })?
                                  .handle(),
                            ),
                        ))
                    }
                }
            }

            impl Drop for #borrow_wrapper_ident {
                fn drop(&mut self) {
                    // By taking out the handle from the resource it is not going to be dropped
                    let _ = self.0.take_handle();
                }
            }
        });

        let js_class_lit = LitStr::new(
            &resource_name_ident.to_string().to_upper_camel_case(),
            Span::call_site(),
        );
        declarations.push(quote! { decl.declare(#js_class_lit)? });
        exports.push(
            quote! { exports.export(#js_class_lit, #resource_name_ident::constructor(ctx)?)? },
        );
    }

    let module = quote! {
        use rquickjs::JsLifetime;
        use rquickjs::class::{JsClass, Trace};
        use std::ops::Deref;

        #(#submodules)*

        #loader_init

        #(#bridge_functions)*

        #(#bridge_classes)*

        pub struct #rust_interface_name;

        impl rquickjs::module::ModuleDef for #rust_interface_name {
            fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
                #(#declarations);*;
                Ok(())
            }

            fn evaluate<'js>(
                ctx: &rquickjs::Ctx<'js>,
                exports: &rquickjs::module::Exports<'js>,
            ) -> rquickjs::Result<()> {
                #(#exports);*;
                Ok(())
            }
        }
    };

    Ok(module)
}

/// This function generates what the #[rquickjs::class] macro would, with an additional
/// wiring of the `[Symbol.dispose]` method to the `__dispose` method of the class.
///
/// This is necessary because we cannot bind the Rust dispose method to `Symbol.dispose` with
/// the macros.
fn generate_rquickjs_class_module(
    resource_name: &str,
    resource_name_ident: &Ident,
    resource_name_lit: &LitStr,
) -> TokenStream {
    let mod_name = Ident::new(
        &format!("__impl_class_{}_", resource_name.to_snake_case()),
        Span::call_site(),
    );

    quote! {
        mod #mod_name {
            pub use super::*;
            use rquickjs::{Atom, Symbol, Value};
            impl<'js> rquickjs::class::JsClass<'js> for #resource_name_ident {
                const NAME: &'static str = #resource_name_lit;
                type Mutable = rquickjs::class::Writable;
                fn prototype(ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<Option<rquickjs::Object<'js>>> {
                    use rquickjs::class::impl_::MethodImplementor;
                    let proto = rquickjs::Object::new(ctx.clone())?;
                    let implementor = rquickjs::class::impl_::MethodImpl::<Self>::new();
                    (&implementor).implement(&proto)?;

                    let dispose_symbol: Symbol = ctx.globals().get(crate::internal::DISPOSE_SYMBOL)?;
                    let dispose_fn: Value = proto.get("__dispose")?;
                    proto.set(dispose_symbol, dispose_fn)?;

                    Ok(Some(proto))
                }
                fn constructor(
                    ctx: &rquickjs::Ctx<'js>,
                ) -> rquickjs::Result<Option<rquickjs::function::Constructor<'js>>> {
                    use rquickjs::class::impl_::ConstructorCreator;
                    let implementor = rquickjs::class::impl_::ConstructorCreate::<Self>::new();
                    (&implementor).create_constructor(ctx)
                }
            }
            impl<'js> rquickjs::IntoJs<'js> for #resource_name_ident {
                fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                    let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
                    rquickjs::IntoJs::into_js(cls, ctx)
                }
            }
            impl<'js> rquickjs::FromJs<'js> for #resource_name_ident
            where
                for<'a> rquickjs::class::impl_::CloneWrapper<'a, Self>:
                    rquickjs::class::impl_::CloneTrait<Self>,
            {
                fn from_js(
                    ctx: &rquickjs::Ctx<'js>,
                    value: rquickjs::Value<'js>,
                ) -> rquickjs::Result<Self> {
                    use rquickjs::class::impl_::CloneTrait;
                    let value = rquickjs::class::Class::<Self>::from_js(ctx, value)?;
                    let borrow = value.try_borrow()?;
                    Ok(rquickjs::class::impl_::CloneWrapper(&*borrow).wrap_clone())
                }
            }
        }
    }
}

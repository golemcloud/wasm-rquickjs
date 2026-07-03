use crate::javascript::escape_js_ident;
use crate::rust_bindgen::RustWitFunction;
use crate::types::{
    get_function_name, get_return_type, ident_in_imported_interface_or_global, process_parameter,
    to_unwrapped_param_refs, to_wrapped_func_arg_list,
};
use crate::{GeneratorContext, ImportedInterface};
use anyhow::{Context, anyhow};
use heck::{ToLowerCamelCase, ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span, TokenStream};
use quote::quote;
use std::collections::BTreeMap;
use syn::LitStr;
use wit_parser::{Function, FunctionKind, TypeDefKind, WorldItem, WorldKey};

/// Generates the `mod.rs` and one file per imported interface in the `<output>/src/modules`
/// directory.
/// Each Rust module contains a rquicks `NativeModule` exposing the WIT bindings for the
/// imported WIT interfaces as JavaScript modules.
pub fn generate_import_modules(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    let (global, interfaces) = collect_imported_interfaces(context)?;

    // Functions and resources declared directly in the world (rather than inside an interface)
    // are a documented limitation ("only whole interfaces" are supported for imports). Such
    // functions - including the constructor/methods/statics of a world-level resource - end up in
    // the synthetic global import module, which is never registered with the QuickJS module
    // resolver/loader (only imported interfaces are), so they could never be imported from
    // JavaScript: under Preview 3 a freestanding async import would build but trap at runtime, and
    // a world-level resource would fail to compile. A resource declared in the world is also
    // unusable any other way (interfaces cannot reference world-level types, and exported
    // resources are rejected separately), so reject both explicitly on the Preview 3 path with a
    // clear, actionable message instead of silently emitting a broken or dead crate.
    if context.target.is_p3() {
        let mut offending = global
            .functions
            .iter()
            .map(|(name, _)| (*name).to_string())
            .collect::<Vec<_>>();

        let world = &context.resolve.worlds[context.world];
        for (key, item) in &world.imports {
            if let WorldItem::Type { id, .. } = item {
                let typ = context
                    .resolve
                    .types
                    .get(*id)
                    .ok_or_else(|| anyhow!("Unknown world-level type id {id:?}"))?;
                if typ.kind == TypeDefKind::Resource {
                    let name = typ.name.clone().unwrap_or_else(|| match key {
                        WorldKey::Name(name) => name.clone(),
                        WorldKey::Interface(_) => "<resource>".to_string(),
                    });
                    offending.push(name);
                }
            }
        }

        if !offending.is_empty() {
            let offending = offending.join(", ");
            return Err(anyhow!(
                "Functions or resources declared directly in the world are not supported by the \
                 WASI Preview 3 generation path ({offending}); declare them inside an imported \
                 interface instead"
            ));
        }
    }

    for interface in &interfaces {
        let module_name = interface.module_name()?;
        let file_name = format!("{module_name}.rs");

        let module_path = context.output.join("src").join("modules").join(&file_name);
        let module_tokens = generate_import_module(context, interface, &interfaces)?;

        let module_ast: syn::File = syn::parse2(module_tokens)
            .context(format!("failed to parse generated {file_name} tokens"))?;

        let module_src = prettier_please::unparse(&module_ast);

        crate::write_if_changed(&module_path, module_src)?;
    }

    let global_module_path = context.output.join("src").join("modules").join("mod.rs");
    let global_module_tokens = generate_import_module(context, &global, &interfaces)?;

    let global_module_ast: syn::File =
        syn::parse2(global_module_tokens).context("failed to parse generated mod.rs tokens")?;
    let global_module_src = prettier_please::unparse(&global_module_ast);
    crate::write_if_changed(&global_module_path, global_module_src)?;

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
            WorldItem::Type { .. } => {}
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

/// The three token fragments that wire one imported function into the generated rquickjs
/// native module: its `decl.declare(...)`, its `exports.export(...)`, and the bridge function
/// item itself.
struct FreestandingImportBridge {
    declaration: TokenStream,
    export: TokenStream,
    bridge_fn: TokenStream,
}

/// Builds the rquickjs bridge for a freestanding imported WIT function.
///
/// `is_async` selects between a synchronous bridge (`fn ...`, used by the Preview 2 target and
/// for synchronous Preview 3 imports) and an async bridge (`async fn ... .await`, used for
/// async Preview 3 imports). The async variant relies on rquickjs' `#[function]` macro support
/// for `async fn`s: the macro wraps the body in a `Promised` future, so the JavaScript side
/// receives a function that returns a promise, and the host async import is awaited on the
/// component-model async executor. For the `result<_, _>` case the bridge throws on the error
/// arm, which `Promised` turns into a rejected promise.
fn build_freestanding_import_bridge(
    context: &GeneratorContext<'_>,
    import: &ImportedInterface<'_>,
    name: &str,
    function: &Function,
    is_async: bool,
) -> anyhow::Result<FreestandingImportBridge> {
    let rust_fn = RustWitFunction::new(context, name, function);

    let rust_function_name = &rust_fn.function_name;
    let rust_function_ident = rust_fn.function_name_ident();

    let js_function_name = escape_js_ident(name.to_lower_camel_case());
    let js_function_lit = LitStr::new(&js_function_name, Span::call_site());
    let js_bridge_name = format!("js_{rust_function_name}");
    let js_bridge_ident = Ident::new(&js_bridge_name, Span::call_site());

    let declaration = quote! { decl.declare(#js_function_lit)? };
    let export = quote! { exports.export(#js_function_lit, #js_bridge_ident)? };

    let bindgen_path = ident_in_imported_interface_or_global(
        context,
        rust_function_ident.clone(),
        import.name_and_interface(),
    );

    // A `future<T>` / `stream<T>` return value is special-cased: the wit-bindgen import returns a
    // component reader, which the bridge lifts into a JS `Promise` / async-iterable and returns as
    // a plain JS `Value`.
    let async_return = function
        .result
        .as_ref()
        .map(|typ| crate::async_values::detect(context, typ))
        .transpose()?
        .flatten();

    // Whether any parameter is a `future<T>` / `stream<T>`, which must be lowered from a JS value
    // by a background writer.
    let has_async_value_params = function
        .params
        .iter()
        .map(|param| crate::async_values::detect(context, &param.ty))
        .collect::<anyhow::Result<Vec<_>>>()?
        .into_iter()
        .any(|detected| detected.is_some());

    // An async import that lowers JS `future<T>` / `stream<T>` parameters cannot use the plain
    // `#[rquickjs::function] async fn` (`Promised`/`ctx.spawn`) shape: while the root exported call
    // is parked awaiting its result promise it is the sole rquickjs runtime driver, and a writer
    // that drives the runtime via `async_with!` from another task clobbers that single scheduler
    // driver waker, causing a cross-executor lost-wakeup deadlock. Instead, generate a synchronous
    // bridge that returns a deferred JS promise, lowers each async-value parameter into a component
    // reader whose writer is fed purely from JS callbacks + a component-only write task (see
    // `js_to_reader_pure_expr`), and settles the promise from a single wit-bindgen task.
    if is_async && has_async_value_params {
        let bridge_fn = build_deferred_import_bridge(
            context,
            &rust_fn,
            name,
            function,
            &rust_function_ident,
            &bindgen_path,
            async_return.as_ref(),
        )?;
        return Ok(FreestandingImportBridge {
            declaration,
            export,
            bridge_fn,
        });
    }

    // Build the rquickjs bridge parameter list and the arguments forwarded to the wit-bindgen
    // import. A `future<T>` / `stream<T>` parameter is special-cased: the bridge receives the raw
    // JS value and lowers it into a component future/stream via `js_to_reader_expr` (which spawns
    // a background writer). Such parameters (and future/stream return values) need a `Ctx`, which
    // forces a shared `'js` lifetime on the bridge function.
    let mut param_list: Vec<TokenStream> = Vec::new();
    let mut param_refs: Vec<TokenStream> = Vec::new();
    let mut needs_ctx = false;
    for ((param, export_parameter), import_parameter) in function
        .params
        .iter()
        .zip(rust_fn.export_parameters.clone())
        .zip(rust_fn.import_parameters.clone())
    {
        if let Some(async_value) = crate::async_values::detect(context, &param.ty)? {
            needs_ctx = true;
            let ident = Ident::new(&export_parameter.name, Span::call_site());
            param_list.push(quote! { #ident: rquickjs::Value<'js> });
            param_refs.push(crate::async_values::js_to_reader_expr(
                context,
                &async_value,
                quote! { rquickjs::Persistent::save(&ctx, #ident) },
            )?);
        } else {
            let processed = process_parameter(
                context,
                &param.name,
                &param.ty,
                &export_parameter,
                &import_parameter,
            )?;
            let slice = std::slice::from_ref(&processed);
            param_list.extend(to_wrapped_func_arg_list(slice));
            param_refs.extend(to_unwrapped_param_refs(slice));
        }
    }

    let maybe_async = if is_async {
        quote! { async }
    } else {
        quote! {}
    };
    let maybe_await = if is_async {
        quote! { .await }
    } else {
        quote! {}
    };

    let bridge_fn = if let Some(async_value) = async_return {
        let reader_type = crate::async_values::reader_type(context, &async_value)?;
        let reader_to_js =
            crate::async_values::reader_to_js_expr(context, &async_value, quote! { result })?;
        quote! {
            #[rquickjs::function]
            #maybe_async fn #rust_function_ident<'js>(ctx: rquickjs::Ctx<'js>, #(#param_list),*) -> rquickjs::Result<rquickjs::Value<'js>> {
                let result: #reader_type = #bindgen_path(#(#param_refs),*) #maybe_await;
                rquickjs::IntoJs::into_js(#reader_to_js, &ctx)
            }
        }
    } else {
        let return_types = get_return_type(context, function, name, &rust_fn)?;
        let original_result = &return_types.wit_level_ret.original_type_ref;
        let wrapped_result = &return_types.func_ret.wrapped_type_ref;
        let wrap = &return_types.func_ret.wrap;
        let wrap_result = wrap.run(quote! { result });

        if let Some(exception) = &return_types.expected_exception {
            let wrapped_exception = &exception.wrapped_type_ref;
            let wrap_exception = exception.wrap.run(quote! { error });

            quote! {
                #[rquickjs::function]
                #maybe_async fn #rust_function_ident<'js>(ctx: rquickjs::Ctx<'js>, #(#param_list),*) -> rquickjs::Result<#wrapped_result> {
                    let result: #original_result = #bindgen_path(#(#param_refs),*) #maybe_await;
                    match result {
                        Ok(result) => Ok(#wrap_result),
                        Err(error) => {
                            let error: #wrapped_exception = #wrap_exception;
                            Err(ctx.throw(rquickjs::IntoJs::into_js(error, &ctx)?))
                        }
                    }
                }
            }
        } else if needs_ctx {
            quote! {
                #[rquickjs::function]
                #maybe_async fn #rust_function_ident<'js>(ctx: rquickjs::Ctx<'js>, #(#param_list),*) -> #wrapped_result {
                    let result: #original_result = #bindgen_path(#(#param_refs),*) #maybe_await;
                    #wrap_result
                }
            }
        } else {
            quote! {
                #[rquickjs::function]
                #maybe_async fn #rust_function_ident(#(#param_list),*) -> #wrapped_result {
                    let result: #original_result = #bindgen_path(#(#param_refs),*) #maybe_await;
                    #wrap_result
                }
            }
        }
    };

    Ok(FreestandingImportBridge {
        declaration,
        export,
        bridge_fn,
    })
}

/// Builds the bridge function for an **async import that lowers JS `future<T>` / `stream<T>`
/// parameters**.
///
/// Such a bridge cannot use the ordinary `#[rquickjs::function] async fn` shape (whose body is
/// wrapped by rquickjs into a `Promised`/`ctx.spawn` task): while the root exported call is parked
/// awaiting its result promise it is the sole rquickjs runtime driver, and a writer that drives the
/// runtime via `async_with!` from another task clobbers that single scheduler driver waker, causing
/// a cross-executor lost-wakeup deadlock in which the guest promise never resumes.
///
/// Instead this generates a **synchronous** bridge that:
///
/// 1. creates a deferred JS promise (`Promise::new`) and immediately returns it to JS;
/// 2. lowers each `future<T>` / `stream<T>` parameter into a component reader whose writer is fed
///    entirely from JS (promise `.then` callbacks / a JS async pump) plus a *pure* component-only
///    write task (see [`crate::async_values::js_to_reader_pure_expr`] /
///    `crate::internal::future_writer_from_js` / `crate::internal::stream_writer_from_js`), so no
///    background task ever drives the rquickjs runtime — this works whether the host consumes the
///    reader during the import call or stores it and consumes it from a later call;
/// 3. spawns a single wit-bindgen task that awaits the component import and then settles the
///    deferred promise ([`crate::internal::settle_import_promise`], which also pumps the QuickJS
///    job queue so the awaiting JS continuation resumes).
fn build_deferred_import_bridge(
    context: &GeneratorContext<'_>,
    rust_fn: &RustWitFunction,
    name: &str,
    function: &Function,
    rust_function_ident: &Ident,
    bindgen_path: &TokenStream,
    async_return: Option<&crate::async_values::AsyncValue>,
) -> anyhow::Result<TokenStream> {
    // The JS-facing bridge parameter list.
    let mut param_list: Vec<TokenStream> = Vec::new();
    // `let` bindings evaluated in the synchronous bridge body (while a `Ctx` is available), before
    // the background task is spawned. For a `future<T>` / `stream<T>` parameter this lowers the JS
    // value into a component reader and pushes the writer future onto `__writers`; for an ordinary
    // parameter this binds the owned wit-bindgen value (so it can be moved into the `'static`
    // background task; the possibly-borrowing import-arg conversion is applied *inside* the task,
    // where the owned local outlives the borrow).
    let mut arg_bindings: Vec<TokenStream> = Vec::new();
    // The expressions passed to the wit-bindgen import call inside the background task.
    let mut arg_exprs: Vec<TokenStream> = Vec::new();

    for (index, ((param, export_parameter), import_parameter)) in function
        .params
        .iter()
        .zip(rust_fn.export_parameters.clone())
        .zip(rust_fn.import_parameters.clone())
        .enumerate()
    {
        let arg_ident = Ident::new(&format!("__async_arg{index}"), Span::call_site());
        if let Some(async_value) = crate::async_values::detect(context, &param.ty)? {
            let name = Ident::new(&export_parameter.name, Span::call_site());
            param_list.push(quote! { #name: rquickjs::Value<'js> });
            // Lower the JS value into a component reader synchronously (a `Ctx` is available in the
            // bridge body). The writer is fed by JS promise `.then` callbacks / a JS async pump and
            // a pure component-model write task, so it never drives the rquickjs runtime and works
            // whether the host consumes the reader during or after the import call.
            let reader_expr = crate::async_values::js_to_reader_pure_expr(
                context,
                &async_value,
                quote! { &ctx },
                quote! { #name },
            )?;
            arg_bindings.push(quote! { let #arg_ident = #reader_expr; });
            arg_exprs.push(quote! { #arg_ident });
        } else {
            let processed = process_parameter(
                context,
                &param.name,
                &param.ty,
                &export_parameter,
                &import_parameter,
            )?;
            let slice = std::slice::from_ref(&processed);
            param_list.extend(to_wrapped_func_arg_list(slice));

            let wrapped = processed
                .wrapped_type
                .as_ref()
                .expect("process_parameter always produces a wrapped type");
            let owned = wrapped.unwrap.run(quote! { #arg_ident });
            let param_ident = &processed.ident;
            // Bind the JS-wrapped parameter to an owned wit-bindgen value.
            arg_bindings.push(quote! {
                let #arg_ident = #param_ident;
                let #arg_ident = #owned;
            });
            // Apply the (possibly borrowing) export->import conversion at the call site inside the
            // task, where the owned `#arg_ident` local outlives the borrow.
            let conversion = processed
                .export_parameter
                .typ
                .conversion_into_type(&processed.import_parameter.typ)
                .run(quote! { #arg_ident });
            arg_exprs.push(conversion);
        }
    }

    let (result_ty, produce_body) = if let Some(async_value) = async_return {
        let reader_type = crate::async_values::reader_type(context, async_value)?;
        let reader_to_js =
            crate::async_values::reader_to_js_expr(context, async_value, quote! { __result })?;
        (
            reader_type,
            quote! {
                Ok(crate::internal::PromiseOutcome::Resolve(
                    rquickjs::IntoJs::into_js(#reader_to_js, __ctx)?
                ))
            },
        )
    } else {
        let return_types = get_return_type(context, function, name, rust_fn)?;
        let original_result = return_types.wit_level_ret.original_type_ref.clone();
        let wrap = &return_types.func_ret.wrap;

        if let Some(exception) = &return_types.expected_exception {
            let wrap_result = wrap.run(quote! { __ok });
            let wrap_exception = exception.wrap.run(quote! { __err });
            (
                original_result,
                quote! {
                    match __result {
                        Ok(__ok) => Ok(crate::internal::PromiseOutcome::Resolve(
                            rquickjs::IntoJs::into_js(#wrap_result, __ctx)?
                        )),
                        Err(__err) => Ok(crate::internal::PromiseOutcome::Reject(
                            rquickjs::IntoJs::into_js(#wrap_exception, __ctx)?
                        )),
                    }
                },
            )
        } else {
            let wrap_result = wrap.run(quote! { __result });
            (
                original_result,
                quote! {
                    Ok(crate::internal::PromiseOutcome::Resolve(
                        rquickjs::IntoJs::into_js(#wrap_result, __ctx)?
                    ))
                },
            )
        }
    };

    Ok(quote! {
        #[rquickjs::function]
        fn #rust_function_ident<'js>(ctx: rquickjs::Ctx<'js>, #(#param_list),*) -> rquickjs::Result<rquickjs::Promise<'js>> {
            let (__promise, __resolve, __reject) = rquickjs::Promise::new(&ctx)?;
            let __resolve = rquickjs::Persistent::save(&ctx, __resolve);
            let __reject = rquickjs::Persistent::save(&ctx, __reject);
            // Lower each `future<T>` / `stream<T>` parameter into a component reader here, while a
            // `Ctx` is available. The writers are fed from JS (promise callbacks / a JS pump) and
            // pure component-model tasks, so they keep running correctly after the import returns.
            #(#arg_bindings)*
            wit_bindgen_p3::rt::async_support::spawn_local(async move {
                let __result: #result_ty = #bindgen_path(#(#arg_exprs),*).await;
                crate::internal::settle_import_promise(
                    __resolve,
                    __reject,
                    move |__ctx| { #produce_body },
                )
                .await;
            });
            Ok(__promise)
        }
    })
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
                // A synchronous imported function. Generates a synchronous rquickjs bridge that
                // calls the wit-bindgen import directly. Valid for both the Preview 2 and
                // Preview 3 targets.
                let bridge = build_freestanding_import_bridge(
                    context, import, name, function, /* is_async */ false,
                )?;
                declarations.push(bridge.declaration);
                exports.push(bridge.export);
                bridge_functions.push(bridge.bridge_fn);
            }
            FunctionKind::AsyncFreestanding => {
                // An async imported function. Only the Preview 3 target supports these: the bridge
                // is an `async fn` that `.await`s the component-model async import; the rquickjs
                // `#[function]` macro turns it into a JS function returning a promise.
                if !context.target.is_p3() {
                    return Err(anyhow!("Async imported functions are not supported yet"));
                }
                let bridge = build_freestanding_import_bridge(
                    context, import, name, function, /* is_async */ true,
                )?;
                declarations.push(bridge.declaration);
                exports.push(bridge.export);
                bridge_functions.push(bridge.bridge_fn);
            }
            FunctionKind::AsyncMethod(type_id) | FunctionKind::AsyncStatic(type_id) => {
                // Async imported resource methods/statics are only supported on the Preview 3
                // target: the bridge is an `async fn` awaiting the component-model async import.
                if !context.target.is_p3() {
                    return Err(anyhow!(
                        "Async imported resource methods are not supported by the WASI Preview 2 generation path"
                    ));
                }
                resource_functions
                    .entry(*type_id)
                    .or_insert_with(Vec::new)
                    .push((name, function));
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
                .map(|((param, export_parameter), import_parameter)| {
                    process_parameter(
                        context,
                        &param.name,
                        &param.ty,
                        &export_parameter,
                        &import_parameter,
                    )
                })
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
            quote! {
                #[qjs(constructor)]
                pub fn new() -> Self {
                  Self {
                    inner: None,
                  }
                }
            }
        };

        let mut methods: Vec<TokenStream> = Vec::new();
        for (name, function) in resource_funcs {
            let name = get_function_name(name, function)?;

            let rust_fn = RustWitFunction::new(context, &name, function);

            let rust_method_name_ident = rust_fn.function_name_ident();

            let parameters = function
                .params
                .iter()
                .zip(rust_fn.export_parameters.clone())
                .zip(rust_fn.import_parameters.clone())
                .map(|((param, export_parameter), import_parameter)| {
                    process_parameter(
                        context,
                        &param.name,
                        &param.ty,
                        &export_parameter,
                        &import_parameter,
                    )
                })
                .collect::<anyhow::Result<Vec<_>>>()?;

            let param_list: Vec<TokenStream> = to_wrapped_func_arg_list(&parameters);

            let param_refs: Vec<TokenStream> = to_unwrapped_param_refs(&parameters);

            let return_types = get_return_type(context, function, &name, &rust_fn)?;
            let original_result = &return_types.wit_level_ret.original_type_ref;
            let wrapped_result = &return_types.func_ret.wrapped_type_ref;
            let wrap = &return_types.func_ret.wrap;
            let wrap_result = wrap.run(quote! { result });

            // Async imported resource methods/statics (Preview 3 only; the dispatch loop above
            // rejects them for Preview 2) generate `async fn` bridges awaiting the
            // component-model async import; rquickjs turns them into promise-returning JS
            // methods.
            let (maybe_async, maybe_await) = match &function.kind {
                FunctionKind::AsyncMethod(_) | FunctionKind::AsyncStatic(_) => {
                    (quote! { async }, quote! { .await })
                }
                _ => (quote! {}, quote! {}),
            };

            match &function.kind {
                FunctionKind::Method(_) | FunctionKind::AsyncMethod(_) => {
                    let param_list = param_list[1..].to_vec();
                    let param_refs = param_refs[1..].to_vec();
                    if let Some(exception) = &return_types.expected_exception {
                        let wrapped_exception = &exception.wrapped_type_ref;
                        let wrap_exception = exception.wrap.run(quote! { error });

                        methods.push(quote! {
                            pub #maybe_async fn #rust_method_name_ident(&self, ctx: rquickjs::Ctx<'_>, #(#param_list),*) -> rquickjs::Result<#wrapped_result> {
                                let result: #original_result = self
                                      .inner
                                      .as_ref()
                                      .expect("Resource has already been disposed")
                                      .deref()
                                      .#rust_method_name_ident(#(#param_refs),*)
                                      #maybe_await;
                                match result {
                                    Ok(result) => Ok(#wrap_result),
                                    Err(error) => {
                                        let error: #wrapped_exception = #wrap_exception;
                                        Err(ctx.throw(rquickjs::IntoJs::into_js(error, &ctx)?))
                                    }
                                }
                            }
                        });
                    } else {
                        methods.push(quote! {
                           pub #maybe_async fn #rust_method_name_ident(&self, #(#param_list),*) -> #wrapped_result {
                                let result: #original_result = self
                                  .inner
                                  .as_ref()
                                  .expect("Resource has already been disposed")
                                  .deref()
                                  .#rust_method_name_ident(#(#param_refs),*)
                                  #maybe_await;
                                #wrap_result
                            }
                        });
                    }
                }
                FunctionKind::Static(_) | FunctionKind::AsyncStatic(_) => {
                    if let Some(exception) = &return_types.expected_exception {
                        let wrapped_exception = &exception.wrapped_type_ref;
                        let wrap_exception = exception.wrap.run(quote! { error });

                        methods.push(quote! {
                            #[qjs(static)]
                            pub #maybe_async fn #rust_method_name_ident(ctx: rquickjs::Ctx<'_>, #(#param_list),*) -> rquickjs::Result<#wrapped_result> {
                                let result: #original_result = #bindgen_path::#rust_method_name_ident(#(#param_refs),*) #maybe_await;
                                match result {
                                    Ok(result) => Ok(#wrap_result),
                                    Err(error) => {
                                        let error: #wrapped_exception = #wrap_exception;
                                        Err(ctx.throw(rquickjs::IntoJs::into_js(error, &ctx)?))
                                    }
                                }
                            }
                        });
                    } else {
                        methods.push(quote! {
                           #[qjs(static)]
                           pub #maybe_async fn #rust_method_name_ident(#(#param_list),*) -> #wrapped_result {
                                let result: #original_result = #bindgen_path::#rust_method_name_ident(#(#param_refs),*) #maybe_await;
                                #wrap_result
                           }
                        });
                    }
                }
                _ => {
                    // skip
                }
            }
        }

        let mut special_methods = Vec::new();
        // The `wasi:io/poll.pollable` async helpers (`promise` / `abortable_promise`).
        //
        // On the Preview 2 path they are driven by P2 pollables (`wasip2::io::poll` +
        // `wstd::runtime::AsyncPollable`). On the Preview 3 path those deps are not compiled
        // (P2 pollables are not waitables in the component-model async ABI), so the helpers
        // instead poll `ready()` in a loop interleaved with short `wasip3` monotonic-clock
        // async sleeps — this keeps the P3 executor running (JS timers, abort callbacks)
        // while waiting.
        if resource_name == "pollable"
            && &import.name == "poll"
            && import
                .package_name
                .as_ref()
                .map(|p| format!("{}:{}", p.namespace, p.name))
                == Some("wasi:io".to_string())
        {
            // The future the helpers await on: how a single pollable is asynchronously waited
            // for differs between the two targets, everything else is shared.
            let (wait_future, take_pollable) = if context.target.is_p3() {
                (
                    quote! {
                        async move {
                            while !pollable.ready() {
                                wasip3::clocks::monotonic_clock::wait_for(1_000_000).await;
                            }
                        }
                    },
                    quote! {
                        let pollable = self.inner.take().expect("Resource has already been disposed");
                    },
                )
            } else {
                (
                    quote! {
                        wstd::runtime::AsyncPollable::new(pollable).wait_for()
                    },
                    quote! {
                        let pollable = self.inner.take().expect("Resource has already been disposed");
                        let pollable: wasip2::io::poll::Pollable = unsafe { wasip2::io::poll::Pollable::from_handle(pollable.take_handle()) };
                    },
                )
            };

            special_methods.push(quote! {
                pub async fn promise(&mut self) -> () {
                    #take_pollable
                    let wait_for = #wait_future;
                    wait_for.await;
                }
            });
            special_methods.push(quote! {
                pub async fn abortable_promise<'js>(&mut self, ctx: rquickjs::Ctx<'js>, signal: rquickjs::Value<'js>) -> rquickjs::Result<()> {
                    use rquickjs::function::This;
                    use futures::future::{AbortHandle, Abortable};

                    let signal_obj = rquickjs::Object::from_value(signal.clone())?;

                    // Fast path: already aborted
                    if signal_obj.get::<_, bool>("aborted")? {
                        let reason: rquickjs::Value<'js> = signal_obj.get("reason")?;
                        return Err(ctx.throw(reason));
                    }

                    // Validate signal interface and set up abort machinery before consuming the pollable
                    let add_event_listener: rquickjs::Function<'js> = signal_obj.get("addEventListener")?;
                    let remove_event_listener: rquickjs::Function<'js> = signal_obj.get("removeEventListener")?;

                    let (abort_handle, abort_reg) = AbortHandle::new_pair();
                    let abort_fn = rquickjs::Function::new(ctx.clone(), move || {
                        abort_handle.abort();
                    })?;

                    let signal_persistent = rquickjs::Persistent::save(&ctx, signal);
                    let abort_fn_persistent = rquickjs::Persistent::save(&ctx, abort_fn.clone());

                    let opts = rquickjs::Object::new(ctx.clone())?;
                    opts.set("once", true)?;

                    add_event_listener.call::<_, ()>((
                        This(signal_obj.clone()),
                        "abort",
                        abort_fn.clone(),
                        opts,
                    ))?;

                    // Close race: signal may have been aborted between the first check and listener registration
                    if signal_obj.get::<_, bool>("aborted")? {
                        let _ = remove_event_listener.call::<_, ()>((
                            This(signal_obj.clone()),
                            "abort",
                            abort_fn,
                        ));
                        let reason: rquickjs::Value<'js> = signal_obj.get("reason")?;
                        return Err(ctx.throw(reason));
                    }

                    // Only consume the pollable after signal setup succeeds
                    #take_pollable
                    let wait_for = #wait_future;

                    let result = Abortable::new(wait_for, abort_reg).await;

                    // Cleanup: remove the abort listener
                    let signal_obj = rquickjs::Object::from_value(signal_persistent.restore(&ctx)?)?;
                    let abort_fn = abort_fn_persistent.restore(&ctx)?;

                    let _ = remove_event_listener.call::<_, ()>((
                        This(signal_obj.clone()),
                        "abort",
                        abort_fn,
                    ));

                    match result {
                        Ok(()) => Ok(()),
                        Err(_aborted) => {
                            let reason: rquickjs::Value<'js> = signal_obj.get("reason")?;
                            Err(ctx.throw(reason))
                        }
                    }
                }
            });
        }

        let rquickjs_class =
            generate_rquickjs_class_module(resource_name, &resource_name_ident, &resource_name_lit);

        // For WASI-remapped resources, skip the IntoJs/FromJs impls on the foreign
        // bindgen type (they're from wasip2:: and would violate the orphan rule).
        // The BorrowWrapper is always generated since it's a local type.
        let foreign_type_impls = if context.is_wasi_remapped_type(resource_type_id) {
            quote! {
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
            }
        } else {
            quote! {
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
            }
        };

        bridge_classes.push(quote! {
            #[derive(Clone, JsLifetime, Trace)]
            pub struct #resource_name_ident {
                #[qjs(skip_trace = true)]
                pub(crate) inner: Option<std::rc::Rc<#bindgen_path>>,
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

            #foreign_type_impls
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

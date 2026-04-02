use crate::GeneratorContext;
use crate::javascript::escape_js_ident;
use crate::rust_bindgen::{RustType, TypeOwnershipStyle, escape_rust_ident, type_mode_for};
use crate::types::{get_wrapped_type, type_id_to_type_ref};
use anyhow::{Context, anyhow};
use heck::{ToLowerCamelCase, ToShoutySnakeCase, ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span, TokenStream};
use quote::quote;
use std::collections::BTreeSet;
use syn::{Lit, LitStr};
use wit_parser::{Type, TypeDefKind, TypeId, TypeOwner};

/// Returns the wrapper type name for a WASI-remapped type.
///
/// For WASI types (from wasip2::), we cannot implement IntoJs/FromJs directly
/// due to the orphan rule, so we generate newtype wrappers in conversions.rs.
/// This function generates the fully qualified path to the wrapper type.
pub fn wasi_wrapper_name(context: &GeneratorContext<'_>, type_id: TypeId) -> anyhow::Result<Ident> {
    let typ = context.typ(type_id)?;
    let name = typ
        .name
        .as_ref()
        .ok_or_else(|| anyhow!("WASI type has no name"))?;

    // Build a unique wrapper name including the package and interface name to avoid conflicts
    // between types with the same name in different WASI packages (e.g., wasi:filesystem/types
    // and wasi:http/types both have error-code).
    let interface_prefix = match &typ.owner {
        TypeOwner::Interface(iface_id) => {
            let iface = context
                .resolve
                .interfaces
                .get(*iface_id)
                .ok_or_else(|| anyhow!("Unknown interface id"))?;
            let pkg_prefix = if let Some(pkg_id) = iface.package {
                let pkg = &context.resolve.packages[pkg_id];
                pkg.name.name.to_upper_camel_case()
            } else {
                String::new()
            };
            let iface_prefix = if let Some(iface_name) = &iface.name {
                iface_name.to_upper_camel_case()
            } else {
                String::new()
            };
            format!("{}{}", pkg_prefix, iface_prefix)
        }
        _ => String::new(),
    };

    let wrapper_name = format!("Js{}{}", interface_prefix, name.to_upper_camel_case());
    Ok(Ident::new(&wrapper_name, Span::call_site()))
}

/// Generates the `<output>/src/conversions.rs` file for the wrapper crate, implementing the IntoJs
/// and FromJs typeclass instances for the types generated in the Rust bindings..
pub fn generate_conversions(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    let conversion_instances = generate_conversion_instances(context)?;

    let conversions_tokens = quote! {
        #(#conversion_instances)*
    };

    let conversions_ast: syn::File = syn::parse2(conversions_tokens)
        .context("failed to parse generated conversions.rs tokens")?;

    let conversions_path = context.output.join("src").join("conversions.rs");
    let conversions_src = prettier_please::unparse(&conversions_ast);

    crate::write_if_changed(&conversions_path, conversions_src)?;

    Ok(())
}

fn generate_conversion_instances(
    context: &GeneratorContext<'_>,
) -> anyhow::Result<Vec<TokenStream>> {
    let mut result = Vec::new();

    let types_to_process = context.visited_types.borrow().clone();
    let mut visited_types = BTreeSet::new();
    for type_id in &types_to_process {
        if let Some(snippet) =
            generate_conversion_instances_for_type(context, *type_id, &mut visited_types)?
        {
            result.push(snippet);
        }
    }

    Ok(result)
}

fn generate_conversion_instances_for_type(
    context: &GeneratorContext<'_>,
    type_id: TypeId,
    visited_types: &mut BTreeSet<TypeId>,
) -> anyhow::Result<Option<TokenStream>> {
    if !visited_types.insert(type_id) {
        // Already processed this type, skip it
        return Ok(None);
    }

    let is_wasi_remapped = context.is_wasi_remapped_type(type_id);

    let typ = context.typ(type_id)?;

    // For WASI-remapped resource types, generate a newtype wrapper with IntoJs/FromJs
    // since we can't implement those traits directly on the foreign wasip2 type.
    if is_wasi_remapped && matches!(typ.kind, TypeDefKind::Resource) {
        let type_path = type_id_to_type_ref(context, type_id)?;
        let wrapper_name = wasi_wrapper_name(context, type_id)?;
        let name = typ.name.as_deref().unwrap_or("Resource");
        let name_lit = LitStr::new(name, Span::call_site());
        return Ok(Some(quote! {
            pub struct #wrapper_name(pub #type_path);

            impl<'js> rquickjs::IntoJs<'js> for #wrapper_name {
                fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                    rquickjs::class::Class::instance(ctx.clone(), self)
                        .and_then(|cls| rquickjs::IntoJs::into_js(cls, ctx))
                }
            }

            impl<'js> rquickjs::FromJs<'js> for #wrapper_name {
                fn from_js(ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                    let cls = rquickjs::class::Class::<Self>::from_js(ctx, value)?;
                    let borrow = cls.try_borrow()?;
                    Ok(Self(unsafe { #type_path::from_handle(borrow.0.handle()) }))
                }
            }

            impl<'js> rquickjs::class::JsClass<'js> for #wrapper_name {
                const NAME: &'static str = #name_lit;
                type Mutable = rquickjs::class::Writable;
                fn prototype(_ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<Option<rquickjs::Object<'js>>> {
                    Ok(None)
                }
                fn constructor(_ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<Option<rquickjs::function::Constructor<'js>>> {
                    Ok(None)
                }
            }

            impl<'js> rquickjs::class::Trace<'js> for #wrapper_name {
                fn trace<'a>(&self, _tracer: rquickjs::class::Tracer<'a, 'js>) {}
            }

            unsafe impl<'js> rquickjs::JsLifetime<'js> for #wrapper_name {
                type Changed<'to> = #wrapper_name;
            }
        }));
    }

    match &typ.kind {
        TypeDefKind::Record(record) => {
            let type_path = type_id_to_type_ref(context, type_id)?;

            let mut set_fields = Vec::new();
            let mut get_fields = Vec::new();
            let mut rust_field_list = Vec::new();

            // For WASI-remapped types, access fields through `.0.field` (newtype wrapper)
            let field_accessor = if is_wasi_remapped {
                quote! { self.0 }
            } else {
                quote! { self }
            };

            for field in &record.fields {
                let js_field_name = escape_js_ident(field.name.to_lower_camel_case());
                let rust_field_ident = Ident::new(
                    &escape_rust_ident(&field.name.to_snake_case()),
                    Span::call_site(),
                );
                let field_name_lit = Lit::Str(LitStr::new(&js_field_name, Span::call_site()));

                let rust_type = RustType::from_type(
                    context,
                    &field.ty,
                    type_mode_for(context, &field.ty, TypeOwnershipStyle::Owned, "'_"),
                );
                let field_type = get_wrapped_type(context, &rust_type, &rust_type, &field.ty)?;

                let original_field_type = &field_type.original_type_ref;
                let wrapped_field_type = &field_type.wrapped_type_ref;

                let wrapped_field = field_type
                    .wrap
                    .run(quote! { #field_accessor.#rust_field_ident });
                let unwrapped_field = field_type.unwrap.run(quote! { #rust_field_ident });

                set_fields.push(quote! {
                    let #rust_field_ident: #wrapped_field_type = #wrapped_field;
                    obj.set(#field_name_lit, #rust_field_ident)?;
                });

                get_fields.push(quote! {
                    let #rust_field_ident: #wrapped_field_type = obj.get(#field_name_lit)?;
                    let #rust_field_ident: #original_field_type = #unwrapped_field;
                });

                rust_field_list.push(rust_field_ident);
            }

            if is_wasi_remapped {
                let wrapper_name = wasi_wrapper_name(context, type_id)?;
                Ok(Some(quote! {
                    pub struct #wrapper_name(pub #type_path);

                    impl<'js> rquickjs::IntoJs<'js> for #wrapper_name {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            #(#set_fields);*
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #wrapper_name {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            #(#get_fields);*
                            Ok(Self(#type_path {
                                #(#rust_field_list),*
                            }))
                        }
                    }
                }))
            } else {
                Ok(Some(quote! {
                    impl<'js> rquickjs::IntoJs<'js> for #type_path {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            #(#set_fields);*
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #type_path {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            #(#get_fields);*
                            Ok(Self {
                                #(#rust_field_list),*
                            })
                        }
                    }
                }))
            }
        }
        TypeDefKind::Flags(flags) => {
            let type_path = type_id_to_type_ref(context, type_id)?;

            let mut set_fields = Vec::new();
            let mut get_fields = Vec::new();

            // For WASI-remapped types, access through `.0` (newtype wrapper)
            let self_ref = if is_wasi_remapped {
                quote! { self.0 }
            } else {
                quote! { self }
            };

            for flag in &flags.flags {
                let js_field_name = escape_js_ident(flag.name.to_lower_camel_case());
                let rust_field_ident =
                    Ident::new(&flag.name.to_shouty_snake_case(), Span::call_site());
                let field_name_lit = Lit::Str(LitStr::new(&js_field_name, Span::call_site()));

                set_fields.push(quote! {
                   obj.set(#field_name_lit, #self_ref & #type_path::#rust_field_ident == #type_path::#rust_field_ident)?;
                });

                get_fields.push(quote! {
                    if obj.get(#field_name_lit)? {
                        result |= #type_path::#rust_field_ident;
                    }
                });
            }

            if is_wasi_remapped {
                let wrapper_name = wasi_wrapper_name(context, type_id)?;
                Ok(Some(quote! {
                    pub struct #wrapper_name(pub #type_path);

                    impl<'js> rquickjs::IntoJs<'js> for #wrapper_name {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            #(#set_fields);*
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #wrapper_name {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            let mut result = #type_path::empty();
                            #(#get_fields);*
                            Ok(Self(result))
                        }
                    }
                }))
            } else {
                Ok(Some(quote! {
                    impl<'js> rquickjs::IntoJs<'js> for #type_path {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            #(#set_fields);*
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #type_path {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            let mut result = #type_path::empty();
                            #(#get_fields);*
                            Ok(result)
                        }
                    }
                }))
            }
        }
        TypeDefKind::Variant(variant) => {
            let type_path = type_id_to_type_ref(context, type_id)?;

            let mut into_cases = Vec::new();
            let mut from_cases = Vec::new();

            for case in &variant.cases {
                let rust_ident = Ident::new(&case.name.to_upper_camel_case(), Span::call_site());
                let case_name_lit = Lit::Str(LitStr::new(&case.name, Span::call_site()));

                if let Some(ty) = &case.ty {
                    let rust_type = RustType::from_type(
                        context,
                        ty,
                        type_mode_for(context, ty, TypeOwnershipStyle::Owned, "'_"),
                    );
                    let wrapped_type = get_wrapped_type(context, &rust_type, &rust_type, ty)?;
                    let wrapped_inner = wrapped_type.wrap.run(quote! { inner });
                    let unwrapped_inner = wrapped_type.unwrap.run(quote! { inner });
                    let wrapped_type = &wrapped_type.wrapped_type_ref;

                    into_cases.push(quote! {
                        #type_path::#rust_ident(inner) => {
                            obj.set(crate::wrappers::TAG, #case_name_lit)?;
                            let case_value: #wrapped_type = #wrapped_inner;
                            obj.set(crate::wrappers::VALUE, case_value)?;
                        }
                    });

                    from_cases.push(quote! {
                        #case_name_lit => {
                            let inner: #wrapped_type = obj.get(crate::wrappers::VALUE)?;
                            Ok(#type_path::#rust_ident(#unwrapped_inner))
                        }
                    });
                } else {
                    into_cases.push(quote! {
                        #type_path::#rust_ident => {
                            obj.set(crate::wrappers::TAG, #case_name_lit)?;
                        }
                    });

                    from_cases.push(quote! {
                        #case_name_lit => Ok(#type_path::#rust_ident),
                    });
                }
            }

            let lit_js_type = Lit::Str(LitStr::new(
                &format!("JS {}", typ.name.clone().unwrap_or_default()),
                Span::call_site(),
            ));
            let lit_wit_type = Lit::Str(LitStr::new(
                &format!("WIT {}", typ.name.clone().unwrap_or_default()),
                Span::call_site(),
            ));

            if is_wasi_remapped {
                let wrapper_name = wasi_wrapper_name(context, type_id)?;
                Ok(Some(quote! {
                    pub struct #wrapper_name(pub #type_path);

                    impl<'js> rquickjs::IntoJs<'js> for #wrapper_name {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            match self.0 {
                                #(#into_cases)*
                            }
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #wrapper_name {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            let tag: String = obj.get(crate::wrappers::TAG)?;
                            match tag.as_str() {
                                #(#from_cases)*
                                _ => Err(rquickjs::Error::new_from_js_message(
                                    #lit_js_type,
                                    #lit_wit_type,
                                    format!("Unknown variant case: {tag}"),
                                )),
                            }.map(Self)
                        }
                    }
                }))
            } else {
                Ok(Some(quote! {
                    impl<'js> rquickjs::IntoJs<'js> for #type_path {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            let obj = rquickjs::Object::new(ctx.clone())?;
                            match self {
                                #(#into_cases)*
                            }
                            Ok(obj.into_value())
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #type_path {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let obj = rquickjs::Object::from_value(value)?;
                            let tag: String = obj.get(crate::wrappers::TAG)?;
                            match tag.as_str() {
                                #(#from_cases)*
                                _ => Err(rquickjs::Error::new_from_js_message(
                                    #lit_js_type,
                                    #lit_wit_type,
                                    format!("Unknown variant case: {tag}"),
                                )),
                            }
                        }
                    }
                }))
            }
        }
        TypeDefKind::Enum(enm) => {
            let type_path = type_id_to_type_ref(context, type_id)?;

            let mut into_cases = Vec::new();
            let mut from_cases = Vec::new();

            for case in &enm.cases {
                let ident = Ident::new(&case.name.to_upper_camel_case(), Span::call_site());
                let lit = Lit::Str(LitStr::new(&case.name, Span::call_site()));
                into_cases.push(quote! {
                    #type_path::#ident => #lit.into_js(ctx),
                });

                from_cases.push(quote! {
                    #lit => Ok(#type_path::#ident),
                });
            }

            let name = typ.name.clone().unwrap_or_default();
            let lit_js_type = Lit::Str(LitStr::new(&format!("JS {name}"), Span::call_site()));
            let lit_wit_type = Lit::Str(LitStr::new(&format!("WIT {name}"), Span::call_site()));

            if is_wasi_remapped {
                let wrapper_name = wasi_wrapper_name(context, type_id)?;
                Ok(Some(quote! {
                    pub struct #wrapper_name(pub #type_path);

                    impl<'js> rquickjs::IntoJs<'js> for #wrapper_name {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            match self.0 {
                                #(#into_cases)*
                            }
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #wrapper_name {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let value = value
                                .as_string()
                                .ok_or_else(|| {
                                    rquickjs::Error::new_from_js_message(#lit_js_type, #lit_wit_type, "Expected a string")
                                })?
                                .to_string()?;
                            match value.as_str() {
                                #(#from_cases)*
                                _ => Err(rquickjs::Error::new_from_js_message(
                                    #lit_js_type,
                                    #lit_wit_type,
                                    format!("Unknown case value: {value}"),
                                )),
                            }.map(Self)
                        }
                    }
                }))
            } else {
                Ok(Some(quote! {
                    impl<'js> rquickjs::IntoJs<'js> for #type_path {
                        fn into_js(self, ctx: &rquickjs::Ctx<'js>) -> rquickjs::Result<rquickjs::Value<'js>> {
                            match self {
                                #(#into_cases)*
                            }
                        }
                    }

                    impl<'js> rquickjs::FromJs<'js> for #type_path {
                        fn from_js(_ctx: &rquickjs::Ctx<'js>, value: rquickjs::Value<'js>) -> rquickjs::Result<Self> {
                            let value = value
                                .as_string()
                                .ok_or_else(|| {
                                    rquickjs::Error::new_from_js_message(#lit_js_type, #lit_wit_type, "Expected a string")
                                })?
                                .to_string()?;
                            match value.as_str() {
                                #(#from_cases)*
                                _ => Err(rquickjs::Error::new_from_js_message(
                                    #lit_js_type,
                                    #lit_wit_type,
                                    format!("Unknown case value: {value}"),
                                )),
                            }
                        }
                    }
                }))
            }
        }
        TypeDefKind::Type(Type::Id(type_id)) => {
            generate_conversion_instances_for_type(context, *type_id, visited_types)
        }
        _ => Ok(None),
    }
}

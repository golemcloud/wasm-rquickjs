use crate::GeneratorContext;
use anyhow::anyhow;
use heck::{ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span, TokenStream};
use quote::quote;
use wit_parser::{Handle, Interface, Type, TypeDef, TypeDefKind, TypeId, TypeOwner};

fn to_type_ref(context: &GeneratorContext<'_>, typ: &Type) -> anyhow::Result<TokenStream> {
    match typ {
        Type::Bool => Ok(quote! { bool }),
        Type::U8 => Ok(quote! { u8 }),
        Type::U16 => Ok(quote! { u16 }),
        Type::U32 => Ok(quote! { u32 }),
        Type::U64 => Ok(quote! { u64 }),
        Type::S8 => Ok(quote! { i8 }),
        Type::S16 => Ok(quote! { i16 }),
        Type::S32 => Ok(quote! { i32 }),
        Type::S64 => Ok(quote! { i64 }),
        Type::F32 => Ok(quote! { f32 }),
        Type::F64 => Ok(quote! { f64 }),
        Type::Char => Ok(quote! { char }),
        Type::String => Ok(quote! { String }),
        Type::ErrorContext => Ok(quote! { wit_bindgen_rt::async_support::ErrorContext }),
        Type::Id(type_id) => {
            context.record_visited_type(*type_id);

            type_id_to_type_ref(context, *type_id)
        }
    }
}

pub fn type_id_to_type_ref(
    context: &GeneratorContext,
    type_id: TypeId,
) -> anyhow::Result<TokenStream> {
    let typ = context
        .resolve
        .types
        .get(type_id)
        .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;
    match &typ.kind {
        TypeDefKind::Option(inner) => {
            let inner_ref = to_type_ref(context, inner)?;
            Ok(quote! { Option<#inner_ref> })
        }
        TypeDefKind::Result(inner) => {
            let ok = inner
                .ok
                .as_ref()
                .map(|ok| to_type_ref(context, ok))
                .transpose()?
                .unwrap_or(quote! { () });
            let err = inner
                .err
                .as_ref()
                .map(|err| to_type_ref(context, err))
                .transpose()?
                .unwrap_or(quote! { () });
            Ok(quote! { Result<#ok, #err> })
        }
        TypeDefKind::List(inner) => {
            let inner_ref = to_type_ref(context, inner)?;
            Ok(quote! { Vec<#inner_ref> })
        }
        TypeDefKind::FixedSizeList(inner, n) => {
            let inner_ref = to_type_ref(context, inner)?;
            Ok(quote! { &[#inner_ref; #n] })
        }
        TypeDefKind::Tuple(tuple) => {
            let item_refs: Vec<_> = tuple
                .types
                .iter()
                .map(|item| to_type_ref(context, item))
                .collect::<anyhow::Result<Vec<_>>>()?;
            Ok(quote! { (#(#item_refs),*) })
        }
        TypeDefKind::Future(_) => Err(anyhow!("Future types are not supported yet"))?,
        TypeDefKind::Stream(_) => Err(anyhow!("Stream types are not supported yet"))?,
        TypeDefKind::Handle(handle) => match handle {
            Handle::Own(resource_type_id) => owned_resource_ref(context, resource_type_id),
            Handle::Borrow(resource_type_id) => borrowed_resource_ref(context, resource_type_id),
        },
        _ => {
            record_visited_inner_types(context, typ)?;

            let name = typ
                .name
                .as_ref()
                .ok_or_else(|| anyhow!("Type {typ:?} has no name"))?;
            let name_ident = Ident::new(&name.to_upper_camel_case(), Span::call_site());
            match typ.owner {
                TypeOwner::World(world_id) => {
                    if world_id == context.world {
                        Ok(quote! { crate::bindings::#name_ident })
                    } else {
                        Err(anyhow!("Type {name} is owned by a different world"))?
                    }
                }
                TypeOwner::Interface(interface_id) => {
                    let interface = context
                        .resolve
                        .interfaces
                        .get(interface_id)
                        .ok_or_else(|| anyhow!("Unknown interface id: {interface_id:?}"))?;

                    if context.is_exported_interface(interface_id) {
                        Ok(ident_in_exported_interface(
                            context,
                            name_ident,
                            interface
                                .name
                                .as_ref()
                                .ok_or_else(|| anyhow!("Interface export does not have a name"))?,
                            interface,
                        ))
                    } else {
                        Ok(ident_in_imported_interface(
                            context,
                            name_ident,
                            interface
                                .name
                                .as_ref()
                                .ok_or_else(|| anyhow!("Interface does not have a name"))?,
                            interface,
                        ))
                    }
                }
                TypeOwner::None => Err(anyhow!("Type {name} has no owner"))?,
            }
        }
    }
}

pub fn ident_in_exported_interface_or_global(
    context: &GeneratorContext<'_>,
    ident: Ident,
    interface: Option<(&str, &Interface)>,
) -> TokenStream {
    if let Some((interface_name, interface)) = interface {
        ident_in_exported_interface(context, ident, interface_name, interface)
    } else {
        quote! { crate::bindings::#ident }
    }
}

pub fn ident_in_exported_interface(
    context: &GeneratorContext<'_>,
    ident: Ident,
    interface_name: &str,
    interface: &Interface,
) -> TokenStream {
    let name_ident = Ident::new(&interface_name.to_snake_case(), Span::call_site());

    let mut path = Vec::new();
    path.push(quote! { crate });
    path.push(quote! { bindings });
    path.push(quote! { exports });

    if let Some(package_id) = &interface.package {
        let package = &context.resolve.packages[*package_id];
        let ns_ident = Ident::new(&package.name.namespace.to_snake_case(), Span::call_site());
        let name_ident = Ident::new(&package.name.name.to_snake_case(), Span::call_site());

        path.push(quote! { #ns_ident });
        path.push(quote! { #name_ident });
    }

    path.push(quote! { #name_ident });
    path.push(quote! { #ident });

    quote! { #(#path)::* }
}

pub fn ident_in_imported_interface(
    context: &GeneratorContext<'_>,
    ident: Ident,
    interface_name: &str,
    interface: &Interface,
) -> TokenStream {
    let name_ident = Ident::new(&interface_name.to_snake_case(), Span::call_site());

    let mut path = Vec::new();
    path.push(quote! { crate });
    path.push(quote! { bindings });

    if let Some(package_id) = &interface.package {
        let package = &context.resolve.packages[*package_id];
        let ns_ident = Ident::new(&package.name.namespace.to_snake_case(), Span::call_site());
        let name_ident = Ident::new(&package.name.name.to_snake_case(), Span::call_site());

        path.push(quote! { #ns_ident });
        path.push(quote! { #name_ident });
    }

    path.push(quote! { #name_ident });
    path.push(quote! { #ident });

    quote! { #(#path)::* }
}

pub fn type_borrows_resource(
    context: &GeneratorContext<'_>,
    typ: &Type,
    resource_type_id: &TypeId,
) -> anyhow::Result<bool> {
    match typ {
        Type::Id(type_id) => {
            let typ = context
                .resolve
                .types
                .get(*type_id)
                .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

            match &typ.kind {
                TypeDefKind::Handle(Handle::Borrow(id)) if id == resource_type_id => Ok(true),
                _ => Ok(false),
            }
        }
        _ => Ok(false),
    }
}

pub type TokenStreamWrapper = Box<dyn Fn(TokenStream) -> TokenStream>;

pub fn identity_wrapper() -> TokenStreamWrapper {
    Box::new(|ts| ts)
}

pub struct WrappedType {
    pub wrap: TokenStreamWrapper,
    pub unwrap: TokenStreamWrapper,
    pub original_type_ref: TokenStream,
    pub wrapped_type_ref: TokenStream,
}

impl WrappedType {
    pub fn no_wrapping(original_type_ref: TokenStream) -> Self {
        WrappedType {
            wrap: identity_wrapper(),
            unwrap: identity_wrapper(),
            original_type_ref: original_type_ref.clone(),
            wrapped_type_ref: original_type_ref,
        }
    }

    pub fn unit() -> Self {
        Self::no_wrapping(quote! { () })
    }
}

// TODO: this should do recursive wrapping or every WIT type
// TODO: do we need to wrap u64 as BigInt or the default rquickjs instance is good?
// TODO: do we want special case for byte arrays to Uint8Array?
// TODO: wrapper for nested options?
// TODO: we may want to encode result<> return values as exceptions like componentize-js
pub fn get_wrapped_type(context: &GeneratorContext<'_>, typ: &Type) -> anyhow::Result<WrappedType> {
    let original_type_ref = to_type_ref(context, typ)?;
    match typ {
        Type::Id(type_id) => {
            let typ = context
                .resolve
                .types
                .get(*type_id)
                .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;

            match &typ.kind {
                TypeDefKind::Tuple(_) => Ok(WrappedType {
                    wrap: Box::new(|ts| quote! { rquickjs::convert::List( # ts) }),
                    unwrap: Box::new(|ts| quote! { # ts.0 }),
                    original_type_ref: original_type_ref.clone(),
                    wrapped_type_ref: quote! { rquickjs::convert::List<#original_type_ref> },
                }),
                TypeDefKind::Result(inner) => {
                    let ok = inner
                        .ok
                        .as_ref()
                        .map(|ok| get_wrapped_type(context, ok))
                        .transpose()?
                        .unwrap_or(WrappedType::unit());
                    let err = inner
                        .err
                        .as_ref()
                        .map(|err| get_wrapped_type(context, err))
                        .transpose()?
                        .unwrap_or(WrappedType::unit());
                    let wrapped_ok = ok.wrapped_type_ref;
                    let wrapped_err = err.wrapped_type_ref;
                    Ok(WrappedType {
                        wrap: Box::new(|ts| quote! { crate::wrappers::JsResult( # ts) }),
                        unwrap: Box::new(|ts| quote! { # ts.0 }),
                        original_type_ref: original_type_ref.clone(),
                        wrapped_type_ref: quote! { crate::wrappers::JsResult<#wrapped_ok, #wrapped_err> },
                    })
                }
                _ => Ok(WrappedType::no_wrapping(original_type_ref)),
            }
        }
        _ => Ok(WrappedType::no_wrapping(original_type_ref)),
    }
}

fn owned_resource_ref(
    context: &GeneratorContext<'_>,
    resource_type_id: &TypeId,
) -> anyhow::Result<TokenStream> {
    let resource_type = context
        .resolve
        .types
        .get(*resource_type_id)
        .ok_or_else(|| anyhow!("Unknown resource type id: {resource_type_id:?}"))?;
    let resource_name = resource_type
        .name
        .as_ref()
        .ok_or_else(|| anyhow!("Resource type {resource_type:?} has no name"))?;

    let interface = match &resource_type.owner {
        TypeOwner::World(world_id) => {
            if world_id == &context.world {
                None
            } else {
                return Err(anyhow!(
                    "Resource type {resource_name} is owned by a different world"
                ));
            }
        }
        TypeOwner::Interface(interface_id) => {
            let interface = context
                .resolve
                .interfaces
                .get(*interface_id)
                .ok_or_else(|| anyhow!("Unknown interface id: {interface_id:?}"))?;
            let interface_name = interface
                .name
                .as_ref()
                .ok_or_else(|| anyhow!("Interface export does not have a name"))?;
            Some((interface_name.as_str(), interface))
        }
        TypeOwner::None => {
            return Err(anyhow!("Resource type {resource_name} has no owner"));
        }
    };

    let handle_ident = Ident::new(&resource_name.to_upper_camel_case(), Span::call_site());
    let handle_path = ident_in_exported_interface_or_global(context, handle_ident, interface);
    Ok(quote! { #handle_path })
}

fn borrowed_resource_ref(
    context: &GeneratorContext<'_>,
    resource_type_id: &TypeId,
) -> anyhow::Result<TokenStream> {
    let resource_type = context
        .resolve
        .types
        .get(*resource_type_id)
        .ok_or_else(|| anyhow!("Unknown resource type id: {resource_type_id:?}"))?;
    let resource_name = resource_type
        .name
        .as_ref()
        .ok_or_else(|| anyhow!("Resource type {resource_type:?} has no name"))?;

    let interface = match &resource_type.owner {
        TypeOwner::World(world_id) => {
            if world_id == &context.world {
                None
            } else {
                return Err(anyhow!(
                    "Resource type {resource_name} is owned by a different world"
                ));
            }
        }
        TypeOwner::Interface(interface_id) => {
            let interface = context
                .resolve
                .interfaces
                .get(*interface_id)
                .ok_or_else(|| anyhow!("Unknown interface id: {interface_id:?}"))?;
            let interface_name = interface
                .name
                .as_ref()
                .ok_or_else(|| anyhow!("Interface export does not have a name"))?;
            Some((interface_name.as_str(), interface))
        }
        TypeOwner::None => {
            return Err(anyhow!("Resource type {resource_name} has no owner"));
        }
    };

    let borrow_handle_ident = Ident::new(
        &format!("{}Borrow", resource_name.to_upper_camel_case()),
        Span::call_site(),
    );
    let borrow_handle_path =
        ident_in_exported_interface_or_global(context, borrow_handle_ident, interface);
    Ok(quote! { #borrow_handle_path<'_> })
}

fn record_visited_inner_types(context: &GeneratorContext<'_>, typ: &TypeDef) -> anyhow::Result<()> {
    match &typ.kind {
        TypeDefKind::Record(record) => {
            for field in &record.fields {
                let _ = to_type_ref(context, &field.ty)?;
            }
        }
        TypeDefKind::Variant(variant) => {
            for variant_case in &variant.cases {
                if let Some(ty) = &variant_case.ty {
                    let _ = to_type_ref(context, ty)?;
                }
            }
        }
        _ => {}
    }

    Ok(())
}

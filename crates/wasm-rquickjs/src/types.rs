use crate::GeneratorContext;
use anyhow::anyhow;
use heck::{ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span, TokenStream};
use quote::quote;
use wit_parser::{Handle, Interface, Type, TypeDefKind, TypeId, TypeOwner};

pub fn to_type_ref(context: &GeneratorContext<'_>, typ: &Type) -> anyhow::Result<TokenStream> {
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
            let typ = context
                .resolve
                .types
                .get(*type_id)
                .ok_or_else(|| anyhow!("Unknown type id: {type_id:?}"))?;
            match &typ.kind {
                TypeDefKind::Option(_) => {
                    todo!()
                }
                TypeDefKind::Result(_) => {
                    todo!()
                }
                TypeDefKind::List(_) => {
                    todo!()
                }
                TypeDefKind::FixedSizeList(_, _) => {
                    todo!()
                }
                TypeDefKind::Future(_) => {
                    todo!()
                }
                TypeDefKind::Stream(_) => {
                    todo!()
                }
                TypeDefKind::Handle(handle) => match handle {
                    Handle::Own(resource_type_id) => owned_resource_ref(context, resource_type_id),
                    Handle::Borrow(resource_type_id) => {
                        borrowed_resource_ref(context, resource_type_id)
                    }
                },
                _ => {
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
                            // TODO: need to distinguish between imported and exported interfaces
                            let interface = context
                                .resolve
                                .interfaces
                                .get(interface_id)
                                .ok_or_else(|| anyhow!("Unknown interface id: {interface_id:?}"))?;
                            Ok(ident_in_exported_interface(
                                context,
                                name_ident,
                                interface.name.as_ref().ok_or_else(|| {
                                    anyhow!("Interface export does not have a name")
                                })?,
                                interface,
                            ))
                        }
                        TypeOwner::None => Err(anyhow!("Type {name} has no owner"))?,
                    }
                }
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
    let name_ident = syn::Ident::new(&interface_name.to_snake_case(), Span::call_site());

    let mut path = Vec::new();
    path.push(quote! { crate });
    path.push(quote! { bindings });
    path.push(quote! { exports });

    if let Some(package_id) = &interface.package {
        let package = &context.resolve.packages[*package_id];
        let ns_ident = syn::Ident::new(&package.name.namespace.to_snake_case(), Span::call_site());
        let name_ident = syn::Ident::new(&package.name.name.to_snake_case(), Span::call_site());

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

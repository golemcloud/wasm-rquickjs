use crate::GeneratorContext;
use crate::types::to_type_ref;
use anyhow::{Context, anyhow};
use heck::{ToLowerCamelCase, ToSnakeCase};
use proc_macro2::TokenStream;
use quote::quote;
use syn::{Lit, LitStr};
use wit_parser::{WorldItem, WorldKey};

pub fn generate_export_impls(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    let guest_impls = generate_guest_impls(context)?;

    let lib_tokens = quote! {
        mod bindings;
        mod internal;
        mod native;

        struct Component;

        #(#guest_impls)*

        bindings::export!(Component with_types_in bindings);
    };
    let lib_ast: syn::File =
        syn::parse2(lib_tokens).context("failed to parse generated lib.rs tokens")?;

    let lib_path = context.output.join("src").join("lib.rs");
    let lib_src = prettier_please::unparse(&lib_ast);

    std::fs::write(&lib_path, lib_src)?;

    Ok(())
}

fn generate_guest_impls(context: &GeneratorContext<'_>) -> anyhow::Result<Vec<TokenStream>> {
    let mut result = Vec::new();

    let world = &context.resolve.worlds[context.world];

    let mut global_exports = Vec::new();
    for (name, export) in &world.exports {
        match export {
            WorldItem::Interface { .. } => {}
            WorldItem::Function(function) => {
                let name = match name {
                    WorldKey::Name(name) => name,
                    WorldKey::Interface(_) => {
                        return Err(anyhow!(
                            "Unexpected WorldKey::Interface for exported top-level function"
                        ));
                    }
                };
                global_exports.push((name, function));
            }
            WorldItem::Type(_) => {}
        }
    }

    if !global_exports.is_empty() {
        result.push(generate_guest_impl(
            context,
            quote! { crate::bindings::Guest },
            &global_exports,
        )?);
    }

    Ok(result)
}

fn generate_guest_impl(
    context: &GeneratorContext<'_>,
    guest_trait: TokenStream,
    exports: &[(&String, &wit_parser::Function)],
) -> anyhow::Result<TokenStream> {
    let mut func_impls = Vec::new();

    for (name, function) in exports {
        let func_name = syn::Ident::new(&name.to_snake_case(), proc_macro2::Span::call_site());
        let param_ident_type: Vec<_> = function
            .params
            .iter()
            .map(|(param_name, param_type)| {
                to_type_ref(context, param_type)
                    .context(format!(
                        "Failed to encode parameter {param_name}'s type in exported function {name}"
                    ))
                    .map(|typ| {
                        (
                            syn::Ident::new(param_name, proc_macro2::Span::call_site()),
                            typ,
                        )
                    })
            })
            .collect::<anyhow::Result<Vec<_>>>()?;

        let func_arg_list = param_ident_type.iter().map(|(name, typ)| {
            quote! { #name: #typ }
        });
        let func_ret = match &function.result {
            Some(typ) => to_type_ref(context, typ)
                .context(format!("Failed to encode result type for {name}"))?,
            None => quote! { () },
        };

        let param_refs = param_ident_type.iter().map(|(name, _)| {
            quote! { #name }
        });

        let js_func_name_str = Lit::Str(LitStr::new(&name.to_lower_camel_case(), func_name.span()));

        let func_impl = quote! {
            fn #func_name(#(#func_arg_list),*) -> #func_ret {
                crate::internal::async_exported_function(async move {
                    crate::internal::call_js_export(
                        #js_func_name_str,
                        ( (#(#param_refs),*),),
                    ).await
                })
            }
        };
        func_impls.push(func_impl);
    }

    Ok(quote! {
        impl #guest_trait for Component {
            #(#func_impls)*
        }
    })
}

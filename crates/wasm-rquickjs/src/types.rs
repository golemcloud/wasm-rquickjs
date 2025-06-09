use crate::GeneratorContext;
use proc_macro2::TokenStream;
use quote::quote;
use wit_parser::Type;

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
        Type::Id(_) => {
            todo!()
        }
    }
}

// Code below is based on wit-bindgen-rust

use crate::GeneratorContext;
use crate::types::TokenStreamWrapper;
use heck::{ToSnakeCase, ToUpperCamelCase};
use proc_macro2::{Ident, Span};
use quote::quote;
use std::fmt::{Display, Formatter};
use syn::{Lit, LitInt};
use wit_bindgen_core::{TypeInfo, dealias};
use wit_parser::{Docs, Function, Handle, Type, TypeDefKind, TypeId};

pub fn escape_rust_ident(name: &str) -> String {
    match name {
        "as" => "as_".into(),
        "break" => "break_".into(),
        "const" => "const_".into(),
        "continue" => "continue_".into(),
        "crate" => "crate_".into(),
        "else" => "else_".into(),
        "enum" => "enum_".into(),
        "extern" => "extern_".into(),
        "false" => "false_".into(),
        "fn" => "fn_".into(),
        "for" => "for_".into(),
        "if" => "if_".into(),
        "impl" => "impl_".into(),
        "in" => "in_".into(),
        "let" => "let_".into(),
        "loop" => "loop_".into(),
        "match" => "match_".into(),
        "mod" => "mod_".into(),
        "move" => "move_".into(),
        "mut" => "mut_".into(),
        "pub" => "pub_".into(),
        "ref" => "ref_".into(),
        "return" => "return_".into(),
        "self" => "self_".into(),
        "static" => "static_".into(),
        "struct" => "struct_".into(),
        "super" => "super_".into(),
        "trait" => "trait_".into(),
        "true" => "true_".into(),
        "type" => "type_".into(),
        "unsafe" => "unsafe_".into(),
        "use" => "use_".into(),
        "where" => "where_".into(),
        "while" => "while_".into(),
        "async" => "async_".into(),
        "await" => "await_".into(),
        "dyn" => "dyn_".into(),
        "abstract" => "abstract_".into(),
        "become" => "become_".into(),
        "box" => "box_".into(),
        "do" => "do_".into(),
        "final" => "final_".into(),
        "macro" => "macro_".into(),
        "override" => "override_".into(),
        "priv" => "priv_".into(),
        "typeof" => "typeof_".into(),
        "unsized" => "unsized_".into(),
        "virtual" => "virtual_".into(),
        "yield" => "yield_".into(),
        "try" => "try_".into(),
        s => s.to_snake_case(),
    }
}

/// A description of the "mode" in which a type is printed.
///
/// Rust types can either be "borrowed" or "owned". This primarily has to do
/// with lists and imports where arguments to imports can be borrowed lists in
/// theory as ownership is not taken from the caller. This structure is used to
/// help with this fact in addition to the various codegen options of this
/// generator. Namely types in WIT can be reflected into Rust as two separate
/// types, one "owned" and one "borrowed" (aka one with `Vec` and one with
/// `&[T]`).
///
/// This structure is used in conjunction with `modes_of` and `type_mode_for*`
/// primarily. That enables creating a programmatic description of what a type
/// is rendered as along with various options.
///
/// Note that a `TypeMode` is a description of a single "level" of a type. This
/// means that there's one mode for `Vec<T>` and one mode for `T` internally.
/// This is mostly used for things like records where some fields have lifetime
/// parameters, for example, and others don't.
///
/// This type is intended to simplify generation of types and encapsulate all
/// the knowledge about whether lifetime parameters are used and how lists are
/// rendered.
///
/// There are currently two users of lifetime parameters:
///
/// * Lists - when borrowed these are rendered as either `&[T]` or `&str`.
/// * Borrowed resources - for resources owned by the current module they're
///   represented as `&T` and for borrows of imported resources they're
///   represented, more-or-less, as `&Resource<T>`.
///
/// Lists have a choice of being rendered as borrowed or not but resources are
/// required to be borrowed.
#[derive(Debug, Copy, Clone)]
pub struct TypeMode {
    /// The lifetime parameter, if any, for this type. If present this type is
    /// required to have a lifetime parameter.
    pub lifetime: Option<&'static str>,

    /// Whether lists are borrowed in this type.
    ///
    /// If this field is `true` then lists are rendered as `&[T]` and `&str`
    /// rather than their owned equivalent. If this field is `false` than the
    /// owned equivalents are used instead.
    pub lists_borrowed: bool,

    /// The "style" of ownership that this mode was created with.
    ///
    /// This information is used to determine what mode the next layer deep in
    /// the type tree is rendered with. For example if this layer is owned so is
    /// the next layer. This is primarily used for the "OnlyTopBorrowed"
    /// ownership style where all further layers beneath that are `Owned`.
    pub style: TypeOwnershipStyle,

    pub type_info: Option<TypeInfo>,
}

/// The style of ownership of a type, used to initially create a `TypeMode` and
/// stored internally within it as well.
#[derive(Debug, Copy, Clone, PartialEq)]
pub enum TypeOwnershipStyle {
    /// This style means owned things are printed such as `Vec<T>` and `String`.
    ///
    /// Note that this primarily applies to lists.
    Owned,

    /// This style means that the top-level of a type is borrowed but all other
    /// layers are `Owned`.
    ///
    /// This is used for parameters in the "owning" mode of generation to
    /// imports. It's easy enough to create a `&T` at the root layer, but it's
    /// more difficult to create `&T` stored within a `U`, for example.
    OnlyTopBorrowed,
}

impl TypeMode {
    /// Returns a mode where everything is indicated that it's supposed to be
    /// rendered as an "owned" type.
    fn owned(type_info: Option<TypeInfo>) -> TypeMode {
        TypeMode {
            lifetime: None,
            lists_borrowed: false,
            style: TypeOwnershipStyle::Owned,
            type_info,
        }
    }
}

impl TypeOwnershipStyle {
    /// Preserves this mode except for `OnlyTopBorrowed` where it switches it to
    /// `Owned`.
    pub fn next(&self) -> TypeOwnershipStyle {
        match self {
            TypeOwnershipStyle::Owned => TypeOwnershipStyle::Owned,
            TypeOwnershipStyle::OnlyTopBorrowed => TypeOwnershipStyle::Owned,
        }
    }
}

/// Copied from wit-bindgen-rust
pub fn type_mode_for_type_info(
    info: TypeInfo,
    style: TypeOwnershipStyle,
    lt: &'static str,
) -> TypeMode {
    // NB: This method is the heart of determining how to render types.
    // There's a lot of permutations and corner cases to handle, especially
    // with being able to configure at the generator level how types are
    // generated. Long story short this is a subtle and complicated method.
    //
    // The hope is that most of the complexity around type generation in
    // Rust is largely centered here where everything else can lean on this.
    // This has gone through so many refactors I've lost count at this
    // point, but maybe this one is the one that'll stick!
    //
    // The general idea is that there's some clear-and-fast rules for how
    // `TypeMode` must be returned here. For example borrowed handles are
    // required to have a lifetime parameter. Everything else though is here
    // to handle the various levels of configuration and semantics for each
    // level of types.
    //
    // As a reminder a `TypeMode` is generated for each "level" of a type
    // hierarchy, for example there's one mode for `Vec<T>` and another mode
    // for `T`. This enables, for example, rendering the outer layer as
    // either `Vec<T>` or `&[T]` but the inner `T` may or may not have a
    // type parameter.

    let lifetime = if info.has_borrow_handle {
        // Borrowed handles always have a lifetime associated with them so
        // thread it through.
        Some(lt)
    } else if style == TypeOwnershipStyle::Owned {
        // If this type is being rendered as an "owned" type, and it
        // doesn't have any borrowed handles, then no lifetimes are needed
        // since any internal lists will be their owned version.
        None
    } else if info.has_own_handle || !info.has_list {
        // At this point there are no borrowed handles and a borrowed style
        // of type is requested. In this situation there's two cases where a
        // lifetime is never used:
        //
        // * Owned handles are present - in this situation ownership is used
        //   to statically reflect how a value is lost when passed to an
        //   import. This means that no lifetime is used for internal lists
        //   since they must be rendered in an owned mode.
        //
        // * There are no lists present - here the lifetime parameter won't
        //   be used for anything because there's no borrows or lists, so
        //   it's skipped.
        None
    } else if !info.owned {
        // This next layer things get a little more interesting. To recap,
        // so far we know that there's no borrowed handles, a borrowed mode
        // is requested, there's no own handles, and there's a list. In that
        // situation if `info` shows that this type is never used in an
        // owned position, or if two types are explicitly requested for
        // owned/borrowed values, then a lifetime is used.
        Some(lt)
    } else {
        // ... and finally, here at the end we know:
        //
        // * No borrowed handles
        // * Borrowing mode is requested
        // * No owned handles
        // * A list is somewhere
        // * This type is used somewhere in an owned position
        // * This type is not used "two names" meaning that we must use
        //   the owned version of the type.
        //
        // If the configured ownership mode for generating types of this
        // generator is "owning" then that's the only type that can be used.
        // If borrowing is requested then this means that `&T` is going to
        // be rendered, so thread it through.
        //
        // If the configured ownership mode uses borrowing by default, then
        // things get a little weird. This means that a lifetime is going to
        // be used an any lists should be borrowed, but we specifically
        // switch to only borrowing the top layer of the type rather than
        // the entire hierarchy. This situation can happen in
        // `duplicate_if_necessary: false` mode for example where we're
        // borrowing a type which is used in an owned position elsewhere.
        // The only possibility at that point is to borrow it at the root
        // but everything else internally is required to be owned from then
        // on.
        Some(lt)
    };
    TypeMode {
        lifetime,

        // If a lifetime is present and ownership isn't requested, then make
        // sure any lists show up as `&str` or `&[T]`.
        lists_borrowed: lifetime.is_some() && style != TypeOwnershipStyle::Owned,

        // Switch the style to `Owned` if an `own<T>` handle is present
        // because there's no option but to take interior types by ownership
        // as that statically shows that the ownership of the value is being
        // lost.
        style: if info.has_own_handle {
            TypeOwnershipStyle::Owned
        } else {
            style
        },

        type_info: Some(info),
    }
}

/// Calculates the `TypeMode` to be used for the `ty` specified.
///
/// This takes a `style` argument which is the requested style of ownership
/// for this type. Note that the returned `TypeMode` may have a different
/// `style`.
///
/// This additionally takes a `lt` parameter which, if needed, is what will
/// be used to render lifetimes.
pub fn type_mode_for(
    context: &GeneratorContext<'_>,
    ty: &Type,
    style: TypeOwnershipStyle,
    lt: &'static str,
) -> TypeMode {
    match ty {
        Type::Id(id) => {
            let info = context.bindgen_type_info(*id);
            type_mode_for_type_info(info, style, lt)
        }

        // Borrowed strings are handled specially here since they're the
        // only list-like primitive.
        Type::String if style != TypeOwnershipStyle::Owned => TypeMode {
            lifetime: Some(lt),
            lists_borrowed: true,
            style,
            type_info: None,
        },

        _ => TypeMode::owned(None),
    }
}

/// Generates the "next" mode for a type.
///
/// The `ty` specified is the type that a mode is being generated for, and
/// the `mode` argument is the "parent" mode that the previous outer layer
/// of type was rendered with. The returned mode should be used to render
/// `ty`.
pub fn filter_mode(context: &GeneratorContext<'_>, ty: &Type, mode: TypeMode) -> TypeMode {
    match mode.lifetime {
        Some(lt) => type_mode_for(context, ty, mode.style.next(), lt),
        None => TypeMode::owned(mode.type_info),
    }
}

/// Same as `filter_mode` except if `mode` has the type `OnlyTopBorrowed`
/// the `mode` is specifically preserved as-is.
///
/// This is used for types like `Option<T>` to render as `Option<&T>`
/// instead of `&Option<T>` for example.
pub fn filter_mode_preserve_top(
    context: &GeneratorContext<'_>,
    ty: &Type,
    mode: TypeMode,
) -> TypeMode {
    if mode.style == TypeOwnershipStyle::OnlyTopBorrowed {
        mode
    } else {
        filter_mode(context, ty, mode)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RustType {
    Bool,
    U8,
    U16,
    U32,
    U64,
    S8,
    S16,
    S32,
    S64,
    F32,
    F64,
    Char,
    ErrorContext,
    Str {
        lifetime: Option<String>,
    },
    String,
    Vec {
        element: Box<RustType>,
    },
    Slice {
        lifetime: Option<String>,
        element: Box<RustType>,
    },
    /// XYZ
    Owned {
        name: String,
    },
    /// &'_ XYZ
    Borrowed {
        name: String,
        lifetime: Option<String>,
    },
    /// &'_ XYZ
    BorrowedResource {
        name: String,
        lifetime: Option<String>,
    },
    /// XYZBorrow<'a>
    ResourceBorrow {
        name: String,
        lifetime: String,
    },
    Tuple {
        items: Vec<RustType>,
    },
    Option {
        inner: Box<RustType>,
    },
    Result {
        ok: Box<RustType>,
        err: Box<RustType>,
    },
    Unit,
}

impl RustType {
    pub fn from_type(context: &GeneratorContext<'_>, ty: &Type, mode: TypeMode) -> Self {
        // If we have a typedef of a string or a list, the typedef is an alias
        // for `String` or `Vec<T>`. If this is a borrow, instead of borrowing
        // them as `&String` or `&Vec<T>`, use `&str` or `&[T]` so that callers
        // don't need to create owned copies.
        if let Type::Id(id) = ty {
            let id = dealias(&context.resolve, *id);
            let typedef = &context.resolve.types[id];
            match &typedef.kind {
                TypeDefKind::Type(Type::String) => {
                    if let Some(lt) = mode.lifetime {
                        return Self::Str {
                            lifetime: if lt == "'_" {
                                None
                            } else {
                                Some(lt.to_string())
                            },
                        };
                    }
                }
                TypeDefKind::List(element) => {
                    if let Some(lt) = mode.lifetime {
                        let next_mode = filter_mode(context, ty, mode);
                        if mode.lists_borrowed {
                            return if lt == "'_" {
                                Self::Slice {
                                    element: Box::new(RustType::from_type(
                                        context, element, next_mode,
                                    )),
                                    lifetime: None,
                                }
                            } else {
                                Self::Slice {
                                    element: Box::new(RustType::from_type(
                                        context, element, next_mode,
                                    )),
                                    lifetime: Some(lt.to_string()),
                                }
                            };
                        } else {
                            return Self::Vec {
                                element: Box::new(RustType::from_type(context, element, next_mode)),
                            };
                        }
                    }
                }
                _ => {}
            }
        }

        match ty {
            Type::Id(type_id) => Self::from_tyid(context, *type_id, mode),
            Type::Bool => Self::Bool,
            Type::U8 => Self::U8,
            Type::U16 => Self::U16,
            Type::U32 => Self::U32,
            Type::U64 => Self::U64,
            Type::S8 => Self::S8,
            Type::S16 => Self::S16,
            Type::S32 => Self::S32,
            Type::S64 => Self::S64,
            Type::F32 => Self::F32,
            Type::F64 => Self::F64,
            Type::Char => Self::Char,
            Type::String => {
                assert_eq!(mode.lists_borrowed, mode.lifetime.is_some());
                match mode.lifetime {
                    Some(lt) if lt == "'_" => Self::Str { lifetime: None },
                    Some(lt) => Self::Str {
                        lifetime: Some(lt.to_string()),
                    },
                    None => Self::String,
                }
            }
            Type::ErrorContext => Self::ErrorContext,
        }
    }

    fn from_tyid(context: &GeneratorContext<'_>, id: TypeId, mode: TypeMode) -> Self {
        let ty = &context.resolve.types[id];
        if ty.name.is_some() && !Self::should_dealias(&ty.kind) {
            // NB: Most of the heavy lifting of `TypeMode` and what to do here
            // has already happened in `type_mode_for*`. Here though a little
            // more happens because this is where `OnlyTopBorrowed` is
            // processed.
            //
            // Specifically what should happen is that in the case of an
            // argument to an imported function if only the top value is
            // borrowed then we want to render it as `&T`. If this all is
            // applicable then the lifetime is rendered here before the type.
            // The `mode` is then switched to `Owned` and recalculated for the
            // type we're rendering here to avoid accidentally giving it a
            // lifetime type parameter when it otherwise doesn't have it.
            let (_mode, lt) = if mode.style == TypeOwnershipStyle::OnlyTopBorrowed {
                if let Some(lt) = mode.lifetime {
                    let info = context.bindgen_type_info(id);
                    (
                        type_mode_for_type_info(info, TypeOwnershipStyle::Owned, lt),
                        mode.lifetime,
                    )
                } else {
                    (mode, None)
                }
            } else {
                (mode, None)
            };
            let name = context.resolve.types[id]
                .name
                .as_ref()
                .unwrap()
                .to_upper_camel_case();
            return match lt {
                None => Self::Owned { name },
                Some(lt) => Self::Borrowed {
                    name,
                    lifetime: if lt == "'_" {
                        None
                    } else {
                        Some(lt.to_string())
                    },
                },
            };
        }

        Self::from_anonymous_type(context, id, mode)
    }

    fn from_optional_type(
        context: &GeneratorContext<'_>,
        ty: Option<&Type>,
        mode: TypeMode,
    ) -> Self {
        match ty {
            Some(ty) => {
                let mode = filter_mode_preserve_top(context, ty, mode);
                Self::from_type(context, ty, mode)
            }
            None => Self::Unit,
        }
    }

    fn from_anonymous_type(context: &GeneratorContext<'_>, id: TypeId, mode: TypeMode) -> Self {
        let ty = &context.resolve.types[id];
        match &ty.kind {
            TypeDefKind::Flags(_)
            | TypeDefKind::Record(_)
            | TypeDefKind::Resource
            | TypeDefKind::Enum(_)
            | TypeDefKind::Variant(_) => {
                unreachable!()
            }
            TypeDefKind::Type(t) => Self::from_type(context, t, mode),
            TypeDefKind::Tuple(tuple) => {
                let mut items = Vec::new();
                for ty in tuple.types.iter() {
                    let inner_mode = filter_mode_preserve_top(context, ty, mode);
                    let rust_typ = Self::from_type(context, ty, inner_mode);
                    items.push(rust_typ)
                }
                Self::Tuple { items }
            }
            TypeDefKind::Option(t) => {
                let inner_mode = filter_mode_preserve_top(context, t, mode);
                let rust_typ = Self::from_type(context, t, inner_mode);
                Self::Option {
                    inner: Box::new(rust_typ),
                }
            }
            TypeDefKind::Result(r) => {
                let ok = Self::from_optional_type(context, r.ok.as_ref(), mode.clone());
                let err = Self::from_optional_type(context, r.err.as_ref(), mode);
                Self::Result {
                    ok: Box::new(ok),
                    err: Box::new(err),
                }
            }
            TypeDefKind::List(t) => {
                let next_mode = filter_mode(context, t, mode);
                if mode.lists_borrowed {
                    let lifetime = mode.lifetime.unwrap();
                    Self::Slice {
                        lifetime: if lifetime == "'_" {
                            None
                        } else {
                            Some(lifetime.to_string())
                        },
                        element: Box::new(RustType::from_type(context, t, next_mode)),
                    }
                } else {
                    Self::Vec {
                        element: Box::new(RustType::from_type(context, t, next_mode)),
                    }
                }
            }
            TypeDefKind::Future(_) => todo!(),
            TypeDefKind::Stream(_) => todo!(),
            TypeDefKind::Handle(handle) => match handle {
                Handle::Own(ty) => Self::from_type(context, &Type::Id(*ty), mode),
                Handle::Borrow(ty) => {
                    assert!(mode.lifetime.is_some());
                    let lt = mode.lifetime.unwrap();
                    if context.is_exported_type(*ty) {
                        let camel = context.resolve.types[*ty]
                            .name
                            .as_deref()
                            .unwrap()
                            .to_upper_camel_case();
                        let name = format!("{camel}Borrow");
                        Self::ResourceBorrow {
                            name,
                            lifetime: lt.to_string(),
                        }
                    } else {
                        let ty = &Type::Id(*ty);
                        let mode = filter_mode(context, ty, mode);
                        let RustType::Owned { name } = Self::from_type(context, ty, mode) else {
                            panic!("Unexpected result for borrowed imported handle type")
                        };
                        Self::BorrowedResource {
                            name,
                            lifetime: if lt == "'_" {
                                None
                            } else {
                                Some(lt.to_string())
                            },
                        }
                    }
                }
            },
            TypeDefKind::FixedSizeList(..) => todo!(),
            TypeDefKind::Unknown => unreachable!(),
        }
    }

    pub fn adjust_export_side(self) -> RustType {
        match self {
            RustType::BorrowedResource { name, .. } => RustType::Owned { name }, // JS native methods use generated BorrowedResource wrappers

            RustType::Vec { element } => {
                let element = element.adjust_export_side();
                RustType::Vec {
                    element: Box::new(element),
                }
            }
            RustType::Slice { element, lifetime } => {
                let element = element.adjust_export_side();
                RustType::Slice {
                    element: Box::new(element),
                    lifetime,
                }
            }
            RustType::Tuple { items } => {
                let items = items
                    .into_iter()
                    .map(|item| item.adjust_export_side())
                    .collect();
                RustType::Tuple { items }
            }
            RustType::Option { inner } => {
                let inner = inner.adjust_export_side();
                RustType::Option {
                    inner: Box::new(inner),
                }
            }
            RustType::Result { ok, err } => {
                let ok = ok.adjust_export_side();
                let err = err.adjust_export_side();
                RustType::Result {
                    ok: Box::new(ok),
                    err: Box::new(err),
                }
            }
            _ => self,
        }
    }

    pub fn conversion_into_type(&self, other: &RustType) -> TokenStreamWrapper {
        match (self, other) {
            (
                RustType::Owned { name: owned_name },
                RustType::Borrowed {
                    name: borrowed_name,
                    ..
                },
            ) if owned_name == borrowed_name => TokenStreamWrapper::reference(),
            (RustType::String, RustType::Str { .. }) => TokenStreamWrapper::as_str(),
            (RustType::Str { .. }, RustType::String) => {
                TokenStreamWrapper::new(|v| quote! { #v.to_string() })
            }
            (
                RustType::Vec {
                    element: vec_element,
                },
                RustType::Slice {
                    element: slice_element,
                    ..
                },
            ) if &*vec_element == &*slice_element => TokenStreamWrapper::as_slice(),
            (
                RustType::Owned { name: owned_name },
                RustType::BorrowedResource {
                    name: borrowed_name,
                    ..
                },
            ) if owned_name == borrowed_name => TokenStreamWrapper::reference(),
            (
                RustType::Owned { name: owned_name },
                RustType::ResourceBorrow {
                    name: borrowed_name,
                    ..
                },
            ) if owned_name == borrowed_name => TokenStreamWrapper::reference(),
            (RustType::Option { inner: from_inner }, RustType::Option { inner: to_inner }) => {
                let conversion = from_inner.conversion_into_type(to_inner);
                match conversion {
                    TokenStreamWrapper::F(_) => {
                        let conversion = conversion.run(quote! { v });
                        TokenStreamWrapper::new(move |ts| {
                            quote! {
                                #ts.map(|v| {
                                    #conversion
                                })
                            }
                        })
                    }
                    TokenStreamWrapper::Ref => TokenStreamWrapper::new(move |ts| {
                        quote! { #ts.as_ref() }
                    }),
                    TokenStreamWrapper::Identity => TokenStreamWrapper::identity(),
                    TokenStreamWrapper::AsStr => TokenStreamWrapper::new(move |ts| {
                        quote! { #ts.as_deref() }
                    }),
                    TokenStreamWrapper::AsSlice => TokenStreamWrapper::new(move |ts| {
                        quote! { #ts.as_deref() }
                    }),
                }
            }
            (
                RustType::Vec {
                    element: from_element,
                },
                RustType::Slice {
                    element: to_element,
                    ..
                },
            ) => {
                let cannot_into_iter = to_element.cannot_into_iter();

                if cannot_into_iter {
                    let adjusted_to_element = to_element.in_iter();
                    println!("elem type: {to_element}"); //  (String, &OutgoingValue)
                    println!("adjusted elem type: {adjusted_to_element}"); //

                    let conversion = adjusted_to_element.conversion_into_type(to_element);
                    match conversion {
                        TokenStreamWrapper::F(_) => {
                            let conversion = conversion.run(quote! { v });
                            TokenStreamWrapper::new(move |ts| {
                                quote! {
                                    #ts.iter().map(|v| {
                                        #conversion
                                    }).collect::<Vec<_>>().as_slice()
                                }
                            })
                        }
                        TokenStreamWrapper::Ref => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.as_slice() }
                        }),
                        TokenStreamWrapper::Identity => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.as_slice() }
                        }),
                        TokenStreamWrapper::AsStr => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.iter().map(|v| v.as_str()).collect::<Vec<_>>().as_slice() }
                        }),
                        TokenStreamWrapper::AsSlice => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.iter().map(|v| v.as_slice()).collect::<Vec<_>>().as_slice() }
                        }),
                    }
                } else {
                    let conversion = from_element.conversion_into_type(to_element);
                    match conversion {
                        TokenStreamWrapper::F(_) => {
                            let conversion = conversion.run(quote! { v });
                            TokenStreamWrapper::new(move |ts| {
                                quote! {
                                    #ts.into_iter().map(|v| {
                                        #conversion
                                    }).collect()
                                }
                            })
                        }
                        TokenStreamWrapper::Ref => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.into_iter().map(|v| &v).collect() }
                        }),
                        TokenStreamWrapper::Identity => TokenStreamWrapper::identity(),
                        TokenStreamWrapper::AsStr => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.into_iter().map(|v| v.as_str()).collect() }
                        }),
                        TokenStreamWrapper::AsSlice => TokenStreamWrapper::new(move |ts| {
                            quote! { #ts.into_iter().map(|v| v.as_slice()).collect() }
                        }),
                    }
                }
            }
            (RustType::Tuple { items: from_items }, RustType::Tuple { items: to_items })
                if to_items.len() == from_items.len() =>
            {
                let mut conversions = Vec::new();
                for (from_item, to_item) in from_items.iter().zip(to_items.iter()) {
                    let conversion = from_item.conversion_into_type(to_item);
                    conversions.push(conversion);
                }
                TokenStreamWrapper::new(move |ts| {
                    let mut converted_items = Vec::new();
                    for (idx, conversion) in conversions.iter().enumerate() {
                        let field = Lit::from(LitInt::new(&idx.to_string(), Span::call_site()));
                        let conversion = conversion.run(quote! { __t.#field });
                        converted_items.push(conversion);
                    }
                    quote! {
                        {
                            let __t = #ts;
                            (#(#converted_items),*)
                        }
                    }
                })
            }
            _ => {
                println!("!: {self}->{other} == {self:?} -> {other:?}");
                TokenStreamWrapper::identity() // Leaving the Rust compiler to fail with a proper error
            }
        }
    }

    pub fn cannot_into_iter(&self) -> bool {
        self.contains(|t| matches!(t, RustType::BorrowedResource { .. }))
    }

    pub fn contains(&self, condition: impl Fn(&RustType) -> bool + Clone) -> bool {
        if condition(self) {
            true
        } else {
            match self {
                RustType::Vec { element } => element.contains(condition),
                RustType::Slice { element, .. } => element.contains(condition),
                RustType::Tuple { items } => {
                    items.iter().any(|item| item.contains(condition.clone()))
                }
                RustType::Option { inner } => inner.contains(condition),
                RustType::Result { ok, err } => {
                    ok.contains(condition.clone()) || err.contains(condition)
                }
                _ => false,
            }
        }
    }

    /// Creates another type representing the reference to this type when used in an iter() of an
    /// outer vec of elements.
    pub fn in_iter(&self) -> RustType {
        // TODO: do we need to introduce a deref wrapper type?
        match self {
            RustType::Bool => self.clone(),
            RustType::U8 => self.clone(),
            RustType::U16 => self.clone(),
            RustType::U32 => self.clone(),
            RustType::U64 => self.clone(),
            RustType::S8 => self.clone(),
            RustType::S16 => self.clone(),
            RustType::S32 => self.clone(),
            RustType::S64 => self.clone(),
            RustType::F32 => self.clone(),
            RustType::F64 => self.clone(),
            RustType::Char => self.clone(),
            RustType::ErrorContext => self.clone(),
            RustType::Str { .. } => self.clone(),
            RustType::String => RustType::Str { lifetime: None },
            RustType::Vec { element, .. } => RustType::Slice {
                element: element.clone(),
                lifetime: None,
            },
            RustType::Slice { .. } => self.clone(),
            RustType::Owned { name } => RustType::Borrowed {
                name: name.clone(),
                lifetime: None,
            },
            RustType::Borrowed { .. } => self.clone(),
            RustType::BorrowedResource { .. } => self.clone(),
            RustType::ResourceBorrow { .. } => self.clone(),
            RustType::Tuple { items } => RustType::Tuple {
                items: items.iter().map(|item| item.in_iter()).collect(),
            },
            RustType::Option { .. } => self.clone(),
            RustType::Result { .. } => self.clone(),
            RustType::Unit => self.clone(),
        }
    }

    fn should_dealias(kind: &TypeDefKind) -> bool {
        // NOTE: this is a difference from wit-bindgen-rust, we want to dealias all type aliases
        match kind {
            TypeDefKind::Record(_)
            | TypeDefKind::Variant(_)
            | TypeDefKind::Enum(_)
            | TypeDefKind::Flags(_)
            | TypeDefKind::Handle(_)
            | TypeDefKind::Resource => false,
            _ => true,
        }
    }
}

// FIX FOR SLICES
// fn poll(
//     in_: Vec<crate::modules::wasi_io_0_2_3_poll::BorrowPollableWrapper>,
// ) -> Vec<u32> {
//     let in_ = in_
//         .iter()  // <--- cannot into_iter() if there is a borrowedresource wrapper in it
//         .map(|v| &v.0)
//         .collect::<Vec<_>>();
//     let result: Vec<u32> = crate::bindings::wasi::io::poll::poll(
//         in_.as_slice(),
//     );
//     result.into_iter().map(|v| v).collect::<Vec<_>>()
// }
//
// works inlined too? in_.iter().map(|v| &v.0).collect::<Vec<_>>().as_slice(),
//
// when doing this, need to flip the whole inner type tree to be able to convert things like &str to String etc

impl Display for RustType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            RustType::Bool => write!(f, "bool"),
            RustType::U8 => write!(f, "u8"),
            RustType::U16 => write!(f, "u16"),
            RustType::U32 => write!(f, "u32"),
            RustType::U64 => write!(f, "u64"),
            RustType::S8 => write!(f, "i8"),
            RustType::S16 => write!(f, "i16"),
            RustType::S32 => write!(f, "i32"),
            RustType::S64 => write!(f, "i64"),
            RustType::F32 => write!(f, "f32"),
            RustType::F64 => write!(f, "f64"),
            RustType::Char => write!(f, "char"),
            RustType::ErrorContext => write!(f, "ErrorContext"),
            RustType::Str { lifetime } => match lifetime {
                Some(lt) => write!(f, "&{} str", lt),
                None => write!(f, "&str"),
            },
            RustType::String => write!(f, "String"),
            RustType::Vec { element } => write!(f, "Vec<{}>", element),
            RustType::Slice { lifetime, element } => match lifetime {
                Some(lt) => write!(f, "&{} [{}]", lt, element),
                None => write!(f, "&[{}]", element),
            },
            RustType::Owned { name } => {
                write!(f, "{}", name)
            }
            RustType::Borrowed { name, lifetime } => match lifetime {
                Some(lt) => write!(f, "&{} {}", lt, name),
                None => write!(f, "&{}", name),
            },
            RustType::BorrowedResource { name, lifetime } => match lifetime {
                Some(lt) => write!(f, "&{} {}", lt, name),
                None => write!(f, "&{}", name),
            },
            RustType::ResourceBorrow { name, lifetime } => {
                write!(f, "&'{} {}", lifetime, name)
            }
            RustType::Tuple { items } => write!(
                f,
                "({})",
                items
                    .iter()
                    .map(|item| item.to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            RustType::Option { inner } => {
                write!(f, "Option<{}>", inner)
            }
            RustType::Result { ok, err } => {
                write!(f, "Result<{}, {}>", ok, err)
            }
            RustType::Unit => write!(f, "()"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct RustFunctionParameter {
    pub name: String,
    pub typ: RustType,
}

impl RustFunctionParameter {
    pub fn for_guest_import(context: &GeneratorContext<'_>, name: &str, ty: &Type) -> Self {
        let name = escape_rust_ident(name);
        let style = TypeOwnershipStyle::OnlyTopBorrowed;
        let mode = type_mode_for(context, ty, style, "'_");
        let typ = RustType::from_type(context, ty, mode);
        Self { name, typ }
    }

    pub fn for_guest_export(context: &GeneratorContext<'_>, name: &str, ty: &Type) -> Self {
        let name = escape_rust_ident(name);
        let style = TypeOwnershipStyle::Owned;
        let mode = type_mode_for(context, ty, style, "'_");
        let typ = RustType::from_type(context, ty, mode).adjust_export_side();
        Self { name, typ }
    }
}

impl Display for RustFunctionParameter {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.name, self.typ)
    }
}

/// Represents the rust bindings for a function imported or exported from a WIT package
#[allow(dead_code)]
pub struct RustWitFunction {
    pub function_name: String,
    pub import_parameters: Vec<RustFunctionParameter>,
    pub export_parameters: Vec<RustFunctionParameter>,
    pub return_type: RustType,
    pub docs: Docs,
}

impl RustWitFunction {
    pub fn new(context: &GeneratorContext<'_>, name: &str, function: &Function) -> Self {
        Self {
            function_name: escape_rust_ident(name),
            import_parameters: function
                .params
                .iter()
                .map(|(param_name, param_type)| {
                    RustFunctionParameter::for_guest_import(context, param_name, param_type)
                })
                .collect(),
            export_parameters: function
                .params
                .iter()
                .map(|(param_name, param_type)| {
                    RustFunctionParameter::for_guest_export(context, param_name, param_type)
                })
                .collect(),
            return_type: if let Some(ty) = &function.result {
                RustType::from_type(
                    context,
                    ty,
                    type_mode_for(context, ty, TypeOwnershipStyle::Owned, "'_"),
                )
            } else {
                RustType::Unit
            },
            docs: function.docs.clone(),
        }
    }

    pub fn function_name_ident(&self) -> Ident {
        Ident::new(&self.function_name, Span::call_site())
    }
}

impl Display for RustWitFunction {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}({})\n{}({})",
            self.function_name,
            self.import_parameters
                .iter()
                .map(|p| p.to_string())
                .collect::<Vec<_>>()
                .join(", "),
            self.function_name,
            self.export_parameters
                .iter()
                .map(|p| p.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        )
    }
}

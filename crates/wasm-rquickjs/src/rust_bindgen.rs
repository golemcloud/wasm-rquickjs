// Code below is copied from wit-bindgen-rust

use crate::GeneratorContext;
use heck::ToSnakeCase;
use wit_bindgen_core::TypeInfo;
use wit_parser::Type;

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
#[derive(Debug, Copy, Clone, PartialEq)]
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
    /// This information is used to determine what mode the next layer deep int
    /// he type tree is rendered with. For example if this layer is owned so is
    /// the next layer. This is primarily used for the "OnlyTopBorrowed"
    /// ownership style where all further layers beneath that are `Owned`.
    pub style: TypeOwnershipStyle,
}

/// The style of ownership of a type, used to initially create a `TypeMode` and
/// stored internally within it as well.
#[derive(Debug, Copy, Clone, PartialEq)]
pub enum TypeOwnershipStyle {
    /// This style means owned things are printed such as `Vec<T>` and `String`.
    ///
    /// Note that this primarily applies to lists.
    Owned,

    /// This style means that lists/strings are `&[T]` and `&str`.
    ///
    /// Note that this primarily applies to lists.
    Borrowed,

    /// This style means that the top-level of a type is borrowed but all other
    /// layers are `Owned`.
    ///
    /// This is used for parameters in the "owning" mode of generation to
    /// imports. It's easy enough to create a `&T` at the root layer but it's
    /// more difficult to create `&T` stored within a `U`, for example.
    OnlyTopBorrowed,
}

impl TypeMode {
    /// Returns a mode where everything is indicated that it's supposed to be
    /// rendered as an "owned" type.
    fn owned() -> TypeMode {
        TypeMode {
            lifetime: None,
            lists_borrowed: false,
            style: TypeOwnershipStyle::Owned,
        }
    }
}

impl TypeOwnershipStyle {
    /// Preserves this mode except for `OnlyTopBorrowed` where it switches it to
    /// `Owned`.
    pub fn next(&self) -> TypeOwnershipStyle {
        match self {
            TypeOwnershipStyle::Owned => TypeOwnershipStyle::Owned,
            TypeOwnershipStyle::Borrowed => TypeOwnershipStyle::Borrowed,
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
        // * This type does not used "two names" meaning that we must use
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
        },

        _ => TypeMode::owned(),
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
        None => TypeMode::owned(),
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

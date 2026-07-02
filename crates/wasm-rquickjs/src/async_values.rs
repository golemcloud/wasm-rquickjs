//! Code generation for WASI Preview 3 `future<T>` / `stream<T>` values at function boundaries.
//!
//! A Component Model `future<T>` is exposed to JavaScript as a `Promise<T>` and a `stream<T>` as
//! an async-iterable; conversely a JS `Promise`/async-iterable is turned back into a component
//! future/stream. These conversions do not fit the generic [`crate::types::WrappedType`] pipeline
//! because:
//!
//! * they are directionally asymmetric — an exported function that *returns* a future must hand a
//!   reader back to the host immediately and keep a writer task running afterwards, so it cannot
//!   reuse `call_js_export` (which awaits and flattens the returned promise); and
//! * lowering a JS value into a component future/stream requires the payload-specialized
//!   `crate::bindings::wit_future::new` / `wit_stream::new` helpers, which are emitted in the
//!   generated crate.
//!
//! So future/stream values are special-cased at the four function boundaries handled here, while
//! the *payload* type still flows through [`crate::types::get_wrapped_type`] for its normal
//! JS ⇄ wit-bindgen conversion.
//!
//! Only a **direct** function parameter or return type may be a future/stream. Nested occurrences
//! (inside a record/option/result/tuple/…) are rejected by [`crate::types::get_wrapped_type`].

use crate::GeneratorContext;
use crate::rust_bindgen::{RustType, TypeOwnershipStyle, type_mode_for};
use crate::types::{TokenStreamWrapper, get_wrapped_type, to_type_ref};
use anyhow::anyhow;
use proc_macro2::TokenStream;
use quote::quote;
use wit_parser::{Type, TypeDefKind};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum AsyncValueKind {
    Future,
    Stream,
}

/// A directly-used `future<T>` / `stream<T>` at a function boundary, with its (optional) payload
/// type. `payload` is `None` for the untyped `future` / `stream` (payload `()`).
#[derive(Clone, Copy)]
pub struct AsyncValue {
    pub kind: AsyncValueKind,
    pub payload: Option<Type>,
}

/// Detects whether `typ`, after following type aliases, is a `future<T>` / `stream<T>`.
///
/// Returns `Ok(None)` for any other type. Aliases are followed so that a direct parameter/return
/// whose type is an alias of `future<…>` / `stream<…>` is still recognized.
pub fn detect(context: &GeneratorContext<'_>, typ: &Type) -> anyhow::Result<Option<AsyncValue>> {
    let mut current = *typ;
    loop {
        match current {
            Type::Id(id) => {
                let typedef = context.typ(id)?;
                match &typedef.kind {
                    TypeDefKind::Future(payload) => {
                        return Ok(Some(AsyncValue {
                            kind: AsyncValueKind::Future,
                            payload: *payload,
                        }));
                    }
                    TypeDefKind::Stream(payload) => {
                        return Ok(Some(AsyncValue {
                            kind: AsyncValueKind::Stream,
                            payload: *payload,
                        }));
                    }
                    TypeDefKind::Type(inner) => {
                        current = *inner;
                    }
                    _ => return Ok(None),
                }
            }
            _ => return Ok(None),
        }
    }
}

/// Ensures future/stream values are only used on the Preview 3 target, which is the only target
/// with a Component Model async ABI.
fn ensure_p3(context: &GeneratorContext<'_>) -> anyhow::Result<()> {
    if context.target.is_p3() {
        Ok(())
    } else {
        Err(anyhow!(
            "future<T> and stream<T> types are only supported by the WASI Preview 3 generation \
             path"
        ))
    }
}

/// The concrete wit-bindgen reader type for this async value, dealiased to the canonical
/// `FutureReader<P>` / `StreamReader<P>`. Using the dealiased concrete type (rather than a WIT
/// alias name) is always valid in the generated `Guest` impl because Rust type aliases are
/// transparent.
pub fn reader_type(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
) -> anyhow::Result<TokenStream> {
    let rt = context.wit_bindgen_rt_path();
    let payload = payload_original_ref(context, async_value)?;
    Ok(match async_value.kind {
        AsyncValueKind::Future => quote! { #rt::async_support::FutureReader<#payload> },
        AsyncValueKind::Stream => quote! { #rt::async_support::StreamReader<#payload> },
    })
}

/// The wit-bindgen Rust type of the payload (`()` for an untyped future/stream).
fn payload_original_ref(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
) -> anyhow::Result<TokenStream> {
    match &async_value.payload {
        Some(payload) => to_type_ref(context, payload),
        None => Ok(quote! { () }),
    }
}

/// The JS-facing (rquickjs) representation of the payload, together with the `wrap`/`unwrap`
/// conversions between it and the wit-bindgen payload type.
struct PayloadBridge {
    /// wit-bindgen payload type (`T` in `FutureReader<T>`).
    original_ref: TokenStream,
    /// rquickjs representation of the payload (implements `IntoJs` + `FromJs`).
    wrapped_ref: TokenStream,
    /// wit-bindgen payload -> rquickjs representation.
    wrap: TokenStreamWrapper,
    /// rquickjs representation -> wit-bindgen payload.
    unwrap: TokenStreamWrapper,
}

fn payload_bridge(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
) -> anyhow::Result<PayloadBridge> {
    match &async_value.payload {
        Some(payload) => {
            // The payload flows by value in both directions, so import and export Rust
            // representations are the same owned type.
            let payload_rust = RustType::from_type(
                context,
                payload,
                type_mode_for(context, payload, TypeOwnershipStyle::Owned, "'_"),
            );
            let wrapped = get_wrapped_type(context, &payload_rust, &payload_rust, payload)?;
            Ok(PayloadBridge {
                original_ref: wrapped.original_type_ref,
                wrapped_ref: wrapped.wrapped_type_ref,
                wrap: wrapped.wrap,
                unwrap: wrapped.unwrap,
            })
        }
        None => Ok(PayloadBridge {
            original_ref: quote! { () },
            wrapped_ref: quote! { () },
            wrap: TokenStreamWrapper::identity(),
            unwrap: TokenStreamWrapper::identity(),
        }),
    }
}

/// Builds an expression that turns the reader expression `reader_expr` (a `FutureReader<P>` /
/// `StreamReader<P>`) into a JS value (a `Promise` / async-iterable). Used for the READ direction:
/// exported-function future/stream parameters and imported-function future/stream return values.
pub fn reader_to_js_expr(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
    reader_expr: TokenStream,
) -> anyhow::Result<TokenStream> {
    ensure_p3(context)?;
    let bridge = payload_bridge(context, async_value)?;
    let original = &bridge.original_ref;
    let wrap_body = bridge.wrap.run(quote! { __payload });
    let ctor = match async_value.kind {
        AsyncValueKind::Future => quote! { crate::internal::FutureReaderIntoJs },
        AsyncValueKind::Stream => quote! { crate::internal::StreamReaderIntoJs },
    };
    Ok(quote! {
        #ctor::new(#reader_expr, |__payload: #original| { #wrap_body })
    })
}

/// Builds a block expression that lowers a persisted JS value (`persisted_expr`, a
/// `rquickjs::Persistent<rquickjs::Value<'static>>` holding a promise / value / async-iterable)
/// into a component `FutureReader<P>` / `StreamReader<P>`, spawning a background writer task that
/// resolves the JS value and writes it into the component future/stream. Used for the WRITE
/// direction: exported-function future/stream return values and imported-function future/stream
/// parameters.
pub fn js_to_reader_expr(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
    persisted_expr: TokenStream,
) -> anyhow::Result<TokenStream> {
    ensure_p3(context)?;
    let bridge = payload_bridge(context, async_value)?;
    let original = &bridge.original_ref;
    let wrapped = &bridge.wrapped_ref;
    let unwrap_body = bridge.unwrap.run(quote! { __wrapped });
    let (new_call, spawn_fn) = match async_value.kind {
        AsyncValueKind::Future => (
            quote! { crate::bindings::wit_future::new(crate::internal::async_value_default::<#original>) },
            quote! { crate::internal::spawn_future_writer },
        ),
        AsyncValueKind::Stream => (
            quote! { crate::bindings::wit_stream::new() },
            quote! { crate::internal::spawn_stream_writer },
        ),
    };
    Ok(quote! {
        {
            let (__writer, __reader) = #new_call;
            #spawn_fn(
                #persisted_expr,
                __writer,
                |__wrapped: #wrapped| -> #original { #unwrap_body },
            );
            __reader
        }
    })
}

/// Like [`js_to_reader_expr`], but builds a component reader whose writer is fed by JS promise
/// `.then` callbacks / a JS async pump (rather than a background task that drives the rquickjs
/// runtime via `async_with!`).
///
/// This is used by the import-side async bridge. Such a bridge returns a deferred promise and
/// spawns a task that awaits the import and settles the promise; while that (and the root exported
/// call) are parked, a writer task that drove the runtime via `async_with!` would clobber the
/// single rquickjs scheduler driver waker and deadlock. The pure lowering
/// (`future_writer_from_js` / `stream_writer_from_js`) resolves and converts the JS payload in
/// ordinary QuickJS jobs and performs the component write in a task that never touches the `Ctx`,
/// so it is safe whether the host consumes the reader during or after the import call. `ctx_expr`
/// must evaluate to the `rquickjs::Ctx` in scope; `value_expr` to the JS `rquickjs::Value` param.
pub fn js_to_reader_pure_expr(
    context: &GeneratorContext<'_>,
    async_value: &AsyncValue,
    ctx_expr: TokenStream,
    value_expr: TokenStream,
) -> anyhow::Result<TokenStream> {
    ensure_p3(context)?;
    let bridge = payload_bridge(context, async_value)?;
    let original = &bridge.original_ref;
    let wrapped = &bridge.wrapped_ref;
    let unwrap_body = bridge.unwrap.run(quote! { __wrapped });
    let (new_call, from_js_fn) = match async_value.kind {
        AsyncValueKind::Future => (
            quote! { crate::bindings::wit_future::new(crate::internal::async_value_default::<#original>) },
            quote! { crate::internal::future_writer_from_js },
        ),
        AsyncValueKind::Stream => (
            quote! { crate::bindings::wit_stream::new() },
            quote! { crate::internal::stream_writer_from_js },
        ),
    };
    Ok(quote! {
        {
            let (__writer, __reader) = #new_call;
            #from_js_fn(
                #ctx_expr,
                #value_expr,
                __writer,
                |__wrapped: #wrapped| -> #original { #unwrap_body },
            )?;
            __reader
        }
    })
}
